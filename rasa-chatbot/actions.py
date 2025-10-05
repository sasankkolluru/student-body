from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

class ActionGetStudentBodyInfo(Action):
    def name(self) -> Text:
        return "action_get_student_body_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        student_body = tracker.get_slot("student_body")
        
        if student_body:
            student_body = student_body.lower()
            
            if "sac" in student_body or "student activities council" in student_body:
                response = "SAC (Student Activities Council) is the umbrella body that coordinates all student-led initiatives and events. It has 8 verticals: Culturals, Literary, Fine Arts, Public Relations, Technical Design, Logistics, Stage Management, and Photography. I can tell you about any specific vertical!"
            elif "entrepreneurship" in student_body:
                response = "The Entrepreneurship Cell at Vignan University fosters innovation, startup culture, and business acumen among students. It offers startup incubation programs, business plan competitions, industry expert sessions, funding and investment guidance, and innovation challenges."
            elif "sports" in student_body:
                response = "The Vignan Sports Contingent is the premier sports organization that promotes athletics and physical fitness among students. It organizes inter-college tournaments, training sessions for various sports, annual sports meets, and represents the university in external competitions."
            elif "ncc" in student_body:
                response = "NCC (National Cadet Corps) at Vignan University is a military-style training program that instills discipline, patriotism, and leadership qualities in students. It offers military drills and training, community service projects, leadership development programs, national integration camps, and disaster relief activities."
            elif "nss" in student_body:
                response = "NSS (National Service Scheme) at Vignan University is a community service program that encourages social responsibility and rural outreach among students. It organizes rural development projects, health and hygiene awareness campaigns, environmental conservation initiatives, literacy and education programs, and disaster relief activities."
            elif "anti-ragging" in student_body:
                response = "The Anti-Ragging Committee at Vignan University is a dedicated committee that ensures student safety and maintains a welcoming, inclusive environment for all students. It monitors campus for ragging incidents, conducts awareness programs, provides counseling and support, and maintains strict anti-ragging policies."
            else:
                response = "I can tell you about SAC (Student Activities Council), Entrepreneurship Cell, Vignan Sports Contingent, Anti-Ragging Committee, NCC (National Cadet Corps), and NSS (National Service Scheme). Which one interests you?"
        else:
            response = "Here are the main student bodies at Vignan University:\n\n• SAC (Student Activities Council)\n• Entrepreneurship Cell\n• Vignan Sports Contingent\n• Anti-Ragging Committee\n• NCC (National Cadet Corps)\n• NSS (National Service Scheme)\n\nYou can ask about specific ones for more details!"

        dispatcher.utter_message(text=response)
        return []

class ActionGetVerticalInfo(Action):
    def name(self) -> Text:
        return "action_get_vertical_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        vertical = tracker.get_slot("vertical")
        
        if vertical:
            vertical = vertical.lower()
            
            if "culturals" in vertical or "cultural" in vertical:
                response = "The Culturals vertical in SAC focuses on Dance, Music & Theatre Arts - it's the creative soul of campus life! This vertical organizes dance performances, music concerts, theatre productions, cultural festivals, and talent showcases."
            elif "literary" in vertical:
                response = "The Literary vertical in SAC focuses on Readers, Writers & Orators - the intellectual and creative minds of campus. It organizes debate competitions, creative writing workshops, public speaking events, literary discussions and book clubs, poetry and storytelling sessions."
            elif "fine arts" in vertical:
                response = "The Fine Arts vertical in SAC focuses on Arts, Crafts & Ambience - creating visual beauty and artistic expression on campus. It organizes art exhibitions, craft workshops, design competitions, and campus decoration projects."
            elif "public relations" in vertical or "pr" in vertical:
                response = "The Public Relations & Digital Marketing vertical in SAC handles all communication, branding, and digital presence. It manages social media, creates promotional content, handles media relations, and develops marketing strategies for events."
            elif "technical" in vertical:
                response = "The Technical Design vertical in SAC focuses on creating technical solutions and innovative designs. It organizes technical competitions and hackathons, innovation challenges, prototype development, technical workshops and training, and research and development projects."
            elif "logistics" in vertical:
                response = "The Logistics vertical in SAC handles all event planning, resource management, and operational coordination. It manages venue bookings, equipment setup, transportation, catering, and ensures smooth execution of all campus events."
            elif "stage" in vertical:
                response = "The Stage Management vertical in SAC handles all technical aspects of performances and events. It manages sound systems, lighting, stage setup, technical rehearsals, and ensures professional quality presentations."
            elif "photography" in vertical:
                response = "The Photography vertical in SAC captures and documents all campus events and activities. It provides photography services, conducts workshops, organizes photo competitions, and maintains a visual record of campus life."
            else:
                response = "SAC has 8 main verticals: Culturals, Literary, Fine Arts, Public Relations, Technical Design, Logistics, Stage Management, and Photography. Which one would you like to know about?"
        else:
            response = "SAC has 8 main verticals:\n\n1. Culturals - Dance, Music & Theatre Arts\n2. Literary - Readers, Writers & Orators\n3. Fine Arts - Arts, Crafts & Ambience\n4. Public Relations & Digital Marketing\n5. Technical Design\n6. Logistics\n7. Stage Management\n8. Photography\n\nEach vertical focuses on specific skills and activities. Students can join any vertical based on their interests!"

        dispatcher.utter_message(text=response)
        return []

class ActionGetCampusSpotInfo(Action):
    def name(self) -> Text:
        return "action_get_campus_spot_info"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        campus_spot = tracker.get_slot("campus_spot")
        
        if campus_spot:
            campus_spot = campus_spot.lower()
            
            if "u block" in campus_spot:
                response = "U Block is one of the most recognizable landmarks on Vignan campus and serves as a central hub for student activities and gatherings. It's a symbol of student unity and campus spirit where students come together for meetings, discussions, cultural events, performances, study groups, and informal gatherings."
            elif "mhp canteen" in campus_spot or "canteen" in campus_spot:
                response = "MHP Canteen (Multi-Purpose Hall Canteen) is the heart of campus social life at Vignan University. It's where students gather for daily meals, refreshments, group discussions, debates, cultural exchange, networking, informal meetings, and relaxation."
            else:
                response = "Vignan University has several iconic spots including U Block and MHP Canteen. U Block is the central hub for student activities, while MHP Canteen is the heart of campus social life. Would you like to know about specific locations?"
        else:
            response = "Vignan University has several iconic spots including:\n\n• U Block - The central hub for student activities\n• MHP Canteen - Heart of campus social life\n• Various academic blocks and facilities\n\nWould you like to know about specific locations?"

        dispatcher.utter_message(text=response)
        return []
