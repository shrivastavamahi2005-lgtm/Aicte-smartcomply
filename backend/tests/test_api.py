import requests
import pytest

BASE_URL = "http://127.0.0.1:8000"

def test_root_and_health():
    res = requests.get(f"{BASE_URL}/")
    assert res.status_code == 200
    assert "project" in res.json()

    h = requests.get(f"{BASE_URL}/health")
    assert h.status_code == 200
    assert h.json()["status"] == "healthy"

def test_login_and_auth_flow():
    # Login as College Admin
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@institution.edu",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "College Administrator"

    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /me
    me_res = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "admin@institution.edu"

def test_invalid_login():
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@institution.edu",
        "password": "WrongPassword123"
    })
    assert res.status_code == 401

def test_applications_list_and_details():
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@institution.edu",
        "password": "Admin@123"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    apps_res = requests.get(f"{BASE_URL}/api/v1/applications", headers=headers)
    assert apps_res.status_code == 200
    apps = apps_res.json()
    assert len(apps) > 0

    first_app_id = apps[0]["id"]
    detail_res = requests.get(f"{BASE_URL}/api/v1/applications/{first_app_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == first_app_id

def test_compliance_rules_listing():
    res = requests.get(f"{BASE_URL}/api/v1/compliance/rules")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 7

    # Check distinction between verified official AICTE rules and demo rules
    official_rules = [r for r in rules if r["is_officially_verified"] is True]
    demo_rules = [r for r in rules if r["is_officially_verified"] is False]
    assert len(official_rules) >= 5
    assert len(demo_rules) >= 1

def test_compliance_validation_trigger():
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@institution.edu",
        "password": "Admin@123"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    apps = requests.get(f"{BASE_URL}/api/v1/applications", headers=headers).json()
    app_id = apps[0]["id"]

    val_res = requests.post(f"{BASE_URL}/api/v1/compliance/applications/{app_id}/validate", headers=headers)
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert "total_rules_evaluated" in val_data
    assert "compliance_score" in val_data

def test_copilot_fallback_query():
    res = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "admin@institution.edu",
        "password": "Admin@123"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    chat_res = requests.post(f"{BASE_URL}/api/v1/copilot/query", json={
        "message": "Which documents are missing from this application?"
    }, headers=headers)
    assert chat_res.status_code == 200
    data = chat_res.json()
    assert "content" in data
    assert len(data["content"]) > 20
    assert data["is_fallback"] is True # Deterministic fallback when no LLM API key
