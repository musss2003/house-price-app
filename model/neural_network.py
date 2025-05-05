import numpy as np

# ----------------------
# 2. Neural Network
# ----------------------

class NeuralNetwork:
    def __init__(self, input_size, l2_lambda=0.01):
        # Layer sizes
        hidden1 = 64
        hidden2 = 32
        hidden3 = 16
        output_size = 1

        # He initialization
        self.W1 = np.random.randn(input_size, hidden1) * np.sqrt(2. / input_size)
        self.b1 = np.zeros((1, hidden1))
        self.W2 = np.random.randn(hidden1, hidden2) * np.sqrt(2. / hidden1)
        self.b2 = np.zeros((1, hidden2))
        self.W3 = np.random.randn(hidden2, hidden3) * np.sqrt(2. / hidden2)
        self.b3 = np.zeros((1, hidden3))
        self.W4 = np.random.randn(hidden3, output_size) * np.sqrt(2. / hidden3)
        self.b4 = np.zeros((1, output_size))

        self.l2_lambda = l2_lambda

        # Initialize Adam optimizer parameters
        self.v = {key: 0 for key in ['W1', 'b1', 'W2', 'b2', 'W3', 'b3', 'W4', 'b4']}
        self.s = {key: 0 for key in ['W1', 'b1', 'W2', 'b2', 'W3', 'b3', 'W4', 'b4']}
        self.t = 0  # time step

    def relu(self, x):
        return np.maximum(0, x)

    def relu_derivative(self, x):
        return (x > 0).astype(float)

    def forward(self, X):
        self.z1 = np.dot(X, self.W1) + self.b1
        self.a1 = self.relu(self.z1)
        self.z2 = np.dot(self.a1, self.W2) + self.b2
        self.a2 = self.relu(self.z2)
        self.z3 = np.dot(self.a2, self.W3) + self.b3
        self.a3 = self.relu(self.z3)
        self.z4 = np.dot(self.a3, self.W4) + self.b4
        return self.z4

    def mse_loss(self, y_true, y_pred):
        return np.mean((y_true - y_pred) ** 2) + self.l2_reg()

    def l2_reg(self):
        return 0.5 * self.l2_lambda * (
            np.sum(self.W1 ** 2) + np.sum(self.W2 ** 2) +
            np.sum(self.W3 ** 2) + np.sum(self.W4 ** 2)
        )

    def backward(self, X, y, y_pred, learning_rate=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8):
        m = X.shape[0]

        # Gradients
        grads = {}
        dL_dz4 = (y_pred - y) / m
        grads['W4'] = np.dot(self.a3.T, dL_dz4) + self.l2_lambda * self.W4
        grads['b4'] = np.sum(dL_dz4, axis=0, keepdims=True)

        dL_da3 = np.dot(dL_dz4, self.W4.T)
        dL_dz3 = dL_da3 * self.relu_derivative(self.z3)
        grads['W3'] = np.dot(self.a2.T, dL_dz3) + self.l2_lambda * self.W3
        grads['b3'] = np.sum(dL_dz3, axis=0, keepdims=True)

        dL_da2 = np.dot(dL_dz3, self.W3.T)
        dL_dz2 = dL_da2 * self.relu_derivative(self.z2)
        grads['W2'] = np.dot(self.a1.T, dL_dz2) + self.l2_lambda * self.W2
        grads['b2'] = np.sum(dL_dz2, axis=0, keepdims=True)

        dL_da1 = np.dot(dL_dz2, self.W2.T)
        dL_dz1 = dL_da1 * self.relu_derivative(self.z1)
        grads['W1'] = np.dot(X.T, dL_dz1) + self.l2_lambda * self.W1
        grads['b1'] = np.sum(dL_dz1, axis=0, keepdims=True)

        # Update time step
        self.t += 1

        # Update parameters with Adam
        for param in ['W1', 'b1', 'W2', 'b2', 'W3', 'b3', 'W4', 'b4']:
            # Moving averages of gradient and squared gradient
            self.v[param] = beta1 * self.v[param] + (1 - beta1) * grads[param]
            self.s[param] = beta2 * self.s[param] + (1 - beta2) * (grads[param] ** 2)

            # Bias correction
            v_corrected = self.v[param] / (1 - beta1 ** self.t)
            s_corrected = self.s[param] / (1 - beta2 ** self.t)

            # Update
            setattr(self, param, getattr(self, param) - learning_rate * v_corrected / (np.sqrt(s_corrected) + epsilon))

    def save(self, path):
        import pickle
        weights = {
            'W1': self.W1, 'b1': self.b1,
            'W2': self.W2, 'b2': self.b2,
            'W3': self.W3, 'b3': self.b3,
            'W4': self.W4, 'b4': self.b4,
        }
        with open(path, "wb") as f:
            pickle.dump(weights, f)

    def load(self, path):
        import pickle
        with open(path, "rb") as f:
            weights = pickle.load(f)
        self.W1 = weights['W1']
        self.b1 = weights['b1']
        self.W2 = weights['W2']
        self.b2 = weights['b2']
        self.W3 = weights['W3']
        self.b3 = weights['b3']
        self.W4 = weights['W4']
        self.b4 = weights['b4']
