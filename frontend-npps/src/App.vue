<template>
  <div>
    <Navbar v-if="!$route.path.startsWith('/admin')" />
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Navbar from './components/Navbar.vue'
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
