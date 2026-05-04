# DSR A&R Scoring Script
# Part of A&R Submission Pipeline (SK-01)

import json
import random

def score_submission(artist_name, track_title, genres, social_data):
    """
    Scores a submission based on Quality, Reach, and Fit.
    In a real scenario, this would call Spotify, SoundCloud, and Google Trends APIs.
    """
    
    # Dimension 1: Quality (Weight: 40%)
    # In a real scenario, this would analyze Shazam and playlist data
    quality_score = random.randint(5, 10)
    
    # Dimension 2: Reach (Weight: 30%)
    # In a real scenario, this would analyze monthly listeners and social followers
    reach_score = random.randint(3, 9)
    
    # Dimension 3: Fit (Weight: 30%)
    # In a real scenario, this would analyze genre and brand alignment
    fit_score = random.randint(6, 10)
    
    # Calculate composite score
    composite = (quality_score * 0.40) + (reach_score * 0.30) + (fit_score * 0.30)
    
    return {
        "artist": artist_name,
        "track": track_title,
        "scores": {
            "quality": quality_score,
            "reach": reach_score,
            "fit": fit_score,
            "composite": round(composite, 2)
        }
    }

if __name__ == "__main__":
    # Example usage
    sample_submission = {
        "artist": "New Artist",
        "track": "Bass Drop",
        "genres": ["Dubstep", "Bass"],
        "social_data": {"spotify_listeners": 15000}
    }
    
    result = score_submission(**sample_submission)
    print(json.dumps(result, indent=4))
