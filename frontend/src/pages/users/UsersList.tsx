import { useEffect, useState } from 'react';
import { Users, Search, UserPlus } from 'lucide-react';
import { userService } from '@/services/api';
import type { User } from '@/types';
import CreateUserModal from '@/components/CreateUserModal';

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    rol: '',
    activo: '',
    search: '',
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.rol) params.rol = filters.rol;
      if (filters.activo) params.activo = filters.activo === 'true';
      if (filters.search) params.search = filters.search;

      const response = await userService.getAll(params);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (rol: string) => {
    const styles: Record<string, string> = {
      admin: 'badge-red',
      recepcionista: 'badge-blue',
      cliente: 'badge-green',
    };
    return <span className={styles[rol] || 'badge-gray'}>{rol}</span>;
  };

  const getStatusBadge = (activo: boolean) => {
    return activo ? (
      <span className="badge-green">Activo</span>
    ) : (
      <span className="badge-red">Inactivo</span>
    );
  };

  const toggleUserStatus = async (user: User) => {
    try {
      await userService.toggleStatus(user.id);
      loadUsers();
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500">Gestión de usuarios del sistema</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
        >
          <UserPlus className="w-4 h-4" />
          Agregar Usuario
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="form-input pl-10"
            />
          </div>
          <select
            value={filters.rol}
            onChange={(e) => setFilters({ ...filters, rol: e.target.value })}
            className="form-input w-40"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="recepcionista">Recepcionista</option>
            <option value="cliente">Cliente</option>
          </select>
          <select
            value={filters.activo}
            onChange={(e) => setFilters({ ...filters, activo: e.target.value })}
            className="form-input w-40"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">{user.username}</td>
                  <td>{user.nombre_completo || `${user.nombres} ${user.apellidos}`}</td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.rol?.nombre || '')}</td>
                  <td>{getStatusBadge(user.is_active)}</td>
                  <td>
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        user.is_active 
                          ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                          : 'text-green-600 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {user.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No hay usuarios
          </h3>
          <p className="text-gray-500">
            No se encontraron usuarios con los filtros seleccionados
          </p>
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadUsers();
        }}
      />
    </div>
  );
};

export default UsersList;
