import React, { useEffect, useState } from "react";
import "../styles/OperationRunbook.css";

function OperationRunbook() {
  const [clients, setClients] = useState([]);
  const [originalClients, setOriginalClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClientName, setSelectedClientName] = useState("");
  const [assetData, setAssetData] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [filters, setFilters] = useState({ assetType: "", mode: "" });
  const [escalationData, setEscalationData] = useState([]);
  const [activeTab, setActiveTab] = useState("Assets");

  useEffect(() => {
    fetch("http://192.168.1.49:5000/api/clients")
      .then((res) => res.json())
      .then((data) => {
        const transformedClients = data.map(([id, name]) => ({ id, name }));
        setClients(transformedClients);
        setOriginalClients(transformedClients);
      })
      .catch((error) => console.error("Error fetching clients:", error));
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetch(`http://192.168.1.49:5000/api/client-assets?client=${selectedClient}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("API Response Assets:", data);

          const transformedData = data.map((assetArray) => ({
            id: assetArray[0],
            client_id: assetArray[1],
            asset_name: assetArray[2],
            location: assetArray[3],
            ip_address: assetArray[4],
            mode: assetArray[5],
            asset_type: assetArray[6],
            asset_owner: assetArray[7],
            remarks: assetArray[8],
          }));

          setAssetData(transformedData);
          setFilteredAssets(transformedData);
          setFilters({ assetType: "", mode: "" });
        })
        .catch((error) => console.error("Error fetching assets:", error));

      fetch(`http://192.168.1.49:5000/api/escalation-matrix?client=${selectedClient}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("API Response Escalation:", data);

          const transformedData = data.map((item) => ({
            id: item[0],
            client_id: item[1],
            level: item[2],
            contact_name: item[3],
            contact_email: item[4],
            contact_number: item[5],
            sla_response_hours: item[6],
            sla_resolution_hours: item[7],
          }));

          setEscalationData(transformedData);
        })
        .catch((error) => console.error("Error fetching escalation data:", error));
    }
  }, [selectedClient]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);

    const filtered = assetData.filter((asset) => {
      return (
        (updatedFilters.assetType === "" || asset.asset_type === updatedFilters.assetType) &&
        (updatedFilters.mode === "" || asset.mode === updatedFilters.mode)
      );
    });

    setFilteredAssets(filtered);
  };

  const handleSearchChange = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setClients(
      originalClients.filter((client) =>
        client.name.toLowerCase().includes(searchValue)
      )
    );
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
        <ul className="client-list">
          {clients.map((client) => (
            <li
              key={client.id}
              onClick={() => {
                setSelectedClient(client.id);
                setSelectedClientName(client.name);
              }}
            >
              {client.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="client-details">
        {selectedClient && (
          <>
            <h2>Client: {selectedClientName}</h2>

            <div className="tab-buttons">
              <button 
                onClick={() => setActiveTab("Assets")}
                className={activeTab === "Assets" ? "active" : ""}
              >
                Assets
              </button>
              <button
                onClick={() => setActiveTab("Escalation Matrix")}
                className={activeTab === "Escalation Matrix" ? "active" : ""}
              >
                Escalation Matrix
              </button>
            </div>

            {activeTab === "Assets" && (
              <>
                <div className="filters">
                  <select
                    name="assetType"
                    value={filters.assetType}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Asset Types</option>
                    <option value="Server">Server</option>
                    <option value="Workstation">Workstation</option>
                    <option value="Router">Router</option>
                  </select>

                  <select name="mode" value={filters.mode} onChange={handleFilterChange}>
                    <option value="">All Modes</option>
                    <option value="RDP">RDP</option>
                    <option value="SSH">SSH</option>
                  </select>
                </div>

                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset, idx) => (
                    <div key={idx} className="asset-card">
                      <p><strong>Asset Name:</strong> {asset.asset_name}</p>
                      <p><strong>Location:</strong> {asset.location}</p>
                      <p><strong>IP Address:</strong> {asset.ip_address}</p>
                      <p><strong>Mode:</strong> {asset.mode}</p>
                      <p><strong>Asset Type:</strong> {asset.asset_type}</p>
                      <p><strong>Asset Owner:</strong> {asset.asset_owner}</p>
                      <p><strong>Remarks:</strong> {asset.remarks}</p>
                    </div>
                  ))
                ) : (
                  <p>No matching assets found.</p>
                )}
              </>
            )}

            {activeTab === "Escalation Matrix" && (
              <div className="escalation-matrix">
                {escalationData.length > 0 ? (
                  escalationData.map((escalation, idx) => (
                    <div key={idx} className="escalation-card">
                      <h3>Level: {escalation.level}</h3>
                      <p>
                        <strong>Contact Name:</strong> {escalation.contact_name}
                      </p>
                      <p>
                        <strong>Contact Email:</strong> {escalation.contact_email}
                      </p>
                      <p>
                        <strong>Contact Number:</strong> {escalation.contact_number}
                      </p>
                      <p>
                        <strong>Response SLA (Hours):</strong>{" "}
                        {escalation.sla_response_hours}
                      </p>
                      <p>
                        <strong>Resolution SLA (Hours):</strong>{" "}
                        {escalation.sla_resolution_hours}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No escalation data found.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default OperationRunbook;