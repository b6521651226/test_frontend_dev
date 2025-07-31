<template>
  <header class="navbar">
    <div class="logo">
      <img src="/images/logo_npps.png" alt="NPPS Logo" />
    </div>
    <nav class="menu">
      <router-link to="/">หน้าหลัก</router-link>
      <router-link to="/contact">ติดต่อเรา</router-link>
      <router-link to="/profile">ข้อมูลส่วนตัว</router-link>
      <router-link to="/cart" class="cart-icon">🛒</router-link>
    </nav>
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

.logo img {
  height: 50px;
}

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

.cart-icon {
  font-size: 22px;
}
</style>
