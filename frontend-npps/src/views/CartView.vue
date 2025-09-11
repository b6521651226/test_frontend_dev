<template>
  <div class="cart-container">
    <h2>ตะกร้าสินค้า</h2>

    <div v-if="loading">กำลังโหลด...</div>
    <div v-else-if="items.length === 0">ไม่มีสินค้าในตะกร้า</div>

    <div
      v-else
      v-for="item in items"
      :key="item.cart_id"
      class="cart-item"
    >
      <!-- ✅ prepend apiBase -->
      <img :src="apiBase + item.image_url" :alt="item.name" class="cart-image" />

      <div class="cart-info">
        <p class="name">{{ item.name }}</p>
        <p>ราคา: {{ format(item.price) }} บาท</p>

        <!-- ตัวเลือกสินค้า -->
        <div class="row">
          <label>หมายเหตุ:</label>

          <select
            v-if="Array.isArray(item.available_options) && item.available_options.length"
            v-model="item.product_option"
            @change="updateItem(item.cart_id, { product_option: item.product_option })"
          >
            <option
              v-for="opt in item.available_options"
              :key="opt"
              :value="opt"
            >
              {{ opt }}
            </option>
          </select>

          <input
            v-else
            v-model="item.product_option"
            @change="updateItem(item.cart_id, { product_option: item.product_option })"
            placeholder="หมายเหตุถึงร้านค้า(ถ้ามี)"
          />
        </div>

        <!-- จำนวน -->
        <div class="row">
          <label>จำนวน:</label>
          <div class="qty">
            <button @click="decQty(item)">-</button>
            <input
              type="number"
              min="1"
              v-model.number="item.quantity"
              @change="onQtyChange(item)"
            />
            <button @click="incQty(item)">+</button>
          </div>
        </div>

        <p class="line-total">
          รวมรายการ: {{ format(item.price * item.quantity) }} บาท
        </p>

        <div class="actions">
          <button class="danger" @click="removeItem(item.cart_id)">ลบสินค้า</button>
        </div>
      </div>
    </div>

    <div v-if="items.length" class="cart-summary">
      <div>ราคารวมทั้งหมด: <b>{{ format(cartTotal) }}</b> บาท</div>
    </div>
    <div v-if="items.length" class="cart-summary">
      <div>ราคารวมทั้งหมด: <b>{{ format(cartTotal) }}</b> บาท</div>
      <button class="checkout" @click="$router.push('/checkout')">ชำระเงิน</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../lib/api'

const items = ref([])
const loading = ref(false)
const error = ref('')
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'   // ✅ เพิ่ม

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
.cart-container { padding: 20px; font-family: 'Kanit', sans-serif; }

.cart-item {
  display: flex; align-items: flex-start;
  margin-bottom: 16px; border-bottom: 1px solid #ddd; padding-bottom: 12px;
}

.cart-image { width: 100px; height: 100px; object-fit: contain; margin-right: 16px; }

.cart-info { flex: 1; display: grid; gap: 8px; }
.cart-info .name { font-weight: 600; }

.row { display: flex; gap: 10px; align-items: center; }
.row label { min-width: 70px; color: #555; }

.qty { display: inline-flex; align-items: center; gap: 6px; }
.qty input { width: 70px; text-align: center; padding: 6px; }
.qty button { width: 32px; height: 32px; border: 1px solid #ddd; background: #f7f7f7; cursor: pointer; }

.line-total { margin-top: 4px; font-weight: 500; }

.actions { margin-top: 6px; }
button.danger {
  background: #e53935; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer;
}

.cart-summary {
  margin-top: 20px; display: flex; justify-content: space-between; align-items: center;
  padding-top: 12px; border-top: 2px solid #000;
}

.checkout { background: #222; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; }

.error { color: #d00; margin-top: 10px; }
</style>
