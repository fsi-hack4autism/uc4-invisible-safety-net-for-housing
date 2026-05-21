def calculate_risk(sensor_packet: dict, anomaly: dict) -> dict:
    score = 0

    if sensor_packet.get("temperatureC", 0) > 27:
        score += 8
    if sensor_packet.get("humidity", 0) > 55:
        score += 6
    if sensor_packet.get("co2Ppm", 0) > 900:
        score += 12
    if sensor_packet.get("pm25", 0) > 35:
        score += 10
    if sensor_packet.get("noiseDb", 0) > 65:
        score += 8
    if sensor_packet.get("doorOpened"):
        score += 72
    if sensor_packet.get("postureChange", 0) > 0.75:
        score += 42
    if sensor_packet.get("inactivityMinutes", 0) >= 30:
        score += 30
    elif sensor_packet.get("inactivityMinutes", 0) >= 10:
        score += 18
    if sensor_packet.get("motionIntensity", 0) < 0.08 and sensor_packet.get("scenario") != "normal":
        score += 8
    if anomaly["isAnomaly"]:
        score += 20

    score = min(score, 100)

    if score >= 70:
        level = "critical"
    elif score >= 40:
        level = "warning"
    else:
        level = "normal"

    return {"score": score, "level": level}
