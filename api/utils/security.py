"""
Utilidades de seguridad.
"""
from fastapi import Request
import secrets
import string
import hashlib
import base64
import bcrypt


def hash_password(password: str) -> str:
    """
    Hashea una contraseña usando bcrypt directamente.
    """
    # bcrypt limite de 72 bytes - truncar a nivel de bytes
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def _verify_django_pbkdf2(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña contra un hash Django pbkdf2_sha256.
    Formato: pbkdf2_sha256$iterations$salt$hash
    """
    try:
        parts = hashed_password.split('$')
        if len(parts) != 4 or parts[0] != 'pbkdf2_sha256':
            return False
        iterations = int(parts[1])
        salt = parts[2]
        stored_hash = parts[3]
        dk = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations
        )
        computed_hash = base64.b64encode(dk).decode('ascii')
        return computed_hash == stored_hash
    except Exception:
        return False


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña contra su hash.
    Soporta tanto bcrypt (API) como Django pbkdf2_sha256.
    """
    if hashed_password.startswith('pbkdf2_sha256$'):
        return _verify_django_pbkdf2(plain_password, hashed_password)
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False


def generate_secure_token(length: int = 32) -> str:
    """
    Genera un token seguro aleatorio.
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_jti() -> str:
    """
    Genera un JWT ID único.
    """
    return secrets.token_urlsafe(16)


def get_client_ip(request: Request) -> str:
    """
    Obtiene la dirección IP del cliente.
    """
    # Verificar headers de proxy
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    if request.client:
        return request.client.host
    
    return "unknown"


def get_user_agent(request: Request) -> str:
    """
    Obtiene el User-Agent del cliente.
    """
    return request.headers.get("User-Agent", "unknown")


def sanitize_input(text: str) -> str:
    """
    Sanitiza input de usuario para prevenir XSS.
    """
    if not text:
        return text
    
    # Caracteres peligrosos a escapar
    dangerous = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
        '/': '&#x2F;',
    }
    
    for char, replacement in dangerous.items():
        text = text.replace(char, replacement)
    
    return text
