<template>
  <div>
    <AdminNavbar />

    <h2>จัดการคำสั่งซื้อ</h2>

    <div v-if="loading">กำลังโหลด...</div>
    <div v-else-if="orders.length === 0">ยังไม่มีคำสั่งซื้อ</div>

    <div v-else class="orders">
      <div class="order" v-for="o in orders" :key="o.order_id">
        <div class="summary">
        <b>#{{ o.order_id }}</b>  {{ o.username }}
        <span>{{ format(o.total_price) }} ฿</span>
        <span class="status">สถานะ: {{ o.order_status }}</span>
        <button @click="toggle(o.order_id)">รายละเอียด</button>
        </div>

        <div v-if="expanded === o.order_id" class="details">
          <p><b>วันเวลา:</b> {{ o.created_at }}</p>
          <p><b>ที่อยู่:</b> {{ o.address }}</p>
          <p><b>เบอร์โทร:</b> {{ o.phone }}</p>

          <h4>สินค้า</h4>
          <ul>
            <li v-for="it in o.items" :key="it.order_item_id">
              {{ it.product_name }} × {{ it.quantity }}
              = {{ format(it.price * it.quantity) }} ฿
              <small v-if="it.product_option">({{ it.product_option }})</small>
            </li>
          </ul>

          <h4>การชำระเงิน</h4>
          <p>ยอดที่จ่าย: {{ format(o.total_price) }} ฿</p>
          <p>สถานะจ่ายเงิน: {{ o.payment_status }}</p>
            <div v-if="o.payment_slip_url">
            <p>สลิปโอนเงิน:</p>
            <img :src="apiBase + o.payment_slip_url" class="slip" />
            </div>

          <h4>การจัดส่ง</h4>
          <p>สถานะส่ง: {{ o.delivery_status }}</p>
          <input v-model="o.tracking_number" placeholder="Tracking number" />

          <h4>อัปเดตสถานะออเดอร์</h4>
          <select v-model="o.order_status">
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="shipping">shipping</option>
            <option value="done">done</option>
            <option value="cancel">cancel</option>
          </select>

          <button @click="updateStatus(o)">บันทึกการเปลี่ยนแปลง</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../lib/api'
import AdminNavbar from '../components/AdminNavbar.vue'

const orders = ref([])
const loading = ref(true)
const expanded = ref(null)
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

onMounted(loadOrders)

async function loadOrders() {
  try {
    const { data } = await api.get('/admin/orders')
    orders.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function updateStatus(order) {
  try {
    await api.patch(`/admin/orders/${order.order_id}`, {
      status: order.order_status,
      tracking_number: order.tracking_number
    })
    alert('อัปเดตสถานะเรียบร้อย')
    await loadOrders()
  } catch (e) {
    console.error(e)
    alert('อัปเดตไม่สำเร็จ')
  }
}

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}

function format(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })
}
</script>

<style scoped>
.orders { display: grid; gap: 12px; margin-top: 20px; }
.order { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
.summary { display: flex; justify-content: space-between; align-items: center; }
.status { margin-left: 12px; }
.details { margin-top: 10px; background: #fafafa; padding: 10px; border-radius: 6px; }
.slip { width: 200px; margin-top: 10px; border: 1px solid #ccc; }
</style>
