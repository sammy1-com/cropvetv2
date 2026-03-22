from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class Product(BaseModel):
    id: str; name: str; category: str; price: float; unit: str
    seller: str; location: str; rating: float; in_stock: bool; description: str

PRODUCTS = [
    {"id":"1","name":"DAP Fertilizer 50kg","category":"fertilizer","price":3200,"unit":"bag","seller":"AgroServe Nakuru","location":"Nakuru","rating":4.8,"in_stock":True,"description":"Diammonium Phosphate — ideal for planting. Boosts root development."},
    {"id":"2","name":"CAN Fertilizer 50kg","category":"fertilizer","price":2800,"unit":"bag","seller":"FarmPlus Kenya","location":"Eldoret","rating":4.6,"in_stock":True,"description":"Calcium Ammonium Nitrate — perfect for top-dressing maize at knee-height."},
    {"id":"3","name":"Emaverde FAW Pesticide 100ml","category":"pesticide","price":650,"unit":"bottle","seller":"CropCare Kisumu","location":"Kisumu","rating":4.9,"in_stock":True,"description":"Controls Fall Armyworm. Apply at early instar stage. Wear gloves."},
    {"id":"4","name":"H614D Maize Seed 2kg","category":"seed","price":480,"unit":"packet","seller":"Kenya Seed Company","location":"Kitale","rating":4.7,"in_stock":True,"description":"High-yield hybrid. Drought-tolerant. 90-day maturity."},
    {"id":"5","name":"Ridomil Gold Fungicide 100g","category":"pesticide","price":900,"unit":"sachet","seller":"AgroServe Nakuru","location":"Nakuru","rating":4.5,"in_stock":False,"description":"Systemic fungicide — controls late blight in tomatoes and potatoes."},
    {"id":"6","name":"Knapsack Sprayer 16L","category":"equipment","price":2100,"unit":"piece","seller":"FarmTools Kenya","location":"Nairobi","rating":4.3,"in_stock":True,"description":"Durable backpack sprayer. Adjustable nozzle. Suitable for all agrochemicals."},
    {"id":"7","name":"Movento Insecticide 100ml","category":"pesticide","price":1100,"unit":"bottle","seller":"AgroServe Nakuru","location":"Nakuru","rating":4.6,"in_stock":True,"description":"Systemic control of aphids and whiteflies. Safe on beneficial insects."},
    {"id":"8","name":"Garlic Bulbs 1kg (Seed)","category":"seed","price":380,"unit":"kg","seller":"HortKenya Meru","location":"Meru","rating":4.4,"in_stock":True,"description":"Premium garlic seed bulbs. High yield variety suited for central Kenya highlands."},
]

@router.get("/", response_model=List[Product])
async def get_products(category: Optional[str] = Query(None), search: Optional[str] = Query(None)):
    results = PRODUCTS
    if category:
        results = [p for p in results if p["category"] == category]
    if search:
        q = search.lower()
        results = [p for p in results if q in p["name"].lower() or q in p["description"].lower()]
    return [Product(**p) for p in results]

@router.get("/categories")
async def categories():
    return ["fertilizer", "pesticide", "seed", "equipment"]
