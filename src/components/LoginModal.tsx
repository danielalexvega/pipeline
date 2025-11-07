import { FC, useState, FormEvent } from "react";
import { useLogin } from "../context/LoginContext";
import { useTheme } from "../context/ThemeContext";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const LoginModal: FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useLogin();
  const { isDarkMode } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    const success = login(username, password);
    if (success) {
      // Reset form and close modal
      setUsername("");
      setPassword("");
      setError("");
      onClose();
    } else {
      setError("Invalid username. Please try again.");
    }
  };

  const handleClose = () => {
    setUsername("");
    setPassword("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className={`${
          isDarkMode ? "bg-grey-dark" : "bg-white"
        } rounded-lg shadow-xl w-full max-w-md mx-4 p-6`}
        style={isDarkMode ? { backgroundColor: 'var(--color-grey-dark)' } : {}}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            className={`text-2xl font-bold ${
              isDarkMode ? "text-white" : "text-darkGreen"
            }`}
          >
            Login
          </h2>
          <button
            onClick={handleClose}
            className={`${
              isDarkMode ? "text-white hover:text-grey-light" : "text-grey hover:text-darkGreen"
            } text-2xl font-bold transition-colors`}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="username"
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-white" : "text-darkGreen"
              }`}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-azure ${
                isDarkMode
                  ? "border-grey-light text-white"
                  : "bg-white border-darkGreen text-darkGreen"
              }`}
              style={isDarkMode ? { 
                backgroundColor: 'var(--color-grey-dark)',
                borderColor: 'var(--color-grey-light)'
              } : {}}
              placeholder="Enter username"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-white" : "text-darkGreen"
              }`}
            >
              Password (optional)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-azure ${
                isDarkMode
                  ? "border-grey-light text-white"
                  : "bg-white border-darkGreen text-darkGreen"
              }`}
              style={isDarkMode ? { 
                backgroundColor: 'var(--color-grey-dark)',
                borderColor: 'var(--color-grey-light)'
              } : {}}
              placeholder="Enter password (optional)"
            />
          </div>

          {error && (
            <div
              className={`p-3 rounded-md text-sm ${
                isDarkMode
                  ? "bg-red-900/30 text-red-200 border border-red-700"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`mt-2 px-6 py-2 rounded-md font-medium transition-colors ${
              isDarkMode
                ? "bg-white text-grey-dark hover:bg-grey-light"
                : "bg-darkGreen text-white hover:bg-grey-dark"
            }`}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;

