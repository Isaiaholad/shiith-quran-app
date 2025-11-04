#!/usr/bin/env python3
"""
Quran Web Application
Run this file to start the Flask development server
"""

import os
from app import create_app, db
from app.models import User, Quran, Bookmark, ReadingProgress

# Create application instance
app = create_app(os.getenv('FLASK_ENV', 'development'))

@app.shell_context_processor
def make_shell_context():
    """Make database models available in Flask shell"""
    return {
        'db': db,
        'User': User,
        'Quran': Quran,
        'Bookmark': Bookmark,
        'ReadingProgress': ReadingProgress
    }

@app.cli.command()
def init_db():
    """Initialize the database"""
    db.create_all()
    print("Database tables created successfully!")

@app.cli.command()
def create_admin():
    """Create an admin user"""
    username = input("Enter username: ")
    email = input("Enter email: ")
    password = input("Enter password: ")

    user = User(username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    print(f"Admin user '{username}' created successfully!")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
