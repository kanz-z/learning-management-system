import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

interface PDFViewerAndroidProps {
  file: File;
  pageNumber: number;
  onLoadSuccess: (numPages: number) => void;
}

// Initialize PDF.js worker with the correct CDN path
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export default function PDFViewerAndroid({
  file,
  pageNumber,
  onLoadSuccess,
}: PDFViewerAndroidProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

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

  return (
    <div>
      {fileUrl && (
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
        >
          <Page pageNumber={pageNumber} />
        </Document>
      )}
    </div>
  );
}
