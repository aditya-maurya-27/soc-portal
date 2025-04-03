from flask import request, jsonify
from app.auth import authenticate_user
from app.db import get_db_connection
import bcrypt

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
        if authenticate_user(username, password):
            print("Login successful: ", username)
            return jsonify({"message": "Login successful!"}), 200
        else:
            print("Login failed: ", username)
            return jsonify({"error": "Invalid credentials"}), 401

    @app.route("/api/register", methods=["POST"])
    def register():
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        # Ensure both username and password are provided
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if the username already exists in the database
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        existing_user = cursor.fetchone()

        if existing_user:
            conn.close()
            return jsonify({"error": "Username already taken"}), 409

        # Hash the password before storing it in the database
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')  # Convert to string for storage

        # Insert the new user into the database
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
