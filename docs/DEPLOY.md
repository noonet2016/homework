# Deploy — homework.thatnarai.net (Plesk)

คู่มืออัปเดตระบบขึ้น production เขียนไว้เพราะโปรเจกต์นี้มักทิ้งช่วงหลายเดือน
แล้วต้องมาขุด `WORKLOG.md` 400+ บรรทัดใหม่ทุกครั้ง

- **Live:** https://homework.thatnarai.net
- **Repo:** https://github.com/noonet2016/homework (public, MIT)
- **Host:** Hostatom "Titan" + Plesk · nginx + Phusion Passenger 6.1.8 · Node.js 24 · MariaDB
- **Fallback:** แอป GAS เดิมที่ `projects/homework` — **ห้ามลบ** จนกว่าจะมั่นใจเต็มร้อย

---

## ขั้นตอน (กรณีแก้โค้ดอย่างเดียว — 90% ของงาน)

### 1. ในเครื่องเรา

```bash
cd "/Users/kanokkarn/Data/AI Title/projects/homework-next"
npm run build          # ต้องเขียวก่อนเสมอ ห้าม push ของที่ build ไม่ผ่าน
git push origin master
```

### 2. บน Plesk

1. โดเมน `homework.thatnarai.net` → **Git** → **Pull Updates**
2. → **Node.js** → **NPM install** — *ข้ามได้ถ้าไม่มี dependency ใหม่*
3. → **Run script** → เลือก **`build`**
4. → **Restart App** ⚠️ **ห้ามข้าม**

### 3. ตรวจผล

เปิดเว็บ **hard refresh** (`Cmd+Shift+R`) แล้วดูว่าของใหม่ขึ้นจริง

> **ทำไม Restart ถึงข้ามไม่ได้:** build เสร็จแล้วเว็บยัง "เหมือนเดิม" เป็นอาการปกติ
> เพราะ Passenger ยังรันโค้ดเก่าที่โหลดค้างในหน่วยความจำอยู่ จนกว่าจะสั่ง restart

---

## ✅ Host build เองได้ (ยืนยัน 2026-08-15)

**Deploy ผ่าน git อย่างเดียวจบ ไม่ต้องอัปโหลด `.next` เอง** — กด Run script `build` บน Plesk
แล้วผ่านฉลุย ไม่ OOM อย่างที่เคยกลัวไว้ตอนวางแผนเดือนมิถุนายน

(คอมเมนต์เดิมใน `next.config.ts` เขียนว่า *"build locally, ship the minimal standalone server"*
ซึ่งล้าสมัยและชวนเข้าใจผิด — แก้ให้ตรงกับความจริงแล้ว 2026-08-15)

### Start command

```
node .next/standalone/server.js
```

**ไม่ใช่** `next start` — เพราะ `next.config.ts` ตั้ง `output: "standalone"` ไว้

---

## กรณีพิเศษ

### แก้ `prisma/schema.prisma` ด้วย

เพิ่มขั้นนี้หลัง Pull ก่อน build:

```bash
npm run db:push     # = node scripts/db-push.js
```

> ต้องเรียกผ่าน `scripts/*.js` เท่านั้น **ห้ามเรียก `prisma` ตรงๆ บน Plesk** —
> Plesk สลับ working directory ชั่วคราวจน Prisma CLI หา path ไม่เจอ
> สคริปต์พวกนี้เลยดักด้วย absolute path ไว้ให้แล้ว

### เอาข้อมูลจาก production ลงมาที่เครื่อง

1. Plesk → phpMyAdmin → export `thatnara_homework` เป็น `.sql`
2. วางไว้ที่ `db-backup/` (gitignore ไว้แล้ว — มี PII ห้าม commit)
3. สำรองของเดิมก่อน แล้ว restore:

```bash
M=/Applications/XAMPP/xamppfiles/bin/mysql
$M -u root -h 127.0.0.1 -e "DROP DATABASE IF EXISTS homework_dev;
  CREATE DATABASE homework_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$M -u root -h 127.0.0.1 homework_dev < db-backup/<ไฟล์>.sql
```

> ต้อง drop/create ก่อน เพราะ dump ของ phpMyAdmin **ไม่มี `DROP TABLE IF EXISTS`**
> import ทับตรงๆ จะพังที่ "table already exists"

⚠️ **อย่าเอา local ทับ production** ถ้าภรรยาเทรนเนอร์ให้คะแนนเพิ่มหลังจากดึง dump มา

---

## 🧨 กับดักที่เคยเจอมาแล้ว

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| ต่อ DB ไม่ติดบน host | รหัสผ่าน MySQL มี `@` → ต้อง URL-encode เป็น `%40` ใน `DATABASE_URL` |
| ครูหลุด login เอง | ลืมตั้ง `SESSION_SECRET` บน host → ระบบตกไปใช้ค่า dev ที่ไม่ปลอดภัย |
| Prisma หา schema ไม่เจอ | เรียก `prisma` ตรงๆ → ใช้ `npm run db:push` / `seed:teacher` แทน |
| เว็บล่มที่หน้า `/redirect` | `redirect()` ของ Next.js โยน exception ที่ Passenger เข้าใจผิดว่าแอปตาย → แก้แล้วโดยคืน 200 + `window.location.replace` ฝั่ง client **อย่าเปลี่ยนกลับ** |
| คะแนน `-1` เพี้ยนเฉพาะบน host | driver ของ Passenger คืนค่า float ลบมาเป็น string `"-1"` → เทียบด้วย `Number(x) === -1` เสมอ อย่าใช้ `=== -1` ตรงๆ |
| Prisma 7 พังตอน build | สำรอง = ถอยไป Prisma 5.22 + `binaryTargets = ["native","debian-openssl-1.1.x","debian-openssl-3.0.x"]` ตามโปรเจกต์ `feed` (pr.thatnarai.net) ที่พิสูจน์แล้วบน host เดียวกัน |

### เสียงรบกวนที่ **ไม่ใช่** error

log ตอน build บน Plesk จะมี 3 บรรทัดนี้ประจำ ปล่อยไว้ได้เลย:

- `dircolors: no SHELL environment variable`
- `npm warn Unknown global config "scripts-prepend-node-path"`
- `npm notice New major version of npm available` — **อย่าอัป** ระบบทำงานดีอยู่ ไม่มีเหตุให้เสี่ยง

---

## หมายเหตุ

- SSH บน Plesk เคยลองแล้ว **Permission denied** — ทุกอย่างจึงทำผ่านหน้า panel
- QR บนสมุดนักเรียนวิ่งผ่าน GAS `doGet` → ดู [[QR_REDIRECT_BRIDGE]] และ `docs/gas-doGet-auto-redirect.gs`
  (ไฟล์นั้นเป็น **snapshot อ้างอิง** git ไม่ sync กับ Apps Script ต้องวางเองในหน้าเว็บ)
