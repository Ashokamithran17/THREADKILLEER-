import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Admin, SOC Analyst, Security Manager
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="Active")  # Active, MFA_Required, Suspended, Session_Terminated

    # Relationships
    login_logs = relationship("LoginLog", back_populates="user", cascade="all, delete-orphan")
    file_logs = relationship("FileLog", back_populates="user", cascade="all, delete-orphan")
    db_queries = relationship("DatabaseQuery", back_populates="user", cascade="all, delete-orphan")
    behavior_profile = relationship("BehaviorProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    risk_scores = relationship("RiskScore", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="user", cascade="all, delete-orphan")

class LoginLog(Base):
    __tablename__ = "login_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    ip_address = Column(String, nullable=False)
    device_id = Column(String, nullable=False)
    country = Column(String, nullable=False)
    is_success = Column(Boolean, nullable=False)
    failure_reason = Column(String, nullable=True)

    user = relationship("User", back_populates="login_logs")

class FileLog(Base):
    __tablename__ = "file_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    filepath = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    action = Column(String, nullable=False)  # Read, Write, Delete

    user = relationship("User", back_populates="file_logs")

class DatabaseQuery(Base):
    __tablename__ = "database_queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    database_name = Column(String, nullable=False)
    query_string = Column(String, nullable=False)
    rows_returned = Column(Integer, nullable=False)

    user = relationship("User", back_populates="db_queries")

class BehaviorProfile(Base):
    __tablename__ = "behavior_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    normal_login_start_hour = Column(Integer, default=8)
    normal_login_end_hour = Column(Integer, default=18)
    known_devices = Column(JSON, default=list)  # list of device_ids
    known_ips = Column(JSON, default=list)  # list of IPs or IP networks
    avg_download_size_bytes = Column(Float, default=1024.0 * 1024.0)  # 1MB default
    std_download_size_bytes = Column(Float, default=1024.0 * 1024.0 * 5.0)  # 5MB default
    freq_databases = Column(JSON, default=list)  # list of databases
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="behavior_profile")

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)  # 0 to 100
    status = Column(String, nullable=False)  # Safe, Medium, High, Critical
    factors = Column(JSON, default=list)  # List of strings explaining the score
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="risk_scores")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=False)
    severity = Column(String, nullable=False)  # Low, Medium, High, Critical
    is_resolved = Column(Boolean, default=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    # Origin location and device of the threat
    ip_address = Column(String, nullable=True)
    country = Column(String, nullable=True)
    device_id = Column(String, nullable=True)

    user = relationship("User", back_populates="alerts")

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_identifier = Column(String, nullable=False)
    device_name = Column(String, nullable=False)
    trust_level = Column(String, default="Trusted")  # Trusted, Untrusted
    last_used = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="devices")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=True)  # User ID of the actor (null for system events)
    action = Column(String, nullable=False)  # e.g., 'user_login', 'simulation_triggered'
    target = Column(String, nullable=False)  # target description
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    ip_address = Column(String, nullable=True)
