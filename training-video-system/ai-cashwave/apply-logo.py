"""Composite the AI CashWave wordmark (transparent background) onto thumbnails."""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent
THUMB_DIR = ROOT / "thumbnails"
LOGO_SRC = Path(__file__).resolve().parents[2] / "public" / "logo-wordmark.png"
LOGO_CACHE = ROOT / "logo-transparent.png"


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
        pad = 4
        return img.crop(
            (
                max(0, min_x - pad),
                max(0, min_y - pad),
                min(w, max_x + pad + 1),
                min(h, max_y + pad + 1),
            )
        )
    return img


def knock_out_black(img: Image.Image, threshold: int = 28) -> Image.Image:
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r <= threshold and g <= threshold and b <= threshold:
                pixels[x, y] = (0, 0, 0, 0)
    return img


def load_transparent_logo() -> Image.Image:
    if LOGO_CACHE.exists() and LOGO_CACHE.stat().st_mtime >= LOGO_SRC.stat().st_mtime:
        return Image.open(LOGO_CACHE).convert("RGBA")

    logo = Image.open(LOGO_SRC).convert("RGBA")
    logo = knock_out_black(trim_logo(logo))
    logo.save(LOGO_CACHE, "PNG", optimize=True)
    return logo


def apply_logo(thumb_path: Path, logo: Image.Image) -> None:
    base = Image.open(thumb_path).convert("RGBA")
    tw, th = base.size

    target_w = int(tw * 0.24)
    scale = target_w / logo.width
    target_h = int(logo.height * scale)
    logo_resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)

    margin_x = int(tw * 0.03)
    margin_y = int(th * 0.04)
    x = tw - target_w - margin_x
    y = th - target_h - margin_y

    base.alpha_composite(logo_resized, (x, y))
    base.convert("RGB").save(thumb_path, "PNG", optimize=True)
    print(f"Updated {thumb_path.name} (logo {target_w}x{target_h}, transparent)")


def main() -> None:
    logo = load_transparent_logo()
    for thumb_path in sorted(THUMB_DIR.glob("acw-thumb-*.png")):
        apply_logo(thumb_path, logo)


if __name__ == "__main__":
    main()
