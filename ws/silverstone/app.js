document.addEventListener('DOMContentLoaded', () => {
    const TOTAL_PAGES = 154;
    const PAGES_DIR = 'pages';
    
    // UI Elements
    const pageImage = document.getElementById('currentPageImage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const pageSelect = document.getElementById('pageSelect');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const toggleFullscreenBtn = document.getElementById('toggleFullscreen');
    const controlsPanel = document.querySelector('.floating-controls');
    const wrapper = document.getElementById('pageDisplayWrapper');
    
    let activePage = 1;
    let controlsTimeout;

    // Zoom and Pan States
    let scale = 1;
    let pointX = 0;
    let pointY = 0;
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    // Touch tracking (mobile pinch-zoom)
    let touchStartDist = 0;
    let touchStartScale = 1;

    // Helper to format page number (e.g., 01, 12, 154)
    function formatPageNum(num) {
        return num.toString().padStart(2, '0');
    }

    // Initialize Dropdown Selector options
    function initSelector() {
        pageSelect.innerHTML = '';
        for (let i = 1; i <= TOTAL_PAGES; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `Page ${i}`;
            pageSelect.appendChild(opt);
        }
    }

    // Apply CSS Transform for Zoom & Pan
    function updateTransform() {
        // Keep translation within reasonable bounds to prevent dragging image completely offscreen
        const maxTranslationX = (scale - 1) * (pageImage.clientWidth / 2);
        const maxTranslationY = (scale - 1) * (pageImage.clientHeight / 2);
        
        if (scale > 1) {
            pointX = Math.max(-maxTranslationX, Math.min(maxTranslationX, pointX));
            pointY = Math.max(-maxTranslationY, Math.min(maxTranslationY, pointY));
        } else {
            pointX = 0;
            pointY = 0;
        }

        pageImage.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
        
        // Change cursor based on zoom state
        if (scale > 1) {
            pageImage.style.cursor = 'grab';
        } else {
            pageImage.style.cursor = 'default';
        }
    }

    // Reset Zoom and Pan
    function resetZoom() {
        scale = 1;
        pointX = 0;
        pointY = 0;
        updateTransform();
    }

    // Load and Display Page
    function loadPage(pageNum) {
        if (pageNum < 1 || pageNum > TOTAL_PAGES) return;
        
        activePage = pageNum;
        pageSelect.value = pageNum;
        
        // Update URL hash to support sharing and browser history
        if (window.location.hash !== `#page-${pageNum}`) {
            history.replaceState(null, null, `#page-${pageNum}`);
        }
        
        // Show loading spinner and fade out image
        loadingSpinner.classList.add('active');
        pageImage.classList.remove('loaded');
        
        // Load image
        const imgPath = `${PAGES_DIR}/page-${formatPageNum(pageNum)}.jpg`;
        pageImage.src = imgPath;
        
        pageImage.onload = () => {
            loadingSpinner.classList.remove('active');
            pageImage.classList.add('loaded');
            resetZoom();
            
            // Preload next page image
            preloadPage(pageNum + 1);
        };
    }

    // Preload next page for instant navigation
    function preloadPage(pageNum) {
        if (pageNum <= TOTAL_PAGES) {
            const nextImg = new Image();
            nextImg.src = `${PAGES_DIR}/page-${formatPageNum(pageNum)}.jpg`;
        }
    }

    // Navigation triggers
    function goToPrevPage() {
        if (activePage > 1) {
            loadPage(activePage - 1);
        }
    }

    // Navigation triggers
    function goToNextPage() {
        if (activePage < TOTAL_PAGES) {
            loadPage(activePage + 1);
        }
    }

    prevPageBtn.addEventListener('click', goToPrevPage);
    nextPageBtn.addEventListener('click', goToNextPage);

    pageSelect.addEventListener('change', (e) => {
        loadPage(parseInt(e.target.value));
    });

    // ----------------------------------------------------
    // Desktop Zoom & Pan (Mouse Scroll & Drag)
    // ----------------------------------------------------
    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const zoomIntensity = 0.1;
        const previousScale = scale;
        
        // Adjust zoom scale
        if (e.deltaY < 0) {
            scale = Math.min(5, scale + zoomIntensity);
        } else {
            scale = Math.max(1, scale - zoomIntensity);
        }
        
        // Adjust translation to zoom towards cursor location
        const rect = pageImage.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - (rect.width / 2);
        const offsetY = e.clientY - rect.top - (rect.height / 2);
        
        if (scale > 1) {
            pointX -= offsetX * (scale - previousScale) / scale;
            pointY -= offsetY * (scale - previousScale) / scale;
        }

        updateTransform();
    }, { passive: false });

    // Drag-to-Pan (Mouse)
    wrapper.addEventListener('mousedown', (e) => {
        if (scale <= 1) return;
        isDragging = true;
        startX = e.clientX - pointX;
        startY = e.clientY - pointY;
        pageImage.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        pointX = e.clientX - startX;
        pointY = e.clientY - startY;
        updateTransform();
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            pageImage.style.cursor = 'grab';
        }
    });

    // ----------------------------------------------------
    // Mobile Zoom & Pan (Pinch & Pan Touch Gestures)
    // ----------------------------------------------------
    wrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            // Drag-to-Pan initialization
            isDragging = true;
            startX = e.touches[0].clientX - pointX;
            startY = e.touches[0].clientY - pointY;
        } else if (e.touches.length === 2) {
            // Pinch-Zoom initialization
            isDragging = false;
            touchStartDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchStartScale = scale;
        }
    });

    wrapper.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            e.preventDefault();
            pointX = e.touches[0].clientX - startX;
            pointY = e.touches[0].clientY - startY;
            updateTransform();
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            // Adjust zoom factor based on pinch gesture
            const factor = dist / touchStartDist;
            scale = Math.min(5, Math.max(1, touchStartScale * factor));
            
            updateTransform();
        }
    }, { passive: false });

    wrapper.addEventListener('touchend', () => {
        isDragging = false;
    });

    // ----------------------------------------------------
    // Keyboard Navigation
    // ----------------------------------------------------
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
            e.preventDefault();
            goToNextPage();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            goToPrevPage();
        } else if (e.key === 'Home') {
            e.preventDefault();
            loadPage(1);
        } else if (e.key === 'End') {
            e.preventDefault();
            loadPage(TOTAL_PAGES);
        }
    });

    // Fullscreen Mode
    toggleFullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error enabling fullscreen: ${err.message}`);
            });
            toggleFullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
        } else {
            document.exitFullscreen();
            toggleFullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    });

    // Hide UI controls when mouse is idle
    function resetControlsTimeout() {
        controlsPanel.classList.remove('fade-out');
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            controlsPanel.classList.add('fade-out');
        }, 3000);
    }

    document.addEventListener('mousemove', resetControlsTimeout);
    document.addEventListener('click', resetControlsTimeout);
    document.addEventListener('keydown', resetControlsTimeout);

    // Helper to get page number from URL hash
    function getPageFromHash() {
        const hash = window.location.hash;
        if (hash) {
            const match = hash.match(/#page-(\d+)/);
            if (match) {
                const pageNum = parseInt(match[1], 10);
                if (pageNum >= 1 && pageNum <= TOTAL_PAGES) {
                    return pageNum;
                }
            }
        }
        return 1;
    }

    // Init App
    initSelector();
    const initialPage = getPageFromHash();
    loadPage(initialPage);
    resetControlsTimeout();

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        const pageNum = getPageFromHash();
        if (pageNum !== activePage) {
            loadPage(pageNum);
        }
    });
});
