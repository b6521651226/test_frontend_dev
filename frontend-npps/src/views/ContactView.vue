<template>
  <div class="page">
    <div class="wrap">
      <!-- Header -->
      <header class="head">
        <div class="title-wrap">
          <h1>ติดต่อเรา</h1>
          <p class="sub">หากมีข้อสงสัยหรือต้องการสอบถาม สามารถติดต่อเราได้ตามช่องทางด้านล่าง</p>
        </div>
      </header>

      <section class="grid">
        <!-- Contact info -->
        <div class="card">
          <h3 class="card-title">ข้อมูลการติดต่อ</h3>
          <ul class="contact-list">
            <li>
              <span class="icon">✉️</span>
              <div class="meta">
                <div class="label">อีเมล</div>
                <a href="mailto:npps_supply@gmail.com" class="value">npps_supply@gmail.com</a>
              </div>
            </li>
            <li>
              <span class="icon">📞</span>
              <div class="meta">
                <div class="label">โทรศัพท์</div>
                <a href="tel:0982800692" class="value">098-280-0692</a>
              </div>
            </li>
            <li>
              <span class="icon">📍</span>
              <div class="meta">
                <div class="label">ที่อยู่</div>
                <div class="value">55/35 หมู่บ้านแกรนด์กิตติยา ต.คลองโยง อ.พุทธมณฑล จ.นครปฐม 73170</div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Map -->
        <div class="card">
          <h3 class="card-title">แผนที่</h3>
          <!-- ✅ ฝังแผนที่เป็นการ์ด โค้งมน ขอบขาว -->
          <div class="map-wrap">
            <iframe
              class="map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1151.71677654094!2d100.29700814674392!3d13.845158664909833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e292fa4d0848a3%3A0x29764281746f38e2!2s35%2C%20Amphoe%20Phutthamonthon%2C%20Chang%20Wat%20Nakhon%20Pathom%2073170!5e0!3m2!1sen!2sth!4v1700000000000!5m2!1sen!2sth"
              width="100%"
              height="100%"
              style="border:0;"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
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

.page { background:#ffffff; min-height:100vh; }
.wrap { max-width:1080px; margin:24px auto; padding:0 16px; font-family:'Kanit',sans-serif; }

.head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
.title-wrap h1 { margin:0; font-size:24px; font-weight:700; }
.title-wrap .sub { margin:2px 0 0; color:#6b7280; font-size:14px; }

.grid {
  display:grid; grid-template-columns: 1fr 1fr; gap:16px; align-items:start;
}
@media (max-width: 960px) { .grid { grid-template-columns:1fr; } }

.card {
  background:#fff; border:1px solid #eee; border-radius:14px;
  box-shadow:0 6px 16px rgba(0,0,0,.04); padding:16px;
}
.card-title { margin:0 0 10px; font-size:16px; font-weight:700; }

/* Contact list style (เหมือนบัตรรายการในหน้าอื่น) */
.contact-list { list-style:none; padding:0; margin:0; display:grid; gap:10px; }
.contact-list li {
  display:flex; gap:12px; align-items:flex-start;
  background:#fff; border:1px solid #eee; border-radius:10px; padding:10px 12px;
}
.icon { font-size:18px; line-height:1; }
.meta { display:grid; gap:4px; }
.label { color:#6b7280; font-size:13px; }
.value { font-weight:700; color:#111827; text-decoration:none; }
.value:hover { text-decoration:underline; }

/* Map */
.map-wrap {
  width:100%; height:320px; border-radius:12px; overflow:hidden;
  border:1px solid #eee; background:#fafafa;
}
.map { display:block; width:100%; height:100%; }

/* ปุ่มธีม (เผื่ออนาคตต้องเพิ่มปุ่ม) */
.btn{
  padding:10px 12px; border-radius:10px; border:1px solid #111827; background:#111827; color:#fff;
  cursor:pointer; font-weight:600; transition:filter .15s, background .15s, color .15s;
}
.btn:hover{ filter:brightness(.95); }
.btn.primary{ background:#f1c40f; border-color:#f1c40f; color:#111827; }
.btn.ghost{ background:#fff; color:#111827; border-color:#e5e7eb; }
.btn.ghost:hover{ background:#f9fafb; }
</style>
