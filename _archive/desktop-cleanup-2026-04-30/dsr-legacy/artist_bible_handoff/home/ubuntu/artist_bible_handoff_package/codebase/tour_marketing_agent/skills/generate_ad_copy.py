# Skill: Generate Ad Copy

import random

def generate_ad_copy(artist_name, show_info, phase):
    """
    Generates ad copy for a given campaign phase.

    Args:
        artist_name (str): The name of the artist.
        show_info (dict): A dictionary containing show details (city, venue, date).
        phase (str): The current campaign phase.

    Returns:
        str: The generated ad copy.
    """
    city = show_info["city"]
    venue = show_info["venue"]
    date = show_info["date"]

    copy_templates = {
        "Announcement": [
            f"Just announced! {artist_name} is coming to {city} at {venue} on {date}!",
            f"{city}! Get ready for {artist_name} at {venue} on {date}."
        ],
        "On-Sale": [
            f"Tickets for {artist_name} at {venue} are on sale now! Get yours before they sell out.",
            f"Don\'t miss {artist_name} in {city} on {date}. Tickets are available now!"
        ],
        "Maintenance": [
            f"Still thinking about seeing {artist_name} in {city}? Grab your tickets today!",
            f"{artist_name} is coming to {venue} on {date}. Have you got your tickets yet?"
        ],
        "Final Push": [
            f"Last chance to see {artist_name} in {city}! Only a few tickets left for the show at {venue} on {date}.",
            f"The {artist_name} show at {venue} is almost sold out! Get your tickets now before it\'s too late."
        ]
    }

    if phase not in copy_templates:
        raise ValueError(f"Invalid campaign phase: {phase}")

    return random.choice(copy_templates[phase])

if __name__ == '__main__':
    # Example usage:
    show_info = {"city": "Denver", "venue": "Larimer Lounge", "date": "2026-04-09"}
    for phase in ["Announcement", "On-Sale", "Maintenance", "Final Push"]:
        ad_copy = generate_ad_copy("DirtySnatcha", show_info, phase)
        print(f"{phase} Ad Copy: {ad_copy}")
