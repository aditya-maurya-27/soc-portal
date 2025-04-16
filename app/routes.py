from flask import request, Flask, jsonify
from app.auth import authenticate_user
from app.db import get_db_connection
from datetime import datetime, timedelta
import bcrypt
import mysql.connector
import pandas as pd
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
                "username": user["username"],
                "user_id": user["id"],
                "role": user["role"] 
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
                "date": shift["date"].strftime("%Y-%m-%d"), 
                "shift_type": shift["shift_type"],
                "start_time": str(timedelta(seconds=shift["start_time"].total_seconds()))[:-3],  
                "end_time": str(timedelta(seconds=shift["end_time"].total_seconds()))[:-3],  
            })

        return jsonify(shifts)

    @app.route("/api/analysts")
    def get_analysts():
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, username FROM users WHERE role = 'analyst'")
            analysts = cur.fetchall()
            result = []

            if analysts:
                result = [{"id": a[0], "username": a[1]} for a in analysts]

            return jsonify(result)

        except Exception as e:
            print("Error fetching analysts:", e)
            return jsonify({"error": "Failed to fetch analysts"}), 500

        finally:
            if conn:
                conn.close()

    @app.route('/api/create_shift', methods=['POST'])
    def create_shift():
        data = request.get_json()
        date = data.get("date")
        shift_type = data.get("shift_type")
        employee_ids = data.get("employee_ids")

        shift_times = {
            "morning": ("08:00:00", "16:00:00"),
            "evening": ("16:00:00", "00:00:00"),
            "night": ("00:00:00", "08:00:00"),
        }

        if shift_type not in shift_times:
            return jsonify({"error": "Invalid shift type"}), 400

        start_time, end_time = shift_times[shift_type]

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Check if a shift already exists for that date and shift_type
            cursor.execute("""
                SELECT id FROM shift_assignments
                WHERE date = %s AND shift_type = %s
            """, (date, shift_type))
            existing_shift = cursor.fetchone()

            if existing_shift:
                shift_id = existing_shift[0]
            else:
                # Create a new shift only if it doesn't exist
                cursor.execute("""
                    INSERT INTO shift_assignments (date, shift_type, start_time, end_time)
                    VALUES (%s, %s, %s, %s)
                """, (date, shift_type, start_time, end_time))
                conn.commit()
                shift_id = cursor.lastrowid

            # Now link each employee to the shift (if not already linked)
            for emp_id in employee_ids:
                cursor.execute("""
                    SELECT 1 FROM shift_employee_map
                    WHERE shift_id = %s AND employee_id = %s
                """, (shift_id, emp_id))
                already_assigned = cursor.fetchone()

                if not already_assigned:
                    cursor.execute("""
                        INSERT INTO shift_employee_map (shift_id, employee_id)
                        VALUES (%s, %s)
                    """, (shift_id, emp_id))

            conn.commit()

            return jsonify({"message": "Shift updated successfully", "shift_id": shift_id}), 200

        except mysql.connector.Error as err:
            conn.rollback()
            return jsonify({"error": str(err)}), 500



    # Edit Route
    @app.route('/api/edit_shift', methods=['PUT'])
    def edit_shift():
        data = request.get_json()
        shift_id = data.get('shift_id')
        date = data.get('date')  # format: 'YYYY-MM-DD'
        shift_type = data.get('shift_type')  # e.g., 'morning'
        new_employee_id = data.get('employee_id')  # new employee reassignment

        if not all([shift_id, date, shift_type, new_employee_id]):
            return jsonify({'error': 'Missing required parameters'}), 400

        # Define start/end times for shift types
        shift_times = {
            'morning': ('08:00:00', '16:00:00'),
            'evening': ('16:00:00', '00:00:00'),
            'night': ('00:00:00', '08:00:00'),
        }
        if shift_type not in shift_times:
            return jsonify({'error': 'Invalid shift type'}), 400

        start_time, end_time = shift_times[shift_type]

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Update shift_assignments
            cursor.execute("""
                UPDATE shift_assignments
                SET date = %s,
                    shift_type = %s,
                    start_time = %s,
                    end_time = %s
                WHERE id = %s
            """, (date, shift_type, start_time, end_time, shift_id))

            # Update assigned employee
            cursor.execute("""
                UPDATE shift_employee_map
                SET employee_id = %s
                WHERE shift_id = %s
            """, (new_employee_id, shift_id))

            conn.commit()
            conn.close()

            return jsonify({'message': 'Shift updated and reassigned successfully'}), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    

    # Delete Route
    @app.route('/api/delete_shift', methods=['DELETE'])
    def delete_shift():
        data = request.get_json()
        shift_id = data.get('shift_id')

        if not shift_id:
            return jsonify({'error': 'Missing shift_id'}), 400

        try:
            conn=get_db_connection()
            cursor=conn.cursor()

            # First delete from dependent table
            cursor.execute("DELETE FROM shift_employee_map WHERE shift_id = %s", (shift_id,))

            # Then delete the shift itself
            cursor.execute("DELETE FROM shift_assignments WHERE id = %s", (shift_id,))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Shift deleted successfully'}), 200

        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
    @app.route("/api/clients", methods=["GET"])
    def get_clients():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM clients")
        return jsonify(cursor.fetchall())

    @app.route("/api/client-assets", methods=["GET"])
    def get_assets():
        conn = get_db_connection()
        cursor = conn.cursor()
        client_id = request.args.get("client")
        cursor.execute("SELECT * FROM client_assets WHERE client_id = %s", (client_id,))
        return jsonify(cursor.fetchall())

    @app.route("/api/escalation-matrix", methods=["GET"])
    def get_escalation():
        conn = get_db_connection()
        cursor = conn.cursor()
        client_id = request.args.get("client")
        cursor.execute("SELECT * FROM escalation_matrix WHERE client_id = %s", (client_id,))
        return jsonify(cursor.fetchall())
    
    @app.route('/api/kb-search', methods=['GET'])
    def search():
        query = request.args.get('query', '').strip()
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            if not query:
                cursor.execute("SELECT id, entity_name, asset, itsm_ref, asset_details, status, reason, context, remarks FROM knowledge_base")
                results = cursor.fetchall()
                return jsonify(results)

            words = query.split()
            conditions = []
            params = []

            for word in words:
                conditions.append(
                    "("
                    "CAST(id AS CHAR) LIKE %s OR "
                    "entity_name LIKE %s OR "
                    "asset LIKE %s OR "
                    "itsm_ref LIKE %s OR "
                    "asset_details LIKE %s OR "
                    "status LIKE %s OR "
                    "reason LIKE %s OR "
                    "context LIKE %s OR "
                    "remarks LIKE %s"
                    ")"
                )
                for _ in range(9):
                    params.append(f"%{word}%")

            where_clause = " AND ".join(conditions)
            sql = f"""
                SELECT id, entity_name, asset, itsm_ref, asset_details,
                    status, reason, context, remarks
                FROM knowledge_base
                WHERE {where_clause}
            """
            cursor.execute(sql, params)
            results = cursor.fetchall()
            return jsonify(results)

        finally:
            cursor.close()
            conn.close()

    
    @app.route('/api/kb_table-add', methods=['POST'])
    def add_kb_entry():
        try:
            data = request.get_json()

            required_fields = [
                'entity_name', 'asset', 'itsm_ref', 'asset_details',
                'status', 'reason', 'context', 'remarks'
            ]

        # Check for missing fields
            if not all(field in data and data[field] for field in required_fields):
                return jsonify({"message": "All fields are required."}), 400

            conn = get_db_connection()
            cursor = conn.cursor()

            insert_query = """
                INSERT INTO knowledge_base (
                    entity_name, asset, itsm_ref, asset_details,
                    status, reason, context, remarks
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """

            values = (
                data['entity_name'],
                data['asset'],
                data['itsm_ref'],
                data['asset_details'],
                data['status'],
                data['reason'],
                data['context'],
                data['remarks']
            )

            cursor.execute(insert_query, values)
            conn.commit()

            return jsonify({"message": "Entry added successfully!"}), 201

        except Exception as e:
            print("Error adding entry:", str(e))
            return jsonify({"message": str(e)}), 500

        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

        
    @app.route('/api/kb_table-import', methods=['POST'])
    def import_data():
        if 'file' not in request.files:
            return jsonify({"message": "No file part in the request"}), 400

        file = request.files['file']
        if file.filename == "":
            return jsonify({"message": "No file selected"}), 400

        try:
            filename = file.filename.lower()
            if filename.endswith('.csv'):
                df = pd.read_csv(file)
            elif filename.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file)
            else:
                return jsonify({"message": "Unsupported file type"}), 400

            required_columns = [
                'entity_name', 'asset', 'itsm_ref', 'asset_details',
                'status', 'reason', 'context', 'remarks'
            ]
            if not all(col in df.columns for col in required_columns):
                return jsonify({
                    "message": f"Missing required columns. Expected: {', '.join(required_columns)}"
                }), 400

            conn = get_db_connection()
            cursor = conn.cursor()

            insert_query = """
                INSERT INTO knowledge_base (
                entity_name, asset, itsm_ref, asset_details,
                status, reason, context, remarks
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """

            for index, row in df.iterrows():
                try:
                    values = (
                        row['entity_name'],
                        row['asset'],
                        row['itsm_ref'],
                        row['asset_details'],
                        row['status'],
                        row['reason'],
                        row['context'],
                        row['remarks']
                    )
                    cursor.execute(insert_query, values)
                    print(f"Inserted row {index}: {values}")
                except Exception as insert_error:
                    print(f"Error inserting row {index}: {insert_error}")
                    conn.rollback()
                    return jsonify({"message": f"Error inserting row {index}: {str(insert_error)}"}), 500

            conn.commit()
            return jsonify({"message": "Import successful!"}), 200

        except Exception as e:
            conn.rollback()
            print(f"Error: {str(e)}")
            return jsonify({"message": str(e)}), 500

        finally:
            cursor.close()
            conn.close()
