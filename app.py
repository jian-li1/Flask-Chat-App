from website import init_app

socketio, app = init_app()

if __name__ == "__main__":
    socketio.run(app, debug=True)