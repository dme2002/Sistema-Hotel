"""
Utilidades de autenticación.
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from config import settings
from utils.security import verify_password, hash_password, generate_jti
from database import execute_query, execute_one, execute_update
from models.user import User, UserInDB, UserRegister, TokenPayload, Rol

logger = logging.getLogger(__name__)
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token de acceso JWT.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Crea un token de refresco JWT.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def create_tokens(user_id: int, username: str, rol: str, ip_address: str = None, user_agent: str = None) -> dict:
    """
    Crea tokens de acceso y refresco para un usuario.
    """
    jti = generate_jti()
    
    token_data = {
        "sub": str(user_id),
        "username": username,
        "rol": rol,
        "jti": jti
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Guardar sesión en base de datos
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    await execute_update("""
        INSERT INTO sesiones (usuario_id, token_jti, refresh_token, ip_address, user_agent, expires_at, activa)
        VALUES (%s, %s, %s, %s, %s, %s, TRUE)
    """, (user_id, jti, refresh_token, ip_address, user_agent, expires_at))
    
    # Actualizar último acceso
    await execute_update(
        "UPDATE usuarios SET last_login = NOW() WHERE id = %s",
        (user_id,)
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


async def verify_token(token: str) -> TokenPayload:
    """
    Verifica y decodifica un token JWT.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Verificar que es un token de acceso
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tipo de token inválido"
            )
        
        # Verificar JTI en base de datos
        jti = payload.get("jti")
        if jti:
            session = await execute_one(
                "SELECT id FROM sesiones WHERE token_jti = %s AND activa = TRUE AND expires_at > NOW()",
                (jti,)
            )
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Sesión inválida o expirada"
                )
        
        return TokenPayload(
            sub=int(payload.get("sub")),
            username=payload.get("username"),
            rol=payload.get("rol"),
            jti=payload.get("jti"),
            exp=datetime.fromtimestamp(payload.get("exp")),
            type=payload.get("type")
        )
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )


async def refresh_access_token(refresh_token: str) -> dict:
    """
    Refresca el access token usando el refresh token.
    """
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Verificar que es un token de refresco
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tipo de token inválido"
            )
        
        user_id = int(payload.get("sub"))
        username = payload.get("username")
        rol = payload.get("rol")
        jti = payload.get("jti")
        
        # Verificar que la sesión existe y está activa
        session = await execute_one(
            "SELECT id FROM sesiones WHERE token_jti = %s AND refresh_token = %s AND activa = TRUE AND expires_at > NOW()",
            (jti, refresh_token)
        )
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sesión inválida o expirada"
            )
        
        # Crear nuevos tokens
        return await create_tokens(user_id, username, rol)
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de refresco inválido"
        )


async def revoke_token(token: str):
    """
    Revoca un token (logout).
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        
        if jti:
            await execute_update(
                "UPDATE sesiones SET activa = FALSE WHERE token_jti = %s",
                (jti,)
            )
            
    except JWTError:
        pass  # Si el token es inválido, no hay nada que revocar


async def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    """
    Autentica un usuario por username y password.
    """
    user = await execute_one("""
        SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion, r.permisos
        FROM usuarios u
        LEFT JOIN roles r ON u.rol_id = r.id
        WHERE u.username = %s AND u.activo = TRUE
    """, (username,))
    
    if not user:
        return None
    
    if not verify_password(password, user["password"]):
        return None
    
    return UserInDB(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        nombres=user["nombres"],
        apellidos=user["apellidos"],
        telefono=user["telefono"],
        rol_id=user["rol_id"],
        rol=Rol(
            id=user["rol_id"],
            nombre=user["rol_nombre"],
            descripcion=user["rol_descripcion"],
            permisos=user["permisos"]
        ) if user["rol_id"] else None,
        is_active=user["activo"],
        last_login=user["last_login"],
        created_at=user["created_at"],
        password=user["password"]
    )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Obtiene el usuario actual desde el token.
    """
    token = credentials.credentials
    payload = await verify_token(token)
    
    user = await execute_one("""
        SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion, r.permisos
        FROM usuarios u
        LEFT JOIN roles r ON u.rol_id = r.id
        WHERE u.id = %s AND u.activo = TRUE
    """, (payload.sub,))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return User(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        nombres=user["nombres"],
        apellidos=user["apellidos"],
        telefono=user["telefono"],
        rol_id=user["rol_id"],
        rol=Rol(
            id=user["rol_id"],
            nombre=user["rol_nombre"],
            descripcion=user["rol_descripcion"],
            permisos=user["permisos"]
        ) if user["rol_id"] else None,
        is_active=user["activo"],
        last_login=user["last_login"],
        created_at=user["created_at"]
    )


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Requiere que el usuario sea administrador.
    """
    if not current_user.rol or current_user.rol.nombre != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )
    return current_user


async def require_admin_or_recepcionista(current_user: User = Depends(get_current_user)) -> User:
    """
    Requiere que el usuario sea administrador o recepcionista.
    """
    if not current_user.rol or current_user.rol.nombre not in ['admin', 'recepcionista']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador o recepcionista"
        )
    return current_user


async def register_user(user_data: UserRegister) -> User:
    """
    Registra un nuevo usuario.
    """
    from models.user import Rol
    
    # Verificar que el username no existe
    existing = await execute_one(
        "SELECT id FROM usuarios WHERE username = %s OR email = %s",
        (user_data.username, user_data.email)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario o email ya existe"
        )
    
    # Obtener rol de cliente
    rol_cliente = await execute_one(
        "SELECT * FROM roles WHERE nombre = 'cliente'"
    )
    
    if not rol_cliente:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de configuración: rol de cliente no encontrado"
        )
    
    # Hash de contraseña
    password = hash_password(user_data.password)
    
    # Insertar usuario
    query = """
        INSERT INTO usuarios (username, email, nombres, apellidos, telefono, password, rol_id, activo,
                              created_at, updated_at, is_superuser, is_staff, last_login)
        VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW(), FALSE, FALSE, NULL)
    """
    from database import execute_insert
    user_id = await execute_insert(query, (
        user_data.username,
        user_data.email,
        user_data.nombres,
        user_data.apellidos,
        user_data.telefono,
        password,
        rol_cliente["id"]
    ))
    
    return User(
        id=user_id,
        username=user_data.username,
        email=user_data.email,
        nombres=user_data.nombres,
        apellidos=user_data.apellidos,
        telefono=user_data.telefono,
        rol_id=rol_cliente["id"],
        rol=Rol(
            id=rol_cliente["id"],
            nombre=rol_cliente["nombre"],
            descripcion=rol_cliente["descripcion"],
            permisos=rol_cliente["permisos"]
        ),
        is_active=True,
        last_login=None,
        created_at=datetime.now()
    )


async def change_password(user_id: int, password_actual: str, nuevo_password: str) -> bool:
    """
    Cambia la contraseña de un usuario.
    """
    user = await execute_one(
        "SELECT password FROM usuarios WHERE id = %s",
        (user_id,)
    )
    
    if not user:
        return False
    
    if not verify_password(password_actual, user["password"]):
        return False
    
    new_hash = hash_password(nuevo_password)
    await execute_update(
        "UPDATE usuarios SET password = %s WHERE id = %s",
        (new_hash, user_id)
    )
    
    return True
