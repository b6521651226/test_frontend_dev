<template>
  <div>
    <h1>หน้าร้านขายเครื่องมือช่าง NPPS</h1>

    <div v-if="loading">กำลังโหลด...</div>
    <div v-else class="grid">
      <div v-for="product in products" :key="product.id" class="card">
        <h3>{{ product.name }}</h3>
        <p>{{ product.description }}</p>
        <p>ราคา: {{ product.price }} บาท</p>
        <button @click="addToCart(product)">เพิ่มลงตะกร้า</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCart } from '../composables/useCart'

const { addToCart } = useCart()
const products = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/products')
    products.value = await res.json()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})

function addToCartAction(product) {
  addToCart(product)
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.card {
  border: 1px solid #ddd;
  padding: 1rem;
  text-align: center;
}
</style>
