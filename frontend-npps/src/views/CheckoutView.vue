<template>
  <div class="page">
    <div class="wrap checkout">
      <!-- Header -->
      <header class="head">
        <div class="title-wrap">
          <h1>ชำระเงิน</h1>
          <p class="sub">กรอกข้อมูลจัดส่ง อัปโหลดสลิป และยืนยันคำสั่งซื้อ</p>
        </div>
      </header>

      <div v-if="loading" class="empty">กำลังโหลดตะกร้า...</div>
      <div v-else-if="items.length === 0" class="empty">ไม่มีสินค้าในตะกร้า</div>

      <section v-else class="grid">
        <!--ซ้าย: ข้อมูลจัดส่ง + ชำระเงิน-->
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
              <p>โอนเข้าบัญชี: <b>ธนาคารกรุงไทย 678-514-5597</b> ชื่อบัญชี <b>อังกูล เณรรักษา</b></p>
              <label class="file">
                อัปโหลดสลิปโอนเงิน (jpg/png)
                <input type="file" accept="image/*" @change="onSlipChange" />
              </label>
            </div>

            <button class="btn primary mt" :disabled="placing" @click="placeOrder">
              {{ placing ? 'กำลังส่งคำสั่งซื้อ...' : 'ยืนยันสั่งซื้อ' }}
            </button>
            <p v-if="error" class="error">{{ error }}</p>
          </div>
        </div>

        <!--ขวา: สรุปรายการสินค้า-->
        <aside class="right">
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

      <!-- Success Modal -->
      <div v-if="success.order_code" class="success">
        <div class="success-card">
          <h3>สั่งซื้อสำเร็จ!</h3>
          <p>เลขที่คำสั่งซื้อ: <b>{{ success.order_code }}</b></p>
          <button class="btn primary" @click="$router.push('/')">กลับหน้าแรก</button>
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

async function placeOrder() {
  error.value = ''
  if (!items.value.length) return (error.value = 'ไม่มีสินค้าในตะกร้า')
  if (!shipping.value.phone || !shipping.value.address) return (error.value = 'กรอกข้อมูลจัดส่งให้ครบก่อน')
  if (!slipFile.value) return (error.value = 'กรุณาอัปโหลดสลิปการโอนเงิน')

  placing.value = true
  try {
    await api.patch('/users/me', {
      phone: shipping.value.phone,
      address: shipping.value.address
    })

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
    fd.append('slip', slipFile.value)

    const { data } = await api.post('/orders', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    try {
      await api.delete('/cart/clear')
    } catch {
      for (const it of items.value) {
        try { await api.delete(`/cart/${it.cart_id}`) } catch {}
      }
    }

    success.value.order_code = data?.order_code || ''
    items.value = []
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || 'สั่งซื้อไม่สำเร็จ'
  } finally {
    placing.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700&display=swap');

.page { background:#ffffff; min-height:100vh; }
.wrap { max-width:1080px; margin:24px auto; padding:0 16px; font-family:'Kanit',sans-serif; }

.head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
.title-wrap h1 { margin:0; font-size:24px; font-weight:700; }
.title-wrap .sub { margin:2px 0 0; color:#6b7280; font-size:14px; }

.grid {
  display:grid; grid-template-columns:1.2fr 0.8fr; gap:16px; align-items:start;
}
@media (max-width: 960px) {
  .grid { grid-template-columns: 1fr; }
}

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

.items { list-style:none; margin:0; padding:0; display:grid; gap:10px; }
.item {
  display:flex; justify-content:space-between; align-items:flex-start;
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

/* Buttons (ธีมเดียวกับหน้าอื่น) */
.btn{
  padding:10px 12px; border-radius:10px; border:1px solid #111827; background:#111827; color:#fff;
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
.success {
  position:fixed; inset:0; display:grid; place-items:center; background:rgba(0,0,0,.4); z-index:50;
}
.success-card {
  background:#fff; border-radius:14px; padding:18px; width:min(420px, 92vw);
  box-shadow:0 12px 28px rgba(0,0,0,.16); text-align:center;
}
.success-card h3 { margin:0 0 8px; }
.success-card p { margin:0 0 12px; }
</style>
