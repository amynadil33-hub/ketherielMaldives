"""Maldives AI Retail Concierge - FastAPI backend.

Primary role: AI concierge endpoints (Claude Sonnet 4.5 via Emergent LLM key)
+ lightweight order/sourcing storage in MongoDB so the demo works before
Supabase is wired up.
"""
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, json, re, uuid, logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Maldives AI Retail Concierge")
api = APIRouter(prefix="/api")

# ---------- helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_id() -> str:
    return str(uuid.uuid4())

def order_number() -> str:
    return "MV" + datetime.now(timezone.utc).strftime("%y%m%d") + uuid.uuid4().hex[:5].upper()

CONCIERGE_SYSTEM = """You are the Ketheriel Maldives AI concierge — the friendly shopping concierge for a premium Maldives retail platform.
Your job is to help Maldivian customers shop authentic branded products sourced from India and global markets.
Tone: warm, premium, concise, helpful. Use simple English. Add a touch of local flavour but never overdo it.

Key facts you must know:
- Prices are shown in MVR (Maldivian Rufiyaa).
- Pre-order means we source from India and deliver to the customer's island.
- Standard delivery: 7-14 days to Male, +1-5 extra days to outer islands (Addu, Fuvahmulah, Kulhudhuffushi, Thinadhoo, etc).
- Payment methods: BML transfer, MIB transfer, Ooredoo m-Faisaa, Dhiraagu Pay, slip upload, cash on pickup (ready stock only).
- WhatsApp support: +960 791-2865.
- Categories: Garments, Cosmetics, Electronics, Gaming, Shoes, Musical, Sports.

Rules:
- Never promise an exact delivery date — give a range.
- Never claim official brand partnership.
- For specific product/availability/price confirmation, tell the customer the admin will confirm via WhatsApp.
- Keep replies under 120 words unless asked for detail.
"""

async def claude_chat(session_id: str, system: str, user_text: str) -> str:
    """Single-turn Claude Sonnet 4.5 call. Returns raw text."""
    if not EMERGENT_LLM_KEY:
        return "AI is not configured. Please set EMERGENT_LLM_KEY."
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    try:
        resp = await chat.send_message(UserMessage(text=user_text))
        # SDK may return either string or object with .text
        if isinstance(resp, str):
            return resp
        return getattr(resp, "text", str(resp))
    except Exception as exc:
        logging.exception("claude_chat failed")
        return f"(AI temporarily unavailable: {exc})"

# ---------- models ----------
class ChatRequest(BaseModel):
    session_id: str
    message: str
    context: Optional[Dict[str, Any]] = None

class FindItRequest(BaseModel):
    product_url: Optional[str] = None
    description: Optional[str] = None
    budget_mvr: Optional[float] = None
    quantity: int = 1
    island: Optional[str] = None

class SourcingRequest(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    island: str
    atoll: Optional[str] = None
    product_url: Optional[str] = None
    uploaded_image_url: Optional[str] = None
    product_description: Optional[str] = None
    budget_mvr: Optional[float] = None
    quantity: int = 1
    notes: Optional[str] = None

class OrderItem(BaseModel):
    product_id: str
    title: str
    sku: Optional[str] = None
    quantity: int = 1
    price_mvr: float
    variant: Optional[str] = None
    main_image_url: Optional[str] = None
    product_type: Optional[str] = "preorder"

class OrderPayload(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    island: str
    atoll: Optional[str] = None
    address_line: str
    notes: Optional[str] = None
    payment_method: str
    items: List[OrderItem]
    subtotal_mvr: float
    delivery_fee_mvr: float
    discount_mvr: float = 0
    total_mvr: float
    estimated_delivery_min_days: int = 7
    estimated_delivery_max_days: int = 14

# ---------- routes: AI ----------
@api.get("/")
async def root():
    return {"service": "maldives-concierge", "status": "ok", "time": now_iso()}

@api.post("/ai/chat")
async def ai_chat(req: ChatRequest):
    ctx = ""
    if req.context:
        ctx = f"\n\nContext: {json.dumps(req.context)[:600]}"
    reply = await claude_chat(req.session_id, CONCIERGE_SYSTEM, req.message + ctx)
    # log interaction
    await db.ai_interactions.insert_one({
        "id": new_id(),
        "session_id": req.session_id,
        "interaction_type": "chat",
        "prompt": req.message,
        "response": reply,
        "created_at": now_iso(),
    })
    return {"reply": reply}

@api.post("/ai/find-it-for-me")
async def ai_find_it_for_me(req: FindItRequest):
    prompt = f"""A Maldives customer wants this item sourced. Generate a draft quote ONLY in valid JSON with keys:
detected_product_name, brand, category, estimated_source_price_inr, suggested_price_mvr, estimated_delivery_min_days, estimated_delivery_max_days, sourcing_notes, missing_info.

If the price is in INR, assume rough conversion 1 INR ≈ 0.18 MVR and add 35% margin + delivery to compute suggested_price_mvr.
For delivery: India sourcing 7-12 days + island extra days (Male=0, Addu/Fuvahmulah/outer=+3-5).

Input:
- product_url: {req.product_url or 'none'}
- description: {req.description or 'none'}
- customer_budget_mvr: {req.budget_mvr or 'unspecified'}
- quantity: {req.quantity}
- island: {req.island or 'Male'}

Respond with ONLY the JSON object, no preface."""
    reply = await claude_chat(f"find-it-{new_id()[:8]}", "You are a sourcing analyst for a Maldives concierge. Output strict JSON.", prompt)
    # try parse JSON
    parsed = None
    try:
        m = re.search(r"\{[\s\S]*\}", reply)
        if m:
            parsed = json.loads(m.group(0))
    except Exception:
        parsed = None
    return {"raw": reply, "draft": parsed}

class DescGenRequest(BaseModel):
    raw_text: str
    brand: Optional[str] = None
    category: Optional[str] = None

@api.post("/ai/product-description")
async def ai_product_description(req: DescGenRequest):
    prompt = f"""Rewrite this supplier text as premium but simple Maldives store copy.
Brand: {req.brand or 'unknown'}, Category: {req.category or 'unknown'}
Return JSON with keys: title, short_description (max 18 words), description (2-3 short paragraphs), tags (array of 5-8 SEO tags), badges (array).
Use 'India pre-order' badge if not ready stock. Mention island delivery softly.

Supplier text:
{req.raw_text[:1500]}

Return ONLY JSON."""
    reply = await claude_chat(f"desc-{new_id()[:8]}", "You are a premium e-commerce copywriter. Output strict JSON.", prompt)
    parsed = None
    try:
        m = re.search(r"\{[\s\S]*\}", reply)
        if m:
            parsed = json.loads(m.group(0))
    except Exception:
        parsed = None
    return {"raw": reply, "result": parsed}

class CompareRequest(BaseModel):
    products: List[Dict[str, Any]]
    question: Optional[str] = None

@api.post("/ai/compare")
async def ai_compare(req: CompareRequest):
    listing = "\n".join([f"- {p.get('title')} | MVR {p.get('price_mvr')} | {p.get('brand')} | {json.dumps(p.get('specifications') or {})}" for p in req.products])
    prompt = f"""Compare these products for a Maldives shopper. Be brief and practical.
{listing}

Question: {req.question or 'Which one should I buy and why?'}
Reply in 3 short bullet points, then a final recommendation."""
    reply = await claude_chat(f"cmp-{new_id()[:8]}", CONCIERGE_SYSTEM, prompt)
    return {"reply": reply}

# ---------- routes: sourcing & orders ----------
@api.post("/sourcing-requests")
async def create_sourcing(req: SourcingRequest):
    doc = req.model_dump()
    doc["id"] = new_id()
    doc["status"] = "new"
    doc["created_at"] = now_iso()
    await db.sourcing_requests.insert_one(doc)
    return {"id": doc["id"], "status": "new"}

@api.get("/sourcing-requests")
async def list_sourcing():
    rows = await db.sourcing_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return rows

@api.post("/orders")
async def create_order(payload: OrderPayload):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["order_number"] = order_number()
    doc["payment_status"] = "pending"
    doc["fulfillment_status"] = "order_placed"
    doc["created_at"] = now_iso()
    doc["updated_at"] = now_iso()
    await db.orders.insert_one(doc)
    return {"id": doc["id"], "order_number": doc["order_number"], "status": "order_placed"}

@api.get("/orders/{order_number}")
async def get_order(order_number: str):
    row = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Order not found")
    return row

@api.get("/orders")
async def list_orders():
    rows = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return rows

class OrderStatusUpdate(BaseModel):
    fulfillment_status: str

@api.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, body: OrderStatusUpdate):
    res = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"fulfillment_status": body.fulfillment_status, "updated_at": now_iso()}}
    )
    if not res.matched_count:
        raise HTTPException(404, "Order not found")
    return {"ok": True}

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

@app.on_event("shutdown")
async def shutdown():
    client.close()
