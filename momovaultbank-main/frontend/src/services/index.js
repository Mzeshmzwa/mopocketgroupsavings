import axiosInstance from "@/api/axiosInstance";

export const registerService = async (formData) => {
  try {
    const response = await axiosInstance.post("/auth/register", {
      ...formData,
      role: "user", // ✅ ensure user role is passed
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed.",
    };
  }
};

export const loginService = async (formData) => {
  try {
    const { data } = await axiosInstance.post("/auth/login", formData);
    return data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed.",
    };
  }
};

export const checkAuthService = async () => {
  try {
    const { data } = await axiosInstance.get("/auth/check-auth");
    return data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Auth check failed.",
    };
  }
};
