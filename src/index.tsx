import { createRoot } from "react-dom/client";
import { App } from "./app";
import React from "react";

const container = document.getElementById("app");
if (!container) {
  throw new Error("no container element provided");
}
const root = createRoot(container);
root.render(<App />);
