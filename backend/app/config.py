from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./crm.db"
    page_size_default: int = 20
    page_size_max: int = 100
    jwt_secret_key: str = "changeme-replace-with-a-secure-random-key-min-32-chars"
    jwt_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
