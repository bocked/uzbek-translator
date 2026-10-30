# Yangi o'zbek alifbosi — tarjimon va fayl o'giruvchi

Matn, **Word (.docx)** va **Excel (.xlsx)** fayllarini yangi o'zbek alifbosiga
o'giradigan veb-ilova. Hammasi brauzerda ishlaydi — fayllar hech qanday serverga
yuborilmaydi.

**Jonli:** https://bocked.github.io/uzbek-translator/

## O'girish qoidalari

| Eski yozuv | Yangi alifbo | Misol |
|---|---|---|
| Oʻ / oʻ | Ö / ö | Oʻzbekiston → Özbekiston |
| Gʻ / gʻ | Ğ / ğ | bogʻ → boğ |
| Sh / sh | Ş / ş | shahar → şahar |
| Ch / ch | Ç / ç | choy → çoy |
| Ng / ng | Ñ / ñ | tong → toñ |

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

## GitHub Pages'da joylashtirish

1. **Settings** → **Pages**
2. **Source**: `Deploy from a branch`
3. **Branch**: `main` · **Folder**: `/ (root)`
4. **Save**

`index.html` ildizda bo'lgani uchun qo'shimcha sozlash kerak emas.
`.nojekyll` fayli Jekyll qayta ishlashini o'chirib qo'yadi.

### O'z domenini ulash

Domen Cloudflare'da turgan bo'lsa ham, GitHub Pages bilan bemalol ishlaydi —
Cloudflare faqat DNS vazifasini bajaradi.

**1. Repoga `CNAME` fayl qo'shing** (faqat domen nomi, boshqa hech narsa):

```
example.uz
```

**2. Cloudflare → DNS → Records** da quyidagilarni qo'shing:

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `www` | `bocked.github.io` | **DNS only** (kulrang bulut) |
| CNAME | `@` | `bocked.github.io` | **DNS only** (kulrang bulut) |

`@` uchun CNAME Cloudflare'ning "CNAME flattening" xususiyati tufayli ishlaydi.

**3. GitHub → Settings → Pages → Custom domain** ga domenni yozing va **Save**.
Tekshiruv o'tgach **Enforce HTTPS** ni yoqing.

> ⚠️ **Muhim:** Cloudflare proxy (to'q sariq bulut) **o'chirilgan** bo'lishi shart.
> Aks holda GitHub SSL sertifikat chiqara olmaydi va sayt "too many redirects"
> xatosini beradi. Sertifikat chiqqandan keyin ham uni o'chirib qo'yish tavsiya etiladi.

DNS o'zgarishi 5 daqiqadan 24 soatgacha kuchga kirishi mumkin.

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
