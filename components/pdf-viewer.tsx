"use client"

import { useState, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"

// Initialize PDF.js worker
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
}

interface PDFViewerProps {
  file: File
  pageNumber: number
  onLoadSuccess: (numPages: number) => void
}

export default function PDFViewer({ file, pageNumber, onLoadSuccess }: PDFViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [width, setWidth] = useState<number>(600)

  // Create URL for the file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setFileUrl(url)

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [file])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth > 768 ? 600 : window.innerWidth - 40)
    }

    handleResize() // Set initial width
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Handle document load success
  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    onLoadSuccess(numPages)
  }

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading PDF...</p>
      </div>
    )
  }

  return (
    <Document
      file={fileUrl}
      onLoadSuccess={handleLoadSuccess}
      onLoadError={(error) => console.error("Error loading PDF:", error)}
      className="flex justify-center"
    >
      <Page
        pageNumber={pageNumber}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        className="pdf-page"
        width={width}
      />
    </Document>
  )
}

