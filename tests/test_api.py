import os
import pytest
# Ensure unit tests run offline without network calls to external APIs
os.environ["GEMINI_API_KEY"] = ""

from fastapi.testclient import TestClient
from backend.utils.data_loader import load_all_data
from app import app

# Load synthetic data for tests
load_all_data("data")
client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ResolveIQ"


def test_dashboard():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "demo_case_summary" in data


def test_list_cases():
    response = client.get("/api/cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) == 8


def test_case_lookup():
    response = client.get("/api/cases/CASE-1001")
    assert response.status_code == 200
    case_data = response.json()
    assert case_data["case_id"] == "CASE-1001"
    assert "customer" in case_data
    assert "conversation" in case_data


def test_customer_lookup():
    response = client.get("/api/customers/CUS-10023")
    assert response.status_code == 200
    cust = response.json()
    assert cust["customer_id"] == "CUS-10023"
    assert cust["name"] == "Nandini Bhat"


def test_case_analyze_offline():
    response = client.post("/api/cases/CASE-1001/analyze", json={})
    assert response.status_code == 200
    data = response.json()
    assert "decision" in data


def test_invalid_input_case_lookup():
    response = client.get("/api/cases/NONEXISTENT_CASE_ID_9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_invalid_input_customer_lookup():
    response = client.get("/api/customers/NONEXISTENT_CUS_9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
