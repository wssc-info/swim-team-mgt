'use client';

export default function ExportInfo() {
  return (
    <div className="bg-blue-50 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-blue-800 mb-3">About SDIF Export</h2>
      <div className="text-blue-700 space-y-2 text-sm">
        <p>
          The export generates a Swimming Data Interchange Format (SDIF) .sd3 file that can be imported 
          into Meet Manager and other swimming meet management software.
        </p>
        <p>
          <strong>What's included:</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Individual event entries with swimmer details and seed times</li>
          <li>Relay team entries with swimmer lineups</li>
          <li>Proper SDIF formatting for meet management software compatibility</li>
          <li>Team information and meet details</li>
        </ul>
        <p className="mt-3">
          <strong>Note:</strong> Only swimmers who have selected events for the chosen meet and 
          relay teams created for available events will be included in the export.
        </p>
      </div>
    </div>
  );
}
