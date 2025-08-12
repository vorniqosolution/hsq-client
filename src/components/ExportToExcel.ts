import * as XLSX from "xlsx";

/**
 * Export multiple sheets to Excel.
 * @param {Object} sheets - { [sheetName: string]: any[] }
 * @param {string} fileName
 */
export function exportMultipleSheetsToExcel(
  sheets: { [sheetName: string]: any[] },
  fileName: string
) {
  const wb = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, data]) => {
    if (data && data.length) {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, name);
    }
  });
  XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}