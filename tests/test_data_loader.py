import pytest
from backend.utils.data_loader import load_all_data, get_all_customers, get_all_demo_cases, get_customer, build_analytics_data


def test_data_loader():
    load_all_data("data")

    customers = get_all_customers()
    assert len(customers) > 0

    demo_cases = get_all_demo_cases()
    assert len(demo_cases) == 8

    # Test lookup
    cust_id = customers[0]["customer_id"]
    found = get_customer(cust_id)
    assert found is not None
    assert found["customer_id"] == cust_id

    # Test analytics compilation
    analytics = build_analytics_data()
    assert analytics["total_cases"] == 8
    assert analytics["total_customers"] == 25
