from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    app_name: str = "Vanguard OSINT"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change_this_in_production"
    allowed_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # PostgreSQL
    database_url: str = "postgresql://vanguard:vanguard_dev_pass@localhost:5432/vanguard_db"

    # Neo4j
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "vanguard_neo4j_dev"

    # Evidence vault
    evidence_vault_path: str = "./evidence"
    max_upload_bytes: int = 52_428_800  # 50MB

    # JWT
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480

    # Stylometry
    stylo_min_tokens: int = 100
    stylo_high_threshold: float = 0.80
    stylo_med_threshold: float = 0.60

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
