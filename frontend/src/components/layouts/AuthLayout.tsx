import { Outlet } from 'react-router-dom';
import { Hotel, ShieldCheck, CalendarDays, BedDouble } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo con imagen */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/auth-hotel-bg.jpg')",
        }}
      />

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/80 to-blue-950/75" />

      {/* Efectos decorativos */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />

      {/* Contenido */}
      <div className="relative min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-sm">
          {/* Panel izquierdo decorativo */}
          <div className="hidden lg:flex flex-col justify-between p-10 bg-white/5 backdrop-blur-md border-r border-white/10 text-white">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-7 h-7"
                  >
                    <rect x="6" y="4" width="12" height="16" rx="1" />
                    <path d="M9 20v-3h6v3" />
                    <path d="M9 8h.01M12 8h.01M15 8h.01" />
                    <path d="M9 11h.01M12 11h.01M15 11h.01" />
                  </svg>
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">HotelOps</h1>
                  <p className="text-sm text-slate-300">Gestión hotelera</p>
                </div>
              </div>

              <div className="max-w-md">
                <h2 className="text-4xl font-bold leading-tight mb-4">
                  Gestiona tu hotel de forma moderna y eficiente
                </h2>
                <p className="text-slate-300 text-base leading-relaxed">
                  Controla habitaciones, reservas, usuarios y operaciones
                  diarias desde una sola plataforma.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
                <BedDouble className="w-5 h-5 mt-0.5 text-blue-300" />
                <div>
                  <p className="font-medium">Gestión de habitaciones</p>
                  <p className="text-sm text-slate-300">
                    Estado, disponibilidad y control operativo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
                <CalendarDays className="w-5 h-5 mt-0.5 text-indigo-300" />
                <div>
                  <p className="font-medium">Reservas centralizadas</p>
                  <p className="text-sm text-slate-300">
                    Administra entradas, salidas y confirmaciones.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
                <ShieldCheck className="w-5 h-5 mt-0.5 text-emerald-300" />
                <div>
                  <p className="font-medium">Acceso seguro</p>
                  <p className="text-sm text-slate-300">
                    Roles y permisos para cada tipo de usuario.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho */}
          <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 lg:p-10 flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Logo móvil */}
              <div className="lg:hidden text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
                  <Hotel className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">HotelOps</h1>
                <p className="text-slate-500 mt-1">Sistema de Gestión Hotelera</p>
              </div>

              <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900">
                  Bienvenido
                </h2>
                <p className="text-slate-500 mt-2">
                  Inicia sesión para continuar en la plataforma.
                </p>
              </div>

              <div className="rounded-2xl">
                <Outlet />
              </div>

              <p className="text-center text-slate-400 text-sm mt-8">
                © 2026 HotelOps. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;