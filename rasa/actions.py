import os
import requests
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher

API_BASE = os.environ.get("NODE_API_BASE", "http://localhost:4000/api")

class ActionGetActiveEvents(Action):
    def name(self) -> Text:
        return "action_get_active_events"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        try:
            r = requests.get(f"{API_BASE}/events/active", timeout=6)
            events = r.json() if r.status_code == 200 else []
            if not events:
                dispatcher.utter_message(text="No active events at the moment.")
                return []
            lines = ["**Current/Ongoing Events:**", ""]
            for i, e in enumerate(events, 1):
                when = f"{e.get('startAt','')}"
                if e.get('endAt'): when += f" – {e.get('endAt')}"
                location = f" @ {e.get('location')}" if e.get('location') else ''
                lines.append(f"{i}. **{e.get('title','Event')}** — {when}{location}")
            dispatcher.utter_message(text="\n".join(lines))
        except Exception:
            dispatcher.utter_message(text="Sorry, I couldn't fetch events right now.")
        return []

class ActionGetActivePolls(Action):
    def name(self) -> Text:
        return "action_get_active_polls"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        try:
            r = requests.get(f"{API_BASE}/polls", timeout=6, headers=_auth_header(tracker))
            polls = r.json() if r.status_code == 200 else []
            if not polls:
                dispatcher.utter_message(text="No active polls available right now.")
                return []
            lines = ["**Active Polls:**", ""]
            for i, p in enumerate(polls, 1):
                lines.append(f"{i}. **{p.get('title','Poll')}**")
                for j, opt in enumerate(p.get('options', []), 1):
                    roman = _to_roman(j)
                    lines.append(f"   {roman}. {opt.get('text','Option')}")
            dispatcher.utter_message(text="\n".join(lines))
        except Exception:
            dispatcher.utter_message(text="Sorry, I couldn't fetch polls right now.")
        return []

class ActionGetMyProfile(Action):
    def name(self) -> Text:
        return "action_get_my_profile"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        try:
            r = requests.get(f"{API_BASE}/me/profile", timeout=6, headers=_auth_header(tracker))
            if r.status_code != 200:
                dispatcher.utter_message(text="Profile not found or not logged in.")
                return []
            user = r.json().get('user', {})
            lines = [
                "**Your Profile**",
                "",
                f"Name: **{user.get('name','')}**",
                f"Email: {user.get('email','')}",
            ]
            for fld in ['regdNo','branch','stream','year']:
                val = user.get(fld)
                if val: lines.append(f"{fld}: {val}")
            dispatcher.utter_message(text="\n".join(lines))
        except Exception:
            dispatcher.utter_message(text="Sorry, I couldn't fetch your profile.")
        return []

class ActionGetMyIdeas(Action):
    def name(self) -> Text:
        return "action_get_my_ideas"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        try:
            r = requests.get(f"{API_BASE}/me/ideas", timeout=6, headers=_auth_header(tracker))
            items = r.json() if r.status_code == 200 else []
            if not items:
                dispatcher.utter_message(text="You have no idea submissions yet.")
                return []
            lines = ["**Your Idea Submissions:**", ""]
            for i, it in enumerate(items, 1):
                data = it.get('data', {})
                title = data.get('title') or data.get('ideaTitle') or 'Idea'
                status = data.get('status', 'submitted')
                lines.append(f"{i}. **{title}** — Status: {status}")
            dispatcher.utter_message(text="\n".join(lines))
        except Exception:
            dispatcher.utter_message(text="Sorry, I couldn't fetch your ideas.")
        return []

class ActionGetMyAchievements(Action):
    def name(self) -> Text:
        return "action_get_my_achievements"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        try:
            r = requests.get(f"{API_BASE}/me/achievements", timeout=6, headers=_auth_header(tracker))
            items = r.json() if r.status_code == 200 else []
            if not items:
                dispatcher.utter_message(text="No achievements submitted yet.")
                return []
            lines = ["**Your Achievements:**", ""]
            for i, a in enumerate(items, 1):
                when = a.get('dateOfParticipation','')
                title = a.get('eventName') or a.get('title') or 'Achievement'
                etype = a.get('eventType','')
                lines.append(f"{i}. **{title}** — {etype} {when}")
            dispatcher.utter_message(text="\n".join(lines))
        except Exception:
            dispatcher.utter_message(text="Sorry, I couldn't fetch your achievements.")
        return []

# Helpers

def _auth_header(tracker: Tracker) -> Dict[str, str]:
    token = _extract_token(tracker)
    return {"Authorization": f"Bearer {token}"} if token else {}

def _extract_token(tracker: Tracker) -> str:
    # Expect token in slot 'auth_token' or metadata (adjust as per your integration)
    token = (tracker.get_slot('auth_token') or '').strip()
    return token

def _to_roman(n: int) -> str:
    mapping = ['I','II','III','IV','V','VI','VII','VIII','IX','X']
    return mapping[n-1] if 1 <= n <= 10 else str(n)
