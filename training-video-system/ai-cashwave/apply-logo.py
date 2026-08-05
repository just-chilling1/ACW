from PIL import Image
from pathlib import Path

thumb_dir = Path(__file__).resolve().parent / "thumbnails"
logo_path = Path(__file__).resolve().parent / "logo-wordmark.png"

logo = Image.open(logo_path).convert("RGBA")


def trim_logo(img: Image.Image, threshold: int = 30) -> Image.Image:
    pixels = img.load()
    w, h = img.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 10 and (r > threshold or g > threshold or b > threshold):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x >= min_x and max_y >= min_y:
        pad = 8
        return img.crop(
            (
                max(0, min_x - pad),
                max(0, min_y - pad),
                min(w, max_x + pad + 1),
                min(h, max_y + pad + 1),
            )
        )
    return img


def knock_out_black(img: Image.Image, threshold: int = 25) -> Image.Image:
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r <= threshold and g <= threshold and b <= threshold:
                pixels[x, y] = (0, 0, 0, 0)
    return img


logo = knock_out_black(trim_logo(logo))

for thumb_path in sorted(thumb_dir.glob("acw-thumb-*.png")):
    base = Image.open(thumb_path).convert("RGBA")
    tw, th = base.size

    target_w = int(tw * 0.24)
    scale = target_w / logo.width
    target_h = int(logo.height * scale)
    logo_resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)

    margin_x = int(tw * 0.03)
    margin_y = int(th * 0.04)
    cover_w = int(tw * 0.40)
    cover_h = int(th * 0.19)

    cover = Image.new("RGBA", (cover_w, cover_h), (20, 15, 10, 255))
    base.paste(cover, (tw - cover_w, th - cover_h))

    x = tw - target_w - margin_x
    y = th - target_h - margin_y
    base.alpha_composite(logo_resized, (x, y))

    out = base.convert("RGB")
    out.save(thumb_path, "PNG", optimize=True)
    print(f"Updated {thumb_path.name} (logo {target_w}x{target_h})")
