import { useState, useRef } from "react";
import "./App.css";

const App = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [predictedImage, setPredictedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image file input
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setError(null);
      setPredictedImage(null);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith("image/")) {
      const file = files[0];
      setImage(file);
      setError(null);
      setPredictedImage(null);

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle file upload and call the backend API using fetch
  const handleImageUpload = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", image);

    try {
      // Sending the image to the backend (FastAPI) using fetch
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process image");
      }

      // Convert the response blob to an image URL
      const imageUrl = URL.createObjectURL(await response.blob());
      setPredictedImage(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to process image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setPredictedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">🤸‍♀️ AI Pose Estimation</h1>
          <p className="subtitle">
            Upload an image to detect human poses and visualize keypoints
          </p>
        </header>

        <div className="upload-section">
          <div
            className={`upload-area ${image ? "has-image" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />

            {!imagePreview ? (
              <div className="upload-placeholder">
                <div className="upload-icon">📸</div>
                <p className="upload-text">
                  <strong>Click to upload</strong> or drag and drop
                </p>
                <p className="upload-hint">PNG, JPG, GIF up to 10MB</p>
              </div>
            ) : (
              <div className="image-preview">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="preview-image"
                />
                <div className="image-overlay">
                  <button
                    className="change-image-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Change Image
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={handleImageUpload}
              disabled={!image || loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span className="btn-icon">🚀</span>
                  Analyze Pose
                </>
              )}
            </button>

            {(image || predictedImage) && (
              <button
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                <span className="btn-icon">🔄</span>
                Reset
              </button>
            )}
          </div>
        </div>

        {predictedImage && (
          <div className="results-section">
            <h2 className="results-title">
              <span className="results-icon">✨</span>
              Pose Detection Results
            </h2>
            <div className="results-container">
              <div className="result-image">
                <img src={predictedImage} alt="Processed with Keypoints" />
                <div className="result-caption">
                  Detected keypoints are highlighted in red
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="footer">
          <p>Powered by Roboflow AI • Built with React & FastAPI</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
