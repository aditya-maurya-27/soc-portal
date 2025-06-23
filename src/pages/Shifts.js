import React, { useState, useEffect, useRef } from "react";
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
  const [cabStatusList, setCabStatusList] = useState([]);
  const [shifts, setShifts] = useState([]);
  const shiftColorMap = useRef({});
  const [selectedShift, setSelectedShift] = useState(null);
  const [comment, setComment] = useState("");
  const [commentsMap, setCommentsMap] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newShiftDate, setNewShiftDate] = useState("");
  const [newShiftType, setNewShiftType] = useState("Night");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [analysts, setAnalysts] = useState([]);
  const [cabOpted, setCabOpted] = useState(false);
  const [editShiftType, setEditShiftType] = useState("Night");
  const [editShiftDate, setEditShiftDate] = useState("");
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const shiftColorPool = [
    "#0b3d91", // dark azure blue
    "#4b1d3f", // deep plum
    "#0f3b57", // midnight teal
    "#440047", // deep grape
    "#004d40", // deep teal
    "#3d0000", // deep maroon
    "#00203f", // dark navy
    "#2c003e", // dark purple
    "#4a148c", // indigo
    "#1a1a40", // navy black
    "#3a0ca3", // royal violet
    "#311432", // raisin black
    "#8B0000", // dark red
    "#7B241C", // deep crimson
    "#641E16", // dark cherry
    "#78281F", // wine red
    "#6E1414", // roasted red
    "#8B2500", // burnt orange
    "#B7410E", // rust
    "#A0522D", // sienna brown
    "#D2691E", // chocolate orange
    "#9C640C", // golden bronze
    "#8B4513", // saddle brown
    "#7C4700", // caramel burnt
    "#705700", // muddy gold
    "#665D1E",  // dark mustard
    "#003f5c", // deep ocean blue
    "#390099", // vibrant purple
    "#1c0032", // dark violet
    "#3e065f", // cosmic purple
    "#123524", // pine green
    "#1e2a38", // shadow slate
    "#0c1f3f", // indigo night
    "#420516", // merlot
    "#1a1a2e", // deep blue-gray
    "#092635", // arctic navy
    "#402218", // dark brown
    "#0d1b2a", // dark sea navy
    "#1b1b2f", // gothic gray
    "#27374d", // dusty night blue
    "#132743", // midnight steel
    "#3e1f47", // mulberry
    "#183D3D", // sea moss
    "#1c1c1c", // nearly black
    "#003366", // classic navy
    "#212121", // pitch black
    "#2b1d0e", // earthy brown
    "#321325", // shadow magenta
    "#102c57", // blue slate
    "#2c2c54", // dusk purple
    "#2a0944", // grape skin
    "#2e003e", // plum pit
    "#000f1a", // true deep blue
    "#1b262c", // blue-black
    "#001f3f", // abyss blue
    "#2d132c", // noir rose
    "#8B008B", // Dark Magenta
    "#800040", // Deep Rose
    "#993366", // Dusky Pink
    "#702963", // Byzantium
    "#A52A6A", // Rose Red
    "#78002E", // Dark Raspberry
    "#AA336A", // Vintage Pink
    "#260701", // ember coal
    "#191825", // nightfall
    "#1f1d36", // dark orchid
    "#3b2f2f", // cocoa ash
    "#2e2e40", // grayish indigo
    "#1e1e2f", // subdued navy
    "#222831", // graphite
    "#35013f", // strong plum
    "#1A4D2E"  // deep forest green
  ];



  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setIsModalOpen(false);
      setIsAddModalOpen(false);
    }
  }, [user]);

  const fetchShifts = () => {
    fetch("http://192.168.29.194:5000/api/shifts")
      .then((res) => res.json())
      .then((data) => {
        if (isMountedRef.current) setShifts(data);
      })
      .catch((err) => {
        if (isMountedRef.current) console.error("Failed to fetch shifts:", err);
      });
  };

  useEffect(() => {
    fetchShifts();
    fetch("http://192.168.29.194:5000/api/analysts")
      .then((res) => res.json())
      .then((data) => {
        if (isMountedRef.current) setAnalysts(data);
      })
      .catch((err) => {
        if (isMountedRef.current) console.error("Failed to fetch analysts:", err);
      });
  }, []);

  const handleEmployeeToggle = (username) => {
    setSelectedEmployees((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  };

  const isUserInShift = () => {
    return cabStatusList.some((emp) => emp.username === user?.username);
  };

  const handleCabToggle = async () => {
    const newCabOpted = !cabOpted;
    setCabOpted(newCabOpted);
    try {
      await fetch(`http://192.168.29.194:5000/api/update_cab_status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id: selectedShift.id,
          employee_id: user.id,
          cab_facility: newCabOpted ? "Yes" : "No",
        }),
      });
      setCabStatusList(prevList =>
        prevList.map(emp =>
          emp.username === user.username
            ? { ...emp, cab_facility: newCabOpted ? "Yes" : "No" }
            : emp
        )
      );
    } catch (err) {
      if (isMountedRef.current) console.error("Failed to update cab status:", err);
    }
  };

  const handleEventClick = async (info) => {
    const shift = info.event;
    if (!isMountedRef.current) return;

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

    try {
      const response = await fetch(`http://192.168.29.194:5000/api/shifts/${shift.id}/cab-status`);
      if (!response.ok) throw new Error("Failed to fetch cab status");
      const data = await response.json();
      if (isMountedRef.current) {
        setCabStatusList(data);
        if (!isAdmin && data.length > 0) {
          const currentUser = data.find((emp) => emp.username === user.username);
          setCabOpted(currentUser?.cab_facility === "Yes");
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error("Error fetching cab status:", error);
        setCabStatusList([]);
      }
    }

    if (isMountedRef.current) setIsModalOpen(true);
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
            const shiftId = info.event.id;

            // Assign color to shift
            if (!shiftColorMap.current[shiftId]) {
              const randomColor = shiftColorPool[Math.floor(Math.random() * shiftColorPool.length)];
              shiftColorMap.current[shiftId] = randomColor;
            }
            const color = shiftColorMap.current[shiftId];
            info.el.style.backgroundColor = color;
            
            info.el.style.color = "#fff";

            //glare effect
            if (window.VanillaTilt && info.el) {
              window.VanillaTilt.init(info.el, {
                
                glare: true,
                "max-glare": 0.3,
                
              });
            }
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
            <div className="modal-content">
              <div className="left-section">
                <p>
                  <strong>Shift:</strong> {selectedShift.title}
                </p>
                <p>
                  <strong>Start:</strong>{" "}
                  {new Date(selectedShift.start).toLocaleString()}
                </p>
                <p>
                  <strong>End:</strong>{" "}
                  {new Date(selectedShift.end).toLocaleString()}
                </p>

                <div className="cab-status-list">
                  <h3>Cab Facility Status</h3>
                  <ul>
                    {cabStatusList.length === 0 ? (
                      <li>No cab data available</li>
                    ) : (
                      cabStatusList.map((emp) => (
                        <li key={emp.id}>
                          {emp.username} – {emp.cab_facility === "Yes" ? "Yes" : "No"}
                        </li>
                      ))
                    )}
                  </ul>
                </div>

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
              </div>

              <div className="right-section">
                <label>Comments / Notes:</label>
                <textarea
                  rows="10"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={!isWithinShift()}
                  placeholder={
                    isWithinShift()
                      ? "Add or edit your notes here..."
                      : "Editing is disabled outside shift time."
                  }
                />
              </div>
            </div>

            <div className="modal-buttons">
              <button
                onClick={handleSave}
                disabled={!isWithinShift()}
                className="modal-btn save-btn"
              >
                Save Comments
              </button>

              {!isAdmin && (
                <div className="checkbox-wrapper-35">
                  <input
                    type="checkbox"
                    id="cabSwitch"
                    className="switch"
                    checked={cabOpted}
                    onChange={handleCabToggle}
                    disabled={!isUserInShift()}
                  />
                  <label htmlFor="cabSwitch">
                    <span className="switch-x-text">Cab is</span>
                    <span className="switch-x-toggletext">
                      <span className="switch-x-unchecked" style={{ color: "red" }}>
                        Not Opted
                      </span>
                      <span className="switch-x-checked" style={{ color: "lime" }}>
                        Opted
                      </span>
                    </span>
                  </label>
                </div>
              )}

              {isAdmin && (
                <>
                  <button onClick={handleEditShift} className="modal-btn edit-btn">
                    Update Shift
                  </button>
                  <button onClick={handleDeleteShift} className="modal-btn delete-btn">
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