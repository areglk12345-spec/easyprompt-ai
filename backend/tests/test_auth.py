def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "password123", "full_name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["role"] == "user"

def test_register_duplicate_user(client):
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "password123", "full_name": "Test User"}
    )
    response = client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "password456", "full_name": "Test User 2"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว"

def test_login_user(client):
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "password123", "full_name": "Test User"}
    )
    
    response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "testuser"

def test_login_invalid_password(client):
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "password123"}
    )
    
    response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_get_me(client):
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "password123"}
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "password123"}
    )
    token = login_resp.json()["access_token"]
    
    me_resp = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "testuser"
