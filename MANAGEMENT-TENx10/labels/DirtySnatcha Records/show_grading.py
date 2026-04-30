# DSR Show Grading Script
# Part of Booking Workflow (SK-08 & SK-09)

import json

class ShowGrading:
    def __init__(self, show_id, promoter_id, venue_id):
        self.show_id = show_id
        self.promoter_id = promoter_id
        self.venue_id = venue_id

    def grade_promoter(self, inputs):
        """
        Grades a promoter based on multiple inputs.
        """
        
        # Grading rubric (simulated)
        # Weights: Paid on time (30%), Marketing (20%), Rider (20%), Turnout (20%), Green Room (10%)
        
        score = 0
        if inputs.get("paid_on_time") == "Y": score += 30
        if inputs.get("marketing_delivered") == "Y": score += 20
        if inputs.get("rider_fulfilled") == "Full": score += 20
        elif inputs.get("rider_fulfilled") == "Partial": score += 10
        if inputs.get("turnout_vs_projection") == "Exceeded": score += 20
        elif inputs.get("turnout_vs_projection") == "Met": score += 15
        if inputs.get("green_room_delivered") == "Y": score += 10
        
        # Calculate grade
        grade = "F"
        if score >= 90: grade = "A"
        elif score >= 80: grade = "B"
        elif score >= 70: grade = "C"
        elif score >= 60: grade = "D"
        
        return {
            "show_id": self.show_id,
            "promoter_id": self.promoter_id,
            "score": score,
            "grade": grade
        }

    def grade_venue(self, inputs):
        """
        Grades a venue separately from the promoter.
        """
        
        # Grading rubric (simulated)
        # Weights: Production (30%), Sound (30%), Green Room (20%), Hospitality (20%)
        
        score = 0
        if inputs.get("production_quality") == "Excellent": score += 30
        elif inputs.get("production_quality") == "Good": score += 20
        if inputs.get("sound_system") == "Excellent": score += 30
        elif inputs.get("sound_system") == "Good": score += 20
        if inputs.get("green_room_quality") == "Excellent": score += 20
        elif inputs.get("green_room_quality") == "Good": score += 15
        if inputs.get("hospitality_delivery") == "Full": score += 20
        elif inputs.get("hospitality_delivery") == "Partial": score += 10
        
        # Calculate grade
        grade = "F"
        if score >= 90: grade = "A"
        elif score >= 80: grade = "B"
        elif score >= 70: grade = "C"
        elif score >= 60: grade = "D"
        
        return {
            "show_id": self.show_id,
            "venue_id": self.venue_id,
            "score": score,
            "grade": grade
        }

if __name__ == "__main__":
    # Example usage
    grading = ShowGrading("show_001", "promoter_001", "venue_001")
    promoter_inputs = {
        "paid_on_time": "Y",
        "marketing_delivered": "Y",
        "rider_fulfilled": "Full",
        "turnout_vs_projection": "Exceeded",
        "green_room_delivered": "Y"
    }
    venue_inputs = {
        "production_quality": "Excellent",
        "sound_system": "Excellent",
        "green_room_quality": "Excellent",
        "hospitality_delivery": "Full"
    }
    
    promoter_result = grading.grade_promoter(promoter_inputs)
    venue_result = grading.grade_venue(venue_inputs)
    
    print(json.dumps({"promoter": promoter_result, "venue": venue_result}, indent=4))
