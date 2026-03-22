from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

router = APIRouter()

class TimelineEvent(BaseModel):
    id: str
    date: str
    title: str
    description: str
    category: str
    crop: Optional[str] = None
    completed: bool = False
    urgent: bool = False

@router.get("/", response_model=List[TimelineEvent])
async def get_timeline():
    today = date.today()
    def d(offset): return str(today.replace(day=min(today.day + offset, 28)))
    return [
        TimelineEvent(id="1", date=str(today), title="Scout for Fall Armyworm", description="Check maize whorl for egg masses and early larvae. Act within 24hrs if found.", category="scouting", crop="Maize", urgent=True),
        TimelineEvent(id="2", date=str(today), title="Top-dress with CAN", description="Apply Calcium Ammonium Nitrate at 50kg/acre at knee-height stage.", category="fertilizing", crop="Maize"),
        TimelineEvent(id="3", date=d(3), title="Irrigate Tomatoes", description="Drip irrigate 45 mins. Check 15cm soil moisture first.", category="watering", crop="Tomato"),
        TimelineEvent(id="4", date=d(7), title="Prepare Nursery Bed", description="Mix topsoil + composted manure 3:1 ratio for kale seedlings.", category="planting", crop="Kale"),
        TimelineEvent(id="5", date=d(14), title="Harvest Beans", description="Pods should be dry and rattle when shaken. Harvest in the morning.", category="harvesting", crop="Beans"),
    ]

@router.patch("/{event_id}/complete")
async def complete_event(event_id: str):
    return {"id": event_id, "completed": True}
