import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Compatibilidad: SQLAlchemy 2.x (DeclarativeBase) y 1.4 (declarative_base)
try:
    from sqlalchemy.orm import DeclarativeBase  # SQLAlchemy 2.x

    class Base(DeclarativeBase):
        pass

except Exception:
    from sqlalchemy.orm import declarative_base  # SQLAlchemy 1.4

    Base = declarative_base()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./powerball.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
