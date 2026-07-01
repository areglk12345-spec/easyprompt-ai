import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture
def auth_headers(client):
    client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "password123", "organization": "TestOrg"}
    )
    resp = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "password123"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_save_and_get_templates(client, auth_headers):
    # Save a template
    save_resp = client.post(
        "/api/templates",
        headers=auth_headers,
        json={
            "title": "Test Template",
            "prompt_text": "Write a test",
            "category": "โหมดทำงาน"
        }
    )
    assert save_resp.status_code == 200
    assert save_resp.json()["message"] == "บันทึก Template สำเร็จ!"
    
    # Get templates
    get_resp = client.get("/api/templates", headers=auth_headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert len(data) == 1
    assert data[0]["title"] == "Test Template"
    assert data[0]["organization"] == "ทั่วไป"

@patch('app.services.ai_service.client.models.generate_content')
def test_chat_with_agent(mock_generate, client, auth_headers):
    # Mock Gemini API Response
    mock_response = MagicMock()
    mock_response.text = '```json\n{"status": "completed", "next_question": "...", "fitted_prompt": "Mocked Prompt", "prompt_fit_score": 90, "score_explanation": "Mock"}\n```'
    mock_generate.return_value = mock_response

    resp = client.post(
        "/api/chat",
        headers=auth_headers,
        json={"message": "Help me write a test"}
    )
    
    assert resp.status_code == 200
    data = resp.json()
    assert data["fitted_prompt"] == "Mocked Prompt"
    assert data["prompt_fit_score"] == 90
    
    # Check if history is saved
    history_resp = client.get("/api/history", headers=auth_headers)
    assert history_resp.status_code == 200
    history_data = history_resp.json()
    assert len(history_data) == 1
    assert history_data[0]["user_message"] == "Help me write a test"
