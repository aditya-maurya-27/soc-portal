import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [shifts, setShifts] = useState([]);


  useEffect(() => {
    if (!user?.id) return;

    const fetchShifts = async () => {
      try {
        const response = await fetch(`http://192.168.29.194:5000/api/user_shifts/${user.id}`);
        const data = await response.json();
        setShifts(data);
      } catch (error) {
        console.error("Error fetching user shifts:", error);
      }
    };

    fetchShifts();
  }, [user]);

  return (
    <div className="dashboard-container">
      <div className="header-container">
        <p>Welcome{user?.username ? `, ${user.username}` : ""}!</p>
      </div>
      {!isAdmin && (
        <div className="upcoming-shifts">
          <h3>Your Upcoming Shifts:</h3>
          {shifts.length === 0 ? (
            <p>No upcoming shifts found.</p>
          ) : (
            <ul>
              {shifts.map((shift) => (
                <li key={shift.id}>
                  <strong>{shift.shift_type.charAt(0).toUpperCase() + shift.shift_type.slice(1)} Shift</strong> on{" "}
                  {new Date(shift.date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
