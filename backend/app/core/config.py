from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Dalal Street DNA"
    APP_VERSION: str = "1.0.0"

    # Data settings
    DEFAULT_PERIOD: str = "1y"        # 1 year of data by default
    SIGNATURE_RESOLUTION: int = 252   # trading days in a year
    MIN_DATA_POINTS: int = 50         # minimum days needed for analysis

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"


settings = Settings()