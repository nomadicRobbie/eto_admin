<template>
  <nav class="main-navigation" v-if="isAuthenticated">
    <div class="nav-container">
      <div class="nav-left">
        <h1 class="app-title">ETO Admin</h1>
        <div class="nav-links">
          <router-link to="/dashboard" class="nav-link" :class="{ active: $route.name === 'dashboard' }"> Orders </router-link>
          <router-link to="/products" class="nav-link" :class="{ active: $route.name === 'products' }"> Products </router-link>
        </div>
      </div>
      <div class="nav-right">
        <button @click="logout" class="logout-button">Logout</button>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: "MainNavigation",
  computed: {
    isAuthenticated() {
      // Check if user is authenticated by checking for token and current route
      const token = localStorage.getItem("token");
      const isLoginPage = this.$route.name === "login";
      return token && !isLoginPage;
    },
  },
  methods: {
    logout() {
      // Remove token from localStorage
      localStorage.removeItem("token");

      // Remove authorization header
      delete this.$http?.defaults?.headers?.common["Authorization"];

      // Redirect to login
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
.main-navigation {
  background: var(--back-white);
  box-shadow: var(--box-shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.app-title {
  color: var(--text-colour);
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.nav-links {
  display: flex;
  gap: 15px;
}

.nav-link {
  background: transparent;
  border: 2px solid var(--tertiary-colour);
  color: var(--tertiary-colour);
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-block;
}

.nav-link:hover {
  background: var(--secondary-colour);
  transform: translateY(-1px);
}

.nav-link.active {
  background: var(--primary-colour);
  color: var(--alt-text-colour);
  border-color: var(--primary-colour);
}

.logout-button {
  background: var(--action-colour);
  color: var(--alt-text-colour);
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: var(--box-shadow);
}

.logout-button:hover {
  background: var(--primary-colour);
  transform: translateY(-2px);
}

/* Responsive design */
@media (max-width: 768px) {
  .nav-container {
    padding: 15px 20px;
    flex-direction: column;
    gap: 15px;
  }

  .nav-left {
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }

  .app-title {
    font-size: 20px;
  }

  .nav-links {
    gap: 10px;
  }

  .nav-link {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>
