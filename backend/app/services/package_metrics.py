from datetime import timedelta

from app.models import Package, PackageStatus


def get_deliveries_count(package: Package) -> int:
    return len({delivery.sent_date for delivery in package.deliveries if delivery.sent_date})


def get_freeze_days(package: Package) -> int:
    days = 0
    for freeze in package.freezes:
        if freeze.end_date < freeze.start_date:
            continue
        days += (freeze.end_date - freeze.start_date).days + 1
    return days


def get_extension_days(package: Package) -> int:
    return sum(extension.extra_days for extension in package.extensions)


def get_paid_amount(package: Package) -> int:
    return sum(payment.amount for payment in package.payments)


def calculate_package_metrics(package: Package) -> dict[str, int]:
    deliveries_count = get_deliveries_count(package)
    freeze_days = get_freeze_days(package)
    extension_days = get_extension_days(package)
    effective_days = package.total_days + extension_days
    days_used = deliveries_count
    days_remaining = max(effective_days - days_used, 0)
    paid_amount = get_paid_amount(package)
    debt = max(package.price - paid_amount, 0)

    return {
        "deliveries_count": deliveries_count,
        "freeze_days": freeze_days,
        "extension_days": extension_days,
        "days_used": days_used,
        "days_remaining": days_remaining,
        "paid_amount": paid_amount,
        "debt": debt,
    }


def sync_package_derived_fields(package: Package) -> dict[str, int]:
    metrics = calculate_package_metrics(package)
    effective_days = package.total_days + metrics["extension_days"]

    package.paid_amount = metrics["paid_amount"]
    if effective_days > 0:
        package.end_date = package.start_date + timedelta(
            days=effective_days + metrics["freeze_days"] - 1
        )
    if package.status != "paused":
        package.status = "completed" if metrics["days_remaining"] == 0 else "active"
    elif metrics["days_remaining"] == 0:
        package.status = "completed"

    return metrics


def is_valid_package_status(status: PackageStatus) -> bool:
    return status in {"active", "completed", "paused"}
