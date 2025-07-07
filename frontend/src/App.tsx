import { useState } from "react";

const App = () => {
  const [image, setImage] = useState<File | null>(null);
  const [predictedImage, setPredictedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle image file input
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // Handle file upload and call the backend API using fetch
  const handleImageUpload = async () => {
    if (!image) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", image);

    try {
      // Sending the image to the backend (FastAPI) using fetch
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      // Convert the response blob to an image URL
      const imageUrl = URL.createObjectURL(await response.blob());
      setPredictedImage(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Pose Estimation Demo</h1>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <button onClick={handleImageUpload} disabled={loading}>
        {loading ? "Processing..." : "Upload Image"}
      </button>

      {predictedImage && (
        <div>
          <h2>Processed Image with Keypoints</h2>
          <img src={predictedImage} alt="Processed with Keypoints" />
        </div>
      )}
    </div>
  );
};

export default App;
