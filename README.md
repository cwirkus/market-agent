# MarketAgent — AI-Powered Market Intelligence

A full-stack application combining a Python/FastAPI backend with a React frontend.
The AI agent (powered by Claude) watches real-time stock and crypto markets, answers
natural language questions, and provides data-backed analysis.

## Architecture

```
Browser (React + Vite :5173)
        │
        │  REST API (Axios)
        ▼
FastAPI Server (:8000)
        │
        ├── Claude claude-sonnet-4-5 (Anthropic SDK)
        │       └── Tool calls ──► tools.py
        │
        ├── yfinance  ──► Stock/Index data (free)
        └── pycoingecko ──► Crypto data (free)
```

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/chat | AI agent chat |
| POST | /api/chat/reset | Reset conversation |
| GET | /api/market/summary | Market overview |
| GET | /api/market/top-movers | Top gainers/losers |
| GET | /api/stock/{ticker} | Single stock data |
| GET | /api/stock/{ticker}/history | Stock price history |
| GET | /api/crypto/{coin_id} | Single crypto data |
| GET | /api/crypto/{coin_id}/history | Crypto price history |
| POST | /api/portfolio/value | Portfolio value calc |

## Example Questions

- "What is the current price of Apple stock?"
- "Compare Bitcoin and Ethereum"
- "Give me a full market overview"
- "What are the top movers today?"
- "I have 10 shares of Tesla and 0.5 Bitcoin. What's my portfolio worth?"
- "How has NVIDIA performed over the last 3 months?"
- "Is TSLA a good buy right now?" (agent will give data, not advice)
