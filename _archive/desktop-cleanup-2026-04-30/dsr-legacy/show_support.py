# DSR Show Support Lookup Script
# Part of Show Operations (SK-20)

import json
import os

class ShowSupportLookup:
    def __init__(self, show_date, city):
        self.show_date = show_date
        self.city = city

    def lookup_support(self, grid_path):
        """
        Looks up the support artist lineup for a show from tour_support_grid.json.
        """
        
        # Load tour_support_grid.json (simulated)
        # In a real scenario, this would load from /project_context/tour_support_grid.json
        
        with open(grid_path, "r") as f:
            grid = json.load(f)
            
        # Filter by city and date
        for show in grid:
            if show.get("Date") == self.show_date and self.city in show.get("City"):
                return {
                    "show": f"{self.city} {self.show_date}",
                    "support": {
                        "SpecialGuest": show.get("SpecialGuest"),
                        "Support1": show.get("Support1"),
                        "Support2": show.get("Support2"),
                        "Support3": show.get("Support3"),
                        "Support4": show.get("Support4")
                    }
                }
                
        return {
            "show": f"{self.city} {self.show_date}",
            "support": "No support found for this show."
        }

if __name__ == "__main__":
    # Example usage
    grid_path = "/home/ubuntu/artist_bible_handoff/home/ubuntu/artist_bible_handoff_package/project_context/tour_support_grid.json"
    lookup = ShowSupportLookup("2026-02-28", "Minneapolis")
    result = lookup.lookup_support(grid_path)
    print(json.dumps(result, indent=4))
