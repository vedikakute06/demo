import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="527117658224-v8noc46rnp69nruvoubv0jgvn2alvfge.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
