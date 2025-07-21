<template>
  <div>
    <nav>
      <router-link to="/">หน้าหลัก</router-link> |
      <router-link to="/cart">ตะกร้า</router-link> |
      <router-link to="/checkout">Checkout</router-link> |
      <router-link to="/admin/login">Admin</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

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
</script>

<style scoped>
.product {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
}
</style>
