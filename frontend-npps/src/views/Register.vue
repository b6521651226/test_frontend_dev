<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/api'

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const showPwd = ref(false)

const router = useRouter()

const canSubmit = computed(() => {
  return (
    name.value.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email.value) &&
    password.value.length >= 6 &&
    !loading.value
  )
})

const submit = async () => {
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await api.post('/auth/register', {
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value
    })
    success.value = 'สมัครสมาชิกสำเร็จ!'
    setTimeout(() => router.push('/login'), 1200)
  } catch (e) {
    error.value = e?.response?.data?.message || 'สมัครไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <div class="brand">
        <img src="/images/logo_npps.png" alt="NPPS" />
      </div>

      <h2>สมัครสมาชิก</h2>
      <p class="sub">สร้างบัญชีเพื่อเริ่มสั่งซื้อสินค้า</p>

      <div v-if="error" class="alert error">{{ error }}</div>
      <div v-if="success" class="alert success">{{ success }}</div>

      <form @submit.prevent="submit" class="form">
        <label>
          ชื่อ-นามสกุล
          <input
            v-model.trim="name"
            placeholder="เช่น สมชาย ใจดี"
            required
          />
        </label>

        <label>
          อีเมล
          <input
            v-model.trim="email"
            type="email"
            placeholder="name@example.com"
            required
          />
        </label>

        <label class="pwd-label">
          รหัสผ่าน
          <div class="pwd">
            <input
              :type="showPwd ? 'text' : 'password'"
              v-model="password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              required
              minlength="6"
            />
            <button type="button" class="toggle" @click="showPwd = !showPwd">
              {{ showPwd ? 'ซ่อน' : 'แสดง' }}
            </button>
          </div>
        </label>

        <button class="submit" :disabled="!canSubmit" type="submit">
          {{ loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก' }}
        </button>
      </form>

      <div class="foot">
        เป็นสมาชิกแล้ว?
        <router-link to="/login">เข้าสู่ระบบ</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap');

.page {
  min-height: 80vh;
  display: grid;
  place-items: center;
  background: #f7f7f8;
  padding: 24px;
  font-family: 'Kanit', sans-serif;
}

.card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 8px 22px rgba(0,0,0,0.06);
}

.brand {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.brand img {
  height: 56px;
}

h2 {
  text-align: center;
  margin: 6px 0 6px;
  font-weight: 600;
}
.sub {
  text-align: center;
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
}

.alert {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
}
.alert.error {
  background: #ffe9e9;
  color: #b40b0b;
  border: 1px solid #ffd1d1;
}
.alert.success {
  background: #eaf9ed;
  color: #1b7f3a;
  border: 1px solid #d1f0d9;
}

.form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: border 0.15s ease, box-shadow 0.15s ease;
  background: #fff;
}
input:focus {
  border-color: #f1c40f;
  box-shadow: 0 0 0 3px rgba(241,196,15,0.15);
}

.pwd-label { margin-bottom: 4px; }
.pwd {
  position: relative;
  display: flex;
  align-items: center;
}
.pwd input { padding-right: 70px; }
.toggle {
  position: absolute;
  right: 8px;
  padding: 6px 10px;
  border: 1px solid #eee;
  background: #fafafa;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
.toggle:hover { background: #f0f0f0; }

.submit {
  margin-top: 6px;
  width: 100%;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: #f1c40f;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.02s ease;
}
.submit:hover { filter: brightness(0.95); }
.submit:active { transform: translateY(1px); }
.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.foot {
  margin-top: 14px;
  text-align: center;
  font-size: 14px;
  color: #555;
}
.foot a {
  color: #000;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px dashed #bbb;
}
.foot a:hover { color: #333; }
</style>
