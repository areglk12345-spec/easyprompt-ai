from unittest.mock import patch

def test_diagnose_prompt(client):
    mock_response = {
        "prompt_fit_score": 85,
        "strengths": ["Clear intent"],
        "weaknesses": ["A bit long"],
        "suggestions": ["Make it shorter"],
        "fitted_prompt": "A shorter prompt"
    }
    
    with patch("app.api.routes.doctor.generate_json_content", return_value=mock_response):
        response = client.post(
            "/api/doctor/",
            json={"prompt_text": "A very long prompt about testing", "easy_language": False}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["prompt_fit_score"] == 85
        assert data["fitted_prompt"] == "A shorter prompt"
