import React, { useEffect, useState } from "react";
import "../styles/OperationRunbook.css";

export default function OperationRunbook() {
  const [clientPDF, setClientPDF] = useState(null);

  const [showUploadModal, setShowUploadModal] = useState(false);


  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState("tab1");

  const [originalClients, setOriginalClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [assetData, setAssetData] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [filters, setFilters] = useState({ assetType: "", mode: "" });
  const [escalationData, setEscalationData] = useState([]);

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    asset_name: "", location: "", ip_address: "",
    mode: "", asset_type: "", asset_owner: "", remarks: ""
  });
  const [newEscalation, setNewEscalation] = useState({
    level: "", contact_name: "", contact_email: "",
    contact_number: "", sla_response_hours: "", sla_resolution_hours: ""
  });


  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedClient) return;

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("clientId", selectedClient);

    const res = await fetch("http://localhost:5000/api/upload-pdf", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const { fileName } = await res.json();
      setClientPDF(fileName);
    } else {
      console.error("PDF upload failed");
    }
  };



  const handleDeletePDF = async () => {
    if (!selectedClient) return;

    const res = await fetch(`http://localhost:5000/api/delete-client-pdf?clientId=${selectedClient}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setClientPDF(null);
      setShowUploadModal(false);
      alert("PDF deleted successfully.");
    } else {
      alert("Failed to delete PDF.");
    }
  };



  const isAdmin = localStorage.getItem("isAdmin") === "true";

  useEffect(() => {
    fetch("http://localhost:5000/api/clients")
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(([id, name]) => ({ id, name }));
        setClients(formatted);
        setOriginalClients(formatted);
      })
      .catch(console.error);
  }, []);






  useEffect(() => {
    if (selectedClient) {
      fetchAssetsAndEscalation(selectedClient);

      fetch(`http://localhost:5000/api/get-client-pdf?clientId=${selectedClient}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.fileName) {
            setClientPDF(data.fileName);
          } else {
            setClientPDF(null);
          }
        })
        .catch(console.error);
    }
  }, [selectedClient]);


  const fetchAssetsAndEscalation = (clientId) => {
    fetch(`http://localhost:5000/api/assets?client=${clientId}`)
      .then(res => res.json())
      .then(data => {
        const safeData = Array.isArray(data) ? data : []
        setAssetData(safeData);
        setFilteredAssets(safeData);
      })
      .catch(error => {
        console.error("Error fetching assets:", error);
        setAssetData([]);
        setFilteredAssets([]);
      });

    fetch(`http://localhost:5000/api/escalation-matrix?client=${clientId}`)
      .then(res => res.json())
      .then(data => {
        const formattedEscalations = data.map(e => ({
          id: e[0], client_id: e[1], level: e[2],
          contact_name: e[3], contact_email: e[4],
          contact_number: e[5], sla_response_hours: e[6],
          sla_resolution_hours: e[7],
        }));
        setEscalationData(formattedEscalations);
      });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);

    const filtered = assetData.filter(asset =>
      (!updatedFilters.assetType || asset.asset_type === updatedFilters.assetType) &&
      (!updatedFilters.mode || asset.mode === updatedFilters.mode)
    );
    setFilteredAssets(filtered);
  };

  const handleSearchChange = (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = originalClients.filter(c => c.name.toLowerCase().includes(search));
    setClients(filtered);
  };

  const handleAddClient = async () => {
    if (!newClientName.trim()) return;
    const res = await fetch("http://localhost:5000/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newClientName }),
    });
    if (res.ok) {
      const added = await res.json();
      const newEntry = { id: added.id, name: added.name };
      setClients(prev => [...prev, newEntry]);
      setOriginalClients(prev => [...prev, newEntry]);
      setNewClientName("");
      setIsAddClientModalOpen(false);
    }
  };

  const handleAddAsset = async () => {
    const res = await fetch("http://localhost:5000/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: selectedClient, ...newAsset }),
    });
    if (res.ok) {
      const tempId = Date.now();
      const added = { id: tempId, client_id: selectedClient, ...newAsset };
      setAssetData(prev => [...prev, added]);
      setFilteredAssets(prev => [...prev, added]);
      setNewAsset({ asset_name: "", location: "", ip_address: "", mode: "", asset_type: "", asset_owner: "", remarks: "" });
      setIsAddEntryModalOpen(false);
      fetchAssetsAndEscalation(selectedClient);
    } else {
      console.error("Error adding asset");
    }
  };

  const handleAddEscalation = async () => {
    const res = await fetch("http://localhost:5000/api/escalation-matrix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: selectedClient, ...newEscalation }),
    });
    if (res.ok) {
      fetchAssetsAndEscalation(selectedClient);
      setNewEscalation({ level: "", contact_name: "", contact_email: "", contact_number: "", sla_response_hours: "", sla_resolution_hours: "" });
      setIsAddEntryModalOpen(false);
    }
  };

  return (
    <div className="operation-runbook-container">
      <div className="sidebar">
        <input
          type="text"
          className="search-box"
          placeholder="Search clients..."
          onChange={handleSearchChange}
        />
        {isAdmin && (
          <button
            onClick={() => setIsAddClientModalOpen(true)}
            className="add-client-btn"
          >
            Add Client
          </button>
        )}
        <ul className="client-list">
          {clients.map((client) => (
            <li
              key={client.id}
              onClick={() => {
                setSelectedClient(client.id);
                setSelectedClientName(client.name);
              }}
            >
              🟣 {client.name}
            </li>
          ))}
        </ul>
      </div>

      {selectedClient && (

        <div className="client-details">
          <div className="tab-frame">
            <input
              type="radio"
              name="tab"
              id="tab1"
              className="tab tab--1"
              defaultChecked
              onChange={() => setActiveTab("tab1")}
            />
            <label
              className={`tab_label ${activeTab === "tab1" ? "active" : ""}`}
              htmlFor="tab1"
            >
              Scope of Work
            </label>


            <input
              type="radio"
              name="tab"
              id="tab2"
              className="tab tab--2"
              onChange={() => setActiveTab("tab2")}
            />
            <label
              className={`tab_label ${activeTab === "tab2" ? "active" : ""}`}
              htmlFor="tab2"
            >
              Service Level Agreement
            </label>

            <input
              type="radio"
              name="tab"
              id="tab3"
              className="tab tab--3"
              onChange={() => setActiveTab("tab3")}
            />
            <label
              className={`tab_label ${activeTab === "tab3" ? "active" : ""}`}
              htmlFor="tab3"
            >
              Escalation Matrix
            </label>

            <input
              type="radio"
              name="tab"
              id="tab4"
              className="tab tab--4"
              onChange={() => setActiveTab("tab4")}
            />
            <label
              className={`tab_label ${activeTab === "tab4" ? "active" : ""}`}
              htmlFor="tab4"
            >
              Passwords List
            </label>

            <input
              type="radio"
              name="tab"
              id="tab5"
              className="tab tab--5"
              onChange={() => setActiveTab("tab5")}
            />
            <label
              className={`tab_label ${activeTab === "tab5" ? "active" : ""}`}
              htmlFor="tab5"
            >
              Assets Inventory
            </label>

            <div className="indicator"></div>
          </div>






          <div className="tab-content">





            {activeTab === "tab1" && (
              <div className="sow">
                {isAdmin && (
                  <div className="sow-buttons-frame">
                    <button className="upload-sow-pdf-button" onClick={() => setShowUploadModal(true)} style={{ marginRight: "10px" }}>
                      Upload SOW PDF
                    </button>
                    <button className="delete-sow-pdf-button" onClick={handleDeletePDF}>
                      Delete SOW PDF
                    </button>
                  </div>
                )}






                {clientPDF ? (
                  <iframe
                    src={`http://localhost:5000/pdfs/client_${selectedClient}.pdf#toolbar=0`}
                    width="100%"
                    height="600px"
                    style={{ border: 'none', backgroundColor: "#fff" }}
                    title="PDF Preview"
                  />
                ) : (
                  <p>No PDF uploaded for this client.</p>
                )}
              </div>
            )}






            {activeTab === "tab2" && <div className="sla">??</div>}





            {activeTab === "tab3" && <div className="escalation_matrix">
              <table className="escalation_matrix_table">
                <thead>
                  <tr><th style={{ justifyContent: "center", width: "10%" }}></th><th colSpan={"4"} style={{ width: "45%" }}>Client Side</th><th colSpan={"4"} style={{ width: "45%" }}>GTBharat Side</th></tr>
                  <tr><th style={{ justifyContent: "center", width: "10%" }}>Level</th><th style={{ width: "11%" }}>Name</th>
                    <th style={{ width: "11%" }}>Email</th>
                    <th style={{ width: "11%" }}>Contact</th>
                    <th style={{ width: "11%" }}>Designation</th>
                    <th style={{ width: "11%" }}>Name</th>
                    <th style={{ width: "11%" }}>Email</th>
                    <th style={{ width: "11%" }}>Contact</th>
                    <th style={{ width: "11%" }}>Designation</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>
                      Data
                    </td>
                  </tr>
                  <tr>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>Data</td>
                    <td>
                      Data
                    </td>
                  </tr>
                </tbody>
              </table>



            </div>}





            {activeTab === "tab4" && <div className="passwords_list">????</div>}





            {activeTab === "tab5" && (<div className="assets_inventory">


              {isAdmin && (
                <button
                  onClick={() => setIsAddEntryModalOpen(true)}
                  className="add-asset-btn"
                >
                  Add Asset
                </button>
              )}





              <table className="assets-inventory-table">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Location</th>
                    <th>IP Address</th>
                    <th>Mode</th>
                    <th>Asset Type</th>
                    <th>Asset Owner</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {assetData.map((asset, index) => (
                    <tr key={index}>
                      <td>{asset.asset_name}</td>
                      <td>{asset.location}</td>
                      <td>{asset.ip_address}</td>
                      <td>{asset.mode}</td>
                      <td>{asset.asset_type}</td>
                      <td>{asset.asset_owner}</td>
                      <td>{asset.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>





            </div>)}





          </div>
        </div>

      )}




      {isAddClientModalOpen && (
        <div className="add-client-modal">
          <div className="add-client-modal-content">
            <h3>Add New Client</h3>
            <input
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Enter client name"
            />
            <div className="add-client-modal-actions">
              <button onClick={handleAddClient}>Submit</button>
              <button onClick={() => setIsAddClientModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}


      {isAddEntryModalOpen && (
        <div className="add-asset-modal">
          <div className="add-asset-modal-content">
            <h3>Add New Asset</h3>
            <input type="text" placeholder="Asset Name" value={newAsset.asset_name} onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })} />
            <input type="text" placeholder="Location" value={newAsset.location} onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })} />
            <input type="text" placeholder="IP Address" value={newAsset.ip_address} onChange={(e) => setNewAsset({ ...newAsset, ip_address: e.target.value })} />
            <select
              value={newAsset.mode}
              onChange={(e) => setNewAsset({ ...newAsset, mode: e.target.value })}
            >
              <option value="">Select Mode</option>
              <option value="RDP">RDP</option>
              <option value="SSH">SSH</option>
            </select>
            <input type="text" placeholder="Asset Type" value={newAsset.asset_type} onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })} />
            <input type="text" placeholder="Asset Owner" value={newAsset.asset_owner} onChange={(e) => setNewAsset({ ...newAsset, asset_owner: e.target.value })} />
            <input type="text" placeholder="Remarks" value={newAsset.remarks} onChange={(e) => setNewAsset({ ...newAsset, remarks: e.target.value })} />
            <div className="add-asset-modal-actions">
              <button onClick={handleAddAsset}>Submit</button>
              <button onClick={() => setIsAddEntryModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}


      {showUploadModal && (
        <div className="upload-sow-modal">
          <div className="modal-content">
            <h3>Upload SOW PDF</h3>
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePDFUpload}
            />
            <button onClick={() => setShowUploadModal(false)}>Close</button>
          </div>
        </div>
      )}


    </div>
  );

}
