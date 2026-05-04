# Skill: Build Show Folder Structure

import os

def build_show_folder_structure(base_path, show_info):
    """
    Builds a folder structure for a given show.

    Args:
        base_path (str): The base path where the folder structure will be created.
        show_info (dict): A dictionary containing show details (date, city).

    Returns:
        str: The path to the created show folder.
    """
    show_folder_name = f"{show_info["date"]}_{show_info["city"].replace(" ", "_")}"
    show_folder_path = os.path.join(base_path, show_folder_name)

    # Create the main show folder
    os.makedirs(show_folder_path, exist_ok=True)

    # Create subfolders for different campaign assets
    subfolders = ["artwork", "ad_copy", "reports", "contracts"]
    for subfolder in subfolders:
        os.makedirs(os.path.join(show_folder_path, subfolder), exist_ok=True)

    return show_folder_path

if __name__ == '__main__':
    # Example usage:
    show_info = {"date": "2026-04-09", "city": "Denver"}
    base_path = "/home/ubuntu/artist_bible_platform/project_context/show_data"
    show_folder = build_show_folder_structure(base_path, show_info)
    print(f"Show folder created at: {show_folder}")
