import uuid
from datetime import date, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Client,
    DailyDeliveryCount,
    Delivery,
    DeliveriesPublic,
    DeliveryCreate,
    DeliveryPublic,
    Extension,
    ExtensionCreate,
    ExtensionPublic,
    ExtensionsPublic,
    Freeze,
    FreezeCreate,
    FreezePublic,
    FreezesPublic,
    Package,
    PackageCreate,
    PackagePublic,
    PackagesPublic,
    PackageUpdate,
    Payment,
    PaymentPublic,
    PaymentsPublic,
)
from app.services.package_metrics import (
    calculate_package_metrics,
    sync_package_derived_fields,
)

router = APIRouter(prefix="/packages", tags=["packages"])


def get_package_or_404(session: SessionDep, package_id: uuid.UUID) -> Package:
    package = session.get(Package, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


@router.post("/", response_model=PackagePublic)
def create_package(
    *, session: SessionDep, current_user: CurrentUser, package_in: PackageCreate
) -> Any:
    del current_user
    client = session.get(Client, package_in.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    package = Package.model_validate(package_in)
    metrics = sync_package_derived_fields(package)
    session.add(package)
    session.commit()
    session.refresh(package)
    return PackagePublic.model_validate(package, update=metrics)


@router.get("/deliveries/today", response_model=DailyDeliveryCount)
def get_todays_delivery_count(
    session: SessionDep, current_user: CurrentUser
) -> Any:
    del current_user
    today = date.today()
    count = session.exec(
        select(func.count()).select_from(Delivery).where(Delivery.scheduled_date == today)
    ).one()
    return DailyDeliveryCount(date=today, count=count)


@router.get("/", response_model=PackagesPublic)
def read_packages(
    session: SessionDep,
    current_user: CurrentUser,
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    del current_user
    statement = select(Package)
    count_statement = select(func.count()).select_from(Package)
    if status:
        statement = statement.where(Package.status == status)
        count_statement = count_statement.where(Package.status == status)

    count = session.exec(count_statement).one()
    packages = session.exec(
        statement.order_by(col(Package.created_at).desc()).offset(skip).limit(limit)
    ).all()

    packages_public: list[PackagePublic] = []
    for package in packages:
        metrics = calculate_package_metrics(package)
        packages_public.append(PackagePublic.model_validate(package, update=metrics))

    return PackagesPublic(data=packages_public, count=count)


@router.get("/{id}", response_model=PackagePublic)
def read_package(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    del current_user
    package = get_package_or_404(session, id)
    metrics = calculate_package_metrics(package)
    return PackagePublic.model_validate(package, update=metrics)


@router.patch("/{id}", response_model=PackagePublic)
def update_package(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    package_in: PackageUpdate,
) -> Any:
    del current_user
    package = get_package_or_404(session, id)

    # Prevent manually completing a package that still has remaining days
    if package_in.status == "completed":
        metrics = calculate_package_metrics(package)
        if metrics["days_remaining"] > 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot mark package as completed: {metrics['days_remaining']} service day(s) remain. "
                    "Use deliveries to consume remaining days."
                ),
            )

    package.sqlmodel_update(package_in.model_dump(exclude_unset=True))
    metrics = sync_package_derived_fields(package)
    session.add(package)
    session.commit()
    session.refresh(package)
    return PackagePublic.model_validate(package, update=metrics)


@router.post("/{id}/deliveries", response_model=DeliveryPublic)
def create_delivery(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    delivery_in: DeliveryCreate,
) -> Any:
    del current_user
    package = get_package_or_404(session, id)

    # Validate send date = meal date - 1 day
    if delivery_in.sent_date is not None:
        expected_sent_date = delivery_in.scheduled_date - timedelta(days=1)
        if delivery_in.sent_date != expected_sent_date:
            raise HTTPException(
                status_code=400,
                detail="sent_date (send / package day) must be exactly one day before scheduled_date (meal date)",
            )
    else:
        # Derive sent_date automatically
        delivery_in = DeliveryCreate(
            scheduled_date=delivery_in.scheduled_date,
            sent_date=delivery_in.scheduled_date - timedelta(days=1),
        )

    sent_date = delivery_in.sent_date
    # Reject duplicate sent_date for same package
    existing = session.exec(
        select(Delivery).where(
            Delivery.package_id == id,
            Delivery.sent_date == sent_date,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A delivery with this send date already exists for this package",
        )

    # Reject if no remaining days
    metrics = calculate_package_metrics(package)
    if metrics["days_remaining"] == 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot add delivery: package has no remaining service days",
        )

    delivery = Delivery.model_validate(delivery_in, update={"package_id": id})
    session.add(delivery)
    session.flush()
    session.refresh(package)
    sync_package_derived_fields(package)
    session.add(package)
    session.commit()
    session.refresh(delivery)
    return delivery


@router.post("/{id}/freezes", response_model=FreezePublic)
def create_freeze(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    freeze_in: FreezeCreate,
) -> Any:
    del current_user
    package = get_package_or_404(session, id)
    if freeze_in.end_date < freeze_in.start_date:
        raise HTTPException(status_code=400, detail="end_date must be on or after start_date")

    # Reject overlapping freezes
    existing_freezes = session.exec(
        select(Freeze).where(Freeze.package_id == id)
    ).all()
    for existing in existing_freezes:
        if freeze_in.start_date <= existing.end_date and freeze_in.end_date >= existing.start_date:
            raise HTTPException(
                status_code=400,
                detail=f"Freeze period overlaps with an existing freeze ({existing.start_date} – {existing.end_date})",
            )

    freeze = Freeze.model_validate(freeze_in, update={"package_id": id})
    session.add(freeze)
    session.flush()
    session.refresh(package)
    sync_package_derived_fields(package)
    session.add(package)
    session.commit()
    session.refresh(freeze)
    return freeze


@router.post("/{id}/extensions", response_model=ExtensionPublic)
def create_extension(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    extension_in: ExtensionCreate,
) -> Any:
    del current_user
    package = get_package_or_404(session, id)
    extension = Extension.model_validate(extension_in, update={"package_id": id})
    session.add(extension)
    session.flush()
    session.refresh(package)
    sync_package_derived_fields(package)
    session.add(package)
    session.commit()
    session.refresh(extension)
    return extension


@router.get("/{id}/payments", response_model=PaymentsPublic)
def read_package_payments(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    del current_user
    package = get_package_or_404(session, id)
    payments = session.exec(select(Payment).where(Payment.package_id == package.id)).all()
    return PaymentsPublic(
        data=[PaymentPublic.model_validate(payment) for payment in payments],
        count=len(payments),
    )


@router.get("/{id}/deliveries", response_model=DeliveriesPublic)
def read_package_deliveries(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    del current_user
    package = get_package_or_404(session, id)
    deliveries = session.exec(
        select(Delivery)
        .where(Delivery.package_id == package.id)
        .order_by(col(Delivery.scheduled_date).desc())
    ).all()
    return DeliveriesPublic(
        data=[DeliveryPublic.model_validate(d) for d in deliveries],
        count=len(deliveries),
    )


@router.get("/{id}/freezes", response_model=FreezesPublic)
def read_package_freezes(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    del current_user
    package = get_package_or_404(session, id)
    freezes = session.exec(
        select(Freeze)
        .where(Freeze.package_id == package.id)
        .order_by(col(Freeze.start_date).desc())
    ).all()
    return FreezesPublic(
        data=[FreezePublic.model_validate(f) for f in freezes],
        count=len(freezes),
    )


@router.get("/{id}/extensions", response_model=ExtensionsPublic)
def read_package_extensions(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    del current_user
    package = get_package_or_404(session, id)
    extensions = session.exec(
        select(Extension)
        .where(Extension.package_id == package.id)
        .order_by(col(Extension.date).desc())
    ).all()
    return ExtensionsPublic(
        data=[ExtensionPublic.model_validate(e) for e in extensions],
        count=len(extensions),
    )
