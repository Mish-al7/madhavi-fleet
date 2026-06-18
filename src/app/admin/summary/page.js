'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Grid, Moon, Truck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function DashboardPage() {
    const router = useRouter();
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedTripType, setSelectedTripType] = useState('all');
    const [availableMonths, setAvailableMonths] = useState([]);

    useEffect(() => {
        fetchSummary();
    }, [selectedMonth, selectedTripType]);

    async function fetchSummary() {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedMonth !== 'all') {
                params.append('month', selectedMonth);
            }
            if (selectedTripType !== 'all') {
                params.append('trip_type', selectedTripType);
            }
            const queryString = params.toString();
            const url = queryString ? `/api/summary/monthly?${queryString}` : '/api/summary/monthly';

            const res = await fetch(url);
            const json = await res.json();

            if (json.success) {
                setSummary(json.data);
                setAvailableMonths(json.availableMonths || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const getSubtitle = () => {
        switch (selectedTripType) {
            case 'nightly': return 'Nightly Service Performance Overview';
            case 'regular': return 'Tour Trips Performance Overview';
            default: return 'Fleet Performance Overview';
        }
    };

    const formatMonth = (monthStr) => {
        if (!monthStr || monthStr === 'all') return 'All Time';
        const [year, month] = monthStr.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    };

    // Calculate KPIs
    const totalIncome = summary.reduce((sum, item) => sum + item.total_income, 0);
    const totalExpenses = summary.reduce((sum, item) => sum + item.total_expenses, 0);
    const totalProfit = totalIncome - totalExpenses;

    // Prepare aggregated chart data (one entry per vehicle)
    const chartData = summary.reduce((acc, item) => {
        const existing = acc.find(v => v.vehicleId === item.vehicle_id);
        if (existing) {
            existing.income += item.total_income;
            existing.expenses += item.total_expenses;
            existing.profit += item.profit;
        } else {
            acc.push({
                vehicle: item.vehicle_no,
                vehicleId: item.vehicle_id,
                income: item.total_income,
                expenses: item.total_expenses,
                profit: item.profit
            });
        }
        return acc;
    }, []);

    const handleBarClick = (data) => {
        if (data && data.vehicleId) {
            router.push(`/admin/ledger/${data.vehicleId}`);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:gap-6">
                {/* Mobile Header Title */}
                <div className="md:hidden">
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400 text-xs mt-1">{getSubtitle()}</p>
                </div>

                {/* Mobile Dropdown Filters */}
                <div className="flex md:hidden gap-3 w-full">
                    {/* Trip Type Dropdown */}
                    <div className="flex-1">
                        <select
                            value={selectedTripType}
                            onChange={(e) => setSelectedTripType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="all">All Trips</option>
                            <option value="nightly">Nightly Services</option>
                            <option value="regular">Tour Trips</option>
                        </select>
                    </div>

                    {/* Period (Month) Dropdown */}
                    <div className="flex-1">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>
                                    {formatMonth(month)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Desktop view (Tabs & Pills) */}
                <div className="hidden md:flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                            <p className="text-slate-400 text-sm mt-1">{getSubtitle()}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Segmented Control Tabs */}
                            <div className="bg-slate-900/80 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
                                <button
                                    onClick={() => setSelectedTripType('all')}
                                    className={`flex items-center gap-2 py-1.5 px-4 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        selectedTripType === 'all'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                    }`}
                                >
                                    <Grid size={14} />
                                    <span>Total</span>
                                </button>
                                <button
                                    onClick={() => setSelectedTripType('nightly')}
                                    className={`flex items-center gap-2 py-1.5 px-4 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        selectedTripType === 'nightly'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                    }`}
                                >
                                    <Moon size={14} />
                                    <span>Nightly Service</span>
                                </button>
                                <button
                                    onClick={() => setSelectedTripType('regular')}
                                    className={`flex items-center gap-2 py-1.5 px-4 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                        selectedTripType === 'regular'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                                    }`}
                                >
                                    <Truck size={14} />
                                    <span>Tour Trips</span>
                                </button>
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>

                    {/* Monthly Pill Filter */}
                    <div className="flex flex-nowrap items-center gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar whitespace-nowrap">
                        <button
                            onClick={() => setSelectedMonth('all')}
                            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${selectedMonth === 'all'
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                        >
                            All Time
                        </button>

                        {/* Recent Months (Top 4) */}
                        {availableMonths.slice(0, 4).map(month => (
                            <button
                                key={month}
                                onClick={() => setSelectedMonth(month)}
                                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${selectedMonth === month
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                            >
                                {formatMonth(month)}
                            </button>
                        ))}

                        {/* Active "Other" Month Pill (if selected via dropdown and not in top 4) */}
                        {selectedMonth !== 'all' && !availableMonths.slice(0, 4).includes(selectedMonth) && (
                            <button
                                className="px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                            >
                                {formatMonth(selectedMonth)}
                            </button>
                        )}

                        {/* History Dropdown */}
                        {availableMonths.length > 0 && (
                            <div className="relative flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-2 hover:border-slate-700 transition-all">
                                <Calendar size={14} className="text-white opacity-70" />
                                <select
                                    value={availableMonths.includes(selectedMonth) ? selectedMonth : 'history'}
                                    onChange={(e) => {
                                        if (e.target.value !== 'history') {
                                            setSelectedMonth(e.target.value);
                                        }
                                    }}
                                    className="bg-transparent text-sm font-medium text-slate-300 outline-none cursor-pointer appearance-none pr-4"
                                >
                                    <option value="history" disabled className="bg-slate-900 border-none">History</option>
                                    {availableMonths.map(month => (
                                        <option key={month} value={month} className="bg-slate-900 text-white">
                                            {formatMonth(month)}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 pointer-events-none">
                                    <Filter size={10} className="text-white opacity-60" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="text-emerald-400" size={24} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Total Income</span>
                    </div>
                    <p className="text-3xl font-bold text-white">₹{totalIncome.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <TrendingDown className="text-red-400" size={24} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Total Expenses</span>
                    </div>
                    <p className="text-3xl font-bold text-white">₹{totalExpenses.toLocaleString()}</p>
                </div>

                <div className={`bg-gradient-to-br ${totalProfit >= 0 ? 'from-blue-500/10 to-blue-600/5 border-blue-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'} border rounded-xl p-6`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 ${totalProfit >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'} rounded-lg`}>
                            <DollarSign className={totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'} size={24} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Net Profit</span>
                    </div>
                    <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {totalProfit >= 0 ? '+' : ''}₹{totalProfit.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Charts */}
            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Profit by Vehicle - Horizontal Bar Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col overflow-x-auto">
                    <h3 className="text-lg font-bold text-white mb-4">Profit by Vehicle</h3>
                    <div className="flex-1 min-h-[300px] min-w-0 md:min-w-[500px]" style={{ minHeight: Math.max(300, chartData.length * 60) }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                onClick={(e) => e?.activePayload && handleBarClick(e.activePayload[0].payload)}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-700)" horizontal={false} />
                                <XAxis type="number" stroke="var(--color-slate-400)" />
                                <YAxis
                                    type="category"
                                    dataKey="vehicle"
                                    stroke="var(--color-slate-400)"
                                    width={100}
                                    interval={0}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--color-slate-800)', opacity: 0.15 }}
                                    contentStyle={{ backgroundColor: 'var(--color-slate-900)', border: '1px solid var(--color-slate-800)', borderRadius: '8px' }}
                                    labelStyle={{ color: 'var(--color-slate-100)', fontWeight: 'bold' }}
                                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Profit']}
                                />
                                <Bar
                                    dataKey="profit"
                                    fill="#3b82f6"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                    cursor="pointer"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Income vs Expenses - Horizontal Bar Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col overflow-x-auto">
                    <h3 className="text-lg font-bold text-white mb-4">Income vs Expenses</h3>
                    <div className="flex-1 min-h-[300px] min-w-0 md:min-w-[500px]" style={{ minHeight: Math.max(300, chartData.length * 60) }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-700)" horizontal={false} />
                                <XAxis type="number" stroke="var(--color-slate-400)" />
                                <YAxis
                                    type="category"
                                    dataKey="vehicle"
                                    stroke="var(--color-slate-400)"
                                    width={100}
                                    interval={0}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--color-slate-800)', opacity: 0.15 }}
                                    contentStyle={{ backgroundColor: 'var(--color-slate-900)', border: '1px solid var(--color-slate-800)', borderRadius: '8px' }}
                                    labelStyle={{ color: 'var(--color-slate-100)', fontWeight: 'bold' }}
                                    formatter={(value, name) => [`₹${value.toLocaleString()}`, name === 'income' ? 'Income' : 'Expenses']}
                                />
                                <Legend />
                                <Bar dataKey="income" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="expenses" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Vehicle Performance Table / List */}
            {chartData.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800">
                        <h3 className="text-lg font-bold text-white">Vehicle Performance Details</h3>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider whitespace-nowrap">
                                    <th className="p-4 font-medium border-b border-slate-800">Vehicle</th>
                                    <th className="p-4 font-medium border-b border-slate-800 text-right">Income</th>
                                    <th className="p-4 font-medium border-b border-slate-800 text-right">Expenses</th>
                                    <th className="p-4 font-medium border-b border-slate-800 text-right">Profit</th>
                                    <th className="p-4 font-medium border-b border-slate-800 text-right">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 whitespace-nowrap">
                                {chartData.map((item) => {
                                    const margin = item.income > 0 ? ((item.profit / item.income) * 100).toFixed(1) : '0.0';
                                    return (
                                        <tr
                                            key={item.vehicleId}
                                            className="text-slate-300 hover:bg-slate-800/50 transition-colors cursor-pointer"
                                            onClick={() => handleBarClick(item)}
                                        >
                                            <td className="p-4 font-medium text-white">{item.vehicle}</td>
                                            <td className="p-4 text-right text-emerald-400">₹{item.income.toLocaleString()}</td>
                                            <td className="p-4 text-right text-red-400">₹{item.expenses.toLocaleString()}</td>
                                            <td className={`p-4 text-right font-bold ${item.profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                                ₹{item.profit.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right text-slate-400">{margin}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-slate-800/60">
                        {chartData.map((item) => {
                            const margin = item.income > 0 ? ((item.profit / item.income) * 100).toFixed(1) : '0.0';
                            return (
                                <div
                                    key={item.vehicleId}
                                    className="p-4 space-y-3 hover:bg-slate-800/10 active:bg-slate-800/20 transition-colors cursor-pointer"
                                    onClick={() => handleBarClick(item)}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-white text-base">{item.vehicle}</span>
                                        <span className="text-xs text-slate-400">Margin: <strong className="text-slate-200">{margin}%</strong></span>
                                    </div>

                                    {/* Financial metrics grid */}
                                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                                        <div className="bg-slate-950 p-2 rounded border border-slate-800/60 text-center">
                                            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Income</span>
                                            <span className="font-semibold font-mono text-emerald-400">₹{item.income.toLocaleString()}</span>
                                        </div>
                                        <div className="bg-slate-950 p-2 rounded border border-slate-800/60 text-center">
                                            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Expenses</span>
                                            <span className="font-semibold font-mono text-red-400">₹{item.expenses.toLocaleString()}</span>
                                        </div>
                                        <div className="bg-slate-950 p-2 rounded border border-slate-800/60 text-center">
                                            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Net Profit</span>
                                            <span className={`font-semibold font-mono ${item.profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                                ₹{item.profit.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Monthly Trend (if multiple months) */}
            {selectedMonth === 'all' && availableMonths.length > 1 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-x-auto">
                    <h3 className="text-lg font-bold text-white mb-4">Monthly Profit Trend</h3>
                    <div className="min-w-0 md:min-w-[600px]">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={summary.reduce((acc, item) => {
                                const existing = acc.find(a => a.month === item.month);
                                if (existing) {
                                    existing.profit += item.profit;
                                } else {
                                    acc.push({ month: item.month, profit: item.profit });
                                }
                                return acc;
                            }, []).sort((a, b) => a.month.localeCompare(b.month))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-700)" />
                                <XAxis dataKey="month" stroke="var(--color-slate-400)" tickFormatter={(m) => formatMonth(m)} />
                                <YAxis stroke="var(--color-slate-400)" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--color-slate-900)', border: '1px solid var(--color-slate-800)', borderRadius: '8px' }}
                                    labelStyle={{ color: 'var(--color-slate-100)' }}
                                    labelFormatter={(label) => formatMonth(label)}
                                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Profit']}
                                />
                                <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: 'var(--color-slate-900)' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {summary.length === 0 && (
                <div className="text-center py-12 text-slate-600 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                    No data available for the selected period.
                </div>
            )}
                </>
            )}
        </div>
    );
}
