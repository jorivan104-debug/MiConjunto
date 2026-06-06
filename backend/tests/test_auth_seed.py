"""Tests del bootstrap de seed y login básico."""


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_seed_creates_admin(client):
    """El seed automático debe haber creado admin/admin con must_change_password=True."""
    r = client.post("/api/auth/login", json={"identifier": "admin", "password": "admin"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["access_token"]
    assert data["needs_password_change"] is True


def test_login_with_email(client):
    """Login también debe funcionar con email del admin."""
    r = client.post(
        "/api/auth/login",
        json={"identifier": "admin@miconjunto.app", "password": "admin"},
    )
    assert r.status_code == 200


def test_login_invalid(client):
    r = client.post("/api/auth/login", json={"identifier": "admin", "password": "wrong"})
    assert r.status_code == 401


def test_change_password_flow(client):
    """Flujo completo: login → /me → change-password."""
    login = client.post("/api/auth/login", json={"identifier": "admin", "password": "admin"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["needs_password_change"] is True

    change = client.post(
        "/api/auth/change-password",
        json={"new_password": "NewSecure123"},
        headers=headers,
    )
    assert change.status_code == 204

    # Login con la nueva contraseña
    relogin = client.post(
        "/api/auth/login",
        json={"identifier": "admin", "password": "NewSecure123"},
    )
    assert relogin.status_code == 200
    assert relogin.json().get("needs_password_change") is False
