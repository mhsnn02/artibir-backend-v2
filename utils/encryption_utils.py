from cryptography.fernet import Fernet
import base64
import os
import hashlib
from security import SECRET_KEY

# Derive a 32-byte key from the SECRET_KEY for Fernet
# Fernet expects a url-safe base64 encoded 32-byte key
def get_cipher_suite():
    # Use SHA256 to ensure 32 bytes
    key = hashlib.sha256(SECRET_KEY.encode()).digest()
    encoded_key = base64.urlsafe_b64encode(key)
    return Fernet(encoded_key)

def encrypt_file_content(file_content: bytes) -> bytes:
    """Encrypts bytes using Fernet (AES)."""
    cipher = get_cipher_suite()
    return cipher.encrypt(file_content)

def decrypt_file_content(encrypted_content: bytes) -> bytes:
    """Decrypts bytes using Fernet (AES)."""
    cipher = get_cipher_suite()
    return cipher.decrypt(encrypted_content)

def encrypt_string(text: str) -> str:
    """Encrypts a string and returns a base64 encoded string."""
    if not text:
        return text
    cipher = get_cipher_suite()
    return cipher.encrypt(text.encode()).decode()

def decrypt_string(encrypted_text: str) -> str:
    """Decrypts a base64 encoded string and returns the original string."""
    if not encrypted_text:
        return encrypted_text
    try:
        cipher = get_cipher_suite()
        return cipher.decrypt(encrypted_text.encode()).decode()
    except Exception as e:
        print(f"Decryption error: {e}")
        return encrypted_text
