import uuid
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Client,
    ClientCreate,
    ClientDetail,
    ClientPublic,
    ClientsPublic,
    ClientUpdate,
    Delivery,
    DeliveryPublic,
    Extension,
    ExtensionPublic,
    Freeze,
    FreezePublic,
    Note,
    NoteCreate,
    NotePublic,
    Package,
    PackageDetail,
    PackagePublic,
    Payment,
    PaymentPublic,
)
from app.services.package_metrics import calculate_package_metrics

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("/", response_model=ClientPublic)
def create_client(
    *, session: SessionDep, current_user: CurrentUser, client_in: ClientCreate
) -> Any:
    del current_user
    existing = session.exec(select(Client).where(Client.phone == client_in.phone)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Client with this phone already exists")
    client = Client.model_validate(client_in)
    session.add(client)
    session.commit()
    session.refresh(client)
    return client


@router.get("/", response_model=ClientsPublic)
def read_clients(
    session: SessionDep,
    current_user: CurrentUser,
    status: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    del current_user
    statement = select(Client)
    count_statement = select(func.count()).select_from(Client)
    if status:
        statement = statement.where(Client.status == status)
        count_statement = count_statement.where(Client.status == status)

    count = session.exec(count_statement).one()
    clients = session.exec(
        statement.order_by(col(Client.created_at).desc()).offset(skip).limit(limit)
    ).all()
    return ClientsPublic(data=[ClientPublic.model_validate(client) for client in clients], count=count)


@router.get("/{id}", response_model=ClientDetail)
def read_client(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    del current_user
    client = session.get(Client, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    packages = session.exec(select(Package).where(Package.client_id == client.id)).all()
    package_ids = [pkg.id for pkg in packages]

    # Bulk-load all related records in 4 queries instead of 4N
    all_deliveries = (
        session.exec(select(Delivery).where(col(Delivery.package_id).in_(package_ids))).all()
        if package_ids else []
    )
    all_freezes = (
        session.exec(select(Freeze).where(col(Freeze.package_id).in_(package_ids))).all()
        if package_ids else []
    )
    all_extensions = (
        session.exec(select(Extension).where(col(Extension.package_id).in_(package_ids))).all()
        if package_ids else []
    )
    all_payments = (
        session.exec(select(Payment).where(col(Payment.package_id).in_(package_ids))).all()
        if package_ids else []
    )

    deliveries_by_pkg: dict[uuid.UUID, list[Delivery]] = defaultdict(list)
    for d in all_deliveries:
        deliveries_by_pkg[d.package_id].append(d)
    freezes_by_pkg: dict[uuid.UUID, list[Freeze]] = defaultdict(list)
    for f in all_freezes:
        freezes_by_pkg[f.package_id].append(f)
    extensions_by_pkg: dict[uuid.UUID, list[Extension]] = defaultdict(list)
    for e in all_extensions:
        extensions_by_pkg[e.package_id].append(e)
    payments_by_pkg: dict[uuid.UUID, list[Payment]] = defaultdict(list)
    for p in all_payments:
        payments_by_pkg[p.package_id].append(p)

    packages_detail: list[PackageDetail] = []
    for package in packages:
        metrics = calculate_package_metrics(package)
        packages_detail.append(
            PackageDetail.model_validate(
                package,
                update={
                    **metrics,
                    "deliveries": [DeliveryPublic.model_validate(d) for d in deliveries_by_pkg[package.id]],
                    "freezes": [FreezePublic.model_validate(f) for f in freezes_by_pkg[package.id]],
                    "extensions": [ExtensionPublic.model_validate(e) for e in extensions_by_pkg[package.id]],
                    "payments": [PaymentPublic.model_validate(p) for p in payments_by_pkg[package.id]],
                },
            )
        )

    notes = session.exec(select(Note).where(Note.client_id == client.id)).all()
    return ClientDetail.model_validate(
        client,
        update={
            "packages": packages_detail,
            "client_notes": [NotePublic.model_validate(note) for note in notes],
        },
    )


@router.patch("/{id}", response_model=ClientPublic)
def update_client(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    client_in: ClientUpdate,
) -> Any:
    del current_user
    client = session.get(Client, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = client_in.model_dump(exclude_unset=True)
    if "phone" in update_data:
        existing = session.exec(
            select(Client).where(Client.phone == update_data["phone"], Client.id != id)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Client with this phone already exists")
    client.sqlmodel_update(update_data)
    session.add(client)
    session.commit()
    session.refresh(client)
    return client


@router.post("/{id}/notes", response_model=NotePublic)
def create_client_note(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    note_in: NoteCreate,
) -> Any:
    del current_user
    client = session.get(Client, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    note = Note.model_validate(note_in, update={"client_id": id})
    session.add(note)
    session.commit()
    session.refresh(note)
    return note
