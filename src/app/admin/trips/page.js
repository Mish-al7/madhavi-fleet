'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Check, X, Calendar, Truck, MapPin, User, Users, DollarSign, Wallet, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

export default function AdminTripsPage() {
    const [trips, setTrips] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [isCustomDriver, setIsCustomDriver] = useState(false);

    const [formData, setFormData] = useState({
        trip_date: new Date().toISOString().split('T')[0],
        vehicle_id: '',
        driver_id: '',
        actual_driver_name: '',
        trip_route: '',
        income: '',
        fuel: '',
        fasttag: '',
        driver_allowance: '',
        service: '',
        adblue: '',
        grease: '',
        air: '',
        deposit_to_kdr_bank: '',
        other_expense: '',
        notes: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    async function fetchInitialData() {
        setLoading(true);
        try {
            const [tripsRes, vehiclesRes, usersRes] = await Promise.all([
                fetch('/api/admin/trips'),
                fetch('/api/vehicles'),
                fetch('/api/users')
            ]);

            const tripsJson = await tripsRes.json();
            const vehiclesJson = await vehiclesRes.json();
            const usersJson = await usersRes.json();

            if (tripsJson.success) setTrips(tripsJson.data);
            if (vehiclesJson.success) setVehicles(vehiclesJson.data.filter(v => v.status === 'active'));
            if (usersJson.success) setDrivers(usersJson.data.filter(u => u.role === 'driver' && u.isActive !== false));

        } catch (err) {
            console.error('Error fetching initial data:', err);
            setError('Failed to fetch required data');
        } finally {
            setLoading(false);
        }
    }

    async function fetchTrips() {
        try {
            const res = await fetch('/api/admin/trips');
            const json = await res.json();
            if (json.success) setTrips(json.data);
        } catch (err) {
            console.error(err);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const endpoint = editingId ? `/api/admin/trips/${editingId}` : '/api/admin/trips';
        const method = editingId ? 'PUT' : 'POST';

        // Parse numerical fields
        const submissionData = { ...formData };
        const numericFields = [
            'income', 'fuel', 'fasttag', 'driver_allowance',
            'service', 'adblue', 'grease', 'air',
            'deposit_to_kdr_bank', 'other_expense'
        ];
        numericFields.forEach(field => {
            submissionData[field] = submissionData[field] === '' ? 0 : Number(submissionData[field]);
        });

        // Set driver options appropriately
        if (isCustomDriver) {
            submissionData.driver_id = null;
        } else {
            submissionData.actual_driver_name = '';
        }

        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to save trip entry');
            }

            await fetchTrips();
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (trip) => {
        setEditingId(trip._id);
        const hasCustomDriver = !trip.driver_id && !!(trip.actual_driver_name);
        setIsCustomDriver(hasCustomDriver);

        setFormData({
            trip_date: trip.trip_date ? new Date(trip.trip_date).toISOString().split('T')[0] : '',
            vehicle_id: trip.vehicle_id?._id || trip.vehicle_id || '',
            driver_id: trip.driver_id?._id || trip.driver_id || '',
            actual_driver_name: trip.actual_driver_name || '',
            trip_route: trip.trip_route || '',
            income: trip.income || '',
            fuel: trip.fuel || '',
            fasttag: trip.fasttag || '',
            driver_allowance: trip.driver_allowance || '',
            service: trip.service || '',
            adblue: trip.adblue || '',
            grease: trip.grease || '',
            air: trip.air || '',
            deposit_to_kdr_bank: trip.deposit_to_kdr_bank || '',
            other_expense: trip.other_expense || '',
            notes: trip.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this trip entry? This will permanently modify its vehicle ledger.')) return;
        setError('');

        try {
            const res = await fetch(`/api/admin/trips/${id}`, { method: 'DELETE' });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to delete trip entry');
            }

            await fetchTrips();
        } catch (err) {
            setError(err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            trip_date: new Date().toISOString().split('T')[0],
            vehicle_id: '',
            driver_id: '',
            actual_driver_name: '',
            trip_route: '',
            income: '',
            fuel: '',
            fasttag: '',
            driver_allowance: '',
            service: '',
            adblue: '',
            grease: '',
            air: '',
            deposit_to_kdr_bank: '',
            other_expense: '',
            notes: ''
        });
        setIsCustomDriver(false);
        setEditingId(null);
        setShowForm(false);
    };

    // Derived statistics
    const totalIncome = trips.reduce((sum, t) => sum + (t.income || 0), 0);
    const totalExpenses = trips.reduce((sum, t) => sum + (t.total_expenses || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // Live totals computation inside form
    const liveExpense = [
        'fuel', 'fasttag', 'driver_allowance', 'service',
        'adblue', 'grease', 'air', 'deposit_to_kdr_bank', 'other_expense'
    ].reduce((sum, field) => sum + (Number(formData[field]) || 0), 0);

    if (loading && trips.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Truck className="text-blue-400" />
                        Tour Trips
                    </h1>
                    <p className="text-slate-400 text-sm">Manage tour trips and log journey details</p>
                </div>

                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    <span>Log Tour Trip</span>
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-pulse">
                    {error}
                </div>
            )}

            {/* Trip Form container */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">
                                {editingId ? 'Edit Tour Trip Details' : 'New Tour Trip Log'}
                            </h3>
                            <button
                                onClick={resetForm}
                                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Group 1: Core details */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                                <input
                                    type="date"
                                    value={formData.trip_date}
                                    onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle</label>
                                <select
                                    value={formData.vehicle_id}
                                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="" disabled>Select Vehicle</option>
                                    {vehicles.map(v => (
                                        <option key={v._id} value={v._id}>{v.vehicle_no} {v.vehicle_name ? `(${v.vehicle_name})` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Trip Route</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Bangalore to Kochi"
                                    value={formData.trip_route}
                                    onChange={(e) => setFormData({ ...formData, trip_route: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver</label>
                                    <label className="text-[10px] text-blue-400 font-semibold cursor-pointer select-none flex items-center gap-1">
                                        <input
                                            type="checkbox"
                                            checked={isCustomDriver}
                                            onChange={(e) => setIsCustomDriver(e.target.checked)}
                                            className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0"
                                        />
                                        Custom Driver
                                    </label>
                                </div>

                                {isCustomDriver ? (
                                    <input
                                        type="text"
                                        placeholder="Driver Name"
                                        required
                                        value={formData.actual_driver_name}
                                        onChange={(e) => setFormData({ ...formData, actual_driver_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                ) : (
                                    <select
                                        value={formData.driver_id}
                                        onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="" disabled>Select Driver</option>
                                        {drivers.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Group 2: Financial Details */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Income & Expenses</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Total Income / Ticket Revenue</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.income}
                                        onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fuel Cost</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.fuel}
                                        onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">FastTag / Tolls</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.fasttag}
                                        onChange={(e) => setFormData({ ...formData, fasttag: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Driver Allowance (Bata)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.driver_allowance}
                                        onChange={(e) => setFormData({ ...formData, driver_allowance: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Workshop Service</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.service}
                                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">AdBlue</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.adblue}
                                        onChange={(e) => setFormData({ ...formData, adblue: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Grease</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.grease}
                                        onChange={(e) => setFormData({ ...formData, grease: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Air / Pneumatics</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.air}
                                        onChange={(e) => setFormData({ ...formData, air: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Deposit to KDR Bank</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.deposit_to_kdr_bank}
                                        onChange={(e) => setFormData({ ...formData, deposit_to_kdr_bank: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Other Expenses</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.other_expense}
                                        onChange={(e) => setFormData({ ...formData, other_expense: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                            <textarea
                                placeholder="Journey notes, breakdown info, cargo list..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-16 resize-none"
                            />
                        </div>

                        {/* Live calculations footer banner */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm">
                            <div className="flex gap-6">
                                <div>
                                    <span className="text-slate-500 text-xs">Total Income</span>
                                    <div className="text-emerald-400 font-bold font-mono">₹{(Number(formData.income) || 0).toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-xs">Estimated Expenses</span>
                                    <div className="text-red-400 font-bold font-mono">₹{liveExpense.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-slate-500 text-xs">Net Margin</span>
                                <div className={`text-lg font-bold font-mono ${(Number(formData.income) || 0) - liveExpense >= 0 ? 'text-blue-400' : 'text-rose-555 text-red-500'}`}>
                                    {(Number(formData.income) || 0) - liveExpense >= 0 ? '+' : ''}₹{((Number(formData.income) || 0) - liveExpense).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end border-t border-slate-850 pt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                            >
                                {saving ? (
                                    <span>Saving...</span>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        <span>Save Trip</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            )}

            {/* KPI statistics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <DollarSign className="text-emerald-400" size={20} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Income Generated</span>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{totalIncome.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Wallet className="text-red-400" size={20} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Trip Expenses</span>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{totalExpenses.toLocaleString()}</p>
                </div>

                <div className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-blue-500/10 to-blue-600/5 border-blue-500/20' : 'from-red-500/10 to-red-600/5 border-red-500/20'} border rounded-xl p-5`}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 ${netProfit >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'} rounded-lg`}>
                            <DollarSign className={netProfit >= 0 ? 'text-blue-400' : 'text-red-400'} size={20} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Net Profit</span>
                    </div>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Trips List Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                    <h3 className="text-lg font-bold text-white">Logged Tour Trips ({trips.length})</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">
                                <th className="p-4 border-b border-slate-800 font-semibold">Date / Vehicle</th>
                                <th className="p-4 border-b border-slate-800 font-semibold">Route</th>
                                <th className="p-4 border-b border-slate-800 font-semibold">Driver</th>
                                <th className="p-4 border-b border-slate-800 text-right font-semibold">Income</th>
                                <th className="p-4 border-b border-slate-800 text-right font-semibold">Expenses</th>
                                <th className="p-4 border-b border-slate-800 text-right font-semibold">Net Profit</th>
                                <th className="p-4 border-b border-slate-800 text-center font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm text-slate-300 whitespace-nowrap">
                            {trips.map(trip => {
                                const profit = (trip.income || 0) - (trip.total_expenses || 0);
                                return (
                                    <tr key={trip._id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-white flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-500" />
                                                {formatDate(trip.trip_date)}
                                            </div>
                                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono uppercase">
                                                <Truck size={12} className="text-slate-500" />
                                                {trip.vehicle_id?.vehicle_no || 'Unknown'} {trip.vehicle_id?.vehicle_name ? `(${trip.vehicle_id.vehicle_name})` : ''}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-white flex items-center gap-1.5">
                                                <MapPin size={13} className="text-slate-500" />
                                                {trip.trip_route}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 font-semibold text-white">
                                                <User size={13} className="text-slate-500" />
                                                <span>{trip.actual_driver_name || trip.driver_id?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-emerald-400 font-bold font-mono">
                                            ₹{(trip.income || 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right text-red-400 font-bold font-mono">
                                            ₹{(trip.total_expenses || 0).toLocaleString()}
                                        </td>
                                        <td className={`p-4 text-right font-bold font-mono ${profit >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                                            {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleEdit(trip)}
                                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all"
                                                    title="Edit Log"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trip._id)}
                                                    className="p-1.5 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                    title="Delete Log"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {trips.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-slate-500">
                                        No tour trips logged yet. Click "Log Tour Trip" to create one.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
