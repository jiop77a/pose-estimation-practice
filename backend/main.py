from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from io import BytesIO
import requests
from PIL import Image, ImageDraw

# Initialize the FastAPI app
app = FastAPI()

# Replace with your Roboflow API key
ROBOFLOW_API_KEY = "YOUR_API_KEY_HERE"
ROBOFLOW_MODEL_URL = "https://serverless.roboflow.com/coco-pose-detection/6"


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
            x, y = int(point["x"]), int(point["y"])
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
