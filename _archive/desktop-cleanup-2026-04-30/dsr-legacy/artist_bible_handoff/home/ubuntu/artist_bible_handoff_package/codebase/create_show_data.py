import json
import os

# Path to the parsed tour data markdown file
parsed_data_file = "/home/ubuntu/parsed_tour_data.md"

# Base path for the show data
show_data_path = "/home/ubuntu/artist_bible_platform/project_context/show_data"

# Create the directory if it doesn't exist
os.makedirs(show_data_path, exist_ok=True)

with open(parsed_data_file, "r") as f:
    lines = f.readlines()

# Find the start of the tour shows table
table_start_index = -1
for i, line in enumerate(lines):
    if "| # | Date | City | ST | Offer ($) |" in line:
        table_start_index = i + 2
        break

if table_start_index != -1:
    # Process each row in the table
    for line in lines[table_start_index:]:
        if not line.strip() or line.startswith("###"):
            break

        parts = [p.strip() for p in line.split("|")][1:-1]
        if len(parts) < 11:
            continue

        show_number, date, city, state, offer, mgmt_commission, agent_commission, artist_payout, deal_type, hgr, notes = parts

        show_offer = 0.0
        if "vs" in offer.lower():
            show_offer = float(offer.split("vs")[0].replace("$", "").replace(",", "").strip())
        else:
            show_offer = float(offer.replace("$", "").replace(",", ""))

        show_data = {
            "show_number": int(show_number),
            "date": date,
            "city": city,
            "state": state,
            "venue": "",  # To be filled in later
            "offer": show_offer,
            "commission": {
                "management": float(mgmt_commission.replace("$", "").replace(",", "").split(" ")[0]),
                "agent": float(agent_commission.replace("$", "").replace(",", "")),
            },
            "artist_payout": artist_payout,
            "deal_type": deal_type,
            "hgr": hgr == "YES",
            "notes": notes,
            "campaign_phase": "" # To be determined
        }

        # Create a filename for the show
        filename = f'{date.replace("/", "-")}_{city.replace(" ", "_")}.json'
        filepath = os.path.join(show_data_path, filename)

        # Write the JSON data to the file
        with open(filepath, "w") as json_file:
            json.dump(show_data, json_file, indent=4)

        print(f"Created show data file: {filepath}")
