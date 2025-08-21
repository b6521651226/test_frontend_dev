<template>
  <div class="checkout-container">
    <h2>ชำระเงิน</h2>

    <div v-if="loading">กำลังโหลดตะกร้า...</div>
    <div v-else-if="items.length === 0">ไม่มีสินค้าในตะกร้า</div>

    <div v-else class="grid">
      <div class="left">
        <h3>ข้อมูลจัดส่ง</h3>
        <div class="form">
          <label>ชื่อ-นามสกุล
            <input v-model="shipping.fullname" placeholder="ชื่อผู้รับ" />
          </label>
          <label>เบอร์โทร
            <input v-model="shipping.phone" placeholder="0812345678" />
          </label>
          <label>ที่อยู่
            <textarea v-model="shipping.address" placeholder="บ้านเลขที่ / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"></textarea>
          </label>
          <label>หมายเหตุ (ถ้ามี)
            <input v-model="shipping.note" placeholder="ฝากของไว้กับ รปภ. / ส่งช่วงเย็น ฯลฯ" />
          </label>
        </div>

        <h3>ชำระเงินโดยโอนบัญชี</h3>
        <div class="paybox">
          <p>โอนเข้าบัญชี: <b>ธนาคารกรุงไทย 678-514-5597</b> ชื่อบัญชี <b>อังกูล เณรรักษา</b></p>
          <label>อัปโหลดสลิปโอนเงิน (jpg/png)
            <input type="file" accept="image/*" @change="onSlipChange" />
          </label>
        </div>

        <button class="place" :disabled="placing" @click="placeOrder">
          {{ placing ? 'กำลังส่งคำสั่งซื้อ...' : 'ยืนยันสั่งซื้อ' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </div>

      <div class="right">
        <h3>สรุปรายการ</h3>
        <div class="items">
          <!-- ✅ ใช้ cart_id เป็น key -->
          <div class="row" v-for="it in items" :key="it.cart_id">
            <div class="name">
              <div>{{ it.name }}</div>
              <small v-if="it.product_option">ตัวเลือก: {{ it.product_option }}</small>
              <small>× {{ it.quantity }}</small>
            </div>
            <div class="money">{{ format(it.price * it.quantity) }} ฿</div>
          </div>
        </div>
        <div class="total">
          ราคารวม: <b>{{ format(cartTotal) }} ฿</b>
        </div>
      </div>
    </div>

    <div v-if="success.order_code" class="success">
      <h3>สั่งซื้อสำเร็จ!</h3>
      <p>เลขที่คำสั่งซื้อ: <b>{{ success.order_code }}</b></p>
      <button @click="$router.push('/')">กลับหน้าแรก</button>
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

const format = (n) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

    // ✅ ใช้ product_id จริง
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

    // ✅ เคลียร์ตะกร้า
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
.checkout-container { padding: 20px; font-family: 'Kanit', sans-serif; }
.grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; align-items: start; }
.left .form { display: grid; gap: 10px; }
.form label { display: grid; gap: 6px; }
.form input, .form textarea { padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
.paybox { padding: 12px; border: 1px dashed #bbb; border-radius: 10px; margin-top: 8px; }
.qr { width: 180px; margin-top: 6px; }
.place { margin-top: 14px; background: #222; color: #fff; border: none; padding: 10px 14px; border-radius: 10px; cursor: pointer; }
.error { color: #d00; margin-top: 10px; }
.right .items { border: 1px solid #eee; border-radius: 8px; padding: 10px; }
.row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.row:last-child { border-bottom: none; }
.name { display: grid; }
.total { margin-top: 10px; font-size: 18px; display: flex; justify-content: space-between; }
.success { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: grid; place-items: center; }
.success > div, .success h3, .success p, .success button { background: #fff; padding: 16px; border-radius: 10px; }
</style>
