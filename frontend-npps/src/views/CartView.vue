<template>
  <div class="cart-container">
    <h2>ตะกร้าสินค้า</h2>

    <div v-if="items.length === 0">ไม่มีสินค้าในตะกร้า</div>

    <div v-for="item in items" :key="item.id" class="cart-item">
      <img :src="item.image_url" :alt="item.name" class="cart-image" />
      <div class="cart-info">
        <p>{{ item.name }}</p>
        <p>ราคา: {{ item.price }} บาท</p>
        <p>ตัวเลือก: {{ item.product_option }}</p>
        <p>จำนวน: {{ item.quantity }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const items = ref([])

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/cart')
    items.value = await res.json()
  } catch (err) {
    console.error('โหลดข้อมูลตะกร้าล้มเหลว:', err)
  }
})
</script>

<style scoped>
.cart-container {
  padding: 20px;
  font-family: 'Kanit', sans-serif;
}
.cart-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}
.cart-image {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-right: 20px;
}
.cart-info p {
  margin: 3px 0;
}
</style>
