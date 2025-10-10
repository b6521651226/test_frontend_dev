<template>
  <div class="page">
    <div class="wrap">
      <!-- Header / Toolbar -->
      <header class="head">
        <div class="title-wrap">
          <h1>สินค้า</h1>
          <p class="sub">เลือกสินค้า ใส่จำนวน แล้วเพิ่มลงตะกร้า</p>
        </div>

        <div class="toolbar">
          <div class="search">
            <span class="icon">🔎</span>
            <input v-model="search" type="text" placeholder="ค้นหาสินค้า..." />
          </div>
        </div>
      </header>

      <!-- Product Grid -->
      <section class="grid">
        <article class="card product-card" v-for="product in filteredProducts" :key="product.product_id">
          <img :src="apiBase + product.image_url" :alt="product.product_name" class="product-image" />

          <div class="meta">
            <div class="name" :title="product.product_name">{{ product.product_name }}</div>
            <div class="price">{{ Number(product.price).toLocaleString('th-TH', {minimumFractionDigits:2}) }} ฿</div>
            <div class="stock-row">
              <span class="badge soft">คงเหลือ: {{ product.stock }} ชิ้น</span>
            </div>
          </div>

          <div class="qty-row">
            <label>จำนวน</label>
            <input type="number" v-model.number="product.qty" min="1" @change="clampQty(product)" />
          </div>

          <button class="btn primary" @click="addToCart(product)">เพิ่มไปยังตะกร้า</button>
        </article>
      </section>

      <!-- Pagination -->
      <div class="pager">
        <button class="btn ghost sm" @click="prevPage">ก่อนหน้า</button>
        <span class="page-indicator">หน้า {{ page }}</span>
        <button class="btn ghost sm" @click="nextPage">ถัดไป</button>
      </div>
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
const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/products')
    const data = await res.json()
    products.value = data.map(p => ({ ...p, qty: 1, selectedOption: '' }))
  } catch (err) {
    console.error('โหลดสินค้าไม่สำเร็จ', err)
  } finally {
    loading.value = false
  }
})

const filteredProducts = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return products.value
    .filter(p => (p.product_name || '').toLowerCase().includes((search.value || '').toLowerCase()))
    .slice(start, start + itemsPerPage)
})

function nextPage() {
  if ((page.value + 1) * itemsPerPage <= products.value.length) page.value++
}
function prevPage() {
  if (page.value > 1) page.value--
}

function clampQty(p) {
  if (!p.qty || p.qty < 1) p.qty = 1
  if (p.stock && p.qty > p.stock) p.qty = p.stock
}

async function addToCart(product) {
  if (product.qty > product.stock) {
    alert(`ไม่สามารถเพิ่มเกินจำนวนสต็อก (${product.stock} ชิ้น) ได้`)
    return
  }
  try {
    await api.post('/cart', {
      product_id: product.product_id,
      quantity: product.qty,
      product_option: product.selectedOption
    })
    alert(`${product.product_name} ถูกเพิ่มลงตะกร้าแล้ว`)
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการเพิ่มสินค้า: ' + (err.response?.data?.message || err.message))
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700&display=swap');

/* ===== Layout base ให้เข้าธีม Profile/Order ===== */
.page { background:#ffffff; min-height:100vh; }
.wrap { max-width:1080px; margin:24px auto; padding:0 16px; font-family:'Kanit',sans-serif; }

.head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
.title-wrap h1 { margin:0; font-size:24px; font-weight:700; }
.title-wrap .sub { margin:2px 0 0; color:#6b7280; font-size:14px; }

/* ===== Toolbar / Search ===== */
.toolbar { display:flex; gap:12px; align-items:center; }
.search { position:relative; width:min(520px,80vw); }
.search .icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:14px; }
.search input{
  width:100%; padding:10px 12px 10px 30px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; outline:none;
}
.search input:focus{ border-color:#f1c40f; box-shadow:0 0 0 3px rgba(241,196,15,.15); }

/* ===== Product grid ===== */
.grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(230px,1fr));
  gap:12px;
}
.card{
  background:#fff; border:1px solid #eee; border-radius:14px;
  box-shadow:0 6px 16px rgba(0,0,0,.04); padding:12px;
}
.product-card .product-image{
  width:100%; height:160px; object-fit:contain;
  border:1px dashed #f0f0f0; background:#fcfcfc; border-radius:10px;
}
.meta{ display:grid; gap:6px; margin-top:8px; }
.name{ font-weight:700; line-height:1.35; height:2.7em; overflow:hidden; }
.price{ font-weight:700; }
.stock-row{ margin-top:2px; }

/* qty */
.qty-row{
  display:grid; grid-template-columns:auto 1fr; gap:8px; align-items:center; margin-top:8px;
}
.qty-row input{
  padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none; background:#fff;
}
.qty-row input:focus{ border-color:#f1c40f; box-shadow:0 0 0 3px rgba(241,196,15,.15); }

/* badges */
.badge{
  font-size:12px; padding:4px 8px; border-radius:999px; border:1px solid transparent; font-weight:700;
}
.badge.soft{ background:#f3f4f6; color:#374151; }

/* buttons (แชร์ธีมเดียวกับหน้าอื่น) */
.btn{
  width:100%; margin-top:10px;
  padding:10px 12px; border-radius:10px; border:1px solid #111827; background:#111827; color:#fff;
  cursor:pointer; font-weight:600; transition:filter .15s, background .15s, color .15s;
}
.btn:hover{ filter:brightness(.95); }
.btn.primary{ background:#f1c40f; border-color:#f1c40f; color:#111827; }
.btn.ghost{ background:#fff; color:#111827; border-color:#e5e7eb; width:auto; }
.btn.ghost:hover{ background:#f9fafb; }
.btn.sm{ padding:6px 10px; border-radius:8px; }

/* pager */
.pager{
  display:flex; align-items:center; justify-content:center; gap:10px;
  margin:16px 0 4px;
}
.page-indicator{ color:#6b7280; }
</style>
