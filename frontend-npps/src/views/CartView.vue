<template>
  <h1>ตะกร้าสินค้า</h1>
  <div v-for="item in cart" :key="item.id">
    <p>{{ item.name }} x {{ item.qty }}</p>
    <p>{{ item.price }} บาท</p>
    <button @click="removeFromCart(item.id)">ลบออก</button>
  </div>
  <p>รวม {{ total }} บาท</p>
  <router-link to="/checkout">ไปหน้า Checkout</router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useCart } from '../composables/useCart'

const { cart, removeFromCart } = useCart()

const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.qty, 0)
)
</script>
