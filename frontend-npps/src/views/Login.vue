<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login, state } = useAuth()

const isAdmin = ref(false)
const email = ref('')
const password = ref('')
const showPassword = ref(false)

const canSubmit = computed(() =>
  /\S+@\S+\.\S+/.test(email.value) &&
  password.value.length >= 6 &&
  !state.loading
)

async function submit() {
  state.error = ''
  const res = await login({
    email: email.value.trim(),
    password: password.value
  })
  if (!res?.ok) return

  if (isAdmin.value) {
    if (res.role === 'admin') router.push('/admin/dashboard')
    else state.error = 'บัญชีนี้ไม่ใช่ผู้ดูแล'
  } else {
    router.push('/') // ผู้ใช้ทั่วไป -> หน้าแรก
  }
}

function toggleMode(toAdmin) {
  if (isAdmin.value === toAdmin) return
  isAdmin.value = toAdmin
  state.error = ''
  password.value = ''
}
</script>

<template>
  <div class="page">
    <div class="card">
      <img src="/images/logo_npps.png" alt="NPPS Logo" class="logo" />

      <h1 class="title">{{ isAdmin ? 'เข้าสู่ระบบผู้ดูแล' : 'เข้าสู่ระบบ' }}</h1>
      <p class="subtitle">
        {{ isAdmin ? 'สำหรับผู้ดูแลระบบ' : 'เข้าสู่ระบบเพื่อเริ่มสั่งซื้อสินค้า' }}
      </p>

      <!-- สลับโหมด ผู้ใช้ / ผู้ดูแล -->
      <div class="mode-switch">
        <button
          :class="['mode-btn', !isAdmin && 'active']"
          @click="toggleMode(false)"
          type="button"
        >ผู้ใช้</button>
        <button
          :class="['mode-btn', isAdmin && 'active']"
          @click="toggleMode(true)"
          type="button"
        >ผู้ดูแล</button>
      </div>

      <form class="form" @submit.prevent="submit" autocomplete="off">
        <label class="label">อีเมล</label>
        <input
          v-model="email"
          type="email"
          class="input"
          placeholder="name@example.com"
          required
          autocomplete="username"
        />

        <label class="label">รหัสผ่าน</label>
        <div class="input-group">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="input"
            placeholder="อย่างน้อย 6 ตัวอักษร"
            required
            :autocomplete="isAdmin ? 'current-password' : 'new-password'"
          />
          <button type="button" class="ghost" @click="showPassword = !showPassword">
            {{ showPassword ? 'ซ่อน' : 'แสดง' }}
          </button>
        </div>

        <button class="primary" :disabled="!canSubmit">
          {{ state.loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
        </button>

        <p v-if="state.error" class="error">{{ state.error }}</p>
      </form>

      <div class="footer">
        ยังไม่มีบัญชี?
        <router-link to="/register" class="link">สมัครสมาชิก</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* โครงหน้าเดียวกับหน้า Register */
.page {
  min-height: 100dvh;
  background: #f6f7f9;
  display: grid;
  place-items: center;
  padding: 32px 16px;
  font-family: 'Kanit', sans-serif;
}
.card {
  width: 100%;
  max-width: 560px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,.08);
  padding: 32px 28px 24px;
}
.logo {
  width: 48px;
  height: 48px;
  display: block;
  margin: 4px auto 8px;
}
.title {
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  margin: 4px 0 4px;
  color: #111;
}
.subtitle {
  text-align: center;
  color: #666;
  margin: 0 0 16px;
  font-size: 14px;
}
.mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
}
.mode-btn {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e6e7eb;
  background: #fafafa;
  cursor: pointer;
  font-weight: 600;
}
.mode-btn.active {
  background: #111;
  color: #fff;
  border-color: #111;
}
.form {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}
.label {
  font-size: 14px;
  color: #333;
  margin-top: 6px;
}
.input {
  width: 100%;
  height: 44px;
  border: 1px solid #e6e7eb;
  border-radius: 10px;
  padding: 0 12px;
  outline: none;
  font-size: 15px;
  background: #fff;
}
.input:focus {
  border-color: #d6b108;
  box-shadow: 0 0 0 3px rgba(241,196,15,.2);
}
.input-group {
  position: relative;
  display: grid;
}
.ghost {
  position: absolute;
  right: 6px;
  top: 6px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #e6e7eb;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  font-size: 13px;
}
.primary {
  margin-top: 10px;
  height: 46px;
  border: none;
  border-radius: 10px;
  background: #f1c40f;
  color: #111;
  font-weight: 700;
  cursor: pointer;
}
.primary:disabled {
  opacity: .5;
  cursor: not-allowed;
}
.error {
  color: #d00;
  margin-top: 8px;
  text-align: center;
}
.footer {
  margin-top: 14px;
  text-align: center;
  color: #555;
  font-size: 14px;
}
.link {
  color: #111;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
  margin-left: 4px;
}
</style>
