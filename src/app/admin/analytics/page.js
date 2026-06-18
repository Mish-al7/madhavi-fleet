'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filter } from 'lucide-react';
import DateInput from '@/components/ui/DateInput';
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend, ResponsiveContainer as PieContainer,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─── Colour palette ────────────────────────────────────────────────

const PIE_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1',
];

const fmtMonth = str => {
    if (!str) return '';
    const [y, m] = str.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
};

const fmt = n => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const tooltipStyle = {
    contentStyle: { backgroundColor: 'var(--color-slate-900)', border: '1px solid var(--color-slate-800)', borderRadius: '8px', fontSize: '12px' },
    labelStyle: { color: 'var(--color-slate-100)', fontWeight: 600 },
    itemStyle: { color: 'var(--color-slate-400)' },
};

// ─── Chart wrappers ───────────────────────────────────────────────────────────

function ChartCard({ title, children, empty }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
            {empty ? (
                <div className="flex items-center justify-center h-[260px] text-slate-600 text-sm">No data</div>
            ) : (
                <div className="overflow-x-auto w-full pb-2">
                    <div className="h-[260px] min-w-0 md:min-w-[500px] w-full">{children}</div>
                </div>
            )}
        </div>
    );
}

// Custom pie label data
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    return (
        <text
            x={cx + radius * Math.cos(-midAngle * RADIAN)}
            y={cy + radius * Math.sin(-midAngle * RADIAN)}
            fill="#fff"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(false);

    const [incomeExpense, setIncomeExpense] = useState([]);
    const [profitTrend, setProfitTrend] = useState([]);
    const [expenseDist, setExpenseDist] = useState([]);
    const [vehicleContrib, setVehicleContrib] = useState([]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const qs = new URLSearchParams();
        if (from) qs.set('from', from);
        if (to) qs.set('to', to);
        const q = qs.toString();

        try {
            const [r1, r2, r3, r4] = await Promise.all([
                fetch(`/api/analytics/income-vs-expense${q ? '?' + q : ''}`).then(r => r.json()),
                fetch(`/api/analytics/profit-trend${q ? '?' + q : ''}`).then(r => r.json()),
                fetch(`/api/analytics/expense-distribution${q ? '?' + q : ''}`).then(r => r.json()),
                fetch(`/api/analytics/vehicle-contribution${q ? '?' + q : ''}`).then(r => r.json()),
            ]);

            if (r1.success) setIncomeExpense(r1.data || []);
            if (r2.success) setProfitTrend(r2.data || []);
            if (r3.success) setExpenseDist(r3.data || []);
            if (r4.success) setVehicleContrib(r4.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Analytics</h1>
                <p className="text-slate-400 text-sm mt-0.5">Visual insights — company-scoped, read-only</p>
            </div>

            {/* Date filter bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Filter size={10} /> From
                        </label>
                        <DateInput
                            value={from}
                            onChange={e => setFrom(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/60 transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500 font-medium">To</label>
                        <DateInput
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/60 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => { setFrom(''); setTo(''); }}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors self-end pb-2.5"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Loading overlay hint */}
            {loading && (
                <div className="text-center text-slate-500 text-sm animate-pulse">Fetching chart data…</div>
            )}

            {/* Charts grid */}
            <div className="grid gap-5 md:grid-cols-2">

                {/* 1. Income vs Expense — Bar Chart */}
                <ChartCard title="Income vs Expense (Monthly)" empty={!incomeExpense.length}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={incomeExpense} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-800)" />
                            <XAxis dataKey="month" stroke="var(--color-slate-400)" tick={{ fontSize: 10 }} tickFormatter={fmtMonth} />
                            <YAxis stroke="var(--color-slate-400)" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                {...tooltipStyle}
                                labelFormatter={fmtMonth}
                                formatter={(v, n) => [fmt(v), n === 'income' ? 'Income' : 'Expenses']}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--color-slate-400)' }} />
                            <Bar dataKey="income" name="income" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={32} />
                            <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* 2. Profit Trend — Line Chart */}
                <ChartCard title="Profit Trend (Monthly)" empty={!profitTrend.length}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={profitTrend} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-800)" />
                            <XAxis dataKey="month" stroke="var(--color-slate-400)" tick={{ fontSize: 10 }} tickFormatter={fmtMonth} />
                            <YAxis stroke="var(--color-slate-400)" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                {...tooltipStyle}
                                labelFormatter={fmtMonth}
                                formatter={v => [fmt(v), 'Net Profit']}
                            />
                            <Line
                                type="monotone"
                                dataKey="profit"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                dot={{ fill: '#3b82f6', r: 3, strokeWidth: 2, stroke: 'var(--color-slate-900)' }}
                                activeDot={{ r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* 3. Expense Distribution — Pie Chart */}
                <ChartCard title="Expense Distribution" empty={!expenseDist.length}>
                    <PieContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={expenseDist}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                labelLine={false}
                                label={renderPieLabel}
                            >
                                {expenseDist.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <PieTooltip
                                contentStyle={{ backgroundColor: 'var(--color-slate-900)', border: '1px solid var(--color-slate-800)', borderRadius: '8px', fontSize: '12px' }}
                                itemStyle={{ color: 'var(--color-slate-100)' }}
                                formatter={v => [fmt(v), 'Amount']}
                            />
                            <PieLegend
                                wrapperStyle={{ fontSize: '10px', color: 'var(--color-slate-400)' }}
                                formatter={name => name.length > 18 ? name.slice(0, 17) + '…' : name}
                            />
                        </PieChart>
                    </PieContainer>
                </ChartCard>

                {/* 4. Vehicle Profit Contribution — Horizontal Bar Chart */}
                <ChartCard title="Vehicle Profit Contribution" empty={!vehicleContrib.length}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={vehicleContrib}
                            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-800)" horizontal={false} />
                            <XAxis type="number" stroke="var(--color-slate-400)" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <YAxis
                                type="category"
                                dataKey="vehicle"
                                stroke="var(--color-slate-400)"
                                tick={{ fontSize: 10 }}
                                width={80}
                                interval={0}
                            />
                            <Tooltip
                                {...tooltipStyle}
                                formatter={(v, n) => [fmt(v), n === 'profit' ? 'Profit' : n === 'income' ? 'Income' : 'Expenses']}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--color-slate-400)' }} />
                            <Bar dataKey="income" name="income" fill="#10b981" radius={[0, 3, 3, 0]} maxBarSize={18} />
                            <Bar dataKey="expense" name="expense" fill="#f97316" radius={[0, 3, 3, 0]} maxBarSize={18} />
                            <Bar dataKey="profit" name="profit" fill="#3b82f6" radius={[0, 3, 3, 0]} maxBarSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}
