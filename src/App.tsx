import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { get } from 'aws-amplify/api';

const client = generateClient<Schema>();

function App() {
  const { signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSensorData();
    const sub = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
    return () => sub.unsubscribe();
  }, []);

  async function fetchSensorData() {
    try {
      const restOp = get({
        apiName: "SensorAPI",
        path: "/readings"
      });
      const { body } = await restOp.response;
      const json = await body.json();
      setSensorData(Array.isArray(json) ? json : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error fetching sensor data");
      setSensorData([]);
    }
  }

  function createTodo() {
    const content = window.prompt("Todo content");
    if (content) {
      client.models.Todo.create({ content });
    }
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  return (
    <main style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>My Todos</h1>
      <button onClick={createTodo}>+ New</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => deleteTodo(todo.id)}>{todo.content}</li>
        ))}
      </ul>

      <h2>📡 Sensor Data</h2>
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
                  {Object.values(item).map((value, i) => (
                    <td key={i} style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                      {/*@ts-ignore*/}
                      {typeof value === "object" ? JSON.stringify(value) : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates" target="_blank">
          Review next step of this tutorial.
        </a>
      </div>

      <button onClick={signOut} style={{ marginTop: "1rem" }}>Sign out</button>
    </main>
  );
}

export default App;
