# DSR Show Content Calendar Script
# Part of Show Operations (SK-13)

import json
from datetime import datetime, timedelta

class ShowContentCalendar:
    def __init__(self, show_date, city, venue):
        self.show_date = datetime.strptime(show_date, "%Y-%m-%d")
        self.city = city
        self.venue = venue

    def generate_calendar(self):
        """
        Generates the 8-week content calendar for a show.
        """
        
        calendar = []
        
        # 8 Weeks: Announcement
        calendar.append({
            "date": (self.show_date - timedelta(weeks=8)).strftime("%Y-%m-%d"),
            "focus": "Announcement",
            "asset": "Official tour flyer / show poster"
        })
        
        # 6 Weeks: On-Sale Launch
        calendar.append({
            "date": (self.show_date - timedelta(weeks=6)).strftime("%Y-%m-%d"),
            "focus": "On-Sale Launch",
            "asset": "Motion graphic / video teaser"
        })
        
        # 4 Weeks: Maintenance
        calendar.append({
            "date": (self.show_date - timedelta(weeks=4)).strftime("%Y-%m-%d"),
            "focus": "Maintenance",
            "asset": "Live show clip / recent release video"
        })
        
        # 2 Weeks: Final Push
        calendar.append({
            "date": (self.show_date - timedelta(weeks=2)).strftime("%Y-%m-%d"),
            "focus": "Final Push",
            "asset": "Urgency graphic / 'Low Ticket' alert"
        })
        
        # Show Week: Day-Of
        calendar.append({
            "date": self.show_date.strftime("%Y-%m-%d"),
            "focus": "Day-Of",
            "asset": "Set times / venue info / travel story"
        })
        
        return {
            "show": f"{self.city} {self.show_date.strftime('%Y-%m-%d')}",
            "calendar": calendar
        }

if __name__ == "__main__":
    # Example usage
    calendar = ShowContentCalendar("2026-04-12", "Tampa, FL", "The Ritz")
    result = calendar.generate_calendar()
    print(json.dumps(result, indent=4))
