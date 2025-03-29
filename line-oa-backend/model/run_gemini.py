import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv
from prompt import receipt_prompt
from PIL import Image
from io import BytesIO

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def classify_img(image: bytes, prompt: str):
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        print("Model created")

        pil_image = Image.open(BytesIO(image))
        response = model.generate_content([prompt, pil_image])
        print("Got response from Gemini")

        return response.text
    except Exception as e:
        print("Gemini API Error:", e)
        return '{"type": "error", "message": "Gemini failed"}'

def main():
    try:
        image_path = sys.argv[1]
        with open(image_path, "rb") as f:
            image_bytes = f.read()

        result = classify_img(image_bytes, receipt_prompt)

        # Clean ```json ... ``` if Gemini returns markdown
        cleaned = result.replace("```json", "").replace("```", "").strip()
        print(cleaned)
    except Exception as e:
        print("Python script crashed:", e)

if __name__ == "__main__":
    main()
