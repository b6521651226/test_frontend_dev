<template>
  <div class="page-container">
    <AdminNavbar />

    <div class="wrap">
      <h1>สรุปยอดขาย</h1>

      <!-- Summary cards -->
      <div class="grid-cards">
        <div class="card">
          <div class="card-title">วันนี้</div>
          <div class="num">{{ formatCurrency(summary.today?.revenue) }}</div>
          <div class="muted">ออเดอร์: {{ summary.today?.orders || 0 }}</div>
        </div>

        <div class="card">
          <div class="card-title">เดือนนี้</div>
          <div class="num">{{ formatCurrency(summary.month?.revenue) }}</div>
          <div class="muted">ออเดอร์: {{ summary.month?.orders || 0 }}</div>
        </div>

        <div class="card">
          <div class="card-title">รวมทั้งหมด</div>
          <div class="num">{{ formatCurrency(summary.all?.revenue) }}</div>
          <div class="muted">ออเดอร์: {{ summary.all?.orders || 0 }}</div>
        </div>
      </div>

      <div class="grid-tables">
        <!-- Daily -->
        <div class="panel">
          <div class="panel-head">
            <h3>รายวัน ({{ days }} วันล่าสุด)</h3>
            <div class="right">
              <select v-model.number="days" @change="loadDaily">
                <option :value="7">7 วัน</option>
                <option :value="14">14 วัน</option>
                <option :value="30">30 วัน</option>
              </select>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th class="right">ออเดอร์</th>
                <th class="right">ยอดขาย</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in daily" :key="r.day">
                <td>{{ formatDate(r.day) }}</td>
                <td class="right">{{ r.orders }}</td>
                <td class="right">{{ formatCurrency(r.revenue) }}</td>
              </tr>
              <tr v-if="!daily.length">
                <td colspan="3" class="muted center">ไม่มีข้อมูล</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Monthly -->
        <div class="panel">
          <div class="panel-head">
            <h3>รายเดือน ({{ months }} เดือนล่าสุด)</h3>
            <div class="right">
              <select v-model.number="months" @change="loadMonthly">
                <option :value="3">3 เดือน</option>
                <option :value="6">6 เดือน</option>
                <option :value="12">12 เดือน</option>
              </select>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>เดือน</th>
                <th class="right">ออเดอร์</th>
                <th class="right">ยอดขาย</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in monthly" :key="r.ym">
                <td>{{ r.ym }}</td>
                <td class="right">{{ r.orders }}</td>
                <td class="right">{{ formatCurrency(r.revenue) }}</td>
              </tr>
              <tr v-if="!monthly.length">
                <td colspan="3" class="muted center">ไม่มีข้อมูล</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
    
    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import AdminNavbar from '@/components/AdminNavbar.vue'
import SiteFooter from '@/components/SiteFooter.vue'

const summary = ref({ today: {}, month: {}, all: {} })
const daily = ref([])
const monthly = ref([])

const days = ref(14)
const months = ref(6)

onMounted(async () => {
  await Promise.all([loadSummary(), loadDaily(), loadMonthly()])
})

async function loadSummary() {
  try {
    const { data } = await api.get('/admin/stats/summary')
    summary.value = data
  } catch (e) {
    console.error('[DASH_SUMMARY]', e)
  }
}
async function loadDaily() {
  try {
    const { data } = await api.get(`/admin/stats/daily?days=${days.value}`)
    daily.value = data
  } catch (e) {
    console.error('[DASH_DAILY]', e)
  }
}
async function loadMonthly() {
  try {
    const { data } = await api.get(`/admin/stats/monthly?months=${months.value}`)
    monthly.value = data
  } catch (e) {
    console.error('[DASH_MONTHLY]', e)
  }
}

// helpers
function formatCurrency(n) {
  const num = Number(n || 0)
  return num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ฿'
}

// ✅ แก้ให้ตีความวันจาก DB เป็นเวลาไทยเสถียร (กันวันเพี้ยน)
// - ถ้าได้ 'YYYY-MM-DD' -> สร้างเป็น 'YYYY-MM-DDT00:00:00+07:00'
// - ถ้าได้ ISO ที่มี 'T' อยู่แล้ว -> ใช้ตามนั้น แต่แสดงใน timeZone ไทย
function formatDate(d) {
  if (!d) return '-'
  try {
    const s = String(d)
    const iso = s.includes('T') ? s : `${s}T00:00:00+07:00`
    const date = new Date(iso)
    return date.toLocaleDateString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return String(d)
  }
}
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.wrap {
  flex: 1 0 auto;
  width: 100%;
  padding: var(--sp-8) var(--sp-4);
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 var(--sp-5);
  color: var(--c-text);
}

.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--sp-4);
  margin-bottom: var(--sp-6);
}

.card {
  background: var(--c-card);
  border-radius: var(--radius);
  padding: var(--sp-5);
  box-shadow: var(--shadow-1);
  transition: all var(--transition-fast) var(--ease);
}

.card:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-2px);
}

.card-title {
  color: var(--c-text-muted);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: var(--sp-2);
}

.num {
  font-size: 26px;
  font-weight: 700;
  margin-top: var(--sp-2);
  color: var(--c-primary);
}

.muted {
  color: var(--c-text-muted);
  font-size: 13px;
  margin-top: var(--sp-1);
}

.grid-tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-5);
}

@media (max-width: 900px) {
  .grid-tables {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: var(--c-card);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-1);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-4);
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg-soft);
}

.panel-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text);
}

.panel-head .right select {
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  background: var(--c-card);
  outline: none;
  transition: all var(--transition-fast) var(--ease);
}

.panel-head .right select:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
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
  padding: var(--sp-3);
  color: var(--c-text);
}

.table tbody td {
  border-bottom: 1px solid var(--c-border-light);
  padding: var(--sp-3);
  color: var(--c-text);
}

.table tbody tr:hover {
  background: var(--c-bg-soft);
}

.right {
  text-align: right;
}

.center {
  text-align: center;
}
</style>
