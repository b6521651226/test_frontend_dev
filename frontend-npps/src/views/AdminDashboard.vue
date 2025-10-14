<template>
  <div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import AdminNavbar from '@/components/AdminNavbar.vue'

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
.wrap { padding: 20px; font-family: 'Kanit', sans-serif; }
h1 { margin-bottom: 12px; }

.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.card {
  background: #fff; border: 1px solid #eee; border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.05);
}
.card-title { color: #666; font-size: 14px; }
.num { font-size: 26px; font-weight: 700; margin-top: 6px; }
.muted { color: #777; font-size: 13px; }

.grid-tables {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
@media (max-width: 900px) {
  .grid-tables { grid-template-columns: 1fr; }
}
.panel {
  background: #fff; border: 1px solid #eee; border-radius: 14px;
  overflow: hidden;
}
.panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid #f0f0f0; background: #fafafa;
}
.panel-head h3 { margin: 0; font-size: 16px; }
.panel-head .right select {
  padding: 6px 8px; border: 1px solid #ddd; border-radius: 8px; background: #fff;
}

.table { width: 100%; border-collapse: collapse; }
.table thead th {
  text-align: left; font-weight: 600; background: #fcfcfc;
  border-bottom: 1px solid #eee; padding: 10px 12px;
}
.table tbody td {
  border-bottom: 1px solid #f3f3f3; padding: 10px 12px;
}
.right { text-align: right; }
.center { text-align: center; }
</style>
