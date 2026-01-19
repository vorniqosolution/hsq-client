import React, { useState, useEffect } from "react";
import { exportToExcel } from "../components/ExportToExcel";
import {
  useRevenueContext,
  AllRevenueResponse,
  MonthlyRevenueResponse,
  YearlyRevenueResponse,
  WeeklyRevenueResponse,
  DailyRevenueResponse,
  RoomCategoryRevenueResponse,
  DiscountedGuestsResponse,
} from "../contexts/revenueContext";

// Import Lucide icons
import {
  Calendar,
  BarChart3,
  Download,
  FileText,
  AlertCircle,
  Loader2,
  Filter,
  Tag,
  DollarSign,
  Banknote,
  Users,
} from "lucide-react";


// The getISOWeek and getWeeksInMonth functions remain the same
const getISOWeek = (date: Date): number => {
  // Same implementation as before
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNo;
};

const getWeeksInMonth = (year: number, month: number) => {
  // Same implementation as before
  if (!year || !month) return [];
  const weeks: {
    [key: number]: { week: number; year: number; start: Date; end: Date };
  } = {};
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dateCopy = new Date(d);
    const week = getISOWeek(dateCopy);
    if (!weeks[week]) {
      const startOfWeek = new Date(dateCopy);
      startOfWeek.setDate(
        dateCopy.getDate() -
        (dateCopy.getDay() === 0 ? 6 : dateCopy.getDay() - 1)
      );
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      weeks[week] = {
        week,
        year: dateCopy.getFullYear(),
        start: startOfWeek,
        end: endOfWeek,
      };
    }
  }
  return Object.values(weeks).sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
};

const RevenuePage = () => {
  const {
    reportData,
    loading,
    error: apiError,
    fetchAllRevenue,
    fetchDailyRevenue,
    fetchWeeklyRevenue,
    fetchMonthlyRevenue,
    fetchYearlyRevenue,
    fetchRoomCategoriesRevenue,
    fetchDiscountedGuests,
  } = useRevenueContext();

  const [reportType, setReportType] = useState("monthly");

  const [params, setParams] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    week: getISOWeek(new Date()),
    day: new Date().getDate(),
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<
    { week: number; year: number; start: Date; end: Date }[]
  >([]);

  // Update available weeks when month/year changes
  useEffect(() => {
    if (reportType === "weekly") {
      const weeksForMonth = getWeeksInMonth(params.year, params.month);
      setWeeks(weeksForMonth);
    }
  }, [params.year, params.month, reportType]);

  const handleParamChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericValue = parseInt(value, 10);
    setParams((prev) => ({
      ...prev,
      [name]: isNaN(numericValue) ? "" : numericValue,
    }));
  };

  const handleFetchReport = () => {
    setValidationError(null);
    const { year, month, week, day } = params;

    // Validation logic remains the same
    if (
      ["yearly", "monthly", "weekly", "daily", "categories", "guests"].includes(
        reportType
      ) &&
      (!year || year < 1970)
    ) {
      setValidationError("Please enter a valid year.");
      return;
    }
    if (
      ["monthly", "daily", "categories", "guests"].includes(reportType) &&
      (!month || month < 1 || month > 12)
    ) {
      setValidationError("Please enter a valid month (1-12).");
      return;
    }
    if (reportType === "weekly" && !week) {
      setValidationError("Please select a week from the dropdown.");
      return;
    }
    if (reportType === "daily" && (!day || day < 1 || day > 31)) {
      setValidationError("Please enter a valid day (1-31).");
      return;
    }

    // API calls remain the same
    switch (reportType) {
      case "monthly":
        return fetchMonthlyRevenue(month, year);
      case "yearly":
        return fetchYearlyRevenue(year);
      case "weekly":
        return fetchWeeklyRevenue(week, year);
      case "daily":
        return fetchDailyRevenue(day, month, year);
      case "categories":
        return fetchRoomCategoriesRevenue(month, year);
      case "guests":
        return fetchDiscountedGuests(month, year);
      case "all-time":
        return fetchAllRevenue();
    }
  };

  const handleDownload = () => {
    exportToExcel(reportData);
  };

  // Get the appropriate icon based on report type
  const getReportIcon = () => {
    switch (reportType) {
      case "monthly":
        return <Calendar className="h-5 w-5 text-amber-500" />;
      case "yearly":
        return <BarChart3 className="h-5 w-5 text-amber-500" />;
      case "weekly":
        return <Calendar className="h-5 w-5 text-amber-500" />;
      case "daily":
        return <Calendar className="h-5 w-5 text-amber-500" />;
      case "categories":
        return <Tag className="h-5 w-5 text-amber-500" />;
      case "guests":
        return <Users className="h-5 w-5 text-amber-500" />;
      case "all-time":
        return <Banknote className="h-5 w-5 text-amber-500" />;
      default:
        return <FileText className="h-5 w-5 text-amber-500" />;
    }
  };

  // Function to render the parameter inputs based on report type
  const renderParameterInputs = () => {
    switch (reportType) {
      case "weekly":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="year"
                className="text-sm font-medium text-slate-700"
              >
                Year
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={params.year}
                onChange={handleParamChange}
                min="2000"
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="month"
                className="text-sm font-medium text-slate-700"
              >
                Month
              </label>
              <input
                type="number"
                id="month"
                name="month"
                value={params.month}
                onChange={handleParamChange}
                min="1"
                max="12"
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="week"
                className="text-sm font-medium text-slate-700"
              >
                Week
              </label>
              <select
                id="week"
                name="week"
                value={params.week}
                onChange={handleParamChange}
                disabled={weeks.length === 0}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Choose a week --</option>
                {weeks.map(({ week, year, start, end }) => {
                  const options: Intl.DateTimeFormatOptions = {
                    month: "short",
                    day: "numeric",
                  };
                  const label = `Week ${week}: ${start.toLocaleDateString(
                    undefined,
                    options
                  )} - ${end.toLocaleDateString(undefined, options)}`;
                  return (
                    <option key={`${year}-${week}`} value={week}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        );

      case "monthly":
      case "categories":
      case "guests":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="month"
                className="text-sm font-medium text-slate-700"
              >
                Month
              </label>
              <input
                type="number"
                id="month"
                name="month"
                value={params.month}
                onChange={handleParamChange}
                min="1"
                max="12"
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="year"
                className="text-sm font-medium text-slate-700"
              >
                Year
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={params.year}
                onChange={handleParamChange}
                min="2000"
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        );

      case "yearly":
        return (
          <div className="space-y-2">
            <label
              htmlFor="year"
              className="text-sm font-medium text-slate-700"
            >
              Year
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={params.year}
              onChange={handleParamChange}
              min="2000"
              className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        );

      case "daily":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="day"
                className="text-sm font-medium text-slate-700"
              >
                Day
              </label>
              <input
                type="number"
                id="day"
                name="day"
                value={params.day}
                onChange={handleParamChange}
                min="1"
                max="31"
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="month"
                className="text-sm font-medium text-slate-700"
              >
                Month
              </label>
              <input
                type="number"
                id="month"
                name="month"
                value={params.month}
                onChange={handleParamChange}
                min="1"
                max="12"
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="year"
                className="text-sm font-medium text-slate-700"
              >
                Year
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={params.year}
                onChange={handleParamChange}
                min="2000"
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Function to render report data
  // Function to render report data
  const renderReportData = () => {
    if (!reportData) {
      return (
        <div className="py-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-light">
            Select and fetch a report to view data
          </p>
        </div>
      );
    }

    const getReportBadge = () => (
      <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
        {reportType}
      </span>
    );

    // --- Monthly Report ---
    if ("monthlyrevenue" in reportData) {
      const data = reportData as MonthlyRevenueResponse;
      const revenue = data.monthlyrevenue?.totalRevenue ?? 0;
      const invoiceCount = data.monthlyrevenue?.invoiceCount ?? 0; // In new system, this is invoice count

      return (
        <div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-light text-slate-900">Monthly Report ({data.month}/{data.year})</h3>
              {getReportBadge()}
            </div>
            <button onClick={handleDownload} className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors">
              <Download className="h-4 w-4" />
              <span>Download Excel</span>
            </button>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Total Revenue</div>
                <div className="text-2xl font-light text-slate-900">Rs: {revenue.toLocaleString()}</div>
              </div>
              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Total Invoices</div>
                <div className="text-2xl font-light text-slate-900">{invoiceCount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- Weekly Report ---
    if ("weeklyrevenue" in reportData) {
      const data = reportData as WeeklyRevenueResponse;
      const revenue = data.weeklyrevenue?.totalRevenue ?? 0;
      const invoiceCount = data.weeklyrevenue?.invoiceCount ?? 0; // In new system, this is invoice count

      return (
        <div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-light text-slate-900">Weekly Report (Week {data.week}, {data.year})</h3>
              {getReportBadge()}
            </div>
            <button onClick={handleDownload} className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors">
              <Download className="h-4 w-4" />
              <span>Download Excel</span>
            </button>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Total Revenue</div>
                <div className="text-2xl font-light text-slate-900">Rs: {revenue.toLocaleString()}</div>
              </div>
              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Total Invoices</div>
                <div className="text-2xl font-light text-slate-900">{invoiceCount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- Category Report ---
    if ("categories" in reportData) {
      const data = reportData as RoomCategoryRevenueResponse;
      const categories = data.categories ?? [];

      return (
        <div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-light text-slate-900">Room Category Revenue ({data.month}/{data.year})</h3>
              {getReportBadge()}
            </div>
            <button onClick={handleDownload} className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors">
              <Download className="h-4 w-4" />
              <span>Download Excel</span>
            </button>
          </div>
          <div className="space-y-4">
            {categories.length > 0 ? (
              categories.map((cat, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <h4 className="text-md font-medium text-slate-800">{cat.category}</h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded">
                      <div className="text-xs text-slate-500">Total Revenue</div>
                      <div className="text-lg font-medium text-slate-900">Rs: {(cat.totalRevenue ?? 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                      <div className="text-xs text-slate-500">Total Invoices</div>
                      <div className="text-lg font-medium text-slate-900">{(cat.invoiceCount ?? 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">No category data found for this period.</p>
            )}
          </div>
        </div>
      );
    }

    // --- Discounted Guests Report ---
    if ("guests" in reportData) {
      const data = reportData as DiscountedGuestsResponse;
      // This is the correct array to use
      const discountedGuestList = data.guests ?? [];

      return (
        <div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-light text-slate-900">Discounted Guests ({data.month}/{data.year})</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{data.count} guests</span>
            </div>
            <button onClick={handleDownload} className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors">
              <Download className="h-4 w-4" />
              <span>Download Excel</span>
            </button>
          </div>
          <div className="space-y-4">
            {discountedGuestList.length > 0 ? (
              discountedGuestList.map((guest, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between mb-3">
                    <div className="flex items-center space-x-2 mb-2 md:mb-0">
                      <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {guest.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-md font-medium text-slate-800">{guest.fullName}</h4>
                        <p className="text-xs text-slate-500">
                          {guest.roomCategory} - Room {guest.roomNumber}
                        </p>
                      </div>
                    </div>
                    {/* Use the new, correct discountAmount field */}
                    {guest.discountAmount > 0 &&
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Discount Applied
                      </span>
                    }
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded">
                      <div className="text-xs text-slate-500">Total Discount</div>
                      <div className="text-sm font-medium text-slate-900">
                        Rs: {(guest.discountAmount ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                      <div className="text-xs text-slate-500">Final Bill</div>
                      <div className="text-sm font-medium text-slate-900">
                        Rs: {(guest.totalRent ?? 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">No discounted invoices found for this period.</p>
            )}
          </div>
        </div>
      );
    }

    // --- Daily, Yearly, and All-Time Reports ---
    // Using a single block for these as their structure is similar
    if ("totalRevenue" in reportData) {
      const data = reportData as DailyRevenueResponse | YearlyRevenueResponse | AllRevenueResponse;
      const revenue = data.totalRevenue ?? 0;
      const invoiceCount = data.invoiceCount ?? 0;
      let title = "All-Time Revenue";
      let icon = <Banknote className="h-5 w-5 text-amber-500" />;

      if ("day" in data) {
        title = `Daily Report (${data.day}/${data.month}/${data.year})`;
        icon = <Calendar className="h-5 w-5 text-amber-500" />;
      } else if ("year" in data) {
        title = `Yearly Report (${data.year})`;
        icon = <BarChart3 className="h-5 w-5 text-amber-500" />;
      }

      return (
        <div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              {icon}
              <h3 className="text-lg font-light text-slate-900">{title}</h3>
              {reportType !== 'all-time' && getReportBadge()}
            </div>
            <button onClick={handleDownload} className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors">
              <Download className="h-4 w-4" />
              <span>Download Excel</span>
            </button>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Total Revenue</div>
                <div className="text-2xl font-light text-slate-900">Rs: {revenue.toLocaleString()}</div>
              </div>
              <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                <div className="text-sm text-slate-500 mb-1">Total Invoices</div>
                <div className="text-2xl font-light text-slate-900">{invoiceCount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <p className="text-center text-slate-500 py-8">Could not determine the report type.</p>;
  };

  return (
    <div className="w-full flex gap-10 bg-slate-50">
      <div className="w-full">

        {/* Header */}
        <div className=" p-4 md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-light text-slate-900 tracking-wide flex items-center">
              <BarChart3 className="h-8 w-8 text-amber-500 mr-3" />
              Revenue Reports
            </h1>
            <p className="text-slate-600 mt-2 font-light">
              Generate and download detailed revenue reports
            </p>
          </div>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-lg shadow-md border border-slate-100 mb-6">
          <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-lg">
            <h2 className="text-xl font-light text-slate-900 flex items-center">
              <Filter className="h-5 w-5 text-amber-500 mr-2" />
              Report Parameters
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select report type and specify the time period
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* Report Type Selector */}
              <div className="space-y-2">
                <label
                  htmlFor="reportType"
                  className="text-sm font-medium text-slate-700"
                >
                  Report Type
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {getReportIcon()}
                  </div>
                  <select
                    id="reportType"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="monthly">Monthly Revenue</option>
                    <option value="yearly">Yearly Revenue</option>
                    <option value="weekly">Weekly Revenue</option>
                    <option value="daily">Daily Revenue</option>
                    <option value="categories">Category Revenue</option>
                    <option value="guests">Discounted Guests</option>
                    <option value="all-time">All-Time Revenue</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Parameter Inputs */}
              {reportType !== "all-time" && (
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  {renderParameterInputs()}
                </div>
              )}

              {/* Fetch Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleFetchReport}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-5 w-5" />
                      <span>Generate Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-lg shadow-md border border-slate-100">
          <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-lg">
            <h2 className="text-xl font-light text-slate-900 flex items-center">
              <FileText className="h-5 w-5 text-amber-500 mr-2" />
              Report Results
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              View and download the generated report data
            </p>
          </div>

          <div className="p-6">
            {/* Error Display */}
            {validationError && (
              <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Validation Error</p>
                  <p className="text-sm">{validationError}</p>
                </div>
              </div>
            )}

            {apiError && (
              <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">API Error</p>
                  <p className="text-sm">{apiError}</p>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="py-8 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-4" />
                <p className="text-slate-600">Loading report data...</p>
              </div>
            )}

            {/* Report Data */}
            {!loading && !apiError && !validationError && renderReportData()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;
