import React, { useState, useEffect } from "react";
import {
    Clock1, Clock2, Clock3, Clock4, Clock5, Clock6,
    Clock7, Clock8, Clock9, Clock10, Clock11, Clock12
} from 'lucide-react';
import "../styles/ShiftHandover.css";

function ShiftHandover() {
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const clockIcons = [
        Clock1, Clock2, Clock3, Clock4, Clock5, Clock6,
        Clock7, Clock8, Clock9, Clock10, Clock11, Clock12
    ];

    const [clockIndex, setClockIndex] = useState(0);
    useEffect(() => {
        const iconTimer = setInterval(() => {
            setClockIndex(prev => (prev + 1) % clockIcons.length);
        }, 1000);
        return () => clearInterval(iconTimer);
    }, []);

    const [currentTime, setCurrentTime] = useState(() => {
        const now = new Date();
        return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const [shiftData, setShiftData] = useState({
        Morning: [
            {
                name: "Ratan Jesani",
                remarks: "Conducted a comprehensive review...",
                handoverTo: "Ajay Kumar Jha",
                attachment: "LogFile1.pdf"
            },
            {
                name: "Jagan J",
                remarks: "Successfully updated the SOC dashboard...",
                handoverTo: "Aditya Maurya",
                attachment: "Dashboard.png"
            }
        ],
        Afternoon: [
            {
                name: "Anant Abriya",
                remarks: "Responded to multiple alerts...",
                handoverTo: "Sharad Singh",
                attachment: "Alerts.docx"
            },
            {
                name: "Mohit Jaggi",
                remarks: "Reviewed and documented all incidents...",
                handoverTo: "Akash Chintham",
                attachment: "Incidents.pdf"
            }
        ],
        Night: [
            {
                name: "Priyanshu Singh",
                remarks: "Executed scheduled backup operations...",
                handoverTo: "Anjuma Begum",
                attachment: "Backup.zip"
            },
            {
                name: "Piyush Gulati",
                remarks: "Cross-checked daily reports...",
                handoverTo: "Ranjan Kumar",
                attachment: "Report.xlsx"
            },
            {
                name: "Abdul Quddus",
                remarks: "Performed a full system health check...",
                handoverTo: "Nadeem Ansari",
                attachment: "HealthCheck.txt"
            }
        ]
    });

    const handleRemarksChange = (shift, index, newRemarks) => {
        setShiftData(prev => {
            const updatedShift = [...prev[shift]];
            updatedShift[index] = { ...updatedShift[index], remarks: newRemarks };
            return { ...prev, [shift]: updatedShift };
        });
    };

    return (
        <div className="handover_wrapper">
            <div className="date_area">
                <div className="date_display">
                    <div className="date">
                        Handover Date: {new Date(selectedDate).toLocaleDateString()}
                    </div>
                </div>
                <div className="date_picker">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                    />
                </div>
                <div className="cluster_label">
                    Cluster 3
                </div>
            </div>

            <div className="timeline_area">
                <div className="ongoing_shift_display">
                    <div className="ongoing_shift">
                        Ongoing: Afternoon Shift
                    </div>
                </div>
                <div className="timeline_label">
                    <span className="dot green"></span> 13:30 —
                    <span className="dot yellow"></span> {currentTime} {React.createElement(clockIcons[clockIndex], { size: 22 })} —
                    <span className="dot red"></span> 18:30
                </div>
            </div>

            <div className="table_container">
                <table className="table_wrapper">
                    <thead>
                        <tr>
                            <th style={{ width: "7.6%" }}>Shift</th>
                            <th style={{ width: "12.6%" }}>Name of Analyst</th>
                            <th style={{ width: "49.6%" }}>Remarks</th>
                            <th style={{ width: "12.6%" }}>Handover to</th>
                            <th style={{ width: "10.6%" }}>Attachment</th>
                            <th style={{ width: "6.6%" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(shiftData).map(([shift, entries]) =>
                            entries.map((entry, index) => (
                                <tr key={`${shift}-${index}`} className={`${shift.toLowerCase()}-row`}>
                                    {index === 0 && (
                                        <th rowSpan={entries.length}>{shift}</th>
                                    )}
                                    <td>{entry.name}</td>
                                    <td style={{padding: "2px"}}>
                                    <textarea
                                        value={entry.remarks}
                                        onChange={(e) => handleRemarksChange(shift, index, e.target.value)}
                                        rows={1}
                                        style={{
                                            width: "100%",
                                            minHeight: "100%",
                                            maxHeight: "250px",
                                            resize: "none",
                                            overflowY: "auto",
                                            whiteSpace: "pre-wrap",
                                            wordWrap: "break-word",
                                            fontFamily: "inherit",
                                            fontSize: "14px",
                                            padding: "4px",
                                            boxSizing: "border-box"
                                        }}
                                        onInput={(e) => {
                                            e.target.style.height = "auto";
                                            if (e.target.scrollHeight <= 250) {
                                                e.target.style.overflowY = "hidden";
                                                e.target.style.height = `${e.target.scrollHeight}px`;
                                            } else {
                                                e.target.style.overflowY = "auto";
                                                e.target.style.height = "250px";
                                            }
                                        }}
                                    />
                                    </td>

                                    <td>{entry.handoverTo ?? "—"}</td>
                                    <td>{entry.attachment}</td>
                                    <td>
                                        <button
                                            className="shift_logout_button"
                                            onClick={() => alert(`${entry.name} has been logged-out of shift!`)}
                                        >
                                            Logout
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ShiftHandover;
