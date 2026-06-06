"""Foro comunitario y denuncias."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class ForumCategoryType(enum.Enum):
    GENERAL = "general"
    ANNOUNCEMENT = "announcement"
    EVENT = "event"
    POLL = "poll"
    COMPLAINT = "complaint"
    SUGGESTION = "suggestion"


class ForumPostStatus(enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    ARCHIVED = "archived"


class ComplaintSeverity(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ComplaintStatus(enum.Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    CLOSED = "closed"


class ForumCategory(Base):
    __tablename__ = "forum_categories"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    type = Column(Enum(ForumCategoryType, name="forum_category_type"), default=ForumCategoryType.GENERAL)
    description = Column(Text, nullable=True)
    color = Column(String(20), nullable=True)  # accent color
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    posts = relationship("ForumPost", back_populates="category")


class ForumPost(Base):
    __tablename__ = "forum_posts"

    id = Column(Integer, primary_key=True, index=True)
    condominium_id = Column(Integer, ForeignKey("condominiums.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("forum_categories.id"), nullable=True)
    author_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    status = Column(Enum(ForumPostStatus, name="forum_post_status"), default=ForumPostStatus.OPEN)
    pinned = Column(Boolean, default=False)
    likes_count = Column(Integer, default=0)
    replies_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("ForumCategory", back_populates="posts")
    replies = relationship("ForumReply", back_populates="post", cascade="all, delete-orphan")
    complaint = relationship("ComplaintCase", back_populates="post", uselist=False, cascade="all, delete-orphan")


class ForumReply(Base):
    __tablename__ = "forum_replies"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False)
    parent_reply_id = Column(Integer, ForeignKey("forum_replies.id"), nullable=True)
    author_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    body = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("ForumPost", back_populates="replies")


class ForumLike(Base):
    __tablename__ = "forum_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=True)
    reply_id = Column(Integer, ForeignKey("forum_replies.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ComplaintCase(Base):
    """Caso formal asociado a un post de denuncia."""
    __tablename__ = "complaint_cases"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False, unique=True)
    severity = Column(Enum(ComplaintSeverity, name="complaint_severity"), default=ComplaintSeverity.MEDIUM)
    status = Column(Enum(ComplaintStatus, name="complaint_status"), default=ComplaintStatus.OPEN)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("ForumPost", back_populates="complaint")
