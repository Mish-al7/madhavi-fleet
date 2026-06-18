'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Calendar, Filter, X, Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import DateInput from '@/components/ui/DateInput';

export default function PersonalLedgerPage() {
    const [entries, setEntries] = useState([]);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Custom Ledger State
    const [ledgers, setLedgers] = useState([]);
    const [selectedLedger, setSelectedLedger] = useState('main'); // 'main' or ledger._id
    const [showCreateLedgerModal, setShowCreateLedgerModal] = useState(false);
    const [newLedgerName, setNewLedgerName] = useState('');

    // Filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(''); // '' means all
    const [isFiltered, setIsFiltered] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        type: 'income',
        amount: ''
    });

    const fetchLedgers = async () => {
        try {
            const res = await fetch('/api/custom-ledgers');
            const data = await res.json();
            if (data.success) {
                setLedgers(data.data);
            }
        } catch (error) {
            console.error('Error fetching ledgers:', error);
        }
    };

    // Fetch entries
    const fetchEntries = async (filterParams = {}, ledgerId = selectedLedger) => {
        try {
            setLoading(true);
            let url = ledgerId === 'main'
                ? '/api/admin-cash-ledger'
                : `/api/custom-ledgers/${ledgerId}/entries`;

            const params = new URLSearchParams();
            if (filterParams.startDate) params.append('startDate', filterParams.startDate);
            if (filterParams.endDate) params.append('endDate', filterParams.endDate);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                setEntries(data.data.entries || data.data); // data.data.entries for custom ledger, data.data for old main route maybe? 
                setCurrentBalance(data.data.currentBalance || 0);
            }
        } catch (error) {
            console.error('Error fetching entries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedgers();
    }, []);

    useEffect(() => {
        fetchEntries({ startDate, endDate }, selectedLedger);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLedger]);

    // Apply filter
    const handleApplyFilter = () => {
        if (startDate || endDate) {
            fetchEntries({ startDate, endDate });
            setIsFiltered(true);
        }
    };

    // Filter Logic matching Ledger
    const updateDateAndFetch = (year, month) => {
        let start = '';
        let end = '';

        if (month) {
            start = `${year}-${month.padStart(2, '0')}-01`;
            const lastDay = new Date(year, parseInt(month), 0).getDate();
            end = `${year}-${month.padStart(2, '0')}-${lastDay}`;
        } else {
            start = `${year}-01-01`;
            end = `${year}-12-31`;
        }

        setStartDate(start);
        setEndDate(end);
        setIsFiltered(true);
        fetchEntries({ startDate: start, endDate: end });
    };

    const handleYearChange = (year) => {
        const yearInt = parseInt(year);
        setSelectedYear(yearInt);
        updateDateAndFetch(yearInt, selectedMonth);
    };

    const handleMonthChange = (month) => {
        setSelectedMonth(month);
        updateDateAndFetch(selectedYear, month);
    };

    // Clear filter
    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        setSelectedYear(new Date().getFullYear());
        setSelectedMonth('');
        setIsFiltered(false);
        fetchEntries();
    };

    // Handle edit entry
    const handleEdit = (entry) => {
        setEditingEntry(entry);
        setFormData({
            date: new Date(entry.date).toISOString().split('T')[0],
            description: entry.description,
            type: entry.type,
            amount: entry.amount.toString()
        });
        setShowAddModal(true);
    };

    // Handle delete entry
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
            return;
        }

        try {
            setDeletingId(id);
            const url = selectedLedger === 'main'
                ? `/api/admin-cash-ledger/${id}`
                : `/api/custom-ledgers/${selectedLedger}/entries/${id}`;

            const res = await fetch(url, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (data.success) {
                // Refresh entries
                if (isFiltered) {
                    fetchEntries({ startDate, endDate }, selectedLedger);
                } else {
                    fetchEntries({}, selectedLedger);
                }
            } else {
                alert(data.error || 'Failed to delete entry');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Failed to delete entry');
        } finally {
            setDeletingId(null);
        }
    };

    // Handle form submit (Create or Update Entry)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let res;

            if (editingEntry) {
                // Update existing entry
                const url = selectedLedger === 'main'
                    ? `/api/admin-cash-ledger/${editingEntry._id}`
                    : `/api/custom-ledgers/${selectedLedger}/entries/${editingEntry._id}`;

                res = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new entry
                const url = selectedLedger === 'main'
                    ? '/api/admin-cash-ledger'
                    : `/api/custom-ledgers/${selectedLedger}/entries`;

                res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            const data = await res.json();

            if (data.success) {
                setShowAddModal(false);
                setEditingEntry(null);
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    type: 'income',
                    amount: ''
                });

                // Show warning if updating
                if (editingEntry && data.warning) {
                    alert(data.warning);
                }

                // Refresh entries
                if (isFiltered) {
                    fetchEntries({ startDate, endDate }, selectedLedger);
                } else {
                    fetchEntries({}, selectedLedger);
                }
            } else {
                alert(data.error || `Failed to ${editingEntry ? 'update' : 'add'} entry`);
            }
        } catch (error) {
            console.error(`Error ${editingEntry ? 'updating' : 'adding'} entry:`, error);
            alert(`Failed to ${editingEntry ? 'update' : 'add'} entry`);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Create Ledger
    const handleCreateLedger = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/custom-ledgers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newLedgerName })
            });

            const data = await res.json();
            if (data.success) {
                setShowCreateLedgerModal(false);
                setNewLedgerName('');
                await fetchLedgers();
                setSelectedLedger(data.data._id); // Automatically switch to the newly created ledger
            } else {
                alert(data.error || 'Failed to create ledger');
            }
        } catch (error) {
            console.error('Error creating ledger:', error);
            alert('Failed to create ledger');
        }
    };

    // Handle Delete Ledger
    const handleDeleteLedger = async (ledgerId) => {
        if (!confirm('Are you sure you want to delete this entire ledger and all its entries? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/custom-ledgers/${ledgerId}`, {
                method: 'DELETE'
            });

            const data = await res.json();
            if (data.success) {
                if (selectedLedger === ledgerId) {
                    setSelectedLedger('main');
                }
                fetchLedgers();
            } else {
                alert(data.error || 'Failed to delete ledger');
            }
        } catch (error) {
            console.error('Error deleting ledger:', error);
            alert('Failed to delete ledger');
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingEntry(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            type: 'income',
            amount: ''
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Personal Cash Ledger</h1>
                <p className="text-slate-400">Track your personal income and expenses</p>
            </div>

            {/* Current Balance Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 mb-6 shadow-lg">
                <p className="text-blue-100 text-xs font-medium mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-white">
                    Rs {currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6 items-stretch lg:items-center">
                {/* Ledger Management Group */}
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1.5 rounded-xl shadow-inner">
                    <select
                        value={selectedLedger}
                        onChange={(e) => setSelectedLedger(e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-blue-500 shadow-sm text-sm"
                    >
                        <option value="main" className="font-semibold">Main Cash Ledger</option>
                        {ledgers.length > 0 && <optgroup label="Custom Ledgers" />}
                        {ledgers.map(l => (
                            <option key={l._id} value={l._id}>{l.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setShowCreateLedgerModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md active:scale-95"
                    >
                        <PlusCircle size={14} />
                        Add New Ledger
                    </button>

                    {selectedLedger !== 'main' && (
                        <button
                            onClick={() => handleDeleteLedger(selectedLedger)}
                            className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded-lg transition-colors border border-transparent hover:border-red-500"
                            title="Delete Ledger"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {/* Filter Section */}
                <div className="flex flex-nowrap items-center gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-slate-800 flex-1 shadow-inner overflow-hidden">
                    {/* Year Dropdown */}
                    <select
                        value={selectedYear}
                        onChange={(e) => handleYearChange(e.target.value)}
                        className="bg-slate-950 text-white text-[11px] border border-slate-700 rounded-lg px-1.5 py-1 focus:outline-none focus:border-blue-500"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    {/* Month Dropdown */}
                    <select
                        value={selectedMonth}
                        onChange={(e) => handleMonthChange(e.target.value)}
                        className="bg-slate-950 text-white text-[11px] border border-slate-700 rounded-lg px-1.5 py-1 focus:outline-none focus:border-blue-500"
                    >
                        <option value="">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => {
                            const m = (i + 1).toString().padStart(2, '0');
                            const name = new Date(2000, i).toLocaleString('default', { month: 'short' });
                            return <option key={m} value={m}>{name}</option>;
                        })}
                    </select>

                    <div className="flex items-center text-slate-700 opacity-30">|</div>

                    {/* Custom Date Range */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <DateInput
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setSelectedMonth('');
                                setIsFiltered(true);
                            }}
                            className="bg-slate-950 text-white border border-slate-700 rounded-lg px-1 py-1 focus:outline-none w-[105px] text-[10px]"
                        />
                        <span className="opacity-30">to</span>
                        <DateInput
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setSelectedMonth('');
                                setIsFiltered(true);
                            }}
                            className="bg-slate-950 text-white border border-slate-700 rounded-lg px-1 py-1 focus:outline-none w-[105px] text-[10px]"
                        />
                    </div>

                    <div className="flex gap-1 ml-auto pl-1.5 border-l border-slate-800">
                        <button
                            onClick={handleApplyFilter}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border border-slate-700 active:scale-95 whitespace-nowrap"
                        >
                            <Filter size={10} />
                            Apply
                        </button>
                        {isFiltered && (
                            <button
                                onClick={handleClearFilter}
                                className="px-2 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-all flex items-center border border-red-500/20 active:scale-95"
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Add Entry Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95 whitespace-nowrap"
                >
                    <PlusCircle size={18} />
                    Add Entry
                </button>
            </div>

            {/* Ledger Table / List */}
            <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Income
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Expense
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Running Balance
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                        No entries found. Add your first entry to get started.
                                    </td>
                                </tr>
                            ) : (
                                // Sort entries for display: newest first (date DESC, createdAt DESC)
                                // Note: This is display-only. Running balances remain correct as calculated.
                                [...entries]
                                    .sort((a, b) => {
                                        const dateA = new Date(a.date);
                                        const dateB = new Date(b.date);

                                        // First sort by date (newest first)
                                        if (dateB.getTime() !== dateA.getTime()) {
                                            return dateB.getTime() - dateA.getTime();
                                        }

                                        // If same date, sort by createdAt (newest first)
                                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                                    })
                                    .map((entry) => (
                                        <tr key={entry._id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {formatDate(entry.date)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-white">
                                                {entry.description}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-green-400 font-medium">
                                                {entry.type === 'income'
                                                    ? `+${entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-red-400 font-medium">
                                                {entry.type === 'expense'
                                                    ? `-${entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right text-blue-400 font-bold font-mono">
                                                ₹{entry.running_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(entry)}
                                                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="Edit entry"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(entry._id)}
                                                        disabled={deletingId === entry._id}
                                                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Delete entry"
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

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-800/60">
                    {loading ? (
                        <div className="p-6 text-center text-slate-400">Loading...</div>
                    ) : entries.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                            No entries found. Add your first entry to get started.
                        </div>
                    ) : (
                        [...entries]
                            .sort((a, b) => {
                                const dateA = new Date(a.date);
                                const dateB = new Date(b.date);

                                // Sort by date (newest first)
                                if (dateB.getTime() !== dateA.getTime()) {
                                    return dateB.getTime() - dateA.getTime();
                                }

                                // Sort by createdAt (newest first)
                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            })
                            .map((entry) => (
                                <div key={entry._id} className="p-4 space-y-3 hover:bg-slate-800/10 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs text-slate-400 font-mono">{formatDate(entry.date)}</span>
                                            <span className="block text-sm font-semibold text-white mt-1">{entry.description}</span>
                                        </div>
                                        <div className="text-right">
                                            {entry.type === 'income' ? (
                                                <span className="text-sm font-bold text-green-400 font-mono">
                                                    +₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            ) : (
                                                <span className="text-sm font-bold text-red-400 font-mono">
                                                    -₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            )}
                                            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                                                Bal: ₹{entry.running_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${entry.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {entry.type}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                title="Edit entry"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry._id)}
                                                disabled={deletingId === entry._id}
                                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Create Ledger Modal */}
            {showCreateLedgerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-800">
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-2xl font-bold text-white">Create New Ledger</h2>
                            <p className="text-slate-400 text-sm mt-1">Create an isolated personal ledger to track specific finances.</p>
                        </div>

                        <form onSubmit={handleCreateLedger} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Ledger Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newLedgerName}
                                    onChange={(e) => setNewLedgerName(e.target.value)}
                                    placeholder="e.g., Goa Trip, Savings"
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateLedgerModal(false);
                                        setNewLedgerName('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
                                >
                                    Create Ledger
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Entry Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-800">
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-2xl font-bold text-white">{editingEntry ? 'Edit Entry' : 'Add Entry'}</h2>
                            <p className="text-slate-400 text-sm mt-1">
                                {editingEntry ? 'Update income or expense details' : 'Record a new income or expense in'}
                                <span className="text-blue-400 ml-1 font-medium">{selectedLedger === 'main' ? 'Main Cash Ledger' : ledgers.find(l => l._id === selectedLedger)?.name}</span>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Date <span className="text-red-400">*</span>
                                </label>
                                <DateInput
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Description <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Office supplies, Client payment"
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Type <span className="text-red-400">*</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="income"
                                            checked={formData.type === 'income'}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-white">Income</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="expense"
                                            checked={formData.type === 'expense'}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-white">Expense</span>
                                    </label>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Amount (Rs) <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingEntry ? 'Update Entry' : 'Add Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
