// import * as XLSX from "xlsx";

// /**
//  * Export multiple sheets to Excel.
//  * @param {Object} sheets - { [sheetName: string]: any[] }
//  * @param {string} fileName
//  */
// export function exportMultipleSheetsToExcel(
//   sheets: { [sheetName: string]: any[] },
//   fileName: string
// ) {
//   const wb = XLSX.utils.book_new();
//   Object.entries(sheets).forEach(([name, data]) => {
//     if (data && data.length) {
//       const ws = XLSX.utils.json_to_sheet(data);
//       XLSX.utils.book_append_sheet(wb, ws, name);
//     }
//   });
//   XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
// }

import * as XLSX from "xlsx";

/**
 * Export multiple sheets to Excel.
 *
 * Accepts either:
 * - { "Sheet Name": any[] }                            // legacy: inferred headers, skips empty arrays
 * - { "Sheet Name": { rows: any[]; header?: string[]; cols?: number[] } } // new: fixed headers, widths
 */
export function exportMultipleSheetsToExcel(
  sheets: Record<string, any[] | { rows: any[]; header?: string[]; cols?: number[] }>,
  fileName: string
) {
  const wb = XLSX.utils.book_new();

  Object.entries(sheets).forEach(([rawName, spec]) => {
    const name = rawName.slice(0, 31); // Excel sheet name limit

    // Legacy mode: plain array
    if (Array.isArray(spec)) {
      const rows = spec || [];
      if (!rows.length) return; // legacy behavior: skip empty arrays
      const ws = XLSX.utils.json_to_sheet(rows);
      // Try to add an autofilter using inferred headers (if present)
      const columns = Object.keys(rows[0] || {});
      if (columns.length > 0) {
        const endCol = XLSX.utils.encode_col(columns.length - 1);
        ws["!autofilter"] = { ref: `A1:${endCol}1` };
        ws["!cols"] = columns.map(() => ({ wch: 16 }));
        // @ts-ignore freeze header row
        ws["!freeze"] = { xSplit: 0, ySplit: 1 };
      }
      XLSX.utils.book_append_sheet(wb, ws, name);
      return;
    }

    // New mode: object with rows/header/cols
    const rows = spec.rows || [];
    const header = spec.header || [];
    const cols = spec.cols;

    // Create even if rows are empty, as long as header is provided
    if (!rows.length && !header.length) return;

    const ws = header.length
      ? XLSX.utils.json_to_sheet(rows, { header, skipHeader: false })
      : XLSX.utils.json_to_sheet(rows);

    // Column widths
    if (Array.isArray(cols) && cols.length) {
      ws["!cols"] = cols.map((wch) => ({ wch }));
    } else {
      const colCount = header.length || Object.keys(rows[0] || {}).length || 1;
      ws["!cols"] = Array.from({ length: colCount }, () => ({ wch: 16 }));
    }

    // AutoFilter over header row
    const colLen = header.length || Object.keys(rows[0] || {}).length;
    if (colLen > 0) {
      const endCol = XLSX.utils.encode_col(colLen - 1);
      ws["!autofilter"] = { ref: `A1:${endCol}1` };
    }

    // Freeze header row
    // @ts-ignore (supported by sheetjs even if not typed)
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}
