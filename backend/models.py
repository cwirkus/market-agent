from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    response: str
    session_id: str


class StockRequest(BaseModel):
    ticker: str


class CryptoRequest(BaseModel):
    coin_id: str


class PortfolioRequest(BaseModel):
    holdings: dict
