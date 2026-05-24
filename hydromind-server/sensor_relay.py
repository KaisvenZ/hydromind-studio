import time
import json
from pathlib import Path
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from httpx import AsyncClient
from auth import get_current_user

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

CONFIG_PATH = Path(__file__).parent / "live-config.json"


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    return json.loads(CONFIG_PATH.read_text())


class SensorReading(BaseModel):
    node_id: str
    water_level: float
    flow_rate: float
    timestamp: int
    unit: str


class WeatherForecast(BaseModel):
    location: str
    precipitation_mm: float
    wind_speed: float
    pressure: float
    valid_from: int
    valid_to: int


class TelemetryResponse(BaseModel):
    basin_id: str
    fetched_at: int
    source: str
    sensors: list[SensorReading]
    forecast: list[WeatherForecast]


@router.get("/{basin_id}", response_model=TelemetryResponse)
async def get_telemetry(basin_id: str, user: dict = Depends(get_current_user)):
    config = load_config()
    endpoints = config.get("endpoints", {})

    now = int(time.time() * 1000)

    sensor_url = endpoints.get(f"{basin_id}_sensors")
    forecast_url = endpoints.get(f"{basin_id}_forecast")

    sensors: list[SensorReading] = []
    forecast: list[WeatherForecast] = []
    source = "demo"

    async with AsyncClient(timeout=10) as client:
        if sensor_url:
            try:
                resp = await client.get(sensor_url)
                if resp.is_success:
                    data = resp.json()
                    sensors = [
                        SensorReading(
                            node_id=s.get("nodeId", s.get("node_id", "")),
                            water_level=float(s.get("waterLevel", s.get("water_level", 0))),
                            flow_rate=float(s.get("flowRate", s.get("flow_rate", 0))),
                            timestamp=int(s.get("timestamp", now)),
                            unit=s.get("unit", "m"),
                        )
                        for s in (data if isinstance(data, list) else data.get("readings", []))
                    ]
                    source = "live"
            except Exception:
                pass

        if forecast_url:
            try:
                resp = await client.get(forecast_url)
                if resp.is_success:
                    data = resp.json()
                    forecast = [
                        WeatherForecast(
                            location=f.get("location", basin_id),
                            precipitation_mm=float(f.get("precipitationMm", f.get("precipitation_mm", 0))),
                            wind_speed=float(f.get("windSpeed", f.get("wind_speed", 0))),
                            pressure=float(f.get("pressure", 0)),
                            valid_from=int(f.get("validFrom", f.get("valid_from", now))),
                            valid_to=int(f.get("validTo", f.get("valid_to", now + 3600000))),
                        )
                        for f in (data if isinstance(data, list) else data.get("forecasts", []))
                    ]
                    source = "live"
            except Exception:
                pass

    return TelemetryResponse(
        basin_id=basin_id,
        fetched_at=now,
        source=source,
        sensors=sensors,
        forecast=forecast,
    )
