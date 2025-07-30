import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "react-hot-toast";

import { Skeleton } from "@/components/ui/skeleton";
import { initialSignInFormData, initialSignUpFormData } from "@/config";
import axiosInstance from "@/api/axiosInstance"; // ✅ use axiosInstance directly

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [signInFormData, setSignInFormData] = useState(initialSignInFormData);
  const [signUpFormData, setSignUpFormData] = useState(initialSignUpFormData);
  const [auth, setAuth] = useState({
    authenticate: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ REGISTER USER
  async function handleRegisterUser(event) {
    event.preventDefault();

    try {
      const response = await axiosInstance.post("/auth/register", {
        ...signUpFormData,
        role: "user", // optional if you want to enforce this
      });

      if (response.data.success) {
        toast.success("Registration successful!");
      } else {
        toast.error(response.data.message || "Registration failed.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Registration failed. Try again."
      );
    }
  }

  // ✅ LOGIN USER
  async function handleLoginUser(event) {
    event.preventDefault();

    try {
      const response = await axiosInstance.post("/auth/login", signInFormData);
      const data = response.data;
      console.log(data, "login response");

      if (data.success) {
        sessionStorage.setItem(
          "accessToken",
          JSON.stringify(data.data.accessToken)
        );
        localStorage.setItem("userId", data.data.user._id);

        setAuth({
          authenticate: true,
          user: data.data.user,
        });

        toast.success("You have successfully logged in!");

        if (data.data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } else {
        setAuth({ authenticate: false, user: null });

        const errorMessage =
          data?.message === "Invalid credentials"
            ? "Incorrect email or password"
            : data?.message || "Login failed. Please try again.";

        toast.error(errorMessage);
      }
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  }

  // ✅ CHECK AUTH ON PAGE LOAD
  async function checkAuthUser() {
    try {
      const response = await axiosInstance.get("/auth/check-auth");
      const data = response.data;

      if (data.success) {
        setAuth({
          authenticate: true,
          user: data.data.user,
        });
      } else {
        setAuth({ authenticate: false, user: null });
      }
    } catch (error) {
      console.log(error);
      setAuth({ authenticate: false, user: null });
    } finally {
      setLoading(false);
    }
  }

  // ✅ LOGOUT / RESET SESSION
  function resetCredentials() {
    setAuth({ authenticate: false, user: null });
    sessionStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    navigate("/auth");
  }

  useEffect(() => {
    checkAuthUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signInFormData,
        setSignInFormData,
        signUpFormData,
        setSignUpFormData,
        handleRegisterUser,
        handleLoginUser,
        auth,
        resetCredentials,
      }}
    >
      {loading ? <Skeleton /> : children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
