import asyncio
import contextlib
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.ai.ai_reasoner import explain_risk
from backend.ai.anomaly_detector import detect_anomaly
from backend.ai.feature_engineering import build_feature_vector
from backend.ai.risk_engine import calculate_risk
from backend.alerts.alert_engine import build_alerts
from backend.config import settings
from backend.simulator.sensor_generator import generate_sensor_packet
from backend.simulator.scenarios import SCENARIOS
from backend.websocket.socket_manager import socket_manager

LATEST_SNAPSHOT: dict = {}


def _system_status(risk: dict) -> str:
    level = risk["level"].lower()
    if level == "critical":
        return "CRITICAL"
    if level == "warning":
        return "WARNING"
    return "NORMAL"


def _primary_alert(alerts: list[dict]) -> str | None:
    if not alerts:
        return None
    critical = next((alert for alert in alerts if alert.get("severity") == "critical"), None)
    return (critical or alerts[0]).get("message")


def build_snapshot(scenario: str | None = None) -> dict:
    sensor_packet = generate_sensor_packet(scenario)
    features = build_feature_vector(sensor_packet)
    anomaly = detect_anomaly(features)
    risk = calculate_risk(sensor_packet, anomaly)
    explanation = explain_risk(sensor_packet, risk, anomaly)
    alerts = build_alerts(sensor_packet, risk, anomaly)
    status = _system_status(risk)

    return {
        "timestamp": sensor_packet["timestamp"],
        "room": sensor_packet["room"],
        "riskScore": risk["score"],
        "status": status,
        "alert": _primary_alert(alerts),
        "aiInsight": explanation,
        "activeSensors": sensor_packet["activeSensors"],
        "sensorPacket": sensor_packet,
        "features": features,
        "anomaly": anomaly,
        "risk": risk,
        "explanation": explanation,
        "alerts": alerts,
        "system": {
            "name": settings.app_name,
            "residence": settings.residence_name,
            "residentProfile": settings.resident_profile,
        },
    }


async def publish_snapshot(snapshot: dict) -> dict:
    LATEST_SNAPSHOT.clear()
    LATEST_SNAPSHOT.update(snapshot)
    await socket_manager.broadcast_json(snapshot)
    return snapshot


async def simulation_loop() -> None:
    while True:
        await publish_snapshot(build_snapshot())
        await asyncio.sleep(settings.simulation_interval_seconds)


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(simulation_loop())
    try:
        yield
    finally:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def healthcheck() -> dict:
    return {"status": "ok", "app": settings.app_name}


@app.get("/api/snapshot")
async def get_snapshot() -> dict:
    if LATEST_SNAPSHOT:
        return LATEST_SNAPSHOT
    return {"message": "Simulation warming up"}


@app.get("/api/scenarios")
async def list_scenarios() -> dict:
    return {
        "scenarios": [
            {"id": name, "label": name.replace("_", " ").title()}
            for name in SCENARIOS
        ]
    }


@app.post("/api/scenarios/{scenario}")
async def run_scenario(scenario: str) -> dict:
    if scenario not in SCENARIOS:
        raise HTTPException(status_code=404, detail=f"Unknown scenario: {scenario}")

    return await publish_snapshot(build_snapshot(scenario))


@app.websocket(settings.websocket_path)
async def live_updates(websocket: WebSocket) -> None:
    await socket_manager.connect(websocket)
    try:
        if LATEST_SNAPSHOT:
            await websocket.send_json(LATEST_SNAPSHOT)

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        socket_manager.disconnect(websocket)
