# DSR Show Commission Calculation Script
# Part of Booking Workflow (SK-21)

import json

class ShowCommissionCalculation:
    def __init__(self, guarantee, agent_rate=0.10, mgmt_rate=0.10):
        self.guarantee = guarantee
        self.agent_rate = agent_rate
        self.mgmt_rate = mgmt_rate

    def calculate_commission(self):
        """
        Calculates the agent and management commissions for a show.
        """
        
        # Standard split: 10% to PRYSM (management), 10% to booking agent (TOM), remainder to LEE (artist).
        agent_commission = self.guarantee * self.agent_rate
        mgmt_commission = self.guarantee * self.mgmt_rate
        artist_payout = self.guarantee - agent_commission - mgmt_commission
        
        return {
            "guarantee": self.guarantee,
            "agent_commission": agent_commission,
            "mgmt_commission": mgmt_commission,
            "artist_payout": artist_payout
        }

if __name__ == "__main__":
    # Example usage
    commission = ShowCommissionCalculation(2000)
    result = commission.calculate_commission()
    print(json.dumps(result, indent=4))
