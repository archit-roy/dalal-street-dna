from fastapi import APIRouter, HTTPException, UploadFile, File
from app.services.trader_analyzer import analyse_trader
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyse")
async def analyse_trader_file(file: UploadFile = File(...)):
    """
    Upload a Zerodha/Groww trade history CSV and get back
    a full trader style analysis.
    """
    try:
        content = await file.read()
        csv_content = content.decode('utf-8')
        result = analyse_trader(csv_content)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.exception("Trader analysis failed")
        raise HTTPException(500, str(e))