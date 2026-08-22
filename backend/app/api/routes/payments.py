from typing import Any

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.models import Package, Payment, PaymentCreate, PaymentPublic
from app.services.package_metrics import sync_package_derived_fields

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/", response_model=PaymentPublic)
def create_payment(
    *, session: SessionDep, current_user: CurrentUser, payment_in: PaymentCreate
) -> Any:
    del current_user
    package = session.get(Package, payment_in.package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    payment = Payment.model_validate(payment_in)
    session.add(payment)
    session.flush()
    session.refresh(package)
    sync_package_derived_fields(package)
    session.add(package)
    session.commit()
    session.refresh(payment)
    return payment
