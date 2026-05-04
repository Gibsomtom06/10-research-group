# DSR Show Ad Copy Generation Script
# Part of Tour Marketing Execution (SK-16)

import json

class ShowAdCopy:
    def __init__(self, show_date, city, venue):
        self.show_date = show_date
        self.city = city
        self.venue = venue

    def generate_copy(self, phase):
        """
        Generates phase-specific ad copy for a show.
        """
        
        # Ad Copy Templates
        # Phase 2: On-Sale (Conversion)
        # Phase 3: Maintenance (Retargeting)
        # Phase 4: Final Push (Urgency)
        
        copy = {
            "Phase 2: On-Sale": f"DirtySnatcha is coming to {self.city}! Tickets for {self.venue} on {self.show_date} are ON SALE NOW. Get yours before they're gone! [Link]",
            "Phase 3: Maintenance": f"Don't miss DirtySnatcha at {self.venue} on {self.show_date}! Catch the bass in {self.city}. Tickets available here: [Link]",
            "Phase 4: Final Push": f"LAST CHANCE! DirtySnatcha at {self.venue} in {self.city} is almost SOLD OUT. Grab your tickets for {self.show_date} now! [Link]"
        }
        
        return {
            "show": f"{self.city} {self.show_date}",
            "phase": phase,
            "copy": copy.get(phase, "No copy available for this phase.")
        }

if __name__ == "__main__":
    # Example usage
    ad_copy = ShowAdCopy("2026-04-12", "Tampa, FL", "The Ritz")
    result = ad_copy.generate_copy("Phase 4: Final Push")
    print(json.dumps(result, indent=4))
