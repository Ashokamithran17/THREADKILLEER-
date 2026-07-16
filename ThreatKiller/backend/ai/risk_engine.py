import datetime
from sqlalchemy.orm import Session
from database.models import User, Alert, LoginLog, FileLog, DatabaseQuery, BehaviorProfile, Device, RiskScore

def calculate_risk_score(
    db: Session,
    user_id: int,
    anomaly_results: dict,
    event_details: dict
) -> dict:
    """
    Calculates a risk score from 0-100 using AI anomaly metrics and heuristic factors.
    Returns:
        score: int (0-100)
        status: str (Safe, Medium, High, Critical)
        reasons: list[str]
        recommendations: list[str]
        adaptive_response: str (Normal, Require MFA, Disable Downloads, Terminate Session)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {
            "score": 0,
            "status": "Safe",
            "reasons": ["User not found"],
            "recommendations": [],
            "adaptive_response": "Normal"
        }

    # Fetch user's behavior profile
    profile = db.query(BehaviorProfile).filter(BehaviorProfile.user_id == user_id).first()
    
    score = 0
    reasons = []
    recommendations = []

    # 1. AI Anomaly Score contribution (up to 40 points)
    anomaly_detected = anomaly_results.get("anomaly_detected", False)
    anomaly_score = anomaly_results.get("anomaly_score", 0.0)
    
    if anomaly_detected:
        score += int(anomaly_score * 30) + 10
        reasons.append("Behavior deviation flagged by AI model")
    elif anomaly_score > 0.4:
        score += int(anomaly_score * 20)
        reasons.append("Minor behavioral deviation detected")

    # 2. Login Time factor (up to 15 points)
    hour = event_details.get("hour_of_day", datetime.datetime.utcnow().hour)
    if profile:
        start_h = profile.normal_login_start_hour
        end_h = profile.normal_login_end_hour
        if not (start_h <= hour <= end_h):
            score += 15
            reasons.append(f"Login outside normal hours ({hour}:00, baseline: {start_h}:00-{end_h}:00)")
            recommendations.append("Require MFA for off-hours access")
    else:
        # Fallback normal hours: 8-18
        if not (8 <= hour <= 18):
            score += 15
            reasons.append(f"Login outside standard hours ({hour}:00)")
            recommendations.append("Verify off-hours login via MFA")

    # 3. Device Trust factor (up to 20 points)
    is_unknown_device = event_details.get("is_unknown_device", False)
    device_id = event_details.get("device_id")
    if is_unknown_device:
        score += 20
        reasons.append("Login from a new/unknown device")
        recommendations.append("Register and verify new device")
    elif device_id:
        device = db.query(Device).filter(Device.user_id == user_id, Device.device_identifier == device_id).first()
        if device and device.trust_level == "Untrusted":
            score += 25
            reasons.append("Access attempted from an untrusted/blacklisted device")
            recommendations.append("Require device validation or block access")

    # 4. Location / IP Trust factor (up to 15 points)
    is_unknown_ip = event_details.get("is_unknown_ip", False)
    if is_unknown_ip:
        score += 15
        reasons.append("Login from an unusual location/IP address")
        recommendations.append("Require step-up authentication (MFA)")

    # 5. Sensitive Database Access (up to 25 points)
    is_sensitive_db = event_details.get("is_sensitive_db", False)
    db_name = event_details.get("database_name")
    if is_sensitive_db:
        score += 25
        reasons.append(f"Sensitive database access detected ({db_name})")
        recommendations.append("Monitor DB queries closely and audit privilege level")

    # 6. File Download Size factor (up to 25 points)
    download_size_bytes = event_details.get("download_size_bytes", 0)
    if download_size_bytes > 0 and profile:
        avg_sz = profile.avg_download_size_bytes
        std_sz = profile.std_download_size_bytes
        if download_size_bytes > avg_sz + 2.0 * std_sz:
            score += 25
            reasons.append("Download volume significantly exceeded user's baseline")
            recommendations.append("Suspend further downloads or throttle bandwidth")

    # 7. Consecutive Failures (up to 25 points)
    consecutive_failures = event_details.get("consecutive_failures", 0)
    if consecutive_failures >= 3:
        score += min(consecutive_failures * 5, 25)
        reasons.append(f"Multiple failed login attempts ({consecutive_failures} failures)")
        recommendations.append("Lock account temporarily or require password reset")

    # 8. Historical Incidents (up to 20 points)
    # Count unresolved alerts in the last 30 days
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    past_alerts_count = db.query(Alert).filter(
        Alert.user_id == user_id,
        Alert.is_resolved == False,
        Alert.timestamp >= thirty_days_ago
    ).count()
    if past_alerts_count > 0:
        score += min(past_alerts_count * 5, 20)
        reasons.append(f"User has {past_alerts_count} active/unresolved alerts")

    # Clip score to [0, 100]
    final_score = int(min(max(score, 0), 100))

    # Map status
    if final_score < 30:
        status = "Safe"
        adaptive_response = "Normal"
    elif final_score <= 60:
        status = "Medium"
        adaptive_response = "Require MFA"
        if not recommendations:
            recommendations.append("Verify user identity via MFA")
    elif final_score <= 80:
        status = "High"
        adaptive_response = "Disable Downloads"
        recommendations.append("Suspend data extraction privileges immediately")
    else:
        status = "Critical"
        adaptive_response = "Terminate Session"
        recommendations.append("Terminate all active sessions and suspend account access")

    # If score is High or Critical, add standard recommendation
    if final_score >= 61 and "Audit user privileges" not in recommendations:
        recommendations.append("Request supervisor or SOC team review")

    return {
        "score": final_score,
        "status": status,
        "reasons": reasons if reasons else ["Normal user activity"],
        "recommendations": recommendations if recommendations else ["Continue routine monitoring"],
        "adaptive_response": adaptive_response
    }

def apply_adaptive_response(
    db: Session,
    user_id: int,
    risk_results: dict,
    event_details: dict
) -> tuple[str, bool]:
    """
    Applies the adaptive response policy to the user's status.
    Returns:
        response_action: str
        alert_created: bool
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return "Normal", False

    score = risk_results["score"]
    response_action = risk_results["adaptive_response"]
    
    # Apply changes to user model
    if response_action == "Normal":
        # Keep Active unless they are already suspended
        if user.status not in ["Suspended", "Session_Terminated"]:
            user.status = "Active"
    elif response_action == "Require MFA":
        if user.status not in ["Suspended", "Session_Terminated"]:
            user.status = "MFA_Required"
    elif response_action == "Disable Downloads":
        # Handled in the API route, we keep the user state as active/MFA_Required, but we can set status to restrict downloads
        if user.status not in ["Suspended", "Session_Terminated"]:
            user.status = "MFA_Required"  # Downgrade to MFA_Required
    elif response_action == "Terminate Session":
        user.status = "Session_Terminated"

    # Save risk score record
    risk_score_rec = RiskScore(
        user_id=user_id,
        score=score,
        status=risk_results["status"],
        factors=risk_results["reasons"],
        timestamp=datetime.datetime.utcnow()
    )
    db.add(risk_score_rec)

    alert_created = False
    # Auto-generate alerts/incidents for scores above Safe threshold
    if score >= 31:
        severity = "Low"
        if score > 80:
            severity = "Critical"
        elif score > 60:
            severity = "High"
        elif score >= 31:
            severity = "Medium"
            
        title = f"Suspicious Activity Detected: Risk Score {score}"
        description = "; ".join(risk_results["reasons"])
        
        # Create alert
        alert = Alert(
            user_id=user_id,
            title=title,
            description=description,
            risk_score=score,
            severity=severity,
            is_resolved=False,
            timestamp=datetime.datetime.utcnow(),
            ip_address=event_details.get("ip_address") or "Unknown",
            country=event_details.get("country") or "Unknown",
            device_id=event_details.get("device_id") or "Unknown"
        )
        db.add(alert)
        alert_created = True

    db.commit()
    return response_action, alert_created
