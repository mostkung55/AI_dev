import re
import pymysql
import json
from pythainlp.util import normalize
from pythainlp.tokenize import word_tokenize
from fuzzywuzzy import process, fuzz
import sys

sys.stdout.reconfigure(encoding='utf-8')

# คำขยายที่ต้องการจับ
MODIFIERS = ["เพิ่มไข่", "ไม่ใส่ผัก", "เพิ่มชีส", "เพิ่มเบคอน", "เพิ่มแฮม"]

def get_products_from_db():
    connection = pymysql.connect(
        host="localhost",
        user="root",
        password="root",
        database="test",
        port=3306,
        cursorclass=pymysql.cursors.DictCursor
    )
    
    with connection:
        with connection.cursor() as cursor:
            sql = "SELECT Product_ID, Product_Name FROM Product"
            cursor.execute(sql)
            products = cursor.fetchall()
    
    return products

# ✅ ดึงข้อมูลสินค้าจากฐานข้อมูล
products = get_products_from_db()
menu_db = {normalize(p["Product_Name"]): p["Product_ID"] for p in products}  # Dict {ชื่อสินค้า: ID}

def find_best_match(word, menu_db, threshold=60):  # ✅ ลด threshold เพื่อรองรับการพิมพ์ไม่ครบ
    candidates = process.extract(word, menu_db.keys(), scorer=fuzz.token_set_ratio, limit=3)

    # ✅ คัดเฉพาะรายการที่มีคะแนนสูงกว่า threshold
    best_match = None
    best_score = 0
    for candidate, score in candidates:
        if score >= threshold and score > best_score:
            best_match = candidate
            best_score = score

    if best_match:
        return best_match, menu_db[best_match]
    return None, None
print("📌 เมนูที่มีอยู่ในฐานข้อมูล:", menu_db)
def extract_orders(text):
    orders = []
    detected_menus = {}  

    text = normalize(text.strip())
    text = re.sub(r'\s+', ' ', text)

    # ดึงรายการสินค้าพร้อมจำนวน
    matches = re.findall(r'(\D+)\s*(\d*)', text)  

    for menu_name, qty in matches:
        menu_name = normalize(menu_name.strip())
        quantity = int(qty) if qty.isdigit() else 1

        # ✅ แยกตัวขยายเมนูออกจากชื่อเมนู
        modifiers = []
        words = word_tokenize(menu_name)
        
        filtered_words = []
        for word in words:
            if word in MODIFIERS:
                modifiers.append(word)
            else:
                filtered_words.append(word)
        
        menu_name_cleaned = " ".join(filtered_words)
        
        # ✅ ตรวจจับเมนูที่พิมพ์ไม่ครบ
        best_match, Product_ID = find_best_match(menu_name_cleaned, menu_db)

        if best_match:
            key = (best_match, tuple(modifiers))  # ใช้ tuple เป็น key เพื่อลดการซ้ำซ้อน
            if key in detected_menus:
                detected_menus[key] += quantity
            else:
                detected_menus[key] = quantity

    # ✅ แปลงผลลัพธ์เป็น JSON
    for (menu, mods), qty in detected_menus.items():
        orders.append({
            "menu": menu,
            "quantity": qty,
            "modifiers": list(mods),
            "Product_ID": menu_db[menu]
        })

    return orders

if __name__ == "__main__":
    text_input = sys.argv[1]
    result = extract_orders(text_input)  

    print(json.dumps(result, ensure_ascii=False, indent=2))
