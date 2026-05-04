# Skill: Calculate Budget Allocation

def calculate_budget_allocation(total_marketing_budget, phase):
    """
    Calculates the budget allocation for a given campaign phase.

    Args:
        total_marketing_budget (float): The total marketing budget for the show.
        phase (str): The current campaign phase (
            'Announcement', 'On-Sale', 'Maintenance', 'Final Push'
        ).

    Returns:
        float: The budget allocated for the given phase.
    """
    allocation_percentages = {
        'Announcement': 0.0,  # Artist's budget, not from promoter's marketing budget
        'On-Sale': 0.40,
        'Maintenance': 0.10,
        'Final Push': 0.50,
    }

    if phase not in allocation_percentages:
        raise ValueError(f"Invalid campaign phase: {phase}")

    return total_marketing_budget * allocation_percentages[phase]

if __name__ == '__main__':
    # Example usage:
    budget = 1000
    phase = 'On-Sale'
    allocated_budget = calculate_budget_allocation(budget, phase)
    print(f"For a total budget of ${budget}, the {phase} phase is allocated ${allocated_budget}.")
