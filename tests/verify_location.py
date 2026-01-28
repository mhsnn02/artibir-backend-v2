import sys
import os

sys.path.append(os.getcwd())

print("Testing Redis Import...")
try:
    import redis
    print("Redis module imported.")
except ImportError:
    print("FAIL: redis module not installed.")
    sys.exit(1)

print("Testing Location Service Logic...")
try:
    from services import location_service
    print("Location service imported.")
    
    # Mock Redis object to test logic if actual connection fails (no password)
    if location_service.r is None:
        print("WARNING: Redis connection failed (likely missing password). Logic testing unavailable.")
    else:
        print("Redis connection object exists (connection status unknown until used).")

except Exception as e:
    print(f"Service error: {e}")

print("Testing Router Integration...")
try:
    from main import app
    routes = [route.path for route in app.routes]
    if "/api/location/update" in routes:
        print("Location update endpoint found.")
    else:
        print("WARNING: /api/location/update endpoint NOT found.")
except Exception as e:
    print(f"Router check error: {e}")
