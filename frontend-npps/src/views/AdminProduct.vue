<template>
  <div class="page">
    <AdminNavbar />

    <div class="wrap">
      <header class="head">
        <div class="title-wrap">
          <h1>จัดการสินค้า</h1>
          <p class="sub">เพิ่ม แก้ไข และลบสินค้าในร้านของคุณ</p>
        </div>
        <button class="btn primary" @click="openForm()">
          ➕ เพิ่มสินค้า
        </button>
      </header>

      <section class="card">
        <table class="table">
          <thead>
            <tr>
              <th style="width:80px">ID</th>
              <th style="width:100px">รูป</th>
              <th>ชื่อสินค้า</th>
              <th style="width:140px">หมวดหมู่</th>
              <th class="right" style="width:160px">ราคา</th>
              <th class="right" style="width:120px">สต็อก</th>
              <th style="width:160px">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in products" :key="p.product_id">
              <td class="muted">#{{ p.product_id }}</td>
              <td>
                <img :src="apiBase + p.image_url" class="thumb" alt="" />
              </td>
              <td class="name-col">
                <div class="name">{{ p.product_name }}</div>
                <div class="sku" v-if="p.sku">SKU: {{ p.sku }}</div>
              </td>
              <td>
                <span class="badge soft" v-if="p.category_name">{{ p.category_name }}</span>
                <span class="muted" v-else>-</span>
              </td>
              <td class="right strong">{{ format(p.price) }} ฿</td>
              <td class="right">{{ p.stock }}</td>
              <td>
                <div class="row-actions">
                  <button class="btn ghost sm" @click="openForm(p)">แก้ไข</button>
                  <button class="btn danger sm" @click="removeProduct(p.product_id)">ลบ</button>
                </div>
              </td>
            </tr>
            <tr v-if="!products.length">
              <td colspan="7" class="empty">ยังไม่มีสินค้า</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="modal" @click.self="closeForm">
      <div class="sheet">
        <div class="sheet-head">
          <h3>{{ form.product_id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า' }}</h3>
          <button class="btn ghost sm" @click="closeForm">ปิด</button>
        </div>

        <div class="grid">
          <div class="uploader">
            <div
              class="drop"
              :class="{ dragging }"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="onDrop"
            >
              <img v-if="previewUrl" :src="previewUrl" class="preview" />
              <div v-else class="empty-drop">
                <div class="icon">🖼️</div>
                <div class="hint">ลากรูปมาวาง หรือ</div>
                <label class="btn ghost sm">
                  เลือกรูป
                  <input type="file" accept="image/*" hidden @change="onFileChange" />
                </label>
              </div>
            </div>
            <small class="muted">รองรับ .jpg .png • แนะนำขนาดรูปสี่เหลี่ยมจัตุรัส</small>
          </div>

          <div class="form">
            <label>ชื่อสินค้า
              <input v-model.trim="form.product_name" placeholder="เช่น ค้อนยาง" />
            </label>

            <div class="row-2">
              <label>ราคา
                <input type="number" step="0.01" v-model.number="form.price" placeholder="0.00" />
              </label>
              <label>สต็อก
                <input type="number" v-model.number="form.stock" placeholder="0" />
              </label>
            </div>

            <!-- ✅ เลือกหมวดหมู่ (เพิ่มใหม่) -->
            <label>หมวดหมู่
              <select v-model="form.category_id">
                <option :value="null">— ไม่ระบุหมวด —</option>
                <option v-for="c in categories" :key="c.category_id" :value="c.category_id">
                  {{ c.name }}
                </option>
              </select>
            </label>

            <label v-if="'sku' in form">SKU (ถ้ามี)
              <input v-model.trim="form.sku" placeholder="เช่น SKU-001" />
            </label>

            <div class="actions">
              <button class="btn primary" @click="saveProduct" :disabled="saving">
                {{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}
              </button>
              <button class="btn ghost" @click="closeForm" :disabled="saving">ยกเลิก</button>
            </div>

            <p v-if="msg" class="msg">{{ msg }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../lib/api'
import AdminNavbar from '../components/AdminNavbar.vue'
import SiteFooter from '../components/SiteFooter.vue'

const products = ref([])
const categories = ref([]) // ✅ list หมวดหมู่
const showForm = ref(false)
const form = ref({})
const file = ref(null)
const previewUrl = ref('')
const dragging = ref(false)
const saving = ref(false)
const msg = ref('')

const apiBase =
  import.meta.env.VITE_API_BASE || 'http://localhost:4000'

onMounted(async () => {
  await Promise.all([loadProducts(), loadCategories()])
})

async function loadProducts() {
  try {
    // ใช้ endpoint /products แบบใหม่ที่คืน category_name มาด้วย
    const { data } = await api.get('/products')
    products.value = data || []
  } catch (e) {
    console.error('[LOAD_PRODUCTS_ERROR]', e)
  }
}

async function loadCategories() {
  try {
    const { data } = await api.get('/admin/categories')
    categories.value = data || []
  } catch (e) {
    console.error('[LOAD_CATEGORIES_ERROR]', e)
  }
}

function format(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function openForm(p = null) {
  form.value = p
    ? { ...p, category_id: p.category_id ?? null }
    : { product_name: '', price: 0, stock: 0, image_url: '', category_id: null }
  file.value = null
  previewUrl.value = form.value.image_url ? apiBase + form.value.image_url : ''
  showForm.value = true
  msg.value = ''
}

function closeForm() {
  showForm.value = false
  dragging.value = false
  msg.value = ''
}

function onFileChange(e) {
  const f = e.target.files?.[0]
  if (!f) return
  file.value = f
  previewUrl.value = URL.createObjectURL(f)
}

function onDrop(e) {
  dragging.value = false
  const f = e.dataTransfer.files?.[0]
  if (!f) return
  file.value = f
  previewUrl.value = URL.createObjectURL(f)
}

watch(showForm, (open) => {
  if (!open && previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
})

async function saveProduct() {
  if (!form.value.product_name?.trim()) return (msg.value = 'กรุณาใส่ชื่อสินค้า')
  if (Number(form.value.price) < 0) return (msg.value = 'ราคาต้องไม่ติดลบ')
  if (Number.isNaN(Number(form.value.stock)) || Number(form.value.stock) < 0)
    return (msg.value = 'สต็อกต้องเป็นตัวเลข 0 หรือมากกว่า')

  saving.value = true
  msg.value = ''

  try {
    // ถ้ามีไฟล์ใหม่ ให้อัปโหลดก่อน
    let imageUrl = form.value.image_url || ''
    if (file.value) {
      const fd = new FormData()
      fd.append('image', file.value)
      const { data } = await api.post('/upload/product', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      imageUrl = data.url // backend ควรส่ง { url: '/uploads/products/xxx.png' }
    }

    const payload = {
      product_name: form.value.product_name,
      price: Number(form.value.price || 0),
      stock: Number(form.value.stock || 0),
      image_url: imageUrl,
      category_id: form.value.category_id ?? null,
      ...(form.value.sku ? { sku: form.value.sku } : {})
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
    msg.value = e?.response?.data?.message || 'บันทึกไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

async function removeProduct(id) {
  if (!confirm('ต้องการลบสินค้านี้?')) return
  try {
    await api.delete(`/products/${id}`)
    await loadProducts()
  } catch (e) {
    console.error('[REMOVE_PRODUCT_ERROR]', e)
    alert('ลบไม่สำเร็จ')
  }
}
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--c-bg);
}

.wrap {
  flex: 1 0 auto;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: var(--sp-8) var(--sp-4);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-5);
}

.title-wrap h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--c-text);
}

.title-wrap .sub {
  margin: var(--sp-1) 0 0;
  color: var(--c-text-muted);
  font-size: 14px;
}

/* Card/Table */
.card {
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead th {
  text-align: left;
  font-weight: 600;
  background: var(--c-bg-soft);
  border-bottom: 1px solid var(--c-border);
  padding: var(--sp-4);
  color: var(--c-text);
}

.table tbody td {
  padding: var(--sp-4);
  border-bottom: 1px solid var(--c-border-light);
  vertical-align: middle;
  color: var(--c-text);
}

.table tbody tr:hover {
  background: var(--c-bg-soft);
}

.empty {
  text-align: center;
  color: var(--c-text-muted);
  padding: var(--sp-6) 0;
}

.right {
  text-align: right;
}

.strong {
  font-weight: 700;
}

.muted {
  color: var(--c-text-muted);
}

.thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--c-border);
  background: var(--c-bg-soft);
}

.name-col .name {
  font-weight: 600;
  color: var(--c-text);
}

.name-col .sku {
  font-size: 12px;
  color: var(--c-text-muted);
}

.row-actions {
  display: flex;
  gap: var(--sp-2);
}

/* Buttons */
.btn {
  padding: var(--sp-2) var(--sp-4);
  border-radius: 10px;
  border: 1px solid var(--c-primary);
  background: var(--c-primary);
  color: #fff;
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease);
  font-weight: 600;
}

.btn:hover {
  background: var(--c-primary-700);
  transform: translateY(-1px);
}

.btn.primary {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}

.btn.ghost {
  background: transparent;
  color: var(--c-text);
  border-color: var(--c-border);
}

.btn.ghost:hover {
  background: var(--c-bg-soft);
  transform: none;
}

.btn.danger {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.2);
}

.btn.danger:hover {
  background: rgba(220, 38, 38, 0.15);
  transform: none;
}

.btn.sm {
  padding: var(--sp-2) var(--sp-3);
  border-radius: 8px;
  font-size: 13px;
}

/* Modal / Sheet */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
  z-index: 50;
  backdrop-filter: blur(2px);
}

.sheet {
  width: min(980px, 100%);
  background: var(--c-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-2);
  padding: var(--sp-5);
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-4);
}

.sheet-head h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--c-text);
}

.grid {
  display: grid;
  gap: var(--sp-5);
  grid-template-columns: 360px 1fr;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* Uploader */
.uploader .drop {
  border: 2px dashed var(--c-border);
  border-radius: 12px;
  min-height: 260px;
  display: grid;
  place-items: center;
  background: var(--c-bg-soft);
  transition: all var(--transition-fast) var(--ease);
}

.uploader .drop.dragging {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) inset;
}

.empty-drop {
  text-align: center;
  color: var(--c-text-muted);
  display: grid;
  gap: var(--sp-2);
}

.empty-drop .icon {
  font-size: 42px;
}

.preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

/* Form */
.form {
  display: grid;
  gap: var(--sp-4);
}

.form label {
  display: grid;
  gap: var(--sp-2);
  font-weight: 600;
  color: var(--c-text);
}

.form input,
.form select {
  padding: var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  outline: none;
  background: var(--c-bg);
  transition: all var(--transition-fast) var(--ease);
}

.form input:focus,
.form select:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
}

.actions {
  display: flex;
  gap: var(--sp-3);
  margin-top: var(--sp-2);
}

.msg {
  color: #dc2626;
  margin-top: var(--sp-1);
  font-weight: 600;
}

/* badge */
.badge {
  font-size: 12px;
  padding: var(--sp-1) var(--sp-2);
  border-radius: 999px;
  font-weight: 700;
}

.badge.soft {
  background: var(--c-bg-soft);
  color: var(--c-text-muted);
}
</style>
