from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "AI Ambient Guardian API"
    websocket_path: str = "/ws/live"
    simulation_interval_seconds: float = 1.5
    residence_name: str = "Guardian Residence A"
    resident_profile: str = "Resident-01"


settings = Settings()
