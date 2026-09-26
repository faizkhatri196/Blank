import os
import sys
import subprocess
from PIL import Image, ImageSequence

input_webp = r"C:\Users\Infinity\.gemini\antigravity-ide\brain\6d9f10d2-d683-4268-8bca-47b0fee7cb12\servora_full_5min_final_1789903035184.webp"
output_mp4 = r"C:\Users\Infinity\OneDrive\Desktop\Start Up\SERVORA_MANAGER_TECHNICIAN_WORKFLOW.mp4"
ffmpeg_exe = r"C:\Users\Infinity\OneDrive\Desktop\Start Up\ai-field-service-copilot\server\node_modules\ffmpeg-static\ffmpeg.exe"

print(f"Reading animated WebP: {input_webp}")
im = Image.open(input_webp)
num_frames = getattr(im, 'n_frames', 1)
width, height = im.size
print(f"Total Frames: {num_frames}, Dimensions: {width}x{height}")

# Target duration: ~2 mins 50s (under 3 mins)
# 1484 frames / 8.5 fps = 174.5 seconds (~2m 54s)
fps = 8.5

cmd = [
    ffmpeg_exe,
    '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', f"{width}x{height}",
    '-pix_fmt', 'rgb24',
    '-r', str(fps),
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '22',
    '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
    '-movflags', '+faststart',
    output_mp4
]

print("Launching FFmpeg process...")
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

count = 0
for frame in ImageSequence.Iterator(im):
    rgb_frame = frame.convert('RGB')
    proc.stdin.write(rgb_frame.tobytes())
    count += 1
    if count % 200 == 0 or count == num_frames:
        print(f"Encoded frame {count}/{num_frames}...")

proc.stdin.close()
proc.wait()

if os.path.exists(output_mp4):
    size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
    print(f"\nSUCCESS! Created standard MP4 video:\n{output_mp4}\nSize: {size_mb:.2f} MB")
else:
    print("\nError: MP4 file was not created.")
