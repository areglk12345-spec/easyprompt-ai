import re
import io
import edge_tts
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/tts",
    tags=["tts"]
)

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "th-TH-PremwadeeNeural"
    rate: Optional[float] = 1.0  # 0.5 to 2.0
    pitch: Optional[float] = 1.0 # 0.5 to 1.5

def clean_text_for_speech(text: str) -> str:
    """Clean markdown, code blocks, emojis, and symbols so TTS reads smoothly."""
    if not text:
        return ""
    # Remove code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)
    # Remove inline code
    text = re.sub(r'`[^`]*`', '', text)
    # Remove Markdown headers, bold, italic, links
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\*{1,3}([^*]+)\*{1,3}', r'\1', text)
    text = re.sub(r'_{1,3}([^_]+)_{1,3}', r'\1', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Common English abbreviation phonetic helpers for Thai context
    text = re.sub(r'\bAI\b', 'เอไอ', text, flags=re.IGNORECASE)
    text = re.sub(r'\bPDF\b', 'พีดีเอฟ', text, flags=re.IGNORECASE)
    text = re.sub(r'\bAPI\b', 'เอพีไอ', text, flags=re.IGNORECASE)
    text = re.sub(r'\bUI\b', 'ยูไอ', text, flags=re.IGNORECASE)
    text = re.sub(r'\bUX\b', 'ยูเอ็กซ์', text, flags=re.IGNORECASE)
    
    # Strip excess whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def format_rate_string(rate: float) -> str:
    """Convert rate float (e.g. 1.0) to edge-tts rate format (e.g. '+0%', '+20%', '-10%')"""
    percentage = int(round((rate - 1.0) * 100))
    if percentage >= 0:
        return f"+{percentage}%"
    return f"{percentage}%"

def format_pitch_string(pitch: float) -> str:
    """Convert pitch float (e.g. 1.0) to edge-tts pitch format (e.g. '+0Hz', '+10Hz')"""
    hz = int(round((pitch - 1.0) * 20))
    if hz >= 0:
        return f"+{hz}Hz"
    return f"{hz}Hz"

@router.post("")
async def generate_speech_post(payload: TTSRequest):
    text_to_speak = clean_text_for_speech(payload.text)
    if not text_to_speak:
        raise HTTPException(status_code=400, detail="ข้อความที่ต้องการให้อ่านว่างเปล่า")
    
    voice = payload.voice or "th-TH-PremwadeeNeural"
    rate_str = format_rate_string(payload.rate or 1.0)
    pitch_str = format_pitch_string(payload.pitch or 1.0)

    try:
        communicate = edge_tts.Communicate(text_to_speak, voice, rate=rate_str, pitch=pitch_str)
        audio_data = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.extend(chunk["data"])

        return Response(content=bytes(audio_data), media_type="audio/mpeg", headers={
            "Content-Disposition": "inline; filename=speech.mp3",
            "Cache-Control": "no-cache"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการสร้างเสียง Neural: {str(e)}")

@router.get("")
async def generate_speech_get(
    text: str = Query(..., description="Text to convert to speech"),
    voice: Optional[str] = Query("th-TH-PremwadeeNeural", description="Voice identifier"),
    rate: Optional[float] = Query(1.0, description="Speech rate"),
    pitch: Optional[float] = Query(1.0, description="Speech pitch")
):
    text_to_speak = clean_text_for_speech(text)
    if not text_to_speak:
        raise HTTPException(status_code=400, detail="ข้อความที่ต้องการให้อ่านว่างเปล่า")

    rate_str = format_rate_string(rate)
    pitch_str = format_pitch_string(pitch)

    try:
        communicate = edge_tts.Communicate(text_to_speak, voice, rate=rate_str, pitch=pitch_str)
        audio_data = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.extend(chunk["data"])

        return Response(content=bytes(audio_data), media_type="audio/mpeg", headers={
            "Content-Disposition": "inline; filename=speech.mp3",
            "Cache-Control": "no-cache"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการสร้างเสียง Neural: {str(e)}")
