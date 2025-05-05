import type React from "react";

import { useState } from "react";
import axios from "axios";
import "./App.css";

interface PredictedPriceResponse {
  predicted_price: number;
}

export interface PredictionRequest {
  numerical: number[];
  ocean_proximity: string;
  true_price?: number; // optional, so it doesn't break if omitted
}

// Sample data sets for quick filling
const sampleDataSets = {
  "Coastal Luxury": {
    numerical: [
      "-122.20", // Longitude
      "37.85", // Latitude
      "40", // Housing Median Age
      "882", // Total Rooms
      "131", // Total Bedrooms
      "323", // Population
      "126", // Households
      "8.3", // Median Income
      "7.0", // Rooms per Household
      "0.15", // Bedrooms per Room
      "2.5", // Population per Household
      "426000"
    ],
    ocean: "NEAR BAY",
  },
  "Suburban Family": {
    numerical: [
      "-118.10",
      "34.20",
      "30",
      "1602",
      "301",
      "1103",
      "341",
      "5.6",
      "4.8",
      "0.18",
      "3.2",
      "426000"
    ],
    ocean: "<1H OCEAN",
  },
  "Rural Retreat": {
    numerical: [
      "-119.80",
      "36.25",
      "20",
      "1452",
      "271",
      "503",
      "231",
      "3.7",
      "6.1",
      "0.19",
      "2.1",
      "426000"
    ],
    ocean: "INLAND",
  },
};

// Feature information with descriptions and typical ranges
const featureInfo = [
  {
    name: "Longitude",
    description: "Geographic coordinate (west is negative)",
    icon: "🌐",
    min: -124.3,
    max: -114.3,
    step: 0.01,
    group: "location",
  },
  {
    name: "Latitude",
    description: "Geographic coordinate (north is positive)",
    icon: "🌐",
    min: 32.5,
    max: 42.5,
    step: 0.01,
    group: "location",
  },
  {
    name: "Housing Median Age",
    description: "Median age of houses in the block",
    icon: "🏠",
    min: 1,
    max: 52,
    step: 1,
    group: "property",
  },
  {
    name: "Total Rooms",
    description: "Total number of rooms in the block",
    icon: "🚪",
    min: 2,
    max: 39320,
    step: 10,
    group: "property",
  },
  {
    name: "Total Bedrooms",
    description: "Total number of bedrooms in the block",
    icon: "🛏️",
    min: 1,
    max: 6445,
    step: 5,
    group: "property",
  },
  {
    name: "Population",
    description: "Number of people living in the block",
    icon: "👥",
    min: 3,
    max: 35682,
    step: 10,
    group: "demographics",
  },
  {
    name: "Households",
    description: "Number of households in the block",
    icon: "👪",
    min: 1,
    max: 6082,
    step: 5,
    group: "demographics",
  },
  {
    name: "Median Income",
    description: "Median income in tens of thousands of dollars",
    icon: "💰",
    min: 0.5,
    max: 15,
    step: 0.1,
    group: "economics",
  },
  {
    name: "Rooms per Household",
    description: "Average number of rooms per household",
    icon: "🏡",
    min: 0.5,
    max: 141.9,
    step: 0.1,
    group: "derived",
  },
  {
    name: "Bedrooms per Room",
    description: "Ratio of bedrooms to total rooms",
    icon: "🛌",
    min: 0,
    max: 1,
    step: 0.01,
    group: "derived",
  },
  {
    name: "Population per Household",
    description: "Average number of people per household",
    icon: "👨‍👩‍👧‍👦",
    min: 0.5,
    max: 1243.3,
    step: 0.1,
    group: "derived",
  },
  {
    name: "True Price",
    description: "Actual house price used for supervised retraining (optional)",
    icon: "📈",
    min: 10000,
    max: 5000000,
    step: 1000,
    group: "target",
  },
];

// Group definitions
const groups = {
  location: { title: "Location", icon: "📍", color: "#3b82f6" },
  property: { title: "Property Details", icon: "🏘️", color: "#10b981" },
  demographics: { title: "Demographics", icon: "👥", color: "#f59e0b" },
  economics: { title: "Economics", icon: "💵", color: "#8b5cf6" },
  derived: { title: "Derived Metrics", icon: "📊", color: "#ec4899" },
  target: { title: "Target", icon: "📈", color: "#ec4899" },
};

function App() {
  const [numerical, setNumerical] = useState<string[]>(Array(12).fill(""));
  const [ocean, setOcean] = useState<string>("NEAR BAY");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("form");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);


  const handleNumericalChange = (index: number, value: string) => {
    const updated = [...numerical];
    updated[index] = value;
    setNumerical(updated);
  };

  const handleReset = () => {
    setNumerical(Array(11).fill(""));
    setOcean("NEAR BAY");
    setResult(null);
    setError(null);
  };

  const handleFillSample = (sampleName: string) => {
    const sample = sampleDataSets[sampleName as keyof typeof sampleDataSets];
    setNumerical([...sample.numerical]);
    setOcean(sample.ocean);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const response = await axios.post<PredictedPriceResponse>(
        "https://house-price-app-bk3h.onrender.com/predict",
        {
          numerical: numerical.map(Number),
          ocean_proximity: ocean
        }
      );

      setResult(response.data.predicted_price);
      setActiveTab("result");
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as { response?: { data?: { error?: string } } };
        setError(err.response?.data?.error || "Unexpected error occurred.");
      } else {
        setError("Unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Group features by their group property
  const groupedFeatures: Record<string, typeof featureInfo> = {};
  featureInfo.forEach((feature) => {
    if (!groupedFeatures[feature.group]) {
      groupedFeatures[feature.group] = [];
    }
    groupedFeatures[feature.group].push(feature);
  });

  // Calculate completion percentage
  const filledFields = numerical.filter((val) => val !== "").length;
  const completionPercentage = Math.round(
    (filledFields / numerical.length) * 100
  );

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">House Price Predictor</h1>
          <p className="card-description">
            Predict California house prices based on housing metrics
          </p>

          <div className="tabs">
            <button
              className={`tab ${activeTab === "form" ? "active" : ""}`}
              onClick={() => setActiveTab("form")}
            >
              Input Form
            </button>
            <button
              className={`tab ${activeTab === "result" ? "active" : ""}`}
              onClick={() => setActiveTab("result")}
              disabled={result === null}
            >
              Results
            </button>
          </div>
        </div>

        {activeTab === "form" && (
          <div className="card-content">
            <div className="sample-data-section">
              <h3>Quick Start with Sample Data</h3>
              <p>
                Don't want to enter all values manually? Use one of our sample
                datasets:
              </p>
              <div className="sample-buttons">
                {Object.keys(sampleDataSets).map((sampleName) => (
                  <button
                    key={sampleName}
                    className="button button-sample"
                    onClick={() => handleFillSample(sampleName)}
                  >
                    {sampleName}
                  </button>
                ))}
              </div>
            </div>

            <div className="completion-bar-container">
              <div className="completion-label">
                Form completion: {completionPercentage}%
              </div>
              <div className="completion-bar">
                <div
                  className="completion-progress"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="group-navigation">
              {Object.entries(groups).map(([groupKey, groupData]) => (
                <button
                  key={groupKey}
                  className={`group-button ${
                    activeGroup === groupKey ? "active" : ""
                  }`}
                  onClick={() =>
                    setActiveGroup(groupKey === activeGroup ? null : groupKey)
                  }
                  style={{
                    borderColor: groupData.color,
                    backgroundColor:
                      activeGroup === groupKey
                        ? `${groupData.color}20`
                        : "transparent",
                  }}
                >
                  <span className="group-icon">{groupData.icon}</span>
                  <span>{groupData.title}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {(activeGroup === null
                ? Object.keys(groupedFeatures)
                : [activeGroup]
              ).map((groupKey) => (
                <div key={groupKey} className="feature-group">
                  <div
                    className="group-header"
                    style={{
                      borderColor:
                        groups[groupKey as keyof typeof groups].color,
                    }}
                  >
                    <span className="group-icon">
                      {groups[groupKey as keyof typeof groups].icon}
                    </span>
                    <h3>{groups[groupKey as keyof typeof groups].title}</h3>
                  </div>

                  <div className="input-grid">
                    {groupedFeatures[groupKey].map((feature, idx) => {
                      const featureIndex = featureInfo.findIndex(
                        (f) => f.name === feature.name
                      );
                      return (
                        <div key={idx} className="form-group">
                          <label
                            htmlFor={`feature-${featureIndex}`}
                            className="form-label"
                          >
                            <span className="feature-icon">{feature.icon}</span>
                            {feature.name}
                            <span className="tooltip">
                              <span className="tooltip-icon">ⓘ</span>
                              <span className="tooltip-text">
                                {feature.description}
                              </span>
                            </span>
                          </label>

                          <div className="input-with-range">
                            <input
                              id={`feature-${featureIndex}`}
                              type="number"
                              value={numerical[featureIndex]}
                              onChange={(e) =>
                                handleNumericalChange(
                                  featureIndex,
                                  e.target.value
                                )
                              }
                              placeholder={`e.g. ${(
                                (feature.min + feature.max) /
                                2
                              ).toFixed(2)}`}
                              required
                              className="form-input"
                              step={feature.step}
                              min={feature.min}
                              max={feature.max}
                            />
                            <input
                              type="range"
                              value={
                                numerical[featureIndex] === ""
                                  ? (feature.min + feature.max) / 2
                                  : numerical[featureIndex]
                              }
                              onChange={(e) =>
                                handleNumericalChange(
                                  featureIndex,
                                  e.target.value
                                )
                              }
                              min={feature.min}
                              max={feature.max}
                              step={feature.step}
                              className="form-range"
                            />
                            <div className="range-labels">
                              <span>{feature.min}</span>
                              <span>{feature.max}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="feature-group">
                <div
                  className="group-header"
                  style={{ borderColor: "#64748b" }}
                >
                  <span className="group-icon">🌊</span>
                  <h3>Ocean Proximity</h3>
                </div>

                <div className="ocean-proximity-selector">
                  <label htmlFor="ocean-proximity" className="form-label">
                    How close is the property to the ocean?
                    <span className="tooltip">
                      <span className="tooltip-icon">ⓘ</span>
                      <span className="tooltip-text">
                        The proximity of the house to the ocean or bay
                      </span>
                    </span>
                  </label>

                  <div className="ocean-buttons">
                    {[
                      "NEAR BAY",
                      "<1H OCEAN",
                      "INLAND",
                      "NEAR OCEAN",
                      "ISLAND",
                    ].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`ocean-button ${
                          ocean === option ? "active" : ""
                        }`}
                        onClick={() => setOcean(option)}
                      >
                        {option === "NEAR BAY" && "🏙️ "}
                        {option === "<1H OCEAN" && "🚗 "}
                        {option === "INLAND" && "🏞️ "}
                        {option === "NEAR OCEAN" && "🌊 "}
                        {option === "ISLAND" && "🏝️ "}
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="button-group">
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Predicting...
                    </>
                  ) : (
                    "Predict Price"
                  )}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset Form
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "result" && result !== null && (
          <div className="card-content result-tab">
            <div className="result-container">
              <div className="result-header">
                <h2>Prediction Results</h2>
                <p>Based on the housing metrics you provided</p>
              </div>

              <div className="result-box">
                <div className="result-icon">💰</div>
                <div className="result-details">
                  <span className="result-label">Predicted House Price:</span>
                  <span className="result-value">
                    $
                    {result.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="result-summary">
                <h3>Key Factors</h3>
                <div className="factors-grid">
                  <div className="factor">
                    <span className="factor-icon">📍</span>
                    <span className="factor-label">Location</span>
                    <span className="factor-value">
                      {numerical[0] && numerical[1]
                        ? `${numerical[0]}, ${numerical[1]}`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="factor">
                    <span className="factor-icon">🌊</span>
                    <span className="factor-label">Ocean Proximity</span>
                    <span className="factor-value">{ocean}</span>
                  </div>
                  <div className="factor">
                    <span className="factor-icon">💰</span>
                    <span className="factor-label">Median Income</span>
                    <span className="factor-value">
                      {numerical[7]
                        ? `$${(Number(numerical[7]) * 10000).toLocaleString()}`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="factor">
                    <span className="factor-icon">🏠</span>
                    <span className="factor-label">Housing Age</span>
                    <span className="factor-value">
                      {numerical[2] ? `${numerical[2]} years` : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="result-actions">
                <button
                  className="button button-primary"
                  onClick={() => setActiveTab("form")}
                >
                  Modify Inputs
                </button>
                <button
                  className="button button-secondary"
                  onClick={handleReset}
                >
                  Start New Prediction
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card-footer">
          {error && <div className="error-alert">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default App;
