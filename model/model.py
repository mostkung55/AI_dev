#!/usr/bin/env python
# coding: utf-8


import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"





from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
from fuzzywuzzy import process
import pandas as pd

# โหลด tokenizer และโมเดล WangchanBERTa ที่ปรับใช้กับภาษาไทย
tokenizer = AutoTokenizer.from_pretrained("airesearch/wangchanberta-base-att-spm-uncased", use_fast=False)
model = AutoModelForTokenClassification.from_pretrained("airesearch/wangchanberta-base-att-spm-uncased")

# สร้าง NER pipeline
ner_pipeline = pipeline("ner", model=model, tokenizer=tokenizer, aggregation_strategy="simple")




import re
import pymysql
from pythainlp.util import normalize
from pythainlp.tokenize import word_tokenize
from fuzzywuzzy import fuzz, process
import sys
import json
sys.stdout.reconfigure(encoding='utf-8')

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
          
def find_best_match(word, menu_db, threshold=80):  # ✅ ลด threshold เป็น 80
    match, score = process.extractOne(word, menu_db.keys())

    if score >= threshold:  # ✅ ป้องกันการจับคู่ผิด
        return match, menu_db[match]
    return None, None

def extract_orders(text):
    orders = []
    detected_menus = {}  # ใช้ dictionary เพื่อลดการซ้ำ

    text = normalize(text.strip())
    text = re.sub(r'\s+', ' ', text)

    matches = re.findall(r'(\D+)\s*(\d+)', text)  
    for menu_name, qty in matches:
        menu_name = normalize(menu_name.strip())
        quantity = int(qty) if qty.isdigit() else 1

        best_match, Product_ID = find_best_match(menu_name, menu_db)

        if menu_name in detected_menus:
            detected_menus[menu_name] += quantity
        else:
            detected_menus[menu_name] = quantity

    for menu, qty in detected_menus.items():
        orders.append({"menu": menu, "quantity": qty})

    return orders


if __name__ == "__main__":
    text_input = sys.argv[1]
    result = extract_orders(text_input)  # Model วิเคราะห์คำสั่งซื้อ

    # ✅ เพิ่ม product_id ลงใน JSON
    for order in result:
        if order["menu"] in menu_db:
            order["Product_ID"] = menu_db[order["menu"]]
        else:
            print(f"❌ ไม่พบสินค้าในฐานข้อมูล: {order['menu']}")
            order["Product_ID"] = None  # ถ้าหาไม่เจอให้เป็น None

    print(json.dumps(result, ensure_ascii=False))
