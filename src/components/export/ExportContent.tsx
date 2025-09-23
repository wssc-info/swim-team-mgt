'use client';

interface ExportData {
  content: string;
  fileName: string;
}

interface ExportContentProps {
  exportData: ExportData | null;
  onCopyToClipboard: () => void;
  onDownload: () => void;
  onClear: () => void;
}

export default function ExportContent({ exportData, onCopyToClipboard, onDownload, onClear }: ExportContentProps) {
  if (!exportData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">SDIF Export Content</h2>
        <div className="flex space-x-2">
          <button
            onClick={onCopyToClipboard}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Copy to Clipboard
          </button>
          <button
            onClick={onDownload}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Download File
          </button>
          <button
            onClick={onClear}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          File name: <span className="font-mono">{exportData.fileName}</span>
        </p>
        <p className="text-sm text-gray-600">
          Content size: {exportData.content.length} characters
        </p>
      </div>

      <pre
        className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm bg-gray-50 overflow-scroll"
      >{exportData.content}</pre>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Instructions:</strong> You can copy this content to your clipboard and paste it into a text file, 
          or use the "Download File" button to save it directly as a .sd3 file for import into Meet Manager.
        </p>
      </div>
    </div>
  );
}
