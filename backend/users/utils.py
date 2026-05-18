import io
import sys
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile

def process_avatar(avatar_file):
    # 1. Verify file size (5MB = 5 * 1024 * 1024 bytes)
    if avatar_file.size > 5 * 1024 * 1024:
        raise ValueError("Файл слишком большой. Максимальный размер — 5 МБ")

    # 2. Verify file structure/type
    try:
        # Read into buffer to run verify without closing the main stream
        temp_data = avatar_file.read()
        avatar_file.seek(0)
        
        img = Image.open(io.BytesIO(temp_data))
        img.verify()
        
        # Check allowed formats
        img = Image.open(io.BytesIO(temp_data))
        if img.format not in ['JPEG', 'PNG', 'WEBP']:
            raise ValueError("Разрешены только форматы JPEG, PNG, WebP")
    except ValueError as ve:
        raise ve
    except Exception:
        raise ValueError("Невалидный или поврежденный файл изображения")

    # 3. Resize image maintaining aspect ratio
    # img is currently opened on temp_data
    # We want to use LANCZOS for high quality downsampling
    img.thumbnail((400, 400), Image.Resampling.LANCZOS)

    # Save processed image to bytes stream
    output = io.BytesIO()
    fmt = img.format if img.format in ['JPEG', 'PNG', 'WEBP'] else 'JPEG'
    img.save(output, format=fmt, quality=85)
    output.seek(0)

    # Wrap in Django's InMemoryUploadedFile
    return InMemoryUploadedFile(
        output,
        'ImageField',
        avatar_file.name,
        f'image/{fmt.lower()}',
        sys.getsizeof(output),
        None
    )
