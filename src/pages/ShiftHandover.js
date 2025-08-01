import React, { useState, useEffect } from "react";
import {
    Clock1, Clock2, Clock3, Clock4, Clock5, Clock6,
    Clock7, Clock8, Clock9, Clock10, Clock11, Clock12
} from 'lucide-react';

import "../styles/ShiftHandover.css";

function ShiftHandover() {
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0]; // Format: YYYY-MM-DD
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
        }, 1000); // Change every second

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












    // Sample dynamic data
    const shiftData = {
        Morning: [
            {
                name: "Ratan Jesani",
                remarks: "Conducted a comprehensive review of the log files for SCB Server 53 to identify anomalies or irregular access patterns. No critical issues were found, but minor latency spikes were noted for further monitoring.",
                handoverTo: "Ajay Kumar Jha",
                attachment: "LogFile1.pdf"
            },
            {
                name: "Jagan J",
                remarks: "Successfully updated the SOC dashboard with the latest metrics including threat detection rates, incident response times, and system uptime. Ensured all widgets reflect real-time data for accurate monitoring.",
                handoverTo: "Aditya Maurya",
                attachment: "Dashboard.png"
            }
        ],
        Afternoon: [
            {
                name: "Anant Abriya",
                remarks: "Responded to multiple alerts triggered by the SIEM system. Investigated and resolved three medium-priority alerts related to unauthorized login attempts. Escalated one high-priority alert to the incident response team.",
                handoverTo: "Sharad Singh",
                attachment: "Alerts.docx"
            },
            {
                name: "Mohit Jaggi",
                remarks: "Reviewed and documented all incidents reported during the shift. Verified resolution steps and ensured proper tagging and categorization in the incident management system. Prepared summary for weekly audit.",
                handoverTo: "Akash Chintham",
                attachment: "Incidents.pdf"
            }
        ],
        Night: [
            {
                name: "Priyanshu Singh",
                remarks: "Executed scheduled backup operations for critical systems. Verified integrity of backup files and ensured replication to offsite storage. No errors encountered during the process.",
                handoverTo: "Anjuma Begum",
                attachment: "Backup.zip"
            },
            {
                name: "Piyush Gulati",
                remarks: "Cross-checked daily reports for accuracy and completeness. Validated data against system logs and flagged one discrepancy for follow-up. Reports are ready for submission to compliance.",
                handoverTo: "Ranjan Kumar",
                attachment: "Report.xlsx"
            },
            {
                name: "Abdul Quddus",
                remarks: "Performed a full system health check across all monitored assets. CPU, memory, and disk usage were within acceptable thresholds. No signs of hardware degradation or performance bottlenecks.",
                handoverTo: "Nadeem Ansari",
                attachment: "HealthCheck.txt"
            }
        ]
    };



    return (
        <div className="handover_wrapper" >

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
                            <th style={{ width: "49.6%"}}>Remarks</th>
                            <th style={{ width: "12.6%" }}>Handover to</th> {/* New column */}
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
                                    <td>{entry.remarks}</td>
                                    <td>{entry.handoverTo || "—"}</td> {/* New column */}
                                    <td>{entry.attachment}</td>
                                    <td>
                                        <button className="shift_logout_button" onClick={() => alert(`${entry.name} has been logged-out of shift!`)}>
                                            Logout
                                        </button>
                                    </td>
                                </tr>

                            ))
                        )}
                    </tbody>

                </table>
            </div>
        </div >
    );
}

export default ShiftHandover;
