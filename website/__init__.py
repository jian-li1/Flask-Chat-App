from flask import Flask
from flask_session import Session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config
from flask_socketio import SocketIO

db = SQLAlchemy()
socketio = SocketIO()

def init_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    socketio.init_app(app)
    Session(app)

    from .views import views
    from .auth import auth
    from . import events

    app.register_blueprint(views, url_prefix="/")
    app.register_blueprint(auth, url_prefix="/")

    from .models import Account, Chat, Message, Member

    with app.app_context():
        db.create_all()

    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.login_message = ""
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(id):
        return Account.query.get(int(id))

    return socketio, app
