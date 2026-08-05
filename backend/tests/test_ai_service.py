"""ทดสอบ retry logic ของ Multi-API-Key Pool ใน ai_service.py
โดยเฉพาะกรณี 503 UNAVAILABLE ที่เคยไม่ retry มาก่อน"""
from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException

import app.services.ai_service as ai_service


def _stream_client(behavior):
    """สร้าง mock client: behavior เป็น Exception (จำลอง error) หรือ list ของข้อความ chunk"""
    client = MagicMock()
    if isinstance(behavior, Exception):
        client.models.generate_content_stream.side_effect = behavior
    else:
        client.models.generate_content_stream.return_value = iter(
            [MagicMock(text=t) for t in behavior]
        )
    return client


def _json_client(behavior):
    client = MagicMock()
    if isinstance(behavior, Exception):
        client.models.generate_content.side_effect = behavior
    else:
        resp = MagicMock()
        resp.text = behavior
        client.models.generate_content.return_value = resp
    return client


def test_stream_retries_on_503_then_succeeds():
    failing = _stream_client(Exception("503 UNAVAILABLE: model overloaded"))
    working = _stream_client(["Hello", " world"])

    with patch.object(ai_service, "clients", [failing, working]), \
         patch.object(ai_service, "_client_index", 0):
        chunks = list(ai_service.generate_stream_content("sys", "hi", "gemini-3.1-flash-lite"))

    assert chunks == ["Hello", " world"]
    failing.models.generate_content_stream.assert_called_once()
    working.models.generate_content_stream.assert_called_once()


def test_stream_retries_on_429_then_succeeds():
    failing = _stream_client(Exception("429 Too Many Requests: quota exceeded"))
    working = _stream_client(["ok"])

    with patch.object(ai_service, "clients", [failing, working]), \
         patch.object(ai_service, "_client_index", 0):
        chunks = list(ai_service.generate_stream_content("sys", "hi", "gemini-3.1-flash-lite"))

    assert chunks == ["ok"]


def test_stream_does_not_retry_on_non_retryable_error():
    failing = _stream_client(Exception("400 Bad Request: invalid argument"))
    working = _stream_client(["should not be used"])

    with patch.object(ai_service, "clients", [failing, working]), \
         patch.object(ai_service, "_client_index", 0):
        chunks = list(ai_service.generate_stream_content("sys", "hi", "gemini-3.1-flash-lite"))

    assert len(chunks) == 1
    assert chunks[0].startswith("[ERROR]")
    working.models.generate_content_stream.assert_not_called()


def test_stream_all_keys_exhausted_returns_friendly_message():
    failing1 = _stream_client(Exception("503 UNAVAILABLE"))
    failing2 = _stream_client(Exception("503 UNAVAILABLE"))

    with patch.object(ai_service, "clients", [failing1, failing2]), \
         patch.object(ai_service, "_client_index", 0):
        chunks = list(ai_service.generate_stream_content("sys", "hi", "gemini-3.1-flash-lite"))

    assert len(chunks) == 1
    assert "รอสักครู่" in chunks[0]


def test_json_retries_on_503_then_succeeds():
    failing = _json_client(Exception("503 UNAVAILABLE"))
    working = _json_client('{"ok": true}')

    with patch.object(ai_service, "clients", [failing, working]), \
         patch.object(ai_service, "_client_index", 0):
        result = ai_service.generate_json_content("sys", "hi", "gemini-3.1-flash-lite")

    assert result == {"ok": True}


def test_json_raises_500_on_non_retryable_error():
    failing = _json_client(Exception("400 Bad Request: invalid argument"))

    with patch.object(ai_service, "clients", [failing]), \
         patch.object(ai_service, "_client_index", 0):
        with pytest.raises(HTTPException) as exc_info:
            ai_service.generate_json_content("sys", "hi", "gemini-3.1-flash-lite")

    assert exc_info.value.status_code == 500


def test_json_all_keys_exhausted_raises_429():
    failing1 = _json_client(Exception("503 UNAVAILABLE"))
    failing2 = _json_client(Exception("503 UNAVAILABLE"))

    with patch.object(ai_service, "clients", [failing1, failing2]), \
         patch.object(ai_service, "_client_index", 0):
        with pytest.raises(HTTPException) as exc_info:
            ai_service.generate_json_content("sys", "hi", "gemini-3.1-flash-lite")

    assert exc_info.value.status_code == 429
