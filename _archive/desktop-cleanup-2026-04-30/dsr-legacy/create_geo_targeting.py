# Skill: Create Geo-Targeting

def create_geo_targeting(city, state, radius_miles=25):
    """
    Creates a geo-targeting configuration for ad platforms.

    Args:
        city (str): The target city.
        state (str): The target state.
        radius_miles (int): The radius around the city to target, in miles.

    Returns:
        dict: A dictionary representing the geo-targeting configuration.
    """
    # In a real implementation, this would likely involve a call to a geo-location API
    # to get the latitude and longitude of the city.
    # For this example, we will just return a dictionary with the city, state, and radius.
    return {
        "locations": [
            {
                "city": city,
                "state": state,
                "radius": f"{radius_miles}mi"
            }
        ]
    }

if __name__ == '__main__':
    # Example usage:
    geo_targeting = create_geo_targeting("Denver", "CO")
    print(f"Geo-targeting configuration: {geo_targeting}")
