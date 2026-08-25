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
        json={"scheduled_date": "2026-01-02", "sent_date": "2026-01-01"},
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
        json={"scheduled_date": "2026-02-02", "sent_date": "2026-02-01"},
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


def test_read_package_deliveries_freezes_extensions(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """GET endpoints for package deliveries, freezes, extensions return persisted history."""
    response = client.post(
        f"{settings.API_V1_STR}/clients/",
        headers=superuser_token_headers,
        json={"name": "Beks", "phone": "+996700000010", "status": "active"},
    )
    assert response.status_code == 200
    client_id = response.json()["id"]

    response = client.post(
        f"{settings.API_V1_STR}/packages/",
        headers=superuser_token_headers,
        json={
            "client_id": client_id,
            "meal_type": "3X",
            "total_days": 10,
            "start_date": "2026-03-01",
            "price": 5000,
            "status": "active",
        },
    )
    assert response.status_code == 200
    package_id = response.json()["id"]

    # Create delivery
    dr = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-03-02", "sent_date": "2026-03-01"},
    )
    assert dr.status_code == 200

    # Create freeze
    fr = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/freezes",
        headers=superuser_token_headers,
        json={"start_date": "2026-03-05", "end_date": "2026-03-07"},
    )
    assert fr.status_code == 200

    # Create extension
    er = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/extensions",
        headers=superuser_token_headers,
        json={"extra_days": 3, "date": "2026-03-10"},
    )
    assert er.status_code == 200

    # GET /packages/{id}/deliveries
    response = client.get(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["data"][0]["scheduled_date"] == "2026-03-02"

    # GET /packages/{id}/freezes
    response = client.get(
        f"{settings.API_V1_STR}/packages/{package_id}/freezes",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["data"][0]["start_date"] == "2026-03-05"

    # GET /packages/{id}/extensions
    response = client.get(
        f"{settings.API_V1_STR}/packages/{package_id}/extensions",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["data"][0]["extra_days"] == 3

    # GET /clients/{id} returns PackageDetail with embedded history
    response = client.get(
        f"{settings.API_V1_STR}/clients/{client_id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    client_detail = response.json()
    pkg = client_detail["packages"][0]
    assert len(pkg["deliveries"]) == 1
    assert len(pkg["freezes"]) == 1
    assert len(pkg["extensions"]) == 1
    assert pkg["deliveries"][0]["scheduled_date"] == "2026-03-02"
    assert pkg["freezes"][0]["start_date"] == "2026-03-05"
    assert pkg["extensions"][0]["extra_days"] == 3


def test_todays_delivery_count_endpoint(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    """GET /packages/deliveries/today returns the correct count for today's deliveries."""
    from datetime import date

    today_str = date.today().isoformat()

    response = client.get(
        f"{settings.API_V1_STR}/packages/deliveries/today",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == today_str
    assert isinstance(data["count"], int)
    assert data["count"] >= 0

    # Create a package and add a delivery for today; count should increase by 1
    cr = client.post(
        f"{settings.API_V1_STR}/clients/",
        headers=superuser_token_headers,
        json={"name": "Nura", "phone": "+996700000020", "status": "active"},
    )
    assert cr.status_code == 200
    client_id = cr.json()["id"]

    pr = client.post(
        f"{settings.API_V1_STR}/packages/",
        headers=superuser_token_headers,
        json={
            "client_id": client_id,
            "meal_type": "5X",
            "total_days": 10,
            "start_date": today_str,
            "price": 5000,
            "status": "active",
        },
    )
    assert pr.status_code == 200
    package_id = pr.json()["id"]

    ddr = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": today_str},
    )
    assert ddr.status_code == 200

    response2 = client.get(
        f"{settings.API_V1_STR}/packages/deliveries/today",
        headers=superuser_token_headers,
    )
    assert response2.status_code == 200
    assert response2.json()["count"] == data["count"] + 1


def _create_test_client(client, superuser_token_headers, name, phone, status="active"):
    response = client.post(
        f"{settings.API_V1_STR}/clients/",
        headers=superuser_token_headers,
        json={"name": name, "phone": phone, "status": status},
    )
    assert response.status_code == 200
    return response.json()["id"]


def _create_test_package(client, superuser_token_headers, client_id, total_days, price, meal_type="3X", start_date="2026-06-01"):
    response = client.post(
        f"{settings.API_V1_STR}/packages/",
        headers=superuser_token_headers,
        json={
            "client_id": client_id,
            "meal_type": meal_type,
            "total_days": total_days,
            "start_date": start_date,
            "price": price,
            "status": "active",
        },
    )
    assert response.status_code == 200
    return response.json()["id"]


def test_extension_added_price_total_obligation(
    client, superuser_token_headers
) -> None:
    """Extension: 11,000 original + 19,000 extension = 30,000 obligation; partial payment leaves correct debt."""
    client_id = _create_test_client(client, superuser_token_headers, "Aizat", "+996700000030")
    package_id = _create_test_package(client, superuser_token_headers, client_id, total_days=10, price=11000)

    # Add extension with added_price = 19,000
    ext_resp = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/extensions",
        headers=superuser_token_headers,
        json={"extra_days": 20, "added_price": 19000, "date": "2026-06-02", "reason": "upgrade to monthly"},
    )
    assert ext_resp.status_code == 200
    assert ext_resp.json()["added_price"] == 19000

    # Pay 10,000
    client.post(
        f"{settings.API_V1_STR}/payments/",
        headers=superuser_token_headers,
        json={"package_id": package_id, "amount": 10000, "date": "2026-06-02"},
    )

    # Verify: total obligation = 11,000 + 19,000 = 30,000; paid = 10,000; debt = 20,000
    pkg_resp = client.get(
        f"{settings.API_V1_STR}/packages/{package_id}",
        headers=superuser_token_headers,
    )
    assert pkg_resp.status_code == 200
    data = pkg_resp.json()
    assert data["extension_added_price"] == 19000
    assert data["paid_amount"] == 10000
    assert data["debt"] == 20000  # 30,000 - 10,000

    # Full payment clears debt
    client.post(
        f"{settings.API_V1_STR}/payments/",
        headers=superuser_token_headers,
        json={"package_id": package_id, "amount": 20000, "date": "2026-06-03"},
    )
    pkg_resp2 = client.get(
        f"{settings.API_V1_STR}/packages/{package_id}",
        headers=superuser_token_headers,
    )
    assert pkg_resp2.json()["debt"] == 0


def test_delivery_sent_date_must_be_day_before_meal_date(
    client, superuser_token_headers
) -> None:
    """Reject delivery where sent_date != scheduled_date - 1 day."""
    client_id = _create_test_client(client, superuser_token_headers, "Bakyt", "+996700000031")
    package_id = _create_test_package(client, superuser_token_headers, client_id, total_days=5, price=5000)

    # Invalid: sent_date == scheduled_date (same day)
    bad_resp = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-06-05", "sent_date": "2026-06-05"},
    )
    assert bad_resp.status_code == 400

    # Valid: sent_date = scheduled_date - 1
    ok_resp = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-06-05", "sent_date": "2026-06-04"},
    )
    assert ok_resp.status_code == 200

    # Delivery with no sent_date auto-derives it
    ok2 = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-06-06"},
    )
    assert ok2.status_code == 200
    assert ok2.json()["sent_date"] == "2026-06-05"


def test_delivery_no_duplicate_sent_date(
    client, superuser_token_headers
) -> None:
    """Reject duplicate sent_date for same package."""
    client_id = _create_test_client(client, superuser_token_headers, "Cholpon", "+996700000032")
    package_id = _create_test_package(client, superuser_token_headers, client_id, total_days=5, price=5000)

    client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-06-05", "sent_date": "2026-06-04"},
    )
    dup = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-06-06", "sent_date": "2026-06-04"},
    )
    assert dup.status_code == 400


def test_delivery_rejected_when_no_remaining_days(
    client, superuser_token_headers
) -> None:
    """Cannot add delivery to a fully-consumed package."""
    client_id = _create_test_client(client, superuser_token_headers, "Daniyar", "+996700000033")
    package_id = _create_test_package(client, superuser_token_headers, client_id, total_days=1, price=1000)

    # Consume the 1 day
    client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-06-05", "sent_date": "2026-06-04"},
    )
    # Second delivery must be rejected
    extra = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-06-06", "sent_date": "2026-06-05"},
    )
    assert extra.status_code == 400


def test_freeze_overlap_rejected(
    client, superuser_token_headers
) -> None:
    """Overlapping freeze periods are rejected."""
    client_id = _create_test_client(client, superuser_token_headers, "Elmira", "+996700000034")
    package_id = _create_test_package(client, superuser_token_headers, client_id, total_days=10, price=5000)

    # First freeze: June 5–10
    r1 = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/freezes",
        headers=superuser_token_headers,
        json={"start_date": "2026-06-05", "end_date": "2026-06-10"},
    )
    assert r1.status_code == 200

    # Overlapping freeze: June 8–12 → must be rejected
    r2 = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/freezes",
        headers=superuser_token_headers,
        json={"start_date": "2026-06-08", "end_date": "2026-06-12"},
    )
    assert r2.status_code == 400

    # Adjacent freeze (not overlapping): June 11–15 → must succeed
    r3 = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/freezes",
        headers=superuser_token_headers,
        json={"start_date": "2026-06-11", "end_date": "2026-06-15"},
    )
    assert r3.status_code == 200


def test_package_status_cannot_be_manually_completed_with_remaining_days(
    client, superuser_token_headers
) -> None:
    """PATCH /packages/{id} must reject status=completed when days_remaining > 0."""
    client_id = _create_test_client(client, superuser_token_headers, "Farida", "+996700000035")
    package_id = _create_test_package(client, superuser_token_headers, client_id, total_days=5, price=5000)

    bad = client.patch(
        f"{settings.API_V1_STR}/packages/{package_id}",
        headers=superuser_token_headers,
        json={"status": "completed"},
    )
    assert bad.status_code == 400

    # Pause is still allowed
    ok = client.patch(
        f"{settings.API_V1_STR}/packages/{package_id}",
        headers=superuser_token_headers,
        json={"status": "paused"},
    )
    assert ok.status_code == 200


def test_completed_package_rejects_new_delivery(
    client, superuser_token_headers
) -> None:
    """A package that reached days_remaining=0 (auto-completed) blocks further deliveries."""
    client_id = _create_test_client(client, superuser_token_headers, "Gulnara", "+996700000036")
    package_id = _create_test_package(client, superuser_token_headers, client_id, total_days=1, price=1000)

    # Consume the only day
    client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-06-02", "sent_date": "2026-06-01"},
    )

    # Package should now be completed; extra delivery rejected
    extra = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-06-03", "sent_date": "2026-06-02"},
    )
    assert extra.status_code == 400

    # Package status is completed and remains in history
    detail = client.get(
        f"{settings.API_V1_STR}/clients/{client_id}",
        headers=superuser_token_headers,
    )
    assert detail.status_code == 200
    assert len(detail.json()["packages"]) == 1
    assert detail.json()["packages"][0]["status"] == "completed"
