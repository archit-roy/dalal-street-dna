from fastapi import APIRouter, HTTPException, Query
from app.services.dna_analyzer import build_stock_dna
from app.services.clustering import compute_pca_embedding
from app.services.stock_loader import (
    get_all_nifty50_symbols,
    get_stock_info,
    SECTORS,
    SECTOR_COLORS,
)
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/symbols")
async def get_symbols():
    """Return all Nifty 50 symbols with sector info."""
    return get_all_nifty50_symbols()


@router.get("/sectors")
async def get_sectors():
    """Return all sectors with their stocks and colors."""
    return [
        {
            "sector": sector,
            "color":  SECTOR_COLORS.get(sector, "#888"),
            "stocks": stocks,
        }
        for sector, stocks in SECTORS.items()
    ]


@router.get("/dna/{symbol}")
async def get_stock_dna(
    symbol: str,
    period: str = Query(default="1y"),
):
    """Build and return the full DNA profile for a stock."""
    try:
        dna = build_stock_dna(symbol.upper(), period)
        return dna
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        logger.exception(f"DNA build failed for {symbol}")
        raise HTTPException(500, str(e))


@router.get("/compare")
async def compare_stocks(
    symbols: list[str] = Query(...),
    period: str = Query(default="1y"),
):
    """Build DNA profiles for multiple stocks and return with PCA embedding."""
    profiles = []
    for symbol in symbols[:10]:
        try:
            dna = build_stock_dna(symbol.upper(), period)
            profiles.append(dna)
        except Exception as e:
            logger.warning(f"Skipping {symbol}: {e}")

    if not profiles:
        raise HTTPException(404, "No profiles could be built")

    embedding = compute_pca_embedding(profiles)

    return {
        "profiles":  profiles,
        "embedding": embedding,
    }


@router.get("/sector-dna/{sector}")
async def get_sector_dna(
    sector: str,
    period: str = Query(default="1y"),
):
    """Build DNA profiles for all stocks in a sector."""
    if sector not in SECTORS:
        raise HTTPException(404, f"Sector {sector} not found")

    stocks = SECTORS[sector]
    profiles = []
    for symbol in stocks:
        try:
            dna = build_stock_dna(symbol, period)
            profiles.append(dna)
        except Exception as e:
            logger.warning(f"Skipping {symbol}: {e}")

    if not profiles:
        raise HTTPException(404, "No profiles built for this sector")

    embedding = compute_pca_embedding(profiles)

    return {
        "sector":    sector,
        "profiles":  profiles,
        "embedding": embedding,
    }