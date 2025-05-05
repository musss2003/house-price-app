import numpy as np
import pandas as pd
import pickle
import os
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, RobustScaler
from model.neural_network import NeuralNetwork

CSV_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'model', 'housing.csv')

NEW_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'model', 'new_samples.json')

model_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'weights.npz')

x_scaler_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'x_scaler.pkl')

y_scaler_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'y_scaler.pkl')




def safe_division(a, b):
    with np.errstate(divide='ignore', invalid='ignore'):
        result = np.true_divide(a, b)
        result[~np.isfinite(result)] = 0
    return result

def run_retraining_process():
    print("✅ Retraining started...")

    # Load original CSV data
    original_data = pd.read_csv(CSV_DATA_PATH)

    # Feature engineering on original data
    original_data['total_rooms'] = original_data['total_rooms'].replace(0, 1)
    original_data['households'] = original_data['households'].replace(0, 1)
    original_data['total_bedrooms'] = original_data['total_bedrooms'].replace(0, 1)

    original_data['rooms_per_household'] = safe_division(original_data['total_rooms'], original_data['households'])
    original_data['bedrooms_per_room'] = safe_division(original_data['total_bedrooms'], original_data['total_rooms'])
    original_data['population_per_household'] = safe_division(original_data['population'], original_data['households'])

    num_features = [
        'longitude', 'latitude', 'housing_median_age', 'total_rooms',
        'total_bedrooms', 'population', 'households', 'median_income',
        'rooms_per_household', 'bedrooms_per_room', 'population_per_household'
    ]

    train_data, _ = train_test_split(original_data, test_size=0.2, random_state=42)

    encoder = OneHotEncoder()
    X_original = np.hstack([
        train_data[num_features].values,
        encoder.fit_transform(train_data[['ocean_proximity']]).toarray()
    ])
    y_original = np.log1p(train_data['median_house_value'].values).reshape(-1, 1)

    # Load new JSON data (already preprocessed and encoded)
    if os.path.exists(NEW_DATA_PATH):
        with open(NEW_DATA_PATH, "r") as f:
            new_samples = json.load(f)
        if new_samples:
            X_new = np.array([entry["features"] for entry in new_samples])
            y_new = np.log1p(np.array([entry["target"] for entry in new_samples]).reshape(-1, 1))
        else:
            X_new = np.empty((0, 16))
            y_new = np.empty((0, 1))
    else:
        X_new = np.empty((0, 16))
        y_new = np.empty((0, 1))

    # Combine
    X_combined = np.vstack([X_original, X_new])
    y_combined = np.vstack([y_original, y_new])

    # Scale
    X_scaler = RobustScaler()
    y_scaler = RobustScaler()

    X_scaled = X_scaler.fit_transform(X_combined)
    y_scaled = y_scaler.fit_transform(y_combined)

    # Train the model
    nn = NeuralNetwork(input_size=X_scaled.shape[1])
    epochs = 500
    batch_size = 128

    for epoch in range(epochs):
        indices = np.random.permutation(len(X_scaled))
        for i in range(0, len(X_scaled), batch_size):
            X_batch = X_scaled[indices[i:i+batch_size]]
            y_batch = y_scaled[indices[i:i+batch_size]]
            y_pred = nn.forward(X_batch)
            nn.backward(X_batch, y_batch, y_pred)

    # Save model
    nn.save(model_path)
    with open(x_scaler_path, "wb") as f:
        pickle.dump(X_scaler, f)
    with open(y_scaler_path, "wb") as f:
        pickle.dump(y_scaler, f)

    # Clear the new data file
    with open(NEW_DATA_PATH, "w") as f:
        json.dump([], f)

    print("✅ Retraining complete and model saved.")
