<template>
  <div>
    <h1>Checkout</h1>
    <form @submit.prevent="submitOrder">
      <div>
        <label>ชื่อผู้สั่ง:</label>
        <input v-model="userId" placeholder="User ID (สมมุติเอาไว้ก่อน)" />
      </div>
      <h2>สรุปคำสั่งซื้อ</h2>
      <div v-for="item in cart" :key="item.id">
        <p>{{ item.name }} x {{ item.qty }} = {{ item.price * item.qty }} บาท</p>
      </div>
      <p>รวมทั้งหมด: {{ total }} บาท</p>
      <button type="submit">ยืนยันคำสั่งซื้อ</button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCart } from '../composables/useCart'

const { cart, clearCart } = useCart()
const userId = ref('')

const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.qty, 0)
)

const submitOrder = async () => {
  try {
    const res = await fetch('http://localhost:4000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId.value,
        cart: cart.value,
        total: total.value
      })
    })
    const data = await res.json()
    alert('ออเดอร์สำเร็จ: หมายเลข ' + data.orderId)
    clearCart()
  } catch (err) {
    console.error(err)
    alert('สั่งซื้อไม่สำเร็จ')
  }
}
</script>
