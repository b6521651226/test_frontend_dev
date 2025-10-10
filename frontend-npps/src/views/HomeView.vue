<template>
  <div class="page">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-inner">
        <h1>ยินดีต้อนรับสู่ NPPS Supply</h1>
        <p class="tagline">
          โซลูชันงานอุตสาหกรรมครบวงจร — สินค้าคุณภาพ บริการไว ส่งทั่วประเทศ
        </p>
        <div class="cta">
          <router-link to="/products" class="btn primary">ดูสินค้า</router-link>
          <router-link to="/contact" class="btn ghost">ติดต่อเรา</router-link>
        </div>
      </div>
    </section>

    <div class="wrap">
      <!-- Highlights -->
      <section class="metrics">
        <div class="card metric">
          <div class="icon">🏭</div>
          <div class="title">หมวดสินค้า</div>
          <div class="value">+120</div>
          <div class="muted">รายการพร้อมส่ง</div>
        </div>
        <div class="card metric">
          <div class="icon">🚚</div>
          <div class="title">จัดส่งทั่วไทย</div>
          <div class="value">1–3 วัน</div>
          <div class="muted">ตามพื้นที่ให้บริการ</div>
        </div>
        <div class="card metric">
          <div class="icon">🛠️</div>
          <div class="title">บริการหลังการขาย</div>
          <div class="value">มืออาชีพ</div>
          <div class="muted">ให้คำปรึกษาโดยผู้เชี่ยวชาญ</div>
        </div>
      </section>

      <!-- About -->
      <section class="card about">
        <h3>เกี่ยวกับบริษัท</h3>
        <p>
          เราคัดสรรสินค้าอุตสาหกรรมและอะไหล่มาตรฐาน รับประกันคุณภาพ
          พร้อมทีมซัพพอร์ตที่เข้าใจหน้างานจริง ช่วยให้ธุรกิจของคุณเดินได้ต่อเนื่อง
        </p>
        <ul class="bullets">
          <li>สินค้าแท้ มีรับประกัน</li>
          <li>สต็อกพร้อม ส่งไว</li>
          <li>ให้คำแนะนำการใช้งานและการดูแลรักษา</li>
        </ul>
      </section>

      <!-- Features -->
      <section class="features">
        <div class="card feature">
          <div class="f-icon">📦</div>
          <h4>สินค้าอุตสาหกรรมครบ</h4>
          <p>อุปกรณ์สิ้นเปลือง เครื่องมือ ชิ้นส่วน และอะไหล่ยอดนิยม</p>
        </div>
        <div class="card feature">
          <div class="f-icon">🧰</div>
          <h4>ที่ปรึกษาเฉพาะทาง</h4>
          <p>ช่วยเลือกสินค้าให้เหมาะกับงาน ลดต้นทุนและเวลา</p>
        </div>
        <div class="card feature">
          <div class="f-icon">🔒</div>
          <h4>การสั่งซื้อปลอดภัย</h4>
          <p>ระบบจัดการออเดอร์และอัปเดตสถานะโปร่งใส</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
// ไม่มี logic ในหน้านี้
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;700&display=swap');

.page { background:#f7f7f8; min-height:100vh; font-family:'Kanit',sans-serif; }

/* ---------- Hero ---------- */
.hero{
  position:relative; height: 54vh; min-height: 380px; max-height: 640px;
  /* ✅ เปลี่ยนรูปเป็นของบริษัทได้ที่นี่ */
  background-image:
    linear-gradient(0deg, rgba(0,0,0,.35), rgba(0,0,0,.35)),
    url('/images/company_hero.jpg');
  background-size: cover; background-position: center;
  border-bottom: 1px solid #eaeaea;
}
.hero-overlay{ position:absolute; inset:0; }
.hero-inner{
  position:relative; z-index:1;
  height:100%; display:grid; place-items:center; text-align:center; padding: 0 16px;
  color:#fff;
}
.hero h1{ margin:0; font-size: clamp(26px, 4.2vw, 44px); font-weight:700; letter-spacing:.2px; }
.tagline{ margin-top:10px; font-size: clamp(14px, 2vw, 18px); opacity:.95; }
.cta{ margin-top:18px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }

/* ---------- Wrap ---------- */
.wrap{ max-width:1080px; margin:24px auto; padding:0 16px; }

/* ---------- Cards ---------- */
.card{
  background:#fff; border:1px solid #eee; border-radius:14px;
  box-shadow:0 6px 16px rgba(0,0,0,.04); padding:16px;
}

/* ---------- Metrics ---------- */
.metrics{
  display:grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap:12px; margin-bottom:16px;
}
.metric{ display:grid; gap:6px; }
.metric .icon{ font-size:22px; }
.metric .title{ color:#6b7280; font-size:14px; }
.metric .value{ font-size:24px; font-weight:700; }
.metric .muted{ color:#777; font-size:13px; }

/* ---------- About ---------- */
.about h3{ margin:0 0 6px; font-size:18px; font-weight:700; }
.about p{ margin:0 0 8px; color:#374151; }
.bullets{ margin:0; padding-left:20px; color:#374151; }
.bullets li{ margin:4px 0; }

/* ---------- Features ---------- */
.features{
  display:grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap:12px; margin-top:16px;
}
.feature{ display:grid; gap:8px; }
.f-icon{ font-size:22px; }
.feature h4{ margin:0; font-size:16px; font-weight:700; }
.feature p{ margin:0; color:#4b5563; }

/* ---------- Buttons ---------- */
.btn{
  padding:10px 14px; border-radius:10px; border:1px solid #111827; background:#111827; color:#fff;
  cursor:pointer; font-weight:600; transition:filter .15s, background .15s, color .15s;
  text-decoration:none; display:inline-block;
}
.btn:hover{ filter:brightness(.95); }
.btn.primary{ background:#f1c40f; border-color:#f1c40f; color:#111827; }
.btn.ghost{ background:#fff; color:#111827; border-color:#e5e7eb; }
.btn.ghost:hover{ background:#f9fafb; }

/* ---------- Responsive ---------- */
@media (max-width: 920px){
  .hero{ height: 46vh; }
}
</style>
