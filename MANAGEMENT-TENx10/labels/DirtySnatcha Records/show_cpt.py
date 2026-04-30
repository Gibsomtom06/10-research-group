# DSR Show CPT Calculation Script
# Part of Tour Marketing Execution (SK-19)

import json

class ShowCPTCalculation:
    def __init__(self, total_ad_spend, tickets_sold):
        self.total_ad_spend = total_ad_spend
        self.tickets_sold = tickets_sold

    def calculate_cpt(self):
        """
        Calculates the Cost Per Ticket (CPT) for a show.
        """
        
        # CPT = Total Ad Spend / Tickets Sold (via tracking link)
        if self.tickets_sold > 0:
            cpt = self.total_ad_spend / self.tickets_sold
        else:
            cpt = 0
            
        return {
            "total_ad_spend": self.total_ad_spend,
            "tickets_sold": self.tickets_sold,
            "cpt": round(cpt, 2)
        }

if __name__ == "__main__":
    # Example usage
    cpt = ShowCPTCalculation(2000, 400)
    result = cpt.calculate_cpt()
    print(json.dumps(result, indent=4))
