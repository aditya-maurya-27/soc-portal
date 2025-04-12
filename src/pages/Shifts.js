import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "react-modal";
import { useAuth } from "../context/AuthContext";
import "../styles/Shifts.css";

Modal.setAppElement("#root");

const shiftTimeMapping = {
  Morning: { start: "08:00", end: "16:00" },
  Evening: { start: "16:00", end: "23:00" },
  Night: { start: "00:00", end: "08:00" },
};

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

const Shifts = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [comment, setComment] = useState("");
  const [commentsMap, setCommentsMap] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newShiftDate, setNewShiftDate] = useState("");
  const [newShiftType, setNewShiftType] = useState("Morning");
  const [newEmployeeUsername, setNewEmployeeUsername] = useState("");
  const [analysts, setAnalysts] = useState([]);

  const [editShiftType, setEditShiftType] = useState("Morning");
  const [editShiftDate, setEditShiftDate] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");

  useEffect(() => {
    fetch("http://192.168.29.194:5000/api/shifts")
      .then((res) => res.json())
      .then((data) => setShifts(data))
      .catch((err) => console.error("Failed to fetch shifts:", err));

    fetch("http://192.168.29.194:5000/api/analysts")
      .then((res) => res.json())
      .then((data) => setAnalysts(data))
      .catch((err) => console.error("Failed to fetch analysts:", err));
  }, []);

  const handleEventClick = (info) => {
    const shift = info.event;
    setSelectedShift(shift);
    setComment(commentsMap[shift.id] || "");
    if (isAdmin) {
      const date = shift.start.toISOString().slice(0, 10);
      // More robust shift type extraction
      let shiftType = "Morning"; // default
      if (shift.title.includes("Morning")) shiftType = "Morning";
      else if (shift.title.includes("Evening")) shiftType = "Evening";
      else if (shift.title.includes("Night")) shiftType = "Night";
      const employeeName = shift.title.split(" - ")[0];
      const matchedEmp = analysts.find((emp) => emp.username === employeeName);

      setEditShiftType(shiftType);
      setEditShiftDate(date);
      setEditEmployeeId(matchedEmp?.id || "");
    }
    setIsModalOpen(true);
  };

  const isWithinShift = () => {
    if (!selectedShift) return false;
    const now = new Date();
    const start = new Date(selectedShift.start);
    const end = new Date(selectedShift.end);
    return now >= start && now <= end;
  };

  const handleSave = () => {
    if (selectedShift) {
      setCommentsMap((prev) => ({
        ...prev,
        [selectedShift.id]: comment,
      }));
    }
    setIsModalOpen(false);
  };

  const handleAddShift = async () => {
    if (!newEmployeeUsername || !newShiftDate || !newShiftType) {
      alert("Please fill all fields.");
      return;
    }

    const selectedAnalyst = analysts.find(
      (emp) => emp.username === newEmployeeUsername
    );

    if (!selectedAnalyst) {
      alert("Invalid employee selected.");
      return;
    }

    const shiftType = newShiftType.toLowerCase();
    const employeeId = selectedAnalyst.id;

    try {
      const response = await fetch(
        "http://192.168.29.194:5000/api/create_shift",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: newShiftDate,
            shift_type: shiftType,
            employee_id: employeeId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert("Error: " + data.error);
        return;
      }

      const { start, end } = shiftTimeMapping[newShiftType];
      const startDateTime = new Date(`${newShiftDate}T${start}`);
      let endDateTime = new Date(`${newShiftDate}T${end}`);
      if (end === "00:00") {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const newShiftEvent = {
        title: newEmployeeUsername + " - " + newShiftType,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        id: data.shift_id,
      };

      setShifts((prev) => [...prev, newShiftEvent]);
      setIsAddModalOpen(false);
      alert("Shift created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create shift.");
    }
  };

  const handleEditShift = async () => {
    try {
      const shiftType = editShiftType.toLowerCase(); // ✅ lowercase for backend
      const shiftId = selectedShift.id;

      const response = await fetch(
        "http://192.168.29.194:5000/api/edit_shift",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shift_id: shiftId,
            date: editShiftDate,
            shift_type: shiftType,
            employee_id: editEmployeeId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert("Error: " + result.error);
        return;
      }

      const newUsername =
        analysts.find((emp) => emp.id === editEmployeeId)?.username ||
        selectedShift.title.split(" - ")[0];

      const { start, end } = shiftTimeMapping[capitalize(shiftType)];
      const startDateTime = new Date(`${editShiftDate}T${start}`);
      let endDateTime = new Date(`${editShiftDate}T${end}`);
      if (end === "00:00") {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const updatedShifts = shifts.map((shift) =>
        shift.id === shiftId
          ? {
              ...shift,
              title: newUsername + " - " + capitalize(shiftType),
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
            }
          : shift
      );

      setShifts(updatedShifts);
      setIsModalOpen(false);
      alert("Shift updated successfully!");
    } catch (err) {
      console.log(err);
      console.error(err);
      alert("Failed to edit shift.");
    }
  };

  const handleDeleteShift = async () => {
    try {
      const response = await fetch(
        "http://192.168.29.194:5000/api/delete_shift",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shift_id: selectedShift.id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert("Error: " + result.error);
        return;
      }

      setShifts((prev) => prev.filter((shift) => shift.id !== selectedShift.id));
      setIsModalOpen(false);
      alert("Shift deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete shift.");
    }
  };

  return (
    <div className="shifts-wrapper">
      {isAdmin && (
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{ marginBottom: "10px" }}
        >
          Add Shift
        </button>
      )}

      <div className="shifts-calendar">
        <FullCalendar
          plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin]}
          allDaySlot={false}
          initialView="timeGridWeek"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          events={shifts}
          editable={false}
          height="auto"
          eventClick={handleEventClick}
          eventDidMount={(info) => {
            info.el.setAttribute("title", info.event.title);
          }}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Shift Details"
        className="modal"
        overlayClassName="overlay"
      >
        {isAdmin ? (
          <>
            <h2>Edit Shift (Admin)</h2>
            <label>Shift Type:</label>
            <select
              value={editShiftType}
              onChange={(e) => setEditShiftType(e.target.value)}
            >
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>

            <label>Date:</label>
            <input
              type="date"
              value={editShiftDate}
              onChange={(e) => setEditShiftDate(e.target.value)}
            />

            <label>Reassign to:</label>
            <select
              value={editEmployeeId}
              onChange={(e) => setEditEmployeeId(e.target.value)}
            >
              <option value="">-- Select Employee --</option>
              {analysts.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.username}
                </option>
              ))}
            </select>

            <div style={{ marginTop: "10px" }}>
              <button onClick={handleEditShift} style={{ marginRight: "10px" }}>
                Save Changes
              </button>
              <button
                onClick={handleDeleteShift}
                style={{ marginRight: "10px", backgroundColor: "red", color: "white" }}
              >
                Delete Shift
              </button>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h2>Analyst Comments</h2>
            <textarea
              rows={10}
              cols={60}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!isWithinShift()}
            />
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={handleSave}
                disabled={!isWithinShift()}
                style={{ marginRight: "10px" }}
              >
                Save
              </button>
              <button onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
            {!isWithinShift() && (
              <p style={{ color: "red", marginTop: "10px" }}>
                You can only edit comments during your shift time.
              </p>
            )}
          </>
        )}
      </Modal>

      {/* Add Shift Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={() => setIsAddModalOpen(false)}
        contentLabel="Add Shift"
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Create Shift</h2>
        <label>Employee (Username):</label>
        <select
          value={newEmployeeUsername}
          onChange={(e) => setNewEmployeeUsername(e.target.value)}
        >
          <option value="">-- Select Employee --</option>
          {analysts.map((emp) => (
            <option key={emp.id} value={emp.username}>
              {emp.username}
            </option>
          ))}
        </select>

        <label>Shift Type:</label>
        <select
          value={newShiftType}
          onChange={(e) => setNewShiftType(e.target.value)}
        >
          <option value="Morning">Morning</option>
          <option value="Evening">Evening</option>
          <option value="Night">Night</option>
        </select>

        <label>Date:</label>
        <input
          type="date"
          value={newShiftDate}
          onChange={(e) => setNewShiftDate(e.target.value)}
        />

        <div style={{ marginTop: "10px" }}>
          <button onClick={handleAddShift} style={{ marginRight: "10px" }}>
            Add Shift
          </button>
          <button onClick={() => setIsAddModalOpen(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

export default Shifts;
