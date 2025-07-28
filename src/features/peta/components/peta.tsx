import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLeafletMap } from "../hooks/useLeafletMap";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Props {
  onProvinceSelect?: (code: string, name: string) => void;
  onCitySelect?: (code: string, name: string, provinceCode: string) => void;
  selectedProvince?: string;
}

const LeafletMap: React.FC<Props> = ({
  onProvinceSelect,
  onCitySelect,
  selectedProvince,
}) => {
  const {
    geoJsonData,
    currentLevel,
    loading,
    mapRef,
    style,
    resetToProvinces,
    handleFeatureClick,
    getFeatureName,
  } = useLeafletMap(selectedProvince);

  if (!geoJsonData) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Peta Indonesia Interaktif
        </h1>
        <p className="text-gray-600">
          Klik provinsi untuk melihat kabupaten/kota di dalamnya
        </p>
      </div>

      {/* Map Container */}
      <div className="relative bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 h-96 md:h-[500px] lg:h-[600px]">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white px-6 py-4 rounded-lg shadow-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-blue-600 font-medium">
                  Memuat data...
                </span>
              </div>
            </div>
          </div>
        )}

        <MapContainer
          center={[-2.0, 118.0]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          minZoom={4}
          maxZoom={12}
          zoomControl={true}
          doubleClickZoom={false}
          whenReady={(e) => (mapRef.current = e.target)}
        >
          <TileLayer
            url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
          />
          {!loading && (
            <GeoJSON
              key={`${currentLevel}-${selectedProvince || "none"}`}
              data={geoJsonData}
              style={style}
              onEachFeature={(feature, layer) => {
                const l = layer as L.Path;
                l.on({
                  click: () =>
                    handleFeatureClick(feature, onProvinceSelect, onCitySelect),
                  mouseover: (e: L.LeafletMouseEvent) => {
                    const target = e.target as L.Path;
                    target.setStyle({
                      fillColor: "#60a5fa",
                      fillOpacity: 1,
                      weight: 2.5,
                      color: "#2563eb",
                    });
                    target.bringToFront();
                  },
                  mouseout: (e: L.LeafletMouseEvent) => {
                    const target = e.target as L.Path;
                    target.setStyle(style(feature));
                  },
                });

                if (window.innerWidth > 768) {
                  l.bindTooltip(getFeatureName(feature, currentLevel), {
                    permanent: false,
                    direction: "top",
                    className:
                      "!bg-white !border-blue-200 !text-blue-800 !font-medium !text-xs !px-3 !py-2 !rounded-lg !shadow-lg",
                  });
                }
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Back Button DI LUAR MAP */}
      {currentLevel === "regency" && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              resetToProvinces();
              // 🔥 Clear selection di parent
              onProvinceSelect?.("", "");
              onCitySelect?.("", "", "");
            }}
            className="bg-white hover:bg-blue-50 text-blue-600 font-medium px-4 py-2 rounded-lg shadow-md border border-blue-200 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            ← Kembali ke Provinsi
          </button>
        </div>
      )}
    </div>
  );
};

export default LeafletMap;
