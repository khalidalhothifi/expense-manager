import React, { useEffect, useState } from "react";
import { Button } from "./UI";

interface FilePreviewModalProps {
  file: {
    data: string; // base64
    fileType: string;
    fileName: string;
  } | null;
  onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      try {
        // Convert Base64 to Blob
        const byteCharacters = atob(file.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file.fileType });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.error("Error creating blob URL", e);
      }
    }
  }, [file]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-semibold text-gray-800 truncate">
            {file.fileName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <div className="flex-1 bg-gray-200 overflow-hidden flex justify-center items-center relative p-4">
          {blobUrl ? (
            file.fileType === "application/pdf" ? (
              <iframe
                src={blobUrl}
                className="w-full h-full rounded shadow-sm bg-white"
                title="PDF Preview"
              ></iframe>
            ) : (
              <img
                src={blobUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded shadow-sm"
              />
            )
          ) : (
            <div className="text-gray-500 flex flex-col items-center">
              <svg
                className="w-12 h-12 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Loading preview...</span>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          {blobUrl && (
            <a
              href={blobUrl}
              download={file.fileName}
              className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-blue-50 transition-colors"
            >
              Download
            </a>
          )}
          <Button onClick={onClose} className="!bg-gray-600 hover:!bg-gray-700">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
