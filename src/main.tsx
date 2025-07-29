import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { parseAmplifyConfig } from "aws-amplify/utils";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
const apiUrl = import.meta.env.VITE_API_URL;


// ✅ Parse and configure Amplify with extended REST API config
const amplifyConfig = parseAmplifyConfig(outputs);

Amplify.configure({
  ...amplifyConfig,
  API: {
    ...amplifyConfig.API,
    REST: {
      ...amplifyConfig.API?.REST,
      SensorAPI: {
        endpoint: apiUrl,
        region: "us-east-2"
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </React.StrictMode>
);
