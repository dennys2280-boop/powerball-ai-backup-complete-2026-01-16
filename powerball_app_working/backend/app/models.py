from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    DateTime,
    Boolean,
    func,
    text,
)

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    draw_date = Column(Date, nullable=False, index=True)

    # PAST / FUTURE (default PAST)
    status = Column(String(20), nullable=False, server_default=text("'PAST'"))

    # Números principales (1–69)
    n1 = Column(Integer, nullable=False)
    n2 = Column(Integer, nullable=False)
    n3 = Column(Integer, nullable=False)
    n4 = Column(Integer, nullable=False)
    n5 = Column(Integer, nullable=False)

    # Powerball (1–26)
    powerball = Column(Integer, nullable=False)

    # QUICK_PICK o MANUAL
    type = Column(String(20), nullable=False)

    # Costo del ticket
    cost = Column(Float, nullable=False, server_default=text("0.0"))

    # Resultados respecto al sorteo oficial
    matched_regular_numbers = Column(Integer, nullable=False, server_default=text("0"))
    matched_powerball = Column(Boolean, nullable=False, server_default=text("0"))
    prize_amount = Column(Float, nullable=False, server_default=text("0.0"))


class DrawResult(Base):
    __tablename__ = "draw_results"

    id = Column(Integer, primary_key=True, index=True)
    draw_date = Column(Date, nullable=False, unique=True, index=True)

    wn1 = Column(Integer, nullable=False)
    wn2 = Column(Integer, nullable=False)
    wn3 = Column(Integer, nullable=False)
    wn4 = Column(Integer, nullable=False)
    wn5 = Column(Integer, nullable=False)

    winning_powerball = Column(Integer, nullable=False)
