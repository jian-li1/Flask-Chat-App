from flask import Blueprint, render_template, redirect, url_for, request, jsonify, session
from flask_login import login_required, current_user
from .models import Account, Chat, Message, Member
from . import db
from time import time

views = Blueprint("views", __name__)
load_msg_limit = 20

def full_name(user):
    return f"{user.first_name} {user.last_name}"

@views.after_request
def add_cache_control(response):
    response.headers["Cache-Control"] = "private, no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@views.route("/")
@login_required
def index():
    return redirect(url_for("views.chat"))

@views.route("/chat", methods=["GET", "POST"])
@login_required
def chat(chat_id=None):
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return {}
    contacts = Member.query.filter(\
        Member.chat_id.in_(Member.query.filter_by(user_id=current_user.id).with_entities(Member.chat_id).scalar_subquery()), \
        Member.user_id != current_user.id).order_by(Member.chat_id.desc()).all()
    
    data = {"users": []}
    for contact in contacts:
        latest_msg = Message.query.filter(Message.chat_id == contact.chat_id, Message.user_id == current_user.id).order_by(Message.date_created.desc()).first()
        if not latest_msg:
            continue
        data["users"].append({"name": full_name(contact.user), "chat_id": str(contact.chat_id), "last_msg": latest_msg.content, "last_msg_datetime": latest_msg.date_created})

    data["users"].sort(key=lambda x: x["last_msg_datetime"], reverse=True)
    
    return render_template("chat.html", user=current_user, contacts=data, current_chat=str(chat_id))

@views.route("/chat/add-user", methods=["POST"])
@login_required
def search_user():
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        search = request.form.get("search")
        users = {"result": []}
        if not search or search == "":
            return jsonify(users)

        result = Account.query.filter(Account.username.ilike(f"%{search}%"), Account.username != current_user.username).limit(20).all()
        for user in result:
            users["result"].append({"name": full_name(user), "username": user.username})

        return jsonify(users)
    return {}, 403

@views.route("/start-chat", methods=["POST"])
@login_required
def start_chat():
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        username = request.form.get("username")
        selected_user = Account.query.filter_by(username=username).first()
        if not selected_user or str(username) == current_user.username:
            return {}, 400
        
        chat = Chat.query.filter(\
            Chat.id.in_(Member.query.filter_by(user_id=selected_user.id).with_entities(Member.chat_id).scalar_subquery()),\
            Chat.id.in_(Member.query.filter_by(user_id=current_user.id).with_entities(Member.chat_id).scalar_subquery())).first()
        
        data = {
            "name": full_name(selected_user),
            "new_chat": True  
        }

        if chat:
            data["chat_id"] = chat.id
            data["new_chat"] = False
            print("Chat already exists")
            return jsonify(data)
        
        new_chat = Chat(type="DM")
        db.session.add(new_chat)
        db.session.commit()
        for user in [current_user, selected_user]:
            member = Member(user_id=user.id, chat_id=new_chat.id)
            db.session.add(member)
            db.session.commit()
        data["chat_id"] = new_chat.id
            
        print("New chat created")
        return jsonify(data)
    return {}, 403

@views.route("/delete-chat", methods=["POST"])
@login_required
def delete_chat():
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        chat_id = request.form.get("chat_id")
        member = Member.query.filter(Member.chat_id == chat_id, Member.user_id == current_user.id).first()

        if not member:
            return {}, 400

        messages = Message.query.filter(Message.chat_id == member.chat_id, Message.user_id == member.user_id).all()
        if not messages:
            return {}

        for msg in messages:
            db.session.delete(msg)
        db.session.commit()
        
        print(f"{full_name(current_user)} deleted Chat {member.chat_id}")
        return {}
    return {}, 403

@views.route("/chat/<int:chat_id>")
@login_required
def chat_room(chat_id):
    valid_chat = Member.query.filter_by(user_id=current_user.id, chat_id=chat_id).first()
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        if not valid_chat:
            return {}, 400
        msg_count = Message.query.filter_by(chat_id=chat_id, user_id=current_user.id).count()
        session["msg_range_high"] = msg_count
        session["msg_range_low"] = max(session["msg_range_high"]-load_msg_limit, 0)

        return load_msg(chat_id)
    if not valid_chat:
        return redirect(url_for("views.chat"))
    return chat(chat_id)

@views.route("/load-msg/<int:chat_id>")
@login_required
def load_msg(chat_id):
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        recipient = Member.query.filter(Member.user_id != current_user.id, Member.chat_id == chat_id).first()
        messages = Message.query.filter_by(chat_id=chat_id, user_id=current_user.id).order_by(Message.date_created).slice(session["msg_range_low"], session["msg_range_high"]).all() or []

        data = {
            "chat_id": chat_id,
            "recipient": {
                "name": full_name(recipient.user),
                "user_id": recipient.user.id
            },
            "messages": []
        }

        for msg in messages:
            msg_data = {
                "name": full_name(msg.user), 
                "username": msg.user.username, 
                "text": msg.content, 
                "datetime": msg.date_created
            }

            msg_data["user_role"] = "sender" if msg.sender_id == current_user.id else "recipient"
            data["messages"].append(msg_data)
        
        # print(session["msg_range_low"], session["msg_range_high"])
        session["msg_range_high"] = max(session["msg_range_high"]-load_msg_limit, 0)
        session["msg_range_low"] = max(session["msg_range_low"]-load_msg_limit, 0)
        data["all_msg_loaded"] = session["msg_range_high"] == session["msg_range_low"]
        # print(session["msg_range_low"], session["msg_range_high"])
        
        return jsonify(data)
    return chat(chat_id)