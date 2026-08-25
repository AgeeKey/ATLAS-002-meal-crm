import uuid
from datetime import UTC, date, datetime
from enum import StrEnum

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(UTC)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    is_superuser: bool | None = None
    full_name: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore[arg-type]
    )


class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class ClientStatus(StrEnum):
    NEW = "new"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    DEBT = "debt"
    ARCHIVED = "archived"


class PackageMealType(StrEnum):
    THREE_X = "3X"
    FIVE_X = "5X"


class PackageStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"


class ClientBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    phone: str = Field(min_length=1, max_length=50)
    address: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    status: ClientStatus = ClientStatus.NEW
    contact_extra: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=1, max_length=50)
    address: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    status: ClientStatus | None = None
    contact_extra: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class Client(ClientBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore[arg-type]
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore[arg-type]
        sa_column_kwargs={"onupdate": get_datetime_utc},
    )
    packages: list[Package] = Relationship(back_populates="client", cascade_delete=True)
    client_notes: list[Note] = Relationship(back_populates="client", cascade_delete=True)


class ClientPublic(ClientBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ClientsPublic(SQLModel):
    data: list[ClientPublic]
    count: int


class PackageBase(SQLModel):
    meal_type: PackageMealType
    total_days: int = Field(ge=1)
    start_date: date
    end_date: date | None = None
    price: int = Field(ge=0)
    paid_amount: int = Field(default=0, ge=0)
    status: PackageStatus = PackageStatus.ACTIVE


class PackageCreate(PackageBase):
    client_id: uuid.UUID


class PackageUpdate(SQLModel):
    meal_type: PackageMealType | None = None
    total_days: int | None = Field(default=None, ge=1)
    start_date: date | None = None
    end_date: date | None = None
    price: int | None = Field(default=None, ge=0)
    status: PackageStatus | None = None


class Package(PackageBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    client_id: uuid.UUID = Field(foreign_key="client.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore[arg-type]
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore[arg-type]
        sa_column_kwargs={"onupdate": get_datetime_utc},
    )
    client: Client | None = Relationship(back_populates="packages")
    payments: list[Payment] = Relationship(back_populates="package", cascade_delete=True)
    freezes: list[Freeze] = Relationship(back_populates="package", cascade_delete=True)
    deliveries: list[Delivery] = Relationship(back_populates="package", cascade_delete=True)
    extensions: list[Extension] = Relationship(back_populates="package", cascade_delete=True)


class PackagePublic(PackageBase):
    id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deliveries_count: int = 0
    freeze_days: int = 0
    extension_days: int = 0
    days_used: int = 0
    days_remaining: int = 0
    debt: int = 0


class PackagesPublic(SQLModel):
    data: list[PackagePublic]
    count: int


class PaymentBase(SQLModel):
    amount: int = Field(ge=1)
    date: date
    comment: str | None = Field(default=None, max_length=255)


class PaymentCreate(PaymentBase):
    package_id: uuid.UUID


class Payment(PaymentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    package_id: uuid.UUID = Field(foreign_key="package.id", nullable=False, ondelete="CASCADE")
    package: Package | None = Relationship(back_populates="payments")


class PaymentPublic(PaymentBase):
    id: uuid.UUID
    package_id: uuid.UUID


class PaymentsPublic(SQLModel):
    data: list[PaymentPublic]
    count: int


class FreezeBase(SQLModel):
    start_date: date
    end_date: date
    reason: str | None = Field(default=None, max_length=255)


class FreezeCreate(FreezeBase):
    pass


class Freeze(FreezeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    package_id: uuid.UUID = Field(foreign_key="package.id", nullable=False, ondelete="CASCADE")
    package: Package | None = Relationship(back_populates="freezes")


class FreezePublic(FreezeBase):
    id: uuid.UUID
    package_id: uuid.UUID


class DeliveryBase(SQLModel):
    scheduled_date: date
    sent_date: date | None = None


class DeliveryCreate(DeliveryBase):
    pass


class Delivery(DeliveryBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    package_id: uuid.UUID = Field(foreign_key="package.id", nullable=False, ondelete="CASCADE")
    package: Package | None = Relationship(back_populates="deliveries")


class DeliveryPublic(DeliveryBase):
    id: uuid.UUID
    package_id: uuid.UUID


class ExtensionBase(SQLModel):
    extra_days: int = Field(ge=1)
    date: date
    reason: str | None = Field(default=None, max_length=255)


class ExtensionCreate(ExtensionBase):
    pass


class Extension(ExtensionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    package_id: uuid.UUID = Field(foreign_key="package.id", nullable=False, ondelete="CASCADE")
    package: Package | None = Relationship(back_populates="extensions")


class ExtensionPublic(ExtensionBase):
    id: uuid.UUID
    package_id: uuid.UUID


class NoteBase(SQLModel):
    text: str = Field(min_length=1)


class NoteCreate(NoteBase):
    pass


class Note(NoteBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    client_id: uuid.UUID = Field(foreign_key="client.id", nullable=False, ondelete="CASCADE")
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore[arg-type]
    )
    client: Client | None = Relationship(back_populates="client_notes")


class NotePublic(NoteBase):
    id: uuid.UUID
    client_id: uuid.UUID
    created_at: datetime


class DailyDeliveryCount(SQLModel):
    date: date
    count: int


class DeliveriesPublic(SQLModel):
    data: list[DeliveryPublic]
    count: int


class FreezesPublic(SQLModel):
    data: list[FreezePublic]
    count: int


class ExtensionsPublic(SQLModel):
    data: list[ExtensionPublic]
    count: int


class PackageDetail(PackagePublic):
    deliveries: list[DeliveryPublic] = []
    freezes: list[FreezePublic] = []
    extensions: list[ExtensionPublic] = []
    payments: list[PaymentPublic] = []


class ClientDetail(ClientPublic):
    packages: list[PackageDetail] = []
    client_notes: list[NotePublic] = []


class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
