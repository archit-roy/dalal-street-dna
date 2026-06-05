from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import stocks, trader

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router,  prefix="/api/stocks",  tags=["Stocks"])
app.include_router(trader.router,  prefix="/api/trader",  tags=["Trader"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}