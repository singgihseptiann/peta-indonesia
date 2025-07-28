import PetaIndonesia from "./features/peta";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">
            Indonesia Interactive Map
          </h1>
        </div>
      </nav>

      <div>
        <PetaIndonesia />
      </div>
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2025 Indonesia Interactive Map. Powered by React & Leaflet.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
