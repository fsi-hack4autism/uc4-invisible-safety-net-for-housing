import random


SCENARIOS: dict[str, dict] = {
    "normal": {
        "name": "normal",
        "room": "Living Room",
        "weights": {"temperatureC": 0.1, "humidity": 0.5, "co2Ppm": 20, "pm25": 1, "noiseDb": 2, "ambientLightLux": 10},
        "motionIntensity": 0.42,
        "inactivityMinutes": 3,
        "doorOpened": False,
        "postureChange": 0.1,
    },
    "fall": {
        "name": "fall",
        "room": "Bathroom",
        "weights": {"temperatureC": 0.4, "humidity": 5.0, "co2Ppm": 80, "pm25": 2, "noiseDb": 28, "ambientLightLux": 5},
        "motionIntensity": 0.96,
        "inactivityMinutes": 11,
        "doorOpened": False,
        "postureChange": 0.94,
    },
    "wandering": {
        "name": "wandering",
        "room": "Exit Door",
        "weights": {"temperatureC": -0.2, "humidity": 1.5, "co2Ppm": 45, "pm25": 3, "noiseDb": 10, "ambientLightLux": -18},
        "motionIntensity": 0.88,
        "inactivityMinutes": 0,
        "doorOpened": True,
        "postureChange": 0.2,
    },
    "inactivity": {
        "name": "inactivity",
        "room": "Bedroom",
        "weights": {"temperatureC": 0.2, "humidity": 1.0, "co2Ppm": 60, "pm25": 1, "noiseDb": -4, "ambientLightLux": -25},
        "motionIntensity": 0.03,
        "inactivityMinutes": 47,
        "doorOpened": False,
        "postureChange": 0.02,
    },
}

SCENARIO_WEIGHTS = {"normal": 70, "fall": 6, "wandering": 8, "inactivity": 16}


def pick_scenario() -> dict:
    names = list(SCENARIO_WEIGHTS)
    weights = [SCENARIO_WEIGHTS[name] for name in names]
    return SCENARIOS[random.choices(names, weights=weights, k=1)[0]]


def get_scenario(name: str) -> dict:
    scenario = SCENARIOS.get(name)
    if scenario is None:
        raise KeyError(name)
    return scenario
