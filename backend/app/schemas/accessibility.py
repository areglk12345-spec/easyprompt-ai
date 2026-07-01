from pydantic import BaseModel
from typing import List, Optional

class AnalyzeTextRequest(BaseModel):
    text: str

class AnalyzeTextResponse(BaseModel):
    reading_level_score: int
    is_complex: bool
    complex_words: List[str]
    suggestions: List[str]

class SimplifyTextRequest(BaseModel):
    text: str

class SimplifyTextResponse(BaseModel):
    original_text: str
    simplified_text: str
    changes_made: List[str]
