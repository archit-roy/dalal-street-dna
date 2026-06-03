"""
Stock DNA Analyzer — extracts a stock's behavioural fingerprint.

Pipeline:
  1. Fetch OHLCV data via yfinance
  2. Compute 8 style dimensions from price/volume patterns
  3. Generate a signature waveform (normalised price + volume channels)
  4. Compute rolling metrics for the waveform
"""
import numpy as np
import pandas as pd
from app.services.stock_loader import (
    fetch_stock_data,
    fetch_nifty50,
    get_stock_info,
    get_sector_color,
)
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def normalise(arr: np.ndarray) -> tuple:
    lo, hi = arr.min(), arr.max()
    if hi - lo < 1e-9:
        return np.zeros_like(arr), float(lo), float(hi)
    return (arr - lo) / (hi - lo), float(lo), float(hi)


def compute_style_dimensions(df: pd.DataFrame, nifty: pd.DataFrame) -> list[dict]:
    """Compute 8 behavioural dimensions from OHLCV data."""
    returns    = df["Returns"].values
    log_ret    = df["Log_Returns"].values
    volume     = df["Volume"].values
    price      = df["Close"].values
    range_pct  = df["Range"].values
    gap        = df["Gap"].values

    dims = {}

    # 1. Trend strength — how consistently price moves in one direction
    # Use R² of a linear fit to log price
    x = np.arange(len(price))
    coeffs = np.polyfit(x, np.log(price), 1)
    residuals = np.log(price) - np.polyval(coeffs, x)
    ss_res = np.sum(residuals ** 2)
    ss_tot = np.sum((np.log(price) - np.mean(np.log(price))) ** 2)
    dims["trend_strength"] = float(np.clip(1 - ss_res / (ss_tot + 1e-9), 0, 1))

    # 2. Volatility — annualised std of returns, normalised
    vol = float(np.std(log_ret) * np.sqrt(252))
    dims["volatility"] = float(np.clip(vol / 0.8, 0, 1))  # 80% vol = score of 1

    # 3. Volume confirmation — correlation between volume and abs(returns)
    vol_corr = float(np.corrcoef(volume, np.abs(returns))[0, 1])
    dims["volume_confirmation"] = float(np.clip((vol_corr + 1) / 2, 0, 1))

    # 4. Mean reversion — negative autocorrelation of returns
    autocorr = float(pd.Series(returns).autocorr(lag=1))
    dims["mean_reversion"] = float(np.clip((-autocorr + 1) / 2, 0, 1))

    # 5. Momentum — positive autocorrelation over 5 days
    autocorr5 = float(pd.Series(returns).autocorr(lag=5))
    dims["momentum"] = float(np.clip((autocorr5 + 1) / 2, 0, 1))

    # 6. Gap tendency — how often and how much it gaps
    gap_freq = float(np.mean(np.abs(gap) > 0.01))
    dims["gap_tendency"] = float(np.clip(gap_freq, 0, 1))

    # 7. Intraday range — average daily high-low as % of price
    avg_range = float(np.mean(range_pct))
    dims["intraday_range"] = float(np.clip(avg_range / 0.05, 0, 1))  # 5% range = score of 1

    # 8. Relative strength vs Nifty 50
    try:
        # Align dates
        common = df.index.intersection(nifty.index)
        if len(common) > 10:
            stock_ret = df.loc[common, "Returns"].values
            nifty_ret = nifty.loc[common, "Returns"].values
            # Beta-adjusted relative strength
            beta = float(np.cov(stock_ret, nifty_ret)[0, 1] / (np.var(nifty_ret) + 1e-9))
            alpha = float(np.mean(stock_ret) - beta * np.mean(nifty_ret))
            # Positive alpha = outperforming
            dims["relative_strength"] = float(np.clip((alpha * 252 + 0.1) / 0.2, 0, 1))
        else:
            dims["relative_strength"] = 0.5
    except Exception:
        dims["relative_strength"] = 0.5

    labels = {
        "trend_strength":      "Trend strength",
        "volatility":          "Volatility",
        "volume_confirmation": "Volume confirms",
        "mean_reversion":      "Mean reversion",
        "momentum":            "Momentum",
        "gap_tendency":        "Gap tendency",
        "intraday_range":      "Intraday range",
        "relative_strength":   "Relative strength",
    }

    return [
        {"name": k, "label": labels[k], "value": float(np.clip(v, 0, 1))}
        for k, v in dims.items()
    ]


def build_signature_channels(df: pd.DataFrame) -> list[dict]:
    """
    Build normalised waveform channels from OHLCV data.
    Each channel is resampled to SIGNATURE_RESOLUTION points.
    """
    n = settings.SIGNATURE_RESOLUTION
    idx = np.linspace(0, len(df) - 1, n).astype(int)

    channel_data = {
        "Price":    df["Close"].values[idx],
        "Volume":   df["Volume"].values[idx],
        "Range":    df["Range"].values[idx],
        "Returns":  df["Returns"].values[idx],
        "Gap":      df["Gap"].values[idx],
    }

    channels = []
    for name, raw in channel_data.items():
        normed, raw_min, raw_max = normalise(raw.astype(float))
        channels.append({
            "name":    name,
            "label":   name,
            "unit":    "%" if name in ["Returns", "Range", "Gap"] else "",
            "values":  normed.tolist(),
            "raw_min": raw_min,
            "raw_max": raw_max,
        })

    return channels


def build_stock_dna(symbol: str, period: str = "1y") -> dict:
    """Build the complete DNA profile for a single stock."""
    logger.info(f"Building DNA for {symbol}")

    df    = fetch_stock_data(symbol, period)
    nifty = fetch_nifty50(period)
    info  = get_stock_info(symbol)

    if len(df) < settings.MIN_DATA_POINTS:
        raise ValueError(f"Not enough data for {symbol} — only {len(df)} days")

    style_dims = compute_style_dimensions(df, nifty)
    channels   = build_signature_channels(df)

    # Date axis
    dates = [str(d.date()) for d in df.index[
        np.linspace(0, len(df) - 1, settings.SIGNATURE_RESOLUTION).astype(int)
    ]]

    return {
        "symbol":           symbol.upper(),
        "name":             info["name"],
        "sector":           info["sector"],
        "sector_color":     info["sector_color"],
        "period":           period,
        "data_points":      len(df),
        "latest_price":     float(df["Close"].iloc[-1]),
        "price_change_1y":  float((df["Close"].iloc[-1] / df["Close"].iloc[0] - 1) * 100),
        "dates":            dates,
        "channels":         channels,
        "style_dimensions": style_dims,
    }