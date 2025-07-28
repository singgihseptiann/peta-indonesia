import LeafletMap from "./components/peta";
import { useSelectedProvinceAndCity } from "./hooks/useSelectedMap";

export default function PetaIndonesia() {
  const {
    selectedProvince,
    selectedCity,
    handleProvinceSelect,
    handleCitySelect,
  } = useSelectedProvinceAndCity();

  return (
    <div className="space-y-6">
      <main className="py-8">
        <LeafletMap
          onProvinceSelect={handleProvinceSelect}
          onCitySelect={handleCitySelect}
          selectedProvince={selectedProvince?.code}
        />
      </main>

      {/* Card Selected Info */}
      <div className="flex justify-center gap-4">
        {selectedProvince && (
          <div className="bg-white border border-blue-200 rounded-lg shadow p-4 w-64">
            <h3 className="text-lg font-semibold text-blue-700 mb-1">
              Provinsi Terpilih
            </h3>
            <p className="text-gray-800">{selectedProvince.name}</p>
            <p className="text-xs text-gray-500">
              Kode: {selectedProvince.code}
            </p>
          </div>
        )}

        {selectedCity && (
          <div className="bg-white border border-green-200 rounded-lg shadow p-4 w-64">
            <h3 className="text-lg font-semibold text-green-700 mb-1">
              Kota/Kabupaten Terpilih
            </h3>
            <p className="text-gray-800">{selectedCity.name}</p>
            <p className="text-xs text-gray-500">Kode: {selectedCity.code}</p>
          </div>
        )}
      </div>
    </div>
  );
}
