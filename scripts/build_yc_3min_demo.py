import os
import sys
import subprocess
import time
from PIL import Image, ImageDraw, ImageFont, ImageSequence

print("=== SERVORA YC APPLICATION 3-MINUTE DEMO BUILDER ===")

# Paths
input_webp_customer = r"C:\Users\Infinity\.gemini\antigravity-ide\brain\6d9f10d2-d683-4268-8bca-47b0fee7cb12\servora_real_workflow_1790336888369.webp"
input_webp_mgr_tech = r"C:\Users\Infinity\.gemini\antigravity-ide\brain\6d9f10d2-d683-4268-8bca-47b0fee7cb12\servora_manager_tech_flow_1790338386083.webp"
ffmpeg_exe = r"C:\Users\Infinity\OneDrive\Desktop\Start Up\ai-field-service-copilot\server\node_modules\ffmpeg-static\ffmpeg.exe"

output_mp4_root = r"C:\Users\Infinity\OneDrive\Desktop\Start Up\SERVORA_3MIN_YC_DEMO.mp4"
output_mp4_proj = r"C:\Users\Infinity\OneDrive\Desktop\Start Up\ai-field-service-copilot\SERVORA_3MIN_YC_DEMO.mp4"

# Settings
TARGET_W = 1920
TARGET_H = 1080
HEADER_H = 58
FPS = 24

TOTAL_SEC = 180 # Exactly 3 minutes
ACT1_SEC = 55   # Customer Portal
ACT2_SEC = 60   # Operations Manager
ACT3_SEC = 65   # Technician Mobile Field Pro

ACT1_FRAMES = ACT1_SEC * FPS # 1320
ACT2_FRAMES = ACT2_SEC * FPS # 1440
ACT3_FRAMES = ACT3_SEC * FPS # 1560
TOTAL_FRAMES = ACT1_FRAMES + ACT2_FRAMES + ACT3_FRAMES # 4320

print(f"Target duration: {TOTAL_SEC}s ({TOTAL_SEC // 60}:00) @ {FPS} fps = {TOTAL_FRAMES} frames")

# Fonts
windir = os.environ.get('WINDIR', 'C:\\Windows')
font_bold_path = os.path.join(windir, 'Fonts', 'segoeuib.ttf')
if not os.path.exists(font_bold_path):
    font_bold_path = os.path.join(windir, 'Fonts', 'arialbd.ttf')
font_reg_path = os.path.join(windir, 'Fonts', 'segoeui.ttf')
if not os.path.exists(font_reg_path):
    font_reg_path = os.path.join(windir, 'Fonts', 'arial.ttf')

font_badge = ImageFont.truetype(font_bold_path, 17)
font_title = ImageFont.truetype(font_bold_path, 21)
font_time = ImageFont.truetype(font_bold_path, 17)

# Pre-load Source Frames in memory
print("Loading Customer Portal frames from WebP 1...")
t0 = time.time()
im1 = Image.open(input_webp_customer)
src_frames_act1 = [f.convert('RGB') for f in ImageSequence.Iterator(im1)]
print(f"Loaded {len(src_frames_act1)} frames for Act 1 in {time.time() - t0:.1f}s")

print("Loading Manager & Technician frames from WebP 2...")
t0 = time.time()
im2 = Image.open(input_webp_mgr_tech)
src_frames_im2 = [f.convert('RGB') for f in ImageSequence.Iterator(im2)]
print(f"Loaded {len(src_frames_im2)} frames from WebP 2 in {time.time() - t0:.1f}s")

# Split im2 into Act 2 (Manager) and Act 3 (Technician)
# Manager: 0 to 410, Technician: 411 to 1950
src_frames_act2 = src_frames_im2[0:411]
src_frames_act3 = src_frames_im2[411:1950]
print(f"Act 2 Source Frames: {len(src_frames_act2)}, Act 3 Source Frames: {len(src_frames_act3)}")

# Setup FFmpeg output pipeline
ffmpeg_cmd = [
    ffmpeg_exe,
    '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', f"{TARGET_W}x{TARGET_H}",
    '-pix_fmt', 'rgb24',
    '-r', str(FPS),
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '20',
    '-movflags', '+faststart',
    output_mp4_root
]

print("Starting FFmpeg encoder...")
proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

# Helper function to render a branded frame
def render_branded_frame(src_img, act_num, act_color, act_title, current_sec, progress_frac):
    canvas = Image.new('RGB', (TARGET_W, TARGET_H), (10, 15, 29))

    # Resize source image to fit below header
    avail_h = TARGET_H - HEADER_H
    im_ratio = src_img.width / src_img.height
    new_w = TARGET_W
    new_h = int(new_w / im_ratio)
    if new_h > avail_h:
        new_h = avail_h
        new_w = int(new_h * im_ratio)

    resized = src_img.resize((new_w, new_h), Image.Resampling.BILINEAR)
    offset_x = (TARGET_W - new_w) // 2
    offset_y = HEADER_H + (avail_h - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y))

    # Draw header banner
    draw = ImageDraw.Draw(canvas, 'RGBA')
    draw.rectangle([(0, 0), (TARGET_W, HEADER_H)], fill=(13, 19, 38, 245))
    draw.line([(0, HEADER_H), (TARGET_W, HEADER_H)], fill=(37, 50, 85, 255), width=1)

    # Act Badge
    badge_text = f"ACT {act_num} OF 3"
    draw.rounded_rectangle([(24, 11), (130, 47)], radius=6, fill=act_color)
    draw.text((34, 18), badge_text, fill=(255, 255, 255), font=font_badge)

    # Act Title
    draw.text((148, 17), act_title, fill=(255, 255, 255), font=font_title)

    # Timecode
    mins = int(current_sec) // 60
    secs = int(current_sec) % 60
    time_str = f"{mins:02d}:{secs:02d} / 03:00"
    draw.text((TARGET_W - 165, 17), time_str, fill=(148, 163, 184), font=font_time)

    # Bottom progress bar
    progress_x = int(TARGET_W * progress_frac)
    draw.rectangle([(0, TARGET_H - 4), (TARGET_W, TARGET_H)], fill=(30, 41, 59, 255))
    draw.rectangle([(0, TARGET_H - 4), (progress_x, TARGET_H)], fill=act_color[:3])

    return canvas

print("\nEncoding Act 1: Customer Portal & AI Intake...")
total_written = 0

for i in range(ACT1_FRAMES):
    src_idx = int(i * (len(src_frames_act1) - 1) / (ACT1_FRAMES - 1))
    src_frame = src_frames_act1[src_idx]
    current_sec = i / FPS
    progress = total_written / TOTAL_FRAMES
    frame = render_branded_frame(
        src_frame,
        act_num=1,
        act_color=(99, 102, 241, 230), # Indigo
        act_title="CUSTOMER PORTAL: MANDVI COVERAGE VERIFICATION & AI PROBLEM INTAKE",
        current_sec=current_sec,
        progress_frac=progress
    )
    proc.stdin.write(frame.tobytes())
    total_written += 1
    if total_written % 300 == 0:
        print(f"Encoded frame {total_written}/{TOTAL_FRAMES} ({total_written/TOTAL_FRAMES*100:.1f}%)")

print("\nEncoding Act 2: Operations Manager Command Center & 5-Factor Dispatch...")
for i in range(ACT2_FRAMES):
    src_idx = int(i * (len(src_frames_act2) - 1) / (ACT2_FRAMES - 1))
    src_frame = src_frames_act2[src_idx]
    current_sec = ACT1_SEC + (i / FPS)
    progress = total_written / TOTAL_FRAMES
    frame = render_branded_frame(
        src_frame,
        act_num=2,
        act_color=(245, 158, 11, 230), # Amber
        act_title="OPERATIONS COMMAND CENTER: AI ROOT-CAUSE TRIAGE & 5-FACTOR DISPATCH",
        current_sec=current_sec,
        progress_frac=progress
    )
    proc.stdin.write(frame.tobytes())
    total_written += 1
    if total_written % 300 == 0:
        print(f"Encoded frame {total_written}/{TOTAL_FRAMES} ({total_written/TOTAL_FRAMES*100:.1f}%)")

print("\nEncoding Act 3: Technician Mobile Field Pro & Completion...")
for i in range(ACT3_FRAMES):
    src_idx = int(i * (len(src_frames_act3) - 1) / (ACT3_FRAMES - 1))
    src_frame = src_frames_act3[src_idx]
    current_sec = ACT1_SEC + ACT2_SEC + (i / FPS)
    progress = total_written / TOTAL_FRAMES
    frame = render_branded_frame(
        src_frame,
        act_num=3,
        act_color=(16, 185, 129, 230), # Emerald
        act_title="FIELD TECHNICIAN MOBILE PWA: DIAGNOSTIC READINGS & WORK ORDER CLOSEOUT",
        current_sec=current_sec,
        progress_frac=progress
    )
    proc.stdin.write(frame.tobytes())
    total_written += 1
    if total_written % 300 == 0:
        print(f"Encoded frame {total_written}/{TOTAL_FRAMES} ({total_written/TOTAL_FRAMES*100:.1f}%)")

proc.stdin.close()
proc.wait()

print(f"\nFFmpeg process exited with code {proc.returncode}")

if os.path.exists(output_mp4_root):
    size_mb = os.path.getsize(output_mp4_root) / (1024 * 1024)
    print(f"Created: {output_mp4_root} ({size_mb:.2f} MB)")
    # Copy to project folder as well
    import shutil
    shutil.copy2(output_mp4_root, output_mp4_proj)
    print(f"Copied to: {output_mp4_proj}")
    print("\nSUCCESS: 3-MINUTE YC APPLICATION DEMO VIDEO READY!")
else:
    print("Error: Output video was not created.")
