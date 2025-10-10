<template>
  <div class="page">
    <div class="wrap">
      <!-- Header -->
      <header class="head">
        <div class="title-wrap">
          <h1>ตะกร้าสินค้า</h1>
          <p class="sub">ตรวจสอบจำนวน แก้ไข หรือไปชำระเงิน</p>
        </div>
      </header>

      <div v-if="loading" class="empty">กำลังโหลด...</div>
      <div v-else-if="items.length === 0" class="empty">ไม่มีสินค้าในตะกร้า</div>

      <!-- รายการสินค้าในตะกร้า -->
      <section v-else class="list">
        <article
          v-for="item in items"
          :key="item.cart_id"
          class="card cart-card"
        >
          <!-- รูป -->
          <img :src="apiBase + item.image_url" :alt="item.name" class="thumb" />

          <!-- ข้อมูล -->
          <div class="meta">
            <div class="name" :title="item.name">{{ item.name }}</div>
            <div class="price">ราคา: {{ format(item.price) }} ฿</div>

            <!-- จำนวน -->
            <div class="qty-row">
              <label>จำนวน</label>
              <div class="qty">
                <button class="btn ghost sm" @click="decQty(item)">−</button>
                <input
                  type="number"
                  min="1"
                  v-model.number="item.quantity"
                  @change="onQtyChange(item)"
                />
                <button class="btn ghost sm" @click="incQty(item)">+</button>
              </div>
            </div>

            <div class="line-total">รวมรายการ: <b>{{ format(item.price * item.quantity) }}</b> ฿</div>

            <div class="actions">
              <button class="btn danger sm" @click="removeItem(item.cart_id)">ลบสินค้า</button>
            </div>
          </div>
        </article>
      </section>

      <!-- สรุปราคา + ปุ่มไปชำระเงิน -->
      <div v-if="items.length" class="summary card">
        <div class="sum-text">ราคารวมทั้งหมด</div>
        <div class="sum-amt">{{ format(cartTotal) }} ฿</div>
        <button class="btn primary" @click="$router.push('/checkout')">ชำระเงิน</button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../lib/api'

const items = ref([])
const loading = ref(false)
const error = ref('')
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

const format = (n) =>
  Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const cartTotal = computed(() =>
  items.value.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0)
)

onMounted(loadCart)

async function loadCart() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/cart')
    items.value = data || []
  } catch (e) {
    error.value = 'โหลดข้อมูลตะกร้าล้มเหลว'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function updateItem(id, payload) {
  try {
    await api.patch(`/cart/${id}`, payload)
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || 'อัปเดตรายการไม่สำเร็จ'
    await loadCart()
  }
}

function onQtyChange(item) {
  const q = Math.max(1, Number(item.quantity) || 1)
  if (q > item.stock) {
    alert(`ไม่สามารถสั่งเกิน ${item.stock} ชิ้นได้`)
    item.quantity = item.stock
  } else {
    item.quantity = q
  }
  updateItem(item.cart_id, { quantity: item.quantity })
}

function incQty(item) {
  const next = Number(item.quantity || 1) + 1
  if (next > item.stock) {
    alert(`ไม่สามารถสั่งเกิน ${item.stock} ชิ้นได้`)
    return
  }
  item.quantity = next
  updateItem(item.cart_id, { quantity: item.quantity })
}

function decQty(item) {
  const next = Math.max(1, Number(item.quantity || 1) - 1)
  if (next !== item.quantity) {
    item.quantity = next
    updateItem(item.cart_id, { quantity: next })
  }
}

async function removeItem(id) {
  if (!confirm('ลบสินค้ารายการนี้ออกจากตะกร้า?')) return
  try {
    await api.delete(`/cart/${id}`)
    items.value = items.value.filter((it) => it.cart_id !== id)
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.message || 'ลบสินค้าไม่สำเร็จ'
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700&display=swap');

/* Base layout ให้เข้ากับธีม */
.page { background:#ffffff; min-height:100vh; }
.wrap { max-width:1080px; margin:24px auto; padding:0 16px; font-family:'Kanit',sans-serif; }

.head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
.title-wrap h1 { margin:0; font-size:24px; font-weight:700; }
.title-wrap .sub { margin:2px 0 0; color:#6b7280; font-size:14px; }

/* Card / list */
.list { display:grid; gap:12px; }
.card{
  background:#fff; border:1px solid #eee; border-radius:14px;
  box-shadow:0 6px 16px rgba(0,0,0,.04); padding:12px;
}

/* Cart item card */
.cart-card{ display:flex; gap:12px; align-items:flex-start; }
.thumb{
  width:96px; height:96px; object-fit:cover; border-radius:10px; border:1px solid #eee; background:#fcfcfc;
}
.meta{ flex:1; display:grid; gap:8px; }
.name{ font-weight:700; }
.price{ color:#111; }
.line-total{ font-weight:600; }

.qty-row{ display:flex; align-items:center; gap:10px; }
.qty{
  display:inline-flex; gap:8px; align-items:center; background:#fafafa; border:1px solid #e5e7eb; border-radius:10px; padding:4px;
}
.qty input{
  width:70px; text-align:center; padding:8px 6px; border:1px solid #e5e7eb; border-radius:8px; outline:none; background:#fff;
}
.qty input:focus{ border-color:#f1c40f; box-shadow:0 0 0 3px rgba(241,196,15,.15); }

/* Summary block */
.summary{
  display:flex; align-items:center; gap:12px; justify-content:flex-end; margin-top:14px;
}
.sum-text{ color:#6b7280; }
.sum-amt{ font-size:18px; font-weight:700; }

/* Buttons — เข้าธีมเดียวกันทั้งหมด */
.btn{
  padding:10px 12px; border-radius:10px; border:1px solid #111827; background:#111827; color:#fff;
  cursor:pointer; font-weight:600; transition:filter .15s, background .15s, color .15s;
}
.btn:hover{ filter:brightness(.95); }
.btn.primary{ background:#f1c40f; border-color:#f1c40f; color:#111827; }
.btn.ghost{ background:#fff; color:#111827; border-color:#e5e7eb; }
.btn.ghost:hover{ background:#f9fafb; }
.btn.danger{ background:#ffe9e9; color:#b40b0b; border-color:#ffd4d4; }
.btn.sm{ padding:6px 10px; border-radius:8px; }

.empty{
  background:#fff; border:1px dashed #e5e7eb; border-radius:12px; padding:18px; text-align:center; color:#6b7280;
  box-shadow:0 6px 16px rgba(0,0,0,.03);
}

.error { color:#b91c1c; margin-top:12px; }
</style>
