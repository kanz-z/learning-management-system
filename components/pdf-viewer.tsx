"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Initialize PDF.js worker with the correct CDN path
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  file: File;
  pageNumber: number;
  onLoadSuccess: (numPages: number) => void;
}

export default function PDFViewer({
  file,
  pageNumber,
  onLoadSuccess,
}: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(600);
  const [scale, setScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);

  // Detect Android platform
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroidDevice = /android/.test(userAgent);
    setIsAndroid(isAndroidDevice);
  }, []);

  // Create URL for the file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  // Handle container and window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // For Android, we need to account for viewport scaling issues
        const containerWidth = containerRef.current.clientWidth;
        const viewportWidth = window.innerWidth;

        // Set appropriate width based on container and device type
        const calculatedWidth = isAndroid
          ? Math.min(viewportWidth - 20, 600) // Ensure margins on Android
          : Math.min(
              containerWidth,
              window.innerWidth > 768 ? 600 : window.innerWidth - 40
            );

        setWidth(calculatedWidth);
      }
    };

    handleResize(); // Set initial width

    // Use ResizeObserver for more reliable size detection, especially on Android
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(handleResize);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
      };
    } else {
      // Fallback to window resize for older browsers
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isAndroid]);

  // Handle document load success
  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    onLoadSuccess(numPages);
  };

  // Zoom controls for better mobile experience
  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col w-full">
      {/* Zoom controls */}
      <div className="flex justify-center space-x-2 mb-2">
        <button
          onClick={handleZoomOut}
          className="px-2 py-1 bg-gray-200 rounded text-sm"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          onClick={handleResetZoom}
          className="px-2 py-1 bg-gray-200 rounded text-sm"
        >
          Reset
        </button>
        <button
          onClick={handleZoomIn}
          className="px-2 py-1 bg-gray-200 rounded text-sm"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      {/* PDF container with proper styles for Android */}
      <div
        className={`pdf-container flex justify-center ${
          isAndroid ? "android-pdf-container" : ""
        }`}
      >
        <Document
          file={fileUrl}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={(error) => console.error("Error loading PDF:", error)}
          className="flex justify-center"
          options={{
            cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/",
            cMapPacked: true,
          }}
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="pdf-page"
            width={width * scale}
            scale={scale}
          />
        </Document>
      </div>

      {/* Add some styles to help with touch interactions */}
      <style jsx global>{`
        .pdf-page {
          touch-action: pan-y pinch-zoom;
          -webkit-overflow-scrolling: touch;
        }

        .android-pdf-container {
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 768px) {
          .pdf-page canvas {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
