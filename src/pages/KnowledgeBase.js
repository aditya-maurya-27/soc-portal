import React, { useState, useEffect, useRef } from "react";
import { Search, Plus } from "lucide-react";
import "../styles/KnowledgeBase.css";

const KnowledgeBase = () => {
  const [query, setQuery] = useState("");
  const [data, setData] = useState([]);
  const [showingSearch, setShowingSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [sourceType, setSourceType] = useState("Local");

  const [newEntry, setNewEntry] = useState({
    entity_name: "",
    asset: "",
    itsm_ref: "",
    asset_details: "",
    status: "Allowed",
    reason: "",
    context: "",
    remarks: "",
  });

  const cache = useRef(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("http://192.168.1.49:5000/api/kb-search");
      const jsonData = await res.json();
      setData(jsonData);
      setCurrentPage(1); // reset to first page
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearch = async () => {
    const cacheKey = query.trim().toLowerCase();
    if (cache.current.has(cacheKey)) {
      setData(cache.current.get(cacheKey));
    } else {
      try {
        const res = await fetch(
          `http://192.168.1.49:5000/api/kb-search?query=${encodeURIComponent(query)}`
        );
        const jsonData = await res.json();
        cache.current.set(cacheKey, jsonData);
        setData(jsonData);
      } catch (error) {
        console.error("Search error:", error);
      }
    }
    setShowingSearch(true);
    setCurrentPage(1); // reset to first page on search
  };

  const handleGoBack = () => {
    setQuery("");
    fetchData();
    setShowingSearch(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://192.168.1.49:5000/api/kb_table-import", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        alert("Import successful!");
        fetchData();
      } else {
        alert("Import failed: " + result.message);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Import failed due to a network error.");
    }
    e.target.value = "";
  };

  const handleManualSubmit = async () => {
    try {
      const res = await fetch("http://192.168.1.49:5000/api/kb_table-add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });
      if (res.ok) {
        alert("Entry added successfully!");
        setShowForm(false);
        setNewEntry({
          entity_name: "",
          asset: "",
          itsm_ref: "",
          asset_details: "",
          status: "Allowed",
          reason: "",
          context: "",
          remarks: "",
        });
        fetchData();
      } else {
        alert("Failed to add entry");
      }
    } catch (error) {
      console.error("Add error:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  return (
    <div className="kb-container">
      <div className="kb-card">
        <div className="kb-search-bar">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="kb-input"
          />
          <button className="kb-button" onClick={handleSearch}>
            <Search size={16} /> Search
          </button>
          
          <div className="dropdown">
            <button className="kb-button dropdown-toggle">
              {sourceType} ▼
            </button>
            <div className="dropdown-menu">
              <div onClick={() => setSourceType("Local")}>Local</div>
              <div onClick={() => setSourceType("ITSM API")}>ITSM API</div>
            </div>
          </div>

          <label htmlFor="import-file" className="kb-imp">
            Import Excel
          </label>
          <input
            type="file"
            id="import-file"
            accept=".xlsx, .csv"
            onChange={handleImport}
            style={{ display: "none" }}
          />
          <button className="kb-button" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Add Entry
          </button>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-form">
              <h2>Add New Entry</h2>
              {Object.keys(newEntry).map((key) => (
                <input
                  key={key}
                  type="text"
                  placeholder={key.replace("_", " ")}
                  value={newEntry[key]}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, [key]: e.target.value })
                  }
                  className="kb-input"
                />
              ))}
              <div className="modal-buttons">
                <button className="kb-button" onClick={handleManualSubmit}>
                  Submit
                </button>
                <button
                  className="kb-button cancel"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <table className="kb-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Entity Name</th>
              <th>Asset</th>
              <th>ITSM Ref</th>
              <th>Asset Details</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Context</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.entity_name}</td>
                  <td>{item.asset}</td>
                  <td>{item.itsm_ref}</td>
                  <td>{item.asset_details}</td>
                  <td>{item.status}</td>
                  <td>{item.reason}</td>
                  <td>{item.context}</td>
                  <td>{item.remarks}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9">No results found</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {data.length > itemsPerPage && (
          <div className="pagination">
            <button
              className="kb-button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            <span style={{ margin: "0 10px" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="kb-button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}

        {showingSearch && (
          <button className="kb-button kb-back-button" onClick={handleGoBack}>
            ← Back to All Data
          </button>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;



