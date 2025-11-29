import { createApp } from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import axios from "axios";

// Configure axios - don't include /api in baseURL since we add it in individual requests
axios.defaults.baseURL = process.env.VUE_APP_API_URL || "http://localhost:4242";

// Add token to requests if available
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      router.push("/login");
    }
    return Promise.reject(error);
  }
);

createApp(App).use(store).use(router).mount("#app");
