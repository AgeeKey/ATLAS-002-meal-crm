import uuid
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
    packages_detail: list[PackageDetail] = []
    for package in packages:
        metrics = calculate_package_metrics(package)
        deliveries = session.exec(select(Delivery).where(Delivery.package_id == package.id)).all()
        freezes = session.exec(select(Freeze).where(Freeze.package_id == package.id)).all()
        extensions = session.exec(select(Extension).where(Extension.package_id == package.id)).all()
        payments = session.exec(select(Payment).where(Payment.package_id == package.id)).all()
        packages_detail.append(
            PackageDetail.model_validate(
                package,
                update={
                    **metrics,
                    "deliveries": [DeliveryPublic.model_validate(d) for d in deliveries],
                    "freezes": [FreezePublic.model_validate(f) for f in freezes],
                    "extensions": [ExtensionPublic.model_validate(e) for e in extensions],
                    "payments": [PaymentPublic.model_validate(p) for p in payments],
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
