import os
import subprocess
import sys

def convert_pdf():
    pdf_path = "wildfire.pdf"
    output_dir = "pages"
    
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found.")
        sys.exit(1)
        
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    print(f"Attempting to convert {pdf_path} into images inside '{output_dir}/'...")
    
    # Method 1: Try using pdftoppm (standard, highly optimized, part of poppler-utils)
    try:
        print("Trying pdftoppm...")
        # pdftoppm -png -r 150 wildfire.pdf pages/page
        # This will output files like pages/page-01.png, page-02.png...
        subprocess.run([
            "pdftoppm", 
            "-png", 
            "-r", "150", 
            pdf_path, 
            os.path.join(output_dir, "page")
        ], check=True)
        print("Success! PDF converted using pdftoppm.")
        return
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print("pdftoppm not available or failed. Trying Python libraries...")

    # Method 2: Try pdf2image (requires pdf2image package and poppler)
    try:
        from pdf2image import convert_from_path
        print("Converting with pdf2image (this might take a minute)...")
        pages = convert_from_path(pdf_path, 150)
        for idx, page in enumerate(pages):
            page_num_str = str(idx + 1).zfill(2)
            output_file = os.path.join(output_dir, f"page-{page_num_str}.png")
            page.save(output_file, 'PNG')
            print(f"Saved {output_file}")
        print("Success! PDF converted using pdf2image.")
        return
    except ImportError:
        print("pdf2image library is not installed.")
    except Exception as e:
        print(f"pdf2image failed: {e}")

    # Method 3: Try fitz (PyMuPDF)
    try:
        import fitz  # PyMuPDF
        print("Converting with PyMuPDF...")
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            page_num_str = str(page_num + 1).zfill(2)
            output_file = os.path.join(output_dir, f"page-{page_num_str}.png")
            pix.save(output_file)
            print(f"Saved {output_file}")
        print("Success! PDF converted using PyMuPDF.")
        return
    except ImportError:
        print("fitz (PyMuPDF) is not installed.")
    except Exception as e:
        print(f"PyMuPDF failed: {e}")

    print("\nCould not convert PDF automatically.")
    print("Please install poppler-utils to use pdftoppm (fastest):")
    print("  Ubuntu/Debian: sudo apt-get install poppler-utils")
    print("  macOS: brew install poppler")
    print("  Windows: Download poppler and add to PATH")
    print("\nThen run:")
    print("  pdftoppm -png -r 150 wildfire.pdf pages/page")

if __name__ == "__main__":
    convert_pdf()
