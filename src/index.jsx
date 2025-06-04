import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App darkMode={false} />
  </AuthProvider>
);
