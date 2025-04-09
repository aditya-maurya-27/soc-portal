from flask import request, jsonify
from app.auth import authenticate_user
from app.db import get_db_connection
import bcrypt
from app.token_utils import generate_token
from app.token_utils import validate_token as verify_token

def setup_routes(app):
    @app.route("/")
    def home():
        return jsonify({"message": "API is running!"})
    
    @app.route("/api/login", methods=["POST", "OPTIONS"])
    def login():
        if request.method == "OPTIONS":
            return jsonify({'message': 'CORS preflight response'}), 200

        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        user = authenticate_user(username, password)
        if user:
            print("Login successful:", username)
            token = generate_token(username)
            return jsonify({
                "message": "Login successful!",
                "token": token,
                "username": user["username"],   # ✅ send username
                "user_id": user["id"]           # ✅ send user_id
            }), 200
        else:
            print("Login failed:", username)
            return jsonify({"error": "Invalid credentials"}), 401

    @app.route("/api/register", methods=["POST"])
    def register():
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        existing_user = cursor.fetchone()

        if existing_user:
            conn.close()
            return jsonify({"error": "Username already taken"}), 409
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') 
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_password))
        conn.commit()
        conn.close()

        return jsonify({"message": "Registration successful!"}), 201

    @app.route("/api/users", methods=["GET"])
    def get_users():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username FROM users")
        users = cursor.fetchall()
        conn.close()
        return jsonify(users)
    
    @app.route("/api/validate", methods=["GET"])
    def validate_token():
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid token"}), 401

        token = auth_header.split(" ")[1]
        username = verify_token(token)

        if username:
            return jsonify({"message": "Token is valid", "username": username}), 200
        else:
            return jsonify({"error": "Invalid or expired token"}), 401
