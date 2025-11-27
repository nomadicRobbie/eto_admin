<template>
  <div class="dashboard">
    <div class="dashboard-content">
      <div class="orders-section">
        <div class="orders-header">
          <h3>Order Management</h3>

          <!-- Status Filter Buttons -->
          <div class="status-filters">
            <button @click="changeStatus('pending')" :class="['filter-btn', { active: currentStatus === 'pending' }]">Pending ({{ orderCounts.pending_count }})</button>
            <button @click="changeStatus('packed')" :class="['filter-btn', { active: currentStatus === 'packed' }]">Packed ({{ orderCounts.packed_count }})</button>
            <button @click="changeStatus('fulfilled')" :class="['filter-btn', { active: currentStatus === 'fulfilled' }]">Fulfilled ({{ orderCounts.fulfilled_count }})</button>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="order-summary">
          <p>Total Orders: {{ orderCounts.total_orders }} | Showing: {{ currentStatus }} orders ({{ orders.length }})</p>
        </div>

        <div v-if="loading" class="loading-message">Loading orders...</div>

        <div v-else-if="error" class="error-message">{{ error }}</div>

        <div v-else-if="orders.length === 0" class="no-orders">No {{ currentStatus }} orders found.</div>

        <div v-else class="orders-grid">
          <div v-for="order in orders" :key="order._id" class="order-card">
            <!-- Order Header -->
            <div class="order-header">
              <div class="order-info">
                <h4>Order #{{ order.orderId }}</h4>
                <p class="order-date">{{ formatDate(order.created_at) }}</p>
              </div>
              <div class="order-total">
                <span class="total-amount">£{{ order.total }}</span>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="customer-info">
              <h5>Customer Details</h5>
              <p><strong>Name:</strong> {{ order.name || "N/A" }}</p>
              <p><strong>Email:</strong> {{ order.email || "N/A" }}</p>
              <p><strong>Phone:</strong> {{ order.phone || "N/A" }}</p>
            </div>

            <!-- Shipping Address -->
            <div class="shipping-info" v-if="order.shipping_address">
              <h5>Shipping Address</h5>
              <p>{{ order.shipping_address.line1 }}</p>
              <p v-if="order.shipping_address.line2">{{ order.shipping_address.line2 }}</p>
              <p>{{ order.shipping_address.city }}</p>
              <p class="postcode">{{ order.shipping_address.postalCode }}</p>
            </div>
            <div class="shipping-info" v-else>
              <h5>Shipping Address</h5>
              <p class="no-address">No shipping address provided</p>
            </div>

            <!-- Order Items -->
            <div class="order-items">
              <h5>Items Ordered</h5>
              <div v-for="item in order.items" :key="item.id" class="order-item">
                <div class="item-info">
                  <span class="item-title">{{ item.title }}</span>
                  <span class="item-details">Size: {{ item.selectedSize }}</span>
                </div>
                <div class="item-quantity">
                  <span>Qty: {{ item.quantity }}</span>
                  <span class="item-price">£{{ item.price }}</span>
                </div>
              </div>
            </div>

            <!-- Payment Status -->
            <div class="payment-status" v-if="order.paymentInfo">
              <span class="status-badge" :class="getPaymentStatusClass(order.paymentInfo.status)">
                {{ formatPaymentStatus(order.paymentInfo.status) }}
              </span>
            </div>
            <div class="payment-status" v-else>
              <span class="status-badge pending">Payment Info Not Available</span>
            </div>

            <!-- Order Status Display -->
            <div class="order-status-display">
              <span v-if="order.packed && order.fulfilled" class="status-badge fulfilled-badge"> Fulfilled ✓ </span>
              <span v-else-if="order.packed" class="status-badge packed-badge"> Packed & Ready </span>
              <span v-else class="status-badge pending-badge"> New Order </span>
            </div>

            <!-- Action Buttons -->
            <div class="order-actions">
              <!-- Pack Button (only show for pending orders) -->
              <button v-if="!order.packed && currentStatus === 'pending'" @click="togglePacked(order.orderId)" class="pack-btn">Mark as Packed</button>

              <!-- Fulfill Button (only show for packed orders) -->
              <button v-if="order.packed && !order.fulfilled && currentStatus === 'packed'" @click="toggleFulfilled(order.orderId)" class="fulfill-btn">Mark as Fulfilled</button>

              <!-- Show timestamps if available -->
              <div v-if="order.packed_at || order.fulfilled_at" class="timestamps">
                <p v-if="order.packed_at" class="timestamp">Packed: {{ formatDate(order.packed_at) }}</p>
                <p v-if="order.fulfilled_at" class="timestamp">Fulfilled: {{ formatDate(order.fulfilled_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "DashboardView",
  data() {
    return {
      apiUrl: process.env.VUE_APP_API_URL || "http://localhost:4242",
      orders: [],
      loading: false,
      error: null,
      currentStatus: "pending",
      orderCounts: {
        total_orders: 0,
        pending_count: 0,
        packed_count: 0,
        fulfilled_count: 0,
      },
    };
  },
  mounted() {
    this.fetchOrders("pending");
  },
  methods: {
    async fetchOrders(status = "pending") {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`${this.apiUrl}/protected/orders?status=${status}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        this.orders = response.data.web_orders || [];
        this.orderCounts = {
          total_orders: response.data.total_orders || 0,
          pending_count: response.data.pending_count || 0,
          packed_count: response.data.packed_count || 0,
          fulfilled_count: response.data.fulfilled_count || 0,
        };
        this.currentStatus = status;
      } catch (error) {
        console.error("Error fetching orders:", error);
        this.error = "Failed to load orders";
        this.orders = [];
      } finally {
        this.loading = false;
      }
    },

    async togglePacked(orderIdToUpdate) {
      try {
        await axios.put(
          `${this.apiUrl}/protected/orders/${orderIdToUpdate}/pack`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        // Refresh orders to show updated status
        await this.fetchOrders(this.currentStatus);
      } catch (error) {
        console.error("Error packing order:", error);
        this.error = "Failed to pack order";
      }
    },

    async toggleFulfilled(orderIdToUpdate) {
      try {
        await axios.put(
          `${this.apiUrl}/protected/orders/${orderIdToUpdate}/fulfill`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        // Refresh orders to show updated status
        await this.fetchOrders(this.currentStatus);
      } catch (error) {
        console.error("Error fulfilling order:", error);
        this.error = "Failed to fulfill order";
      }
    },

    changeStatus(status) {
      this.currentStatus = status;
      this.fetchOrders(status);
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    getPaymentStatusClass(status) {
      return status === "succeeded" ? "success" : "pending";
    },

    formatPaymentStatus(status) {
      return status === "succeeded" ? "Payment Completed" : "Payment Pending";
    },
  },
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: var(--background-colour);
}

.dashboard-content {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  background: var(--back-white);
  padding: 30px;
  border-radius: 10px;
  box-shadow: var(--box-shadow);
  margin-bottom: 30px;
  text-align: center;
  border: 1px solid var(--secondary-colour);
}

.welcome-card h2 {
  color: var(--text-colour);
  margin-bottom: 10px;
}

.welcome-card p {
  color: var(--tertiary-colour);
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--back-white);
  padding: 25px;
  border-radius: 10px;
  box-shadow: var(--box-shadow);
  text-align: center;
  border: 1px solid var(--secondary-colour);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--box-shadow-bottom);
}

.stat-card h3 {
  color: var(--tertiary-colour);
  margin: 0 0 10px 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-number {
  color: var(--primary-colour);
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

/* Orders Section */
.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.orders-section h3 {
  color: var(--text-colour);
  margin: 0;
  font-size: 20px;
}

.status-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid var(--tertiary-colour);
  background: var(--back-white);
  color: var(--tertiary-colour);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: var(--secondary-colour);
}

.filter-btn.active {
  background: var(--primary-colour);
  color: var(--alt-text-colour);
  border-color: var(--primary-colour);
}

.order-summary {
  background: var(--secondary-colour);
  padding: 12px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid var(--tertiary-colour);
}

.order-summary p {
  margin: 0;
  color: var(--text-colour);
  font-weight: 500;
}

.loading-message,
.no-orders {
  text-align: center;
  padding: 40px;
  color: var(--tertiary-colour);
  font-size: 16px;
}

.error-message {
  text-align: center;
  padding: 20px;
  background: var(--secondary-colour);
  color: var(--action-colour);
  border-radius: 8px;
  border: 1px solid var(--tertiary-colour);
}

.orders-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.order-card {
  background: var(--back-white);
  border-radius: 12px;
  box-shadow: var(--box-shadow);
  border: 1px solid var(--secondary-colour);
  padding: 20px;
  transition: all 0.3s ease;
}

.order-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--box-shadow-bottom);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--secondary-colour);
}

.order-info h4 {
  color: var(--primary-colour);
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.order-date {
  color: var(--tertiary-colour);
  font-size: 14px;
  margin: 0;
}

.total-amount {
  font-size: 24px;
  font-weight: bold;
  color: var(--action-colour);
}

.customer-info,
.shipping-info,
.order-items {
  margin-bottom: 15px;
}

.customer-info h5,
.shipping-info h5,
.order-items h5 {
  color: var(--text-colour);
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.customer-info p,
.shipping-info p {
  margin: 3px 0;
  color: var(--tertiary-colour);
  font-size: 14px;
}

.postcode {
  text-transform: uppercase;
}

.no-address {
  font-style: italic;
  color: var(--action-colour) !important;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--secondary-colour);
  border-radius: 6px;
  margin-bottom: 8px;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-title {
  font-weight: 600;
  color: var(--text-colour);
}

.item-details {
  font-size: 12px;
  color: var(--tertiary-colour);
}

.item-quantity {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 14px;
  color: var(--tertiary-colour);
}

.item-price {
  font-weight: 600;
  color: var(--primary-colour);
}

.payment-status {
  margin-bottom: 15px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.order-status-display {
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}

.pending-badge {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.packed-badge {
  background: #cce5ff;
  color: #004085;
  border: 1px solid #85c5ff;
}

.fulfilled-badge {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.order-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pack-btn,
.fulfill-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.pack-btn {
  background: var(--tertiary-colour);
  color: var(--alt-text-colour);
}

.pack-btn:hover {
  background: var(--primary-colour);
  transform: translateY(-2px);
}

.fulfill-btn {
  background: var(--action-colour);
  color: var(--alt-text-colour);
}

.fulfill-btn:hover {
  background: var(--primary-colour);
  transform: translateY(-2px);
}

.timestamps {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--secondary-colour);
}

.timestamp {
  margin: 2px 0;
  font-size: 12px;
  color: var(--tertiary-colour);
  font-style: italic;
}
</style>
