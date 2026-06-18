'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import EditTripModal from '@/app/components/EditTripModal';
import { formatDate } from '@/lib/dateUtils';
import DateInput from '@/components/ui/DateInput';

export default function VehicleLedgerPage() {
    const { vehicleId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState({});
    const [editingTrip, setEditingTrip] = useState(null);

    // Filters state
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(''); // '' means all
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchLedger = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/ledger/${vehicleId}?year=${selectedYear}`);
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [vehicleId, selectedYear]);

    useEffect(() => {
        fetchLedger();
    }, [fetchLedger]);

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleEditClick = (e, trip) => {
        e.stopPropagation();
        setEditingTrip(trip);
    };

    const handleDeleteClick = async (e, tripId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/trips/${tripId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                // Refresh data to update ledger balances
                fetchLedger();
            } else {
                alert('Failed to delete trip');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        }
    };

    const handleTripUpdate = () => {
        fetchLedger();
    };

    const [quickPaymentDates, setQuickPaymentDates] = useState({});
    const [recordingPayment, setRecordingPayment] = useState({});

    const handleRecordPayment = async (e, tripId, customDate) => {
        e.stopPropagation();
        setRecordingPayment(prev => ({ ...prev, [tripId]: true }));
        try {
            const dateToSubmit = customDate || new Date().toISOString().split('T')[0];
            const res = await fetch(`/api/trips/${tripId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_status: 'received',
                    payment_date: dateToSubmit
                })
            });

            if (res.ok) {
                fetchLedger();
            } else {
                const json = await res.json();
                alert(json.error || 'Failed to record payment');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setRecordingPayment(prev => ({ ...prev, [tripId]: false }));
        }
    };

    // Filter and Sort Logic
    const filteredLedger = data?.ledger.filter(row => {
        const tripDate = new Date(row.trip_date);

        // Year filter (API already filters trip data if we wanted to, but requirement says "Filters affect ONLY which rows are shown")
        // However, year changes the Opening Balance Resolution, so we re-fetch on Year change.
        // For Month and Date Range, we filter locally to avoid re-calculating balances.

        if (selectedMonth && row.month !== `${selectedYear}-${selectedMonth.padStart(2, '0')}`) {
            return false;
        }

        if (dateRange.start && tripDate < new Date(dateRange.start)) return false;
        if (dateRange.end && tripDate > new Date(dateRange.end)) return false;

        return true;
    }).sort((a, b) => {
        const dateA = new Date(a.trip_date);
        const dateB = new Date(b.trip_date);
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        // If dates are equal, sort by creation time descending (Newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
    }) || [];

    if (loading && !data) return <div className="p-6 text-slate-500">Loading ledger...</div>;
    if (!data) return <div className="p-6 text-red-400">Failed to load data</div>;

    // Calculate Yearly Stats for Header Display
    const yearlyTrips = data.ledger.filter(row => {
        const tripYear = new Date(row.trip_date).getFullYear();
        return tripYear === selectedYear;
    });

    const yearlyRunningBalance = yearlyTrips.reduce((acc, row) => {
        return acc + (row.income || 0) - (row.total_expenses || 0);
    }, 0);

    const totalBalance = (data.opening_balance || 0) + yearlyRunningBalance;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/ledger" className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {data.vehicle ? (
                                <>
                                    {data.vehicle.vehicle_no}
                                    {data.vehicle.nickname && <span className="text-slate-400 text-lg ml-2 font-normal">({data.vehicle.nickname})</span>}
                                </>
                            ) : 'Vehicle Ledger'}
                        </h1>
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                <p className="text-slate-400 text-sm">
                                    Opening Balance ({data.selected_year}):
                                    <span className="text-white font-mono ml-1">₹{data.opening_balance.toLocaleString()}</span>
                                </p>
                                <span className="hidden md:inline text-slate-700">|</span>
                                <p className="text-slate-400 text-sm">
                                    Running Balance ({selectedYear}):
                                    <span className={`font-mono ml-1 ${yearlyRunningBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {yearlyRunningBalance >= 0 ? '+' : ''}₹{yearlyRunningBalance.toLocaleString()}
                                    </span>
                                </p>
                                <span className="hidden md:inline text-slate-700">|</span>
                                <p className="text-slate-200 text-sm font-bold w-full md:w-auto mt-1 md:mt-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-800">
                                    Total Balance:
                                    <span className={`font-mono ml-1 ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ₹{totalBalance.toLocaleString()}
                                    </span>
                                </p>
                                {selectedMonth && (() => {
                                    const monthBalance = data.ledger.filter(row => {
                                        return row.month === `${selectedYear}-${selectedMonth.padStart(2, '0')}`;
                                    }).reduce((acc, row) => acc + (row.income || 0) - (row.total_expenses || 0), 0);

                                    return (
                                        <>
                                            <span className="hidden md:inline text-slate-700">|</span>
                                            <p className="text-blue-200 text-sm font-bold w-full md:w-auto">
                                                Monthly Balance:
                                                <span className={`font-mono ml-1 ${monthBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {monthBalance >= 0 ? '+' : ''}₹{monthBalance.toLocaleString()}
                                                </span>
                                            </p>
                                        </>
                                    );
                                })()}
                            </div>
                            <p className="text-slate-500 text-[10px] italic">
                                Opening Balance (₹{data.opening_balance.toLocaleString()}) + Running Balance (₹{yearlyRunningBalance.toLocaleString()}) = Total Balance (₹{totalBalance.toLocaleString()})
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-slate-950 text-white text-sm border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-slate-950 text-white text-sm border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
                    >
                        <option value="">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => {
                            const m = (i + 1).toString().padStart(2, '0');
                            const name = new Date(2000, i).toLocaleString('default', { month: 'long' });
                            return <option key={m} value={m}>{name}</option>;
                        })}
                    </select>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-500 w-full sm:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <DateInput
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="bg-slate-950 text-white border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none flex-1 sm:flex-none"
                            />
                            <span className="hidden sm:inline">to</span>
                            <DateInput
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="bg-slate-950 text-white border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none flex-1 sm:flex-none"
                            />
                        </div>
                        {(dateRange.start || dateRange.end || selectedMonth) && (
                            <button
                                onClick={() => { setSelectedMonth(''); setDateRange({ start: '', end: '' }); }}
                                className="text-blue-400 hover:text-blue-300 sm:ml-1 py-1 sm:py-0 self-end sm:self-auto"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Ledger Table / List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-slate-200 uppercase tracking-wider font-semibold border-b border-slate-800 whitespace-nowrap">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Route</th>
                                <th className="px-6 py-4">Driver</th>
                                <th className="px-6 py-4 text-emerald-400">Income</th>
                                <th className="px-6 py-4 text-red-400">Expenses</th>
                                <th className="px-6 py-4 text-blue-400">Profit</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 whitespace-nowrap">
                            {filteredLedger.map((row) => {
                                const profit = (row.income || 0) - (row.total_expenses || 0);
                                return (
                                    <React.Fragment key={row._id}>
                                        <tr
                                            onClick={() => toggleRow(row._id)}
                                            className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4 font-mono text-slate-300">
                                                {formatDate(row.trip_date)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span>{row.trip_route}</span>
                                                    {row.bookingId && (
                                                        <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-1 rounded w-fit mt-0.5">
                                                            Linked to Booking
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-300">{row.actual_driver_name || row.driver_id?.name || 'Unknown'}</td>

                                            <td className="px-6 py-4 text-emerald-400 font-medium">
                                                {!row.is_admin_expense && row.payment_status === 'pay_later' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-500 line-through">₹{row.trip_income?.toLocaleString()}</span>
                                                        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded font-bold w-fit mt-0.5 animate-pulse">Pay Later</span>
                                                    </div>
                                                ) : (
                                                    row.income ? `+${row.income.toLocaleString()}` : '-'
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-red-400 font-medium">
                                                {row.total_expenses ? `-${row.total_expenses.toLocaleString()}` : '-'}
                                            </td>

                                            <td className={`px-6 py-4 font-bold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()}
                                            </td>

                                            <td className={`px-6 py-4 text-right font-bold font-mono ${row.running_balance < 0 ? 'text-red-500' : 'text-blue-400'}`}>
                                                <div className="flex items-center justify-end gap-2">
                                                    ₹{row.running_balance.toLocaleString()}
                                                    {expandedRows[row._id] ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-all" />}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => handleEditClick(e, row)}
                                                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="Edit Trip"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(e, row._id)}
                                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete Trip"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRows[row._id] && (
                                            <tr className="bg-slate-950/50">
                                                <td colSpan="8" className="px-6 py-4 border-l-2 border-blue-500">
                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <div>
                                                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Income Details</span>
                                                            {!row.is_admin_expense ? (
                                                                <div className="space-y-2">
                                                                    <p className="text-white font-medium">Income: ₹{row.trip_income?.toLocaleString() || 0}</p>
                                                                    <div className="flex flex-col gap-1.5 font-medium text-slate-400">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs">Payment:</span>
                                                                            {row.payment_status === 'received' ? (
                                                                                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                                                    Received
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                                                    Pay Later
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {row.payment_status === 'received' && row.payment_date && (
                                                                            <p className="text-xs">
                                                                                Paid Date: <span className="text-slate-300 font-mono">{formatDate(row.payment_date)}</span>
                                                                            </p>
                                                                        )}
                                                                        {row.payment_status === 'pay_later' && (
                                                                            <div className="pt-2 border-t border-slate-800/60 mt-1" onClick={(e) => e.stopPropagation()}>
                                                                                <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">Record Payment</span>
                                                                                <div className="flex items-center gap-2 max-w-xs">
                                                                                    <DateInput
                                                                                        value={quickPaymentDates[row._id] || new Date().toISOString().split('T')[0]}
                                                                                        onChange={(e) => setQuickPaymentDates(prev => ({ ...prev, [row._id]: e.target.value }))}
                                                                                        className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none flex-1 max-w-[130px] h-8"
                                                                                    />
                                                                                    <button
                                                                                        onClick={(e) => handleRecordPayment(e, row._id, quickPaymentDates[row._id] || new Date().toISOString().split('T')[0])}
                                                                                        disabled={recordingPayment[row._id]}
                                                                                        className="px-3 py-1 h-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                                                                                    >
                                                                                        {recordingPayment[row._id] ? 'Saving...' : 'Mark Paid'}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-white font-medium">Income: ₹{row.income?.toLocaleString() || 0}</p>
                                                            )}
                                                        </div>
                                                        <div className="col-span-1 lg:col-span-3">
                                                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Expense Details</span>
                                                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                                                {row.fuel > 0 && <span className="text-xs text-slate-400">Fuel: <span className="text-white">₹{row.fuel.toLocaleString()}</span></span>}
                                                                {row.fasttag > 0 && <span className="text-xs text-slate-400">FastTag: <span className="text-white">₹{row.fasttag.toLocaleString()}</span></span>}
                                                                {row.driver_allowance > 0 && <span className="text-xs text-slate-400">Allowance (Driver Bata): <span className="text-white">₹{row.driver_allowance.toLocaleString()}</span></span>}
                                                                {row.service > 0 && <span className="text-xs text-slate-400">Workshop Service: <span className="text-white">₹{row.service.toLocaleString()}</span></span>}
                                                                {row.adblue > 0 && <span className="text-xs text-slate-400">AdBlue: <span className="text-white">₹{row.adblue.toLocaleString()}</span></span>}
                                                                {row.grease > 0 && <span className="text-xs text-slate-400">Grease: <span className="text-white">₹{row.grease.toLocaleString()}</span></span>}
                                                                {row.air > 0 && <span className="text-xs text-slate-400">Air: <span className="text-white">₹{row.air.toLocaleString()}</span></span>}
                                                                {row.other_expense > 0 && <span className="text-xs text-slate-400">Other: <span className="text-white">₹{row.other_expense.toLocaleString()}</span></span>}
                                                            </div>
                                                        </div>
                                                        {row.notes && (
                                                            <div className="col-span-full mt-2 pt-2 border-t border-slate-800">
                                                                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Notes</span>
                                                                <p className="text-xs text-slate-300 italic">&quot;{row.notes}&quot;</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {filteredLedger.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-slate-600">No trips found for the selected filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-800/60">
                    {filteredLedger.map((row) => {
                        const profit = (row.income || 0) - (row.total_expenses || 0);
                        const isExpanded = !!expandedRows[row._id];
                        return (
                            <div key={row._id} className="divide-y divide-slate-800/40">
                                {/* Card Header / Summary (Clickable) */}
                                <div
                                    onClick={() => toggleRow(row._id)}
                                    className="p-4 space-y-3 hover:bg-slate-800/10 transition-colors cursor-pointer"
                                >
                                    <div className="flex justify-between items-start animate-in fade-in duration-100">
                                        <div className="space-y-1">
                                            <span className="text-xs text-slate-400 font-mono">{formatDate(row.trip_date)}</span>
                                            <span className="block text-sm font-semibold text-white">
                                                {row.trip_route}
                                            </span>
                                            {row.bookingId && (
                                                <span className="inline-block text-[9px] text-blue-400 font-bold bg-blue-500/10 px-1 rounded">
                                                    Linked to Booking
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 block uppercase font-bold">Balance</span>
                                            <span className={`text-sm font-bold font-mono ${row.running_balance < 0 ? 'text-red-500' : 'text-blue-400'}`}>
                                                ₹{row.running_balance.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                                        <div className="bg-slate-950 p-2 rounded border border-slate-800/60 text-center">
                                            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Income</span>
                                            {(!row.is_admin_expense && row.payment_status === 'pay_later') ? (
                                                <span className="font-semibold font-mono text-amber-500">Pay Later</span>
                                            ) : (
                                                <span className="font-semibold font-mono text-emerald-400">
                                                    {row.income ? `+₹${row.income.toLocaleString()}` : '-'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-slate-950 p-2 rounded border border-slate-800/60 text-center">
                                            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Expenses</span>
                                            <span className="font-semibold font-mono text-red-400">
                                                {row.total_expenses ? `-₹${row.total_expenses.toLocaleString()}` : '-'}
                                            </span>
                                        </div>
                                        <div className="bg-slate-950 p-2 rounded border border-slate-800/60 text-center">
                                            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Net Profit</span>
                                            <span className={`font-semibold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                                        <span>Driver: <strong className="text-slate-200">{row.actual_driver_name || row.driver_id?.name || 'Unknown'}</strong></span>
                                        <span className="text-blue-400 flex items-center gap-1 font-medium">
                                            {isExpanded ? 'Hide Details' : 'Show Details'}
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Panel */}
                                {isExpanded && (
                                    <div className="p-4 bg-slate-950/60 space-y-4 text-xs">
                                        <div>
                                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Income Details</span>
                                            {!row.is_admin_expense ? (
                                                <div className="space-y-2">
                                                    <p className="text-white font-medium">Income: ₹{row.trip_income?.toLocaleString() || 0}</p>
                                                    <div className="flex flex-col gap-1.5 font-medium text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs">Payment:</span>
                                                            {row.payment_status === 'received' ? (
                                                                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                                    Received
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                                                                    Pay Later
                                                                </span>
                                                            )}
                                                        </div>
                                                        {row.payment_status === 'received' && row.payment_date && (
                                                            <p className="text-xs">
                                                                Paid Date: <span className="text-slate-300 font-mono">{formatDate(row.payment_date)}</span>
                                                            </p>
                                                        )}
                                                        {row.payment_status === 'pay_later' && (
                                                            <div className="pt-2 border-t border-slate-800/60 mt-1" onClick={(e) => e.stopPropagation()}>
                                                                <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">Record Payment</span>
                                                                <div className="flex items-center gap-2">
                                                                    <DateInput
                                                                        value={quickPaymentDates[row._id] || new Date().toISOString().split('T')[0]}
                                                                        onChange={(e) => setQuickPaymentDates(prev => ({ ...prev, [row._id]: e.target.value }))}
                                                                        className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none w-[120px] h-8"
                                                                    />
                                                                    <button
                                                                        onClick={(e) => handleRecordPayment(e, row._id, quickPaymentDates[row._id] || new Date().toISOString().split('T')[0])}
                                                                        disabled={recordingPayment[row._id]}
                                                                        className="px-3 py-1 h-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                                                                    >
                                                                        {recordingPayment[row._id] ? 'Saving...' : 'Mark Paid'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-white font-medium">Income: ₹{row.income?.toLocaleString() || 0}</p>
                                            )}
                                        </div>

                                        <div>
                                            <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1.5">Expense Details</span>
                                            <div className="flex flex-wrap gap-2">
                                                {row.fuel > 0 && <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">Fuel: <strong className="text-white">₹{row.fuel.toLocaleString()}</strong></span>}
                                                {row.fasttag > 0 && <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">FastTag: <strong className="text-white">₹{row.fasttag.toLocaleString()}</strong></span>}
                                                {row.driver_allowance > 0 && <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">Allowance: <strong className="text-white">₹{row.driver_allowance.toLocaleString()}</strong></span>}
                                                {row.service > 0 && <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">Workshop: <strong className="text-white">₹{row.service.toLocaleString()}</strong></span>}
                                                {row.adblue > 0 && <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">AdBlue: <strong className="text-white">₹{row.adblue.toLocaleString()}</strong></span>}
                                                {row.grease > 0 && <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">Grease: <strong className="text-white">₹{row.grease.toLocaleString()}</strong></span>}
                                                {row.air > 0 && <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">Air: <strong className="text-white">₹{row.air.toLocaleString()}</strong></span>}
                                                {row.other_expense > 0 && <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-300">Other: <strong className="text-white">₹{row.other_expense.toLocaleString()}</strong></span>}
                                            </div>
                                        </div>

                                        {row.notes && (
                                            <div className="pt-2 border-t border-slate-850">
                                                <span className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Notes</span>
                                                <p className="text-slate-300 italic">&quot;{row.notes}&quot;</p>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                                            <button
                                                onClick={(e) => handleEditClick(e, row)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg transition-colors font-semibold"
                                                title="Edit Trip"
                                            >
                                                <Pencil size={14} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, row._id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors font-semibold"
                                                title="Delete Trip"
                                            >
                                                <Trash2 size={14} />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {filteredLedger.length === 0 && (
                        <div className="p-6 text-center text-slate-600">No trips found for the selected filters.</div>
                    )}
                </div>
            </div>

            {editingTrip && (
                <EditTripModal
                    trip={editingTrip}
                    onClose={() => setEditingTrip(null)}
                    onUpdate={handleTripUpdate}
                />
            )}
        </div>
    );
}
