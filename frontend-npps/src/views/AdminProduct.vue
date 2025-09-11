<template>
  <div>
    <AdminNavbar />
    <div class="admin-container">
      <h1>จัดการสินค้า</h1>

      <button class="add-btn" @click="openForm()">➕ เพิ่มสินค้า</button>

      <table class="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>รูป</th>
            <th>ชื่อสินค้า</th>
            <th>ราคา</th>
            <th>สต็อก</th>
            <th>การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.product_id">
            <td>{{ p.product_id }}</td>
            <td><img :src="apiBase + p.image_url" class="thumb" /></td>
            <td>{{ p.product_name }}</td>
            <td>{{ format(p.price) }} ฿</td>
            <td>{{ p.stock }}</td>
            <td>
              <button class="edit" @click="openForm(p)">แก้ไข</button>
              <button class="danger" @click="removeProduct(p.product_id)">ลบ</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Modal ฟอร์ม -->
      <div v-if="showForm" class="modal">
        <div class="modal-content">
          <h3>{{ form.product_id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า' }}</h3>

          <label>ชื่อสินค้า</label>
          <input v-model="form.product_name" />

          <label>ราคา</label>
          <input type="number" v-model="form.price" />

          <label>สต็อก</label>
          <input type="number" v-model="form.stock" />

          <label>อัปโหลดรูป</label>
          <input type="file" @change="onFileChange" />

          <div class="actions">
            <button @click="saveProduct">บันทึก</button>
            <button class="cancel" @click="closeForm">ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../lib/api'
import AdminNavbar from '../components/AdminNavbar.vue'

const products = ref([])
const showForm = ref(false)
const form = ref({})
const file = ref(null)
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

onMounted(loadProducts)

async function loadProducts() {
  try {
    const { data } = await api.get('/products')
    products.value = data
  } catch (e) {
    console.error('[LOAD_PRODUCTS_ERROR]', e)
  }
}

function format(n) {
  return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2 })
}

function openForm(p = null) {
  form.value = p ? { ...p } : { product_name: '', price: 0, stock: 0, image_url: '' }
  file.value = null
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

function onFileChange(e) {
  file.value = e.target.files[0]
}

async function saveProduct() {
  try {
    let imageUrl = form.value.image_url || ''

    // ถ้ามีไฟล์ใหม่ ให้อัปโหลดก่อน
    if (file.value) {
      const fd = new FormData()
      fd.append('image', file.value)
      const { data } = await api.post('/upload/product', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      imageUrl = data.url   // ✅ backend ส่งกลับ url
    }

    const payload = {
      product_name: form.value.product_name,
      price: form.value.price,
      stock: form.value.stock,
      image_url: imageUrl
    }

    if (form.value.product_id) {
      await api.put(`/products/${form.value.product_id}`, payload)
    } else {
      await api.post('/products', payload)
    }

    await loadProducts()
    closeForm()
  } catch (e) {
    console.error('[SAVE_PRODUCT_ERROR]', e)
  }
}

async function removeProduct(id) {
  if (!confirm('ต้องการลบสินค้านี้?')) return
  try {
    await api.delete(`/products/${id}`)
    await loadProducts()
  } catch (e) {
    console.error('[REMOVE_PRODUCT_ERROR]', e)
  }
}
</script>

<style scoped>
.admin-container { padding: 20px; font-family: 'Kanit', sans-serif; }
.add-btn { margin-bottom: 12px; padding: 8px 12px; background: #28a745; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
.product-table { width: 100%; border-collapse: collapse; }
.product-table th, .product-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
.thumb { width: 50px; height: 50px; object-fit: cover; }
.edit { background: #1976d2; color: #fff; border: none; padding: 4px 8px; margin-right: 5px; border-radius: 4px; cursor: pointer; }
.danger { background: #e53935; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
.modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; }
.modal-content { background: #fff; padding: 20px; border-radius: 8px; width: 400px; }
.actions { margin-top: 12px; display: flex; justify-content: flex-end; gap: 8px; }
.cancel { background: #ccc; }
</style>
