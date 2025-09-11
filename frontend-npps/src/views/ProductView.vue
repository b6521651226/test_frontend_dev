<template>
  <div class="container">
    <div class="search-container">
      <input v-model="search" type="text" placeholder="ค้นหาสินค้า..." />
    </div>

    <section class="product-container">
      <div class="product-card" v-for="product in filteredProducts" :key="product.product_id">
        <!-- ✅ prepend apiBase ให้รูป -->
        <img :src="apiBase + product.image_url" :alt="product.product_name" class="product-image" />
        <p>{{ product.product_name }}</p>
        <p>ราคา {{ product.price }} บาท</p>

          <!-- ✅ โชว์จำนวนสต็อก -->
        <p>คงเหลือ: {{ product.stock }} ชิ้น</p>

        <!-- เปลี่ยนจาก dropdown → text input -->
        <label>หมายเหตุสินค้า:</label>
        <input
          type="text"
          v-model="product.selectedOption"
          placeholder="หมายเหตุถึงร้านค้า(ถ้ามี)"
        />

        <label>จำนวน:</label>
        <input type="number" v-model.number="product.qty" min="1" />
        <button @click="addToCart(product)">เพิ่มไปยังตะกร้า</button>
      </div>
    </section>

    <div class="pagination">
      <button @click="prevPage">ก่อนหน้า</button>
      <button @click="nextPage">ถัดไป</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/api'

const search = ref('')
const page = ref(1)
const itemsPerPage = 4
const products = ref([])
const loading = ref(true)
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'  // ✅ เพิ่มตัวนี้

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/products')
    const data = await res.json()

    products.value = data.map((p) => ({
      ...p,
      qty: 1,
      selectedOption: '' // ใช้ text เป็นหมายเหตุ
    }))
  } catch (err) {
    console.error('โหลดสินค้าไม่สำเร็จ', err)
  } finally {
    loading.value = false
  }
})

const filteredProducts = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return products.value
    .filter((p) => p.product_name.toLowerCase().includes(search.value.toLowerCase()))
    .slice(start, start + itemsPerPage)
})

function nextPage() {
  if ((page.value + 1) * itemsPerPage <= products.value.length) page.value++
}
function prevPage() {
  if (page.value > 1) page.value--
}

async function addToCart(product) {
  // ✅ กันไม่ให้ใส่จำนวนเกิน stock
  if (product.qty > product.stock) {
    alert(`ไม่สามารถเพิ่มเกินจำนวนสต็อก (${product.stock} ชิ้น) ได้`)
    return
  }

  try {
    await api.post('/cart', {
      product_id: product.product_id,
      quantity: product.qty,
      product_option: product.selectedOption // ✅ ส่งไปเป็นหมายเหตุ
    })
    alert(`${product.product_name} ถูกเพิ่มลงตะกร้าแล้ว`)
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการเพิ่มสินค้า: ' + err.response?.data?.message || err.message)
  }
}
</script>


<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap');

.container {
  font-family: 'Kanit', sans-serif;
  padding: 0;
  margin: 0;
}

.search-container {
  margin: 20px auto;
  display: flex;
  justify-content: center;
}
.search-container input {
  padding: 10px;
  font-size: 16px;
  width: 50%;
  border: 1px solid #ddd;
}

.product-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  padding: 20px;
}
.product-card {
  border: 1px solid #ddd;
  text-align: center;
  padding: 10px;
}
.product-image {
  width: 160px;
  height: 160px;
  object-fit: contain;
  margin: 0 auto 10px;
}
.product-card button {
  margin-top: 10px;
  background-color: #f1c40f;
  border: none;
  padding: 10px;
  cursor: pointer;
  width: 100%;
}
.product-card button:hover {
  background-color: #e0b90f;
}
.pagination {
  text-align: center;
  margin: 20px;
}
.pagination button {
  padding: 10px;
  margin: 0 5px;
  background-color: #f1c40f;
  border: none;
}
.pagination button:hover {
  background-color: #e0b90f;
}
</style>
