import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./components/App";

let mount = document.getElementById("root");
if (!mount) {
  mount = document.createElement("div");
  mount.id = "root";
  document.body.appendChild(mount);
}

createRoot(mount).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
