from fastapi import FastAPI
from fastapi import BackgroundTasks
from app.schemas import HouseFeatures
from app.utils import encode_ocean_proximity
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
from model.neural_network import NeuralNetwork
import pickle
import os
import json
from typing import List

COUNTER_PATH = os.path.join(os.path.dirname(__file__), '..', 'model', 'counter.json')
RETRAIN_THRESHOLD = 10

app = FastAPI()

# Add this before your routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://house-price-app.vercel.app"],  # Frontend dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'weights.npz')

x_scaler_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'x_scaler.pkl')

y_scaler_path = os.path.join(os.path.dirname(__file__), '..', 'model', 'y_scaler.pkl')

NEW_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'model', 'new_samples.json')



# Load scalers
with open(x_scaler_path, "rb") as f:
    X_scaler = pickle.load(f)
with open(y_scaler_path, "rb") as f:
    y_scaler = pickle.load(f)

# Load model
nn = NeuralNetwork(input_size=16)
nn.load(model_path)

@app.post("/predict")
def predict(data: HouseFeatures, background_tasks: BackgroundTasks):
    try:
        if len(data.numerical) != 12:
            return {"error": "Expected 12 numerical features (including true_price)."}

        # Extract features and true_price
        numerical = data.numerical[:11]
        true_price = data.numerical[11]

        encoded = encode_ocean_proximity(data.ocean_proximity)
        features = np.array(numerical + encoded).reshape(1, -1)

        features_scaled = X_scaler.transform(features)
        pred_scaled = nn.forward(features_scaled)
        pred = np.expm1(y_scaler.inverse_transform(pred_scaled))

        # Optionally store true_price for retraining
        save_new_sample(numerical, data.ocean_proximity, true_price)

        if increment_counter_and_check():
            from app.training import run_retraining_process
            background_tasks.add_task(run_retraining_process)

        return {"predicted_price": float(pred[0, 0])}

    except Exception as e:
        return {"error": str(e)}


# Ensure the file exists
def initialize_store():
    if not os.path.exists(NEW_DATA_PATH):
        with open(NEW_DATA_PATH, 'w') as f:
            json.dump([], f)

def save_new_sample(numerical: List[float], ocean_proximity: str, true_price: float):
    initialize_store()
    # Combine numerical and encoded categorical features
    encoded = encode_ocean_proximity(ocean_proximity)  # returns list of 5 values
    features = numerical + encoded

    new_entry = {"features": features, "target": true_price}

    with open(NEW_DATA_PATH, 'r+') as f:
        data = json.load(f)
        data.append(new_entry)
        f.seek(0)
        json.dump(data, f, indent=2)

def load_new_samples():
    initialize_store()
    with open(NEW_DATA_PATH, 'r') as f:
        return json.load(f)

def clear_new_samples():
    with open(NEW_DATA_PATH, 'w') as f:
        json.dump([], f)


def increment_counter_and_check():
    if not os.path.exists(COUNTER_PATH):
        with open(COUNTER_PATH, "w") as f:
            json.dump({"count": 0}, f)

    with open(COUNTER_PATH, "r+") as f:
        data = json.load(f)
        data["count"] += 1

        should_retrain = data["count"] >= RETRAIN_THRESHOLD

        if should_retrain:
            data["count"] = 0  # Reset counter

        f.seek(0)
        json.dump(data, f, indent=2)
        f.truncate()

    return should_retrain
