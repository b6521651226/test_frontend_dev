import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import ContactView from '../views/ContactView.vue'
import ProfileView from '../views/ProfileView.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import Register from '../views/Register.vue'
import Login from '../views/Login.vue'
import Productview from '../views/Productview.vue'

import AdminLogin from '../views/AdminLogin.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const routes = [
  { path: '/', component: HomeView, name: 'home' },
  { path: '/contact', component: ContactView },
  { path: '/profile', component: ProfileView },
  { path: '/cart', component: CartView },
  { path: '/register', component: Register },
  { path: '/checkout', component: CheckoutView },
  { path: '/login', component: Login, name: 'login', meta: { guestOnly: true } },
  { path: '/product', component: Productview, name: 'product' },

  // admin
  { path: '/admin/login', component: AdminLogin, name: 'admin-login', meta: { guestOnly: true } },
  { path: '/admin/dashboard', component: AdminDashboard, name: 'admin-dash', meta: { requiresAuth: true, role: 'admin' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ✅ Guard กลาง
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  // ถ้าหน้า guestOnly แต่มี token แล้ว → เด้งไปตาม role
  if (to.meta?.guestOnly && token) {
    return role === 'admin' ? '/admin/dashboard' : '/'
  }

  // ถ้าหน้าต้องการ auth แต่ไม่มี token → ส่งไปหน้า login ที่เหมาะสม
  if (to.meta?.requiresAuth && !token) {
    return to.meta.role === 'admin' ? '/admin/login' : '/login'
  }

  // ถ้าหน้าต้องการ role admin แต่ role ไม่ใช่ admin → กันไว้
  if (to.meta?.role === 'admin' && role !== 'admin') {
    return '/'
  }
})

export default router
