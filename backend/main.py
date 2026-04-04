from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

load_dotenv()

from agent import MarketAgent
from models import ChatRequest, ChatResponse, PortfolioRequest
from tools import (
    get_stock_price,
    get_crypto_price,
    get_stock_history,
    get_crypto_history,
    get_market_summary,
    get_top_movers,
    calculate_portfolio_value,
)

app = FastAPI(title="MarketAgent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = MarketAgent()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "detail": "Internal server error"},
    )


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        response_text = agent.chat(request.message)
        return ChatResponse(response=response_text, session_id=request.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/reset")
def reset_chat():
    agent.reset_conversation()
    return {"status": "ok", "message": "Conversation history cleared"}


@app.get("/api/market/summary")
def market_summary():
    data = get_market_summary()
    if "error" in data:
        raise HTTPException(status_code=502, detail=data["error"])
    return data


@app.get("/api/market/top-movers")
def top_movers():
    data = get_top_movers()
    if "error" in data:
        raise HTTPException(status_code=502, detail=data["error"])
    return data


@app.get("/api/stock/{ticker}")
def stock_data(ticker: str):
    data = get_stock_price(ticker)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@app.get("/api/stock/{ticker}/history")
def stock_history(ticker: str, period: str = "1mo"):
    data = get_stock_history(ticker, period)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@app.get("/api/crypto/{coin_id}")
def crypto_data(coin_id: str):
    data = get_crypto_price(coin_id)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@app.get("/api/crypto/{coin_id}/history")
def crypto_history(coin_id: str, days: int = 30):
    data = get_crypto_history(coin_id, days)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@app.post("/api/portfolio/value")
def portfolio_value(request: PortfolioRequest):
    data = calculate_portfolio_value(request.holdings)
    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data


# Serve React frontend — must come AFTER all API routes
DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str):
        return FileResponse(os.path.join(DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
