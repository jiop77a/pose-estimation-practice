from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from io import BytesIO
import requests
from PIL import Image, ImageDraw
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

# Initialize the FastAPI app
app = FastAPI()

# Allow all origins for development (can be restricted later for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow local frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Get API configuration from environment variables
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL_URL = os.getenv("ROBOFLOW_MODEL_URL")

# Validate that required environment variables are set
if not ROBOFLOW_API_KEY:
    raise ValueError("ROBOFLOW_API_KEY environment variable is required")
if not ROBOFLOW_MODEL_URL:
    raise ValueError("ROBOFLOW_MODEL_URL environment variable is required")


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read the image from the uploaded file
    image = Image.open(file.file)
    img_byte_arr = BytesIO()
    image.save(img_byte_arr, format="JPEG")
    img_byte_arr.seek(0)

    # Send the image to Roboflow for pose estimation
    files = {"file": img_byte_arr}
    headers = {"Authorization": f"Bearer {ROBOFLOW_API_KEY}"}
    response = requests.post(ROBOFLOW_MODEL_URL, files=files, headers=headers)

    # Check if the response from Roboflow is successful
    if response.status_code == 200:
        # Get the keypoints from the JSON response
        predictions = response.json().get("predictions", [])
        if not predictions:
            return {"error": "No predictions found in the response"}

        # Get the keypoints for the first person detected
        keypoints = predictions[0].get("keypoints", [])

        # Draw the keypoints on the image
        draw = ImageDraw.Draw(image)
        for point in keypoints:
            x, y, confidence = (
                int(point["x"]),
                int(point["y"]),
                float(point["confidence"]),
            )
            if confidence < 0.5:
                continue
            draw.ellipse(
                [x - 5, y - 5, x + 5, y + 5], fill="red"
            )  # Draw small red circles for keypoints

        # Save the image with keypoints overlaid
        img_byte_arr = BytesIO()
        image.save(img_byte_arr, format="JPEG")
        img_byte_arr.seek(0)
        return StreamingResponse(img_byte_arr, media_type="image/jpeg")
    else:
        return {"error": "Prediction failed", "details": response.json()}
