from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db, login_manager

class User(UserMixin, db.Model):
    """User model for authentication and personalization"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    # Relationships
    bookmarks = db.relationship('Bookmark', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    reading_progress = db.relationship('ReadingProgress', backref='user', lazy='dynamic', cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if password matches"""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Quran(db.Model):
    """Quran verses model (maps to existing database)"""
    __tablename__ = 'quoran'

    chapter = db.Column(db.Integer, primary_key=True)
    verse = db.Column(db.Integer, primary_key=True)
    english_content = db.Column(db.Text, nullable=False)
    arabic_content = db.Column(db.Text, nullable=False)
    bookmarked = db.Column(db.String(10), default='False')

    __table_args__ = (
        db.Index('idx_chapter_verse', 'chapter', 'verse'),
    )

    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'id': f'{self.chapter}:{self.verse}',
            'chapter': self.chapter,
            'verse': self.verse,
            'english': self.english_content,
            'arabic': self.arabic_content
        }

    def __repr__(self):
        return f'<Quran {self.chapter}:{self.verse}>'

class Bookmark(db.Model):
    """User bookmarks"""
    __tablename__ = 'bookmarks'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    chapter = db.Column(db.Integer, nullable=False)
    verse = db.Column(db.Integer, nullable=False)
    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'chapter', 'verse', name='unique_user_bookmark'),
        db.Index('idx_user_bookmarks', 'user_id', 'created_at'),
    )

    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'id': self.id,
            'chapter': self.chapter,
            'verse': self.verse,
            'note': self.note,
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<Bookmark User:{self.user_id} {self.chapter}:{self.verse}>'

class ReadingProgress(db.Model):
    """Track user's reading progress"""
    __tablename__ = 'reading_progress'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    chapter = db.Column(db.Integer, nullable=False)
    verse = db.Column(db.Integer, nullable=False)
    last_read = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'chapter', name='unique_user_chapter_progress'),
    )

    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'chapter': self.chapter,
            'verse': self.verse,
            'last_read': self.last_read.isoformat()
        }

    def __repr__(self):
        return f'<Progress User:{self.user_id} {self.chapter}:{self.verse}>'

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID for Flask-Login"""
    return User.query.get(int(user_id))
