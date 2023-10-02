from . import db
from flask_login import UserMixin
from sqlalchemy.sql import func

class Account(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True) # User ID
    username = db.Column(db.String(150), unique=True)
    first_name = db.Column(db.String(150))
    last_name = db.Column(db.String(150))
    password = db.Column(db.String(150))
    date_created = db.Column(db.DateTime(timezone=True), default=func.now())
    chats = db.relationship("Member", foreign_keys="[Member.user_id]", backref="user")
    messages = db.relationship("Message", foreign_keys="[Message.sender_id]", backref="user")

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True) # Chat ID
    type = db.Column(db.String)
    name = db.Column(db.String(150))

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey("chat.id", ondelete="CASCADE")) # Chat ID associated to the message
    user_id = db.Column(db.Integer, db.ForeignKey("account.id")) # User ID associated to the message
    sender_id = db.Column(db.Integer, db.ForeignKey("account.id")) # User ID of the sender of the message
    content = db.Column(db.String(2500))
    date_created = db.Column(db.DateTime(timezone=True), default=func.now())

class Member(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("account.id"))
    chat_id = db.Column(db.Integer, db.ForeignKey("chat.id", ondelete="CASCADE"))