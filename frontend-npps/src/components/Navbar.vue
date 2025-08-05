<script setup>
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { state, logout } = useAuth()
const router = useRouter()

function doLogout() {
  logout()
  router.push('/')
}
</script>

<template>
  <header class="navbar">
    <div class="logo">
      <img src="/images/logo_npps.png" alt="NPPS Logo" />
    </div>

    <nav class="menu">
      <router-link to="/">หน้าแรก</router-link>
      <router-link to="/contact">เกี่ยวกับเรา</router-link>
      <router-link to="/product">สินค้าทั้งหมด</router-link>
      <router-link to="/profile">ข้อมูลส่วนตัว</router-link>
      <router-link to="/cart" class="cart-icon">🛒</router-link>
    </nav>

    <!-- ✅ โซน Auth -->
    <div class="auth">
      <!-- ถ้ายังไม่ล็อกอิน -->
      <router-link v-if="!state.token" to="/login" class="btn">
        เข้าสู่ระบบ
      </router-link>

      <!-- ถ้าล็อกอินแล้ว -->
      <div v-else class="auth-logged">
        <span v-if="state.role === 'admin'" class="badge">Admin</span>
        <router-link v-if="state.role === 'admin'" to="/admin/dashboard" class="dash-link">
          แดชบอร์ด
        </router-link>
        <button @click="doLogout" class="btn-outline">ออกจากระบบ</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  font-family: 'Kanit', sans-serif;
}

.logo img { height: 50px; }

.menu {
  display: flex;
  gap: 40px;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.menu a {
  text-decoration: none;
  color: #333;
  font-weight: bold;
  font-size: 18px;
}

.cart-icon { font-size: 22px; }

/* 🔽 เพิ่มสไตล์โซน Auth */
.auth { display: flex; align-items: center; gap: 12px; }
.auth-logged { display: flex; align-items: center; gap: 10px; }

.badge {
  background: #222;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}

.dash-link {
  text-decoration: none;
  color: #333;
  font-weight: 600;
}

.btn, .btn-outline {
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #333;
}

.btn { background: #333; color: #fff; }
.btn-outline { background: transparent; color: #333; }
.btn-outline:hover { background: #f3f3f3; }
</style>
