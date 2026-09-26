from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    request = Column(Text, nullable=False)
    entity_id = Column(String(100), nullable=False)
    market = Column(String(100), nullable=True)
    as_of_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    state_json = Column(Text, nullable=False)
    final_report = Column(Text, nullable=True)
    status = Column(String(50), default="completed", nullable=False)

    user = relationship("User", back_populates="analysis_records")

    def __repr__(self):
        return f"<AnalysisRecord id='{self.id}' entity_id='{self.entity_id}' user_id={self.user_id}>"
