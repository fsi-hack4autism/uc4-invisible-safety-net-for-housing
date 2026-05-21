from backend.alerts.alert_rules import ALERT_THRESHOLDS


def build_alerts(sensor_packet: dict, risk: dict, anomaly: dict) -> list[dict]:
    alerts: list[dict] = []

    if sensor_packet.get("postureChange", 0) > 0.75 and sensor_packet.get("inactivityMinutes", 0) >= 8:
        alerts.append(
            {
                "metric": "Possible Fall",
                "value": sensor_packet["postureChange"],
                "threshold": 0.75,
                "severity": "critical",
                "message": f"Possible Fall Detected in {sensor_packet['zone']}",
            }
        )

    if sensor_packet.get("doorOpened"):
        alerts.append(
            {
                "metric": "Wandering Risk",
                "value": "door-opened",
                "threshold": "closed",
                "severity": "critical",
                "message": "Exit door opened outside expected routine window",
            }
        )

    if sensor_packet.get("inactivityMinutes", 0) >= 30:
        alerts.append(
            {
                "metric": "Extended Inactivity",
                "value": sensor_packet["inactivityMinutes"],
                "threshold": 30,
                "severity": "warning",
                "message": f"No meaningful movement for {sensor_packet['inactivityMinutes']} minutes",
            }
        )

    for metric, threshold in ALERT_THRESHOLDS.items():
        if sensor_packet.get(metric, 0) > threshold:
            alerts.append(
                {
                    "metric": metric,
                    "value": sensor_packet[metric],
                    "threshold": threshold,
                    "severity": risk["level"],
                    "message": f"{metric} exceeded threshold in {sensor_packet['zone']}",
                }
            )

    if anomaly["isAnomaly"]:
        alerts.append(
            {
                "metric": "anomaly",
                "value": anomaly["confidence"],
                "threshold": 0.6,
                "severity": risk["level"],
                "message": "AI detector identified unusual resident behavior",
            }
        )

    return alerts
