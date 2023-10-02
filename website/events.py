from . import socketio
from .models import Account, Chat, Message, Member
from flask import request
from flask_login import current_user
from flask_socketio import join_room, leave_room, disconnect, rooms, emit
from .views import full_name
from . import db

# For debug
def print_user(user):
    return f"{user.first_name} {user.last_name} ({user.username})"

def channel(recipient_id):
    return f"user_id_{recipient_id}"

@socketio.on("connect")
def connect():
    if not current_user.is_authenticated:
        disconnect()
        return
    
    room = channel(current_user.id)
    join_room(room)
    print(f"{print_user(current_user)} connected")

@socketio.on("disconnect")
def disconnect_user():
    room = channel(current_user.id)
    leave_room(room)
    print(f"{print_user(current_user)} disconnected")

@socketio.on("new_message")
def message(data):
    chat = Chat.query.filter(\
        Chat.id.in_(Member.query.filter_by(user_id=data["recipient_id"]).with_entities(Member.chat_id).scalar_subquery()),\
        Chat.id.in_(Member.query.filter_by(user_id=current_user.id).with_entities(Member.chat_id).scalar_subquery())).first()

    text = data["text"].strip()
    if not chat or int(chat.id) != data["chat_id"] or text == "":
        print("Invalid request")
        return
    print(f"{print_user(current_user)} said: {text}")

    msg_data = {
        "chat_id": data["chat_id"],
        "name": full_name(current_user),
        "username": current_user.username,
        "text": text,
        "user_role": "recipient"
    }

    db.session.add(Message(chat_id=data["chat_id"], user_id=current_user.id, sender_id=current_user.id, content=text))
    db.session.add(Message(chat_id=data["chat_id"], user_id=data["recipient_id"], sender_id=current_user.id, content=text))
    db.session.commit()
    emit("new_message", msg_data, room=channel(data["recipient_id"])) # To recipient

    msg_data["user_role"] = "sender"
    emit("new_message", msg_data, room=channel(current_user.id)) # To self
