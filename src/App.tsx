import React, { useState } from "react";

import "./App.css";
import LeafletMap from "./features/peta/peta";

const App: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  const handleProvinceSelect = (code: string, name: string) => {
    console.log("Province selected:", { code, name });
    setSelectedProvince(code);
    // You can handle province selection here
  };

  const handleCitySelect = (
    code: string,
    name: string,
    provinceCode: string
  ) => {
    console.log("City selected:", { code, name, provinceCode });
    setSelectedCity(code);
    // You can handle city selection here
  };

  return (
    <div className="App">
      <div style={{ width: "100vw", height: "100vh" }}>
        <LeafletMap
          onProvinceSelect={handleProvinceSelect}
          onCitySelect={handleCitySelect}
          selectedProvince={selectedProvince}
        />
      </div>

      {/* Optional: Display selected information */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          background: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        {selectedProvince && <p>Province: {selectedProvince}</p>}
        {selectedCity && <p>City: {selectedCity}</p>}
      </div>
    </div>
  );
};

export default App;
