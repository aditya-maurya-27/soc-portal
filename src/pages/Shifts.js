import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "react-modal";
import { AuthProvider, useAuth } from "../context/AuthContext";
import "../styles/Shifts.css";

// Set modal root for accessibility
Modal.setAppElement("#root");

const Shifts = () => {
  const { user } = useAuth(AuthProvider);
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [comment, setComment] = useState("");
  const [commentsMap, setCommentsMap] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch("http://192.168.1.49:5000/api/shifts")
      .then((res) => res.json())
      .then((data) => {
        console.log("Rendered Shifts:", data);
        setShifts(data); // ⛔️ Don't reformat, use directly
      })
      .catch((err) => console.error("Failed to fetch shifts:", err));
  }, []);

  const handleEventClick = (info) => {
    const shift = info.event;
    setSelectedShift(shift);
    setComment(commentsMap[shift.id] || "");
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

  return (
    <div className="shifts-wrapper">
      {console.log("Rendered Shifts: ", shifts)}
      <div className="shifts-calendar">
        <FullCalendar
          plugins={[interactionPlugin, dayGridPlugin, timeGridPlugin]}
          allDaySlot={false}
          initialView="timeGridDay"
          scrollTime="00:00:00" // ✅ Ensures night shifts at midnight are visible
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
        contentLabel="Analyst Comments"
        className="modal"
        overlayClassName="overlay"
      >
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
      </Modal>
    </div>
  );
};

export default Shifts;
