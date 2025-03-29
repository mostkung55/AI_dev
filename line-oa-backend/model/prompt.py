receipt_prompt = """
  Your task have to read the image fill data to the JSON
  image has 2 types
  - receipt: the image is receipt and able to extract text
  - others: others things that are not receipt
  this is example JSON

  "
  {
    type: "others" / "receipt", # based on the image
    date: "", # date in receipt in UTF ISO format
              # date default as today
    detail: [
      name: "", # name of the ingredient
      quantity: 1, # quantity of the items bill
      price: 1, # price of that item in bill
    ],
  }
  "
  NOTE that detail item must exist in the ingredient list
  if in the receipt don't have any items in the list, fill
  empty array []

  ingredient list:

  ---
  ⚠️ IMPORTANT:
  Do NOT include any triple backticks (```) or markdown formatting.
  Only return the JSON structure in plain text format.
"""
