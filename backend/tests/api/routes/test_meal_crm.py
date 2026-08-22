from fastapi.testclient import TestClient

from app.core.config import settings


def test_meal_crm_mvp_flow(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    client_payload = {
        "name": "Ivan Ivanov",
        "phone": "+996700000001",
        "status": "new",
        "address": "Bishkek",
    }
    response = client.post(
        f"{settings.API_V1_STR}/clients/",
        headers=superuser_token_headers,
        json=client_payload,
    )
    assert response.status_code == 200
    client_data = response.json()
    client_id = client_data["id"]

    package_payload = {
        "client_id": client_id,
        "meal_type": "3X",
        "total_days": 5,
        "start_date": "2026-01-01",
        "price": 30000,
        "status": "active",
    }
    response = client.post(
        f"{settings.API_V1_STR}/packages/",
        headers=superuser_token_headers,
        json=package_payload,
    )
    assert response.status_code == 200
    package_data = response.json()
    package_id = package_data["id"]
    assert package_data["days_remaining"] == 5
    assert package_data["debt"] == 30000

    response = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-01-02", "sent_date": "2026-01-02"},
    )
    assert response.status_code == 200

    response = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-01-03", "sent_date": None},
    )
    assert response.status_code == 200

    response = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/freezes",
        headers=superuser_token_headers,
        json={"start_date": "2026-01-04", "end_date": "2026-01-05", "reason": "travel"},
    )
    assert response.status_code == 200

    response = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/extensions",
        headers=superuser_token_headers,
        json={"extra_days": 2, "date": "2026-01-06", "reason": "bonus"},
    )
    assert response.status_code == 200

    response = client.post(
        f"{settings.API_V1_STR}/payments/",
        headers=superuser_token_headers,
        json={"package_id": package_id, "amount": 10000, "date": "2026-01-02"},
    )
    assert response.status_code == 200

    response = client.post(
        f"{settings.API_V1_STR}/payments/",
        headers=superuser_token_headers,
        json={"package_id": package_id, "amount": 5000, "date": "2026-01-03"},
    )
    assert response.status_code == 200

    response = client.get(
        f"{settings.API_V1_STR}/packages/{package_id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    package_details = response.json()
    assert package_details["deliveries_count"] == 1
    assert package_details["days_used"] == 1
    assert package_details["extension_days"] == 2
    assert package_details["freeze_days"] == 2
    assert package_details["days_remaining"] == 6
    assert package_details["paid_amount"] == 15000
    assert package_details["debt"] == 15000

    response = client.get(
        f"{settings.API_V1_STR}/packages/{package_id}/payments",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    payments = response.json()
    assert payments["count"] == 2

    response = client.post(
        f"{settings.API_V1_STR}/clients/{client_id}/notes",
        headers=superuser_token_headers,
        json={"text": "VIP client"},
    )
    assert response.status_code == 200

    response = client.get(
        f"{settings.API_V1_STR}/clients/{client_id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    client_details = response.json()
    assert client_details["id"] == client_id
    assert len(client_details["packages"]) == 1
    assert len(client_details["client_notes"]) == 1


def test_package_completion_logic(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_V1_STR}/clients/",
        headers=superuser_token_headers,
        json={"name": "Aigul", "phone": "+996700000002", "status": "active"},
    )
    assert response.status_code == 200
    client_id = response.json()["id"]

    response = client.post(
        f"{settings.API_V1_STR}/packages/",
        headers=superuser_token_headers,
        json={
            "client_id": client_id,
            "meal_type": "5X",
            "total_days": 1,
            "start_date": "2026-02-01",
            "price": 1000,
            "status": "active",
        },
    )
    assert response.status_code == 200
    package_id = response.json()["id"]

    response = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-02-01", "sent_date": "2026-02-01"},
    )
    assert response.status_code == 200

    response = client.get(
        f"{settings.API_V1_STR}/packages/{package_id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    package_details = response.json()
    assert package_details["days_remaining"] == 0
    assert package_details["status"] == "completed"
