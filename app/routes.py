from flask import request, Flask, jsonify
from app.auth import authenticate_user
from app.db import get_db_connection
from datetime import datetime, timedelta
import bcrypt
from app.token_utils import generate_token
from app.token_utils import validate_token as verify_token
from datetime import datetime

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

    @app.route('/api/shifts', methods=['GET'])
    def get_shifts():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT sa.id as shift_id, sa.date, sa.shift_type, sa.start_time, sa.end_time,
                GROUP_CONCAT(u.username ORDER BY u.username SEPARATOR ', ') AS employees
            FROM shift_assignments sa
            LEFT JOIN shift_employee_map sem ON sa.id = sem.shift_id
            LEFT JOIN users u ON sem.employee_id = u.id
            GROUP BY sa.id
            ORDER BY sa.date, sa.start_time;
        """
        cursor.execute(query)
        results = cursor.fetchall()

        shift_colors = {
            "morning": "#28a745",   # green
            "evening": "#ffc107",   # yellow
            "night": "#007bff"      # blue
        }

        shifts = []
        for row in results:
            # Ensure both times are strings before parsing
            start_time_obj = datetime.strptime(str(row['start_time']), "%H:%M:%S").time()
            end_time_obj = datetime.strptime(str(row['end_time']), "%H:%M:%S").time()

            # row['date'] is already a datetime.date object from MySQL
            shift_date = row['date']

            start_datetime = datetime.combine(shift_date, start_time_obj)

            if row['shift_type'] == "night" and end_time_obj < start_time_obj:
                # Ends next day
                end_datetime = datetime.combine(shift_date + timedelta(days=1), end_time_obj)
            else:
                end_datetime = datetime.combine(shift_date, end_time_obj)

            shifts.append({
                "id": row["shift_id"],
                "title": f"{row['shift_type'].capitalize()} Shift - {row['employees'] or 'No One'}",
                "start": start_datetime.strftime("%Y-%m-%dT%H:%M:%S"),
                "end": end_datetime.strftime("%Y-%m-%dT%H:%M:%S"),
                "backgroundColor": shift_colors.get(row['shift_type'], "#6c757d"),
                "borderColor": shift_colors.get(row['shift_type'], "#6c757d"),
                "textColor": "#fff"
            })
        return jsonify(shifts)
    
    @app.route('/api/user_shifts/<int:user_id>', methods=['GET'])
    def get_user_shifts(user_id):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
        SELECT sa.id, sa.date, sa.shift_type, sa.start_time, sa.end_time
        FROM shift_assignments sa
        JOIN shift_employee_map sem ON sa.id = sem.shift_id
        WHERE sem.employee_id = %s AND sa.date >= CURDATE()
        ORDER BY sa.date, sa.start_time
        """
        cursor.execute(query, (user_id,))
        raw_shifts = cursor.fetchall()

        # Convert timedelta and date to string
        shifts = []
        for shift in raw_shifts:
            shifts.append({
                "id": shift["id"],
                "date": shift["date"].strftime("%Y-%m-%d"),  # convert date object to string
                "shift_type": shift["shift_type"],
                "start_time": str(timedelta(seconds=shift["start_time"].total_seconds()))[:-3],  # HH:MM
                "end_time": str(timedelta(seconds=shift["end_time"].total_seconds()))[:-3],      # HH:MM
            })

        return jsonify(shifts)

