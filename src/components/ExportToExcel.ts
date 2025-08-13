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
      "Total Guests": cat.totalReservations,
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

  // Generic handler for simple key-value reports
  let reportDataObject: object = {};
  let fileName = "Revenue_Report.xlsx";

  if ("monthlyrevenue" in data) {
    reportDataObject = (data as MonthlyRevenueResponse).monthlyrevenue;
    fileName = `Monthly_Revenue_${data.month}-${data.year}.xlsx`;
  } else if ("weeklyrevenue" in data) {
    reportDataObject = (data as WeeklyRevenueResponse).weeklyrevenue;
    fileName = `Weekly_Revenue_W${data.week}-${data.year}.xlsx`;
  } else if ("day" in data) {
    const { totalRevenue, totalReservations } = data as DailyRevenueResponse;
    reportDataObject = { totalRevenue, totalReservations };
    fileName = `Daily_Revenue_${data.day}-${data.month}-${data.year}.xlsx`;
  } else if ("year" in data && !("day" in data)) {
    const { totalRevenue, totalReservations } = data as YearlyRevenueResponse;
    reportDataObject = { totalRevenue, totalReservations };
    fileName = `Yearly_Revenue_${data.year}.xlsx`;
  } else if ("totalRevenue" in data) {
    const { totalRevenue, totalReservations } = data as AllRevenueResponse;
    reportDataObject = { totalRevenue, totalReservations };
    fileName = "All_Time_Revenue.xlsx";
  }

  const rows = Object.entries(reportDataObject).map(([key, value]) => ({
    Metric: key,
    Value: value,
  }));
  return { rows, fileName };
};

/**
 * The main exported function. It takes any report data, transforms it, and generates an Excel file.
 */
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
