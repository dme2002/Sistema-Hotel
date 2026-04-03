import { Link } from 'react-router-dom';
import { Hotel, BedDouble, CalendarCheck, Users, Star, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const Landing = () => {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: BedDouble,
      title: 'Gestión de Habitaciones',
      description: 'Administre todas las habitaciones del hotel de forma eficiente.',
    },
    {
      icon: CalendarCheck,
      title: 'Reservas Simplificadas',
      description: 'Sistema intuitivo para crear y gestionar reservas.',
    },
    {
      icon: Users,
      title: 'Control de Clientes',
      description: 'Base de datos completa de huéspedes y sus preferencias.',
    },
    {
      icon: Star,
      title: 'Reportes Detallados',
      description: 'Análisis de ocupación e ingresos en tiempo real.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Hotel className="w-8 h-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Hotel Management
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn-primary flex items-center gap-2"
                >
                  Ir al Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900">
                    Iniciar Sesión
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">
              Sistema de Gestión Hotelera
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              La solución completa para administrar su hotel de manera eficiente.
              Gestione habitaciones, reservas y clientes desde una sola plataforma.
            </p>
            <div className="flex justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center gap-2"
                >
                  Ir al Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                  >
                    Comenzar Ahora
                  </Link>
                  <Link
                    to="/login"
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Características Principales
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Todo lo que necesita para gestionar su hotel de manera profesional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para optimizar su hotel?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Únase a miles de hoteles que ya utilizan nuestro sistema para mejorar
            su gestión diaria.
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
            >
              Crear Cuenta Gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Hotel className="w-6 h-6 text-primary-600" />
              <span className="ml-2 font-semibold text-gray-900">
                Hotel Management
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 Hotel Management System. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
