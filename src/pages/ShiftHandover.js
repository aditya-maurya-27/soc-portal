import React, { useState } from "react";
import "../styles/ShiftHandover.css";

function ShiftHandover() {
    const [handoverData, setHandoverData] = useState({
        date: "06 July 2025",
        shift: "Afternoon Shift (2:30 PM to 09:30 PM)",
        cluster: "Cluster 02",
        members: "Anant, Jachandeep, Vikas",
        actionPoints: [
            {
                description: "Keep an eye on various log sources (Peru Log Sources - delayed, EFCLS Log Sources, EIU Log Sources, RNB Log sources) and FCHRBIG ForcePoint DLP with Thailand still down.",
                status: "Informational",
            },
            {
                description: "Ticket Delivery Email Address Update",
                status: "Important",
            },
            {
                description: `Going forward please ensure to send all the tickets of limnial to soc@limnl.app.\n- Cloudflare - Distributed Unauthorized Access Attempts\n- Cloudflare - Multiple Proxy Authentication Failures\n- Cloudflare - Bot Traffic from Suspicious User Agents detected\n\nThe above rules are newly made rules in GTIBharat if it triggers raise without fail.`,
                status: "Important",
            },
            {
                description: `SIK - Palo Alto Scan Activity – Daily Reporting Protocol Update\nStarting from the morning shift on 5th July, any offense related to “Potential Scan Activity on Palo Alto from External Source” should be treated as follows:\n* If the action is other than ‘accept’, the incident can be reported once per day as a P5 severity offense.\n* If the action is ‘accept’, incidents should be reported as per SLA.\n\nThe incident window is from 06:00 AM to 06:00 AM the following day, aligning with the morning shift schedule.\n\nTagging for awareness:\nDefenders Vamun Kumar, Faiz Ahmad, Nithish Reddy\nCluster Leads Ratan Jeswal, Swati Singh, Siddharth Baghel\nPlease ensure that all types of incidents are being reported in Sekura not just Operational Incidents.`,
                status: "Important",
            },
            {
                description: `RE Unmanned SOC- Daily Report – 04 July 2025.\nHi Team,\nThanks for sharing logs request you to closely watch accept traffic from suspicious countries or IOCs and share detailed daily report.`,
                status: "",
            },
            {
                description: "CRCSL SE",
                status: "",
            },
        ],
        currentShiftPoints: [
            {
                description: "Keep an eye on Peru log Sources - delayed, ERCSL Log Sources, EIU Log sources, RNB Log sources, Thailand still down, FRCHRG ForcePoint DLP, Liminal Cloudflare, Liminal GitLab",
                status: "Informational",
            },
            {
                description: "Ticket Delivery Email Address Update",
                status: "",
            },
            {
                description: `Going forward please ensure to send all the tickets of limnial to soc@limnl.app.\n- Cloudflare – Distributed Unauthorized Access Attempts\n- Cloudflare – Multiple Proxy Authentication Failures\n- Cloudflare – Bot Traffic from Suspicious User Agents detected\n\nThe above rules are newly made rules in GTIBharat if it triggers raise without fail.`,
                status: "Important",
            },
            {
                description: "In RNB, please don’t use any other mailing list or mail ids apart from SOP, all mails are clearly mentioned in SOP document for Incident & Reports as well.",
                status: "Important",
            },
        ],
    });

    const handleCellEdit = (index, field, value) => {
        const updatedActions = [...handoverData.actionPoints];
        updatedActions[index][field] = value;
        setHandoverData({ ...handoverData, actionPoints: updatedActions });
    };

    const handleCurrentCellEdit = (index, field, value) => {
        const updated = [...handoverData.currentShiftPoints];
        updated[index][field] = value;
        setHandoverData({ ...handoverData, currentShiftPoints: updated });
    };

    return (
        <div className="handover_wrapper">
            <div className="handover_display">
                <div className="shift_info">
                    <p><strong>Select Date:</strong>
                        <input
                            type="date"
                            value={handoverData.date}
                            onChange={(e) => setHandoverData({ ...handoverData, date: e.target.value })}
                            className="date_picker"
                        />
                    </p>
                    <p>
                        <strong>Shift:</strong>{" "}
                        <select value={handoverData.shift} onChange={(e) => setHandoverData({ ...handoverData, shift: e.target.value })} className="shift_picker">
                            <option value="Morning">Morning Shift</option>
                            <option value="Afternoon">Afternoon Shift</option>
                            <option value="Night">Night Shift</option>
                        </select>
                    </p>
                    <p><strong>Cluster:</strong>
                        <select value={handoverData.cluster} onChange={(e) => setHandoverData({ ...handoverData, cluster: e.target.value })} className="cluster_picker">
                            <option value="Cluster1">Cluster 1</option>
                            <option value="Cluster2">Cluster 2</option>
                            <option value="Cluster3">Cluster 3</option>
                            <option value="Cluster4">Cluster 4</option>
                        </select>
                    </p>
                </div>
                <p><strong>Team Members:</strong> {handoverData.members}</p>

                {/* Previous Shift Table */}
                <table className="handover_table">
                    <thead>
                        <tr>
                            <th colSpan="3" className="table_title">Action Points from Previous Shift</th>
                        </tr>
                        <tr>
                            <th>S.No.</th>
                            <th>Description</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {handoverData.actionPoints.map((action, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleCellEdit(index, "description", e.target.innerText)}
                                >
                                    {action.description}
                                </td>
                                <td
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleCellEdit(index, "status", e.target.innerText)}
                                >
                                    {action.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Current Shift Table */}
                <table className="handover_table">
                    <thead>
                        <tr>
                            <th colSpan="3" className="table_title">Action Points from Current Shift</th>
                        </tr>
                        <tr>
                            <th>S.No.</th>
                            <th>Description</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {handoverData.currentShiftPoints.map((action, index) => (
                            <tr key={`current-${index}`}>
                                <td>{index + 1}</td>
                                <td
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleCurrentCellEdit(index, "description", e.target.innerText)}
                                >
                                    {action.description}
                                </td>
                                <td
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleCurrentCellEdit(index, "status", e.target.innerText)}
                                >
                                    {action.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ShiftHandover;
