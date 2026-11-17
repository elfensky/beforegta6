"""Contact sheet on the card's dark background. Usage: sheet.py out.png cols img..."""
import subprocess, sys
out, cols, imgs = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
args, f, s, lay = [], "", "", []
for i, p in enumerate(imgs):
    args += ["-i", p]
    f += f"[{i}]scale=600:450:force_original_aspect_ratio=decrease,pad=600:450:(ow-iw)/2:(oh-ih)/2:0x1a1a1a[v{i}];"
    s += f"[v{i}]"; lay.append(f"{(i%cols)*600}_{(i//cols)*450}")
subprocess.run(["ffmpeg","-v","error","-y",*args,"-filter_complex",f+s+f"xstack=inputs={len(imgs)}:layout={'|'.join(lay)}:fill=0x1a1a1a","-frames:v","1",out], check=True)
