import requests
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
BASE_URL = "https://maps.googleapis.com/maps/api/directions/json"

def get_directions(origin: str, destination: str, mode: str = "walking"):
    """
    Google Maps Directions API kullanarak iki nokta arası rota çizer.
    
    Args:
        origin (str): "lat,lon" formatında başlangıç noktası
        destination (str): "lat,lon" formatında varış noktası
        mode (str): "walking", "driving", "bicycling", "transit"
    
    Returns:
        dict: Rota bilgileri, polyline ve süre/mesafe
    """
    if not GOOGLE_MAPS_API_KEY:
        return {
            "status": "error", 
            "message": "Google Maps API Key tanımlanmamış (GOOGLE_MAPS_API_KEY)."
        }

    params = {
        "origin": origin,
        "destination": destination,
        "mode": mode,
        "key": GOOGLE_MAPS_API_KEY
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=10)
        data = response.json()
        
        if data["status"] == "OK":
            route = data["routes"][0]
            leg = route["legs"][0]
            
            return {
                "status": "success",
                "overview_polyline": route["overview_polyline"]["points"], # Haritada çizmek için encoded string
                "distance": leg["distance"]["text"],
                "duration": leg["duration"]["text"],
                "start_address": leg["start_address"],
                "end_address": leg["end_address"]
            }
        else:
            return {
                "status": "error", 
                "message": data.get("error_message", f"API Hatası: {data['status']}")
            }
            
    except Exception as e:
        return {"status": "error", "message": f"Bağlantı hatası: {str(e)}"}