import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, Bed, DollarSign, Settings, LogOut, Menu, X, Home, Crown, Star, Sparkles,
  Download, Percent, Calendar, Ticket, Archive, FileText, CalendarDays, Printer
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { useRevenueContext } from '@/contexts/revenueContext';
import { exportMultipleSheetsToExcel } from '@/components/ExportToExcel';

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Optimized function to get weeks in month
const getWeeksInMonth = (month, year) => {
  if (!month || !year) return [];
  
  const weeks = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  // Get ISO week for first and last day
  const getISOWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };
  
  // Find all week numbers in the month
  const weekNumbers = new Set();
  let currentDate = new Date(firstDay);
  
  while (currentDate <= lastDay) {
    weekNumbers.add(getISOWeek(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Create week objects
  Array.from(weekNumbers).sort((a, b) => a - b).forEach((weekNum, index) => {
    // Find first day of this week in the month
    let weekStart = new Date(firstDay);
    while (getISOWeek(weekStart) !== weekNum || weekStart < firstDay) {
      weekStart.setDate(weekStart.getDate() + 1);
      if (weekStart > lastDay) break;
    }
    if (weekStart > lastDay) weekStart = new Date(firstDay);
    
    // Find last day of this week in the month
    let weekEnd = new Date(weekStart);
    while (getISOWeek(weekEnd) === weekNum && weekEnd <= lastDay) {
      weekEnd.setDate(weekEnd.getDate() + 1);
    }
    weekEnd.setDate(weekEnd.getDate() - 1);
    
    weeks.push({
      weekNum: index + 1,  // Sequential week number within month
      isoWeekNum: weekNum, // Actual ISO week number
      startDate: new Date(weekStart),
      endDate: new Date(weekEnd),
      label: `Week ${index + 1} (${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})`,
    });
  });
  
  return weeks;
};

const RevenuePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Filter state - memoized to prevent unnecessary recalculations
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Memoized weeks for current filter
  const weekOptions = useMemo(
    () => getWeeksInMonth(selectedMonth, selectedYear), 
    [selectedMonth, selectedYear]
  );
  
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);

  // Generate day options for the selected month
  const dayOptions = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  // Reset week and day selection when month/year changes
  useEffect(() => {
    setSelectedWeek(1);
    setSelectedDay(1);
  }, [selectedMonth, selectedYear]);

  // Context with all revenue data
  const { 
    allRevenue,
    weeklyRevenue,
    roomCategoriesRevenue,
    dailyRevenue,
    monthlyRevenue,
    yearlyRevenue,
    discountedGuests,
    loading,
    error,
    fetchAllRevenue,
    fetchWeeklyRevenue,
    fetchRoomCategoriesRevenue,
    fetchDailyRevenue,
    fetchMonthlyRevenue,
    fetchYearlyRevenue,
    fetchDiscountedGuests,
    clearRevenueData
  } = useRevenueContext();

  // Memoized handlers to prevent unnecessary recreations
  const handleMonthChange = useCallback((value) => {
    setSelectedMonth(Number(value));
  }, []);

  const handleYearChange = useCallback((value) => {
    setSelectedYear(Number(value));
  }, []);

  const handleWeekChange = useCallback((value) => {
    setSelectedWeek(Number(value));
  }, []);

  const handleDayChange = useCallback((value) => {
    setSelectedDay(Number(value));
  }, []);

  // Fetch data with debounce to prevent excessive API calls
  useEffect(() => {
    const fetchData = () => {
      clearRevenueData();
      fetchAllRevenue();
      fetchMonthlyRevenue(selectedMonth, selectedYear);
      fetchDailyRevenue(selectedDay, selectedMonth, selectedYear);
      
      // For weekly: use the ISO week number from our week options
      const selectedWeekData = weekOptions[selectedWeek - 1];
      if (selectedWeekData) {
        fetchWeeklyRevenue(selectedWeekData.isoWeekNum, selectedYear);
      }
      
      fetchRoomCategoriesRevenue(selectedMonth, selectedYear);
      fetchYearlyRevenue(selectedYear);
      fetchDiscountedGuests(selectedMonth, selectedYear);
    };

    const timer = setTimeout(fetchData, 300); // Add debounce
    return () => clearTimeout(timer);
  }, [
    selectedMonth, selectedYear, selectedWeek, selectedDay, 
    weekOptions, fetchAllRevenue, fetchMonthlyRevenue, fetchDailyRevenue,
    fetchWeeklyRevenue, fetchRoomCategoriesRevenue, fetchYearlyRevenue,
    fetchDiscountedGuests, clearRevenueData
  ]);

  // Memoized select options
  const monthOptions = useMemo(() => (
    monthNames.map((name, i) => (
      <SelectItem key={i+1} value={String(i+1)}>{name}</SelectItem>
    ))
  ), []);

  const yearOptions = useMemo(() => (
    [...Array(5)].map((_, i) => (
      <SelectItem key={i} value={String(currentYear - i)}>
        {currentYear - i}
      </SelectItem>
    ))
  ), [currentYear]);

  const weekOptionsElements = useMemo(() => (
    weekOptions.map((wk) => (
      <SelectItem key={wk.weekNum} value={wk.weekNum.toString()}>
        {wk.label}
      </SelectItem>
    ))
  ), [weekOptions]);

  const dayOptionsElements = useMemo(() => (
    dayOptions.map((day) => (
      <SelectItem key={day} value={day.toString()}>
        {day}
      </SelectItem>
    ))
  ), [dayOptions]);

  // Nav rendering
  const mainNavItems = [
      { name: "Dashboard", href: "/dashboard", icon: Home },
      { name: "Guests", href: "/guests", icon: Users },
      { name: "Reservation", href: "/reservation", icon: Calendar },
      { name: "Rooms", href: "/rooms", icon: Bed },
      { name: "Discounts", href: "/Discount", icon: Ticket },
      { name: "GST & Tax", href: "/Gst", icon: Percent },
      { name: "Inventory", href: "/Inventory", icon: Archive },
      { name: "Invoices", href: "/Invoices", icon: FileText },
      { name: "Revenue", href: "/Revenue", icon: FileText },
    ];
  const systemNavItems = [{ name: 'Settings', href: '/settings', icon: Settings }];
  
  const isActive = useCallback((href) => 
    href === '/dashboard' ? location.pathname === href : location.pathname.startsWith(href), 
  [location.pathname]);
  
  const renderNavLinks = useCallback((items) => items.map(item => {
    const Icon = item.icon, active = isActive(item.href);
    return (
      <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
        className={`
          group flex items-center px-4 py-3 text-sm rounded-lg
          transition-all duration-200 relative overflow-hidden
          ${active
            ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg shadow-amber-500/10'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }
        `}
      >
        {active && (<div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />)}
        <Icon className={`
          mr-3 h-5 w-5 transition-all duration-200
          ${active ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-300'}
        `} />
        <span className="font-light tracking-wide">{item.name}</span>
        {active && (<Star className="ml-auto h-3 w-3 text-amber-400/60" />)}
      </Link>
    );
  }), [isActive, setSidebarOpen]);
  
  const formatCurrency = useCallback((amount) => 
    typeof amount !== 'number' ? 'N/A' :
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'PKR', 
      maximumFractionDigits: 0 
    }).format(amount).replace('PKR', 'Rs'),
  []);

  const handlePrint = useCallback(() => window.print(), []);

  // Excel Export
  const handleExportAll = useCallback(() => {
    const dailySheet = dailyRevenue 
      ? [{
        Day: dailyRevenue.day,
        Month: dailyRevenue.month,
        Year: dailyRevenue.year,
        "Total Revenue": dailyRevenue.totalRevenue,
        "Total Reservations": dailyRevenue.totalReservations,
      }]
      : [];
    const weeklySheet = weeklyRevenue?.weeklyrevenue
      ? [{
        Week: weeklyRevenue.week,
        Year: weeklyRevenue.year,
        "Total Revenue": weeklyRevenue.weeklyrevenue.totalRevenue,
        "Total Reservations": weeklyRevenue.weeklyrevenue.totalReservations,
      }]
      : [];
    const monthlySheet = monthlyRevenue?.monthlyrevenue
      ? [{
        Month: monthlyRevenue.month,
        Year: monthlyRevenue.year,
        "Total Revenue": monthlyRevenue.monthlyrevenue.totalRevenue,
        "Total Reservations": monthlyRevenue.monthlyrevenue.totalReservations,
      }]
      : [];
    const yearlySheet = yearlyRevenue
      ? [{
        Year: yearlyRevenue.year,
        "Total Revenue": yearlyRevenue.totalRevenue,
        "Total Reservations": yearlyRevenue.totalReservations,
      }]
      : [];
    const categoriesSheet = roomCategoriesRevenue?.categories?.length
      ? roomCategoriesRevenue.categories.map(item => ({
        Category: item._id,
        "Total Revenue": item.totalRevenue,
        "Total Guests": item.totalGuests,
      }))
      : [];
    const discountedGuestsSheet = discountedGuests?.guests?.length
      ? discountedGuests.guests.map(guest => ({
        "Name": guest.fullName,
        "Email": guest.email,
        "Total Rent": guest.totalRent,
        "Discount": guest.additionaldiscount,
        "Discount Title": guest.discountTitle,
        "Room Number": guest.roomNumber,
        "Room Category": guest.roomCategory,
        "Created By": guest.createdByEmail,
      }))
      : [];
      
    exportMultipleSheetsToExcel({
      "Daily Revenue": dailySheet,
      "Weekly Revenue": weeklySheet,
      "Monthly Revenue": monthlySheet,
      "Yearly Revenue": yearlySheet,
      "Room Categories Revenue": categoriesSheet,
      "Discounted Guests": discountedGuestsSheet,
    }, `HSQ_Revenue_Report_${selectedMonth}_${selectedYear}.xlsx`);
  }, [
    dailyRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue, 
    roomCategoriesRevenue, discountedGuests, selectedMonth, selectedYear
  ]);

  // Chart Data
  const categoryChartData = useMemo(() => 
    (roomCategoriesRevenue?.categories || []).map(item => ({
      category: item._id,
      revenue: item.totalRevenue,
      guests: item.totalGuests,
    })),
  [roomCategoriesRevenue]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 
        shadow-2xl transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 px-6 flex items-center border-b border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              
              <Sparkles className="h-4 w-4 text-amber-300 absolute -top-1 -right-1" />
            </div>
            <div>
              <h1 className="text-xl font-light tracking-wider text-white">HSQ ADMIN</h1>
              <p className="text-xs text-amber-400/80 tracking-widest uppercase">Management Panel</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        <nav className="mt-8 px-4 flex flex-col h-[calc(100%-80px)]">
          <div className="flex-grow">
            <div className="space-y-1">
              {renderNavLinks(mainNavItems)}
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="my-4 px-4"><div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" /></div>
            <div className="space-y-1">
              {renderNavLinks(systemNavItems)}
              <button className="group flex items-center px-4 py-3 text-sm text-slate-300 rounded-lg hover:text-white hover:bg-slate-800/50 w-full transition-all duration-200">
                <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-slate-300" />
                <span className="font-light tracking-wide">Sign Out</span>
              </button>
            </div>
          </div>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800/50 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-sm font-medium text-slate-900">AM</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-light text-white truncate">Admin Manager</p>
              <p className="text-xs text-slate-400 truncate">admin@hsqtowers.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
              <div>
                <h1 className="text-4xl font-light text-slate-900 tracking-wide">Revenue Analytics</h1>
                <p className="text-slate-600 mt-2 font-light">Financial insights for HSQ Towers</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                {/* Mobile menu toggle for sidebar */}
                <button 
                  className="lg:hidden p-2 rounded-lg border border-slate-200"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                
                {/* Filters section - now more reliable */}
                <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
                  {/* Month */}
                  <div className="w-full sm:w-auto">
                    <Select 
                      value={selectedMonth.toString()}
                      onValueChange={handleMonthChange}
                    >
                      <SelectTrigger className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-full sm:w-[150px]">
                        <CalendarDays className="h-4 w-4 text-slate-500 mr-2" />
                        <SelectValue placeholder="Month">
                          {monthNames[selectedMonth-1]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Year */}
                  <div className="w-full sm:w-auto">
                    <Select 
                      value={selectedYear.toString()}
                      onValueChange={handleYearChange}
                    >
                      <SelectTrigger className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-full sm:w-[120px]">
                        <SelectValue placeholder="Year">
                          {selectedYear}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Week */}
                  <div className="w-full sm:w-auto">
                    <Select
                      value={selectedWeek.toString()}
                      onValueChange={handleWeekChange}
                    >
                      <SelectTrigger className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-full sm:w-[210px]">
                        <SelectValue placeholder="Week">
                          {weekOptions[selectedWeek-1]?.label || "Week 1"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {weekOptionsElements}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Day */}
                  <div className="w-full sm:w-auto">
                    <Select
                      value={selectedDay.toString()}
                      onValueChange={handleDayChange}
                    >
                      <SelectTrigger className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-full sm:w-[100px]">
                        <SelectValue placeholder="Day">
                          {selectedDay}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {dayOptionsElements}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="w-full sm:w-auto flex gap-2">
                    
                    <Button variant="outline" onClick={handleExportAll} className="flex-1 sm:flex-none">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Revenue */}
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                      {loading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                        <p className="text-2xl font-light mt-2 text-slate-900">
                          {typeof allRevenue?.totalRevenue === 'number' ? formatCurrency(allRevenue.totalRevenue) : 'N/A'}
                        </p>
                      )}
                    </div>
                    <div className="bg-blue-50 p-2 rounded-full">
                      {/* <DollarSign className="h-5 w-5 text-blue-500" /> */}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-4">All time revenue</div>
                </CardContent>
              </Card>
              
              {/* Yearly Revenue */}
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Yearly Revenue</p>
                      {loading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                        <p className="text-2xl font-light mt-2 text-slate-900">
                          {typeof yearlyRevenue?.totalRevenue === 'number' 
                            ? formatCurrency(yearlyRevenue.totalRevenue) 
                            : 'N/A'}
                        </p>
                      )}
                    </div>
                    <div className="bg-green-50 p-2 rounded-full">
                      <Calendar className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-4">{selectedYear}</div>
                </CardContent>
              </Card>
              
              {/* Monthly Revenue */}
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Monthly Revenue</p>
                      {loading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                        <p className="text-2xl font-light mt-2 text-slate-900">
                          {typeof monthlyRevenue?.monthlyrevenue?.totalRevenue === 'number'
                            ? formatCurrency(monthlyRevenue.monthlyrevenue.totalRevenue)
                            : 'N/A'}
                        </p>
                      )}
                    </div>
                    <div className="bg-amber-50 p-2 rounded-full">
                      <CalendarDays className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-4">{monthNames[selectedMonth-1]}, {selectedYear}</div>
                </CardContent>
              </Card>
              
              {/* Reservations */}
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Guest</p>
                      {loading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                        <p className="text-2xl font-light mt-2 text-slate-900">
                          {typeof monthlyRevenue?.monthlyrevenue?.totalReservations === 'number'
                            ? monthlyRevenue.monthlyrevenue.totalReservations
                            : 'N/A'}
                        </p>
                      )}
                    </div>
                    <div className="bg-purple-50 p-2 rounded-full">
                      <Users className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-4">{monthNames[selectedMonth-1]}, {selectedYear}</div>
                </CardContent>
              </Card>
            </div>

            {/* Daily + Weekly */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Daily Revenue */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Daily Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                    <p className="text-3xl font-light text-slate-900">
                      {typeof dailyRevenue?.totalRevenue === 'number'
                        ? formatCurrency(dailyRevenue.totalRevenue)
                        : 'N/A'}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                      {selectedDay} {monthNames[selectedMonth-1]}, {selectedYear}
                    </p>
                    {!loading && dailyRevenue && (
                      <div className="text-sm text-slate-600">
                        {dailyRevenue.totalReservations} reservations
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Weekly Revenue */}
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Weekly Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                    <p className="text-3xl font-light text-slate-900">
                      {typeof weeklyRevenue?.weeklyrevenue?.totalRevenue === 'number'
                        ? formatCurrency(weeklyRevenue.weeklyrevenue.totalRevenue)
                        : 'N/A'}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                      {weekOptions.find(wk => wk.weekNum === selectedWeek)?.label || ''}
                    </p>
                    {!loading && weeklyRevenue?.weeklyrevenue && (
                      <div className="text-sm text-slate-600">
                        {weeklyRevenue.weeklyrevenue.totalReservations} Guest
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Room Category Chart */}
            <Card className="border-0 shadow-lg bg-white mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-light text-slate-900">
                  Revenue by Room Category ({monthNames[selectedMonth-1]}, {selectedYear})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col w-full h-[350px] items-center justify-center space-y-4 bg-slate-50/50 rounded-lg p-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-[280px] w-full" />
                  </div>
                ) : roomCategoriesRevenue?.categories?.length ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={value => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Total Revenue" />
                      <Bar dataKey="guests" fill="#f59e0b" name="Total Guests" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px]">
                    <p>No category revenue data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Discounted Guests */}
            <Card className="border-0 shadow-lg bg-white mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-light text-slate-900">
                  Discounted Guests ({monthNames[selectedMonth-1]}, {selectedYear})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col w-full items-center justify-center space-y-4 bg-slate-50/50 rounded-lg p-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-[100px] w-full" />
                  </div>
                ) : discountedGuests?.guests?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Guest</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Room</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Discount</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Total Rent</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Created By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discountedGuests.guests.map((guest, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-medium">{guest.fullName}</div>
                              <div className="text-xs text-slate-500">{guest.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div>{guest.roomNumber}</div>
                              <div className="text-xs text-slate-500">{guest.roomCategory}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-amber-600">{guest.additionaldiscount}</div>
                              <div className="text-xs">{guest.discountTitle}</div>
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {formatCurrency(guest.totalRent)}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {guest.createdByEmail}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[100px]">
                    <p>No discounted guests for this period</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenuePage;