import sys
import os
import io
from PIL import Image

sys.path.append(os.getcwd())

print("Testing Image Processor Import...")
try:
    from services.image_processor import process_and_compress_image
    print("Service imported.")
except ImportError as e:
    print(f"FAILED to import service: {e}")
    sys.exit(1)

print("Testing Pillow Integration...")
try:
    # Create dummy image
    img = Image.new('RGB', (2000, 2000), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    # Test processing
    result = process_and_compress_image(img_byte_arr)
    if result and result["width"] <= 1920:
        print(f"Image processed successfully. New filename: {result['filename']}")
    else:
        print("Image processing failed or didn't resize.")
except Exception as e:
    print(f"Processing error: {e}")

print("Testing Router Integration...")
try:
    from main import app
    print("Main app imported successfully.")
    
    # Check if router is included (simplistic check)
    routes = [route.path for route in app.routes]
    if "/api/upload/image" in routes:
        print("Upload endpoint found in app routes.")
    else:
        print("WARNING: /api/upload/image not found in routes.")
        print(f"Available routes: {routes}")
except Exception as e:
    print(f"Router check error: {e}")
