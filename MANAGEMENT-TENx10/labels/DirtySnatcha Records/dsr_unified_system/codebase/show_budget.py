# DSR Show Budget Allocation Script
# Part of Tour Marketing Execution (SK-14)

import json

class ShowBudgetAllocation:
    def __init__(self, total_budget):
        self.total_budget = total_budget

    def calculate_allocation(self):
        """
        Calculates the 4-phase budget allocation from the promoter marketing budget.
        """
        
        # 4-Phase System
        # Phase 1: Announcement (Label Budget)
        # Phase 2: On-Sale (40% of promoter co-spend)
        # Phase 3: Maintenance (10%)
        # Phase 4: Final Push (50%)
        
        allocation = {
            "Phase 1: Announcement": 0,
            "Phase 2: On-Sale": self.total_budget * 0.40,
            "Phase 3: Maintenance": self.total_budget * 0.10,
            "Phase 4: Final Push": self.total_budget * 0.50
        }
        
        return {
            "total_budget": self.total_budget,
            "allocation": allocation
        }

if __name__ == "__main__":
    # Example usage
    budget = ShowBudgetAllocation(2000)
    result = budget.calculate_allocation()
    print(json.dumps(result, indent=4))
