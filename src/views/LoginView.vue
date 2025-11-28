<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Admin Login</h1>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input id="username" v-model="username" type="text" required class="form-input" placeholder="Enter your username" />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" required class="form-input" placeholder="Enter your password" />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" :disabled="loading" class="login-button">
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LoginView",
  data() {
    return {
      // apiUrl: process.env.VUE_APP_API_URL || "http://localhost:4242",
      apiUrl: "https://eto.admin.nomadicmediastudios.com/api",
      username: "",
      password: "",
      loading: false,
      error: null,
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post(
          `${this.apiUrl}/login`,
          {
            username: this.username,
            password: this.password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.token) {
          // Save token to localStorage
          localStorage.setItem("token", response.data.token);

          // Set axios default header for future requests
          axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;

          // Redirect to dashboard
          this.$router.push("/dashboard");
        }
      } catch (error) {
        console.error("Login error:", error);
        this.error = error.response?.data?.message || "Login failed. Please check your credentials.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-colour);
  padding: 20px;
}

.login-card {
  background: var(--back-white);
  border-radius: 10px;
  box-shadow: var(--box-shadow-bottom);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  color: var(--text-colour);
  margin-bottom: 30px;
  font-size: 24px;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-colour);
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--tertiary-colour);
  border-radius: 5px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  background: var(--back-white);
  color: var(--text-colour);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-colour);
}

.error-message {
  color: var(--action-colour);
  text-align: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: var(--secondary-colour);
  border-radius: 5px;
  font-size: 14px;
  border: 1px solid var(--tertiary-colour);
}

.login-button {
  background: var(--primary-colour);
  color: var(--alt-text-colour);
  border: none;
  padding: 12px 20px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--box-shadow);
}

.login-button:hover:not(:disabled) {
  background: var(--tertiary-colour);
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-bottom);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--tertiary-colour);
}
</style>
