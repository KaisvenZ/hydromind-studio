from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Session

DB_PATH = "hydromind.db"
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False)
    role = Column(String(32), nullable=False, default="observer")  # commander | hydrologist | engineer | observer
    password_hash = Column(String(128), nullable=False)  # plain-text for local dev; replace with bcrypt in prod
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    snapshot_id = Column(String(64), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(32), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "snapshot_id": self.snapshot_id,
            "user_id": self.user_id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
        }


class AuditEntry(Base):
    __tablename__ = "audit_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action_type = Column(String(64), nullable=False)
    detail = Column(Text, default="")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "action_type": self.action_type,
            "detail": self.detail,
            "timestamp": self.timestamp.isoformat(),
        }


def get_session():
    return Session(engine)


def init_db():
    Base.metadata.create_all(engine)
    with get_session() as s:
        if s.query(User).count() == 0:
            defaults = [
                User(username="commander", role="commander", password_hash="hydromind"),
                User(username="hydrologist", role="hydrologist", password_hash="hydromind"),
                User(username="engineer", role="engineer", password_hash="hydromind"),
                User(username="observer", role="observer", password_hash="hydromind"),
            ]
            s.add_all(defaults)
            s.commit()
