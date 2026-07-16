import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(__file__), "model.joblib"))

# Feature structure:
# 0: hour_of_day (0-23)
# 1: is_unknown_device (0 or 1)
# 2: is_unknown_ip (0 or 1)
# 3: download_size_mb (float)
# 4: is_sensitive_db (0 or 1)
# 5: consecutive_failures (integer)
FEATURE_COLS = [
    "hour_of_day",
    "is_unknown_device",
    "is_unknown_ip",
    "download_size_mb",
    "is_sensitive_db",
    "consecutive_failures"
]

def train_isolation_forest(normal_events_df: pd.DataFrame) -> IsolationForest:
    """
    Trains the Isolation Forest model using the features derived from normal user activity.
    """
    X = normal_events_df[FEATURE_COLS].values
    
    # Isolation Forest parameters tuned for outlier detection
    model = IsolationForest(
        n_estimators=100,
        max_samples='auto',
        contamination=0.02,  # assume 2% of data is anomalous
        random_state=42,
        n_jobs=-1
    )
    model.fit(X)
    return model

def save_model(model: IsolationForest, path: str = MODEL_PATH):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(model, path)
    print(f"AI Model successfully saved to {path}")

def load_model(path: str = MODEL_PATH) -> IsolationForest:
    if os.path.exists(path):
        return joblib.load(path)
    else:
        # Fallback to a default trained model or create an untrained model
        print("Model file not found. Creating a default Isolation Forest model...")
        # Return a model that will be trained on the fly or behaves predictably
        model = IsolationForest(contamination=0.02, random_state=42)
        # Fit on some dummy data so it doesn't fail on prediction
        dummy_data = np.zeros((10, len(FEATURE_COLS)))
        # Make dummy data contain normal variation
        dummy_data[:, 0] = np.random.randint(8, 18, 10)  # hours
        model.fit(dummy_data)
        return model

# Global model instance
_model = None

def get_model() -> IsolationForest:
    global _model
    if _model is None:
        _model = load_model()
    return _model

def analyze_event(
    hour_of_day: int,
    is_unknown_device: bool,
    is_unknown_ip: bool,
    download_size_bytes: float,
    is_sensitive_db: bool,
    consecutive_failures: int
) -> dict:
    """
    Predicts if an event is anomalous using the Isolation Forest model.
    Returns:
        anomaly_score: float (0.0 to 1.0, where high indicates anomaly)
        confidence: float (0.0 to 1.0)
        anomaly_detected: bool
    """
    model = get_model()
    
    download_size_mb = download_size_bytes / (1024.0 * 1024.0)
    
    # Feature vector
    x = np.array([[
        hour_of_day,
        1.0 if is_unknown_device else 0.0,
        1.0 if is_unknown_ip else 0.0,
        download_size_mb,
        1.0 if is_sensitive_db else 0.0,
        float(consecutive_failures)
    ]])
    
    # Isolation Forest returns -1 for anomalies and 1 for normals
    pred = model.predict(x)[0]
    
    # decision_function returns negative values for anomalies, positive for normals
    # Higher absolute negative value means more anomalous
    raw_score = model.decision_function(x)[0]
    
    # Scale score to 0-1 range where 1 is highly anomalous.
    # Typical range of decision_function is around -0.5 to 0.5.
    # Let's map it: score = 0.5 - raw_score, then clip to [0, 1]
    anomaly_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))
    
    # Calculate confidence based on the estimators' agreement
    # In Isolation Forest, path length is the basis. Let's approximate from decision function.
    confidence = float(np.clip(0.5 + abs(raw_score), 0.5, 0.99))
    
    anomaly_detected = bool(pred == -1)
    
    # If the features have severe deviations, override the default Isolation Forest output to be safe
    # This prevents cold-start or false negative issues for critical rules
    if is_unknown_device and is_sensitive_db:
        anomaly_detected = True
        anomaly_score = max(anomaly_score, 0.85)
    if consecutive_failures >= 5:
        anomaly_detected = True
        anomaly_score = max(anomaly_score, 0.90)
    if download_size_mb > 500:  # >500MB download
        anomaly_detected = True
        anomaly_score = max(anomaly_score, 0.80)
        
    return {
        "anomaly_score": anomaly_score,
        "confidence": confidence,
        "anomaly_detected": anomaly_detected
    }
