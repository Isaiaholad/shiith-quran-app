from flask import Flask, jsonify, redirect, request, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
from config import config

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()

def create_app(config_name='default'):
    """Application factory pattern"""
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    CORS(app)

    # Configure login manager
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'

    @login_manager.unauthorized_handler
    def handle_unauthorized():
        """Return JSON for API auth failures and redirect browser navigation."""
        if request.path.startswith('/api/') or request.path.startswith('/auth/'):
            return jsonify({'error': 'Authentication required'}), 401

        return redirect(url_for('main.index', login='required', next=request.path))

    # Register blueprints
    from app.routes import main_bp, api_bp, auth_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/auth')

    return app
