import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import provincesData from "../../../assets/geojson/provinces.json";
import regenciesData from "../../../assets/geojson/kab_kota_simple.json";
import type { GeoJSONData, GeoJSONFeature } from "../../../types/peta.types";

export type MapLevel = "province" | "regency";

export const useLeafletMap = (selectedProvince?: string) => {
  // State untuk menyimpan data GeoJSON saat ini (provinsi atau kab/kota)
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);

  // Menandai level peta saat ini: "province" (default) atau "regency"
  const [currentLevel, setCurrentLevel] = useState<MapLevel>("province");

  // Loading state saat ambil data
  const [loading, setLoading] = useState(true);

  // Data provinsi terpilih (kode & nama) → dipakai saat render kab/kota
  const [selectedProvinceData, setSelectedProvinceData] = useState<{
    code: string;
    name: string;
  } | null>(null);

  // Ref ke object map Leaflet biar bisa manipulasi (zoom, fitBounds, dsb)
  const mapRef = useRef<L.Map | null>(null);

  // =========================
  // HELPER UNTUK MENDAPATKAN KODE DAN NAMA DARI FEATURE
  // =========================

  // Ambil kode provinsi/kabupaten dari properties sesuai level
  const getFeatureCode = (feature: GeoJSONFeature, level: MapLevel) => {
    const p = feature.properties;
    return level === "province"
      ? p.province_kemendagri_code || p.province_bps_code
      : p.regency_kemendagri_code || p.regency_bps_code;
  };

  // Ambil nama provinsi/kabupaten dari properties sesuai level
  const getFeatureName = (feature: GeoJSONFeature, level: MapLevel) => {
    const p = feature.properties;
    return level === "province"
      ? p.province_kemendagri_name || p.province_bps_name || "Provinsi"
      : p.regency_kemendagri_name || p.regency_bps_name || "Kab/Kota";
  };

  // =========================
  // LOAD DATA KAB/KOTA BERDASARKAN KODE PROVINSI
  // =========================
  const loadRegenciesData = (provinceCode: string): GeoJSONData | null => {
    // Filter kab/kota berdasarkan kode provinsi
    const filtered = regenciesData.features.filter((f: any) => {
      const p = f.properties;
      return (
        p.province_kemendagri_code === provinceCode ||
        p.province_bps_code === provinceCode
      );
    });

    if (filtered.length === 0) return null;

    return {
      type: "FeatureCollection",
      features: filtered,
    };
  };

  // =========================
  // INIT DATA PROVINSI SAAT PERTAMA RENDER
  // =========================
  useEffect(() => {
    setGeoJsonData(provincesData as GeoJSONData);
    setLoading(false);
  }, []);

  // =========================
  // HANDLE PERUBAHAN selectedProvince DARI PARENT
  // (contohnya kalau user klik kembali ke provinsi lain dari luar map)
  // =========================
  useEffect(() => {
    if (selectedProvince && currentLevel === "province" && geoJsonData) {
      const provinceFeature = geoJsonData.features.find(
        (feature) => getFeatureCode(feature, "province") === selectedProvince
      );

      if (provinceFeature) {
        const provinceCode = getFeatureCode(provinceFeature, "province");
        const provinceName = getFeatureName(provinceFeature, "province");

        if (provinceCode) {
          // Simpan provinsi terpilih
          setSelectedProvinceData({ code: provinceCode, name: provinceName });

          // Load kab/kota untuk provinsi terpilih
          const regenciesForProvince = loadRegenciesData(provinceCode);
          if (
            regenciesForProvince &&
            regenciesForProvince.features.length > 0
          ) {
            // Switch ke level kab/kota
            setCurrentLevel("regency");
            setGeoJsonData(regenciesForProvince);

            // Auto zoom ke bounding box kab/kota
            if (mapRef.current) {
              const bounds = L.geoJSON(regenciesForProvince).getBounds();
              mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
          }
        }
      }
    }
  }, [selectedProvince, geoJsonData, currentLevel]);

  // =========================
  // FUNGSI RESET KE LEVEL PROVINSI
  // =========================
  const resetToProvinces = () => {
    setCurrentLevel("province");
    setSelectedProvinceData(null);
    setGeoJsonData(provincesData as GeoJSONData);

    // Kembalikan posisi map ke tengah Indonesia
    if (mapRef.current) {
      mapRef.current.setView([-2.0, 118.0], 5, {
        animate: true,
        duration: 1,
      });
    }
  };

  // =========================
  // HANDLE KLIK FEATURE (PROVINSI / KABUPATEN)
  // =========================
  const handleFeatureClick = (
    feature: GeoJSONFeature,
    onProvinceSelect?: (code: string, name: string) => void,
    onCitySelect?: (code: string, name: string, provinceCode: string) => void
  ) => {
    if (currentLevel === "province") {
      // Kalau masih di level provinsi → klik provinsi untuk masuk ke kab/kota
      const provinceCode = getFeatureCode(feature, "province");
      const provinceName = getFeatureName(feature, "province");

      if (!provinceCode) return;

      setSelectedProvinceData({ code: provinceCode, name: provinceName });

      // Load kab/kota berdasarkan provinsi
      const regencies = loadRegenciesData(provinceCode);

      if (regencies && regencies.features.length > 0) {
        setCurrentLevel("regency");
        setGeoJsonData(regencies);

        // Zoom ke area kab/kota
        if (mapRef.current) {
          const bounds = L.geoJSON(regencies).getBounds();
          mapRef.current.fitBounds(bounds, {
            padding: [50, 50],
            animate: true,
            duration: 1,
            maxZoom: 10,
          });
        }
      } else {
        // Kalau provinsi ga punya data kab/kota, langsung trigger callback parent
        onProvinceSelect?.(provinceCode, provinceName);
      }

      onProvinceSelect?.(provinceCode, provinceName);
    } else {
      // Kalau sudah di level kab/kota → klik kab/kota
      const regencyCode = getFeatureCode(feature, "regency");
      const regencyName = getFeatureName(feature, "regency");

      if (regencyCode && selectedProvinceData) {
        const fullRegencyCode = `${selectedProvinceData.code}.${regencyCode}`;
        onCitySelect?.(fullRegencyCode, regencyName, selectedProvinceData.code);
      }
    }
  };

  // =========================
  // STYLE UNTUK SETIAP FEATURE
  // =========================
  const style = (feature: GeoJSONFeature): L.PathOptions => {
    const featureCode = getFeatureCode(feature, currentLevel);
    const isSelected = selectedProvince === featureCode;

    return {
      fillColor: isSelected ? "#1e40af" : "#dbeafe",
      weight: 1.5,
      opacity: 1,
      color: isSelected ? "#1e3a8a" : "#3b82f6",
      fillOpacity: isSelected ? 0.9 : 0.7,
    };
  };

  return {
    geoJsonData,
    currentLevel,
    loading,
    mapRef,
    style,
    resetToProvinces,
    handleFeatureClick,
    getFeatureName,
    selectedProvinceData,
  };
};
