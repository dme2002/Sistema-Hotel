import { useEffect, useState } from 'react';
import {
  BedDouble,
  CalendarCheck,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardService } from '@/services/api';
import type { DashboardStats } from '@/types';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Habitaciones Disponibles',
      value: stats?.habitaciones_disponibles || 0,
      total: stats?.total_habitaciones || 0,
      icon: BedDouble,
      color: 'bg-green-500',
      trend: 'up',
    },
    {
      title: 'Habitaciones Ocupadas',
      value: stats?.habitaciones_ocupadas || 0,
      total: stats?.total_habitaciones || 0,
      icon: BedDouble,
      color: 'bg-red-500',
      trend: 'down',
    },
    {
      title: 'Reservas Activas',
      value: stats?.reservas_activas || 0,
      icon: CalendarCheck,
      color: 'bg-blue-500',
      trend: 'up',
    },
    {
      title: 'Ingresos del Mes',
      value: `$${(stats?.ingresos_mes || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      trend: 'up',
    },
  ];

  const occupancyData = [
    { name: 'Disponibles', value: stats?.habitaciones_disponibles || 0 },
    { name: 'Ocupadas', value: stats?.habitaciones_ocupadas || 0 },
    { name: 'Mantenimiento', value: stats?.habitaciones_mantenimiento || 0 },
  ];

  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen del sistema hotelero</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                    {card.total && (
                      <span className="text-sm font-normal text-gray-500">
                        {' '}
                        / {card.total}
                      </span>
                    )}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              {card.trend && (
                <div className="mt-4 flex items-center text-sm">
                  {card.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={
                      card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {card.trend === 'up' ? 'Aumento' : 'Disminución'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Estado de Habitaciones
            </h3>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">
              Información Rápida
            </h3>
          </div>
          <div className="card-body space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary-600" />
                <span className="text-gray-700">Total Usuarios</span>
              </div>
              <span className="font-semibold text-gray-900">
                {stats?.total_usuarios || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-700">Reservas Pendientes</span>
              </div>
              <span className="font-semibold text-gray-900">
                {stats?.reservas_pendientes || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <BedDouble className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Tasa de Ocupación</span>
              </div>
              <span className="font-semibold text-gray-900">
                {stats && stats.total_habitaciones > 0
                  ? Math.round(
                      (stats.habitaciones_ocupadas / stats.total_habitaciones) * 100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
