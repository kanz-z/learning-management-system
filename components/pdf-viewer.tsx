"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import PDFViewerAndroid from "./pdf-viewer-android";

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
  const [isAndroid, setIsAndroid] = useState<boolean>(false);

  // Detect Android platform
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroidDevice = /android/.test(userAgent);
    setIsAndroid(isAndroidDevice);
  }, []);

  if (isAndroid) {
    return <PDFViewerAndroid file={file} onLoadSuccess={onLoadSuccess} />;
  }

  // Non-Android PDF viewer implementation
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(600);
  const [scale, setScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

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
        const containerWidth = containerRef.current.clientWidth;
        const viewportWidth = window.innerWidth;

        const calculatedWidth = Math.min(
          containerWidth,
          window.innerWidth > 768 ? 600 : window.innerWidth - 40
        );

        setWidth(calculatedWidth);
      }
    };

    handleResize(); // Set initial width

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
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return (
    <div ref={containerRef}>
      {fileUrl && (
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
        >
          <Page pageNumber={pageNumber} scale={scale} width={width} />
        </Document>
      )}
    </div>
  );
}
