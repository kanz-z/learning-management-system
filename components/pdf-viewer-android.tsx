import { useEffect, useState } from "react";
import { pdfjs } from "react-pdf";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Initialize PDF.js worker with the correct CDN path
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PDFViewerAndroidProps {
  file: File;
  onLoadSuccess: (numPages: number) => void;
}

export default function PDFViewerAndroid({
  file,
  onLoadSuccess,
}: PDFViewerAndroidProps) {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const loadPdf = async () => {
      const fileUrl = URL.createObjectURL(file);
      const pdf = await pdfjs.getDocument(fileUrl).promise;
      onLoadSuccess(pdf.numPages);

      const imagePromises = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        imagePromises.push(renderPageToImage(pdf, pageNum));
      }

      const imageUrls = await Promise.all(imagePromises);
      setImages(imageUrls);
      URL.revokeObjectURL(fileUrl);
    };

    const renderPageToImage = async (pdf: any, pageNum: number) => {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      return canvas.toDataURL("image/jpeg");
    };

    loadPdf();
  }, [file, onLoadSuccess]);

  return (
    <div className="pdf-viewer-android">
      {images.map((image, index) => (
        <TransformWrapper key={index}>
          <TransformComponent>
            <img
              src={image}
              alt={`Page ${index + 1}`}
              className="pdf-page-image"
            />
          </TransformComponent>
        </TransformWrapper>
      ))}
      <style jsx>{`
        .pdf-viewer-android {
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
        }
        .pdf-page-image {
          width: 100%;
          max-width: 100%;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
