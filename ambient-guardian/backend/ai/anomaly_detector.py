from pathlib import Path
import pickle


MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "isolation_forest.pkl"


def _load_model():
    if not MODEL_PATH.exists():
        return None
    try:
        with MODEL_PATH.open("rb") as model_file:
            return pickle.load(model_file)
    except Exception:
        return None


MODEL = _load_model()


def detect_anomaly(features: dict) -> dict:
    legacy_model_compatible = {"airQualityIndexHint", "heatStressHint", "comfortVariance"}.issubset(features)

    if MODEL is not None and hasattr(MODEL, "predict") and legacy_model_compatible:
        vector = [[features["airQualityIndexHint"], features["heatStressHint"], features["comfortVariance"]]]
        prediction = MODEL.predict(vector)[0]
        score = getattr(MODEL, "decision_function", lambda _: [0.0])(vector)[0]
        return {
            "isAnomaly": prediction == -1,
            "confidence": round(abs(float(score)), 3),
            "source": "trained-model",
        }

    heuristic_score = (
        features["airQualityIndexHint"] * 0.45
        + features["heatStressHint"] * 0.35
        + features["comfortVariance"] * 0.2
        + features.get("mobilityRiskHint", 0) * 0.65
        + features.get("routineDeviationHint", 0) * 0.45
    )
    return {
        "isAnomaly": heuristic_score > 34,
        "confidence": round(min(0.99, heuristic_score / 75), 3),
        "source": "heuristic-fallback",
    }
