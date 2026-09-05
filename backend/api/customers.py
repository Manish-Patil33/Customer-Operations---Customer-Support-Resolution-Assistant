"""
Customers API Routes
"""
from fastapi import APIRouter, HTTPException
from backend.utils.data_loader import get_all_customers, get_customer, get_tickets_for_customer

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("")
def list_customers():
    """Return all customers."""
    return get_all_customers()


@router.get("/{customer_id}")
def get_customer_detail(customer_id: str):
    """Return full customer profile with tickets."""
    customer = get_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

    tickets = get_tickets_for_customer(customer_id)
    return {
        **customer,
        "tickets": tickets,
    }
