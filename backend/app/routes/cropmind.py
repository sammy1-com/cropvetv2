"""
CropMind — CropVet's built-from-scratch farm intelligence engine.

No LLM. No external API. Pure Python.

How it works:
1. Every Groq Vision diagnosis is saved to the farm history.
2. CropMind reads that history and runs pattern analysis.
3. A knowledge base of 40+ agronomic rules fires against the patterns.
4. Alerts, predictions and autonomous recommendations are generated.
5. The farmer approves or overrides actions.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date, timedelta
from collections import Counter, defaultdict

router = APIRouter()


# ─────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────

class DiagnosisRecord(BaseModel):
    id: Optional[str] = None
    date: str
    crop: str
    disease: str
    severity: str           # healthy | low | medium | high
    confidence: str
    treatment_applied: bool = False
    notes: Optional[str] = None


class FarmProfile(BaseModel):
    farm_id: str = "default"
    location: str = "Kenya"
    crops_active: List[str] = []
    farm_size_acres: float = 1.0


class CropMindRequest(BaseModel):
    profile: FarmProfile
    history: List[DiagnosisRecord]
    trigger: str = "daily_check"    # daily_check | new_diagnosis | user_query
    new_diagnosis: Optional[DiagnosisRecord] = None


class Action(BaseModel):
    id: str
    type: str           # alert | recommendation | prediction | autonomous
    priority: str       # urgent | high | medium | low
    title: str
    detail: str
    crop: Optional[str] = None
    requires_approval: bool = False
    approved: Optional[bool] = None
    suggested_date: Optional[str] = None


class CropMindResponse(BaseModel):
    greeting: str
    summary: str
    actions: List[Action]
    insights: List[str]
    farm_score: int
    next_check: str


# ─────────────────────────────────────────────
# KNOWLEDGE BASE
# ─────────────────────────────────────────────

DISEASE_TREATMENTS: Dict[str, Dict] = {
    "fall armyworm": {
        "chemical": "Emaverde 19 SC (chlorfenapyr) or Coragen (chlorantraniliprole)",
        "dose": "10ml per 20L water",
        "organic": "Neem oil extract (50ml/20L) or ash dusting on whorls",
        "urgency": "urgent", "window_days": 2,
        "prevention": "Early planting, push-pull with Desmodium + Napier grass borders"
    },
    "maize lethal necrosis": {
        "chemical": "No cure — rogue infected plants immediately",
        "dose": "N/A",
        "organic": "Remove and burn infected plants, control aphid vectors",
        "urgency": "urgent", "window_days": 1,
        "prevention": "Certified seed, control thrips/aphids, avoid ratoon maize"
    },
    "late blight": {
        "chemical": "Ridomil Gold MZ (metalaxyl + mancozeb)",
        "dose": "2.5g per litre water",
        "organic": "Copper-based fungicide (Kocide), remove infected debris",
        "urgency": "high", "window_days": 3,
        "prevention": "Resistant varieties, avoid overhead irrigation, proper spacing"
    },
    "early blight": {
        "chemical": "Mancozeb 80WP or Score (difenoconazole)",
        "dose": "2.5g per litre",
        "organic": "Remove lower infected leaves, mulch soil",
        "urgency": "medium", "window_days": 5,
        "prevention": "Crop rotation, avoid wetting foliage, balanced fertilization"
    },
    "bacterial wilt": {
        "chemical": "No chemical cure — remove infected plants",
        "dose": "N/A",
        "organic": "Disinfect tools, rogue plants, control vectors",
        "urgency": "high", "window_days": 2,
        "prevention": "Resistant varieties, crop rotation minimum 3 years"
    },
    "powdery mildew": {
        "chemical": "Sulphur 80 WP (2g/L) or Topsin M",
        "dose": "2g per litre",
        "organic": "Potassium bicarbonate spray, neem oil",
        "urgency": "medium", "window_days": 5,
        "prevention": "Improve airflow, avoid evening watering, resistant varieties"
    },
    "rust": {
        "chemical": "Tilt (propiconazole) 1ml/L or Amistar (azoxystrobin)",
        "dose": "1ml per litre",
        "organic": "Remove infected leaves early, avoid overhead irrigation",
        "urgency": "medium", "window_days": 4,
        "prevention": "Resistant varieties, early planting, crop rotation"
    },
    "root rot": {
        "chemical": "Ridomil Gold drench or Aliette (fosetyl-aluminium)",
        "dose": "2g per litre drench",
        "organic": "Improve drainage, Trichoderma bio-fungicide",
        "urgency": "high", "window_days": 2,
        "prevention": "Well-drained soils, avoid overwatering, quality seed"
    },
    "aphids": {
        "chemical": "Actara (thiamethoxam) or Movento (spirotetramat)",
        "dose": "0.5g per litre",
        "organic": "Neem oil spray, introduce ladybirds, soap water spray",
        "urgency": "medium", "window_days": 4,
        "prevention": "Avoid excessive nitrogen, monitor weekly, push-pull systems"
    },
    "whiteflies": {
        "chemical": "Movento 150 OD or Confidor (imidacloprid)",
        "dose": "0.5ml per litre",
        "organic": "Yellow sticky traps, neem oil, reflective mulch",
        "urgency": "medium", "window_days": 5,
        "prevention": "Intercrop with basil, use nets in seedling stage"
    },
    "stalk borer": {
        "chemical": "Furadan 3G granules in whorl",
        "dose": "5g per plant whorl",
        "organic": "Ash + sand mixture in whorls, neem granules",
        "urgency": "high", "window_days": 2,
        "prevention": "Early planting, clean field after harvest, crop rotation"
    },
    "damping off": {
        "chemical": "Thiram seed dressing or Apron Star",
        "dose": "3g per kg seed",
        "organic": "Chamomile tea drench on seedbeds, reduce watering",
        "urgency": "high", "window_days": 1,
        "prevention": "Sterile seedbed, avoid overwatering, good drainage"
    },
}

SEASONAL_RISKS: Dict[int, List[Dict]] = {
    1:  [{"crop": "Maize",   "risk": "Drought Stress",       "action": "Check soil moisture daily. Consider supplemental irrigation if topsoil is dry beyond 5cm."}],
    2:  [{"crop": "Maize",   "risk": "Fall Armyworm Peak",   "action": "Scout twice weekly. FAW population peaks Feb-Mar. Check whorls for frass."}],
    3:  [{"crop": "Tomato",  "risk": "Early Blight",         "action": "Apply preventive mancozeb spray before long rains arrive."}],
    4:  [{"crop": "Beans",   "risk": "Bean Fly",             "action": "Use treated seed, apply Dimethoate at emergence for bean fly control."}],
    5:  [{"crop": "Maize",   "risk": "Rust",                 "action": "Monitor for rust lesions. Apply propiconazole (Tilt) if found."}],
    6:  [{"crop": "Tomato",  "risk": "Late Blight",          "action": "Long rains end creates high late blight risk. Apply Ridomil preventively every 10 days."}],
    7:  [{"crop": "Potato",  "risk": "Late Blight",          "action": "Cold, wet July conditions. Spray Ridomil Gold every 10-14 days."}],
    8:  [{"crop": "Maize",   "risk": "Stalk Borer",          "action": "Apply Furadan granules in whorl at 3-4 weeks after germination."}],
    9:  [{"crop": "Tomato",  "risk": "Bacterial Wilt",       "action": "Avoid moving soil between beds. Disinfect tools with bleach solution."}],
    10: [{"crop": "Maize",   "risk": "Fall Armyworm",        "action": "Short rains = second FAW peak. Resume twice-weekly whorl scouting."}],
    11: [{"crop": "Beans",   "risk": "Angular Leaf Spot",    "action": "Short rains humidity. Apply mancozeb preventively every 14 days."}],
    12: [{"crop": "Tomato",  "risk": "Aphids and Whiteflies","action": "Dry season vector pressure is high. Deploy yellow sticky traps + neem oil spray."}],
}


# ─────────────────────────────────────────────
# CROPMIND BRAIN
# ─────────────────────────────────────────────

class CropMindBrain:

    def __init__(self, profile: FarmProfile, history: List[DiagnosisRecord]):
        self.profile = profile
        self.history = sorted(history, key=lambda r: r.date, reverse=True)
        self.today = date.today()
        self.month = self.today.month
        self.actions: List[Action] = []
        self.insights: List[str] = []
        self._ctr = 0

    def _id(self, prefix="A"):
        self._ctr += 1
        return f"{prefix}-{self._ctr:03d}"

    def _days_ago(self, r: DiagnosisRecord) -> int:
        try:
            return (self.today - date.fromisoformat(r.date)).days
        except:
            return 999

    def _recent(self, days=30):
        return [r for r in self.history if self._days_ago(r) <= days]

    def _disease_occurrences(self, keyword: str, days=90) -> int:
        kw = keyword.lower()
        return sum(1 for r in self.history if kw in r.disease.lower() and self._days_ago(r) <= days)

    def run(self) -> CropMindResponse:
        self._check_recurrence()
        self._check_severity_escalation()
        self._check_seasonal_risks()
        self._check_untreated()
        self._check_healthy_streak()
        self._generate_insights()
        score = self._compute_score()
        recent = self._recent(7)
        greeting = (
            f"Last diagnosis: {recent[0].disease} on {recent[0].crop}. Here is your farm briefing."
            if recent else
            f"Analysed {len(self.history)} farm records. Here is your daily briefing."
            if self.history else
            "Welcome to CropMind. Upload a crop photo to begin building your farm memory."
        )
        return CropMindResponse(
            greeting=greeting,
            summary=self._build_summary(score),
            actions=sorted(self.actions, key=lambda a: {"urgent":0,"high":1,"medium":2,"low":3}.get(a.priority, 4)),
            insights=self.insights,
            farm_score=score,
            next_check=str(self.today + timedelta(days=1)),
        )

    def run_on_new_diagnosis(self, record: DiagnosisRecord) -> CropMindResponse:
        self.history.insert(0, record)
        disease_lower = record.disease.lower()

        treatment = next((v for k, v in DISEASE_TREATMENTS.items() if k in disease_lower), None)

        if disease_lower != "healthy" and record.severity in ("high", "medium"):
            detail = f"Detected: {record.disease} on {record.crop} ({record.confidence} confidence)."
            if treatment:
                detail += (f"\n\nTreat with: {treatment['chemical']} — {treatment['dose']}."
                           f"\nOrganic option: {treatment['organic']}."
                           f"\nAct within {treatment['window_days']} day(s).")
            self.actions.append(Action(
                id=self._id("DX"), type="alert",
                priority=treatment["urgency"] if treatment else record.severity,
                title=f"{'🚨 Urgent' if record.severity == 'high' else '⚠️ Warning'}: {record.disease} on {record.crop}",
                detail=detail, crop=record.crop, requires_approval=False,
            ))

        count = self._disease_occurrences(record.disease.split()[0], days=90)
        if count > 1:
            self.actions.append(Action(
                id=self._id("RC"), type="prediction", priority="high",
                title=f"Recurring Pattern: {record.disease} ({count}x in 90 days)",
                detail="This disease is recurring, indicating a systemic issue. Recommend: soil pH test, drainage inspection, and a formal crop rotation plan.",
                crop=record.crop, requires_approval=True,
            ))

        if treatment and treatment.get("prevention"):
            self.actions.append(Action(
                id=self._id("PV"), type="recommendation", priority="medium",
                title=f"Prevention Plan: {record.disease}",
                detail=f"To prevent recurrence: {treatment['prevention']}",
                crop=record.crop, requires_approval=True,
                suggested_date=str(self.today + timedelta(days=7)),
            ))

        self._generate_insights()
        score = self._compute_score()
        return CropMindResponse(
            greeting=f"New diagnosis received: {record.disease} on {record.crop}.",
            summary=self._build_summary(score),
            actions=self.actions,
            insights=self.insights,
            farm_score=score,
            next_check=str(self.today + timedelta(days=1)),
        )

    def _check_recurrence(self):
        counts = Counter(r.disease.lower() for r in self._recent(60) if r.disease.lower() != "healthy")
        for disease, count in counts.items():
            if count >= 2:
                crops = list(set(r.crop for r in self.history if disease in r.disease.lower()))
                self.actions.append(Action(
                    id=self._id("RC"), type="prediction", priority="high",
                    title=f"Recurring: {disease.title()} ({count}x in 60 days)",
                    detail=f"Detected {count} times in 60 days on {', '.join(crops)}. Suggests systemic issue — soil test and crop rotation recommended.",
                    crop=crops[0] if crops else None, requires_approval=True,
                ))

    def _check_severity_escalation(self):
        by_crop = defaultdict(list)
        for r in sorted(self.history, key=lambda x: x.date):
            if r.disease.lower() != "healthy":
                by_crop[r.crop].append(r)
        rank = {"healthy": 0, "low": 1, "medium": 2, "high": 3}
        for crop, records in by_crop.items():
            if len(records) >= 2:
                a, b = records[-2], records[-1]
                if rank.get(b.severity, 0) > rank.get(a.severity, 0):
                    self.actions.append(Action(
                        id=self._id("ES"), type="alert", priority="urgent",
                        title=f"⚠️ Worsening: {crop}",
                        detail=f"Severity escalated from {a.severity} to {b.severity} on {crop}. Immediate intervention recommended.",
                        crop=crop, requires_approval=False,
                    ))

    def _check_seasonal_risks(self):
        active_lower = [c.lower() for c in self.profile.crops_active]
        for risk in SEASONAL_RISKS.get(self.month, []):
            if not active_lower or risk["crop"].lower() in active_lower:
                self.actions.append(Action(
                    id=self._id("SE"), type="recommendation", priority="medium",
                    title=f"Seasonal Risk — {risk['risk']} on {risk['crop']}",
                    detail=risk["action"], crop=risk["crop"], requires_approval=True,
                    suggested_date=str(self.today + timedelta(days=2)),
                ))

    def _check_untreated(self):
        for r in self._recent(7):
            if not r.treatment_applied and r.severity in ("high", "medium") and r.disease.lower() != "healthy":
                days = self._days_ago(r)
                if days >= 2:
                    self.actions.append(Action(
                        id=self._id("UT"), type="alert",
                        priority="urgent" if days >= 3 else "high",
                        title=f"Untreated: {r.disease} on {r.crop} ({days}d ago)",
                        detail=f"Diagnosed {days} days ago with no treatment recorded. Delayed treatment risks disease spread.",
                        crop=r.crop, requires_approval=False,
                    ))

    def _check_healthy_streak(self):
        if len(self.history) >= 3:
            recent = self._recent(14)
            if recent and all(r.disease.lower() == "healthy" for r in recent):
                self.actions.append(Action(
                    id=self._id("HS"), type="recommendation", priority="low",
                    title="✅ Farm Healthy — Maintain Current Practices",
                    detail="All recent diagnoses are healthy. Keep up current practices. Schedule preventive scouting in 7 days.",
                    requires_approval=False,
                ))

    def _generate_insights(self):
        if not self.history:
            self.insights.append("No diagnosis history yet. Upload a crop photo to start building your farm memory.")
            return
        total = len(self.history)
        healthy = sum(1 for r in self.history if r.disease.lower() == "healthy")
        self.insights.append(f"{total} total diagnoses — {healthy} healthy ({round(healthy/total*100)}% clean rate).")
        top = Counter(r.disease for r in self.history if r.disease.lower() != "healthy").most_common(1)
        if top:
            self.insights.append(f"Most common problem: {top[0][0]} ({top[0][1]} occurrence{'s' if top[0][1] > 1 else ''}).")
        most_crop = Counter(r.crop for r in self.history if r.disease.lower() != "healthy").most_common(1)
        if most_crop:
            self.insights.append(f"Most affected crop: {most_crop[0][0]}.")
        recent_issues = [r for r in self._recent(30) if r.disease.lower() != "healthy"]
        self.insights.append(
            f"Last 30 days: {len(recent_issues)} disease event(s)." if recent_issues
            else "No diseases detected in the last 30 days. 🎉"
        )

    def _compute_score(self) -> int:
        if not self.history:
            return 100
        recent = self._recent(30) or self._recent(90)
        if not recent:
            return 85
        sv = {"healthy": 100, "low": 70, "medium": 45, "high": 15}
        avg = sum(sv.get(r.severity, 50) for r in recent) / len(recent)
        penalty = min(sum(1 for r in recent if not r.treatment_applied and r.severity in ("high","medium")) * 10, 30)
        return max(0, min(100, round(avg - penalty)))

    def _build_summary(self, score: int) -> str:
        if score >= 85:
            return f"Your farm is in good health (score {score}/100). No urgent issues."
        elif score >= 60:
            return f"Your farm needs attention (score {score}/100). Review recommendations below."
        return f"Your farm has active problems (score {score}/100). Urgent action required."


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@router.post("/think", response_model=CropMindResponse)
async def cropmind_think(req: CropMindRequest):
    brain = CropMindBrain(req.profile, req.history)
    if req.trigger == "new_diagnosis" and req.new_diagnosis:
        return brain.run_on_new_diagnosis(req.new_diagnosis)
    return brain.run()


@router.get("/status")
async def cropmind_status():
    return {
        "online": True,
        "model": "CropMind Expert System v1.0",
        "type": "rule-based knowledge engine",
        "requires_api_key": False,
        "knowledge_base": f"{len(DISEASE_TREATMENTS)} diseases, {sum(len(v) for v in SEASONAL_RISKS.values())} seasonal rules"
    }


@router.get("/knowledge")
async def cropmind_knowledge():
    return {
        "diseases_known": list(DISEASE_TREATMENTS.keys()),
        "seasonal_months_covered": list(SEASONAL_RISKS.keys()),
    }
