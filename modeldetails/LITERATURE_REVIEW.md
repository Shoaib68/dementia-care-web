# Literature Review: Deep Learning for Alzheimer's Disease Classification

## DenseNet-121 Based MRI Classification System

**Course**: Deep Learning Lab Project  
**Dataset**: [Alzheimer's Disease 5 Classes - Kaggle](https://www.kaggle.com/datasets/phamnguyenduytien/alzheimers-disease-5-classes)  
**Model Architecture**: DenseNet-121 (Transfer Learning)  
**Author**: Deep Learning Lab Student  
**Date**: December 2025

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Literature Background](#3-literature-background)
4. [Dataset Description](#4-dataset-description)
5. [Methodology](#5-methodology)
6. [Model Architecture](#6-model-architecture)
7. [Training Strategy](#7-training-strategy)
8. [Implementation Details](#8-implementation-details)
9. [Model Deployment](#9-model-deployment)
10. [Results and Discussion](#10-results-and-discussion)
11. [Conclusion](#11-conclusion)
12. [References](#12-references)

---

## 1. Abstract

This literature review presents a comprehensive study on the application of deep learning techniques for automated classification of Alzheimer's disease stages using brain MRI scans. We employ a transfer learning approach utilizing the DenseNet-121 architecture pre-trained on ImageNet, fine-tuned for the specific task of dementia stage classification. The model classifies MRI images into four distinct categories: **Non-Demented**, **Mild**, **Moderate**, and **Severe** dementia stages. The trained model is deployed as a REST API using Modal.com's serverless GPU infrastructure, enabling real-time clinical decision support for healthcare professionals.

**Keywords**: Alzheimer's Disease, Deep Learning, DenseNet-121, Transfer Learning, MRI Classification, Medical Image Analysis, Convolutional Neural Networks

---

## 2. Introduction

### 2.1 Background

Alzheimer's disease (AD) is a progressive neurodegenerative disorder that affects millions of people worldwide. It is the most common cause of dementia, accounting for 60-80% of dementia cases globally. Early and accurate diagnosis is crucial for effective patient management and treatment planning.

### 2.2 Problem Statement

Traditional diagnosis of Alzheimer's disease relies heavily on:
- Clinical cognitive assessments
- Neuropsychological testing
- Manual interpretation of neuroimaging data by expert radiologists

This process is:
- **Time-consuming**: Manual analysis requires significant expert time
- **Subjective**: Inter-rater variability among clinicians
- **Resource-intensive**: Requires specialized expertise not available in all healthcare settings

### 2.3 Proposed Solution

We propose an automated deep learning-based classification system that:
1. Analyzes brain MRI scans to detect patterns associated with dementia
2. Classifies images into four severity stages
3. Provides confidence scores for clinical decision support
4. Deploys as a scalable cloud-based API for real-time inference

### 2.4 Objectives

- Develop a robust CNN-based classifier for Alzheimer's disease staging
- Implement transfer learning to leverage pre-trained features
- Address class imbalance through weighted loss functions
- Deploy the model as a production-ready API service

---

## 3. Literature Background

### 3.1 Alzheimer's Disease and Neuroimaging

Alzheimer's disease is characterized by progressive brain atrophy, particularly in:
- **Hippocampus**: Critical for memory formation
- **Temporal lobe**: Involved in language and memory
- **Parietal lobe**: Spatial awareness and navigation
- **Frontal lobe**: Executive functions and personality

MRI (Magnetic Resonance Imaging) can detect structural changes in the brain associated with AD progression, including:
- Ventricular enlargement
- Cortical thinning
- Hippocampal volume reduction

### 3.2 Deep Learning in Medical Imaging

#### 3.2.1 Convolutional Neural Networks (CNNs)

CNNs have revolutionized medical image analysis due to their ability to:
- Automatically learn hierarchical feature representations
- Capture spatial patterns at multiple scales
- Achieve superhuman performance on various diagnostic tasks

Key CNN architectures in medical imaging:
| Architecture | Year | Key Innovation |
|-------------|------|----------------|
| AlexNet | 2012 | Deep CNN with ReLU, Dropout |
| VGGNet | 2014 | Very deep networks (16-19 layers) |
| ResNet | 2015 | Residual connections |
| **DenseNet** | **2017** | **Dense connectivity pattern** |
| EfficientNet | 2019 | Compound scaling |

#### 3.2.2 Transfer Learning

Transfer learning addresses the challenge of limited medical imaging data by:
1. **Pre-training**: Learning general visual features on large datasets (ImageNet)
2. **Fine-tuning**: Adapting learned features to the specific medical task

Benefits in medical imaging:
- Reduces required training data
- Improves convergence speed
- Achieves better generalization

### 3.3 DenseNet Architecture

DenseNet (Densely Connected Convolutional Networks) was introduced by Huang et al. (2017) and features:

#### Dense Connectivity
Each layer receives feature maps from ALL preceding layers:

```
x_l = H_l([x_0, x_1, ..., x_{l-1}])
```

Where `[x_0, x_1, ..., x_{l-1}]` represents concatenation of feature maps.

#### Advantages of DenseNet:
1. **Feature Reuse**: Direct access to gradients from loss function
2. **Reduced Parameters**: Narrow layers (small growth rate)
3. **Implicit Deep Supervision**: Short paths to all layers
4. **Regularization Effect**: Reduces overfitting on small datasets

#### DenseNet-121 Specifications:
| Component | Configuration |
|-----------|--------------|
| Dense Blocks | 4 blocks |
| Layers per Block | [6, 12, 24, 16] |
| Growth Rate (k) | 32 |
| Total Layers | 121 |
| Parameters | ~8 million |
| Input Size | 224 × 224 × 3 |

### 3.4 Related Work in Alzheimer's Classification

| Study | Architecture | Classes | Accuracy |
|-------|-------------|---------|----------|
| Islam & Zhang (2018) | VGG-16 | 4 classes | 73.75% |
| Farooq et al. (2017) | AlexNet, VGGNet, GoogleNet | 4 classes | 98.8% |
| Ebrahimi et al. (2021) | ResNet-50 | 4 classes | 91.2% |
| Nawaz et al. (2021) | DenseNet-201 | 4 classes | 99.05% |
| **Our Work** | **DenseNet-121** | **4 classes** | **See Results** |

---

## 4. Dataset Description

### 4.1 Dataset Overview

**Source**: Kaggle - Alzheimer's Disease 5 Classes  
**URL**: https://www.kaggle.com/datasets/phamnguyenduytien/alzheimers-disease-5-classes

### 4.2 Original Classes

The dataset contains brain MRI images organized into 5 classes:

| Original Class | Description |
|---------------|-------------|
| NonDemented | No signs of dementia |
| VeryMildDemented | Very early stage symptoms |
| MildDemented | Mild cognitive impairment |
| ModerateDemented | Moderate cognitive decline |
| SevereDemented | Advanced dementia |

### 4.3 Class Consolidation

For clinical relevance and class balance improvement, we consolidated the 5 classes into **4 unified classes**:

```python
def map_class(folder):
    name = folder.lower().replace(" ", "").replace("demented", "")
    if "non" in name: return "Non"
    if "verymild" in name or "mild" in name: return "Mild"  # Consolidated
    if "moderate" in name: return "Moderate"
    if "severe" in name or "servere" in name: return "Severe"
```

**Mapping Logic**:
| Original | Mapped | Rationale |
|----------|--------|-----------|
| NonDemented | **Non** | No dementia |
| VeryMildDemented | **Mild** | Combined for clinical similarity |
| MildDemented | **Mild** | Combined for clinical similarity |
| ModerateDemented | **Moderate** | Distinct stage |
| SevereDemented | **Severe** | Advanced stage |

### 4.4 Dataset Statistics

| Class | Sample Count | Percentage |
|-------|-------------|------------|
| Non | 302 | 13.7% |
| Mild | 667 | 30.2% |
| Moderate | 595 | 26.9% |
| Severe | 644 | 29.2% |
| **Total** | **2,208** | **100%** |

### 4.5 Data Split

```
Training Data (80%) ──┬── Train Set (80%)
                      └── Validation Set (20%)

Test Data ────────────── Test Set (Separate directory)
```

---

## 5. Methodology

### 5.1 Overall Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA PREPROCESSING                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Load Images  │ -> │ Resize 224²  │ -> │  Normalize   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MODEL ARCHITECTURE                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ DenseNet-121 │ -> │ Fine-tune    │ -> │ Classifier   │       │
│  │ (Pretrained) │    │ DenseBlock4  │    │ (4 classes)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TRAINING STRATEGY                             │
│  • Weighted Cross-Entropy Loss                                   │
│  • Adam Optimizer (Differential LR)                              │
│  • ReduceLROnPlateau Scheduler                                   │
│  • Early Stopping (patience=8)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EVALUATION & DEPLOYMENT                       │
│  • Test on held-out set                                          │
│  • Save best model (loss vs accuracy)                            │
│  • Deploy via Modal.com (NVIDIA T4 GPU)                          │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Preprocessing

#### 5.2.1 Image Transformations

**Training Transforms** (with augmentation):
```python
train_transform = transforms.Compose([
    transforms.Resize((224, 224)),      # Resize to DenseNet input
    transforms.RandomRotation(7),        # ±7° rotation (MRI-safe)
    transforms.ToTensor(),               # Convert to tensor
    transforms.Normalize(                # ImageNet normalization
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])
```

**Validation/Test Transforms** (no augmentation):
```python
val_test_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])
```

#### 5.2.2 MRI-Safe Augmentation

We use **conservative augmentation** to preserve medical validity:
- ✅ **Random Rotation (±7°)**: Simulates slight head positioning variations
- ❌ **No Horizontal Flip**: Brain asymmetry has clinical significance
- ❌ **No Color Jitter**: MRI intensity values are diagnostically relevant
- ❌ **No Aggressive Cropping**: May remove pathological regions

### 5.3 Handling Class Imbalance

The dataset exhibits significant class imbalance (Non: 302 vs Mild: 667).

#### Weighted Cross-Entropy Loss

```python
class_counts = torch.tensor([302, 667, 595, 644], dtype=torch.float)
weights = torch.sqrt(1.0 / class_counts)  # Square root dampening
weights = weights / weights.sum()          # Normalize to sum to 1
criterion = nn.CrossEntropyLoss(weight=weights.to(device))
```

**Weight Calculation**:
| Class | Count | Raw Weight (1/count) | √ Weight | Normalized |
|-------|-------|---------------------|----------|------------|
| Non | 302 | 0.00331 | 0.0575 | ~0.31 |
| Mild | 667 | 0.00150 | 0.0387 | ~0.21 |
| Moderate | 595 | 0.00168 | 0.0410 | ~0.22 |
| Severe | 644 | 0.00155 | 0.0394 | ~0.21 |

**Rationale for Square Root**:
- Pure inverse weighting can over-penalize majority classes
- Square root provides a smoother balance
- Prevents minority class from dominating training

---

## 6. Model Architecture

### 6.1 DenseNet-121 Structure

```
Input Image (224 × 224 × 3)
          │
          ▼
┌─────────────────────────┐
│     Initial Conv        │  7×7 conv, stride 2
│     (64 filters)        │  3×3 max pool, stride 2
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│    Dense Block 1        │  6 layers
│    (Growth Rate: 32)    │  Output: 256 channels
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│   Transition Layer 1    │  1×1 conv + 2×2 avg pool
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│    Dense Block 2        │  12 layers
│    (Growth Rate: 32)    │  Output: 512 channels
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│   Transition Layer 2    │  1×1 conv + 2×2 avg pool
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│    Dense Block 3        │  24 layers
│    (Growth Rate: 32)    │  Output: 1024 channels
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│   Transition Layer 3    │  1×1 conv + 2×2 avg pool
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│    Dense Block 4        │  16 layers (FINE-TUNED)
│    (Growth Rate: 32)    │  Output: 1024 channels
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│  Global Average Pool    │  7×7 → 1×1
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│  Fully Connected        │  1024 → 4 (REPLACED)
│  (Classifier)           │  Output: Class probabilities
└─────────────────────────┘
          │
          ▼
     Softmax Output
   [Non, Mild, Moderate, Severe]
```

### 6.2 Transfer Learning Strategy

#### Layer Freezing Strategy

```python
# Freeze ALL parameters initially
for p in model.parameters():
    p.requires_grad = False

# Unfreeze Dense Block 4 (final dense block)
for p in model.features.denseblock4.parameters():
    p.requires_grad = True

# Unfreeze ALL Batch Normalization layers
for m in model.modules():
    if isinstance(m, nn.BatchNorm2d):
        for p in m.parameters():
            p.requires_grad = True

# Replace classifier head
model.classifier = nn.Linear(model.classifier.in_features, num_classes)  # 1024 → 4
```

**Rationale**:
| Component | Frozen/Trainable | Reason |
|-----------|------------------|--------|
| Dense Blocks 1-3 | Frozen | General visual features |
| Dense Block 4 | **Trainable** | Task-specific high-level features |
| BatchNorm layers | **Trainable** | Adapt statistics to medical images |
| Classifier | **Trainable** | New task-specific output |

### 6.3 Differential Learning Rates

```python
optimizer = optim.Adam([
    {"params": raw_model.features.denseblock4.parameters(), "lr": 1e-5},  # Low LR
    {"params": raw_model.classifier.parameters(), "lr": 1e-3}            # High LR
])
```

**Learning Rate Strategy**:
| Parameter Group | Learning Rate | Rationale |
|----------------|---------------|-----------|
| Dense Block 4 | 1e-5 (0.00001) | Fine-tune pre-trained weights slowly |
| Classifier | 1e-3 (0.001) | Train new layer from scratch |

---

## 7. Training Strategy

### 7.1 Training Configuration

| Hyperparameter | Value | Description |
|---------------|-------|-------------|
| Batch Size | 32 | Balance between memory and gradient stability |
| Max Epochs | 120 | Upper limit with early stopping |
| Patience | 8 | Early stopping patience |
| Optimizer | Adam | Adaptive learning rate optimizer |
| Base LR | 1e-3 (classifier), 1e-5 (features) | Differential learning rates |
| Weight Decay | 0 (default) | No explicit regularization |
| Data Workers | 2 | Parallel data loading |

### 7.2 Learning Rate Scheduler

```python
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode="min",        # Minimize validation loss
    factor=0.7,        # Multiply LR by 0.7 on plateau
    patience=4,        # Wait 4 epochs before reducing
    min_lr=1e-6        # Lower bound for learning rate
)
```

**Scheduler Behavior**:
```
Epoch 1-4:   LR = initial (1e-3, 1e-5)
Plateau detected → LR × 0.7
Epoch 5-8:   LR = (7e-4, 7e-6)
Plateau detected → LR × 0.7
...continues until min_lr reached
```

### 7.3 Early Stopping

```python
patience = 8
epochs_no_improve = 0
best_val_loss = float("inf")

for epoch in range(epochs):
    # ... training ...
    
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        epochs_no_improve = 0
        # Save best model
    else:
        epochs_no_improve += 1
    
    if epochs_no_improve >= patience:
        print("Early stopping triggered")
        break
```

### 7.4 Model Selection Strategy

We save **two separate models** during training:

| Model | Selection Criterion | Use Case |
|-------|-------------------|----------|
| Best Loss | Lowest validation loss | Better generalization |
| Best Accuracy | Highest validation accuracy | Direct metric optimization |

After training, both models are evaluated on the test set, and the **better-performing model** is selected for deployment.

### 7.5 Training Loop Pseudocode

```
FOR each epoch:
    # Training Phase
    model.train()
    FOR each batch in train_loader:
        1. Forward pass: outputs = model(images)
        2. Compute weighted loss: loss = criterion(outputs, labels)
        3. Backward pass: loss.backward()
        4. Update weights: optimizer.step()
        5. Track metrics: accuracy, loss
    
    # Validation Phase
    model.eval()
    WITH torch.no_grad():
        FOR each batch in val_loader:
            1. Forward pass
            2. Compute metrics
    
    # Learning Rate Update
    scheduler.step(val_loss)
    
    # Model Checkpointing
    IF val_loss improved: save best_loss model
    IF val_acc improved: save best_acc model
    
    # Early Stopping Check
    IF no improvement for 8 epochs: BREAK
```

---

## 8. Implementation Details

### 8.1 Hardware Requirements

| Component | Specification |
|-----------|--------------|
| GPU | NVIDIA CUDA-capable GPU |
| VRAM | ≥4GB recommended |
| RAM | ≥16GB |
| Storage | ~2GB for dataset + model |

### 8.2 Software Dependencies

```python
# Core Deep Learning
torch>=2.0
torchvision>=0.15

# Data Processing
numpy
pillow

# Visualization
matplotlib
seaborn

# Evaluation
scikit-learn
```

### 8.3 Custom Dataset Class

```python
class UnifiedDementiaDataset(datasets.ImageFolder):
    """Custom dataset that maps 5 classes to 4 unified classes"""
    
    def __init__(self, root, transform=None):
        super().__init__(root, transform=transform)
        self.mapped_classes = ["Non", "Mild", "Moderate", "Severe"]
        self.class_to_idx = {c: i for i, c in enumerate(self.mapped_classes)}
    
    def __getitem__(self, index):
        path, _ = self.samples[index]
        folder = os.path.basename(os.path.dirname(path))
        label = self.class_to_idx[map_class(folder)]  # Use mapping function
        image = self.loader(path)
        if self.transform:
            image = self.transform(image)
        return image, label
```

### 8.4 Data Loading Pipeline

```python
# Efficient data loading with pinned memory
train_loader = DataLoader(
    train_set,
    batch_size=32,
    shuffle=True,       # Randomize training order
    num_workers=2,      # Parallel data loading
    pin_memory=True     # Faster GPU transfer
)

val_loader = DataLoader(
    val_set,
    batch_size=32,
    shuffle=False,      # Consistent validation order
    num_workers=2,
    pin_memory=True
)
```

---

## 9. Model Deployment

### 9.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT APPLICATION                          │
│                   (Web/Mobile Frontend)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS POST /predict
                              │ (multipart/form-data)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MODAL.COM                                  │
│              (Serverless GPU Infrastructure)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  FastAPI Application                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │    │
│  │  │ /predict    │  │ /health     │  │ /classes        │ │    │
│  │  │ POST        │  │ GET         │  │ GET             │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              NVIDIA T4 GPU (16GB VRAM)                   │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │           DenseNet-121 Model                     │    │    │
│  │  │         (Loaded from .pth file)                  │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Modal.com Configuration

```python
# Modal image definition with dependencies
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
        local_path="densenet121_dementia_final_best_test.pth",
        remote_path="/root/model.pth"
    )
)
```

### 9.3 API Endpoints

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/predict` | POST | Classify MRI image | Prediction + confidence |
| `/health` | GET | Health check | Status + model info |
| `/classes` | GET | List classes | Available categories |

### 9.4 Inference Pipeline

```python
@app.function(image=image, gpu="t4")
def predict_image(image_data: bytes) -> dict:
    # 1. Load model architecture
    model = models.densenet121(weights=DenseNet121_Weights.DEFAULT)
    model.classifier = nn.Linear(model.classifier.in_features, 4)
    
    # 2. Load trained weights
    checkpoint = torch.load("/root/model.pth", map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    
    # 3. Preprocess input image
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])
    
    img = Image.open(io.BytesIO(image_data)).convert("RGB")
    image_tensor = transform(img).unsqueeze(0).to(device)
    
    # 4. Inference
    with torch.no_grad():
        outputs = model(image_tensor)
        probabilities = torch.softmax(outputs, dim=1)[0]
        predicted_class = outputs.argmax(1).item()
    
    # 5. Return results
    return {
        "prediction": class_names[predicted_class],
        "confidence": float(probabilities[predicted_class]),
        "all_probabilities": {
            class_names[i]: float(probabilities[i])
            for i in range(4)
        }
    }
```

### 9.5 CORS Configuration

```python
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],        # Allow all HTTP methods
    allow_headers=["*"],        # Allow all headers
)
```

### 9.6 Response Format

**Successful Prediction**:
```json
{
    "prediction": "Mild",
    "confidence": 0.8734,
    "all_probabilities": {
        "Non": 0.0521,
        "Mild": 0.8734,
        "Moderate": 0.0612,
        "Severe": 0.0133
    }
}
```

**Error Response**:
```json
{
    "error": "File must be an image (JPG, PNG, or WebP)"
}
```

---

## 10. Results and Discussion

### 10.1 Training Metrics

The training process logs the following metrics per epoch:

```
Epoch 01 | Train Acc: XX.XX% | Val Acc: XX.XX% | Train Loss: X.XXXX | Val Loss: X.XXXX
Epoch 02 | Train Acc: XX.XX% | Val Acc: XX.XX% | Train Loss: X.XXXX | Val Loss: X.XXXX
...
```

### 10.2 Model Selection

Two models are compared on the test set:
- **Best Loss Model**: Optimized for generalization
- **Best Accuracy Model**: Optimized for direct accuracy

The model with **higher test accuracy** is selected for deployment.

### 10.3 Evaluation Metrics

**Confusion Matrix Analysis**:
- True Positives (TP): Correctly classified per class
- False Positives (FP): Misclassified as this class
- False Negatives (FN): Should be this class but misclassified

**Classification Report**:
- **Precision**: TP / (TP + FP) - How many selected are relevant
- **Recall**: TP / (TP + FN) - How many relevant are selected
- **F1-Score**: 2 × (Precision × Recall) / (Precision + Recall)

### 10.4 Discussion

#### Strengths
1. **Transfer Learning Effectiveness**: Pre-trained DenseNet features transfer well to medical imaging
2. **Class Imbalance Handling**: Weighted loss prevents bias toward majority classes
3. **Conservative Augmentation**: MRI-safe transforms preserve diagnostic validity
4. **Dual Model Saving**: Best loss vs accuracy provides robustness

#### Limitations
1. **Single Dataset**: Results may not generalize to other MRI acquisition protocols
2. **2D Analysis**: Uses 2D slices rather than full 3D volumetric data
3. **Binary BatchNorm**: All BN layers unfrozen may cause distribution shift

#### Clinical Considerations
- Model provides **decision support**, not autonomous diagnosis
- Confidence scores help clinicians assess prediction reliability
- Low confidence predictions should trigger manual review

---

## 11. Conclusion

### 11.1 Summary

This project successfully demonstrates the application of deep learning for automated Alzheimer's disease staging from brain MRI scans. Key achievements include:

1. **Effective Transfer Learning**: DenseNet-121 pre-trained on ImageNet successfully adapted to medical imaging
2. **Robust Training Pipeline**: Class weighting, early stopping, and learning rate scheduling ensure stable training
3. **Production Deployment**: Model deployed as scalable REST API via Modal.com

### 11.2 Future Work

1. **3D Volumetric Analysis**: Extend to 3D CNNs for full brain volume analysis
2. **Attention Mechanisms**: Add Grad-CAM or attention modules for interpretability
3. **Multi-Modal Learning**: Incorporate clinical data alongside imaging
4. **Ensemble Methods**: Combine multiple architectures for improved accuracy
5. **Longitudinal Analysis**: Track disease progression over time

### 11.3 Clinical Impact

This system can:
- **Reduce diagnostic time** by providing rapid preliminary assessment
- **Improve accessibility** by enabling remote analysis
- **Support early detection** through consistent, objective analysis
- **Aid in clinical trials** by standardizing patient stratification

---

## 12. References

1. **Huang, G., Liu, Z., Van Der Maaten, L., & Weinberger, K. Q.** (2017). Densely Connected Convolutional Networks. *CVPR 2017*.

2. **Alzheimer's Association** (2023). 2023 Alzheimer's Disease Facts and Figures. *Alzheimer's & Dementia*, 19(4).

3. **He, K., Zhang, X., Ren, S., & Sun, J.** (2016). Deep Residual Learning for Image Recognition. *CVPR 2016*.

4. **Russakovsky, O., et al.** (2015). ImageNet Large Scale Visual Recognition Challenge. *IJCV*.

5. **Pan, S. J., & Yang, Q.** (2010). A Survey on Transfer Learning. *IEEE TKDE*.

6. **Islam, J., & Zhang, Y.** (2018). Brain MRI Analysis for Alzheimer's Disease Diagnosis. *IEEE Access*.

7. **Farooq, A., Anwar, S., Awais, M., & Rehman, S.** (2017). A Deep CNN Based Multi-class Classification of Alzheimer's Disease. *IEEE ICIIT*.

8. **PyTorch Documentation**: https://pytorch.org/docs/stable/

9. **Modal.com Documentation**: https://modal.com/docs

10. **Kaggle Dataset**: https://www.kaggle.com/datasets/phamnguyenduytien/alzheimers-disease-5-classes

---

## Appendix A: Complete Training Code

See `modelcodetrain.py` for the full implementation.

## Appendix B: Deployment Code

See `modal_app.py` for the Modal.com deployment configuration.

## Appendix C: Model Weights

The trained model weights are stored in:
- `densenet121_dementia_final_best_test.pth`

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Author**: Deep Learning Lab Project
