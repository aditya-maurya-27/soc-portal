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
  Evening: { start: "16:00", end: "24:00" },
  Night: { start: "00:00", end: "08:00" },
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
  const [newShiftType, setNewShiftType] = useState("Morning");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [analysts, setAnalysts] = useState([]);

  const [editShiftType, setEditShiftType] = useState("Morning");
  const [editShiftDate, setEditShiftDate] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");

  useEffect(() => {
    fetch("http://192.168.1.49:5000/api/shifts")
      .then((res) => res.json())
      .then((data) => setShifts(data))
      .catch((err) => console.error("Failed to fetch shifts:", err));

    fetch("http://192.168.1.49:5000/api/analysts")
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

      const firstEmp = shift.title.split(" - ")[0].split(", ")[0];
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

    const usernames = selectedEmployees.join(", ");

    const isDuplicate = shifts.some(
      (shift) =>
        new Date(shift.start).getTime() === startDateTime.getTime() &&
        new Date(shift.end).getTime() === endDateTime.getTime() &&
        shift.title === `${usernames} - ${newShiftType}`
    );

    if (isDuplicate) {
      alert("This shift already exists with selected employees.");
      return;
    }

    try {
      const employeeIds = analysts
        .filter((emp) => selectedEmployees.includes(emp.username))
        .map((emp) => emp.id);

      const response = await fetch("http://192.168.1.49:5000/api/create_shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newShiftDate,
          shift_type: newShiftType.toLowerCase(),
          employee_ids: employeeIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Error: " + data.error);
        return;
      }

      const newShiftEvent = {
        title: usernames + " - " + newShiftType,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        id: data.shift_id,
      };

      setShifts((prev) => [...prev, newShiftEvent]);
    } catch (err) {
      console.error(err);
      alert("Failed to create shift.");
    }

    setIsAddModalOpen(false);
    setSelectedEmployees([]);
    alert("Shift created successfully!");
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

      const isDuplicate = shifts.some((shift) => {
        const sameStart = new Date(shift.start).getTime() === startDateTime.getTime();
        const sameEnd = new Date(shift.end).getTime() === endDateTime.getTime();
        const selectedUsername = analysts.find((emp) => emp.id === editEmployeeId)?.username || "";
        const sameEmployee = shift.title.includes(selectedUsername);
        const differentShift = String(shift.id) !== String(shiftId);
        return differentShift && sameStart && sameEnd && sameEmployee;
      });

      if (isDuplicate) {
        alert("Another shift already exists in that slot!");
        return;
      }

      const response = await fetch("http://192.168.1.49:5000/api/edit_shift", {
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

      const newUsername =
        analysts.find((emp) => emp.id === editEmployeeId)?.username ||
        selectedShift.title.split(" - ")[0];

      const updatedShifts = shifts.map((shift) =>
        shift.id === shiftId
          ? {
              ...shift,
              title: newUsername + " - " + editShiftType,
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
            }
          : shift
      );

      setShifts(updatedShifts);
      setIsModalOpen(false);
      alert("Shift updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to edit shift.");
    }
  };

  const handleDeleteShift = async () => {
    try {
      const response = await fetch("http://192.168.1.49:5000/api/delete_shift", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_id: selectedShift.id }),
      });

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

  // Custom slot rendering
  const slotLabelContent = (arg) => {
    // Only show custom labels for the three main slots
    if (arg.date.getHours() === 8) return "Morning";
    if (arg.date.getHours() === 16) return "Evening";
    if (arg.date.getHours() === 0) return "Night";
    return "";
  };

  // Filter out slots we don't want to display
  const slotLaneContent = (arg) => {
    const hour = arg.date.getHours();
    // Only show our three main slots (Morning, Evening, Night)
    if (hour !== 0 && hour !== 8 && hour !== 16) {
      return { display: "none" };
    }
    return null;
  };

  return (
    <div className="shifts-wrapper">
      {isAdmin && (
        <button onClick={() => setIsAddModalOpen(true)} style={{ marginBottom: "10px" }}>
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
          slotDuration="08:00:00" // Each slot is 8 hours
          slotLabelContent={slotLabelContent}
          slotLaneContent={slotLaneContent}
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
          slotLabelFormat={{
            hour: 'numeric',
            hour12: false,
            omitZeroMinute: true,
            meridiem: false
          }}
          views={{
            timeGridDay: {
              slotDuration: '08:00:00',
              slotLabelInterval: '08:00:00'
            },
            timeGridWeek: {
              slotDuration: '08:00:00',
              slotLabelInterval: '08:00:00'
            }
          }}
        />
      </div>

      {/* Edit Shift Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        {isAdmin ? (
          <>
            <h2>Edit Shift (Admin)</h2>
            <label>Shift Type:</label>
            <select value={editShiftType} onChange={(e) => setEditShiftType(e.target.value)}>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>

            <label>Date:</label>
            <input type="date" value={editShiftDate} onChange={(e) => setEditShiftDate(e.target.value)} />

            <label>Reassign to:</label>
            <select value={editEmployeeId} onChange={(e) => setEditEmployeeId(e.target.value)}>
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
              <button onClick={handleSave} disabled={!isWithinShift()} style={{ marginRight: "10px" }}>
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
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Create Shift</h2>

        <label>Select Employees:</label>
        <div style={{ border: "1px solid #ccc", padding: "10px", maxHeight: "150px", overflowY: "scroll" }}>
          {analysts.map((emp) => (
            <div key={emp.id}>
              <input
                type="checkbox"
                checked={selectedEmployees.includes(emp.username)}
                onChange={() => handleEmployeeToggle(emp.username)}
              />
              <label style={{ marginLeft: "8px" }}>{emp.username}</label>
            </div>
          ))}
        </div>

        <label>Shift Type:</label>
        <select value={newShiftType} onChange={(e) => setNewShiftType(e.target.value)}>
          <option value="Morning">Morning</option>
          <option value="Evening">Evening</option>
          <option value="Night">Night</option>
        </select>

        <label>Date:</label>
        <input type="date" value={newShiftDate} onChange={(e) => setNewShiftDate(e.target.value)} />

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