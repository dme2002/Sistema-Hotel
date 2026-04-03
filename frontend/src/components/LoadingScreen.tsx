import { Hotel } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative inline-block">
          <Hotel className="w-16 h-16 text-primary-600 animate-pulse" />
          <div className="absolute inset-0 bg-primary-600 opacity-20 rounded-full animate-ping" />
        </div>
        <p className="mt-4 text-gray-600 font-medium">Cargando...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
