import datetime
import json
import os
import random
import sys
import pandas as pd
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to path to resolve local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import Base, engine, DATABASE_URL
from database.models import User, LoginLog, FileLog, DatabaseQuery, BehaviorProfile, Device, RiskScore, Alert, AuditLog
from ai.ai_engine import train_isolation_forest, save_model, FEATURE_COLS, MODEL_PATH

def hash_password(password: str) -> str:
    passwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(passwd_bytes, salt)
    return hashed.decode('utf-8')

def generate_ip():
    # Keep IPs in specific subnets for normal activity
    subnets = ["192.168.1.", "10.0.12.", "172.16.5."]
    return f"{random.choice(subnets)}{random.randint(10, 250)}"

def generate_anomalous_ip():
    # Outside typical company subnets
    return f"{random.randint(180, 220)}.{random.randint(5, 80)}.{random.randint(1, 254)}.{random.randint(1, 254)}"

def generate_device_id():
    return f"dev-{random.randint(100000, 999999)}"

def seed_database():
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Ensure tables exist before querying
    Base.metadata.create_all(bind=engine)
    
    try:
        user_count = db.query(User).count()
        if user_count >= 100:
            print("Database already contains seeded data. Checking AI model...")
            if not os.path.exists(MODEL_PATH):
                print("Model file missing. Running model training...")
            else:
                print("Database and AI model are ready. Skipping seeding.")
                db.close()
                return
        else:
            print("Database empty or incomplete. Initiating clean seed...")
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Error checking database status: {e}. Re-creating tables...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

    
    # 1. Generate 100 Users
    print("Generating 100 users...")
    roles = ["Admin", "SOC Analyst", "Security Manager", "Standard Employee"]
    roles_weights = [0.05, 0.10, 0.05, 0.80]
    
    users = []
    
    # Pre-defined accounts for testing
    demo_users = [
        {"username": "admin", "role": "Admin"},
        {"username": "soc_analyst", "role": "SOC Analyst"},
        {"username": "manager", "role": "Security Manager"},
    ]
    
    for du in demo_users:
        user = User(
            username=du["username"],
            password_hash=hash_password("password123"),
            role=du["role"],
            status="Active"
        )
        db.add(user)
        db.flush()
        users.append(user)
        
    first_names = ["John", "Emily", "Michael", "Sarah", "David", "Jessica", "James", "Ashley", "Robert", "Amanda", "William", "Megan"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez"]
    
    existing_usernames = {u.username for u in users}
    while len(users) < 100:
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        username = f"{fn.lower()}.{ln.lower()}{random.randint(10, 99)}"
        if username in existing_usernames:
            continue
        existing_usernames.add(username)
        
        role = random.choices(roles, weights=roles_weights)[0]
        user = User(
            username=username,
            password_hash=hash_password("Password@123"),
            role=role,
            status="Active"
        )
        db.add(user)
        db.flush()
        users.append(user)
        
    print(f"Generated {len(users)} users.")

    # 2. Devices and Behavior Profiles
    print("Generating devices and behavior profiles...")
    databases = ["retail_banking", "loans_db", "trading_db", "customer_crm", "payroll", "hr_db", "core_ledger", "audit_logs_db"]
    
    for u in users:
        # Create 1-2 devices per user
        num_devices = random.randint(1, 2)
        devs = []
        for i in range(num_devices):
            dev_id = generate_device_id()
            dev = Device(
                user_id=u.id,
                device_identifier=dev_id,
                device_name=f"Workstation-{u.username.split('.')[0].upper()}-{i+1}",
                trust_level="Trusted",
                last_used=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 10))
            )
            db.add(dev)
            devs.append(dev_id)
        
        # Create normal IPs (1-2)
        ips = [generate_ip() for _ in range(random.randint(1, 2))]
        
        # Configure normal working hours
        # Night shift (10% of standard employees), standard day shift (90%)
        is_night_shift = random.random() < 0.10 and u.role == "Standard Employee"
        start_hour = 20 if is_night_shift else 8
        end_hour = 4 if is_night_shift else 18
        
        # Frequently accessed databases based on role
        if u.role == "Admin":
            freq_dbs = ["system_config", "audit_logs_db"]
        elif u.role in ["SOC Analyst", "Security Manager"]:
            freq_dbs = ["audit_logs_db", "customer_crm"]
        else:
            # Standard employees get retail, crm or loans
            freq_dbs = random.sample(["retail_banking", "loans_db", "customer_crm"], k=random.randint(1, 2))
            
        profile = BehaviorProfile(
            user_id=u.id,
            normal_login_start_hour=start_hour,
            normal_login_end_hour=end_hour,
            known_devices=devs,
            known_ips=ips,
            avg_download_size_bytes=float(random.randint(100, 1500) * 1024),  # 100KB to 1.5MB avg
            std_download_size_bytes=float(random.randint(500, 3000) * 1024),  # 500KB to 3MB std dev
            freq_databases=freq_dbs
        )
        db.add(profile)
    
    db.commit()
    print("Devices and behavior profiles populated.")

    # 3. Generate 5000 Login Logs
    print("Generating 5000 login logs...")
    login_logs = []
    start_date = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    
    for _ in range(5000):
        user = random.choice(users)
        profile = user.behavior_profile
        
        # 95% chance to log in within normal hours
        if random.random() < 0.95:
            # Generate hour within range
            if profile.normal_login_start_hour < profile.normal_login_end_hour:
                hour = random.randint(profile.normal_login_start_hour, profile.normal_login_end_hour)
            else:  # Night shift spans midnight
                hours = list(range(profile.normal_login_start_hour, 24)) + list(range(0, profile.normal_login_end_hour + 1))
                hour = random.choice(hours)
        else:
            # Off hours login
            hour = random.randint(0, 23)
            
        minutes = random.randint(0, 59)
        days_ago = random.randint(0, 30)
        timestamp = start_date + datetime.timedelta(days=days_ago)
        timestamp = timestamp.replace(hour=hour, minute=minutes)
        
        # 98% chance to use known IP & device
        if random.random() < 0.98:
            ip = random.choice(profile.known_ips)
            device = random.choice(profile.known_devices)
            country = "United States"
        else:
            ip = generate_ip()
            device = generate_device_id()
            country = random.choice(["United Kingdom", "Canada", "Germany", "Japan"])
            
        is_success = random.random() < 0.97
        failure_reason = None if is_success else random.choice(["Incorrect password", "MFA validation timeout"])
        
        log = LoginLog(
            user_id=user.id,
            timestamp=timestamp,
            ip_address=ip,
            device_id=device,
            country=country,
            is_success=is_success,
            failure_reason=failure_reason
        )
        db.add(log)
        login_logs.append(log)
        
    db.commit()
    print(f"Generated {len(login_logs)} login logs.")

    # 4. Generate 3000 File Logs
    print("Generating 3000 file logs...")
    file_logs = []
    extensions = [".pdf", ".docx", ".xlsx", ".csv", ".json"]
    directories = ["/shared/documents", "/user/home/docs", "/reports/daily", "/customer/profiles"]
    
    for _ in range(3000):
        user = random.choice(users)
        profile = user.behavior_profile
        
        days_ago = random.randint(0, 30)
        hour = random.randint(8, 19)
        timestamp = start_date + datetime.timedelta(days=days_ago)
        timestamp = timestamp.replace(hour=hour, minute=random.randint(0, 59))
        
        filepath = f"{random.choice(directories)}/file_{random.randint(100, 999)}{random.choice(extensions)}"
        
        # Normal distribution of file size
        file_size = int(max(1024, random.normalvariate(profile.avg_download_size_bytes, profile.std_download_size_bytes)))
        action = random.choices(["Read", "Write", "Delete"], weights=[0.75, 0.20, 0.05])[0]
        
        log = FileLog(
            user_id=user.id,
            timestamp=timestamp,
            filepath=filepath,
            file_size_bytes=file_size,
            action=action
        )
        db.add(log)
        file_logs.append(log)
        
    db.commit()
    print(f"Generated {len(file_logs)} file logs.")

    # 5. Generate 1000 Database Queries
    print("Generating 1000 database queries...")
    queries = []
    
    query_templates = {
        "retail_banking": [
            "SELECT * FROM accounts WHERE branch_id = :1",
            "UPDATE balances SET balance = balance + :1 WHERE account_id = :2",
            "SELECT transaction_history FROM accounts WHERE customer_id = :1 LIMIT 50"
        ],
        "loans_db": [
            "SELECT * FROM loan_applications WHERE status = 'PENDING'",
            "INSERT INTO loan_approvals (loan_id, manager_id, amount) VALUES (:1, :2, :3)",
            "SELECT score FROM credit_ratings WHERE ssn = :1"
        ],
        "trading_db": [
            "SELECT ticker, price FROM stock_quotes WHERE ticker IN (:1, :2)",
            "INSERT INTO trades (ticker, quantity, price, user_id) VALUES (:1, :2, :3, :4)",
            "SELECT sum(volume) FROM trades_today"
        ],
        "customer_crm": [
            "SELECT name, email, phone FROM customers WHERE id = :1",
            "UPDATE customer_contact SET email = :1 WHERE id = :2",
            "SELECT * FROM support_tickets WHERE assigned_to = :1"
        ],
        "system_config": [
            "SELECT config_value FROM global_settings WHERE config_key = :1",
            "UPDATE global_settings SET config_value = :1 WHERE config_key = :2"
        ],
        "audit_logs_db": [
            "SELECT * FROM system_audit WHERE event_type = :1 ORDER BY timestamp DESC LIMIT 100",
            "INSERT INTO system_audit (event_type, description, user_id) VALUES (:1, :2, :3)"
        ]
    }
    
    for _ in range(1000):
        user = random.choice(users)
        profile = user.behavior_profile
        
        db_name = random.choice(profile.freq_databases) if profile.freq_databases else "retail_banking"
        # 1% chance they query a different database
        if random.random() < 0.01:
            db_name = random.choice(databases)
            
        days_ago = random.randint(0, 30)
        timestamp = start_date + datetime.timedelta(days=days_ago)
        timestamp = timestamp.replace(hour=random.randint(8, 18), minute=random.randint(0, 59))
        
        # Pick database templates or default
        templates = query_templates.get(db_name, ["SELECT 1"])
        query_string = random.choice(templates)
        
        rows_returned = random.randint(1, 150)
        
        log = DatabaseQuery(
            user_id=user.id,
            timestamp=timestamp,
            database_name=db_name,
            query_string=query_string,
            rows_returned=rows_returned
        )
        db.add(log)
        queries.append(log)
        
    db.commit()
    print(f"Generated {len(queries)} database queries.")

    # 6. Generate 200 Attack/Incident Events (Anomalies)
    print("Generating 200 attack events (anomalies)...")
    attacks_count = 0
    attack_types = ["Insider Data Theft", "Privilege Escalation", "Credential Compromise", "Malicious Admin"]
    
    # We will disperse these over the last 7 days to keep them fresh on the dashboard
    recent_start_date = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    
    # Standard employee to target for insider theft
    employee_users = [u for u in users if u.role == "Standard Employee"]
    admin_users = [u for u in users if u.role == "Admin"]
    
    for _ in range(200):
        attack_type = random.choice(attack_types)
        days_ago = random.randint(0, 7)
        hour = random.choice([0, 1, 2, 3, 4, 22, 23]) # mostly off-hours
        timestamp = recent_start_date + datetime.timedelta(days=days_ago)
        timestamp = timestamp.replace(hour=hour, minute=random.randint(0, 59))
        
        if attack_type == "Insider Data Theft":
            target_user = random.choice(employee_users)
            # Create a massive download file log
            download_size = random.randint(500, 2000) * 1024 * 1024  # 500MB to 2GB
            log = FileLog(
                user_id=target_user.id,
                timestamp=timestamp,
                filepath=f"/restricted/database_exports/customer_dump_{random.randint(100, 999)}.csv.gz",
                file_size_bytes=download_size,
                action="Read"
            )
            db.add(log)
            db.flush()
            
            # Record high risk score and alert
            risk_score = random.randint(81, 95)
            risk = RiskScore(
                user_id=target_user.id,
                score=risk_score,
                status="Critical",
                factors=["Download volume significantly exceeded user's baseline", "Access to restricted filepath"],
                timestamp=timestamp
            )
            db.add(risk)
            
            alert = Alert(
                user_id=target_user.id,
                title="Insider Data Theft Detected",
                description=f"User {target_user.username} downloaded {download_size // (1024*1024)}MB of data from a restricted path.",
                risk_score=risk_score,
                severity="Critical",
                is_resolved=random.random() < 0.6,
                timestamp=timestamp,
                ip_address=random.choice(target_user.behavior_profile.known_ips) if target_user.behavior_profile.known_ips else "192.168.1.15",
                country="United States",
                device_id=random.choice(target_user.behavior_profile.known_devices) if target_user.behavior_profile.known_devices else "dev-wks-01"
            )
            db.add(alert)
            
        elif attack_type == "Privilege Escalation":
            target_user = random.choice(employee_users)
            # Standard employee accessing payroll
            log = DatabaseQuery(
                user_id=target_user.id,
                timestamp=timestamp,
                database_name="payroll",
                query_string="SELECT * FROM salaries WHERE employee_tier = 'executive'",
                rows_returned=500
            )
            db.add(log)
            db.flush()
            
            risk_score = random.randint(75, 88)
            risk = RiskScore(
                user_id=target_user.id,
                score=risk_score,
                status="High",
                factors=["Sensitive database accessed (payroll)", "Unauthorized database query execution"],
                timestamp=timestamp
            )
            db.add(risk)
            
            alert = Alert(
                user_id=target_user.id,
                title="Unauthorized Database Access",
                description=f"Standard Employee {target_user.username} queried database 'payroll' without authorization.",
                risk_score=risk_score,
                severity="High",
                is_resolved=random.random() < 0.6,
                timestamp=timestamp,
                ip_address=random.choice(target_user.behavior_profile.known_ips) if target_user.behavior_profile.known_ips else "192.168.1.15",
                country="United States",
                device_id=random.choice(target_user.behavior_profile.known_devices) if target_user.behavior_profile.known_devices else "dev-wks-01"
            )
            db.add(alert)
            
        elif attack_type == "Credential Compromise":
            target_user = random.choice(employee_users)
            # 5 failed logins, then 1 successful login from unknown IP & device at night
            compromise_ip = generate_anomalous_ip()
            compromise_dev = generate_device_id()
            
            for f in range(5):
                fail_log = LoginLog(
                    user_id=target_user.id,
                    timestamp=timestamp - datetime.timedelta(minutes=10 - f),
                    ip_address=compromise_ip,
                    device_id=compromise_dev,
                    country="Russian Federation",
                    is_success=False,
                    failure_reason="Incorrect password"
                )
                db.add(fail_log)
                
            succ_log = LoginLog(
                user_id=target_user.id,
                timestamp=timestamp,
                ip_address=compromise_ip,
                device_id=compromise_dev,
                country="Russian Federation",
                is_success=True
            )
            db.add(succ_log)
            db.flush()
            
            risk_score = random.randint(85, 100)
            risk = RiskScore(
                user_id=target_user.id,
                score=risk_score,
                status="Critical",
                factors=["Multiple failed login attempts", "Login from unknown IP and device", "Access from unusual country (Russian Federation)"],
                timestamp=timestamp
            )
            db.add(risk)
            
            alert = Alert(
                user_id=target_user.id,
                title="Credential Compromise / Brute Force",
                description=f"Brute force attempt succeeded. Successful login for {target_user.username} from Russian Federation after 5 failures.",
                risk_score=risk_score,
                severity="Critical",
                is_resolved=random.random() < 0.6,
                timestamp=timestamp,
                ip_address=compromise_ip,
                country="Russian Federation",
                device_id=compromise_dev
            )
            db.add(alert)
            
        elif attack_type == "Malicious Admin":
            target_user = random.choice(admin_users) if admin_users else users[0]
            # Admin querying audit logs and clearing records
            log = DatabaseQuery(
                user_id=target_user.id,
                timestamp=timestamp,
                database_name="audit_logs_db",
                query_string="DELETE FROM system_audit WHERE timestamp < NOW()",
                rows_returned=10000
            )
            db.add(log)
            db.flush()
            
            audit = AuditLog(
                actor_id=target_user.id,
                action="clear_audit_logs",
                target="system_audit",
                timestamp=timestamp,
                ip_address=random.choice(target_user.behavior_profile.known_ips)
            )
            db.add(audit)
            
            risk_score = random.randint(80, 95)
            risk = RiskScore(
                user_id=target_user.id,
                score=risk_score,
                status="Critical",
                factors=["Suspicious query executed on audit logs database", "Attempt to clear audit trails"],
                timestamp=timestamp
            )
            db.add(risk)
            
            alert = Alert(
                user_id=target_user.id,
                title="Malicious Admin Activity",
                description=f"Admin {target_user.username} attempted to delete system audit log records.",
                risk_score=risk_score,
                severity="Critical",
                is_resolved=random.random() < 0.6,
                timestamp=timestamp,
                ip_address=random.choice(target_user.behavior_profile.known_ips) if target_user.behavior_profile.known_ips else "192.168.10.2",
                country="United States",
                device_id=random.choice(target_user.behavior_profile.known_devices) if target_user.behavior_profile.known_devices else "dev-admin-01"
            )
            db.add(alert)
            
        attacks_count += 1
        
    db.commit()
    print(f"Generated {attacks_count} attack events.")

    # 7. Train and Save Isolation Forest Model
    print("Preparing training features from normal events...")
    
    # Extract features for all normal login logs (excluding failed logins or extreme off-hours)
    # We will read them back from DB to construct the dataset
    db_logins = db.query(LoginLog).all()
    db_files = db.query(FileLog).all()
    db_queries = db.query(DatabaseQuery).all()
    
    features_list = []
    
    # We build standard training observations
    # Map each login log
    for login in db_logins[:3000]:  # Limit size for speed
        u_profile = db.query(BehaviorProfile).filter(BehaviorProfile.user_id == login.user_id).first()
        if not u_profile:
            continue
        
        hour = login.timestamp.hour
        is_unknown_device = login.device_id not in u_profile.known_devices
        is_unknown_ip = login.ip_address not in u_profile.known_ips
        
        # Build features
        features_list.append({
            "hour_of_day": hour,
            "is_unknown_device": 1 if is_unknown_device else 0,
            "is_unknown_ip": 1 if is_unknown_ip else 0,
            "download_size_mb": 0.0,
            "is_sensitive_db": 0,
            "consecutive_failures": 0 if login.is_success else 1
        })
        
    # Map file logs
    for f in db_files[:1500]:
        u_profile = db.query(BehaviorProfile).filter(BehaviorProfile.user_id == f.user_id).first()
        if not u_profile:
            continue
        
        hour = f.timestamp.hour
        download_mb = f.file_size_bytes / (1024*1024)
        
        features_list.append({
            "hour_of_day": hour,
            "is_unknown_device": 0,
            "is_unknown_ip": 0,
            "download_size_mb": download_mb,
            "is_sensitive_db": 0,
            "consecutive_failures": 0
        })
        
    # Map queries
    for q in db_queries[:800]:
        hour = q.timestamp.hour
        is_sensitive = q.database_name in ["payroll", "core_ledger", "hr_db"]
        
        features_list.append({
            "hour_of_day": hour,
            "is_unknown_device": 0,
            "is_unknown_ip": 0,
            "download_size_mb": 0.0,
            "is_sensitive_db": 1 if is_sensitive else 0,
            "consecutive_failures": 0
        })
        
    # Train Isolation Forest on normal behavior
    df = pd.DataFrame(features_list)
    print(f"Dataset shape for training: {df.shape}")
    
    print("Training Isolation Forest model...")
    model = train_isolation_forest(df)
    
    # Save the model
    save_model(model)
    
    print("Database seeding and AI model training complete!")
    db.close()

if __name__ == "__main__":
    seed_database()
