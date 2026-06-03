"""
Stock loader — fetches and cleans Indian equity data via yfinance.
NSE stocks use .NS suffix (e.g. RELIANCE.NS)
BSE stocks use .BO suffix (e.g. RELIANCE.BO)
"""
import yfinance as yf
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

NIFTY_50 = [
    "ADANIENT", "ADANIPORTS", "APOLLOHOSP", "ASIANPAINT", "AXISBANK",
    "BAJAJ-AUTO", "BAJFINANCE", "BAJAJFINSV", "BPCL", "BHARTIARTL",
    "BRITANNIA", "CIPLA", "COALINDIA", "DIVISLAB", "DRREDDY",
    "EICHERMOT", "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE",
    "HEROMOTOCO", "HINDALCO", "HINDUNILVR", "ICICIBANK", "ITC",
    "INDUSINDBK", "INFY", "JSWSTEEL", "KOTAKBANK", "LTIM",
    "LT", "M&M", "MARUTI", "NTPC", "NESTLEIND",
    "ONGC", "POWERGRID", "RELIANCE", "SBILIFE", "SBIN",
    "SUNPHARMA", "TCS", "TATACONSUM", "TATAMOTORS", "TATASTEEL",
    "TECHM", "TITAN", "ULTRACEMCO", "WIPRO",
]

SECTORS = {
    "IT":       ["INFY", "TCS", "HCLTECH", "WIPRO", "TECHM", "LTIM"],
    "Banking":  ["HDFCBANK", "ICICIBANK", "AXISBANK", "KOTAKBANK", "SBIN", "INDUSINDBK"],
    "Pharma":   ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "APOLLOHOSP"],
    "Auto":     ["MARUTI", "TATAMOTORS", "M&M", "BAJAJ-AUTO", "HEROMOTOCO", "EICHERMOT"],
    "FMCG":     ["HINDUNILVR", "ITC", "BRITANNIA", "NESTLEIND", "TATACONSUM"],
    "Energy":   ["RELIANCE", "ONGC", "BPCL", "NTPC", "POWERGRID", "COALINDIA"],
    "Metals":   ["TATASTEEL", "HINDALCO", "JSWSTEEL", "ADANIENT", "ADANIPORTS"],
    "Finance":  ["BAJFINANCE", "BAJAJFINSV", "SBILIFE", "HDFCLIFE"],
}

SECTOR_COLORS = {
    "IT":      "#3b82f6",
    "Banking": "#22c55e",
    "Pharma":  "#a855f7",
    "Auto":    "#f59e0b",
    "FMCG":    "#ec4899",
    "Energy":  "#ef4444",
    "Metals":  "#64748b",
    "Finance": "#14b8a6",
}


def get_sector(symbol: str) -> str:
    for sector, stocks in SECTORS.items():
        if symbol.upper() in stocks:
            return sector
    return "Other"


def get_sector_color(symbol: str) -> str:
    sector = get_sector(symbol)
    return SECTOR_COLORS.get(sector, "#888888")


def fetch_stock_data(symbol: str, period: str = "1y") -> pd.DataFrame:
    if "." not in symbol:
        ticker_symbol = f"{symbol}.NS"
    else:
        ticker_symbol = symbol

    logger.info(f"Fetching {ticker_symbol} for {period}")
    ticker = yf.Ticker(ticker_symbol)
    df = ticker.history(period=period)

    if df.empty:
        raise ValueError(f"No data found for {ticker_symbol}")

    df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.dropna(inplace=True)

    df["Returns"]       = df["Close"].pct_change()
    df["Log_Returns"]   = np.log(df["Close"] / df["Close"].shift(1))
    df["Range"]         = (df["High"] - df["Low"]) / df["Close"]
    df["Gap"]           = (df["Open"] - df["Close"].shift(1)) / df["Close"].shift(1)
    df["Typical_Price"] = (df["High"] + df["Low"] + df["Close"]) / 3

    return df.dropna()


def fetch_nifty50(period: str = "1y") -> pd.DataFrame:
    ticker = yf.Ticker("^NSEI")
    df = ticker.history(period=period)
    df = df[["Close"]].copy()
    df["Returns"] = df["Close"].pct_change()
    return df.dropna()


def get_stock_info(symbol: str) -> dict:
    if "." not in symbol:
        ticker_symbol = f"{symbol}.NS"
    else:
        ticker_symbol = symbol

    try:
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info
        return {
            "symbol":       symbol.upper(),
            "name":         info.get("longName", symbol),
            "sector":       info.get("sector", get_sector(symbol)),
            "industry":     info.get("industry", ""),
            "market_cap":   info.get("marketCap", 0),
            "sector_color": get_sector_color(symbol),
        }
    except Exception:
        return {
            "symbol":       symbol.upper(),
            "name":         symbol.upper(),
            "sector":       get_sector(symbol),
            "industry":     "",
            "market_cap":   0,
            "sector_color": get_sector_color(symbol),
        }


def get_all_nifty50_symbols() -> list[dict]:
    return [
        {
            "symbol":       s,
            "sector":       get_sector(s),
            "sector_color": get_sector_color(s),
        }
        for s in NIFTY_50
    ]