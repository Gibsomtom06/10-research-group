# DSR Show Geo-Targeting Script
# Part of Tour Marketing Execution (SK-17)

import json

class ShowGeoTargeting:
    def __init__(self, city, state):
        self.city = city
        self.state = state

    def generate_targeting(self):
        """
        Generates geo-targeting for a show.
        """
        
        # 25-50 mile radius around venue city
        radius = 50
        
        return {
            "city": self.city,
            "state": self.state,
            "radius": radius,
            "targeting": f"{self.city}, {self.state} + {radius} miles"
        }

if __name__ == "__main__":
    # Example usage
    geo = ShowGeoTargeting("Tampa", "FL")
    result = geo.generate_targeting()
    print(json.dumps(result, indent=4))
