import yfinance as yf
from pycoingecko import CoinGeckoAPI
from datetime import datetime

cg = CoinGeckoAPI()


def get_stock_price(ticker: str) -> dict:
    try:
        # Use download() — more reliable than .info or .fast_info
        hist = yf.download(ticker.upper(), period="5d", progress=False, auto_adjust=True)
        if hist.empty:
            return {"error": f"No data found for ticker '{ticker}'"}

        # Flatten MultiIndex if present (yfinance 1.x)
        if hasattr(hist.columns, "levels"):
            hist.columns = hist.columns.get_level_values(0)

        price = float(hist["Close"].iloc[-1])
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else price
        change_pct = ((price - prev_close) / prev_close * 100) if prev_close else 0
        day_high = float(hist["High"].iloc[-1])
        day_low = float(hist["Low"].iloc[-1])
        volume = int(hist["Volume"].iloc[-1])

        # Get extra metadata from fast_info (non-critical — ignore errors)
        market_cap = None
        week_52_high = None
        week_52_low = None
        try:
            fi = yf.Ticker(ticker.upper()).fast_info
            market_cap = getattr(fi, "market_cap", None)
            week_52_high = getattr(fi, "year_high", None)
            week_52_low = getattr(fi, "year_low", None)
        except Exception:
            pass

        return {
            "ticker": ticker.upper(),
            "name": ticker.upper(),
            "price": round(price, 2),
            "currency": "USD",
            "change_pct": round(change_pct, 2),
            "change_abs": round(price - prev_close, 2),
            "market_cap": market_cap,
            "volume": volume,
            "week_52_high": week_52_high,
            "week_52_low": week_52_low,
            "day_high": round(day_high, 2),
            "day_low": round(day_low, 2),
        }
    except Exception as e:
        return {"error": f"Could not fetch stock data for '{ticker}': {str(e)}"}


def get_crypto_price(coin_id: str) -> dict:
    try:
        data = cg.get_coin_by_id(
            coin_id.lower(),
            localization=False,
            tickers=False,
            community_data=False,
            developer_data=False,
        )
        market_data = data.get("market_data", {})
        price = market_data.get("current_price", {}).get("usd", 0)
        change_24h = market_data.get("price_change_percentage_24h", 0)
        market_cap = market_data.get("market_cap", {}).get("usd", 0)
        volume_24h = market_data.get("total_volume", {}).get("usd", 0)
        ath = market_data.get("ath", {}).get("usd", 0)
        ath_change = market_data.get("ath_change_percentage", {}).get("usd", 0)
        circulating_supply = market_data.get("circulating_supply", 0)

        return {
            "coin_id": coin_id.lower(),
            "name": data.get("name", coin_id),
            "symbol": data.get("symbol", "").upper(),
            "price": round(price, 6) if price < 1 else round(price, 2),
            "currency": "USD",
            "change_24h_pct": round(change_24h, 2) if change_24h else 0,
            "market_cap": market_cap,
            "volume_24h": volume_24h,
            "all_time_high": ath,
            "ath_change_pct": round(ath_change, 2) if ath_change else 0,
            "circulating_supply": circulating_supply,
        }
    except Exception as e:
        return {"error": f"Could not fetch crypto data for '{coin_id}': {str(e)}"}


def get_stock_history(ticker: str, period: str = "1mo") -> dict:
    valid_periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y"]
    if period not in valid_periods:
        period = "1mo"
    try:
        hist = yf.download(ticker.upper(), period=period, progress=False, auto_adjust=True)
        if hist.empty:
            return {"error": f"No historical data found for '{ticker}'"}

        # yfinance 1.x returns MultiIndex columns when downloading single ticker
        # Flatten if needed
        if hasattr(hist.columns, "levels"):
            hist.columns = hist.columns.get_level_values(0)

        records = []
        for date, row in hist.iterrows():
            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })

        return {
            "ticker": ticker.upper(),
            "period": period,
            "data": records,
        }
    except Exception as e:
        return {"error": f"Could not fetch history for '{ticker}': {str(e)}"}


def get_crypto_history(coin_id: str, days: int = 30) -> dict:
    try:
        data = cg.get_coin_market_chart_by_id(
            id=coin_id.lower(),
            vs_currency="usd",
            days=days,
        )
        prices_raw = data.get("prices", [])
        records = []
        for entry in prices_raw:
            timestamp_ms, price = entry
            dt = datetime.utcfromtimestamp(timestamp_ms / 1000)
            records.append({
                "date": dt.strftime("%Y-%m-%d %H:%M"),
                "price": round(price, 6) if price < 1 else round(price, 2),
            })

        return {
            "coin_id": coin_id.lower(),
            "days": days,
            "data": records,
        }
    except Exception as e:
        return {"error": f"Could not fetch crypto history for '{coin_id}': {str(e)}"}


def compare_assets(assets: list, asset_type: str) -> dict:
    results = {}
    for asset in assets:
        if asset_type == "stock":
            data = get_stock_price(asset)
            if "error" not in data:
                results[asset.upper()] = {
                    "name": data.get("name", asset.upper()),
                    "price": data.get("price"),
                    "change_pct": data.get("change_pct"),
                    "market_cap": data.get("market_cap"),
                    "volume": data.get("volume"),
                }
            else:
                results[asset.upper()] = data
        elif asset_type == "crypto":
            data = get_crypto_price(asset)
            if "error" not in data:
                results[asset.lower()] = {
                    "name": data.get("name", asset),
                    "symbol": data.get("symbol"),
                    "price": data.get("price"),
                    "change_24h_pct": data.get("change_24h_pct"),
                    "market_cap": data.get("market_cap"),
                    "volume_24h": data.get("volume_24h"),
                }
            else:
                results[asset.lower()] = data
        else:
            results[asset] = {"error": "asset_type must be 'stock' or 'crypto'"}

    return {"asset_type": asset_type, "comparison": results}


def get_market_summary() -> dict:
    indices = {
        "S&P 500": "^GSPC",
        "NASDAQ": "^IXIC",
        "Dow Jones": "^DJI",
    }
    index_data = {}
    for name, symbol in indices.items():
        data = get_stock_price(symbol)
        if "error" not in data:
            index_data[name] = {
                "symbol": symbol,
                "price": data.get("price"),
                "change_pct": data.get("change_pct"),
                "change_abs": data.get("change_abs"),
            }
        else:
            index_data[name] = data

    crypto_ids = ["bitcoin", "ethereum", "solana"]
    crypto_data = {}
    for coin in crypto_ids:
        data = get_crypto_price(coin)
        if "error" not in data:
            crypto_data[data.get("name", coin)] = {
                "coin_id": coin,
                "symbol": data.get("symbol"),
                "price": data.get("price"),
                "change_24h_pct": data.get("change_24h_pct"),
                "market_cap": data.get("market_cap"),
            }
        else:
            crypto_data[coin] = data

    return {
        "indices": index_data,
        "crypto": crypto_data,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
    }


def get_top_movers() -> dict:
    watchlist = [
        "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "GOOGL", "AMD",
        "NFLX", "PYPL", "BABA", "SHOP", "SQ", "COIN", "PLTR", "SOFI",
        "RIVN", "LCID", "SNAP", "UBER",
    ]
    movers = []
    for ticker in watchlist:
        data = get_stock_price(ticker)
        if "error" not in data and data.get("change_pct") is not None:
            movers.append({
                "ticker": ticker,
                "name": data.get("name", ticker),
                "price": data.get("price"),
                "change_pct": data.get("change_pct"),
            })

    movers_sorted = sorted(movers, key=lambda x: x["change_pct"], reverse=True)
    gainers = movers_sorted[:3]
    losers = movers_sorted[-3:][::-1]

    return {
        "gainers": gainers,
        "losers": losers,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
    }


def calculate_portfolio_value(holdings: dict) -> dict:
    known_crypto = {
        "bitcoin", "ethereum", "solana", "dogecoin", "cardano", "polkadot",
        "litecoin", "chainlink", "avalanche-2", "uniswap", "matic-network",
        "ripple", "tron", "stellar", "monero", "cosmos",
    }
    total = 0.0
    breakdown = {}

    for asset, quantity in holdings.items():
        quantity = float(quantity)
        if asset.lower() in known_crypto:
            data = get_crypto_price(asset.lower())
            if "error" not in data:
                price = data["price"]
                value = round(price * quantity, 2)
                total += value
                breakdown[asset] = {
                    "type": "crypto",
                    "name": data.get("name", asset),
                    "quantity": quantity,
                    "price": price,
                    "value": value,
                    "change_24h_pct": data.get("change_24h_pct"),
                }
            else:
                breakdown[asset] = {"error": data["error"]}
        else:
            data = get_stock_price(asset.upper())
            if "error" not in data:
                price = data["price"]
                value = round(price * quantity, 2)
                total += value
                breakdown[asset.upper()] = {
                    "type": "stock",
                    "name": data.get("name", asset.upper()),
                    "quantity": quantity,
                    "price": price,
                    "value": value,
                    "change_pct": data.get("change_pct"),
                }
            else:
                breakdown[asset.upper()] = {"error": data["error"]}

    return {
        "holdings": breakdown,
        "total_value": round(total, 2),
        "currency": "USD",
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
    }


TOOLS_SCHEMA = [
    {
        "name": "get_stock_price",
        "description": "Get the current price and key metrics for a stock by ticker symbol. Returns price, daily change %, market cap, volume, and 52-week range.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {
                    "type": "string",
                    "description": "Stock ticker symbol (e.g., AAPL, TSLA, MSFT, NVDA)",
                }
            },
            "required": ["ticker"],
        },
    },
    {
        "name": "get_crypto_price",
        "description": "Get the current price and key metrics for a cryptocurrency. Returns price in USD, 24h change %, market cap, volume, and all-time high.",
        "input_schema": {
            "type": "object",
            "properties": {
                "coin_id": {
                    "type": "string",
                    "description": "CoinGecko coin ID (e.g., bitcoin, ethereum, solana, dogecoin)",
                }
            },
            "required": ["coin_id"],
        },
    },
    {
        "name": "get_stock_history",
        "description": "Get historical OHLCV price data for a stock. Returns a list of daily prices with open, high, low, close, and volume.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {
                    "type": "string",
                    "description": "Stock ticker symbol (e.g., AAPL, NVDA)",
                },
                "period": {
                    "type": "string",
                    "description": "Time period: 1d, 5d, 1mo, 3mo, 6mo, or 1y",
                    "enum": ["1d", "5d", "1mo", "3mo", "6mo", "1y"],
                },
            },
            "required": ["ticker"],
        },
    },
    {
        "name": "get_crypto_history",
        "description": "Get historical price data for a cryptocurrency. Returns a list of prices over time.",
        "input_schema": {
            "type": "object",
            "properties": {
                "coin_id": {
                    "type": "string",
                    "description": "CoinGecko coin ID (e.g., bitcoin, ethereum)",
                },
                "days": {
                    "type": "integer",
                    "description": "Number of days of history to retrieve (e.g., 7, 30, 90, 365)",
                },
            },
            "required": ["coin_id"],
        },
    },
    {
        "name": "compare_assets",
        "description": "Compare multiple stocks or cryptocurrencies side by side. Returns current price and change % for all assets.",
        "input_schema": {
            "type": "object",
            "properties": {
                "assets": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of tickers (stocks) or coin IDs (crypto) to compare",
                },
                "asset_type": {
                    "type": "string",
                    "description": "Type of assets: 'stock' or 'crypto'",
                    "enum": ["stock", "crypto"],
                },
            },
            "required": ["assets", "asset_type"],
        },
    },
    {
        "name": "get_market_summary",
        "description": "Get a full overview of the market including major indices (S&P 500, NASDAQ, Dow Jones) and top cryptocurrencies (BTC, ETH, SOL).",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_top_movers",
        "description": "Get the top 3 stock gainers and top 3 stock losers from a curated list of popular stocks today.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "calculate_portfolio_value",
        "description": "Calculate the current total value of a portfolio of stocks and/or cryptocurrencies based on quantity held.",
        "input_schema": {
            "type": "object",
            "properties": {
                "holdings": {
                    "type": "object",
                    "description": "Dictionary of asset to quantity, e.g. {'AAPL': 10, 'bitcoin': 0.5, 'TSLA': 5}",
                }
            },
            "required": ["holdings"],
        },
    },
]
