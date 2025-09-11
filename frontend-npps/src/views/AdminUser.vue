<template>
  <div>
    <AdminNavbar />
    <div class="container">
      <h1>จัดการผู้ใช้</h1>

      <button @click="showAddForm = true" class="btn-add">+ เพิ่มผู้ใช้</button>

      <table class="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>ชื่อผู้ใช้</th>
            <th>อีเมล</th>
            <th>เบอร์โทร</th>
            <th>ที่อยู่</th>
            <th>สิทธิ์</th>
            <th>การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.user_id">
            <td>{{ u.user_id }}</td>
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.phone }}</td>
            <td>{{ u.address }}</td>
            <td>{{ u.role }}</td>
            <td>
              <button @click="editUser(u)" class="btn-edit">แก้ไข</button>
              <button @click="deleteUser(u.user_id)" class="btn-delete">ลบ</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Modal Add/Edit -->
      <div v-if="showAddForm || editingUser" class="modal">
        <div class="modal-content">
          <h3>{{ editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้' }}</h3>
          <label>ชื่อ-นามสกุล:
            <input v-model="form.name" required />
          </label>
          <label>อีเมล:
            <input v-model="form.email" type="email" required />
          </label>
          <label>เบอร์โทร:
            <input v-model="form.phone" />
          </label>
          <label>ที่อยู่:
            <textarea v-model="form.address"></textarea>
          </label>
          <label>สิทธิ์:
            <select v-model="form.role">
              <option value="customer">customer</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label v-if="!editingUser">รหัสผ่าน:
            <input v-model="form.password" type="password" placeholder="อย่างน้อย 6 ตัวอักษร" required />
          </label>
          <label v-else>รหัสผ่านใหม่ (ถ้าเปลี่ยน):
            <input v-model="form.password" type="password" placeholder="เว้นว่างไว้ถ้าไม่เปลี่ยน" />
          </label>

          <div class="actions">
            <button @click="saveUser">{{ editingUser ? 'บันทึก' : 'เพิ่ม' }}</button>
            <button @click="cancel">ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../lib/api'
import AdminNavbar from '../components/AdminNavbar.vue'

const users = ref([])
const showAddForm = ref(false)
const editingUser = ref(null)
const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  role: 'customer',
  password: ''
})

onMounted(loadUsers)

async function loadUsers() {
  try {
    const { data } = await api.get('/admin/users')
    users.value = data
  } catch (err) {
    console.error('โหลด users ล้มเหลว', err)
  }
}

function editUser(u) {
  editingUser.value = u
  form.value = { ...u, password: '' }
}

function cancel() {
  editingUser.value = null
  showAddForm.value = false
  form.value = { name: '', email: '', phone: '', address: '', role: 'customer', password: '' }
}

async function saveUser() {
  try {
    if (editingUser.value) {
      // ✅ PATCH update user (backend จะเช็คถ้ามี password จะ bcrypt)
      await api.put(`/admin/users/${editingUser.value.user_id}`, form.value)
    } else {
      // ✅ POST create user (backend bcrypt password ตอน insert)
      await api.post('/admin/users', form.value)
    }
    await loadUsers()
    cancel()
  } catch (err) {
    console.error('บันทึก user ล้มเหลว', err)
  }
}

async function deleteUser(id) {
  if (!confirm('แน่ใจว่าต้องการลบผู้ใช้นี้?')) return
  try {
    await api.delete(`/admin/users/${id}`)
    await loadUsers()
  } catch (err) {
    console.error('ลบ user ล้มเหลว', err)
  }
}
</script>

<style scoped>
.container { padding: 20px; font-family: 'Kanit', sans-serif; }
.user-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.user-table th, .user-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
.btn-add { margin-bottom: 10px; background: green; color: #fff; padding: 6px 12px; border: none; cursor: pointer; border-radius: 4px; }
.btn-edit { background: #007bff; color: #fff; padding: 4px 8px; border: none; margin-right: 4px; cursor: pointer; border-radius: 4px; }
.btn-delete { background: #dc3545; color: #fff; padding: 4px 8px; border: none; cursor: pointer; border-radius: 4px; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; }
.modal-content { background: #fff; padding: 20px; border-radius: 6px; width: 400px; }
.modal-content label { display: block; margin: 8px 0; }
.actions { margin-top: 10px; display: flex; justify-content: space-between; }
</style>
