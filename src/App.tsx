import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

type SensorDataItem = Record<string, any>;

const PAGE_SIZE = 10;

function App() {
  const [sensorData, setSensorData] = useState<SensorDataItem[]>([]);
  const [uniqueDevices, setUniqueDevices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchSensorData();
  }, []);

  async function fetchSensorData() {
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) throw new Error("No ID token found");

      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) throw new Error("Missing VITE_API_URL environment variable");

      const readingsRes = await fetch(apiUrl + "/sensor-readings", {
        method: "GET",
        headers: { Authorization: idToken },
      });

      if (!readingsRes.ok) {
        const rawError = await readingsRes.text();
        throw new Error(`Readings HTTP ${readingsRes.status}: ${rawError}`);
      }

      const readingsData = await readingsRes.json();
      if (Array.isArray(readingsData)) {
        setSensorData(readingsData);
      } else {
        console.warn("⚠️ Unexpected readings response:", readingsData);
        setSensorData([]);
      }

      const sensorsRes = await fetch(apiUrl + "/sensors", {
        method: "GET",
        headers: { Authorization: idToken },
      });

      if (!sensorsRes.ok) {
        const rawError = await sensorsRes.text();
        throw new Error(`Sensors HTTP ${sensorsRes.status}: ${rawError}`);
      }

      const sensorsData = await sensorsRes.json();
      if (Array.isArray(sensorsData)) {
        setUniqueDevices(
          sensorsData.map((d) => unwrapValue(d.deviceId || d.deviceID || ""))
        );
      } else {
        console.warn("⚠️ Unexpected sensors response:", sensorsData);
        setUniqueDevices([]);
      }

      setError(null);
    } catch (err) {
      console.error("🚨 fetchSensorData error:", err);
      setError(err instanceof Error ? err.message : "Unknown error fetching sensor data");
      setSensorData([]);
      setUniqueDevices([]);
    }
  }

  const unwrapValue = (value: any): string => {
    if (typeof value !== "object" || value === null) return String(value);
    if ("S" in value) return value.S;
    if ("N" in value) return value.N;
    if ("BOOL" in value) return String(value.BOOL);
    return JSON.stringify(value);
  };

  const startIdx = currentPage * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const paginatedData = sensorData.slice(startIdx, endIdx);

  return (
    <div style={{ display: "flex", fontFamily: "sans-serif", height: "100vh" }}>
      {/* Sidebar */}
      <aside style={{ width: "200px", background: "#1E293B", color: "#fff", padding: "1rem" }}>
        <h2>📦 Cold Chain</h2>
        <button
          style={{
            background: "#3B82F6",
            border: "none",
            padding: "0.5rem 1rem",
            color: "#fff",
            borderRadius: "4px",
            marginTop: "1rem",
            cursor: "pointer",
          }}
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: "2rem", backgroundColor: "#F8FAFC" }}>
        <h1 style={{ marginBottom: "1rem" }}>📊 Sensor Dashboard</h1>

        {/* Metrics */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          <div style={cardStyle}>
            <strong>Total Readings:</strong>
            <span>{sensorData.length}</span>
          </div>
          <div style={cardStyle}>
            <strong>Unique Devices:</strong>
            <span>{uniqueDevices.length}</span>
          </div>
        </div>

        {/* Table */}
        <section style={{ overflowX: "auto" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>Sensor Readings</h2>

          {error ? (
            <p style={{ color: "red" }}>❌ {error}</p>
          ) : sensorData.length === 0 ? (
            <p>Loading or no sensor data found.</p>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff" }}>
                <thead>
                  <tr>
                    {Object.keys(sensorData[0]).map((key) => (
                      <th
                        key={key}
                        style={{
                          borderBottom: "2px solid #ccc",
                          textAlign: "left",
                          padding: "8px",
                          background: "#E2E8F0",
                        }}
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, idx) => (
                    <tr key={idx}>
                      {Object.entries(item).map(([_, value], i) => (
                        <td
                          key={i}
                          style={{
                            borderBottom: "1px solid #eee",
                            padding: "8px",
                            fontSize: "14px",
                          }}
                        >
                          {unwrapValue(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
                  disabled={currentPage === 0}
                  style={paginationButtonStyle}
                >
                  ⬅️ Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      endIdx < sensorData.length ? p + 1 : p
                    )
                  }
                  disabled={endIdx >= sensorData.length}
                  style={paginationButtonStyle}
                >
                  Next ➡️
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "8px",
  padding: "1rem",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  minWidth: "180px",
};

const paginationButtonStyle: React.CSSProperties = {
  background: "#3B82F6",
  color: "#fff",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "4px",
  cursor: "pointer",
  opacity: 1,
  transition: "opacity 0.2s",
};

export default App;
