<template>
  <div class="page">
    <div class="wrap checkout">
      <!-- Header -->
      <header class="head">
        <div class="title-wrap">
          <h1>ชำระเงิน</h1>
          <p class="sub">กรอกข้อมูลจัดส่ง สร้างออเดอร์เพื่อขอ QR จากนั้นอัปโหลดสลิปและยืนยัน</p>
        </div>
      </header>

      <div v-if="loading" class="empty">กำลังโหลดตะกร้า...</div>
      <div v-else-if="items.length === 0 && !orderId" class="empty">ไม่มีสินค้าในตะกร้า</div>

      <section v-else class="grid">
        <!-- ซ้าย: ข้อมูลจัดส่ง + ชำระเงิน -->
        <div class="left">
          <div class="card">
            <h3 class="card-title">ข้อมูลจัดส่ง</h3>
            <div class="form">
              <label>ชื่อ-นามสกุล
                <input v-model="shipping.fullname" placeholder="ชื่อผู้รับ" />
              </label>
              <label>เบอร์โทร
                <input v-model="shipping.phone" placeholder="0812345678" />
              </label>
              <label>ที่อยู่
                <textarea v-model="shipping.address" rows="4" placeholder="บ้านเลขที่ / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"></textarea>
              </label>
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">ชำระเงินโดยโอนบัญชี</h3>
            <div class="paybox">
              <p>โอนเข้าบัญชี: <b>พร้อมเพย์ 080-179-2785</b> ชื่อบัญชี <b>อังกูล เณรรักษา</b></p>

              <!-- ✅ แสดง QR หลังสร้างออเดอร์สำเร็จ -->
              <div v-if="qrUrl" class="qr-section">
                <p><b>สแกน QR ด้านล่างเพื่อชำระเงิน</b></p>
                <img :src="qrUrl" alt="QR PromptPay" class="qr-img" />
                <p class="hint">เมื่อโอนเสร็จให้อัปโหลดสลิปเพื่อยืนยันการชำระเงิน</p>
              </div>

              <label class="file">
                อัปโหลดสลิปโอนเงิน (jpg/png)
                <input type="file" accept="image/*" @change="onSlipChange" />
              </label>
            </div>

            <!-- 🔘 ปุ่มที่ 1: สร้างออเดอร์ / ขอ QR (ไม่ต้องมีสลิป) -->
            <button
              class="btn primary mt"
              :disabled="placing || !canCreateOrder"
              @click="createOrderAndFetchQR"
            >
              {{ placing && !orderId ? 'กำลังสร้างคำสั่งซื้อ...' : 'สร้างออเดอร์ / ขอ QR' }}
            </button>

            <!-- 🔘 ปุ่มที่ 2: อัปโหลดสลิป & ยืนยันชำระเงิน (ต้องมี orderId และสลิป) -->
            <button
              class="btn mt"
              :disabled="placing || !orderId || !slipFile"
              @click="uploadSlipAndVerify"
            >
              {{ placing && orderId ? 'กำลังยืนยันการชำระเงิน...' : 'อัปโหลดสลิป & ยืนยันชำระเงิน' }}
            </button>

            <p v-if="error" class="error">{{ error }}</p>
          </div>
        </div>

        <!-- ขวา: สรุปรายการสินค้า (แสดงเฉพาะตอนยังไม่เคลียร์ตะกร้า) -->
        <aside class="right" v-if="items.length">
          <div class="card">
            <h3 class="card-title">สรุปรายการ</h3>

            <ul class="items">
              <li v-for="it in items" :key="it.cart_id" class="item">
                <div class="meta">
                  <div class="name" :title="it.name">{{ it.name }}</div>
                  <div class="sub">
                    <span v-if="it.product_option" class="note">ตัวเลือก: {{ it.product_option }}</span>
                    <span class="qty">× {{ it.quantity }}</span>
                  </div>
                </div>
                <div class="price">{{ format(it.price * it.quantity) }} ฿</div>
              </li>
            </ul>

            <div class="total">
              <span>ราคารวมทั้งหมด</span>
              <b>{{ format(cartTotal) }} ฿</b>
            </div>
          </div>
        </aside>
      </section>

      <!-- Success Modal (โชว์หลัง verify สลิปผ่าน) -->
      <div
        v-if="success.order_code"
        class="success"
        @click.self="closeSuccess"
      >
        <div class="success-card">
          <button class="close-x" @click="closeSuccess" aria-label="close">×</button>
          <h3>สั่งซื้อสำเร็จ!</h3>
          <p>เลขที่คำสั่งซื้อ: <b>{{ success.order_code }}</b></p>
          <div class="actions">
            <button class="btn ghost" @click="closeSuccess">ปิด</button>
            <button class="btn primary" @click="$router.push('/')">กลับหน้าแรก</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../lib/api'

const items = ref([])
const loading = ref(false)
const placing = ref(false)
const error = ref('')
const success = ref({ order_code: '' })
const slipFile = ref(null)

const qrUrl = ref('')          // ✅ รูป QR จาก backend
const orderId = ref(null)      // ✅ เก็บ orderId ที่เพิ่งสร้าง

const shipping = ref({
  fullname: '',
  phone: '',
  address: '',
  note: ''
})

const format = (n) =>
  Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const cartTotal = computed(() =>
  items.value.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0)
)

const canCreateOrder = computed(() =>
  (!!items.value.length) && !!shipping.value.phone && !!shipping.value.address
)

onMounted(async () => {
  await loadCart()
  await loadUserProfile()
})

async function loadCart() {
  loading.value = true
  try {
    const { data } = await api.get('/cart')
    items.value = data || []
  } catch {
    error.value = 'โหลดตะกร้าล้มเหลว'
  } finally {
    loading.value = false
  }
}

async function loadUserProfile() {
  try {
    const { data } = await api.get('/users/me')
    shipping.value.fullname = data.name
    shipping.value.phone = data.phone || ''
    shipping.value.address = data.address || ''
  } catch (e) {
    console.error(e)
  }
}

function onSlipChange(e) {
  const f = e.target.files?.[0]
  if (f) slipFile.value = f
}

/* ============================
   ปุ่มที่ 1: สร้างออเดอร์ / ขอ QR (ไม่บังคับสลิป)
   ============================ */
async function createOrderAndFetchQR() {
  error.value = ''
  if (!canCreateOrder.value) {
    return (error.value = 'กรอกข้อมูลจัดส่งให้ครบและตรวจสอบตะกร้า')
  }

  placing.value = true
  try {
    // อัปเดตที่อยู่ก่อน (ของเดิม)
    await api.patch('/users/me', {
      phone: shipping.value.phone,
      address: shipping.value.address
    })

    // เตรียม payload ออเดอร์ (ไม่แนบสลิปในขั้นนี้)
    const fd = new FormData()
    fd.append('shipping_fullname', shipping.value.fullname)
    fd.append('shipping_phone', shipping.value.phone)
    fd.append('shipping_address', shipping.value.address)
    fd.append('note', shipping.value.note || '')
    fd.append('payment_method', 'BANK_TRANSFER')

    const payloadItems = items.value.map(it => ({
      product_id: it.product_id,
      quantity: it.quantity,
      product_option: it.product_option || null
    }))
    fd.append('items', JSON.stringify(payloadItems))
    fd.append('total_client', String(cartTotal.value))
    // ❌ ไม่แนบ 'slip' ที่นี่

    const { data } = await api.post('/orders', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // เก็บ orderId ไว้ใช้ขั้น verify + ดึง QR
    if (data?.orderId) {
      orderId.value = data.orderId
      try {
        const res = await api.get(`/payments/by-order/${data.orderId}`)
        qrUrl.value = res.data?.qr_image_url
          ? (res.data.qr_image_url.startsWith('http')
              ? res.data.qr_image_url
              : `${api.defaults.baseURL}${res.data.qr_image_url}`)
          : ''
      } catch (e) {
        console.warn('โหลด QR ไม่สำเร็จ', e)
      }
    }

    // เคลียร์ตะกร้าเหมือนเดิม (ป้องกันกดสร้างซ้ำ)
    try {
      await api.delete('/cart/clear')
    } catch {
      for (const it of items.value) {
        try { await api.delete(`/cart/${it.cart_id}`) } catch {}
      }
    }
    items.value = []
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || 'สร้างคำสั่งซื้อไม่สำเร็จ'
  } finally {
    placing.value = false
  }
}

/* ============================
   ปุ่มที่ 2: อัปโหลดสลิป & ขอ verify (รองรับทั้ง path และ query)
   ============================ */
async function uploadSlipAndVerify() {
  error.value = ''
  if (!orderId.value) return (error.value = 'ยังไม่มีคำสั่งซื้อ กรุณากด "สร้างออเดอร์ / ขอ QR" ก่อน')
  if (!slipFile.value) return (error.value = 'กรุณาอัปโหลดสลิปการโอนเงิน')

  placing.value = true
  try {
    const fd = new FormData()
    fd.append('slip', slipFile.value)

    // พยายามแบบ path param ก่อน
    try {
      await api.post(`/payments/verify-slip/${orderId.value}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } catch (_e) {
      // ถ้า backend ใช้แบบ query ก็ลองแบบนี้แทน
      await api.post(`/payments/verify-slip?order_id=${orderId.value}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    // verify ผ่าน -> โชว์ modal
    success.value.order_code = String(orderId.value)
    error.value = ''
    // (ออปชัน) เคลียร์ไฟล์ เพื่อกันอัปซ้ำโดยไม่ตั้งใจ
    slipFile.value = null
  } catch (e) {
    console.error(e)
    // ✅ รองรับเคส 	pending (422) ให้โชว์ข้อความชัดเจน
    if (e?.response?.status === 422) {
      error.value = e.response.data?.message || 'อ่าน QR จากสลิปไม่ได้ — ส่งให้แอดมินตรวจสอบแล้ว'
    } else {
      error.value = e?.response?.data?.message || 'ยืนยันการชำระเงินไม่สำเร็จ'
    }
  } finally {
    placing.value = false
  }
}

/* === ปิดโมดัลสำเร็จ === */
function closeSuccess() {
  success.value = { order_code: '' }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700&display=swap');

.page { background:#ffffff; min-height:100vh; }
.wrap { max-width:1080px; margin:24px auto; padding:0 16px; font-family:'Kanit',sans-serif; }

.head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
.title-wrap h1 { margin:0; font-size:24px; font-weight:700; }
.title-wrap .sub { margin:2px 0 0; color:#6b7280; font-size:14px; }

.grid { display:grid; grid-template-columns:1.2fr 0.8fr; gap:16px; align-items:start; }
@media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }

.card {
  background:#fff; border:1px solid #eee; border-radius:14px;
  box-shadow:0 6px 16px rgba(0,0,0,.04); padding:16px;
}
.card-title { margin:0 0 10px; font-size:16px; font-weight:700; }

.form { display:grid; gap:10px; }
.form label { display:grid; gap:6px; font-size:14px; }
.form input, .form textarea {
  padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none; background:#fff;
  transition:border .15s, box-shadow .15s;
}
.form input:focus, .form textarea:focus {
  border-color:#f1c40f; box-shadow:0 0 0 3px rgba(241,196,15,.15);
}

.paybox {
  background:#fafafa; border:1px dashed #d9d9d9; border-radius:12px; padding:12px;
}
.paybox .file input[type="file"] { margin-top:6px; }
.mt { margin-top:12px; }

.qr-section, .qr-modal { margin-top:10px; text-align:center; }
.qr-img { width:220px; height:220px; object-fit:contain; border:1px solid #eee; border-radius:12px; margin-top:6px; }
.hint { color:#6b7280; font-size:12px; margin-top:4px; }

.items { list-style:none; margin:0; padding:0; display:grid; gap:10px; }
.item { display:flex; justify-content:space-between; align-items:flex-start;
  background:#fff; border:1px solid #eee; border-radius:10px; padding:10px 12px;
}
.item .meta { display:grid; gap:2px; }
.name { font-weight:700; }
.sub { color:#6b7280; font-size:13px; display:flex; gap:8px; align-items:center; }
.note { color:#9ca3af; }
.qty { color:#6b7280; }
.price { font-weight:700; }

.total {
  margin-top:12px; padding-top:12px; border-top:1px dashed #eee;
  display:flex; align-items:center; justify-content:space-between; font-size:16px;
}

.btn{ padding:10px 12px; border-radius:10px; border:1px solid #111827; background:#111827; color:#fff;
  cursor:pointer; font-weight:600; transition:filter .15s, background .15s, color .15s;
}
.btn:hover{ filter:brightness(.95); }
.btn.primary{ background:#f1c40f; border-color:#f1c40f; color:#111827; }
.btn.ghost{ background:#fff; color:#111827; border-color:#e5e7eb; }
.btn.ghost:hover{ background:#f9fafb; }

.empty{
  background:#fff; border:1px dashed #e5e7eb; border-radius:12px; padding:18px; text-align:center; color:#6b7280;
  box-shadow:0 6px 16px rgba(0,0,0,.03);
}

.error { color:#b91c1c; margin-top:10px; }

/* Success modal */
.success { position:fixed; inset:0; display:grid; place-items:center; background:rgba(0,0,0,.4); z-index:50; }
.success-card {
  position: relative;
  background:#fff; border-radius:14px; padding:18px; width:min(420px, 92vw);
  box-shadow:0 12px 28px rgba(0,0,0,.16); text-align:center;
}
.success-card h3 { margin:0 0 8px; }
.success-card p { margin:0 0 12px; }
.close-x{
  position:absolute; right:10px; top:8px;
  background:transparent; border:none; font-size:20px; cursor:pointer; line-height:1;
}
.actions{ display:flex; gap:8px; justify-content:center; }
</style>
