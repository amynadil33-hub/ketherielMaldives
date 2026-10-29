"""Maldives AI Retail Concierge - FastAPI backend.

Primary role: AI concierge endpoints (Claude Sonnet 4.5 via Emergent LLM key)
+ lightweight order/sourcing storage in MongoDB so the demo works before
Supabase is wired up.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, json, re, uuid, logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

try:
    from .commerce import router as commerce_router, require_admin, get_db
except ImportError:
    from commerce import router as commerce_router, require_admin, get_db

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

client = AsyncIOMotorClient(MONGO_URL) if MONGO_URL and DB_NAME else None
db = client[DB_NAME] if client is not None else None

app = FastAPI(title="Maldives AI Retail Concierge")
app.state.db = db
api = APIRouter(prefix="/api")

@app.middleware("http")
async def private_api_responses(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response

# ---------- helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_id() -> str:
    return str(uuid.uuid4())

CONCIERGE_SYSTEM = """You are the Kether Madlives AI concierge — the friendly shopping concierge for a premium Maldives retail platform.
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
    from emergentintegrations.llm.chat import LlmChat, UserMessage

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
        return "AI is temporarily unavailable. Please contact support."

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

# ---------- routes: AI ----------
@api.get("/")
async def root():
    return {"service": "maldives-concierge", "status": "ok", "time": now_iso()}

@api.post("/ai/chat")
async def ai_chat(req: ChatRequest, db=Depends(get_db)):
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
async def ai_product_description(req: DescGenRequest, _admin=Depends(require_admin)):
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
async def create_sourcing(req: SourcingRequest, db=Depends(get_db)):
    doc = req.model_dump()
    doc["id"] = new_id()
    doc["status"] = "new"
    doc["created_at"] = now_iso()
    await db.sourcing_requests.insert_one(doc)
    return {"id": doc["id"], "status": "new"}

@api.get("/sourcing-requests")
async def list_sourcing(_admin=Depends(require_admin), db=Depends(get_db)):
    rows = await db.sourcing_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return rows

app.include_router(api)
app.include_router(commerce_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=[origin.strip() for origin in os.environ.get("CORS_ORIGINS", "").split(",") if origin.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

@app.on_event("shutdown")
async def shutdown():
    if client is not None:
        client.close()
