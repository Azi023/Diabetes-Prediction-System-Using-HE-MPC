import numpy as np
import joblib
from tensorflow.keras.models import load_model as keras_load_model


protection_data = joblib.load("models/protection_config.pkl")
scaler = protection_data["scaler"]
threshold = float(protection_data["threshold"])

autoencoder = keras_load_model("models/autoencoder_model.h5", compile=False)

def detect_attack(input_array):
    x = np.asarray(input_array, dtype=float).reshape(1, -1)

    n_expected = getattr(scaler, "n_features_in_", x.shape[1])
    if x.shape[1] != n_expected:
        raise ValueError(f"Protection scaler expects {n_expected} features, got {x.shape[1]}.")

    x_scaled = scaler.transform(x)
    recon = autoencoder.predict(x_scaled, verbose=0)
    mse = float(np.mean((x_scaled - recon) ** 2))
    return (mse > threshold), mse
