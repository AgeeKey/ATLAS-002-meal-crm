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
    assert package_details["deliveries_count"] == 2
    assert package_details["days_used"] == 2
    assert package_details["extension_days"] == 2
    assert package_details["freeze_days"] == 2
    assert package_details["days_remaining"] == 5
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
    from datetime import date, timedelta

    today_str = date.today().isoformat()
    tomorrow_str = (date.today() + timedelta(days=1)).isoformat()

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
        json={"scheduled_date": tomorrow_str, "sent_date": today_str},
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


def test_delivery_usage_counts_send_day_not_meal_day(
    client, superuser_token_headers
) -> None:
    """Package usage is counted from sent_date (package day), not meal-date naming."""
    client_id = _create_test_client(client, superuser_token_headers, "Bermet", "+996700000038")
    package_id = _create_test_package(client, superuser_token_headers, client_id, total_days=10, price=11000)

    response = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
        headers=superuser_token_headers,
        json={"scheduled_date": "2026-06-10", "sent_date": "2026-06-09"},
    )
    assert response.status_code == 200

    package_response = client.get(
        f"{settings.API_V1_STR}/packages/{package_id}",
        headers=superuser_token_headers,
    )
    assert package_response.status_code == 200
    package_data = package_response.json()
    assert package_data["deliveries_count"] == 1
    assert package_data["days_used"] == 1
    assert package_data["days_remaining"] == 9

    client_response = client.get(
        f"{settings.API_V1_STR}/clients/{client_id}",
        headers=superuser_token_headers,
    )
    assert client_response.status_code == 200
    delivery = client_response.json()["packages"][0]["deliveries"][0]
    assert delivery["scheduled_date"] == "2026-06-10"
    assert delivery["sent_date"] == "2026-06-09"


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


def test_freeze_preserves_remaining_service_allowance(
    client, superuser_token_headers
) -> None:
    """A 10-day package with a 2-day freeze and 2 deliveries still has 8 service days remaining."""
    client_id = _create_test_client(client, superuser_token_headers, "Elina", "+996700000035")
    package_id = _create_test_package(client, superuser_token_headers, client_id, total_days=10, price=9000)

    freeze_response = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/freezes",
        headers=superuser_token_headers,
        json={"start_date": "2026-06-04", "end_date": "2026-06-05", "reason": "travel"},
    )
    assert freeze_response.status_code == 200

    for scheduled_date, sent_date in [
        ("2026-06-02", "2026-06-01"),
        ("2026-06-03", "2026-06-02"),
    ]:
        delivery_response = client.post(
            f"{settings.API_V1_STR}/packages/{package_id}/deliveries",
            headers=superuser_token_headers,
            json={"scheduled_date": scheduled_date, "sent_date": sent_date},
        )
        assert delivery_response.status_code == 200

    package_response = client.get(
        f"{settings.API_V1_STR}/packages/{package_id}",
        headers=superuser_token_headers,
    )
    assert package_response.status_code == 200
    package_data = package_response.json()
    assert package_data["freeze_days"] == 2
    assert package_data["days_used"] == 2
    assert package_data["days_remaining"] == 8
    assert package_data["end_date"] == "2026-06-12"


def test_package_status_cannot_be_manually_completed_with_remaining_days(
    client, superuser_token_headers
) -> None:
    """PATCH /packages/{id} must reject status=completed when days_remaining > 0."""
    client_id = _create_test_client(client, superuser_token_headers, "Farida", "+996700000036")
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
    client_id = _create_test_client(client, superuser_token_headers, "Gulnara", "+996700000037")
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


def test_create_client_duplicate_phone_rejected(
    client, superuser_token_headers
) -> None:
    """Creating a second client with an existing phone returns 400."""
    _create_test_client(client, superuser_token_headers, "Hadis", "+996700000040")
    dup = client.post(
        f"{settings.API_V1_STR}/clients/",
        headers=superuser_token_headers,
        json={"name": "Hadis Twin", "phone": "+996700000040", "status": "new"},
    )
    assert dup.status_code == 400


def test_read_clients_list_and_status_filter(
    client, superuser_token_headers
) -> None:
    """GET /clients returns the list and honors the status filter."""
    _create_test_client(
        client, superuser_token_headers, "Ilim", "+996700000041", status="active"
    )
    _create_test_client(
        client, superuser_token_headers, "Jyldyz", "+996700000042", status="paused"
    )

    response = client.get(
        f"{settings.API_V1_STR}/clients/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["count"] >= 2

    filtered = client.get(
        f"{settings.API_V1_STR}/clients/",
        headers=superuser_token_headers,
        params={"status": "paused"},
    )
    assert filtered.status_code == 200
    filtered_data = filtered.json()
    assert filtered_data["count"] >= 1
    assert all(item["status"] == "paused" for item in filtered_data["data"])


def test_read_client_not_found(client, superuser_token_headers) -> None:
    """GET /clients/{id} for a missing client returns 404."""
    missing_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(
        f"{settings.API_V1_STR}/clients/{missing_id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_update_client_success_and_duplicate_phone(
    client, superuser_token_headers
) -> None:
    """PATCH /clients updates fields and rejects a phone already used by another client."""
    first_id = _create_test_client(
        client, superuser_token_headers, "Kanat", "+996700000043"
    )
    _create_test_client(client, superuser_token_headers, "Lira", "+996700000044")

    ok = client.patch(
        f"{settings.API_V1_STR}/clients/{first_id}",
        headers=superuser_token_headers,
        json={"name": "Kanat Updated", "status": "active"},
    )
    assert ok.status_code == 200
    assert ok.json()["name"] == "Kanat Updated"
    assert ok.json()["status"] == "active"

    # Reusing another client's phone must be rejected
    dup = client.patch(
        f"{settings.API_V1_STR}/clients/{first_id}",
        headers=superuser_token_headers,
        json={"phone": "+996700000044"},
    )
    assert dup.status_code == 400


def test_update_client_not_found(client, superuser_token_headers) -> None:
    """PATCH /clients/{id} for a missing client returns 404."""
    missing_id = "00000000-0000-0000-0000-000000000000"
    response = client.patch(
        f"{settings.API_V1_STR}/clients/{missing_id}",
        headers=superuser_token_headers,
        json={"name": "Ghost"},
    )
    assert response.status_code == 404


def test_create_note_for_missing_client(client, superuser_token_headers) -> None:
    """POST /clients/{id}/notes for a missing client returns 404."""
    missing_id = "00000000-0000-0000-0000-000000000000"
    response = client.post(
        f"{settings.API_V1_STR}/clients/{missing_id}/notes",
        headers=superuser_token_headers,
        json={"text": "orphan note"},
    )
    assert response.status_code == 404


def test_create_package_for_missing_client(client, superuser_token_headers) -> None:
    """POST /packages for a missing client returns 404."""
    missing_id = "00000000-0000-0000-0000-000000000000"
    response = client.post(
        f"{settings.API_V1_STR}/packages/",
        headers=superuser_token_headers,
        json={
            "client_id": missing_id,
            "meal_type": "3X",
            "total_days": 5,
            "start_date": "2026-07-01",
            "price": 5000,
            "status": "active",
        },
    )
    assert response.status_code == 404


def test_read_package_not_found(client, superuser_token_headers) -> None:
    """GET /packages/{id} for a missing package returns 404."""
    missing_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(
        f"{settings.API_V1_STR}/packages/{missing_id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404


def test_read_packages_list_and_status_filter(
    client, superuser_token_headers
) -> None:
    """GET /packages returns the list with metrics and honors the status filter."""
    client_id = _create_test_client(
        client, superuser_token_headers, "Meder", "+996700000045"
    )
    _create_test_package(
        client, superuser_token_headers, client_id, total_days=10, price=5000
    )

    response = client.get(
        f"{settings.API_V1_STR}/packages/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert "days_remaining" in data["data"][0]

    filtered = client.get(
        f"{settings.API_V1_STR}/packages/",
        headers=superuser_token_headers,
        params={"status": "active"},
    )
    assert filtered.status_code == 200
    assert all(item["status"] == "active" for item in filtered.json()["data"])


def test_freeze_end_before_start_rejected(
    client, superuser_token_headers
) -> None:
    """POST /packages/{id}/freezes rejects an end_date earlier than start_date."""
    client_id = _create_test_client(
        client, superuser_token_headers, "Nurlan", "+996700000046"
    )
    package_id = _create_test_package(
        client, superuser_token_headers, client_id, total_days=10, price=5000
    )

    response = client.post(
        f"{settings.API_V1_STR}/packages/{package_id}/freezes",
        headers=superuser_token_headers,
        json={"start_date": "2026-07-10", "end_date": "2026-07-05"},
    )
    assert response.status_code == 400


def test_get_freeze_days_skips_invalid_range() -> None:
    """get_freeze_days ignores a freeze whose end_date precedes its start_date."""
    from datetime import date as _date

    from app.models import Freeze, Package, PackageMealType
    from app.services.package_metrics import get_freeze_days

    package = Package(
        client_id=uuid.uuid4(),
        meal_type=PackageMealType.THREE_X,
        total_days=10,
        start_date=_date(2026, 8, 1),
        price=5000,
    )
    package.freezes = [
        Freeze(
            package_id=package.id,
            start_date=_date(2026, 8, 5),
            end_date=_date(2026, 8, 3),
        ),
        Freeze(
            package_id=package.id,
            start_date=_date(2026, 8, 10),
            end_date=_date(2026, 8, 11),
        ),
    ]

    # Invalid range is skipped; only the 2-day valid freeze is counted.
    assert get_freeze_days(package) == 2


def test_sync_completes_paused_package_when_fully_consumed() -> None:
    """A paused package with zero remaining days is marked completed by sync."""
    from datetime import date as _date

    from app.models import Delivery, Package, PackageMealType, PackageStatus
    from app.services.package_metrics import sync_package_derived_fields

    package = Package(
        client_id=uuid.uuid4(),
        meal_type=PackageMealType.THREE_X,
        total_days=1,
        start_date=_date(2026, 8, 1),
        price=5000,
        status=PackageStatus.PAUSED,
    )
    package.deliveries = [
        Delivery(
            package_id=package.id,
            scheduled_date=_date(2026, 8, 2),
            sent_date=_date(2026, 8, 1),
        )
    ]

    sync_package_derived_fields(package)
    assert package.status == PackageStatus.COMPLETED


def test_sync_keeps_paused_package_with_remaining_days() -> None:
    """A paused package that still has remaining days stays paused."""
    from datetime import date as _date

    from app.models import Package, PackageMealType, PackageStatus
    from app.services.package_metrics import sync_package_derived_fields

    package = Package(
        client_id=uuid.uuid4(),
        meal_type=PackageMealType.THREE_X,
        total_days=5,
        start_date=_date(2026, 8, 1),
        price=5000,
        status=PackageStatus.PAUSED,
    )

    sync_package_derived_fields(package)
    assert package.status == PackageStatus.PAUSED


def test_is_valid_package_status() -> None:
    """is_valid_package_status accepts known statuses and rejects unknown ones."""
    from app.models import PackageStatus
    from app.services.package_metrics import is_valid_package_status

    assert is_valid_package_status(PackageStatus.ACTIVE) is True
    assert is_valid_package_status(PackageStatus.COMPLETED) is True
    assert is_valid_package_status(PackageStatus.PAUSED) is True
