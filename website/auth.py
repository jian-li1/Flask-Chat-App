from flask import Blueprint, render_template, redirect, flash, request, url_for
from .models import Account
from werkzeug.security import generate_password_hash, check_password_hash
from . import db
from flask_login import login_user, logout_user, current_user, login_required

auth = Blueprint("auth", __name__)

@auth.after_request
def add_cache_control(response):
    response.headers["Cache-Control"] = "private, no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@auth.route("/login-submit", methods=["POST"])
def process_login():
    username = request.form.get("username")
    password = request.form.get("password")

    user = Account.query.filter_by(username=username).first()
    if "" in [username, password]:
        flash("Please complete all input fields.", category="error")
    elif not user or not check_password_hash(user.password, password):
        flash("Invalid username or password.", category="error")
    else:
        login_user(user, remember=True)
        return redirect(url_for("views.chat"))

    return redirect(url_for("auth.login", username=username))

@auth.route("/login")
def login():
    logout_user()
    username = request.args.get("username") or ""
    return render_template("login.html", user=current_user, username=username)

@auth.route("/register-submit", methods=["POST"])
def process_register():
    username = request.form.get("username")
    first_name = request.form.get("first-name")
    last_name = request.form.get("last-name")
    password = request.form.get("password")
    confirm_pwd = request.form.get("confirm-password")

    user = Account.query.filter_by(username=username).first()
    if "" in [username, first_name, last_name, password, confirm_pwd]:
        flash("Please complete all input fields.", category="error")
    elif user:
        flash("Username is already taken.", category="error")
    elif " " in username:
        flash("Username must not contain whitespaces.", category="error")
    elif len(username) < 4:
        flash("Username must contain at least 4 characters.", category="error")
    elif password != confirm_pwd:
        flash("Passwords do not match", category="error")
    elif len(password) < 8:
        flash("Password must contain at least 8 characters", category="error")
    else:
        new_user = Account(username=username.lower(), first_name=first_name, last_name=last_name, password=generate_password_hash(password, method="sha256"))
        db.session.add(new_user)
        db.session.commit()
        login_user(new_user, remember=True)
        return redirect(url_for("views.chat"))
    
    return redirect(url_for("auth.register", username=username, first_name=first_name, last_name=last_name))

@auth.route("/register")
def register():
    logout_user()
    username = request.args.get("username") or ""
    first_name = request.args.get("first_name") or ""
    last_name = request.args.get("last_name") or ""
    return render_template("register.html", user=current_user, username=username, first_name=first_name, last_name=last_name)

@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))