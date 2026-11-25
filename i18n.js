/* ============================================================================
   i18n.js — interfeys tilini boshqarish (faqat brauzerda)
   ----------------------------------------------------------------------------
   Til localStorage'da saqlanadi. Hech qanday tarmoq so'rovi yuborilmaydi:
   barcha tarjimalar shu fayl ichida. Har bir satr tartibi:
   uz | uz-yangi | uz-kirill | ru | en
   ========================================================================== */
(function () {
    'use strict';

    var CODES = ['uz', 'uz-yangi', 'uz-kirill', 'ru', 'en'];
    var KEY = 'yerlikoglon:lang:v1';

    var META = {
        'uz':       { flag: 'uz', lang: 'uz',      code: 'UZ' },
        'uz-yangi': { flag: 'uz', lang: 'uz',      code: 'YÖ' },
        'uz-kirill':{ flag: 'uz', lang: 'uz-Cyrl', code: 'ЎЗ' },
        'ru':       { flag: 'ru', lang: 'ru',      code: 'RU' },
        'en':       { flag: 'gb', lang: 'en',      code: 'EN' }
    };

    var ROWS = {
        /* --- meta / header ------------------------------------------------ */
        'meta.title': [
            "Yangi o'zbek alifbosi — Tarjimon va fayl o'giruvchi",
            "Yangi özbek alifbosi — Tarjimon va fayl ögiruvçi",
            "Янги ўзбек алифбоси — Таржимон ва файл ўгирувчи",
            "Новый узбекский алфавит — переводчик и конвертер файлов",
            "New Uzbek Alphabet — Text & File Converter"
        ],
        'meta.desc': [
            "Matn, Word (.docx) va Excel (.xlsx) fayllarini yangi o'zbek alifbosiga (Ö ö, Ş ş, Ç ç, Ğ ğ) o'giradi. To'liq brauzerda, fayllar hech qayerga yuborilmaydi.",
            "Matn, Word (.docx) va Excel (.xlsx) fayllarini yangi özbek alifbosiga (Ö ö, Ş ş, Ç ç, Ğ ğ) ögiradi. To'liq brauzerda, fayllar heç qayerga yuborilmaydi.",
            "Матн, Word (.docx) ва Excel (.xlsx) файлларини янги ўзбек алифбосига (Ö ö, Ş ş, Ç ç, Ğ ğ) ўгиради. Тўлиқ браузерда, файллар ҳеч қаерга юборилмайди.",
            "Переводит текст и файлы Word (.docx) / Excel (.xlsx) в новый узбекский алфавит (Ö ö, Ş ş, Ç ç, Ğ ğ). Всё работает в браузере, файлы никуда не отправляются.",
            "Converts text and Word (.docx) / Excel (.xlsx) files to the new Uzbek alphabet (Ö ö, Ş ş, Ç ç, Ğ ğ). Runs entirely in your browser — files are never uploaded."
        ],
        'brand.name': [
            "Yangi alifbo", "Yangi alifbo", "Янги алифбо", "Новый алфавит", "New alphabet"
        ],
        'brand.sub': [
            "o'zbek yozuvi o'giruvchisi",
            "özbek yozuvi ögiruvçisi",
            "ўзбек ёзуви ўгирувчиси",
            "конвертер узбекской письменности",
            "Uzbek script converter"
        ],
        'head.note': [
            "Fayllar brauzerda qoladi", "Fayllar brauzerda qoladi",
            "Файллар браузерда қолади", "Файлы остаются в браузере", "Files stay in your browser"
        ],

        /* --- intro / setup ------------------------------------------------ */
        'intro.eyebrow': [
            "Matn · Word · Excel", "Matn · Word · Excel",
            "Матн · Word · Excel", "Текст · Word · Excel", "Text · Word · Excel"
        ],
        'intro.title': [
            "Yozuvni yangi o'zbek alifbosiga o'giring",
            "Yozuvni yangi özbek alifbosiga ögiring",
            "Ёзувни янги ўзбек алифбосига ўгиринг",
            "Переведите текст в новый узбекский алфавит",
            "Convert text to the new Uzbek alphabet"
        ],
        'intro.desc': [
            "Eski lotin yoki kirill yozuvidagi matnni, Word va Excel hujjatlarini bir zumda yangi alifboga o'tkazing. Hech narsa serverga yuborilmaydi.",
            "Eski lotin yoki kirill yozuvidagi matnni, Word va Excel hujjatlarini bir zumda yangi alifboga ötkazing. Heç narsa serverga yuborilmaydi.",
            "Эски лотин ёки кирилл ёзувидаги матнни, Word ва Excel ҳужжатларини бир зумда янги алифбога ўтказинг. Ҳеч нарса серверга юборилмайди.",
            "Мгновенно переводите текст со старой латиницы или кириллицы, а также документы Word и Excel в новый алфавит. Ничего не отправляется на сервер.",
            "Instantly convert text from old Latin or Cyrillic, plus Word and Excel documents, to the new alphabet. Nothing is sent to a server."
        ],
        'setup.label': [
            "Yo'nalish", "Yönaliş", "Йўналиш", "Направление", "Direction"
        ],
        'setup.aria': [
            "O'girish yo'nalishi", "Ögiriş yönalişi", "Ўгириш йўналиши",
            "Направление преобразования", "Conversion direction"
        ],
        'mode.lotin': [
            "Lotin → Yangi", "Lotin → Yangi", "Лотин → Янги", "Латиница → Новая", "Latin → New"
        ],
        'mode.kirill': [
            "Kirill → Yangi", "Kirill → Yangi", "Кирилл → Янги", "Кириллица → Новая", "Cyrillic → New"
        ],
        'mode.orqaga': [
            "Yangi → Lotin", "Yangi → Lotin", "Янги → Лотин", "Новая → Латиница", "New → Latin"
        ],
        'opt.links': [
            "Havolalarni saqlash", "Havolalarni saqlaş", "Ҳаволаларни сақлаш",
            "Сохранять ссылки", "Keep links"
        ],

        /* --- tabs / editor ------------------------------------------------ */
        'tabs.aria': [
            "Bo'limlar", "Bölimlar", "Бўлимлар", "Разделы", "Sections"
        ],
        'tab.matn': ["Matn", "Matn", "Матн", "Текст", "Text"],
        'tab.fayl': ["Fayl", "Fayl", "Файл", "Файл", "File"],
        'tab.qoida': ["Qoidalar", "Qoidalar", "Қоидалар", "Правила", "Rules"],
        'pane.src': ["Manba matn", "Manba matn", "Манба матн", "Исходный текст", "Source text"],
        'pane.out': ["Natija", "Natija", "Натижа", "Результат", "Result"],
        'ph.src': [
            "Matnni shu yerga yozing yoki qo'ying…",
            "Matnni şu yerga yozing yoki qo'ying…",
            "Матнни шу ерга ёзинг ёки қўйинг…",
            "Введите или вставьте текст здесь…",
            "Type or paste text here…"
        ],
        'ph.out': [
            "Natija shu yerda paydo bo'ladi",
            "Natija şu yerda paydo bo'ladi",
            "Натижа шу ерда пайдо бўлади",
            "Результат появится здесь",
            "The result will appear here"
        ],
        'btn.copy': ["Nusxa olish", "Nusxa oliş", "Нусха олиш", "Копировать", "Copy"],
        'btn.swap': [
            "Natijani manbaga", "Natijani manbaga", "Натижани манбага",
            "Результат в источник", "Use result as source"
        ],
        'btn.clear': ["Tozalash", "Tozalash", "Тозалаш", "Очистить", "Clear"],

        /* --- file view ---------------------------------------------------- */
        'drop.title': [
            "Faylni tanlang yoki bu yerga tashlang tilni yuklab olishda tanlaysiz",
            "Faylni tanlang yoki bu yerga taşlang tilni yuklab olişda tanlaysiz",
            "Файлни танланг ёки бу ерга ташланг, тилни юклаб олишда танлайсиз",
            "Выберите файл или перетащите его сюда — язык будет выбран при скачивании",
            "Choose a file or drop it here — you'll pick the language when downloading"
        ],
        'drop.desc': [
            "Word yoki Excel hujjati — bir nechta faylni birga yuklash mumkin",
            "Word yoki Excel hujjati — bir neçta faylni birga yuklaş mumkin",
            "Word ёки Excel ҳужжати — бир нечта файлни бирга юклаш мумкин",
            "Документ Word или Excel — можно загрузить несколько файлов одновременно",
            "Word or Excel document — you can upload multiple files at once"
        ],
        'drop.multi': [
            "bir nechta fayl", "bir neçta fayl", "бир нечта файл",
            "несколько файлов", "multiple files"
        ],
        'zip.group': [
            "ZIP yuklab olish", "ZIP yuklab oliş", "ZIP юклаб олиш",
            "Скачать ZIP", "Download ZIP"
        ],
        'zip.aria': [
            "ZIP uchun alifbo tanlash", "ZIP uchun alifbo tanlaş", "ZIP учун алифбо танлаш",
            "Выбрать алфавит для ZIP", "Choose alphabet for ZIP"
        ],
        'zip.menuAria': [
            "ZIP uchun alifbo", "ZIP uchun alifbo", "ZIP учун алифбо",
            "Алфавит для ZIP", "ZIP alphabet"
        ],
        'zip.default': [
            "Hammasini yuklab olish (.zip)", "Hammasini yuklab oliş (.zip)",
            "Ҳаммасини юклаб олиш (.zip)", "Скачать все (.zip)", "Download all (.zip)"
        ],
        'zip.count': [
            "Hammasini yuklab olish ({n} fayl)", "Hammasini yuklab oliş ({n} fayl)",
            "Ҳаммасини юклаб олиш ({n} файл)", "Скачать все ({n} файлов)",
            "Download all ({n} files)"
        ],
        'clear.files': [
            "Ro'yxatni tozalash", "Ro'yxatni tozalaş", "Рўйхатни тозалаш",
            "Очистить список", "Clear list"
        ],
        'file.note': [
            "Fayl ichidagi shrift, rang, jadval va kataklar o'zgartirilmaydi — faqat harflar almashtiriladi. Har bir fayl yonidagi <b>▾</b> tugmasi bilan, shuningdek ZIP yuklab olish tugmasi yonidagi <b>▾</b> bilan natija alifbosini tanlashingiz mumkin. Eski <b>.doc</b> va <b>.xls</b> formatlari qo'llab-quvvatlanmaydi; ularni avval Word yoki Excel'da <b>.docx</b> / <b>.xlsx</b> qilib saqlang.",
            "Fayl içidagi şrift, rang, jadval va kataklar özgartirilmaydi — faqat harflar almaştiriladi. Har bir fayl yonidagi <b>▾</b> tugmasi bilan, şuningdek ZIP yuklab oliş tugmasi yonidagi <b>▾</b> bilan natija alifbosini tanlaşingiz mumkin. Eski <b>.doc</b> va <b>.xls</b> formatlari qo'llab-quvvatlanmaydi; ularni avval Word yoki Excel'da <b>.docx</b> / <b>.xlsx</b> qilib saqlang.",
            "Файл ичидаги шрифт, ранг, жадвал ва катаклар ўзгартирилмайди — фақат ҳарфлар алмаштирилади. Ҳар бир файл ёнидаги <b>▾</b> тугмаси билан, шунингдек ZIP юклаб олиш тугмаси ёнидаги <b>▾</b> билан натижа алифбосини танлашингиз мумкин. Эски <b>.doc</b> ва <b>.xls</b> форматлари қўллаб-қувватланмайди; уларни аввал Word ёки Excel'да <b>.docx</b> / <b>.xlsx</b> қилиб сақланг.",
            "Шрифт, цвет, таблицы и ячейки внутри файла не меняются — заменяются только буквы. Выбрать алфавит результата можно кнопкой <b>▾</b> рядом с каждым файлом, а также кнопкой <b>▾</b> рядом с ZIP. Старые форматы <b>.doc</b> и <b>.xls</b> не поддерживаются — сначала сохраните их как <b>.docx</b> / <b>.xlsx</b> в Word или Excel.",
            "Fonts, colours, tables and cells inside the file stay untouched — only letters are replaced. Choose the output alphabet with the <b>▾</b> button next to each file, or the <b>▾</b> next to the ZIP button. Old <b>.doc</b> and <b>.xls</b> formats are not supported — save them as <b>.docx</b> / <b>.xlsx</b> in Word or Excel first."
        ],

        /* --- rules view --------------------------------------------------- */
        'rules.h1': [
            "Eski yozuv", "Eski yozuv", "Эски ёзув", "Старый алфавит", "Old script"
        ],
        'rules.h2': [
            "Yangi alifbo", "Yangi alifbo", "Янги алифбо", "Новый алфавит", "New alphabet"
        ],
        'rules.h3': ["Misol", "Misol", "Мисол", "Пример", "Example"],
        'rules.note': [
            "Tutuq belgisi (ʼ) va boshqa tinish belgilari o'zgartirilmaydi. <b>ng</b> harf birikmasi ham o'zgartirilmaydi: <i>tong → tong</i>.",
            "Tutuq belgisi (ʼ) va başqa tinış belgilari özgartirilmaydi. <b>ng</b> harf birikmasi ham özgartirilmaydi: <i>tong → tong</i>.",
            "Тутуқ белгиси (ʼ) ва бошқа тиниш белгилари ўзгартирилмайди. <b>ng</b> ҳарф бирикмаси ҳам ўзгартирилмайди: <i>tong → tong</i>.",
            "Апостроф (ʼ) и другие знаки препинания не меняются. Сочетание <b>ng</b> тоже не меняется: <i>tong → tong</i>.",
            "The apostrophe (ʼ) and other punctuation are unchanged. The <b>ng</b> letter pair is also unchanged: <i>tong → tong</i>."
        ],
        'rules.d1': [
            "Kirill alifbosidan o'girish jadvali",
            "Kirill alifbosidan ögiriş jadvali",
            "Кирилл алифбосидан ўгириш жадвали",
            "Таблица перевода с кириллицы",
            "Cyrillic conversion table"
        ],
        'rules.d1note': [
            "«е, ё, ю, я» harflari soʻz boshida yoki unlidan keyin <b>ye, yo, yu, ya</b> shaklida, undoshdan keyin esa <b>e, o, u, a</b> shaklida yoziladi: <i>елка → yelka</i>, <i>келди → keldi</i>. Keyin natijaga yuqoridagi yangi alifbo qoidalari qoʻllanadi.",
            "«е, ё, ю, я» harflari söź başida yoki unlidan keyin <b>ye, yo, yu, ya</b> şaklida, undoşdan keyin esa <b>e, o, u, a</b> şaklida yoziladi: <i>елка → yelka</i>, <i>келди → keldi</i>. Keyin natijaga yuqoridagi yangi alifbo qoidalari qo'llanadi.",
            "«е, ё, ю, я» ҳарфлари сўз бошида ёки унлидан кейин <b>ye, yo, yu, ya</b> шаклида, ундошдан кейин эса <b>e, o, u, a</b> шаклида ёзилади: <i>елка → yelka</i>, <i>келди → keldi</i>. Кейин натижага юқоридаги янги алифбо қоидалари қўлланади.",
            "Буквы «е, ё, ю, я» в начале слова или после гласной пишутся как <b>ye, yo, yu, ya</b>, а после согласной — как <b>e, o, u, a</b>: <i>елка → yelka</i>, <i>келди → keldi</i>. Затем к результату применяются правила нового алфавита выше.",
            "The letters «е, ё, ю, я» are written as <b>ye, yo, yu, ya</b> at the start of a word or after a vowel, and as <b>e, o, u, a</b> after a consonant: <i>елка → yelka</i>, <i>келди → keldi</i>. The new alphabet rules above are then applied to the result."
        ],
        'rules.d2': [
            "Nima uchun ba'zi so'zlar noto'g'ri chiqishi mumkin",
            "Nima üçün ba'zi sözlar noto'g'ri çiqışi mumkin",
            "Нима учун баъзи сўзлар нотўғри чиқиши мумкин",
            "Почему некоторые слова могут переводиться неточно",
            "Why some words may come out wrong"
        ],
        'rules.d2note': [
            "O'girish qoidalar asosida ishlaydi, lug'at asosida emas. Inglizcha yoki boshqa tildagi so'zlarda ham <b>sh</b>, <b>ch</b> uchrab qolsa, ular ham almashtiriladi (masalan <i>ship → şip</i>). Shuning uchun aralash tilli hujjatlar bilan natijani ko'zdan kechirib chiqish tavsiya etiladi.",
            "Ögiriş qoidalar asosida işlaydi, lug'at asosida emas. Inglizça yoki başqa tildagi sözlar ham <b>sh</b>, <b>ch</b> bilan kelsa, ular ham almaştiriladi (masalan <i>ship → şip</i>). Şuning üçün aralaş tilli hujjatlar bilan natijani közdan keçirib çiqış tavsiya etiladi.",
            "Ўгириш қоидалар асосида ишлайди, луғат асосида эмас. Инглизча ёки бошқа тилдаги сўзларда ҳам <b>sh</b>, <b>ch</b> учраб қолса, улар ҳам алмаштирилади (масалан <i>ship → şip</i>). Шунинг учун аралаш тилли ҳужжатлар билан натижани кўздан кечириб чиқиш тавсия этилади.",
            "Преобразование работает по правилам, а не по словарю. Если в английских или других словах встречаются <b>sh</b> и <b>ch</b>, они тоже заменяются (например <i>ship → şip</i>). Поэтому результат для смешанных документов стоит проверять вручную.",
            "Conversion follows rules, not a dictionary. If <b>sh</b> or <b>ch</b> appear in English or other words, they are replaced too (for example <i>ship → şip</i>). That's why it's a good idea to review the result for mixed-language documents."
        ],

        /* --- footer / lang ----------------------------------------------- */
        'footer.line': [
            "<b>Yangi o'zbek alifbosi</b> · hammasi brauzerda ishlaydi · fayllar hech qayerga yuborilmaydi",
            "<b>Yangi özbek alifbosi</b> · hammasi brauzerda işlaydi · fayllar heç qayerga yuborilmaydi",
            "<b>Янги ўзбек алифбоси</b> · ҳаммаси браузерда ишлайди · файллар ҳеч қаерга юборилмайди",
            "<b>Новый узбекский алфавит</b> · всё работает в браузере · файлы никуда не отправляются",
            "<b>New Uzbek alphabet</b> · runs entirely in your browser · files are never uploaded"
        ],
        'visits.title': [
            "Har bir tashrifchi 24 soatda bir marta hisoblanadi",
            "Har bir taşrifçi 24 soatda bir marta hisoblanadi",
            "Ҳар бир ташрифчи 24 соатда бир марта ҳисобланади",
            "Каждый посетитель учитывается один раз в 24 часа",
            "Each visitor is counted once every 24 hours"
        ],
        'visits.label': [
            "Tashriflar soni:", "Taşriflar soni:", "Ташрифлар сони:",
            "Посещений:", "Visits:"
        ],
        'lang.aria': [
            "Tilni tanlash", "Tilni tanlaş", "Тилни танлаш",
            "Выбрать язык", "Choose language"
        ],
        'lang.menuAria': [
            "Interfeys tili", "Interfeys tili", "Интерфейс тили",
            "Язык интерфейса", "Interface language"
        ],
        'lang.current': [
            "{code} — Til: {name}", "{code} — Til: {name}", "{code} — Тил: {name}",
            "{code} — Язык: {name}", "{code} — Language: {name}"
        ],
        'lang.name.uz': [
            "O'zbekcha (Lotin)", "O'zbekcha (Lotin)", "O'zbekcha (Lotin)",
            "O'zbekcha (Lotin)", "O'zbekcha (Lotin)"
        ],
        'lang.name.uz-yangi': [
            "O'zbekcha (Yangi lotin)", "O'zbekcha (Yangi lotin)", "O'zbekcha (Yangi lotin)",
            "O'zbekcha (Yangi lotin)", "O'zbekcha (Yangi lotin)"
        ],
        'lang.name.uz-kirill': [
            "O'zbekcha (Kiril)", "O'zbekcha (Kiril)", "O'zbekcha (Kiril)",
            "O'zbekcha (Kiril)", "O'zbekcha (Kiril)"
        ],
        'lang.name.ru': ["Русский", "Русский", "Русский", "Русский", "Русский"],
        'lang.name.en': ["English", "English", "English", "English", "English"],
        'lang.note.uz': ["", "", "", "", ""],
        'lang.note.uz-yangi': [
            "Ö, Ş, Ç, Ğ", "Ö, Ş, Ç, Ğ", "Ö, Ş, Ç, Ğ", "Ö, Ş, Ç, Ğ", "Ö, Ş, Ç, Ğ"
        ],
        'lang.note.uz-kirill': [
            "Ўзбекча", "Ўзбекча", "Ўзбекча", "Ўзбекча", "Ўзбекча"
        ],
        'lang.note.ru': ["", "", "", "", ""],
        'lang.note.en': ["", "", "", "", ""],
        'lang.code.uz': ["UZ", "UZ", "UZ", "UZ", "UZ"],
        'lang.code.uz-yangi': ["YÖ", "YÖ", "YÖ", "YÖ", "YÖ"],
        'lang.code.uz-kirill': ["ЎЗ", "ЎЗ", "ЎЗ", "ЎЗ", "ЎЗ"],
        'lang.code.ru': ["RU", "RU", "RU", "RU", "RU"],
        'lang.code.en': ["EN", "EN", "EN", "EN", "EN"],

        /* --- dynamic (app.js) -------------------------------------------- */
        'alpha.kirill': [
            "Kiril alifbosi", "Kiril alifbosi", "Кирилл алифбоси", "Кириллица", "Cyrillic"
        ],
        'alpha.eski': [
            "Eski lotin alifbosi", "Eski lotin alifbosi", "Эски лотин алифбоси",
            "Старая латиница", "Old Latin alphabet"
        ],
        'alpha.yangi': [
            "Yangi o'zbek alifbosi", "Yangi özbek alifbosi", "Янги ўзбек алифбоси",
            "Новый узбекский алфавит", "New Uzbek alphabet"
        ],
        'alphaOption.kirill': [
            "Kiril alifbosiga", "Kiril alifbosiga", "Кирилл алифбосига",
            "В кириллицу", "To Cyrillic"
        ],
        'alphaOption.eski': [
            "Eski lotin alifbosiga", "Eski lotin alifbosiga", "Эски лотин алифбосига",
            "В старую латиницу", "To old Latin"
        ],
        'alphaOption.yangi': [
            "Yangi o'zbek alifbosiga", "Yangi özbek alifbosiga", "Янги ўзбек алифбосига",
            "В новую латиницу", "To new Uzbek Latin"
        ],
        'unit.char': ["belgi", "belgi", "белги", "символов", "characters"],
        'unit.word': ["so'z", "söz", "сўз", "слов", "words"],
        'status.changed': [
            "o'girildi", "ögirildi", "ўгирилди", "преобразовано", "converted"
        ],
        'status.same': [
            "o'zgarish yo'q", "özgariş yo'q", "ўзгариш йўқ",
            "изменений нет", "no changes"
        ],
        'out.yangi': [
            "yangi alifbo", "yangi alifbo", "янги алифбо", "новый алфавит", "new alphabet"
        ],
        'out.eski': [
            "eski lotin", "eski lotin", "эски лотин", "старая латиница", "old Latin"
        ],
        'file.converting': [
            "o'girilmoqda…", "ögirilmoqda…", "ўгирилмоқда…", "преобразование…", "converting…"
        ],
        'file.detecting': [
            "Alifbo aniqlanmoqda…", "Alifbo aniqlanmoqda…", "Алифбо аниқланмоқда…",
            "Определение алфавита…", "Detecting alphabet…"
        ],
        'file.detected': [
            "Fayl {alpha}da aniqlandi", "Fayl {alpha}da aniqlandi", "Файл {alpha}да аниқланди",
            "Файл определён как {alpha}", "Detected as {alpha}"
        ],
        'file.guess': [
            " (taxmin)", " (taxmin)", " (тахмин)", " (предположительно)", " (best guess)"
        ],
        'file.notDetected': [
            "Alifbo aniqlanmadi", "Alifbo aniqlanmadi", "Алифбо аниқланмади",
            "Алфавит не определён", "Alphabet not detected"
        ],
        'file.parts': [
            "{n} qism o'zgartirildi", "{n} qism özgartirildi", "{n} қисм ўзгартирилди",
            "Изменено частей: {n}", "Parts changed: {n}"
        ],
        'file.noChange': [
            "o'zgarish topilmadi", "özgariş topilmadi", "ўзгариш топилмади",
            "изменений не найдено", "no changes found"
        ],
        'dl.group': [
            "Faylni yuklab olish", "Faylni yuklab oliş", "Файлни юклаб олиш",
            "Скачать файл", "Download file"
        ],
        'dl.btn': ["Yuklab olish", "Yuklab oliş", "Юклаб олиш", "Скачать", "Download"],
        'dl.caret': [
            "Yuklab olish alifbosini tanlash", "Yuklab oliş alifbosini tanlaş",
            "Юклаб олиш алифбосини танлаш", "Выбрать алфавит для скачивания",
            "Choose download alphabet"
        ],
        'dl.menu': [
            "Yuklab olish alifbosi", "Yuklab oliş alifbosi", "Юклаб олиш алифбоси",
            "Алфавит для скачивания", "Download alphabet"
        ],
        'toast.download': [
            "Yuklab olinmoqda: {name}", "Yuklab olinmoqda: {name}", "Юклаб олинмоқда: {name}",
            "Скачивание: {name}", "Downloading: {name}"
        ],
        'toast.fail': [
            "O'girib bo'lmadi: {msg}", "Ögirib bo'lmadi: {msg}", "Ўгириб бўлмади: {msg}",
            "Не удалось преобразовать: {msg}", "Could not convert: {msg}"
        ],
        'toast.zipReady': [
            "Arxiv tayyor: {name}", "Arxiv tayyor: {name}", "Архив тайёр: {name}",
            "Архив готов: {name}", "Archive ready: {name}"
        ],
        'toast.zipFail': [
            "Arxivlab bo'lmadi: {msg}", "Arxivlab bo'lmadi: {msg}", "Архивлаб бўлмади: {msg}",
            "Не удалось создать архив: {msg}", "Could not create archive: {msg}"
        ],
        'toast.copyEmpty': [
            "Nusxa olish uchun matn yo'q", "Nusxa oliş üçün matn yo'q",
            "Нусха олиш учун матн йўқ", "Нет текста для копирования", "No text to copy"
        ],
        'toast.copied': ["Nusxa olindi", "Nusxa olindi", "Нусха олинди", "Скопировано", "Copied"],
        'toast.copyFail': [
            "Nusxa olib bo'lmadi", "Nusxa olib bo'lmadi", "Нусха олиб бўлмади",
            "Не удалось скопировать", "Could not copy"
        ],
        'toast.swapped': [
            "Natija manbaga ko'chirildi", "Natija manbaga köçirildi",
            "Натижа манбага кўчирилди", "Результат перенесён в источник",
            "Result moved to source"
        ],
        'zip.packing': [
            "Paketlanmoqda…", "Paketlanmoqda…", "Пакетланмоқда…", "Упаковка…", "Packaging…"
        ],
        'file.unknown': [
            "Noma'lum xatolik", "Noma'lum xatolik", "Номаълум хатолик",
            "Неизвестная ошибка", "Unknown error"
        ],
        'file.skipped': [
            "{n} ta fayl .docx/.xlsx emas", "{n} ta fayl .docx/.xlsx emas",
            "{n} та файл .docx/.xlsx эмас", "Файлов не в формате .docx/.xlsx: {n}",
            "{n} file(s) are not .docx/.xlsx"
        ],
        'file.ready': [
            "Tayyor: {n} ta fayl", "Tayyor: {n} ta fayl", "Тайёр: {n} та файл",
            "Готово файлов: {n}", "Ready: {n} file(s)"
        ]
    };

    /* satrlardan til bo'yicha lug'atlar yasash */
    var DICT = {};
    CODES.forEach(function (code, i) {
        var d = DICT[code] = {};
        Object.keys(ROWS).forEach(function (key) { d[key] = ROWS[key][i]; });
    });

    function read() {
        try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function save(code) {
        try { window.localStorage.setItem(KEY, code); } catch (e) { /* private mode */ }
    }

    var current = CODES.indexOf(read()) !== -1 ? read() : 'uz';

    function t(key, vars) {
        var own = DICT[current] && Object.prototype.hasOwnProperty.call(DICT[current], key)
            ? DICT[current][key]
            : (Object.prototype.hasOwnProperty.call(DICT.uz, key) ? DICT.uz[key] : key);
        var s = own;
        if (vars) {
            s = s.replace(/\{(\w+)\}/g, function (m, k) {
                return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m;
            });
        }
        return s;
    }

    function each(sel, fn) {
        Array.prototype.forEach.call(document.querySelectorAll(sel), fn);
    }

    function apply() {
        var meta = META[current];
        document.documentElement.lang = meta.lang;
        document.title = t('meta.title');

        each('[data-i18n]', function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
        each('[data-i18n-html]', function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
        each('[data-i18n-placeholder]', function (el) {
            el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
        });
        each('[data-i18n-aria]', function (el) {
            el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
        });
        each('[data-i18n-title]', function (el) {
            el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
        });
        each('[data-i18n-content]', function (el) {
            el.setAttribute('content', t(el.getAttribute('data-i18n-content')));
        });

        var trigger = document.getElementById('langBtn');
        if (trigger) {
            trigger.setAttribute('aria-label', t('lang.current', {
                code: meta.code,
                name: t('lang.name.' + current)
            }));
            trigger.setAttribute('title', t('lang.name.' + current));
            var code = document.getElementById('langCode');
            if (code) code.textContent = meta.code;
            var use = document.getElementById('langFlagUse');
            if (use) use.setAttribute('href', '#flag-' + meta.flag);
        }

        each('#langMenu button[data-lang]', function (b) {
            var code = b.getAttribute('data-lang');
            var name = b.querySelector('.lang-name');
            if (name) name.textContent = t('lang.name.' + code);
            var note = b.querySelector('.lang-note');
            if (note) {
                note.textContent = t('lang.note.' + code);
                note.hidden = !note.textContent;
            }
            if (code === current) b.setAttribute('aria-current', 'true');
            else b.removeAttribute('aria-current');
        });

        document.dispatchEvent(new CustomEvent('i18n:change', {
            detail: { code: current, lang: meta.lang }
        }));
    }

    function set(code) {
        if (CODES.indexOf(code) === -1 || code === current) return;
        current = code;
        save(code);
        apply();
    }

    window.I18N = {
        codes: CODES,
        get current() { return current; },
        t: t,
        set: set,
        apply: apply,
        meta: META
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply);
    } else {
        apply();
    }
})();
