import random
from datetime import datetime, timezone

from backend.simulator.mock_data import BASELINE_SENSOR_VALUES, ROOM_SENSOR_KEYS, ROOMS
from backend.simulator.scenarios import get_scenario, pick_scenario


def _jitter(value: float, spread: float) -> float:
    return round(value + random.uniform(-spread, spread), 2)


def generate_sensor_packet(scenario_name: str | None = None) -> dict:
    scenario = get_scenario(scenario_name) if scenario_name else pick_scenario()
    base = BASELINE_SENSOR_VALUES
    weights = scenario["weights"]
    room = scenario.get("room") or random.choice(ROOMS)
    active_sensors = {sensor_key: False for sensor_key in ROOM_SENSOR_KEYS.values()}
    active_sensors[ROOM_SENSOR_KEYS[room]] = True

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "zone": room,
        "room": room,
        "scenario": scenario["name"],
        "temperatureC": _jitter(base["temperatureC"] + weights["temperatureC"], 1.1),
        "humidity": _jitter(base["humidity"] + weights["humidity"], 3.5),
        "co2Ppm": _jitter(base["co2Ppm"] + weights["co2Ppm"], 45),
        "pm25": _jitter(base["pm25"] + weights["pm25"], 4),
        "noiseDb": _jitter(base["noiseDb"] + weights["noiseDb"], 5),
        "ambientLightLux": max(0, _jitter(base["ambientLightLux"] + weights["ambientLightLux"], 8)),
        "motionIntensity": max(0, min(1, _jitter(scenario["motionIntensity"], 0.05))),
        "inactivityMinutes": max(0, int(_jitter(scenario["inactivityMinutes"], 2))),
        "doorOpened": scenario["doorOpened"],
        "postureChange": max(0, min(1, _jitter(scenario["postureChange"], 0.04))),
        "activeSensors": active_sensors,
    }
