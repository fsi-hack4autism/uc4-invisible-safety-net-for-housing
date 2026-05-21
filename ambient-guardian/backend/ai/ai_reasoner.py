def explain_risk(sensor_packet: dict, risk: dict, anomaly: dict) -> str:
    reasons = []

    if sensor_packet.get("postureChange", 0) > 0.75 and sensor_packet.get("inactivityMinutes", 0) >= 8:
        reasons.append("abrupt movement was followed by inactivity, which may indicate a fall")
    if sensor_packet.get("doorOpened"):
        reasons.append("exit door activity is unusual for the resident's learned routine")
    if sensor_packet.get("inactivityMinutes", 0) >= 30:
        reasons.append("extended inactivity exceeds the expected rest pattern")
    if sensor_packet["co2Ppm"] > 900:
        reasons.append("CO2 is above preferred indoor ventilation thresholds")
    if sensor_packet["pm25"] > 35:
        reasons.append("particulate matter indicates an air quality event")
    if sensor_packet["temperatureC"] > 27 and sensor_packet["humidity"] > 55:
        reasons.append("heat and humidity together may reduce occupant comfort")
    if anomaly["isAnomaly"]:
        reasons.append("the pattern deviates from the recent operating baseline")

    if not reasons:
        reasons.append("sensor values remain within expected operating ranges")

    return f"Resident risk is {risk['level']} with score {risk['score']}. " + "; ".join(reasons) + "."
