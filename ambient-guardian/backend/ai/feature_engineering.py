def build_feature_vector(sensor_packet: dict) -> dict:
    inactivity_minutes = sensor_packet.get("inactivityMinutes", 0)
    motion_intensity = sensor_packet.get("motionIntensity", 0)
    posture_change = sensor_packet.get("postureChange", 0)
    door_factor = 1 if sensor_packet.get("doorOpened") else 0

    return {
        "airQualityIndexHint": round((sensor_packet["pm25"] * 2.2) + (sensor_packet["co2Ppm"] / 100), 2),
        "heatStressHint": round(sensor_packet["temperatureC"] * (sensor_packet["humidity"] / 100), 2),
        "comfortVariance": round(
            abs(sensor_packet["temperatureC"] - 24.0)
            + abs(sensor_packet["humidity"] - 45.0) / 4
            + abs(sensor_packet["noiseDb"] - 37.0) / 6,
            2,
        ),
        "mobilityRiskHint": round((inactivity_minutes * 0.9) + (posture_change * 38) + (door_factor * 25), 2),
        "routineDeviationHint": round(abs(motion_intensity - 0.38) * 45 + min(inactivity_minutes, 60) * 0.45, 2),
    }
