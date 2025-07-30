import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

type SensorDataItem = Record<string, unknown>;

function App() {
  const [sensorData, setSensorData] = useState<SensorDataItem[]>([]);
  const [error, setError] = useState<string | null>(null);

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

      const res = await fetch(apiUrl + '/sensor-readings', {
        method: "GET",
        headers: {
          Authorization: idToken,
        },
      });

      if (!res.ok) {
        const rawError = await res.text();
        throw new Error(`HTTP ${res.status}: ${rawError}`);
      }

      const data = await res.json();
      console.log("✅ Sensor data:", data);

      if (Array.isArray(data)) {
        setSensorData(data);
      } else {
        console.warn("⚠️ Unexpected response shape:", data);
        setSensorData([]);
      }

      setError(null);
    } catch (err) {
      console.error("🚨 fetchSensorData error:", err);
      setError(err instanceof Error ? err.message : "Unknown error fetching sensor data");
      setSensorData([]);
    }
  }

  return (
    <main style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>📡 Sensor Data</h1>

      {error ? (
        <p style={{ color: "red" }}>❌ {error}</p>
      ) : sensorData.length === 0 ? (
        <p>Loading or no sensor data found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {Object.keys(sensorData[0]).map((key) => (
                  <th key={key} style={{ borderBottom: "2px solid #ccc", textAlign: "left", padding: "8px" }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensorData.map((item, idx) => (
                <tr key={idx}>
                  {Object.entries(item).map(([_key, value], i) => (
                    <td key={i} style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                      {typeof value === "object" && value !== null
                        ? JSON.stringify(value)
                        : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default App;
