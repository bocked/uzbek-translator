# Yangi o'zbek alifbosi — tarjimon va fayl o'giruvchi

Matn, **Word (.docx)** va **Excel (.xlsx)** fayllarini yangi o'zbek alifbosiga
o'giradigan veb-ilova. Hammasi brauzerda ishlaydi — fayllar hech qanday serverga
yuborilmaydi.

**Jonli sayt:** https://yerlikoglon.uz

Zaxira nusxa: https://bocked.github.io/uzbek-translator/

## O'girish qoidalari

| Eski yozuv | Yangi alifbo | Misol |
|---|---|---|
| Oʻ / oʻ | Ö / ö | Oʻzbekiston → Özbekiston |
| Gʻ / gʻ | Ğ / ğ | bogʻ → boğ |
| Sh / sh | Ş / ş | shahar → şahar |
| Ch / ch | Ç / ç | choy → çoy |

`ng` harf birikmasi **o'zgartirilmaydi** — `tong → tong`.

Uch yo'nalish qo'llab-quvvatlanadi:

- **Lotin → Yangi** — eski lotin yozuvini yangi alifboga o'tkazadi
- **Kirill → Yangi** — kirill matnini avval lotinga, so'ng yangi alifboga o'tkazadi
- **Yangi → Lotin** — teskari o'girish

## Fayllar bilan ishlash

`.docx` va `.xlsx` aslida ZIP arxivdir. Ilova arxivni ochib, ichidagi XML
qismlarini (`word/document.xml`, `xl/sharedStrings.xml`, ish varoqlari) topadi,
faqat **matn tugunlarini** o'zgartiradi va qayta qadoqlaydi.

Saqlanadi: shrift, rang, jadval tuzilishi, rasmlar, formulalar, uslublar.

`sh`/`ch` kabi harflar Word'da alohida run'larga bo'lingan bo'lishi mumkin —
ilova ularni butun paragraf bo'yicha birlashtirib o'giradi, shuning uchun
bo'lingan holatlarda ham to'g'ri ishlaydi.

## Loyiha tuzilishi

| Fayl | Vazifasi |
|---|---|
| `index.html` | Sahifa tuzilishi va uslublari |
| `app.js` | Interfeys mantig'i |
| `alifbo-core.js` | O'girish qoidalari (sof mantiq, tashqi bog'liqliksiz) |
| `zip-lite.js` | ZIP o'qish/yozish (`DecompressionStream` asosida) |
| `convert.js` | `.docx` / `.xlsx` o'girish quvuri |
| `excel_tekshiruv.py` | Excel ma'lumotlarini tekshirish skripti (yordamchi) |

Tashqi kutubxona **yo'q** — na CDN, na npm. Shu sababli sayt oflayn ham ishlaydi.

## Joylashtirish (hosting)

Sayt ikki joyda turadi:

| Joy | Manzil | Vazifasi |
|---|---|---|
| Cloudflare Pages | https://yerlikoglon.uz | Asosiy sayt |
| GitHub Pages | https://bocked.github.io/uzbek-translator/ | Zaxira nusxa |

Ikkalasi ham **statik** — server kodi, ma'lumotlar bazasi yoki hisob (login)
kerak emas. Kelgan matn va fayllar hech qayerga saqlanmaydi.

Sayt fayllari ildizda yotadi, qo'shimcha build qadami yo'q:

- Cloudflare Pages'da loyiha ildizga to'g'ridan-to'g'ri yuklanadi (build buyrug'i yo'q)
- GitHub Pages `main` branchining ildizidan o'qiydi (`.nojekyll` Jekyll'ni o'chiradi)

`index.html`, `app.js`, `alifbo-core.js`, `zip-lite.js`, `convert.js` — shu
beshta fayl saytning o'zi.

Yordamchi (statik) fayllar:

- `robots.txt`, `sitemap.xml` — qidiruv tizimlari uchun
- `llms.txt` — AI agentlar uchun qisqa qo'llanma (H1 + havolalar)
- `ai-catalog.json` va `.well-known/ai-catalog.json` — AI Catalog (ARD) manifesti
- `_headers` — `Content-Type` va keshlash sarlavhalarini majburlaydi
- `_redirects` — noto'g'ri variant yo'llarni kanonik manzilga yo'naltiradi
- `404.html` — mavjud bo'lmagan yo'llar `index.html` o'rniga haqiqiy 404 qaytaradi

## Yangilash

```powershell
.\deploy.ps1 -Owner <username> -Token <ghp_...>
```

Tokenni faylga yozmang va repoga qo'shmang.

## Muhim: shaxsiy ma'lumotlar

`.gitignore` quyidagi fayllarni bloklaydi:

- `malumotlar.xlsx` — ism, pasport seriyasi, tug'ilgan sana, maosh, telefon
- `nomuvofiqliklar_hisobati.xlsx` — shu ma'lumotlarning tahlili

Bu fayllar repoga **hech qachon** qo'shilmasligi kerak.

## Cheklovlar

- O'girish lug'at emas, qoidalar asosida ishlaydi — inglizcha `ship` ham `şip` bo'ladi
- Eski `.doc` / `.xls` (binar) formatlari qo'llab-quvvatlanmaydi
- Shifrlangan va ZIP64 arxivlar ochilmaydi
- Natijani har doim ko'zdan kechirib chiqish tavsiya etiladi
