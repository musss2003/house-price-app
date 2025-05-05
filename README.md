# 🏡 House Price Prediction App

This is a full-stack machine learning project that predicts house prices based on various features.  
It uses a custom-built neural network with FastAPI as the backend and a modern React + Vite frontend.

---

## 📁 Project Structure

```
house-price-app/
├── app/                  # FastAPI backend (API logic)
├── model/                # Neural network, saved weights, scalers
├── frontend/             # React + Vite frontend
│   ├── src/              # Frontend source code
│   └── vite.config.ts    # Vite configuration file
├── new_samples.json      # New training data (appended after user submissions)
├── requirements.txt      # Backend Python dependencies
├── README.md             # Project documentation
```

---

## 🚀 Features

- Predict house prices using 11 input features + location category
- Retrain the model dynamically with user-submitted data
- Custom NumPy-based neural network
- Real-time UI with validation and feedback

---

## ⚙️ Getting Started

### ✅ Backend (FastAPI)

1. **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2. **Run the API**:
    ```bash
    uvicorn app.main:app --reload
    ```

3. **Endpoints**:
    - `POST /predict` — Predict house price
    - `POST /retrain` — Retrain the model using saved samples

---

### ✅ Frontend (Vite + React)

1. **Install dependencies**:
    ```bash
    cd frontend
    npm install
    ```

2. **Start development server**:
    ```bash
    npm run dev
    ```

3. **Open in browser**:
    ```
    http://localhost:5173
    ```

---

## 🔄 Retraining

- New samples with actual `true_price` values are stored in `new_samples.json`
- Once enough samples are collected, the backend automatically triggers retraining
- Model weights and scalers are updated and saved in `/model/`

---

## 📦 Deployment

- Backend can be hosted on **Render**, **Railway**, or **Heroku**
- Frontend can be deployed using **Vercel**, **Netlify**, or **GitHub Pages**
- Make sure `model/` persists between deployments

---

## 👨‍💻 Author

**Mustafa Sinanović**  
GitHub: [@musss2003](https://github.com/musss2003)

---

## 🧠 Stack

- **Backend**: FastAPI, NumPy, scikit-learn
- **Frontend**: React, Vite, TypeScript
- **ML Model**: Custom Neural Network (NumPy)
