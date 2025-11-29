import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import ProductsView from "../views/ProductsView.vue";

const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: "/products",
    name: "products",
    component: ProductsView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Token validation helper
function isTokenValid() {
  const tokenDataString = localStorage.getItem("tokenData");
  if (!tokenDataString) return false;

  try {
    const tokenData = JSON.parse(tokenDataString);
    const now = Date.now();
    return now < tokenData.expiresAt;
  } catch (error) {
    console.error("Invalid token data format:", error);
    return false;
  }
}

// Route guard for authentication
router.beforeEach((to, from, next) => {
  const hasValidToken = isTokenValid();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !hasValidToken) {
    // Clear invalid/expired token data
    localStorage.removeItem("token");
    localStorage.removeItem("tokenData");
    next("/login");
  } else if (to.name === "login" && hasValidToken) {
    next("/dashboard");
  } else {
    next();
  }
});

export default router;
