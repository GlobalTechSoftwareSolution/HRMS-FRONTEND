"use client";
import React, { useState, useEffect } from "react";
import {
  Plus, Download, Search, TrendingUp, TrendingDown, Wallet, Calendar,
  DollarSign, FileText, X, CheckCircle, AlertCircle, BookOpen, Receipt,
  ArrowUpRight, ArrowDownRight, Loader2,
} from "lucide-react";
import axios from "@/lib/axios";

type TransactionType = "credit" | "debit";
type TransactionCategory = "Office Supplies" | "Travel" | "Utilities" | "Maintenance" | "Refreshments" | "Miscellaneous" | "Monthly Fund" | "Salary Advance" | "Emergency";

interface Transaction {
  id: number;
  email: string;
  date: string;
  description: string;
  category: TransactionCategory;
  transaction_type: "Credit" | "Debit";
  amount: string;
  balance: string;
  voucher_no: string | null;
  status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

interface MonthlyFund {
  month: string; year: number; allocatedAmount: number;
  spentAmount: number; remainingAmount: number;
}

type NotificationType = "success" | "error" | "info";
interface Notification { id: string; type: NotificationType; title: string; message: string; }

export default function PettyCashComponent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyFunds, setMonthlyFunds] = useState<MonthlyFund[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0], description: "", category: "Office Supplies" as TransactionCategory,
    type: "debit" as TransactionType, amount: "", remarks: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Try to get email from localStorage first (using the correct key)
        const storedEmail = localStorage.getItem('user_email');
        if (storedEmail) {
          setUserEmail(storedEmail);
        } else {
          // Fallback to API call
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/user/`);
          setUserEmail(response.data.email);
          localStorage.setItem('user_email', response.data.email);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        addNotification("error", "User Error", "Could not fetch user information.");
      }
    };
    fetchUserData();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/list_pettycashs/`);
      const apiTransactions = Array.isArray(response.data) ? response.data : (response.data?.pettycash_records || response.data?.pettycash || response.data?.transactions || response.data?.data || []);
      setTransactions(apiTransactions);
      
      // Calculate monthly funds from transactions
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthTransactions = apiTransactions.filter((t: Transaction) => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      });
      
      const totalCredits = monthTransactions.filter((t: Transaction) => t.transaction_type === "Credit")
        .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);
      const totalDebits = monthTransactions.filter((t: Transaction) => t.transaction_type === "Debit")
        .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);
      
      const initialFund: MonthlyFund = {
        month: new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" }),
        year: currentYear,
        allocatedAmount: totalCredits,
        spentAmount: totalDebits,
        remainingAmount: totalCredits - totalDebits,
      };
      setMonthlyFunds([initialFund]);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      addNotification("error", "Fetch Failed", "Could not load transactions from server.");
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.description || !formData.amount) {
      addNotification("error", "Validation Error", "Please fill in all required fields.");
      return;
    }

    // Validate user email
    if (!userEmail) {
      addNotification("error", "User Error", "User email not found. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: userEmail,
        date: formData.date,
        description: formData.description,
        category: formData.category,
        transaction_type: formData.type === "credit" ? "Credit" : "Debit",
        amount: formData.amount,
        remarks: formData.remarks || null,
      };

      console.log("Sending payload:", payload);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/accounts/create_pettycash/`,
        payload
      );

      console.log("Response:", response.data);

      addNotification("success", "Transaction Added", `${formData.type === "credit" ? "Credit" : "Debit"} of ₹${parseFloat(formData.amount).toLocaleString()} recorded successfully.`);
      
      setFormData({
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "Office Supplies",
        type: "debit",
        amount: "",
        remarks: "",
      });
      setShowAddModal(false);
      
      // Refresh transactions
      await fetchTransactions();
    } catch (error: unknown) {
      console.error("Error creating transaction:", error);
      const axiosError = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
      console.error("Error response:", axiosError.response);
      const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || axiosError.message || "Failed to create transaction.";
      addNotification("error", "Creation Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.voucher_no && transaction.voucher_no.toLowerCase().includes(searchTerm.toLowerCase()));
    const transactionTypeMatch = transaction.transaction_type.toLowerCase();
    const matchesType = filterType === "all" || transactionTypeMatch === filterType;
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;
    const transactionDate = new Date(transaction.date);
    const matchesMonth = transactionDate.getMonth() === selectedMonth;
    const matchesYear = transactionDate.getFullYear() === selectedYear;
    return matchesSearch && matchesType && matchesCategory && matchesMonth && matchesYear;
  });

  const currentMonthFund = monthlyFunds.find(
    (fund) => fund.month === new Date(selectedYear, selectedMonth).toLocaleString("default", { month: "long" }) &&
              fund.year === selectedYear
  ) || { allocatedAmount: 0, spentAmount: 0, remainingAmount: 0 };

  // Calculate running balance for each transaction
  const transactionsWithBalance = filteredTransactions.map((transaction, index) => {
    let runningBalance = 0;
    for (let i = 0; i <= index; i++) {
      const t = filteredTransactions[i];
      if (t.transaction_type === "Credit") {
        runningBalance += parseFloat(t.amount);
      } else {
        runningBalance -= parseFloat(t.amount);
      }
    }
    return { ...transaction, calculatedBalance: runningBalance };
  });

  const totalCredits = filteredTransactions.filter((t) => t.transaction_type === "Credit").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalDebits = filteredTransactions.filter((t) => t.transaction_type === "Debit").reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const currentBalance = totalCredits - totalDebits;

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);

  const exportToCSV = () => {
    const headers = ["Date", "Voucher No", "Description", "Category", "Type", "Amount", "Balance", "Status", "Email"];
    const csvData = filteredTransactions.map((t) => [
      t.date, t.voucher_no || "N/A", t.description, t.category, t.transaction_type,
      parseFloat(t.amount).toFixed(2), parseFloat(t.balance).toFixed(2), t.status, t.email,
    ]);
    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `petty-cash-${selectedYear}-${selectedMonth + 1}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "success": return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "error": return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "info": return <FileText className="h-5 w-5 text-blue-400" />;
    }
  };

  const categories: TransactionCategory[] = [
    "Office Supplies", "Travel", "Utilities", "Maintenance", "Refreshments",
    "Miscellaneous", "Monthly Fund", "Salary Advance", "Emergency",
  ];

  return (
    <div className="w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-2 sm:p-3 md:p-4 lg:p-6 relative">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div key={notification.id} className={`flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${
              notification.type === "success" ? "bg-green-50/90 border-green-200" :
              notification.type === "error" ? "bg-red-50/90 border-red-200" : "bg-blue-50/90 border-blue-200"
            } animate-slide-in-right`}>
            {getNotificationIcon(notification.type)}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>
            <button onClick={() => removeNotification(notification.id)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">Petty Cash Ledger</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">Accounting Book & Fund Management</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 md:p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg"><Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" /></div>
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Current Balance</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{formatCurrency(currentBalance)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 md:p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg"><ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" /></div>
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Monthly Allocation</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{formatCurrency(currentMonthFund.allocatedAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 md:p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg"><ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" /></div>
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Spent</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{formatCurrency(currentMonthFund.spentAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-5 md:p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg"><DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" /></div>
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Remaining Fund</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{formatCurrency(currentMonthFund.remainingAmount)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{new Date(2024, i).toLocaleString("default", { month: "long" })}</option>
            ))}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as "all" | TransactionType)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="all">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
            <option value="all">All Categories</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md text-sm sm:text-base">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" /><span>Add Transaction</span>
          </button>
          <button onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all text-sm sm:text-base">
            <Download className="h-4 w-4 sm:h-5 sm:w-5" /><span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Mobile Card View - Hidden on md and above */}
      <div className="block md:hidden space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-12 bg-white rounded-xl shadow-md">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600">Loading transactions...</span>
          </div>
        )}
        {!loading && filteredTransactions.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">No transactions found</p>
            <p className="text-sm text-gray-600">Add your first transaction to get started</p>
          </div>
        )}
        {!loading && transactionsWithBalance.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-xl shadow-md p-4 border-l-4 border-indigo-500">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString("en-IN")}</p>
                <p className="font-semibold text-gray-900 mt-1">{transaction.description}</p>
                {transaction.remarks && <p className="text-xs text-gray-500 mt-1">{transaction.remarks}</p>}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                transaction.voucher_no ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
              }`}>
                {transaction.voucher_no || "N/A"}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{transaction.category}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{transaction.email.split('@')[0]}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">Debit</p>
                {transaction.transaction_type === "Debit" ? (
                  <p className="text-xs sm:text-sm font-semibold text-red-600 break-all">{formatCurrency(parseFloat(transaction.amount))}</p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-400">-</p>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">Credit</p>
                {transaction.transaction_type === "Credit" ? (
                  <p className="text-xs sm:text-sm font-semibold text-green-600 break-all">{formatCurrency(parseFloat(transaction.amount))}</p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-400">-</p>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">Balance</p>
                <p className={`text-xs sm:text-sm font-bold break-all ${
                  transaction.calculatedBalance >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCurrency(transaction.calculatedBalance)}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {!loading && filteredTransactions.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md p-4 text-white">
            <p className="text-sm font-semibold mb-3">Summary</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs opacity-90 mb-1 whitespace-nowrap">Total Debits</p>
                <p className="font-bold text-xs sm:text-sm break-all">{formatCurrency(totalDebits)}</p>
              </div>
              <div>
                <p className="text-xs opacity-90 mb-1 whitespace-nowrap">Total Credits</p>
                <p className="font-bold text-xs sm:text-sm break-all">{formatCurrency(totalCredits)}</p>
              </div>
              <div>
                <p className="text-xs opacity-90 mb-1 whitespace-nowrap">Net Balance</p>
                <p className="font-bold text-xs sm:text-sm break-all">{formatCurrency(currentBalance)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-gray-600">Loading transactions...</span>
          </div>
        )}
        {!loading && <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full min-w-max">
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Voucher No</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Debit (₹)</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Credit (₹)</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Balance (₹)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm">Add your first transaction to get started</p>
                  </td>
                </tr>
              ) : (
                transactionsWithBalance.map((transaction, index) => (
                  <tr key={transaction.id} className={`hover:bg-indigo-50 transition-colors ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full font-medium text-xs ${
                        transaction.voucher_no 
                          ? "bg-indigo-100 text-indigo-700" 
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {transaction.voucher_no || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.remarks && <p className="text-xs text-gray-500 mt-1">{transaction.remarks}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{transaction.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                      {transaction.transaction_type === "Debit" ? (
                        <span className="text-red-600 font-semibold">{formatCurrency(parseFloat(transaction.amount))}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                      {transaction.transaction_type === "Credit" ? (
                        <span className="text-green-600 font-semibold">{formatCurrency(parseFloat(transaction.amount))}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                      <span className={`font-bold ${
                        transaction.calculatedBalance >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(transaction.calculatedBalance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                        {transaction.email.split('@')[0]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right font-bold text-gray-900">TOTALS:</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500 mb-1">Total Debits</span>
                      <span className="font-bold text-red-600">{formatCurrency(totalDebits)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500 mb-1">Total Credits</span>
                      <span className="font-bold text-green-600">{formatCurrency(totalCredits)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500 mb-1">Net Balance</span>
                      <span className={`font-bold ${
                        currentBalance >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(currentBalance)}
                      </span>
                    </div>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 sm:p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Add New Transaction</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleAddTransaction} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type <span className="text-red-500">*</span></label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as TransactionType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required>
                    <option value="credit">Credit (Money In)</option>
                    <option value="debit">Debit (Money Out)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter transaction description" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as TransactionCategory })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required>
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional)</label>
                <textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Additional notes..." rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="submit" disabled={loading}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base">
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  {loading ? "Adding..." : "Add Transaction"}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 sm:px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold text-sm sm:text-base">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
