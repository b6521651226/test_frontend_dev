<template>
  <div class="wrap">
    <h2 class="page-title">ข้อมูลส่วนตัว</h2>

    <!-- โปรไฟล์ -->
    <div class="card profile">
      <template v-if="!editMode">
        <div class="profile-grid">
          <div class="row">
            <span class="label">ชื่อ-นามสกุล</span>
            <span class="value">{{ profile.name || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">เบอร์โทร</span>
            <span class="value">{{ profile.phone || '-' }}</span>
          </div>
          <div class="row">
            <span class="label">ที่อยู่</span>
            <span class="value">{{ profile.address || '-' }}</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn primary" @click="editMode = true">แก้ไขข้อมูล</button>
        </div>
      </template>

      <template v-else>
        <div class="form-grid">
          <label>ชื่อ-นามสกุล
            <input v-model="form.name" />
          </label>
          <label>เบอร์โทร
            <input v-model="form.phone" />
          </label>
          <label>ที่อยู่
            <textarea v-model="form.address" rows="3"></textarea>
          </label>
          <label>รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)
            <input type="password" v-model="form.password" />
          </label>
        </div>

        <div class="actions">
          <button class="btn primary" @click="saveProfile" :disabled="saving">
            {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
          <button class="btn ghost" @click="cancelEdit" :disabled="saving">ยกเลิก</button>
        </div>

        <p v-if="msg" class="msg">{{ msg }}</p>
      </template>
    </div>

    <!-- ประวัติการสั่งซื้อ -->
    <h2 class="page-title mt">ประวัติการสั่งซื้อ</h2>

    <div v-if="orders.length === 0" class="empty">ยังไม่มีการสั่งซื้อ</div>

    <div v-else class="orders">
      <div class="order-card" v-for="o in orders" :key="o.order_id">
        <!-- Header -->
        <div class="order-info-row">
          <span class="dt">{{ toThaiDateTime(o.created_at) }}</span>
          <span class="amt">{{ format(o.total_price) }} ฿</span>
          <span class="status-text">
            <span class="badge" :class="`st-${o.status}`">{{ o.status }}</span>
          </span>
          <div class="actions-row">

            <!-- ✅ ปุ่มยกเลิก (เฉพาะสถานะ pending) -->
            <button
              v-if="o.status === 'pending'"
              class="btn danger sm"
              :disabled="cancellingId === o.order_id"
              @click="cancelOrder(o)"
            >
              {{ cancellingId === o.order_id ? 'กำลังยกเลิก...' : 'ยกเลิกคำสั่งซื้อ' }}
            </button>

            <!-- ✅ ปุ่มลูกค้ายืนยันรับสินค้า (เฉพาะ shipping) -->
            <button
              v-if="o.status === 'shipping'"
              class="btn primary sm"
              :disabled="confirmingId === o.order_id"
              @click="confirmReceived(o)"
            >
              {{ confirmingId === o.order_id ? 'กำลังบันทึก...' : 'ได้รับสินค้าแล้ว' }}
            </button>

            <button class="btn ghost sm" @click="toggle(o.order_id)">
              {{ expanded === o.order_id ? 'ซ่อน' : 'รายละเอียด' }}
            </button>
          </div>
        </div>

        <!-- Detail -->
        <transition name="fade">
          <div v-if="expanded === o.order_id" class="order-body">

            <!-- ✅ กล่องเครื่องมือชำระเงินย้อนหลัง (เฉพาะ pending / needs_review) -->
            <div
              v-if="o.status === 'pending' || o.status === 'needs_review'"
              class="retro-box"
            >
              <div class="retro-row">
                <button
                  class="btn ghost sm"
                  @click="toggleQR(o)"
                  :disabled="loadingQRId === o.order_id"
                >
                  {{ showQR[o.order_id] ? 'ซ่อน QR' : (loadingQRId === o.order_id ? 'กำลังโหลด QR...' : 'ดู QR สำหรับออเดอร์นี้') }}
                </button>

                <div class="fileup">
                  <input
                    type="file"
                    accept="image/*"
                    :id="`slip-${o.order_id}`"
                    @change="onPickSlip(o, $event)"
                  />
                </div>

                <button
                  class="btn primary sm"
                  :disabled="!slipFiles[o.order_id] || uploadingId === o.order_id"
                  @click="submitSlip(o)"
                >
                  {{ uploadingId === o.order_id ? 'กำลังอัปโหลด...' : 'อัปสลิปยืนยัน' }}
                </button>
              </div>

              <div v-if="showQR[o.order_id] && qrUrls[o.order_id]" class="qr-wrap">
                <img :src="qrUrls[o.order_id]" alt="Order QR" />
                <div class="hint">สแกน QR เพื่อชำระ แล้วอัปโหลดสลิปด้านบน</div>
              </div>
            </div>
            <!-- /retro tools -->

            <!-- รายการสินค้า -->
            <ul class="items">
              <li v-for="it in o.items" :key="`${o.order_id}-${it.product_id}`" class="item">
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

            <!-- สลิปเดิม (ถ้ามี) -->
            <div v-if="o.payment_slip_url" class="slip">
              <div class="slip-title">สลิปโอนเงิน</div>
              <a :href="apiBase + o.payment_slip_url" target="_blank" rel="noopener">
                <img :src="apiBase + o.payment_slip_url" alt="slip" />
              </a>
            </div>

            <!-- tracking (ถ้ามี) -->
            <div v-if="o.tracking_number" class="tracking">
              <span class="truck">📦</span>
              <span class="t-title">Tracking:</span>
              <a :href="o.tracking_number" target="_blank" rel="noopener">{{ o.tracking_number }}</a>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../lib/api'

const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

const editMode = ref(false)
const saving = ref(false)
const profile = ref({ name: '', phone: '', address: '' })
const form = ref({ name: '', phone: '', address: '', password: '' })
const msg = ref('')

const orders = ref([])
const expanded = ref(null)
const cancellingId = ref(null)

/* ✅ states ใหม่สำหรับอัปสลิปย้อนหลัง + แสดง QR */
const slipFiles = ref({})        // { [orderId]: File }
const uploadingId = ref(null)    // กำลังอัปสลิปของ order ไหน
const qrUrls = ref({})           // { [orderId]: 'http://...' }
const showQR = ref({})           // { [orderId]: boolean }
const loadingQRId = ref(null)    // กำลังโหลด QR ของ order ไหน
const confirmingId = ref(null)   // กำลัง confirm received ของ order ไหน

onMounted(async () => {
  await loadProfile()
  await loadOrders()
})

async function loadProfile() {
  try {
    const { data } = await api.get('/users/me')
    profile.value = data || {}
    form.value = { ...profile.value, password: '' }
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
    saving.value = true
    await api.patch('/users/me', {
      name: form.value.name,
      phone: form.value.phone,
      address: form.value.address,
      ...(form.value.password ? { password: form.value.password } : {})
    })
    profile.value = { ...form.value, password: '' }
    editMode.value = false
    msg.value = 'บันทึกสำเร็จ'
    setTimeout(() => (msg.value = ''), 1800)
  } catch (err) {
    console.error(err)
    msg.value = 'บันทึกล้มเหลว'
  } finally {
    saving.value = false
  }
}

async function loadOrders() {
  try {
    const { data } = await api.get('/orders/my')
    orders.value = data || []
  } catch (e) {
    console.error(e)
  }
}

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}

function format(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function toThaiDateTime(dt) {
  try {
    return new Date(dt).toLocaleString('th-TH', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return dt
  }
}

async function cancelOrder(o) {
  if (o.status !== 'pending') return
  if (!confirm(`ยืนยันยกเลิกคำสั่งซื้อ #${o.order_id} ?`)) return

  try {
    cancellingId.value = o.order_id
    await api.patch(`/orders/${o.order_id}/cancel`)
    await loadOrders()
    if (expanded.value === o.order_id) expanded.value = null
    alert('ยกเลิกคำสั่งซื้อเรียบร้อย')
  } catch (e) {
    console.error(e)
    alert(e?.response?.data?.message || 'ยกเลิกคำสั่งซื้อไม่สำเร็จ')
  } finally {
    cancellingId.value = null
  }
}

/* ========== อัปสลิปย้อนหลัง ========== */
function onPickSlip(o, ev) {
  const f = ev.target.files?.[0]
  if (f) {
    slipFiles.value = { ...slipFiles.value, [o.order_id]: f }
  }
}

async function submitSlip(o) {
  if (!slipFiles.value[o.order_id]) return
  try {
    uploadingId.value = o.order_id
    const fd = new FormData()
    fd.append('slip', slipFiles.value[o.order_id])

    // ยิงแบบ path param ก่อน
    try {
      await api.post(`/payments/verify-slip/${o.order_id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } catch (_e) {
      // สำรองแบบ query
      await api.post(`/payments/verify-slip?order_id=${o.order_id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    // โหลดข้อมูลออเดอร์ใหม่
    await loadOrders()
    alert('ส่งสลิปเรียบร้อย กำลังตรวจสอบ')
  } catch (e) {
    console.error(e)
    alert(e?.response?.data?.message || 'อัปสลิปไม่สำเร็จ')
  } finally {
    uploadingId.value = null
  }
}

/* ========== ดู QR ของออเดอร์ ========== */
async function toggleQR(o) {
  const id = o.order_id
  if (showQR.value[id]) {
    showQR.value = { ...showQR.value, [id]: false }
    return
  }
  try {
    loadingQRId.value = id
    const { data } = await api.get(`/payments/by-order/${id}`)
    const url = data?.qr_image_url
      ? (String(data.qr_image_url).startsWith('http') ? data.qr_image_url : `${apiBase}${data.qr_image_url}`)
      : ''
    qrUrls.value = { ...qrUrls.value, [id]: url }
    showQR.value = { ...showQR.value, [id]: true }
  } catch (e) {
    console.error(e)
    alert('โหลด QR ไม่สำเร็จ')
  } finally {
    loadingQRId.value = null
  }
}

/* ========== ลูกค้ายืนยันรับสินค้า (mark done) ========== */
async function confirmReceived(o) {
  if (o.status !== 'shipping') return
  if (!confirm(`ยืนยันได้รับสินค้าแล้วสำหรับ #${o.order_id} ?`)) return
  try {
    confirmingId.value = o.order_id
    await api.patch(`/orders/${o.order_id}/received`) // <- ต้องมี route ฝั่ง backend
    await loadOrders()
    alert('อัปเดตเป็น DONE แล้ว ขอบคุณครับ')
  } catch (e) {
    console.error(e)
    alert(e?.response?.data?.message || 'อัปเดตไม่สำเร็จ')
  } finally {
    confirmingId.value = null
  }
}
</script>

<style scoped>
/* Base */
.wrap {
  padding: 24px;
  font-family: 'Kanit', sans-serif;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  margin: 6px 0 12px;
}
.page-title.mt { margin-top: 24px; }

.card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
  padding: 16px;
}

/* Profile */
.profile .profile-grid .row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}
.profile .profile-grid .row:last-child { border-bottom: none; }
.profile .label { color:#666; }
.profile .value { font-weight: 600; }
.actions {
  display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px;
}
.form-grid {
  display: grid; gap: 10px;
}
.form-grid input, .form-grid textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #e5e5e5; border-radius: 10px;
  outline: none; transition: border .15s, box-shadow .15s;
}
.form-grid input:focus, .form-grid textarea:focus {
  border-color: #f1c40f; box-shadow: 0 0 0 3px rgba(241,196,15,.15);
}
.msg { color: #2e7d32; margin-top: 6px; }

/* Buttons */
.btn {
  border: 1px solid #e6e6e6;
  border-radius: 10px;
  padding: 10px 14px;
  background: #fff;
  cursor: pointer;
  transition: filter .15s, transform .02s, background .15s, color .15s;
  font-weight: 600;
}
.btn:hover { filter: brightness(.98); }
.btn:active { transform: translateY(1px); }
.btn.primary { background: #f1c40f; border-color:#f1c40f; }
.btn.ghost { background:#fff; }
.btn.danger { background:#ffe9e9; color:#b40b0b; border-color:#ffd4d4; }
.btn.sm { padding: 6px 10px; border-radius: 8px; font-size: 13px; }

/* Orders */
.orders { display: grid; gap: 12px; margin-top: 12px; }
.order-card {
  background:#fff; border:1px solid #eee; border-radius: 14px; padding: 12px 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,.04);
}

/* Layout row */
.order-info-row {
  display: grid;
  grid-template-columns: 160px 150px 120px 1fr;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}
.dt { color:#777; font-size:14px; }
.amt { font-weight:700; color:#111; }
.status-text { text-align:center; }
.actions-row { display:flex; justify-content:flex-end; gap:10px; }

/* Badge */
.badge {
  font-size: 12px; padding: 4px 8px; border-radius: 999px; border: 1px solid transparent;
  text-transform: lowercase; font-weight:700;
}
.st-pending { background:#fff8e1; color:#9a6b00; border-color:#ffe08a; }
.st-paid    { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
.st-shipping{ background:#e8f5ff; color:#1565c0; border-color:#cfe9ff; }
.st-done    { background:#eaf9ed; color:#2e7d32; border-color:#c9efcf; }
.st-cancel  { background:#ffe9e9; color:#b40b0b; border-color:#ffd1d1; }

/* Body */
.order-body { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; }

/* retro tools */
.retro-box {
  margin-bottom: 10px;
  padding: 10px;
  background: #fffdfa;
  border: 1px dashed #fcd34d;
  border-radius: 10px;
}
.retro-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.fileup input[type="file"] {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}
.qr-wrap {
  margin-top: 10px;
  text-align: center;
}
.qr-wrap img {
  width: 220px;
  height: 220px;
  object-fit: contain;
  border: 1px solid #eee;
  border-radius: 12px;
}
.hint { color:#6b7280; font-size:12px; margin-top:4px; }

/* items */
.items { list-style:none; padding:0; margin:0; display:grid; gap:10px; }
.item { display:flex; align-items:center; gap:12px; }
.item img { width:56px; height:56px; object-fit:cover; border-radius:10px; border:1px solid #eee; }
.item .meta { flex:1; }
.item .name { font-weight:600; }
.item .sub { color:#777; font-size:13px; }
.item .note { color:#999; }
.item .price { font-weight:700; }

.slip { margin-top: 12px; }
.slip-title { font-weight:700; margin-bottom:6px; }
.slip img { width:220px; border:1px solid #eee; border-radius:12px; }

.tracking {
  margin-top: 12px; padding: 10px 12px; background:#eef6ff; border-radius: 10px;
  display:flex; align-items:center; gap:8px; font-size:14px;
}
.tracking .truck { font-size: 18px; }
.tracking .t-title { color:#1976d2; font-weight:700; }
.tracking a { color:#1976d2; text-decoration:none; }
.tracking a:hover { text-decoration:underline; }

.empty { color:#666; margin-top:8px; text-align:center; }

/* Anim */
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
