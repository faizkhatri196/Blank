import os
import sys
import subprocess
from PIL import Image, ImageSequence

input_webp = r"C:\Users\Infinity\OneDrive\Desktop\Start Up\SERVORA_REAL_WORKING_APP_FLOW.webp"
output_mp4 = r"C:\Users\Infinity\OneDrive\Desktop\Start Up\SERVORA_REAL_WORKING_APP_FLOW.mp4"
ffmpeg_exe = r"C:\Users\Infinity\OneDrive\Desktop\Start Up\ai-field-service-copilot\server\node_modules\ffmpeg-static\ffmpeg.exe"

print(f"Reading animated WebP: {input_webp}")
im = Image.open(input_webp)
num_frames = getattr(im, 'n_frames', 1)
width, height = im.size
print(f"Total Frames: {num_frames}, Original Dimensions: {width}x{height}")

# Target FPS: 5 fps -> 849 / 5 = 169.8 seconds (~2m 50s, under 3 mins)
fps = 5

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
    if count % 100 == 0 or count == num_frames:
        print(f"Processed frame {count}/{num_frames}...")

proc.stdin.close()
proc.wait()

if os.path.exists(output_mp4):
    size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
    print(f"\nSUCCESS! Created standard MP4 video:\n{output_mp4}\nSize: {size_mb:.2f} MB")
else:
    print("\nError: MP4 file was not created.")
