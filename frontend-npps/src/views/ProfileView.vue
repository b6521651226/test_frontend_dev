<template>
  <div class="profile-container">
    <h2>ข้อมูลส่วนตัว</h2>

    <!-- โหมดอ่าน -->
    <div v-if="!editMode" class="info">
      <p><b>ชื่อ-นามสกุล:</b> {{ profile.name }}</p>
      <p><b>เบอร์โทร:</b> {{ profile.phone }}</p>
      <p><b>ที่อยู่:</b> {{ profile.address }}</p>
      <button @click="editMode = true" class="edit-btn">แก้ไข</button>
    </div>

    <!-- โหมดแก้ไข -->
    <div v-else class="form">
      <label>ชื่อ-นามสกุล
        <input v-model="form.name" />
      </label>
      <label>เบอร์โทร
        <input v-model="form.phone" />
      </label>
      <label>ที่อยู่
        <textarea v-model="form.address"></textarea>
      </label>
      <label>รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)
        <input type="password" v-model="form.password" />
      </label>

      <div class="actions">
        <button @click="saveProfile" class="save-btn">บันทึก</button>
        <button @click="cancelEdit" class="cancel-btn">ยกเลิก</button>
      </div>
      <p v-if="msg" class="msg">{{ msg }}</p>
    </div>

    <h2>ประวัติการสั่งซื้อ</h2>
    <div v-if="orders.length === 0">ยังไม่มีการสั่งซื้อ</div>
    <div v-else class="orders">
      <div class="order" v-for="o in orders" :key="o.order_id">
        <div class="summary" @click="toggle(o.order_id)">
          <b>คำสั่งซื้อ #{{ o.order_id }}</b>
          <span>{{ format(o.total_price) }} ฿</span>
          <span class="status">สถานะ: {{ o.status }}</span>
          <small>{{ new Date(o.created_at).toLocaleString('th-TH') }}</small>
        </div>

        <div v-if="expanded === o.order_id" class="details">
          <ul>
            <li v-for="it in o.items" :key="it.product_id" class="item">
              <img :src="it.image_url" alt="" />
              <span>{{ it.product_name }} × {{ it.quantity }}</span>
              <b>{{ format(it.price * it.quantity) }} ฿</b>
              <small v-if="it.product_option">({{ it.product_option }})</small>
            </li>
          </ul>
          <div v-if="o.payment_slip_url" class="slip">
            <p>สลิปโอนเงิน:</p>
            <a :href="apiBase + o.payment_slip_url" target="_blank">
              <img :src="apiBase + o.payment_slip_url" alt="slip" />
            </a>
          </div>

          <!-- ✅ Tracking Number -->
          <div v-if="o.tracking_number" class="tracking">
            <p>📦 Tracking:</p>
            <a :href="o.tracking_number" target="_blank">{{ o.tracking_number }}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../lib/api'

const editMode = ref(false)
const profile = ref({ name: '', phone: '', address: '' })
const form = ref({ name: '', phone: '', address: '', password: '' })
const orders = ref([])
const expanded = ref(null)
const msg = ref('')
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

onMounted(async () => {
  await loadProfile()
  await loadOrders()
})

async function loadProfile() {
  try {
    const { data } = await api.get('/users/me')
    profile.value = data
    form.value = { ...data, password: '' }
  } catch (e) {
    console.error(e)
  }
}

function cancelEdit() {
  editMode.value = false
  form.value = { ...profile.value, password: '' }
}

async function saveProfile() {
  try {
    await api.patch('/users/me', {
      name: form.value.name,
      phone: form.value.phone,
      address: form.value.address,
      ...(form.value.password ? { password: form.value.password } : {})
    })
    profile.value = { ...form.value }
    editMode.value = false
    msg.value = 'บันทึกสำเร็จ'
  } catch (err) {
    console.error(err)
    msg.value = 'บันทึกล้มเหลว'
  }
}

async function loadOrders() {
  try {
    const { data } = await api.get('/orders/my')
    orders.value = data
  } catch (e) {
    console.error(e)
  }
}

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}

function format(n) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2 })
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
  font-family: 'Kanit', sans-serif;
}

.info p { margin: 6px 0; }
.edit-btn, .save-btn, .cancel-btn {
  margin-top: 10px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.edit-btn { background: #333; color: #fff; }
.save-btn { background: #28a745; color: #fff; }
.cancel-btn { background: #ccc; margin-left: 8px; }
.form label { display: block; margin-top: 10px; }
.form input, .form textarea {
  width: 100%; padding: 8px;
  border: 1px solid #ddd; border-radius: 6px;
}
.actions { margin-top: 12px; }
.msg { color: green; margin-top: 5px; }

.orders { display: grid; gap: 10px; margin-top: 20px; }
.order { border: 1px solid #eee; border-radius: 8px; background: #fff; }
.summary {
  padding: 10px; cursor: pointer;
  display: flex; flex-wrap: wrap;
  justify-content: space-between; align-items: center;
}
.details { padding: 10px; background: #fafafa; }
.item {
  display: flex; align-items: center;
  gap: 10px; margin-bottom: 6px;
}
.item img {
  width: 40px; height: 40px;
  object-fit: cover; border-radius: 6px;
}
.slip img {
  width: 200px; margin-top: 10px;
  border: 1px solid #ccc; border-radius: 8px;
}
.status { margin-left: 10px; font-size: 14px; }

.tracking {
  margin-top: 10px;
  padding: 8px;
  background: #eef6ff;
  border-radius: 6px;
  font-size: 14px;
}
.tracking a {
  color: #1976d2;
  text-decoration: none;
}
.tracking a:hover {
  text-decoration: underline;
}
</style>
