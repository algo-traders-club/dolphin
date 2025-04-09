/**
 * Utility for exporting data to CSV format
 */

/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers (if not provided, will use object keys)
 * @returns CSV formatted string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string {
  if (!data || !data.length) return '';

  // Use provided headers or extract from first object
  const columnHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = columnHeaders.join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return columnHeaders.map(header => {
      // Handle special cases for CSV formatting
      const value = item[header];
      
      // Convert null/undefined to empty string
      if (value === null || value === undefined) return '';
      
      // Format dates
      if (value instanceof Date) {
        return `"${value.toISOString()}"`;
      }
      
      // Handle numbers
      if (typeof value === 'number') return value;
      
      // Handle strings - escape quotes and wrap in quotes if contains commas or quotes
      if (typeof value === 'string') {
        const escaped = value.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
          return `"${escaped}"`;
        }
        return escaped;
      }
      
      // Handle other types
      return `"${String(value)}"`;
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
}

/**
 * Download data as a CSV file
 * @param data Array of objects to convert to CSV
 * @param filename Filename for the downloaded file
 * @param headers Optional custom headers
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  if (!data || !data.length) {
    console.warn('No data to export');
    return;
  }
  
  // Generate CSV content
  const csvContent = convertToCSV(data, headers);
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  
  // Support for browsers that have the download attribute
  if (link.download !== undefined) {
    // Create a URL to the blob
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Clean up the URL
    URL.revokeObjectURL(url);
  } else {
    // Fallback for browsers that don't support the download attribute
    console.warn('Browser does not support direct download. Open CSV in new tab instead.');
    window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
  }
}

/**
 * Create a download button component for CSV export
 * @param data Data to export
 * @param filename Filename for the downloaded file
 * @param buttonText Text to display on the button
 * @param headers Optional custom headers
 */
export function createCSVExportButton<T extends Record<string, any>>(
  data: T[],
  filename: string,
  buttonText: string = 'Download CSV',
  headers?: string[]
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = buttonText;
  button.className = 'csv-export-button';
  button.onclick = () => downloadCSV(data, filename, headers);
  return button;
}
