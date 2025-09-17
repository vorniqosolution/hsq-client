// src/utils/excelUtils.ts

import * as XLSX from "xlsx";
import {
  AllRevenueResponse,
  MonthlyRevenueResponse,
  YearlyRevenueResponse,
  WeeklyRevenueResponse,
  DailyRevenueResponse,
  RoomCategoryRevenueResponse,
  DiscountedGuestsResponse,
} from "../contexts/revenueContext"; // Adjust path to your context file

const transformDataForExcel = (data: any | null) => {
  if (!data) return null;

  // Handles reports with a list structure (e.g., categories, guests)
  if ("categories" in data) {
    const report = data as RoomCategoryRevenueResponse;
    const rows = report.categories.map((cat) => ({
      Category: cat.category,
      "Total Revenue": cat.totalRevenue,
      "Total Invoices": cat.invoiceCount,
    }));
    return {
      rows,
      fileName: `Category_Revenue_${report.month}-${report.year}.xlsx`,
    };
  }

  if ("guests" in data) {
    const report = data as DiscountedGuestsResponse;
    const rows = report.guests.map((guest) => ({
      "Full Name": guest.fullName,
      Email: guest.email,
      "Room Number": guest.roomNumber,
      "Room Category": guest.roomCategory,
      "Discount Title": guest.discountTitle,
      "Total Rent": guest.totalRent,
      "Discount Amount": guest.additionaldiscount,
      "Applied By": guest.createdByEmail,
    }));
    return {
      rows,
      fileName: `Discounted_Guests_${report.month}-${report.year}.xlsx`,
    };
  }

  const toGuests = (obj: any) => ({
  totalRevenue: Number(obj?.totalRevenue ?? 0),
  totalGuests: Number(
    obj?.totalGuests ?? obj?.totalGuest ?? obj?.totalReservations ?? 0
  ),
});

let reportDataObject: Record<string, number> = {};
let fileName = "Revenue_Report.xlsx";

if ("monthlyrevenue" in data) {
  // data.month, data.year are on the root object
  reportDataObject = toGuests((data as MonthlyRevenueResponse)?.monthlyrevenue);
  fileName = `Monthly_Revenue_${data.month}-${data.year}.xlsx`;
} else if ("weeklyrevenue" in data) {
  reportDataObject = toGuests((data as WeeklyRevenueResponse)?.weeklyrevenue);
  fileName = `Weekly_Revenue_W${data.week}-${data.year}.xlsx`;
} else if ("day" in data) {
  reportDataObject = toGuests(data as DailyRevenueResponse);
  fileName = `Daily_Revenue_${data.day}-${data.month}-${data.year}.xlsx`;
} else if ("year" in data && !("day" in data)) {
  reportDataObject = toGuests(data as YearlyRevenueResponse);
  fileName = `Yearly_Revenue_${data.year}.xlsx`;
} else if ("totalRevenue" in data) {
  reportDataObject = toGuests(data as AllRevenueResponse);
  fileName = "All_Time_Revenue.xlsx";
}

// Pretty labels for Excel
const rows = Object.entries(reportDataObject).map(([key, value]) => ({
  Metric: key === "totalGuests" ? "Total Guests" :
          key === "totalRevenue" ? "Total Revenue" : key,
  Value: value,
}));

return { rows, fileName };};

export const exportToExcel = (reportData: any) => {
  if (!reportData) {
    alert("No data available to download.");
    return;
  }

  const exportData = transformDataForExcel(reportData);
  if (!exportData || exportData.rows.length === 0) {
    alert("No data to export for this report.");
    return;
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData.rows);

  // Auto-size columns for better readability
  const objectMaxLength = exportData.rows.reduce((acc, obj) => {
    Object.keys(obj).forEach((key) => {
      const value = obj[key as keyof typeof obj] ?? "";
      acc[key] = Math.max(acc[key] || key.length, String(value).length);
    });
    return acc;
  }, {} as { [key: string]: number });
  worksheet["!cols"] = Object.keys(objectMaxLength).map((key) => ({
    wch: objectMaxLength[key] + 2, // add a little extra padding
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, "ReportData");
  XLSX.writeFile(workbook, exportData.fileName);
};
