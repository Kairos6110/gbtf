import os
import subprocess
import sys

def convert_pdf():
    pdf_path = "silverstone.pdf"
    output_dir = "pages"
    total_pages = 154
    
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found.")
        sys.exit(1)
        
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    print(f"Attempting to convert {pdf_path} into images inside '{output_dir}/'...")
    
    # Method 1: Try using ImageMagick 'convert' (since we verified it works on this system)
    try:
        print("Trying ImageMagick convert page by page...")
        for page_num in range(1, total_pages + 1):
            page_num_str = str(page_num).zfill(2)
            output_file = os.path.join(output_dir, f"page-{page_num_str}.jpg")
            # PDF is 0-indexed in ImageMagick [page_num - 1]
            pdf_page_arg = f"{pdf_path}[{page_num - 1}]"
            subprocess.run([
                "convert",
                "-density", "150",
                "-background", "white",
                "-alpha", "remove",
                pdf_page_arg,
                "-quality", "85",
                output_file
            ], check=True)
            print(f"Converted page {page_num}/{total_pages} -> {output_file}")
        print("Success! PDF converted using ImageMagick convert.")
        return
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print("ImageMagick convert failed or not available. Trying pdftoppm...")

    # Method 2: Try using pdftoppm (standard, highly optimized, part of poppler-utils)
    try:
        print("Trying pdftoppm...")
        # pdftoppm -jpeg -r 150 silverstone.pdf pages/page
        # This will output files like pages/page-01.jpg, page-02.jpg...
        subprocess.run([
            "pdftoppm", 
            "-jpeg",
            "-jpegopt", "quality=85",
            "-r", "150", 
            pdf_path, 
            os.path.join(output_dir, "page")
        ], check=True)
        print("Success! PDF converted using pdftoppm.")
        return
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print("pdftoppm not available or failed. Trying Python libraries...")

    # Method 3: Try pdf2image (requires pdf2image package and poppler)
    try:
        from pdf2image import convert_from_path
        print("Converting with pdf2image (this might take a minute)...")
        pages = convert_from_path(pdf_path, 150)
        for idx, page in enumerate(pages):
            page_num_str = str(idx + 1).zfill(2)
            output_file = os.path.join(output_dir, f"page-{page_num_str}.jpg")
            page.save(output_file, 'JPEG', quality=85, optimize=True)
            print(f"Saved {output_file}")
        print("Success! PDF converted using pdf2image.")
        return
    except ImportError:
        print("pdf2image library is not installed.")
    except Exception as e:
        print(f"pdf2image failed: {e}")

    # Method 4: Try fitz (PyMuPDF)
    try:
        import fitz  # PyMuPDF
        print("Converting with PyMuPDF...")
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            page_num_str = str(page_num + 1).zfill(2)
            output_file = os.path.join(output_dir, f"page-{page_num_str}.jpg")
            pix.save(output_file)
            print(f"Saved {output_file}")
        print("Success! PDF converted using PyMuPDF.")
        return
    except ImportError:
        print("fitz (PyMuPDF) is not installed.")
    except Exception as e:
        print(f"PyMuPDF failed: {e}")

    print("\nCould not convert PDF automatically.")
    print("Please install poppler-utils or ImageMagick.")

if __name__ == "__main__":
    convert_pdf()
