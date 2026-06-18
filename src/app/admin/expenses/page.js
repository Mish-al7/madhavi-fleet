'use client';

import { useState, useEffect } from 'react';
import { Plus, Filter, RefreshCw, Edit2, Trash2, PauseCircle, PlayCircle, Wallet, Calendar, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import AddExpenseModal from '@/components/admin/expenses/AddExpenseModal';
import ProcessDuesModal from '@/components/admin/expenses/ProcessDuesModal';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterFrequency, setFilterFrequency] = useState('');
    const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'recurring'

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [showDuesModal, setShowDuesModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when filters change
        fetchExpenses(1);
    }, [filterVehicle, filterFrequency, activeTab]);

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setFilterFrequency(''); // Reset frequency filter when switching tabs
        setCurrentPage(1);
    };

    async function fetchInitialData() {
        try {
            const vRes = await fetch('/api/vehicles');
            const vJson = await vRes.json();
            if (vJson.success) setVehicles(vJson.data);
        } catch (error) {
            console.error(error);
        }
    }

    async function fetchExpenses(page = currentPage) {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterVehicle) params.append('vehicle_id', filterVehicle);

            // Handle frequency based on tab
            if (activeTab === 'payments') {
                params.append('frequency', 'One-time');
            } else if (filterFrequency) {
                params.append('frequency', filterFrequency);
            } else {
                params.append('frequency', 'recurring');
            }

            params.append('page', page);
            params.append('limit', 50);

            const res = await fetch(`/api/admin/expenses?${params.toString()}`);
            const json = await res.json();
            if (json.success) {
                setExpenses(json.data);
                if (json.pagination) {
                    setTotalPages(json.pagination.pages);
                    setCurrentPage(json.pagination.page);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(data) {
        try {
            const method = editingExpense ? 'PUT' : 'POST';
            const url = editingExpense
                ? `/api/admin/expenses/${editingExpense._id}`
                : '/api/admin/expenses';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error);

            setShowModal(false);
            setEditingExpense(null);
            fetchExpenses();
        } catch (error) {
            alert('Error saving expense: ' + error.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' });
            fetchExpenses();
        } catch (error) {
            console.error(error);
        }
    }

    const handleProcessRecurring = () => {
        setShowDuesModal(true);
    };

    const handleDuesProcessed = (count) => {
        alert(`Successfully processed ${count} expense instances.`);
        fetchExpenses();
        setShowDuesModal(false);
    };

    const filteredExpenses = expenses;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Wallet className="text-blue-400" />
                        Admin Expenses
                    </h1>
                    <p className="text-slate-400 text-sm">Manage recurring payments and misc. ledger entries</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {activeTab === 'recurring' && (
                        <button
                            onClick={handleProcessRecurring}
                            disabled={processing}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw size={18} className={processing ? 'animate-spin' : ''} />
                            {processing ? 'Processing...' : 'Process Due'}
                        </button>
                    )}
                    <button
                        onClick={() => { setEditingExpense(null); setShowModal(true); }}
                        className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => handleTabChange('payments')}
                    className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'payments'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <Wallet size={16} />
                    Payments
                </button>
                <button
                    onClick={() => handleTabChange('recurring')}
                    className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'recurring'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                >
                    <RefreshCw size={16} />
                    Recurring Sheet
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                <select
                    value={filterVehicle}
                    onChange={(e) => setFilterVehicle(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="">All Vehicles</option>
                    <option value="null">Company Level (No Vehicle)</option>
                    {vehicles.map(v => (
                        <option key={v._id} value={v._id}>{(v.vehicle_no || v.registration_number)} {v.vehicle_name ? `(${v.vehicle_name})` : ''}{v.nickname ? ` - ${v.nickname}` : ''}</option>
                    ))}
                </select>

                {activeTab === 'recurring' && (
                    <select
                        value={filterFrequency}
                        onChange={(e) => setFilterFrequency(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">All Frequencies</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Yearly">Yearly</option>
                    </select>
                )}
            </div>

            {/* Expenses Table */}
            <div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-sm uppercase whitespace-nowrap">
                                <th className="px-3 py-3 font-medium">Date</th>
                                <th className="px-3 py-3 font-medium">Type / Description</th>
                                <th className="px-3 py-3 font-medium">Vehicle</th>
                                <th className="px-3 py-3 font-medium">Amount</th>
                                <th className="px-3 py-3 font-medium">Frequency</th>
                                <th className="px-3 py-3 font-medium">Status</th>
                                <th className="px-3 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-4 text-center text-slate-500">Loading...</td>
                                </tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-4 text-center text-slate-500">
                                        No {activeTab === 'payments' ? 'payments' : 'recurring expenses'} found.
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map(expense => (
                                    <tr key={expense._id} className="group hover:bg-slate-800/30 transition-colors">
                                        <td className="px-3 py-3 text-slate-300 whitespace-nowrap">
                                            {new Date(expense.start_date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{expense.expense_type}</span>
                                                <span className="text-slate-500 text-xs">{expense.description}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-300 whitespace-nowrap">
                                            {expense.vehicle_id ? (
                                                <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-xs text-blue-300 border border-blue-500/20 whitespace-nowrap">
                                                    <Truck size={12} />
                                                    {expense.vehicle_id.vehicle_no || 'Unknown'}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 text-xs italic">Company Level</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 font-bold text-white whitespace-nowrap">
                                            ₹{expense.amount.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${expense.frequency === 'One-time'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                }`}>
                                                {expense.frequency}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${expense.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                                                expense.status === 'Paused' ? 'bg-yellow-500/10 text-yellow-400' :
                                                    'bg-slate-700 text-slate-400'
                                                }`}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditingExpense(expense); setShowModal(true); }}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense._id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List View */}
                <div className="md:hidden divide-y divide-slate-800">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No {activeTab === 'payments' ? 'payments' : 'recurring expenses'} found.
                        </div>
                    ) : (
                        filteredExpenses.map(expense => (
                            <div key={expense._id} className="p-4 space-y-3 bg-slate-900/50">
                                <div className="flex justify-between items-center">
                                    <span className="font-mono text-xs text-slate-400">
                                        {new Date(expense.start_date).toLocaleDateString('en-GB')}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${expense.frequency === 'One-time'
                                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                            }`}>
                                            {expense.frequency}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${expense.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                                            expense.status === 'Paused' ? 'bg-yellow-500/10 text-yellow-400' :
                                                'bg-slate-700 text-slate-400'
                                            }`}>
                                            {expense.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-white font-medium text-sm block">{expense.expense_type}</span>
                                    {expense.description && (
                                        <span className="text-slate-400 text-xs block leading-relaxed">{expense.description}</span>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-500 block">Scope / Vehicle</span>
                                        {expense.vehicle_id ? (
                                            <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-xs text-blue-300 border border-blue-500/20 font-mono uppercase">
                                                <Truck size={10} />
                                                {expense.vehicle_id.vehicle_no || 'Unknown'}
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 text-xs italic">Company Level</span>
                                        )}
                                    </div>
                                    <div className="text-right space-y-1">
                                        <span className="text-[10px] text-slate-500 block">Amount</span>
                                        <span className="font-bold text-white text-sm">₹{expense.amount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-800/60 flex justify-end gap-2">
                                    <button
                                        onClick={() => { setEditingExpense(expense); setShowModal(true); }}
                                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(expense._id)}
                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <button
                        disabled={currentPage === 1 || loading}
                        onClick={() => fetchExpenses(currentPage - 1)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-sm"
                    >
                        <ChevronLeft size={16} />
                        Previous
                    </button>
                    <span className="text-slate-400 text-sm">
                        Page <span className="text-white font-medium">{currentPage}</span> of <span className="text-white font-medium">{totalPages}</span>
                    </span>
                    <button
                        disabled={currentPage === totalPages || loading}
                        onClick={() => fetchExpenses(currentPage + 1)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-sm"
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {showModal && (
                <AddExpenseModal
                    initialData={editingExpense}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                    vehicles={vehicles}
                />
            )}
            {showDuesModal && (
                <ProcessDuesModal
                    onClose={() => setShowDuesModal(false)}
                    onProcessed={handleDuesProcessed}
                />
            )}
        </div>
    );
}
