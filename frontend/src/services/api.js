import axios from "axios";

const API = axios.create({
  baseURL: "https://expense-tracker-production-854d.up.railway.app/api", // change to deployed backend later
});

// Attach token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
