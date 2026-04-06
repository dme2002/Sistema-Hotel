"""
Router de usuarios.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
import logging

from models.user import User, UserCreate, UserUpdate, Rol
from utils.auth import get_current_user, require_admin, require_admin_or_recepcionista
from database import execute_query, execute_one, execute_procedure, execute_update
from utils.security import hash_password

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=dict)
async def list_users(
    rol: Optional[str] = None,
    activo: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(require_admin_or_recepcionista)
):
    """
    Lista todos los usuarios con filtros opcionales.
    """
    # Construir query base
    query = """
        SELECT u.*, r.id as rol_id, r.nombre as rol_nombre, r.descripcion as rol_descripcion
        FROM usuarios u
        LEFT JOIN roles r ON u.rol_id = r.id
        WHERE 1=1
    """
    params = []
    
    if rol:
        query += " AND r.nombre = %s"
        params.append(rol)
    
    if activo is not None:
        query += " AND u.activo = %s"
        params.append(activo)
    
    if search:
        query += """ AND (
            u.username LIKE %s OR 
            u.email LIKE %s OR 
            u.nombres LIKE %s OR 
            u.apellidos LIKE %s
        )"""
        search_pattern = f"%{search}%"
        params.extend([search_pattern] * 4)
    
    query += " ORDER BY u.created_at DESC"
    
    # Paginación
    offset = (page - 1) * page_size
    query += " LIMIT %s OFFSET %s"
    params.extend([page_size, offset])
    
    users = await execute_query(query, tuple(params))
    
    # Formatear respuesta
    formatted_users = []
    for user in users:
        formatted_users.append({
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "nombres": user["nombres"],
            "apellidos": user["apellidos"],
            "nombre_completo": f"{user['nombres']} {user['apellidos']}",
            "telefono": user["telefono"],
            "rol": {
                "id": user["rol_id"],
                "nombre": user["rol_nombre"],
                "descripcion": user["rol_descripcion"]
            },
            "is_active": user["activo"],
            "last_login": user["last_login"],
            "created_at": user["created_at"]
        })
    
    return {
        "status": "success",
        "data": formatted_users,
        "pagination": {
            "page": page,
            "page_size": page_size
        }
    }


@router.get("/roles", response_model=dict)
async def list_roles(current_user = Depends(require_admin_or_recepcionista)):
    """
    Lista todos los roles disponibles.
    """
    roles = await execute_query("SELECT * FROM roles ORDER BY nombre")
    
    return {
        "status": "success",
        "data": roles
    }


@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: int,
    current_user = Depends(require_admin_or_recepcionista)
):
    """
    Obtiene detalles de un usuario específico.
    """
    user = await execute_one("""
        SELECT u.*, r.id as rol_id, r.nombre as rol_nombre, r.descripcion as rol_descripcion, r.permisos
        FROM usuarios u
        LEFT JOIN roles r ON u.rol_id = r.id
        WHERE u.id = %s
    """, (user_id,))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return {
        "status": "success",
        "data": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "nombres": user["nombres"],
            "apellidos": user["apellidos"],
            "telefono": user["telefono"],
            "rol": {
                "id": user["rol_id"],
                "nombre": user["rol_nombre"],
                "descripcion": user["rol_descripcion"],
                "permisos": user["permisos"]
            },
            "is_active": user["activo"],
            "last_login": user["last_login"],
            "created_at": user["created_at"],
            "updated_at": user["updated_at"]
        }
    }


@router.post("", response_model=dict)
async def create_user(
    user_data: UserCreate,
    current_user = Depends(require_admin)
):
    """
    Crea un nuevo usuario.
    """
    # Verificar que el username no exista
    existing = await execute_one(
        "SELECT id FROM usuarios WHERE username = %s OR email = %s",
        (user_data.username, user_data.email)
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario o email ya existe"
        )
    
    # Hash de contraseña
    password = hash_password(user_data.password)
    
    # Insertar usuario
    from database import execute_insert
    query = """
        INSERT INTO usuarios (username, email, nombres, apellidos, telefono, password, rol_id, activo,
                              created_at, updated_at, is_superuser, is_staff, last_login)
        VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW(), FALSE, FALSE, NULL)
    """
    user_id = await execute_insert(query, (
        user_data.username,
        user_data.email,
        user_data.nombres,
        user_data.apellidos,
        user_data.telefono,
        password,
        user_data.rol_id
    ))
    
    logger.info(f"Usuario creado: {user_data.username} por {current_user.username}")
    
    return {
        "status": "success",
        "message": "Usuario creado exitosamente",
        "data": {"id": user_id}
    }


@router.patch("/{user_id}", response_model=dict)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user = Depends(get_current_user)
):
    """
    Actualiza un usuario existente.
    """
    # Solo administradores pueden actualizar a otros. Usuarios normales solo pueden actualizarse a sí mismos.
    if current_user.rol.nombre != 'admin' and user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para actualizar este usuario"
        )

    # Verificar que el usuario existe
    user = await execute_one(
        "SELECT id, username, email FROM usuarios WHERE id = %s",
        (user_id,)
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Restricciones para no-admins
    if current_user.rol.nombre != 'admin':
        # No pueden cambiar su rol
        user_data.rol_id = None
        # No pueden cambiar su estado de activo
        user_data.is_active = None

    # No permitir desactivarse a sí mismo (incluso para admins)
    if user_id == current_user.id and user_data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede desactivar su propio usuario"
        )

    # Validar email repetido si se intenta cambiar
    if user_data.email is not None:
        existing_email = await execute_one(
            "SELECT id FROM usuarios WHERE email = %s AND id != %s",
            (user_data.email, user_id)
        )
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya está en uso por otro usuario"
            )

    # Construir query de actualización
    update_fields = []
    params = []

    if user_data.nombres is not None:
        update_fields.append("nombres = %s")
        params.append(user_data.nombres)

    if user_data.apellidos is not None:
        update_fields.append("apellidos = %s")
        params.append(user_data.apellidos)

    if user_data.email is not None:
        update_fields.append("email = %s")
        params.append(user_data.email)

    if user_data.telefono is not None:
        update_fields.append("telefono = %s")
        params.append(user_data.telefono)

    if user_data.rol_id is not None:
        update_fields.append("rol_id = %s")
        params.append(user_data.rol_id)

    if user_data.is_active is not None:
        update_fields.append("activo = %s")
        params.append(user_data.is_active)

    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay campos para actualizar"
        )

    query = f"UPDATE usuarios SET {', '.join(update_fields)}, updated_at = NOW() WHERE id = %s"
    params.append(user_id)

    await execute_update(query, tuple(params))

    logger.info(f"Usuario actualizado: {user_id} por {current_user.username}")

    return {
        "status": "success",
        "message": "Usuario actualizado exitosamente"
    }


@router.patch("/{user_id}/toggle-status", response_model=dict)
async def toggle_user_status(
    user_id: int,
    current_user = Depends(require_admin)
):
    """
    Activa o desactiva un usuario (toggle).
    """
    # No permitir desactivarse a sí mismo
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede cambiar el estado de su propio usuario"
        )
    
    # Obtener estado actual del usuario
    user = await execute_one("SELECT id, activo FROM usuarios WHERE id = %s", (user_id,))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Alternar estado
    nuevo_estado = not user["activo"]
    await execute_update(
        "UPDATE usuarios SET activo = %s WHERE id = %s",
        (nuevo_estado, user_id)
    )
    
    estado_texto = "activado" if nuevo_estado else "desactivado"
    logger.info(f"Usuario {user_id} {estado_texto} por {current_user.username}")
    
    return {
        "status": "success",
        "message": f"Usuario {estado_texto} exitosamente",
        "data": {"is_active": nuevo_estado}
    }


@router.delete("/{user_id}", response_model=dict)
async def delete_user(
    user_id: int,
    current_user = Depends(require_admin)
):
    """
    Desactiva un usuario (eliminación lógica).
    """
    # No permitir eliminar el propio usuario
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede eliminar su propio usuario"
        )
    
    # Verificar que el usuario existe
    user = await execute_one("SELECT id FROM usuarios WHERE id = %s", (user_id,))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Desactivar usuario
    await execute_update(
        "UPDATE usuarios SET activo = FALSE WHERE id = %s",
        (user_id,)
    )
    
    logger.info(f"Usuario desactivado: {user_id} por {current_user.username}")
    
    return {
        "status": "success",
        "message": "Usuario desactivado exitosamente"
    }


@router.get("/profile/me", response_model=dict)
async def get_profile(current_user = Depends(get_current_user)):
    """
    Obtiene el perfil del usuario autenticado.
    """
    return {
        "status": "success",
        "data": current_user
    }
