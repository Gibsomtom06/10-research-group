# DSR Promo Team Points Calculation Script
# Part of Promo Team Management (SK-10)

import json
from datetime import datetime

class PromoTeamPoints:
    def __init__(self, member_id):
        self.member_id = member_id
        self.points_config = {
            "IG_STORY": 5,
            "IG_REEL": 15,
            "TIKTOK": 15,
            "X_POST": 5,
            "FB_SHARE": 5,
            "UGC_VIDEO": 25,
            "FLYERING": 20,
            "EVENT_ATTENDANCE": 30,
            "PLAYLIST_ADD": 10,
            "REFERRAL": 50
        }

    def calculate_points(self, completed_tasks):
        """
        Calculates monthly and lifetime points from a list of tasks.
        """
        monthly_points = 0
        lifetime_points = 0
        
        # Monthly reset with lifetime total preserved
        for task in completed_tasks:
            task_type = task.get("type")
            points = self.points_config.get(task_type, 0)
            
            # Check if task was completed this month
            task_date = datetime.strptime(task.get("date"), "%Y-%m-%d")
            if task_date.month == datetime.now().month:
                monthly_points += points
            
            lifetime_points += points
            
        return {
            "member_id": self.member_id,
            "monthly_points": monthly_points,
            "lifetime_points": lifetime_points
        }

if __name__ == "__main__":
    # Example usage
    tasks = [
        {"type": "IG_STORY", "date": "2026-02-25"},
        {"type": "TIKTOK", "date": "2026-02-27"},
        {"type": "UGC_VIDEO", "date": "2026-02-28"}
    ]
    
    calc = PromoTeamPoints("promo_member_001")
    result = calc.calculate_points(tasks)
    print(json.dumps(result, indent=4))
