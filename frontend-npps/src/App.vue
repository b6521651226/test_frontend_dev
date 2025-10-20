<template>
  <div class="app-wrapper">
    <Navbar v-if="!$route.path.startsWith('/admin')" />
    <main class="main-content">
      <router-view />
    </main>
    <SiteFooter v-if="!$route.path.startsWith('/admin')" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Navbar from './components/Navbar.vue'
import SiteFooter from './components/SiteFooter.vue'

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
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1 0 auto;
}

.product {
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
}
</style>
