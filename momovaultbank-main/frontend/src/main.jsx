import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import AuthProvider from "./context/auth-context/index.jsx";
import AdminProvider from "./context/admin-context/index.jsx";
import UserProvider from "./context/user-context/index.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <AdminProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </AdminProvider>
    </AuthProvider>
  </BrowserRouter>
);
