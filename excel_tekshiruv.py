# -*- coding: utf-8 -*-
"""
=====================================================================
  EXCEL МАЪЛУМОТЛАР БАЗАСИНИ ТЕКШИРИШ СКРИПТИ
=====================================================================
  Вазифалари:
    1. Дубликатларни (такрорланган сатрларни) аниқлаш
    2. Бўш (тўлдирилмаган) муҳим майдонларни топиш
    3. Формат ва мантиқий хатоларни аниқлаш
       (рақам ўрнига матн, нотўғри сана ва ҳ.к.)
    4. Иккита вароқ/жадвални солиштириш

  Натижа:  "nomuvofiqliklar_hisoboti.xlsx" файлига сақланади.
           Ҳар бир хато тури алоҳида листга ёзилади.

  Ишга тушириш:   python excel_tekshiruv.py
=====================================================================
"""

import os
import sys
from datetime import datetime

import pandas as pd
from openpyxl.styles import Font, PatternFill, Alignment

# Windows консолида ўзбек ҳарфлари тўғри чиқиши учун
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


# =====================================================================
# 1-ҚАДАМ: СОЗЛАМАЛАР — БУ ЕРДА ЎЗ ФАЙЛИНГИЗ ВА УСТУНЛАРИНГИЗНИ КЎРСАТИНГ
# =====================================================================

EXCEL_FAYL = "malumotlar.xlsx"   # Текширилаётган асосий Excel файли
FAYL2 = None                     # Иккинчи файл номи (агар жадвал бошқа файлда бўлса).
                                 # None бўлса — шу файлнинг ичидаги 2-вароқ олинади.

VARAQ1 = "Sheet1"                # 1-вароқ (лист) номи
VARAQ2 = "Sheet2"                # 2-вароқ номи — солиштириш учун

MUHIM_USTUNLAR = [               # БЎШЛИГИ текшириладиган муҳим устунлар
    "Исм", "Паспорт", "Туғилган_сана", "Маош",
]

DUBLIKAT_USTUNLARI = None        # Дубликат текшируви учун устунлар.
                                 # None бўлса — СТРНИНГ ТОҒЛИҚ кўриниши бўйича текширилади.
                                 # Масалан: ["Паспорт"] ёки ["Исм", "Туғилган_сана"]

KALIT_USTUN = "ID"               # Солиштириш учун калит устун (масалан, ID рақами)

RAQAMLI_USTUNLAR = [             # ФАҚАТ РАҚАМ туриши керак бўлган устунлар
    "Маош", "Телефон",
]

SANA_USTUNLAR = [                # ФАҚАТ САНА туриши керак бўлган устунлар
    "Туғилган_сана",
]

HISOBOT_FAYLI = "nomuvofiqliklar_hisoboti.xlsx"   # Натижа сақланадиган файл


# =====================================================================
# 2-ҚАДАМ: ФАЙЛНИ ЎҚИШ ФУНКЦИЯЛАРИ
# =====================================================================

def varoqni_yukla(fayl_nomi, varaq_nomi):
    """
    Excel файлнинг берилган вароғини DataFrame сифатида ўқийди.
    Барча катаклар матн сифатида эмас, асл турлари билан ўқилади.
    """
    if not os.path.exists(fayl_nomi):
        raise FileNotFoundError(f"Fayl topilmadi: {fayl_nomi}")
    df = pd.read_excel(fayl_nomi, sheet_name=varaq_nomi)
    # Устун номларидаги ортиқча бўш жойларни олиб ташлаймиз
    df.columns = [str(c).strip() for c in df.columns]
    return df


# =====================================================================
# 3-ҚАДАМ: ДУБЛИКАТЛАРНИ АНИҚЛАШ
# =====================================================================

def dublikatlarni_top(df):
    """
    Тўлиқ ёки танланган устунлар бўйича такрорланган сатрларни топади.
    'Сатр_рақами' — Excel файлдаги ҳақиқий сатр рақами (1-сатр = сарлавҳа).
    """
    ustunlar = DUBLIKAT_USTUNLARI
    if ustunlar:
        # Фақат файлда мавжуд бўлган устунларни оламиз
        mavjud = [u for u in ustunlar if u in df.columns]
        mask = df.duplicated(subset=mavjud, keep=False)
    else:
        # Барча устунлар бўйича тўлиқ мос келадиган сатрлар
        mask = df.duplicated(keep=False)

    natija = df[mask].copy()
    if not natija.empty:
        # Индекс + 2 = Excelдаги сатр рақами (1-сатр сарлавҳа ҳисобланади)
        natija.insert(0, "Сатр_рақами_(Excel)", [i + 2 for i in natija.index])
    return natija


# =====================================================================
# 4-ҚАДАМ: БЎШ МАЙДОНЛАРНИ ТОПИШ
# =====================================================================

def bush_maydonlarni_top(df):
    """
    Муҳим устунлардаги бўш (NaN ёки фақат бўш жой) катакларни топади.
    Натижа: ҳар бир бўш катак учун сатр рақами ва устун номи.
    """
    xatolar = []
    for ustun in MUHIM_USTUNLAR:
        if ustun not in df.columns:
            continue  # Бундай устун файлда йўқ — ўтказиб юборамиз
        qiymatlar = df[ustun]
        # NaN ёки матн кўринишида фақат бўш жойлардан иборат катаклар
        bush_mask = qiymatlar.isna() | (
            qiymatlar.astype(str).str.strip().isin(["", "nan", "NaT", "None"])
        )
        for idx in df[bush_mask].index:
            kalit_qiymat = ""
            if KALIT_USTUN in df.columns:
                kalit_qiymat = df.at[idx, KALIT_USTUN]
            xatolar.append({
                "Устун": ustun,
                "Сатр_рақами_(Excel)": idx + 2,
                KALIT_USTUN: kalit_qiymat,
                "Хато": "Бўш майдон — тўлдирилмаган",
            })
    return pd.DataFrame(xatolar)


# =====================================================================
# 5-ҚАДАМ: ФОРМАТ ВА МАНТИҚИЙ ХАТОЛАРНИ АНИҚЛАШ
# =====================================================================

def _raqammi(qiymat):
    """Қиймат рақамга айлантириш мумкинлигини текширади."""
    try:
        float(str(qiymat).replace(" ", "").replace("\u00a0", "").replace(",", "."))
        return True
    except (ValueError, TypeError):
        return False


def _sanami(qiymat):
    """Қиймат тўғри санага айлантириш мумкинлигини текширади."""
    try:
        pd.to_datetime(qiymat, dayfirst=True, errors="raise")
        return True
    except (ValueError, TypeError):
        return False


def format_xatolarini_top(df):
    """
    Рақамли ва сана устунларидаги формат хатоларини топади:
      - Рақам керак жойга ёзилган матн (масалан: 'yuz ming')
      - Мавжуд бўлмаган / нотўғри сана (масалан: '32.13.2020')
      - Матн кўринишидаги сана (Excel уни сана деб билмайди)
    """
    xatolar = []

    # --- Рақамли устунларни текшириш ---
    for ustun in RAQAMLI_USTUNLAR:
        if ustun not in df.columns:
            continue
        for idx, qiymat in df[ustun].items():
            if pd.isna(qiymat):
                continue  # Бўшларни аллақачон 'Бўш майдонлар' листида кўрамиз
            if not _raqammi(qiymat):
                xatolar.append({
                    "Устун": ustun,
                    "Сатр_рақами_(Excel)": idx + 2,
                    "Нотўғри_қиймат": repr(qiymat),
                    "Хато": f"'{ustun}' устунида рақам бўлиши керак edi, "
                            f"матн ёки нотўғри белги топилди",
                })

    # --- Сана устунларини текшириш ---
    for ustun in SANA_USTUNLAR:
        if ustun not in df.columns:
            continue
        for idx, qiymat in df[ustun].items():
            if pd.isna(qiymat):
                continue
            if not _sanami(qiymat):
                xatolar.append({
                    "Устун": ustun,
                    "Сатр_рақами_(Excel)": idx + 2,
                    "Нотўғри_қиймат": repr(qiymat),
                    "Хато": f"'{ustun}' устунида тўғри сана бўлиши керак "
                            f"(масалан: 15.03.1990)",
                })

    return pd.DataFrame(xatolar)


# =====================================================================
# 6-ҚАДАМ: ИККИ ВАРОҚНИ (ЖАДВАЛНИ) СОЛИШТИРИШ
# =====================================================================

def varoqlarni_solishtir(df1, df2):
    """
    Иккита жадвални калит устун (ID) бўйича солиштиради:
      1. Фақат 1-жадвалда бўлган ёзувлар
      2. Фақат 2-жадвалда бўлган ёзувлар
      3. Умумий устунларда қийматлари фарқ қиладиган ёзувлар
    """
    if KALIT_USTUN not in df1.columns or KALIT_USTUN not in df2.columns:
        print(f"[OGOHLANTIRISH] '{KALIT_USTUN}' ustuni topilmadi — solishtirish o'tkazilmadi.")
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    # Калит устунни матн кўринишига келтирамиз (1001 ва "1001" мос келси)
    k1 = df1[KALIT_USTUN].astype(str).str.strip()
    k2 = df2[KALIT_USTUN].astype(str).str.strip()

    # --- 1) Фақат битта жадвалда мавжуд ёзувлар ---
    faqat1 = df1[~k1.isin(k2)].copy()
    faqat2 = df2[~k2.isin(k1)].copy()
    if not faqat1.empty:
        faqat1.insert(0, "Изоҳ", f"Фақат {VARAQ1} да мавжуд")
    if not faqat2.empty:
        faqat2.insert(0, "Изоҳ", f"Фақат {VARAQ2} да мавжуд")

    # --- 2) Қийматлари фарқ қиладиган ёзувлар ---
    umumiy_ustunlar = [c for c in df1.columns if c in df2.columns and c != KALIT_USTUN]
    farqlar = []

    # Калитлар бўйича бириктирамиз (merge)
    birlashma = pd.merge(
        df1.assign(_kalit=k1), df2.assign(_kalit=k2),
        on="_kalit", suffixes=("_1", "_2"),
    )
    for ustun in umumiy_ustunlar:
        q1 = birlashma[f"{ustun}_1"].astype(str).str.strip()
        q2 = birlashma[f"{ustun}_2"].astype(str).str.strip()
        farq_mask = q1 != q2
        for _, row in birlashma[farq_mask].iterrows():
            farqlar.append({
                KALIT_USTUN: row["_kalit"],
                "Устун": ustun,
                f"{VARAQ1} даги_қиймат": row[f"{ustun}_1"],
                f"{VARAQ2} даги_қиймат": row[f"{ustun}_2"],
            })

    return pd.DataFrame(farqlar), faqat1, faqat2


# =====================================================================
# 7-ҚАДАМ: ҲИСОБOTНИ EXCEL ФАЙЛИГА ЁЗИШ
# =====================================================================

SARLAVHA_RANGI = "4472C4"   # Сарлавҳа фон ранги (кўк)
SARLAVHA_SHRIFTI = "FFFFFF" # Сарлавҳа матн ранги (оқ)


def _sarlavhani_bezat(worksheet):
    """Лист сарлавҳасини (1-қаторни) ранг ва қалин шрифт билан безайди."""
    for katak in worksheet[1]:
        katak.font = Font(bold=True, color=SARLAVHA_SHRIFTI)
        katak.fill = PatternFill(start_color=SARLAVHA_RANGI,
                                 end_color=SARLAVHA_RANGI, fill_type="solid")
        katak.alignment = Alignment(horizontal="center")
    # Устун кенгликларини мазмунга қараб танлаймиз
    for ustun_katak in worksheet.iter_cols(min_row=1, max_row=50):
        eng_uzun = max((len(str(k.value)) for k in ustun_katak if k.value is not None),
                       default=10)
        worksheet.column_dimensions[ustun_katak[0].column_letter].width = \
            min(max(eng_uzun + 2, 12), 45)


def hisobotni_yoz(natijalar):
    """
    Барча натижаларни битта Excel файлга ёзади.
    natijalar — {'Лист_номи': DataFrame} кўринишидаги луғат.
    """
    with pd.ExcelWriter(HISOBOT_FAYLI, engine="openpyxl") as yozuvchi:
        for varaq_nomi, df in natijalar.items():
            if df is None or df.empty:
                # Хато топилмаганда ҳам лист қолдиримиз — 'Хато топилмади' ёзувини қўямиз
                pd.DataFrame({"Натижа": [f"Хато топилмади ✓ ({datetime.now():%d.%m.%Y %H:%M})"]}
                             ).to_excel(yozuvchi, sheet_name=varaq_nomi, index=False)
            else:
                df.to_excel(yozuvchi, sheet_name=varaq_nomi, index=False)
            _sarlavhani_bezat(yozuvchi.sheets[varaq_nomi])


# =====================================================================
# 8-ҚАДАМ: АСОСИЙ БАЖАРУВ БЛОКИ
# =====================================================================

def main():
    print("=" * 60)
    print("EXCEL МАЪЛУМОТЛАРИНИ ТЕКШИРИШ БОШЛАНДИ")
    print("=" * 60)

    # --- Файлларни ўқиш ---
    print(f"\n[1] '{EXCEL_FAYL}' fayli o'qilmoqda...")
    df1 = varoqni_yukla(EXCEL_FAYL, VARAQ1)
    print(f"    {VARAQ1}: {len(df1)} qator, {len(df1.columns)} ustun")

    ikkinchi_manba = FAYL2 if FAYL2 else EXCEL_FAYL
    print(f"[2] '{ikkinchi_manba}' -> '{VARAQ2}' o'qilmoqda...")
    df2 = varoqni_yukla(ikkinchi_manba, VARAQ2)
    print(f"    {VARAQ2}: {len(df2)} qator, {len(df2.columns)} ustun")

    # --- Текширувлар ---
    print("\n[3] Dublikatlar tekshirilmoqda...")
    dublikatlar = dublikatlarni_top(df1)

    print("[4] Bo'sh maydonlar tekshirilmoqda...")
    bushlar = bush_maydonlarni_top(df1)

    print("[5] Format va mantiqiy xatolar tekshirilmoqda...")
    format_xatolari = format_xatolarini_top(df1)

    print("[6] Varoqlar solishtirilmoqda...")
    farqlar, faqat1, faqat2 = varoqlarni_solishtir(df1, df2)

    # --- Ҳисоботни ёзиш ---
    print(f"\n[7] Hisobot '{HISOBOT_FAYLI}' fayliga yozilmoqda...")
    hisobotni_yoz(
        {
            "Дубликатлар": dublikatlar,
            "Буш_майдонлар": bushlar,
            "Формат_хатолари": format_xatolari,
            "Солиштирув_фарқлар": farqlar,
            "Фақат_" + VARAQ1: faqat1,
            "Фақат_" + VARAQ2: faqat2,
        }
    )

    # --- Хулоса ---
    print("\n" + "=" * 60)
    print("ТУХОВЛАР ХУЛОСАСИ:")
    print(f"  • Dublikat qatorlar      : {len(dublikatlar)}")
    print(f"  • Bo'sh maydonlar        : {len(bushlar)}")
    print(f"  • Format xatolari        : {len(format_xatolari)}")
    print(f"  • Qiymat farqlari        : {len(farqlar)}")
    print(f"  • Faqat {VARAQ1} da     : {len(faqat1)}")
    print(f"  • Faqat {VARAQ2} da     : {len(faqat2)}")
    print("=" * 60)
    print(f"NATIJA: {os.path.abspath(HISOBOT_FAYLI)}")


if __name__ == "__main__":
    main()
