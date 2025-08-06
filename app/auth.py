from app.db import get_db_connection

def authenticate_user(username, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, password, role, full_name FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    conn.close()

    if user and user[2] == password:  # Plain-text password comparison
        return {
            "id": user[0],
            "username": user[1],
            "role": user[3],
            "full_name": user[4]
        }

    return None

def register_user(full_name, username, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (full_name, username, password) VALUES (%s, %s, %s)",
            (full_name, username, password)
        )
        conn.commit()
        return True
    except:
        return False
    finally:
        conn.close()
