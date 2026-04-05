import { Link } from 'react-router-dom';
import {
  BedDouble,
  CalendarCheck,
  Users,
  Star,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const Landing = () => {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: BedDouble,
      title: 'Gestión de Habitaciones',
      description:
        'Controle disponibilidad, estados y detalles de cada habitación desde una sola plataforma.',
    },
    {
      icon: CalendarCheck,
      title: 'Reservas Simplificadas',
      description:
        'Cree, confirme y administre reservas de forma rápida y ordenada.',
    },
    {
      icon: Users,
      title: 'Control de Usuarios',
      description:
        'Administre clientes, recepcionistas y administradores con roles definidos.',
    },
    {
      icon: Star,
      title: 'Operación Profesional',
      description:
        'Mejore la gestión diaria del hotel con una interfaz moderna y eficiente.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Fondo con imagen */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/auth-hotel-bg1.jpg')",
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-blue-950/80" />

      {/* Luces decorativas */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -right-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <rect x="6" y="4" width="12" height="16" rx="1" />
                    <path d="M9 20v-3h6v3" />
                    <path d="M9 8h.01M12 8h.01M15 8h.01" />
                    <path d="M9 11h.01M12 11h.01M15 11h.01" />
                  </svg>
                </div>

                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white">
                    HotelOps
                  </h1>
                  <p className="text-xs text-slate-300">Gestión hotelera</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    Ir al Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2 text-slate-200 hover:text-white transition-colors"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 font-medium hover:bg-slate-100 transition-all"
                    >
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-slate-200 mb-6">
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                Plataforma moderna para gestión hotelera
              </div>

              <h2 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Administra tu hotel con
                <span className="block bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  control, orden y estilo
                </span>
              </h2>

              <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed">
                HotelOps centraliza habitaciones, reservas, usuarios y operación
                diaria en una sola plataforma diseñada para equipos modernos.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20"
                  >
                    Ir al Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all"
                    >
                      Comenzar ahora
                      <ArrowRight className="w-5 h-5" />
                    </Link>

                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
                    >
                      Iniciar sesión
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Panel visual */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 lg:p-8 shadow-2xl">
              <div className="grid gap-4">
                <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5">
                  <p className="text-sm text-slate-400 mb-2">Estado general</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">
                      Operación Hotelera
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-400/20">
                      Activa
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                      <p className="text-xs text-slate-400">Habitaciones</p>
                      <p className="text-2xl font-bold text-white mt-1">128</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                      <p className="text-xs text-slate-400">Reservas</p>
                      <p className="text-2xl font-bold text-white mt-1">46</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                      <p className="text-xs text-slate-400">Clientes</p>
                      <p className="text-2xl font-bold text-white mt-1">312</p>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <BedDouble className="w-6 h-6 text-blue-300 mb-3" />
                    <h4 className="font-semibold text-white mb-1">
                      Habitaciones
                    </h4>
                    <p className="text-sm text-slate-300">
                      Supervisa disponibilidad y estados en tiempo real.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <CalendarCheck className="w-6 h-6 text-indigo-300 mb-3" />
                    <h4 className="font-semibold text-white mb-1">
                      Reservas
                    </h4>
                    <p className="text-sm text-slate-300">
                      Gestiona entradas, salidas y confirmaciones con fluidez.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold text-white mb-4">
              Todo lo que tu hotel necesita
            </h3>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Una experiencia de gestión pensada para mejorar el control, la
              productividad y la operación diaria.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:bg-white/10 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                <h4 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!isAuthenticated && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-md p-10 text-center">
              <h3 className="text-3xl font-bold text-white mb-4">
                Empieza a gestionar mejor tu hotel
              </h3>
              <p className="text-slate-300 max-w-2xl mx-auto mb-8">
                Organiza habitaciones, reservas y usuarios desde una sola
                plataforma diseñada para crecer con tu operación.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all"
                >
                  Crear cuenta
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-white/10 bg-slate-950/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <rect x="6" y="4" width="12" height="16" rx="1" />
                  <path d="M9 20v-3h6v3" />
                  <path d="M9 8h.01M12 8h.01M15 8h.01" />
                  <path d="M9 11h.01M12 11h.01M15 11h.01" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">HotelOps</p>
                <p className="text-xs text-slate-400">Gestión hotelera</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 text-center md:text-right">
              © 2026 HotelOps. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;