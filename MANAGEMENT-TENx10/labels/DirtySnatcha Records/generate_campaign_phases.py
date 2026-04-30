# Skill: Generate Campaign Phases

import datetime

def generate_campaign_phases(show_date):
    """
    Generates the campaign phase dates for a given show date.

    Args:
        show_date (datetime.date): The date of the show.

    Returns:
        dict: A dictionary with the start and end dates for each campaign phase.
    """
    on_sale_start = show_date - datetime.timedelta(days=60)
    maintenance_start = show_date - datetime.timedelta(days=30)
    final_push_start = show_date - datetime.timedelta(days=14)

    return {
        'Announcement': {'start': on_sale_start - datetime.timedelta(days=14), 'end': on_sale_start - datetime.timedelta(days=1)}, 
        'On-Sale': {'start': on_sale_start, 'end': maintenance_start - datetime.timedelta(days=1)},
        'Maintenance': {'start': maintenance_start, 'end': final_push_start - datetime.timedelta(days=1)},
        'Final Push': {'start': final_push_start, 'end': show_date}
    }

if __name__ == '__main__':
    # Example usage:
    show_date = datetime.date(2026, 4, 11)
    phases = generate_campaign_phases(show_date)
    for phase, dates in phases.items():
        print(f"{phase}: {dates['start']} to {dates['end']}")
