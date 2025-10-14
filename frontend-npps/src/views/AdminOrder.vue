<template>
  <div class="page">
    <AdminNavbar />

    <div class="container">
      <header class="header">
        <div class="title-wrap">
          <h1>จัดการคำสั่งซื้อ</h1>
          <p class="sub">ดูและอัปเดตสถานะคำสั่งซื้อทั้งหมด</p>
        </div>

        <div class="toolbar">
          <div class="search">
            <span class="icon">🔎</span>
            <input
              v-model.trim="search"
              type="text"
              placeholder="ค้นหาจากหมายเลขออเดอร์ / ชื่อลูกค้า / เบอร์โทร"
            />
          </div>

          <select v-model="statusFilter" class="select">
            <option value="">สถานะทั้งหมด</option>
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="shipping">shipping</option>
            <option value="done">done</option>
            <option value="cancel">cancel</option>
          </select>
        </div>
      </header>

      <div v-if="loading" class="skeleton">
        <div class="row" v-for="n in 4" :key="n"></div>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="empty">
        ยังไม่มีคำสั่งซื้อที่ตรงเงื่อนไข
      </div>

      <section v-else class="list">
        <article
          class="card"
          v-for="o in filteredOrders"
          :key="o.order_id"
        >
          <div class="row-head" @click="toggle(o.order_id)">
            <div class="left">
              <span class="code">#{{ o.order_id }}</span>
              <span class="name">{{ o.username }}</span>

              <!-- ✅ สถานะของออเดอร์ (เดิม) -->
              <span class="badge" :class="badgeClass(o.order_status)">{{ o.order_status }}</span>


            </div>

            <div class="right">
              <div class="meta">
                <span class="when">{{ formatDate(o.created_at) }}</span>
                <span class="total">{{ format(o.total_price) }} ฿</span>
              </div>
              <button
                class="btn ghost"
                @click.stop="toggle(o.order_id)"
                aria-label="รายละเอียด"
              >
                {{ expanded === o.order_id ? 'ซ่อน' : 'รายละเอียด' }}
              </button>
            </div>
          </div>

          <transition name="fade">
            <div v-if="expanded === o.order_id" class="details">
              <div class="grid">
                <div class="block">
                  <h4>ข้อมูลผู้รับ</h4>
                  <p><b>ที่อยู่:</b> {{ o.address || '-' }}</p>
                  <p><b>เบอร์โทร:</b> {{ o.phone || '-' }}</p>
                </div>

                <div class="block">
                  <h4>การชำระเงิน</h4>
                  <p>ยอดที่จ่าย: <b>{{ format(o.total_price) }} ฿</b></p>
                  <div v-if="o.payment_slip_url" class="slip">
                    <p>สลิปโอนเงิน:</p>
                    <img :src="apiBase + o.payment_slip_url" alt="slip" />
                  </div>


                </div>

                <div class="block">
                  <h4>การจัดส่ง</h4>
                  <div class="track">
                    <input
                      v-model="o.tracking_number"
                      placeholder="Tracking number"
                    />
                  </div>
                </div>
              </div>

              <!-- ✅ บล็อกสินค้า -->
              <div class="items">
                <h4>สินค้าในออเดอร์</h4>
                <ul class="items-list">
                  <li
                    v-for="it in o.items"
                    :key="it.order_item_id"
                    class="item"
                  >
                    <img :src="apiBase + it.image_url" alt="" />
                    <div class="meta">
                      <div class="name">{{ it.product_name }}</div>
                      <div class="sub">
                        x{{ it.quantity }}
                        <span v-if="it.product_option" class="note">({{ it.product_option }})</span>
                      </div>
                    </div>
                    <div class="price">{{ format(it.price * it.quantity) }} ฿</div>
                  </li>
                </ul>
              </div>

              <div class="actions">
                <label class="status-select">
                  <span>อัปเดตสถานะออเดอร์:</span>
                  <select v-model="o.order_status">
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="shipping">shipping</option>
                    <option value="done">done</option>
                    <option value="cancel">cancel</option>
                  </select>
                </label>

                <div class="spacer"></div>

                <button class="btn primary" @click="updateStatus(o)">
                  บันทึกการเปลี่ยนแปลง
                </button>

                <!-- ✅ ปุ่มลบออเดอร์ (แสดงเมื่อค้างชำระ > 20 นาที และยัง pending) -->
                <button
                  v-if="allowDelete(o)"
                  class="btn danger"
                  @click="forceDelete(o)"
                  title="ลบออเดอร์นี้ออกจากระบบ"
                >
                  ลบออเดอร์
                </button>
              </div>
            </div>
          </transition>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../lib/api'
import AdminNavbar from '../components/AdminNavbar.vue'

const orders = ref([])
const loading = ref(true)
const expanded = ref(null)

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

// ค้นหา + กรองสถานะ (เฉพาะฝั่งหน้าเว็บ)
const search = ref('')
const statusFilter = ref('')

onMounted(loadOrders)

async function loadOrders() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/orders')
    orders.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const filteredOrders = computed(() => {
  let list = orders.value.slice()

  // กรองสถานะ ถ้าเลือก
  if (statusFilter.value) {
    list = list.filter(o => (o.order_status || '').toLowerCase() === statusFilter.value)
  }

  // ค้นหา order_id / ชื่อ / โทร
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase()
    list = list.filter(o =>
      String(o.order_id).includes(q) ||
      (o.username || '').toLowerCase().includes(q) ||
      (o.phone || '').toLowerCase().includes(q)
    )
  }

  return list
})

async function updateStatus(order) {
  try {
    await api.patch(`/admin/orders/${order.order_id}`, {
      status: order.order_status,
      tracking_number: order.tracking_number
    })
    alert('อัปเดตสถานะเรียบร้อย')
    await loadOrders()
    expanded.value = order.order_id
  } catch (e) {
    console.error(e)
    alert('อัปเดตไม่สำเร็จ')
  }
}

/* ✅ อัปเดตสถานะการชำระเงิน (รองรับ need_review) */
async function updatePaymentStatus(order) {
  try {
    await api.patch(`/admin/payments/by-order/${order.order_id}`, {
      status: order.payment_status
    })
    alert('อัปเดตสถานะการชำระเงินเรียบร้อย')
  } catch (e) {
    console.error(e)
    alert('อัปเดตสถานะการชำระเงินไม่สำเร็จ')
  }
}

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}

function format(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })
}

// แสดงวัน–เวลาเป็นโซนไทย
function formatDate(dt) {
  if (!dt) return '-'
  try {
    const date = new Date(dt)
    return date.toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return String(dt)
  }
}

// สีป้ายสถานะออเดอร์ (เดิม)
function badgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'pending': return 'warn'
    case 'paid': return 'info'
    case 'shipping': return 'accent'
    case 'done': return 'good'
    case 'cancel': return 'bad'
    default: return 'soft'
  }
}

/* ✅ สีป้ายสถานะการชำระเงิน */
function payBadgeClass(status) {
  switch ((status || '').toLowerCase()) {
    case 'pending': return 'soft'
    case 'paid': return 'good'
    case 'rejected': return 'bad'
    case 'need_review': return 'warn' // ใช้โทนส้มเดียวกับ pending เพื่อดึงสายตา
    default: return 'soft'
  }
}

/* ✅ เงื่อนไขปุ่มลบ: ออเดอร์ pending + ยังไม่จ่าย + เกิน 20 นาที */
function allowDelete(order) {
  if ((order.order_status || '').toLowerCase() !== 'pending') return false
  if ((order.payment_status || '').toLowerCase() === 'paid') return false
  if (!order.created_at) return false
  const created = new Date(order.created_at).getTime()
  const now = Date.now()
  const diffMin = (now - created) / 60000
  return diffMin >= 20
}

/* ✅ ลบออเดอร์ (ยืนยันก่อน) */
async function forceDelete(order) {
  const ok = confirm(`ยืนยันลบออเดอร์ #${order.order_id} ?\n(ใช้เมื่อค้างชำระเกิน 20 นาทีเท่านั้น)`)
  if (!ok) return
  try {
    await api.delete(`/admin/orders/${order.order_id}`)
    alert('ลบออเดอร์เรียบร้อย')
    await loadOrders()
  } catch (e) {
    console.error(e)
    alert('ลบออเดอร์ไม่สำเร็จ')
  }
}
</script>

<style scoped>
/* ---------- Layout ---------- */
.page { background: #ffffff; min-height: 100vh; }
.container { max-width: 1080px; margin: 24px auto; padding: 0 16px; font-family: 'Kanit', sans-serif; }

.header { display: grid; gap: 12px; margin-bottom: 14px; }
.title-wrap h1 { margin: 0; font-size: 24px; font-weight: 700; }
.title-wrap .sub { margin: 2px 0 0; color: #6b7280; font-size: 14px; }

.toolbar {
  display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-top: 8px;
}

.search { position: relative; flex: 1 1 320px; max-width: 520px; margin-right: 36px; }
.search .icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; }
.search input {
  width: 100%; padding: 10px 12px 10px 30px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; outline: none;
}
.search input:focus { border-color: #f1c40f; box-shadow: 0 0 0 3px rgba(241,196,15,.15); }

.select { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; }

/* ---------- Cards ---------- */
.list { display: grid; gap: 12px; }
.card {
  border: 1px solid #ececec; background: #fff; border-radius: 14px; overflow: hidden;
  box-shadow: 0 6px 16px rgba(0,0,0,.04);
}
.row-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 14px 16px; cursor: pointer; }
.row-head:hover { background: #fafafa; }
.left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.code { font-weight: 700; color: #111827; }
.name { color: #374151; max-width: 40vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.right { display: flex; align-items: center; gap: 10px; }
.meta { display: grid; text-align: right; gap: 2px; }
.meta .when { color: #6b7280; font-size: 12px; }
.meta .total { font-weight: 700; }

.details { padding: 0 16px 16px; border-top: 1px dashed #eee; }

.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top: 12px; }
.block { background: #fafafa; border: 1px solid #eee; border-radius: 12px; padding: 12px; }
.block h4 { margin: 0 0 8px; font-size: 14px; color: #374151; }

.slip img { width: 220px; border-radius: 10px; border: 1px solid #e5e7eb; }

/* ---------- Items (เหมือนหน้า Profile) ---------- */
.items { margin-top: 14px; }
.items h4 { margin: 0 0 8px; color: #374151; }
.items-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.item { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 8px 10px; }
.item img { width: 56px; height: 56px; object-fit: cover; border-radius: 10px; border: 1px solid #eee; }
.item .meta { flex: 1; }
.item .name { font-weight: 600; }
.item .sub { color: #777; font-size: 13px; }
.item .note { color: #999; }
.item .price { font-weight: 700; }

/* ---------- Actions ---------- */
.actions { display: flex; align-items: center; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
.status-select { display:flex; align-items:center; gap:8px; }
.status-select select { padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; }
.spacer { flex: 1; }

/* ---------- Badges & Buttons ---------- */
.badge {
  font-size: 12px; padding: 4px 8px; border-radius: 999px; border: 1px solid transparent;
}
.badge.soft { background:#f3f4f6; color:#374151; }
.badge.warn { background:#fff7ed; color:#9a3412; border-color:#fed7aa; }
.badge.info { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
.badge.accent { background:#ecfeff; color:#0e7490; border-color:#a5f3fc; }
.badge.good { background:#ecfdf5; color:#047857; border-color:#a7f3d0; }
.badge.bad { background:#fef2f2; color:#b91c1c; border-color:#fecaca; }

.btn {
  padding: 8px 12px; border-radius: 10px; border: 1px solid #111827; background: #111827; color: #fff; cursor: pointer;
}
.btn:hover { filter: brightness(.95); }
.btn.primary { background: #f1c40f; border-color: #f1c40f; color: #111827; }
.btn.ghost { background: #fff; color: #111827; border-color: #e5e7eb; }
.btn.ghost:hover { background:#f9fafb; }
.btn.danger { background:#b91c1c; border-color:#b91c1c; } /* ✅ ปุ่มลบ */

.track { display:flex; gap:8px; margin-top: 6px; }
.track input { flex:1; padding: 8px 10px; border:1px solid #e5e7eb; border-radius:10px; outline:none; background:#fff; }
.track input:focus { border-color:#f1c40f; box-shadow: 0 0 0 3px rgba(241,196,15,.15); }

/* ---------- States ---------- */
.skeleton .row {
  height: 76px; border-radius: 12px; background: linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%);
  background-size: 400% 100%; animation: shimmer 1.4s ease infinite; margin-bottom: 10px;
}
@keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:0 0} }

.empty { margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; background: #fff; border:1px dashed #e5e7eb; border-radius: 12px; }

/* ---------- Transitions ---------- */
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
