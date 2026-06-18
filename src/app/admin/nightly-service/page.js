'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, Check, X, Calendar, Truck, MapPin, User, Users, DollarSign, Wallet } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

export default function NightlyServicesPage() {
    const [services, setServices] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
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
        route_id: '',
        driver_id: '',
        actual_driver_name: '',
        cleaner_name: '',
        driver_payment: '',
        cleaner_payment: '',
        fuel: '',
        seats_filled: '',
        toll: '',
        office_offline_collection: '',
        online_booking_collection: '',
        other_expense: '',
        notes: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    async function fetchInitialData() {
        setLoading(true);
        try {
            const [servicesRes, vehiclesRes, routesRes, usersRes] = await Promise.all([
                fetch('/api/nightly-services'),
                fetch('/api/vehicles'),
                fetch('/api/routes'),
                fetch('/api/users')
            ]);

            const servicesJson = await servicesRes.json();
            const vehiclesJson = await vehiclesRes.json();
            const routesJson = await routesRes.json();
            const usersJson = await usersRes.json();

            if (servicesJson.success) setServices(servicesJson.data);
            if (vehiclesJson.success) setVehicles(vehiclesJson.data.filter(v => v.status === 'active'));
            if (routesJson.success) setRoutes(routesJson.data);
            if (usersJson.success) setDrivers(usersJson.data.filter(u => u.role === 'driver' && u.isActive !== false));

        } catch (err) {
            console.error('Error fetching initial data:', err);
            setError('Failed to fetch required data');
        } finally {
            setLoading(false);
        }
    }

    async function fetchServices() {
        try {
            const res = await fetch('/api/nightly-services');
            const json = await res.json();
            if (json.success) setServices(json.data);
        } catch (err) {
            console.error(err);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const endpoint = editingId ? `/api/nightly-services/${editingId}` : '/api/nightly-services';
        const method = editingId ? 'PUT' : 'POST';

        // Parse numerical fields
        const submissionData = { ...formData };
        const numericFields = [
            'driver_payment', 'cleaner_payment', 'fuel',
            'seats_filled', 'toll', 'office_offline_collection',
            'online_booking_collection', 'other_expense'
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
                throw new Error(json.error || 'Failed to save nightly service entry');
            }

            await fetchServices();
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (service) => {
        setEditingId(service._id);
        const hasCustomDriver = !service.driver_id && !!(service.actual_driver_name);
        setIsCustomDriver(hasCustomDriver);

        setFormData({
            trip_date: service.trip_date ? new Date(service.trip_date).toISOString().split('T')[0] : '',
            vehicle_id: service.vehicle_id?._id || service.vehicle_id || '',
            route_id: service.route_id?._id || service.route_id || '',
            driver_id: service.driver_id?._id || service.driver_id || '',
            actual_driver_name: service.actual_driver_name || '',
            cleaner_name: service.cleaner_name || '',
            driver_payment: service.driver_payment || '',
            cleaner_payment: service.cleaner_payment || '',
            fuel: service.fuel || '',
            seats_filled: service.seats_filled || '',
            toll: service.toll || '',
            office_offline_collection: service.office_offline_collection || '',
            online_booking_collection: service.online_booking_collection || '',
            other_expense: service.other_expense || '',
            notes: service.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this nightly service entry? This will permanently modify its vehicle ledger.')) return;
        setError('');

        try {
            const res = await fetch(`/api/nightly-services/${id}`, { method: 'DELETE' });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to delete service entry');
            }

            await fetchServices();
        } catch (err) {
            setError(err.message);
        }
    };

    const resetForm = () => {
        setFormData({
            trip_date: new Date().toISOString().split('T')[0],
            vehicle_id: '',
            route_id: '',
            driver_id: '',
            actual_driver_name: '',
            cleaner_name: '',
            driver_payment: '',
            cleaner_payment: '',
            fuel: '',
            seats_filled: '',
            toll: '',
            office_offline_collection: '',
            online_booking_collection: '',
            other_expense: '',
            notes: ''
        });
        setIsCustomDriver(false);
        setEditingId(null);
        setShowForm(false);
    };

    // Derived statistics
    const totalIncome = services.reduce((sum, s) => sum + (s.income || 0), 0);
    const totalExpenses = services.reduce((sum, s) => sum + (s.total_expenses || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // Selected route preview details
    const selectedRoute = routes.find(r => r._id === formData.route_id);

    // Live totals computation inside form
    const liveIncome = (Number(formData.office_offline_collection) || 0) + (Number(formData.online_booking_collection) || 0);
    const liveExpense = (Number(formData.fuel) || 0) + (Number(formData.toll) || 0) + (Number(formData.driver_payment) || 0) + (Number(formData.cleaner_payment) || 0) + (Number(formData.other_expense) || 0);

    if (loading && services.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FileText className="text-emerald-400" />
                        Nightly Services
                    </h1>
                    <p className="text-slate-400 text-sm">Log daily nightly service details and track financials</p>
                </div>

                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium text-sm"
                >
                    <Plus size={18} />
                    <span>Log Nightly Service</span>
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Form modal container */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">
                                {editingId ? 'Edit Nightly Service Log' : 'New Nightly Service Entry'}
                            </h3>
                            <button
                                onClick={resetForm}
                                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Group 1: Core Details */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Date</label>
                                <input
                                    type="date"
                                    value={formData.trip_date}
                                    onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle</label>
                                <select
                                    value={formData.vehicle_id}
                                    onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                >
                                    <option value="" disabled>Select Vehicle</option>
                                    {vehicles.map(v => (
                                        <option key={v._id} value={v._id}>{v.vehicle_no} {v.vehicle_name ? `(${v.vehicle_name})` : ''}{v.nickname ? ` - ${v.nickname}` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Route Path</label>
                                <select
                                    value={formData.route_id}
                                    onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                >
                                    <option value="" disabled>Select Route</option>
                                    {routes.map(r => (
                                        <option key={r._id} value={r._id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver</label>
                                    <label className="text-[10px] text-emerald-400 font-semibold cursor-pointer select-none flex items-center gap-1">
                                        <input
                                            type="checkbox"
                                            checked={isCustomDriver}
                                            onChange={(e) => setIsCustomDriver(e.target.checked)}
                                            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                                        />
                                        Custom Driver
                                    </label>
                                </div>
                                
                                {isCustomDriver ? (
                                    <input
                                        type="text"
                                        placeholder="Enter Driver Name"
                                        required
                                        value={formData.actual_driver_name}
                                        onChange={(e) => setFormData({ ...formData, actual_driver_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    />
                                ) : (
                                    <select
                                        value={formData.driver_id}
                                        onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    >
                                        <option value="" disabled>Select Driver</option>
                                        {drivers.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Selected Route Info banner */}
                        {selectedRoute && (
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-xs flex flex-wrap gap-x-6 gap-y-1">
                                <span><strong>From:</strong> {selectedRoute.from}</span>
                                <span><strong>To:</strong> {selectedRoute.to}</span>
                                <span><strong>Distance:</strong> {selectedRoute.distance_km} km</span>
                            </div>
                        )}

                        {/* Group 2: Crew & Capacity Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cleaner Name/Details</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Ramesh"
                                    value={formData.cleaner_name}
                                    onChange={(e) => setFormData({ ...formData, cleaner_name: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Seats Occupied / Filled</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 35"
                                    value={formData.seats_filled}
                                    onChange={(e) => setFormData({ ...formData, seats_filled: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Group 3: Financial Collections (Income) */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Collection</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Office Offline Collection</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.office_offline_collection}
                                        onChange={(e) => setFormData({ ...formData, office_offline_collection: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Online Booking Collection</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.online_booking_collection}
                                        onChange={(e) => setFormData({ ...formData, online_booking_collection: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Group 4: Journey Expenses */}
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Service Expenses</h4>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Fuel</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.fuel}
                                        onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Toll</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.toll}
                                        onChange={(e) => setFormData({ ...formData, toll: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Driver Batta</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.driver_payment}
                                        onChange={(e) => setFormData({ ...formData, driver_payment: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Cleaner Batta</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.cleaner_payment}
                                        onChange={(e) => setFormData({ ...formData, cleaner_payment: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Other Exp</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.other_expense}
                                        onChange={(e) => setFormData({ ...formData, other_expense: e.target.value })}
                                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                            <textarea
                                placeholder="Additional details..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-16 resize-none"
                            />
                        </div>

                        {/* Live computations result bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm">
                            <div className="flex gap-6">
                                <div>
                                    <span className="text-slate-500 text-xs">Total Collection</span>
                                    <div className="text-emerald-400 font-bold font-mono">₹{liveIncome.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-xs">Total Expenses</span>
                                    <div className="text-red-400 font-bold font-mono">₹{liveExpense.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-slate-500 text-xs">Net Balance</span>
                                <div className={`text-lg font-bold font-mono ${liveIncome - liveExpense >= 0 ? 'text-blue-400' : 'text-red-500'}`}>
                                    {liveIncome - liveExpense >= 0 ? '+' : ''}₹{(liveIncome - liveExpense).toLocaleString()}
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
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                            >
                                {saving ? (
                                    <span>Saving...</span>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        <span>Save Entry</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            )}

            {/* KPI statistics counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <DollarSign className="text-emerald-400" size={20} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Nightly Income</span>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{totalIncome.toLocaleString()}</p>
                </div>

                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Wallet className="text-red-400" size={20} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium">Nightly Expenses</span>
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

            {/* List Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                    <h3 className="text-lg font-bold text-white">Logged Nightly Services ({services.length})</h3>
                </div>

                <div>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">
                                    <th className="px-3 py-3 border-b border-slate-800 font-semibold">Date / Vehicle</th>
                                    <th className="px-3 py-3 border-b border-slate-800 font-semibold">Route Details</th>
                                    <th className="px-3 py-3 border-b border-slate-800 font-semibold">Crew</th>
                                    <th className="px-3 py-3 border-b border-slate-800 text-right font-semibold">Income</th>
                                    <th className="px-3 py-3 border-b border-slate-800 text-right font-semibold">Expenses</th>
                                    <th className="px-3 py-3 border-b border-slate-800 text-right font-semibold">Net Profit</th>
                                    <th className="px-3 py-3 border-b border-slate-800 text-center font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-sm text-slate-300 whitespace-nowrap">
                                {services.map(service => {
                                    const profit = (service.income || 0) - (service.total_expenses || 0);
                                    return (
                                        <tr key={service._id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-3 py-3">
                                                <div className="font-semibold text-white flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-slate-500" />
                                                    {formatDate(service.trip_date)}
                                                </div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono uppercase">
                                                    <Truck size={12} className="text-slate-500" />
                                                    {service.vehicle_id?.vehicle_no || 'Unknown'} {service.vehicle_id?.vehicle_name ? `(${service.vehicle_id.vehicle_name})` : ''}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="font-medium text-white flex items-center gap-1.5">
                                                    <MapPin size={13} className="text-slate-500" />
                                                    {service.route_id?.name || service.trip_route || 'Unknown Route'}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    Seats occupied: <strong className="text-slate-300">{service.seats_filled || 0}</strong>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-1">
                                                    <User size={13} className="text-slate-500" />
                                                    <span>Dr: {service.actual_driver_name || service.driver_id?.name || 'Unknown'}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <Users size={12} className="text-slate-500" />
                                                    <span>Cl: {service.cleaner_name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <div className="text-emerald-400 font-bold font-mono">₹{(service.income || 0).toLocaleString()}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                    Off: ₹{(service.office_offline_collection || 0).toLocaleString()} | On: ₹{(service.online_booking_collection || 0).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <div className="text-red-400 font-bold font-mono">₹{(service.total_expenses || 0).toLocaleString()}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                    Fuel: ₹{(service.fuel || 0).toLocaleString()} | Toll: ₹{(service.toll || 0).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className={`px-3 py-3 text-right font-bold font-mono ${profit >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                                                {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleEdit(service)}
                                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all"
                                                        title="Edit Log"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(service._id)}
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

                                {services.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-12 text-slate-500">
                                            No nightly service entries logged yet. Click "Log Nightly Service" to log details.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List View */}
                    <div className="md:hidden divide-y divide-slate-800">
                        {services.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 p-4">
                                No nightly service entries logged yet. Click "Log Nightly Service" to log details.
                            </div>
                        ) : (
                            services.map(service => {
                                const profit = (service.income || 0) - (service.total_expenses || 0);
                                return (
                                    <div key={service._id} className="p-4 space-y-3 bg-slate-900/50">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="font-semibold text-white flex items-center gap-1.5 text-sm">
                                                    <Calendar size={13} className="text-slate-500" />
                                                    {formatDate(service.trip_date)}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono uppercase flex items-center gap-1">
                                                    <Truck size={12} className="text-slate-500" />
                                                    {service.vehicle_id?.vehicle_no || 'Unknown'}
                                                </div>
                                            </div>
                                            <div className="bg-slate-800/80 border border-slate-700/50 text-[10px] px-2 py-0.5 rounded text-slate-300">
                                                Seats: {service.seats_filled || 0}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                                            <MapPin size={13} className="text-slate-500" />
                                            <span className="font-medium text-white">{service.route_id?.name || service.trip_route || 'Unknown Route'}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/40 pt-2">
                                            <div className="flex items-center gap-1 text-slate-300">
                                                <User size={13} className="text-slate-500" />
                                                <span>Dr: {service.actual_driver_name || service.driver_id?.name || 'Unknown'}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-300">
                                                <Users size={12} className="text-slate-500" />
                                                <span>Cl: {service.cleaner_name || '-'}</span>
                                            </div>
                                        </div>

                                        {/* Financial Breakdown Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
                                            <div className="bg-slate-950 p-2 rounded border border-slate-800/60 space-y-0.5 text-center">
                                                <span className="text-slate-500 block">Total Income</span>
                                                <span className="font-semibold font-mono text-emerald-400">₹{(service.income || 0).toLocaleString()}</span>
                                                <span className="text-[8px] text-slate-500 block truncate">Off:{service.office_offline_collection || 0}|On:{service.online_booking_collection || 0}</span>
                                            </div>
                                            <div className="bg-slate-950 p-2 rounded border border-slate-800/60 space-y-0.5 text-center">
                                                <span className="text-slate-500 block">Total Expenses</span>
                                                <span className="font-semibold font-mono text-red-400">₹{(service.total_expenses || 0).toLocaleString()}</span>
                                                <span className="text-[8px] text-slate-500 block truncate">Fuel:{service.fuel || 0}|Toll:{service.toll || 0}</span>
                                            </div>
                                            <div className="bg-slate-950 p-2 rounded border border-slate-800/60 space-y-0.5 text-center">
                                                <span className="text-slate-500 block">Net Profit</span>
                                                <span className={`font-semibold font-mono ${profit >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                                                    {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-800/60 flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(service)}
                                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all"
                                                title="Edit Log"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(service._id)}
                                                className="p-1.5 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                title="Delete Log"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
