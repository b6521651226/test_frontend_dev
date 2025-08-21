<script setup>
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { logout } = useAuth()
const router = useRouter()

function doLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <header class="navbar">
    <div class="logo">
      <img src="/images/logo_npps.png" alt="NPPS Logo" />
    </div>

    <nav class="menu">
      <router-link to="/admin/dashboard">แดชบอร์ด</router-link>
      <router-link to="/admin/product">จัดการสินค้า</router-link>
      <router-link to="/admin/order">จัดการออเดอร์</router-link>
      <router-link to="/admin/user">จัดการผู้ใช้</router-link>
      <router-link to="/admin/report">รายงาน</router-link>
    </nav>

    <div class="auth">
      <button @click="doLogout" class="btn-outline">ออกจากระบบ</button>
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
  gap: 30px;
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

.auth { display: flex; align-items: center; gap: 12px; }

.btn-outline {
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #333;
  background: transparent;
  color: #333;
}
.btn-outline:hover { background: #f3f3f3; }
</style>
