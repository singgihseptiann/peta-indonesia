import { useState } from "react";

export function useSelectedProvinceAndCity() {
  // State untuk provinsi terpilih
  const [selectedProvince, setSelectedProvince] = useState<{
    code: string;
    name: string;
  } | null>(null);

  // State untuk kota/kabupaten terpilih
  const [selectedCity, setSelectedCity] = useState<{
    code: string;
    name: string;
  } | null>(null);

  // Callback saat user pilih provinsi → reset city juga
  const handleProvinceSelect = (code: string, name: string) => {
    setSelectedProvince({ code, name });
    setSelectedCity(null);
  };

  // Callback saat user pilih kota/kabupaten
  const handleCitySelect = (
    code: string,
    name: string,
    provinceCode: string
  ) => {
    setSelectedCity({ code, name });
  };

  return {
    selectedProvince,
    selectedCity,
    handleProvinceSelect,
    handleCitySelect,
  };
}
