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
              <td colspan="6" class="empty">ยังไม่มีสินค้า</td>
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../lib/api'
import AdminNavbar from '../components/AdminNavbar.vue'

const products = ref([])
const showForm = ref(false)
const form = ref({})
const file = ref(null)
const previewUrl = ref('')
const dragging = ref(false)
const saving = ref(false)
const msg = ref('')

const apiBase =
  import.meta.env.VITE_API_BASE || 'http://localhost:4000'

onMounted(loadProducts)

async function loadProducts() {
  try {
    const { data } = await api.get('/products')
    products.value = data || []
  } catch (e) {
    console.error('[LOAD_PRODUCTS_ERROR]', e)
  }
}

function format(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function openForm(p = null) {
  form.value = p
    ? { ...p }
    : { product_name: '', price: 0, stock: 0, image_url: '' }
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
/* Base */
.page { background:#ffffff; min-height:100vh; }
.wrap { max-width:1080px; margin:24px auto; padding:0 16px; font-family:'Kanit',sans-serif; }

.head {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:14px;
}
.title-wrap h1 { margin:0; font-size:24px; font-weight:700; }
.title-wrap .sub { margin:2px 0 0; color:#6b7280; font-size:14px; }

/* Card/Table */
.card {
  background:#fff; border:1px solid #eee; border-radius:14px;
  box-shadow:0 6px 16px rgba(0,0,0,.04);
  overflow:hidden;
}
.table { width:100%; border-collapse:collapse; }
.table thead th {
  text-align:left; font-weight:600; background:#fcfcfc;
  border-bottom:1px solid #eee; padding:12px 14px;
}
.table tbody td { padding:12px 14px; border-bottom:1px solid #f3f3f3; vertical-align:middle; }
.empty { text-align:center; color:#6b7280; padding:20px 0; }
.right { text-align:right; }
.strong { font-weight:700; }
.muted { color:#6b7280; }

.thumb {
  width:64px; height:64px; object-fit:cover; border-radius:10px; border:1px solid #eee;
}
.name-col .name { font-weight:600; }
.name-col .sku { font-size:12px; color:#9ca3af; }

.row-actions { display:flex; gap:8px; }

/* Buttons (ตามธีม Order/Profile) */
.btn {
  padding:8px 12px; border-radius:10px; border:1px solid #111827; background:#111827; color:#fff; cursor:pointer;
  transition: filter .15s, background .15s, color .15s;
  font-weight:600;
}
.btn:hover { filter:brightness(.95); }
.btn.primary { background:#f1c40f; border-color:#f1c40f; color:#111827; }
.btn.ghost { background:#fff; color:#111827; border-color:#e5e7eb; }
.btn.ghost:hover { background:#f9fafb; }
.btn.danger { background:#ffe9e9; color:#b40b0b; border-color:#ffd4d4; }
.btn.sm { padding:6px 10px; border-radius:8px; font-size:13px; }

/* Modal / Sheet */
.modal {
  position:fixed; inset:0; background:rgba(0,0,0,.35);
  display:flex; align-items:center; justify-content:center; padding:16px;
  z-index:50;
}
.sheet {
  width:min(980px,100%); background:#fff; border-radius:16px; border:1px solid #eee;
  box-shadow:0 10px 30px rgba(0,0,0,.08); padding:16px;
}
.sheet-head {
  display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;
}
.sheet-head h3 { margin:0; font-size:18px; font-weight:700; }

.grid {
  display:grid; gap:16px; grid-template-columns: 360px 1fr;
}
@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
}

/* Uploader */
.uploader .drop {
  border:2px dashed #e5e7eb; border-radius:12px; min-height:260px; display:grid; place-items:center;
  background:#fafafa;
}
.uploader .drop.dragging { border-color:#f1c40f; box-shadow:0 0 0 3px rgba(241,196,15,.15) inset; }
.empty-drop { text-align:center; color:#6b7280; display:grid; gap:8px; }
.empty-drop .icon { font-size:42px; }
.preview { width:100%; height:100%; object-fit:cover; border-radius:10px; }

/* Form */
.form { display:grid; gap:10px; }
.form label { display:grid; gap:6px; font-weight:600; }
.form input {
  padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none; background:#fff;
}
.form input:focus { border-color:#f1c40f; box-shadow:0 0 0 3px rgba(241,196,15,.15); }
.row-2 { display:grid; grid-template-columns: 1fr 1fr; gap:10px; }

.actions { display:flex; gap:10px; margin-top:6px; }
.msg { color:#b40b0b; margin-top:4px; }
</style>
