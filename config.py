import random
from string import ascii_letters
import sys

if len(sys.argv) < 3:
    raise IndexError("Usage: python app.py <database name> <database password>")

DB_NAME = sys.argv[1]
DB_PASSWORD = sys.argv[2]

def generate_key(length):
    string = ""
    for _ in range(length):
        string += random.choice(ascii_letters)
    return string

class Config:
    SECRET_KEY = generate_key(16)
    SQLALCHEMY_DATABASE_URI = f"postgresql://postgres:{DB_PASSWORD}@localhost/{DB_NAME}"
    SESSION_TYPE = "filesystem"
    SESSION_PERMANENT = False