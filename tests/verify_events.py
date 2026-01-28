import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_auto_fetch():
    print("\n--- Testing Auto Fetch ---")
    response = requests.post(f"{BASE_URL}/events/auto-fetch?count=5")
    if response.status_code == 200:
        events = response.json()
        print(f"Success! {len(events)} events created.")
        for event in events:
            print(f"- [{event['category']}] {event['title']} ({event['city']})")
    else:
        print(f"Failed: {response.status_code}")
        print(f"Details: {response.text}")

def test_get_events():
    print("\n--- Testing Get All Events ---")
    response = requests.get(f"{BASE_URL}/events")
    if response.status_code == 200:
        events = response.json()
        print(f"Total events in DB: {len(events)}")
    else:
        print(f"Failed: {response.status_code}")

def test_filter_events():
    category = "Futbol"
    print(f"\n--- Testing Filter by {category} ---")
    response = requests.get(f"{BASE_URL}/events?category={category}")
    if response.status_code == 200:
        events = response.json()
        print(f"Found {len(events)} events for {category}:")
        for event in events:
            print(f"- {event['title']}")
    else:
        print(f"Failed: {response.status_code}")

if __name__ == "__main__":
    try:
        test_auto_fetch()
        test_get_events()
        test_filter_events()
    except Exception as e:
        print(f"An error occurred: {e}")
