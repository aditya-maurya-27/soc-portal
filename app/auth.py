import bcrypt
from app.db import get_db_connection

def authenticate_user(username, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT password FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    conn.close()
    if user:
        stored_hashed_password = user[0]
        return bcrypt.checkpw(password.encode('utf-8'), stored_hashed_password.encode('utf-8'))
    return False

def register_user(username, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    try:
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_password.decode('utf-8')))
        conn.commit()
        return True
    except:
        return False
    finally:
        conn.close()
