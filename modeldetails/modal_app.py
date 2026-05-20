"""
Modal.com Deployment for DenseNet121 Dementia Classifier
API endpoint that serves the trained model
"""

import modal
from pathlib import Path

# Initialize Modal app
app = modal.App(name="dementia-classifier-api")

# Get the directory where this script is located
LOCAL_DIR = Path(__file__).parent

# Define a Modal image with necessary dependencies and copy model file into it
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch",
        "torchvision",
        "pillow",
        "numpy",
        "fastapi",
        "python-multipart",
        "pydantic",
    )
    .add_local_file(
        local_path=str(LOCAL_DIR / "densenet121_dementia_final_best_test (1).pth"),
        remote_path="/root/model.pth"
    )
)

# Create a standalone predict function that uses the model
@app.function(image=image, gpu="t4")
def predict_image(image_data: bytes) -> dict:
    """Predict dementia class from image bytes"""
    import torch
    import torch.nn as nn
    from torchvision import models, transforms
    from torchvision.models import DenseNet121_Weights
    from PIL import Image
    import io
    
    try:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {device}")
        
        # Initialize model architecture
        model = models.densenet121(weights=DenseNet121_Weights.DEFAULT)
        num_classes = 4
        model.classifier = nn.Linear(model.classifier.in_features, num_classes)
        
        # Load weights from the model file embedded in the image
        model_path = "/root/model.pth"
        print(f"Loading model from: {model_path}")
        
        checkpoint = torch.load(model_path, map_location=device, weights_only=False)
        model.load_state_dict(checkpoint["model_state_dict"])
        class_names = checkpoint.get("class_names", ["Non", "Mild", "Moderate", "Severe"])
        print(f"Model loaded successfully. Classes: {class_names}")
        
        model = model.to(device)
        model.eval()
        
        # Setup transforms
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ])
        
        # Load and preprocess image
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
        image_tensor = transform(img).unsqueeze(0).to(device)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            predicted_class = outputs.argmax(1).item()
        
        # Prepare response
        confidences = {
            class_names[i]: float(probabilities[i].cpu())
            for i in range(len(class_names))
        }
        
        return {
            "prediction": class_names[predicted_class],
            "confidence": float(probabilities[predicted_class].cpu()),
            "all_probabilities": confidences
        }
    except Exception as e:
        import traceback
        return {"error": f"Error processing image: {str(e)}", "traceback": traceback.format_exc()}


# Mount the FastAPI app to Modal
@app.function(image=image)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, UploadFile, File
    from fastapi.middleware.cors import CORSMiddleware
    
    web_app = FastAPI(title="Dementia Classifier API")
    
    # Add CORS middleware to allow requests from any origin
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @web_app.post("/predict")
    async def predict(file: UploadFile = File(...)):
        """
        Upload an MRI image and get dementia classification
        """
        try:
            if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
                return {"error": "File must be an image (JPG, PNG, or WebP)"}
            
            image_data = await file.read()
            result = predict_image.remote(image_data)
            return result
        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}
    
    @web_app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {"status": "healthy", "model": "DenseNet121 Dementia Classifier"}
    
    @web_app.get("/classes")
    async def get_classes():
        """Get available classification classes"""
        return {"classes": ["Non", "Mild", "Moderate", "Severe"]}
    
    return web_app


if __name__ == "__main__":
    print("To deploy this app to Modal, run:")
    print("modal deploy modal_app.py")
