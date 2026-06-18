'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    FileBarChart2,
    Truck,
    ReceiptText,
    ClipboardList,
    BookOpen,
    Download,
    FileText,
    ChevronDown,
    Filter,
    Calendar,
} from 'lucide-react';
import DateInput from '@/components/ui/DateInput';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = n =>
    typeof n === 'number'
        ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
        : '—';

const pct = n => (typeof n === 'number' ? `${n.toFixed(1)}%` : '—');

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
    { id: 'profit-loss', label: 'P&L', icon: FileBarChart2 },
    { id: 'vehicle-profitability', label: 'Vehicle Profitability', icon: Truck },
    { id: 'expense-breakdown', label: 'Expense Breakdown', icon: ReceiptText },
    { id: 'trip-summary', label: 'Trip Summary', icon: ClipboardList },
    { id: 'ledger-movement', label: 'Ledger Movement', icon: BookOpen },
];

// ─── Table components ────────────────────────────────────────────────────────

function ProfitLossTable({ data, totals }) {
    if (!data.length) return <EmptyState />;
    return (
        <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium text-right">Trips</th>
                            <th className="px-4 py-3 font-medium text-right">Income</th>
                            <th className="px-4 py-3 font-medium text-right">Trip Expenses</th>
                            <th className="px-4 py-3 font-medium text-right">Admin Expenses</th>
                            <th className="px-4 py-3 font-medium text-right">Total Expenses</th>
                            <th className="px-4 py-3 font-medium text-right">Net Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {data.map((r, i) => (
                            <tr key={`${r.date}-${i}`} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.date}</td>
                                <td className="px-4 py-3 text-right">{r.trip_count}</td>
                                <td className="px-4 py-3 text-right text-emerald-400">{fmt(r.income)}</td>
                                <td className="px-4 py-3 text-right text-amber-400">{fmt(r.trip_expenses)}</td>
                                <td className="px-4 py-3 text-right text-orange-400">{fmt(r.admin_expenses)}</td>
                                <td className="px-4 py-3 text-right text-red-400">{fmt(r.total_expenses)}</td>
                                <td className={`px-4 py-3 text-right font-semibold ${r.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                    {fmt(r.net_profit)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {totals && (
                        <tfoot>
                            <tr className="border-t-2 border-slate-700 text-white font-bold text-sm">
                                <td className="px-4 py-3">TOTAL</td>
                                <td className="px-4 py-3 text-right">{totals.trip_count}</td>
                                <td className="px-4 py-3 text-right text-emerald-400">{fmt(totals.income)}</td>
                                <td className="px-4 py-3 text-right text-amber-400">{fmt(totals.trip_expenses)}</td>
                                <td className="px-4 py-3 text-right text-orange-400">{fmt(totals.admin_expenses)}</td>
                                <td className="px-4 py-3 text-right text-red-400">{fmt(totals.total_expenses)}</td>
                                <td className={`px-4 py-3 text-right ${totals.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>{fmt(totals.net_profit)}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-800">
                {data.map((r, i) => (
                    <div key={`${r.date}-${i}`} className="p-4 space-y-3 bg-slate-900/50">
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-xs text-slate-400">{r.date}</span>
                            <span className="text-xs text-slate-300 font-medium bg-slate-800 px-2 py-0.5 rounded">{r.trip_count} Trips</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Income</span>
                                <span className="font-semibold text-emerald-400">{fmt(r.income)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Trip Expenses</span>
                                <span className="font-semibold text-amber-400">{fmt(r.trip_expenses)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Admin Expenses</span>
                                <span className="font-semibold text-orange-400">{fmt(r.admin_expenses)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Total Expenses</span>
                                <span className="font-semibold text-red-400">{fmt(r.total_expenses)}</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                            <span className="text-slate-400">Net Profit</span>
                            <span className={`font-bold ${r.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                {fmt(r.net_profit)}
                            </span>
                        </div>
                    </div>
                ))}
                
                {totals && (
                    <div className="p-4 bg-slate-900 border-t-2 border-slate-700 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-white text-sm">TOTAL</span>
                            <span className="text-xs text-slate-300 font-semibold bg-slate-800 px-2 py-0.5 rounded">{totals.trip_count} Trips</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Total Income</span>
                                <span className="font-bold text-emerald-400">{fmt(totals.income)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Total Trip Exp.</span>
                                <span className="font-bold text-amber-400">{fmt(totals.trip_expenses)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Total Admin Exp.</span>
                                <span className="font-bold text-orange-400">{fmt(totals.admin_expenses)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Total Expenses</span>
                                <span className="font-bold text-red-400">{fmt(totals.total_expenses)}</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                            <span className="font-bold text-white">Total Net Profit</span>
                            <span className={`font-extrabold ${totals.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                {fmt(totals.net_profit)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function VehicleProfitabilityTable({ data }) {
    if (!data.length) return <EmptyState />;
    return (
        <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                            <th className="px-4 py-3 font-medium">Vehicle</th>
                            <th className="px-4 py-3 font-medium text-right">Trips</th>
                            <th className="px-4 py-3 font-medium text-right">Income</th>
                            <th className="px-4 py-3 font-medium text-right">Expenses</th>
                            <th className="px-4 py-3 font-medium text-right">Net Profit</th>
                            <th className="px-4 py-3 font-medium text-right">Margin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {data.map((r, i) => (
                            <tr key={r.vehicle_no ?? i} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3 font-semibold text-white">{r.vehicle_no}</td>
                                <td className="px-4 py-3 text-right">{r.trip_count}</td>
                                <td className="px-4 py-3 text-right text-emerald-400">{fmt(r.income)}</td>
                                <td className="px-4 py-3 text-right text-red-400">{fmt(r.total_expenses)}</td>
                                <td className={`px-4 py-3 text-right font-semibold ${r.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>{fmt(r.net_profit)}</td>
                                <td className="px-4 py-3 text-right text-slate-400">{pct(r.profit_margin)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-800">
                {data.map((r, i) => (
                    <div key={r.vehicle_no ?? i} className="p-4 space-y-3 bg-slate-900/50">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-white text-sm">{r.vehicle_no}</span>
                            <span className="text-xs text-slate-300 font-medium bg-slate-800 px-2 py-0.5 rounded">{r.trip_count} Trips</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Income</span>
                                <span className="font-semibold text-emerald-400">{fmt(r.income)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Expenses</span>
                                <span className="font-semibold text-red-400">{fmt(r.total_expenses)}</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xs">Net Profit</span>
                                <span className={`font-semibold ${r.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                    {fmt(r.net_profit)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <span>Margin:</span>
                                <span className="font-mono text-slate-200">{pct(r.profit_margin)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ExpenseBreakdownTable({ data, total }) {
    if (!data.length) return <EmptyState />;
    return (
        <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                            <th className="px-4 py-3 font-medium">Category</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium text-right">Amount</th>
                            <th className="px-4 py-3 font-medium text-right">Share %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {data.map((r, i) => (
                            <tr key={i} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">{r.category}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.type === 'trip' || r.type === 'Trip' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                                        {r.type === 'trip' || r.type === 'Trip' ? 'Trip' : 'Admin'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-red-400">{fmt(r.amount)}</td>
                                <td className="px-4 py-3 text-right text-slate-400">
                                    {total > 0 ? pct((r.amount / total) * 100) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-700 font-bold text-white">
                            <td className="px-4 py-3" colSpan={2}>TOTAL</td>
                            <td className="px-4 py-3 text-right text-red-400">{fmt(total)}</td>
                            <td className="px-4 py-3 text-right text-slate-400">100%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-800">
                {data.map((r, i) => (
                    <div key={i} className="p-4 space-y-3 bg-slate-900/50">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-white text-sm">{r.category}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${r.type === 'trip' || r.type === 'Trip' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'}`}>
                                {r.type === 'trip' || r.type === 'Trip' ? 'Trip' : 'Admin'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Amount</span>
                                <span className="font-semibold text-red-400">{fmt(r.amount)}</span>
                            </div>
                            <div className="text-right space-y-1">
                                <span className="text-slate-500 block">Share</span>
                                <span className="font-semibold text-slate-300">
                                    {total > 0 ? pct((r.amount / total) * 100) : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                <div className="p-4 bg-slate-900 border-t-2 border-slate-700 flex justify-between items-center text-sm font-bold">
                    <span className="text-white">TOTAL</span>
                    <div className="flex gap-4 items-center">
                        <span className="text-red-400">{fmt(total)}</span>
                        <span className="text-slate-400 text-xs font-normal">100%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TripSummaryTable({ data }) {
    if (!data.length) return <EmptyState />;
    return (
        <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Route</th>
                            <th className="px-4 py-3 font-medium">Vehicle</th>
                            <th className="px-4 py-3 font-medium">Driver</th>
                            <th className="px-4 py-3 font-medium text-right">Income</th>
                            <th className="px-4 py-3 font-medium text-right">Expenses</th>
                            <th className="px-4 py-3 font-medium text-right">Net Profit</th>
                            <th className="px-4 py-3 font-medium">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {data.map((r, i) => (
                            <tr key={r._id || i} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.trip_date || r.date}</td>
                                <td className="px-4 py-3 max-w-[160px] truncate">{r.trip_route || r.route}</td>
                                <td className="px-4 py-3 font-semibold text-white">{r.vehicle_no}</td>
                                <td className="px-4 py-3">{r.driver_name}</td>
                                <td className="px-4 py-3 text-right text-emerald-400">{fmt(r.income)}</td>
                                <td className="px-4 py-3 text-right text-red-400">{fmt(r.total_expenses)}</td>
                                <td className={`px-4 py-3 text-right font-semibold ${r.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>{fmt(r.net_profit)}</td>
                                <td className="px-4 py-3 text-slate-500 text-xs max-w-[120px] truncate">{r.notes || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-800">
                {data.map((r, i) => (
                    <div key={r._id || i} className="p-4 space-y-3 bg-slate-900/50">
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-xs text-slate-400">{r.trip_date || r.date}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                                r.trip_type === 'tour' || r.trip_type === 'Tour' || r.trip_type === 'regular'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                    : r.trip_type === 'nightly' || r.trip_type === 'Nightly'
                                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                                    : 'bg-slate-500/15 text-slate-400 border border-slate-700/50'
                            }`}>
                                {r.trip_type === 'regular' ? 'Tour' : r.trip_type}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-slate-500 text-xs block">Route</span>
                            <span className="text-slate-200 font-medium text-sm">{r.trip_route || r.route}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Vehicle</span>
                                <span className="font-semibold text-white">{r.vehicle_no}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Driver</span>
                                <span className="text-slate-300">{r.driver_name}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Income</span>
                                <span className="font-semibold text-emerald-400">{fmt(r.income)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Expenses</span>
                                <span className="font-semibold text-red-400">{fmt(r.total_expenses)}</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                            <span className="text-slate-400">Net Profit</span>
                            <span className={`font-semibold ${r.net_profit >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                {fmt(r.net_profit)}
                            </span>
                        </div>
                        {r.notes && r.notes !== '—' && (
                            <div className="pt-1.5 text-xs italic text-slate-500 border-t border-slate-800/40">
                                <span className="not-italic font-medium text-slate-600 mr-1">Notes:</span>
                                {r.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function LedgerMovementTable({ data }) {
    if (!data.length) return <EmptyState />;
    return (
        <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Description</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium text-right">Amount</th>
                            <th className="px-4 py-3 font-medium text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {data.map((r, i) => (
                            <tr key={i} className="text-slate-300 hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.date}</td>
                                <td className="px-4 py-3 max-w-[220px] truncate">{r.description}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${r.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                        {r.type}
                                    </span>
                                </td>
                                <td className={`px-4 py-3 text-right ${r.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(r.amount)}</td>
                                <td className="px-4 py-3 text-right text-slate-300">{fmt(r.running_balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-800">
                {data.map((r, i) => (
                    <div key={i} className="p-4 space-y-3 bg-slate-900/50">
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-xs text-slate-400">{r.date}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${r.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                {r.type}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-slate-500 text-xs block">Description</span>
                            <span className="text-slate-200 text-sm block leading-relaxed">{r.description}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                            <div className="space-y-1">
                                <span className="text-slate-500 block">Amount</span>
                                <span className={`font-semibold ${r.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {fmt(r.amount)}
                                </span>
                            </div>
                            <div className="text-right space-y-1">
                                <span className="text-slate-500 block">Balance</span>
                                <span className="font-semibold text-slate-300">{fmt(r.running_balance)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-16 text-slate-600">
            <FileText className="mx-auto mb-3 opacity-40" size={40} />
            <p className="text-sm">No data for the selected filters.</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('profit-loss');
    const [data, setData] = useState([]);
    const [totals, setTotals] = useState(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filters
    const [month, setMonth] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicleId, setVehicleId] = useState('');
    const [driverId, setDriverId] = useState('');
    const [tripType, setTripType] = useState('');

    // Fetch vehicle & driver lists for filters
    useEffect(() => {
        fetch('/api/vehicles').then(r => r.json()).then(j => j.success && setVehicles(j.data || [])).catch(() => { });
        fetch('/api/users').then(r => r.json()).then(j => {
            if (j.success) setDrivers((j.data || []).filter(u => u.role === 'driver'));
        }).catch(() => { });
    }, []);

    const buildQs = useCallback(() => {
        const p = new URLSearchParams();
        if (from) p.set('from', from);
        if (to) p.set('to', to);
        if (vehicleId) p.set('vehicle_id', vehicleId);
        if (driverId) p.set('driver_id', driverId);
        if (tripType) p.set('trip_type', tripType);
        return p.toString();
    }, [from, to, vehicleId, driverId, tripType]);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setData([]);
        setTotals(null);
        setTotal(0);
        try {
            const qs = buildQs();
            const res = await fetch(`/api/reports/${activeTab}${qs ? '?' + qs : ''}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data || []);
                setTotals(json.totals || null);
                setTotal(json.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [activeTab, buildQs]);

    const handleMonthChange = (e) => {
        const val = e.target.value;
        setMonth(val);
        if (val) {
            const [y, m] = val.split('-');
            // Create dates in local time to avoid timezone shifts
            const first = new Date(y, m - 1, 1);
            const last = new Date(y, m, 0); // 0 gets the last day of previous month, which is the current month since m is 1-indexed here natively

            // Format to YYYY-MM-DD local
            const fmt = (d) => {
                const pad = n => n.toString().padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            };

            setFrom(fmt(first));
            setTo(fmt(last));
        } else {
            setFrom('');
            setTo('');
        }
    };

    const handleFromChange = (e) => {
        setFrom(e.target.value);
        setMonth(''); // Clear month if custom date selected
    };

    const handleToChange = (e) => {
        setTo(e.target.value);
        setMonth(''); // Clear month if custom date selected
    };

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleExport = (format) => {
        const qs = buildQs();
        const base = `/api/reports/export?report=${activeTab}&format=${format}`;
        window.open(qs ? `${base}&${qs}` : base, '_blank');
    };

    const tabSupportsDriverFilter = ['profit-loss', 'vehicle-profitability', 'trip-summary', 'expense-breakdown'].includes(activeTab);
    const tabSupportsVehicleFilter = activeTab !== 'ledger-movement';
    const tabSupportsTripTypeFilter = activeTab !== 'ledger-movement';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Reports</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Read-only tabular reports — company-scoped</p>
                </div>

                {/* Export buttons */}
                <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-600/30 text-emerald-400 text-sm font-medium transition-all"
                    >
                        <Download size={14} />
                        CSV
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-600/30 text-blue-400 text-sm font-medium transition-all"
                    >
                        <FileText size={14} />
                        PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 items-end">
                    <div className="flex flex-col gap-1 w-full lg:w-auto">
                        <label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Filter size={10} /> Month
                        </label>
                        <div className="relative flex items-center bg-slate-800 border border-slate-700 rounded-lg group focus-within:border-blue-500/60 transition-colors w-full">
                            <input
                                type="month"
                                value={month}
                                onChange={handleMonthChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                style={{ colorScheme: 'dark' }}
                            />
                            <div className="flex items-center gap-2 px-3 py-2 w-full min-w-[120px]">
                                <Calendar size={14} className="text-white opacity-70" />
                                <span className="text-slate-200 text-sm">
                                    {month ? new Date(month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' }) : 'Select Month'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block text-slate-600 mb-2.5">or</div>

                    <div className="flex flex-col gap-1 w-full lg:w-auto">
                        <label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            From
                        </label>
                        <DateInput
                            value={from}
                            onChange={handleFromChange}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/60 transition-colors w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1 w-full lg:w-auto">
                        <label className="text-xs text-slate-500 font-medium">To</label>
                        <DateInput
                            value={to}
                            onChange={handleToChange}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/60 transition-colors w-full"
                        />
                    </div>

                    {tabSupportsTripTypeFilter && (
                        <div className="flex flex-col gap-1 w-full lg:w-auto">
                            <label className="text-xs text-slate-500 font-medium">Trip Type</label>
                            <div className="relative w-full">
                                <select
                                    value={tripType}
                                    onChange={e => setTripType(e.target.value)}
                                    className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-3 pr-8 py-2 outline-none focus:border-blue-500/60 transition-colors w-full"
                                >
                                    <option value="">All Types</option>
                                    <option value="regular">Tour</option>
                                    <option value="nightly">Nightly</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {tabSupportsVehicleFilter && (
                        <div className="flex flex-col gap-1 w-full lg:w-auto">
                            <label className="text-xs text-slate-500 font-medium">Vehicle</label>
                            <div className="relative w-full">
                                <select
                                    value={vehicleId}
                                    onChange={e => setVehicleId(e.target.value)}
                                    className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-3 pr-8 py-2 outline-none focus:border-blue-500/60 transition-colors w-full"
                                >
                                    <option value="">All Vehicles</option>
                                    {vehicles.map(v => (
                                        <option key={v._id} value={v._id}>{v.vehicle_no} {v.vehicle_name ? `(${v.vehicle_name})` : ''}{v.nickname ? ` - ${v.nickname}` : ''}</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {tabSupportsDriverFilter && (
                        <div className="flex flex-col gap-1 w-full lg:w-auto">
                            <label className="text-xs text-slate-500 font-medium">Driver</label>
                            <div className="relative w-full">
                                <select
                                    value={driverId}
                                    onChange={e => setDriverId(e.target.value)}
                                    className="appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-3 pr-8 py-2 outline-none focus:border-blue-500/60 transition-colors w-full"
                                >
                                    <option value="">All Drivers</option>
                                    {drivers.map(d => (
                                        <option key={d._id} value={d._id}>{d.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => { setMonth(''); setFrom(''); setTo(''); setVehicleId(''); setDriverId(''); setTripType(''); }}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors w-full lg:w-auto text-left lg:text-right pb-2 lg:pb-2.5"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            {/* Tabs + Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {/* Tab bar */}
                <div className="flex overflow-x-auto border-b border-slate-800 no-scrollbar">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${isActive
                                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Table area */}
                <div className="min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'profit-loss' && <ProfitLossTable data={data} totals={totals} />}
                            {activeTab === 'vehicle-profitability' && <VehicleProfitabilityTable data={data} />}
                            {activeTab === 'expense-breakdown' && <ExpenseBreakdownTable data={data} total={total} />}
                            {activeTab === 'trip-summary' && <TripSummaryTable data={data} />}
                            {activeTab === 'ledger-movement' && <LedgerMovementTable data={data} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
