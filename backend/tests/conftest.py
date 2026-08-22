from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.api.deps import get_db
from app.core.db import init_db
from app.main import app

sqlite_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session]:
    SQLModel.metadata.create_all(sqlite_engine)
    with Session(sqlite_engine) as session:
        init_db(session)
        yield session
    SQLModel.metadata.drop_all(sqlite_engine)


@pytest.fixture(scope="module")
def client(db: Session) -> Generator[TestClient]:
    def override_get_db() -> Generator[Session]:
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    from tests.utils.utils import get_superuser_token_headers

    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    from app.core.config import settings
    from tests.utils.user import authentication_token_from_email

    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
