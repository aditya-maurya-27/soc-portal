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
  Night: { start: "00:00", end: "08:00" },
  Morning: { start: "08:00", end: "16:00" },
  Evening: { start: "16:00", end: "24:00" },
};

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
  const [newShiftType, setNewShiftType] = useState("Night");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [analysts, setAnalysts] = useState([]);

  const [editShiftType, setEditShiftType] = useState("Night");
  const [editShiftDate, setEditShiftDate] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");

  const fetchShifts = () => {
    fetch("http://192.168.29.194:5000/api/shifts")
      .then((res) => res.json())
      .then((data) => setShifts(data))
      .catch((err) => console.error("Failed to fetch shifts:", err));
  };

  useEffect(() => {
    fetchShifts();
    fetch("http://192.168.29.194:5000/api/analysts")
      .then((res) => res.json())
      .then((data) => setAnalysts(data))
      .catch((err) => console.error("Failed to fetch analysts:", err));
  }, []);

  const handleEmployeeToggle = (username) => {
    setSelectedEmployees((prev) =>
      prev.includes(username)
        ? prev.filter((u) => u !== username)
        : [...prev, username]
    );
  };

  const handleEventClick = (info) => {
    const shift = info.event;
    setSelectedShift(shift);
    setComment(commentsMap[shift.id] || "");

    if (isAdmin) {
      const date = shift.start.toISOString().slice(0, 10);
      let shiftType = "Morning";
      if (shift.title.includes("Morning")) shiftType = "Morning";
      else if (shift.title.includes("Evening")) shiftType = "Evening";
      else if (shift.title.includes("Night")) shiftType = "Night";

      const firstEmp = shift.title.split(" - ")[0];
      const matchedEmp = analysts.find((emp) => emp.username === firstEmp);

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
    if (selectedEmployees.length === 0 || !newShiftDate || !newShiftType) {
      alert("Please fill all fields.");
      return;
    }

    const { start, end } = shiftTimeMapping[newShiftType];
    const startDateTime = new Date(`${newShiftDate}T${start}`);
    let endDateTime = new Date(`${newShiftDate}T${end}`);
    if (end === "00:00") {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const selectedEmployeeObjects = analysts.filter((emp) =>
      selectedEmployees.includes(emp.username)
    );

    try {
      for (let emp of selectedEmployeeObjects) {
        const response = await fetch(
          "http://192.168.29.194:5000/api/create_shift",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: newShiftDate,
              shift_type: newShiftType.toLowerCase(),
              employee_ids: [emp.id],
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          alert("Error: " + data.error);
          return;
        }
      }

      fetchShifts();
      alert("Shift(s) created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create shift.");
    }

    setIsAddModalOpen(false);
    setSelectedEmployees([]);
  };

  const handleEditShift = async () => {
    try {
      const shiftId = selectedShift.id;

      const { start, end } = shiftTimeMapping[editShiftType];
      const startDateTime = new Date(`${editShiftDate}T${start}`);
      let endDateTime = new Date(`${editShiftDate}T${end}`);
      if (end === "00:00") {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const selectedUsername =
        analysts.find((emp) => emp.id === editEmployeeId)?.username || "";

      const isDuplicate = shifts.some((shift) => {
        const sameStart = new Date(shift.start).getTime() === startDateTime.getTime();
        const sameEnd = new Date(shift.end).getTime() === endDateTime.getTime();
        const sameEmployee = shift.title.includes(selectedUsername);
        const differentShift = String(shift.id) !== String(shiftId);
        return differentShift && sameStart && sameEnd && sameEmployee;
      });

      if (isDuplicate) {
        alert("Another shift already exists in that slot!");
        return;
      }

      const response = await fetch("http://192.168.29.194:5000/api/edit_shift", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id: shiftId,
          date: editShiftDate,
          shift_type: editShiftType.toLowerCase(),
          employee_id: editEmployeeId,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        alert("Error: " + result.error);
        return;
      }
      fetchShifts();
      setIsModalOpen(false);
      alert("Shift updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to edit shift.");
    }
  };
  const handleDeleteShift = async () => {
    try {
      const response = await fetch("http://192.168.29.194:5000/api/delete_shift", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_id: selectedShift.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        alert("Error: " + result.error);
        return;
      }
      fetchShifts();
      setIsModalOpen(false);
      alert("Shift deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete shift.");
    }
  };

  const slotLabelContent = (arg) => {
    if (arg.date.getHours() === 0) return "Night";
    if (arg.date.getHours() === 8) return "Morning";
    if (arg.date.getHours() === 16) return "Evening";
    return "";
  };

  const slotLaneContent = (arg) => {
    const hour = arg.date.getHours();
    if (hour !== 0 && hour !== 8 && hour !== 16) {
      return { display: "none" };
    }
    return null;
  };

  return (
    <div className="shifts-wrapper">
      <div className="shifts-calendar">
        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="add-shift-btn"
          >
            Create Shift
          </button>
        )}
        <FullCalendar
          eventDidMount={(info) => {
            const shiftType = info.event.extendedProps.shift_type;

            const shiftColors = {
              morning: "#514c00", // green
              evening: "#51002e", // yellow
              night: "#003751",   // blue
            };

            const color = shiftColors[shiftType?.toLowerCase()] || "#6c757d";

            // Apply background/border/text colors
            info.el.style.backgroundColor = color;
            info.el.style.borderColor = color;
            info.el.style.color = "#fff";
          }}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          slotDuration="08:00:00"
          slotLabelInterval={{ hours: 8 }}
          allDaySlot={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          events={shifts}
          eventClick={handleEventClick}
          slotLabelContent={slotLabelContent}
          slotEventOverlap={false}
          slotLaneContent={slotLaneContent}
          headerToolbar={{
            left: "prev,next,today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          height="auto"
          eventOverlap={false}
          dayMaxEventRows={true}
          dayMaxEvents={true}
          displayEventTime={false}
          eventOrder={"title"}
          eventContent={(arg) => {
            const titleParts = arg.event.title.split(" - ");
            const shiftTitle = titleParts[0];
            const employeesRaw = titleParts[1] || "";
            const employeeList = employeesRaw
              .split(",")
              .map((name, index) => `<div>${index + 1}. ${name.trim()}</div>`)
              .join("");

            return {
              html: `<div style="padding: 2px;">
                <strong>${shiftTitle}</strong>
                <div style="margin-top: 4px;">${employeeList}</div>
             </div>`,
            };
          }}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Shift Details</h2>
        {selectedShift && (
          <>
            <p>
              <strong>Shift:</strong> {selectedShift.title}
            </p>
            <p>
              <strong>Start:</strong>{" "}
              {new Date(selectedShift.start).toLocaleString()}
            </p>
            <p>
              <strong>End:</strong> {new Date(selectedShift.end).toLocaleString()}
            </p>

            <label>Comments / Notes:</label>
            <textarea
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={!isWithinShift()}
              placeholder={
                isWithinShift()
                  ? "Add or edit your notes here..."
                  : "Editing is disabled outside shift time."
              }
            />

            {isAdmin && (
              <>
                <h3>Edit Shift</h3>
                <label>Date:</label>
                <input
                  type="date"
                  value={editShiftDate}
                  onChange={(e) => setEditShiftDate(e.target.value)}
                />

                <label>Shift Type:</label>
                <select
                  value={editShiftType}
                  onChange={(e) => setEditShiftType(e.target.value)}
                >
                  <option>Morning</option>
                  <option>Evening</option>
                  <option>Night</option>
                </select>

                <label>Employee:</label>
                <select
                  value={editEmployeeId}
                  onChange={(e) => setEditEmployeeId(e.target.value)}
                >
                  <option value="">Select employee</option>
                  {analysts.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.username}
                    </option>
                  ))}
                </select>
              </>
            )}

            <div className="modal-buttons">
              <button
                onClick={handleSave}
                disabled={!isWithinShift()}
                className="modal-btn save-btn"
              >
                Save Comments
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={handleEditShift}
                    className="modal-btn edit-btn"
                  >
                    Update Shift
                  </button>
                  <button
                    onClick={handleDeleteShift}
                    className="modal-btn delete-btn"
                  >
                    Delete Shift
                  </button>
                </>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-btn cancel-btn"
              >
                Close
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={isAddModalOpen}
        onRequestClose={() => setIsAddModalOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Create New Shift</h2>
        <label>Date:</label>
        <input
          type="date"
          value={newShiftDate}
          onChange={(e) => setNewShiftDate(e.target.value)}
        />

        <label>Shift Type:</label>
        <select
          value={newShiftType}
          onChange={(e) => setNewShiftType(e.target.value)}
        >
          <option>Morning</option>
          <option>Evening</option>
          <option>Night</option>
        </select>

        <label>Select Employees:</label>
        <div className="employees-checkboxes">
          {analysts.map((emp) => (
            <div key={emp.id} className="employee-checkbox">
              <input
                type="checkbox"
                id={`emp-${emp.id}`}
                checked={selectedEmployees.includes(emp.username)}
                onChange={() => handleEmployeeToggle(emp.username)}
              />
              <label htmlFor={`emp-${emp.id}`}>{emp.username}</label>
            </div>
          ))}
        </div>

        <div className="modal-buttons">
          <button
            onClick={handleAddShift}
            className="modal-btn save-btn"
          >
            Create
          </button>
          <button
            onClick={() => setIsAddModalOpen(false)}
            className="modal-btn cancel-btn"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Shifts;