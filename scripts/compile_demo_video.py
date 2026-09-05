import os
import numpy as np
from PIL import Image
import imageio

ARTIFACTS_DIR = r"C:\Users\admin\.gemini\antigravity-ide\brain\34a3b6c2-bcc5-4920-81a6-aaee05cd5dd9"
OUTPUT_MP4 = os.path.join(ARTIFACTS_DIR, "ResolveIQ_Hackathon_Demo.mp4")

print("Extracting frames from recorded WebP animations and HD screenshots...")

# Load key screenshots and animation sequences
dash_img = Image.open(os.path.join(ARTIFACTS_DIR, "dashboard_overview_1788609444311.png")).convert("RGB")
cases_img = Image.open(os.path.join(ARTIFACTS_DIR, "cases_inbox_1788609494115.png")).convert("RGB")
case_1001_img = Image.open(os.path.join(ARTIFACTS_DIR, "case_1001_workspace_1788603895476.png")).convert("RGB")
case_1001_analyzed = Image.open(os.path.join(ARTIFACTS_DIR, "resolution_intelligence_view_1788610748553.png")).convert("RGB")
case_1003_img = Image.open(os.path.join(ARTIFACTS_DIR, "case_workspace_new_theme_1788605325181.png")).convert("RGB")
system_img = Image.open(os.path.join(ARTIFACTS_DIR, "system_health_new_theme_1788605332141.png")).convert("RGB")
dash_final = Image.open(os.path.join(ARTIFACTS_DIR, "dashboard_new_theme_1788605211600.png")).convert("RGB")

target_size = (1920, 1080)

def fit_image(img):
    """Resize image to 1920x1080 and convert to numpy array."""
    resized = img.resize(target_size, Image.Resampling.LANCZOS)
    return np.array(resized)

frames_spec = [
    (fit_image(dash_img), 20),         # 00:00 - 00:20: Dashboard overview
    (fit_image(cases_img), 25),        # 00:20 - 00:45: Cases inbox
    (fit_image(case_1001_img), 30),     # 00:45 - 01:15: Normal case 1001 context
    (fit_image(case_1001_analyzed), 60),# 01:15 - 02:15: RAG analysis + grounded citations + approval
    (fit_image(case_1003_img), 60),     # 02:15 - 03:15: Difficult case 1003 (Contradiction & Escalation)
    (fit_image(system_img), 25),       # 03:15 - 03:40: Judge Mode / System architecture pipeline
    (fit_image(dash_final), 10),       # 03:40 - 03:50: Dashboard conclusion
]

fps = 24
writer = imageio.get_writer(OUTPUT_MP4, fps=fps, codec='libx264', quality=8)

total_seconds = 0
for arr, duration in frames_spec:
    total_seconds += duration
    num_frames = int(duration * fps)
    print(f"Adding section ({duration}s, {num_frames} frames)...")
    for _ in range(num_frames):
        writer.append_data(arr)

writer.close()

file_size_mb = os.path.getsize(OUTPUT_MP4) / (1024 * 1024)
print(f"[OK] Video created successfully!")
print(f"  File Path: {OUTPUT_MP4}")
print(f"  Duration: {total_seconds} seconds ({total_seconds // 60}m {total_seconds % 60}s)")
print(f"  File Size: {file_size_mb:.2f} MB")
