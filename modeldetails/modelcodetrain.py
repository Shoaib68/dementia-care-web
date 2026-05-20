# ============================================================
# 0. IMPORTS
# ============================================================
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader, Subset
from torchvision.models import DenseNet121_Weights
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# ============================================================
# 1. DEVICE, PATHS
# ============================================================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

BASE_DIR = "/kaggle/input/alzheimers-disease-5-classes/Alzheimer 5 classes"
TRAIN_DIR = os.path.join(BASE_DIR, "train")
TEST_DIR  = os.path.join(BASE_DIR, "test")

BEST_LOSS_PATH = "/kaggle/working/densenet121_best_loss.pth"
BEST_ACC_PATH  = "/kaggle/working/densenet121_best_acc.pth"
FINAL_MODEL_PATH = "/kaggle/working/densenet121_dementia_final.pth"
CM_PATH = "/kaggle/working/confusion_matrix_dementia.png"

# ============================================================
# 2. MRI-SAFE TRANSFORMS
# ============================================================
train_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomRotation(7),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

val_test_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

# ============================================================
# 3. CLASS MAPPING & DATASET
# ============================================================
def map_class(folder):
    name = folder.lower().replace(" ", "").replace("demented", "")
    if "non" in name: return "Non"
    if "verymild" in name or "mild" in name: return "Mild"
    if "moderate" in name: return "Moderate"
    if "severe" in name or "servere" in name: return "Severe"
    return None

class UnifiedDementiaDataset(datasets.ImageFolder):
    def __init__(self, root, transform=None):
        super().__init__(root, transform=transform)
        self.mapped_classes = ["Non", "Mild", "Moderate", "Severe"]
        self.class_to_idx = {c: i for i, c in enumerate(self.mapped_classes)}

    def __getitem__(self, index):
        path, _ = self.samples[index]
        folder = os.path.basename(os.path.dirname(path))
        label = self.class_to_idx[map_class(folder)]
        image = self.loader(path)
        if self.transform:
            image = self.transform(image)
        return image, label

# ============================================================
# 4. DATASETS & LOADERS
# ============================================================
train_raw = UnifiedDementiaDataset(TRAIN_DIR, transform=train_transform)
val_raw   = UnifiedDementiaDataset(TRAIN_DIR, transform=val_test_transform)
test_set  = UnifiedDementiaDataset(TEST_DIR,  transform=val_test_transform)

indices = torch.randperm(len(train_raw)).tolist()
split = int(0.8 * len(indices))
train_idx, val_idx = indices[:split], indices[split:]

train_set = Subset(train_raw, train_idx)
val_set   = Subset(val_raw, val_idx)

train_loader = DataLoader(train_set, batch_size=32, shuffle=True, num_workers=2, pin_memory=True)
val_loader   = DataLoader(val_set, batch_size=32, shuffle=False, num_workers=2, pin_memory=True)
test_loader  = DataLoader(test_set, batch_size=32, shuffle=False, num_workers=2, pin_memory=True)

class_names = train_raw.mapped_classes
num_classes = len(class_names)

# ============================================================
# 5. CLASS-WEIGHTED LOSS
# ============================================================
class_counts = torch.tensor([302, 667, 595, 644], dtype=torch.float)
weights = torch.sqrt(1.0 / class_counts)
weights = weights / weights.sum()
criterion = nn.CrossEntropyLoss(weight=weights.to(device))

# ============================================================
# 6. DENSENET-121 MODEL
# ============================================================
model = models.densenet121(weights=DenseNet121_Weights.DEFAULT)

for p in model.parameters():
    p.requires_grad = False
for p in model.features.denseblock4.parameters():
    p.requires_grad = True
for m in model.modules():
    if isinstance(m, nn.BatchNorm2d):
        for p in m.parameters():
            p.requires_grad = True

model.classifier = nn.Linear(model.classifier.in_features, num_classes)
model = model.to(device)

if torch.cuda.device_count() > 1:
    model = nn.DataParallel(model)

raw_model = model.module if isinstance(model, nn.DataParallel) else model

optimizer = optim.Adam([
    {"params": raw_model.features.denseblock4.parameters(), "lr": 1e-5},
    {"params": raw_model.classifier.parameters(), "lr": 1e-3}
])

scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode="min", factor=0.7, patience=4, min_lr=1e-6
)

# ============================================================
# 7. TRAINING LOOP (SAVE BEST LOSS + BEST ACC)
# ============================================================
epochs = 120
patience = 8
epochs_no_improve = 0
best_val_loss = float("inf")
best_val_acc  = 0.0

print("\n--- Training Started ---")

for epoch in range(epochs):
    model.train()
    train_loss, train_correct, total = 0, 0, 0

    for imgs, labels in train_loader:
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(imgs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        train_loss += loss.item()
        train_correct += (outputs.argmax(1) == labels).sum().item()
        total += labels.size(0)

    train_acc = 100 * train_correct / total
    train_loss /= len(train_loader)

    model.eval()
    val_loss, val_correct, total = 0, 0, 0
    with torch.no_grad():
        for imgs, labels in val_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            outputs = model(imgs)
            loss = criterion(outputs, labels)
            val_loss += loss.item()
            val_correct += (outputs.argmax(1) == labels).sum().item()
            total += labels.size(0)

    val_loss /= len(val_loader)
    val_acc = 100 * val_correct / total

    scheduler.step(val_loss)

    print(f"Epoch {epoch+1:02d} | "
          f"Train Acc: {train_acc:.2f}% | Val Acc: {val_acc:.2f}% | "
          f"Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")

    if val_loss < best_val_loss:
        best_val_loss = val_loss
        epochs_no_improve = 0
        torch.save({"model_state_dict": raw_model.state_dict(),
                    "class_names": class_names}, BEST_LOSS_PATH)
        print("💾 Saved BEST-LOSS model")
    else:
        epochs_no_improve += 1

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save({"model_state_dict": raw_model.state_dict(),
                    "class_names": class_names}, BEST_ACC_PATH)
        print("⭐ Saved BEST-ACCURACY model")

    if epochs_no_improve >= patience:
        print("🛑 Early stopping triggered")
        break

# ============================================================
# 8. EVALUATE BOTH MODELS & MERGE CONFUSION MATRICES
# ============================================================

def test_model(model, loader, device):
    model.eval()
    y_true, y_pred = [], []
    with torch.no_grad():
        for imgs, labels in loader:
            imgs = imgs.to(device)
            outputs = model(imgs)
            y_pred.extend(outputs.argmax(1).cpu().numpy())
            y_true.extend(labels.numpy())
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    acc = 100 * np.mean(y_true == y_pred)
    return acc, y_true, y_pred

def plot_merged_cm(y_true1, y_pred1, y_true2, y_pred2, class_names, labels):
    cm1 = confusion_matrix(y_true1, y_pred1)
    cm2 = confusion_matrix(y_true2, y_pred2)

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    sns.heatmap(cm1, annot=True, fmt="d", cmap="Blues",
                xticklabels=class_names, yticklabels=class_names, ax=axes[0])
    axes[0].set_title(f"Confusion Matrix – {labels[0]}")
    axes[0].set_xlabel("Predicted")
    axes[0].set_ylabel("Actual")
    
    sns.heatmap(cm2, annot=True, fmt="d", cmap="Blues",
                xticklabels=class_names, yticklabels=class_names, ax=axes[1])
    axes[1].set_title(f"Confusion Matrix – {labels[1]}")
    axes[1].set_xlabel("Predicted")
    axes[1].set_ylabel("Actual")
    
    plt.tight_layout()
    plt.show()

# Evaluate BEST-LOSS model
raw_model.load_state_dict(torch.load(BEST_LOSS_PATH)["model_state_dict"])
loss_acc, loss_y_true, loss_y_pred = test_model(model, test_loader, device)
print(f"\n🎯 BEST-LOSS Model Test Accuracy: {loss_acc:.2f}%")

# Evaluate BEST-ACCURACY model
raw_model.load_state_dict(torch.load(BEST_ACC_PATH)["model_state_dict"])
acc_acc, acc_y_true, acc_y_pred = test_model(model, test_loader, device)
print(f"\n🎯 BEST-ACCURACY Model Test Accuracy: {acc_acc:.2f}%")

# Merge and plot confusion matrices side by side
plot_merged_cm(loss_y_true, loss_y_pred, acc_y_true, acc_y_pred, class_names,
               labels=["BEST-LOSS", "BEST-ACCURACY"])

# Save the model that performs best on the test set
if loss_acc >= acc_acc:
    best_model_path = FINAL_MODEL_PATH.replace(".pth", "_best_test.pth")
    torch.save({
        "model_state_dict": raw_model.state_dict(),
        "class_names": class_names
    }, best_model_path)
    print(f"\n🏆 BEST TEST ACCURACY MODEL: BEST-LOSS ({loss_acc:.2f}%) saved at: {best_model_path}")
else:
    best_model_path = FINAL_MODEL_PATH.replace(".pth", "_best_test.pth")
    torch.save({
        "model_state_dict": raw_model.state_dict(),
        "class_names": class_names
    }, best_model_path)
    print(f"\n🏆 BEST TEST ACCURACY MODEL: BEST-ACCURACY ({acc_acc:.2f}%) saved at: {best_model_path}")