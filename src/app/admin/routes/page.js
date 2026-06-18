'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Check, X, BarChart3, TrendingUp, TrendingDown, Users } from 'lucide-react';

export default function RoutesPage() {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('manage'); // 'manage' or 'analytics'
    const [showForm, setShowForm] = useState(false);
    const [editingRouteId, setEditingRouteId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        from: '',
        to: '',
        distance_km: ''
    });

    useEffect(() => {
        fetchRoutes();
    }, []);

    async function fetchRoutes() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/route-stats');
            const json = await res.json();
            if (json.success) {
                setRoutes(json.data);
            } else {
                setError(json.error || 'Failed to fetch routes');
            }
        } catch (err) {
            setError('Failed to connect to the server');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const endpoint = editingRouteId ? `/api/routes/${editingRouteId}` : '/api/routes';
        const method = editingRouteId ? 'PUT' : 'POST';

        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to save route');
            }

            await fetchRoutes();
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (route) => {
        setEditingRouteId(route._id);
        setFormData({
            name: route.name,
            from: route.from,
            to: route.to,
            distance_km: route.distance_km
        });
        setShowForm(true);
    };

    const handleDelete = async (routeId) => {
        if (!confirm('Are you sure you want to delete this route? This will fail if trips are using it.')) return;
        setError('');

        try {
            const res = await fetch(`/api/routes/${routeId}`, { method: 'DELETE' });
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to delete route');
            }

            await fetchRoutes();
        } catch (err) {
            setError(err.message);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', from: '', to: '', distance_km: '' });
        setEditingRouteId(null);
        setShowForm(false);
    };

    if (loading && routes.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MapPin className="text-blue-400" />
                        Routes Management
                    </h1>
                    <p className="text-slate-400 text-sm">Define nightly service paths and track statistics</p>
                </div>

                <button
                    onClick={() => {
                        if (showForm) resetForm();
                        else setShowForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium text-sm"
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    <span>{showForm ? 'Cancel' : 'Add Route'}</span>
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'manage' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Manage Routes ({routes.length})
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'analytics' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    Route Analytics & Usage
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Route creation/edit form */}
            {showForm && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl animate-fade-in-up">
                    <h3 className="text-lg font-bold text-white mb-4">
                        {editingRouteId ? 'Edit Route Details' : 'Add New Route Path'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Route Name / Identifier
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Bangalore - Chennai Nightly"
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Distance (in KM)
                                </label>
                                <input
                                    type="number"
                                    value={formData.distance_km}
                                    onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                                    required
                                    placeholder="e.g. 350"
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    From (Starting Point)
                                </label>
                                <input
                                    type="text"
                                    value={formData.from}
                                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                                    required
                                    placeholder="e.g. Bangalore"
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    To (Destination)
                                </label>
                                <input
                                    type="text"
                                    value={formData.to}
                                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                                    required
                                    placeholder="e.g. Chennai"
                                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
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
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                            >
                                {saving ? (
                                    <span>Saving...</span>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        <span>Save Route</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tab: Manage Routes */}
            {activeTab === 'manage' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {routes.map(route => (
                        <div
                            key={route._id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-white">{route.name}</h3>
                                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-2 py-0.5 rounded">
                                        {route.distance_km} KM
                                    </span>
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        <span>From: <strong className="text-white">{route.from}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                        <span>To: <strong className="text-white">{route.to}</strong></span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6 border-t border-slate-800/60 pt-4">
                                <button
                                    onClick={() => handleEdit(route)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                    title="Edit Route"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(route._id)}
                                    className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    title="Delete Route"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {routes.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                            <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                            No routes registered yet. Click "Add Route" to get started.
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Route Analytics */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Performance Table / List */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                        <div className="p-5 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">Route Revenue & Trip Performance</h3>
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">
                                        <th className="p-4 border-b border-slate-800 font-semibold">Route Path</th>
                                        <th className="p-4 border-b border-slate-800 text-center font-semibold">Total Trips</th>
                                        <th className="p-4 border-b border-slate-800 text-right font-semibold">Income</th>
                                        <th className="p-4 border-b border-slate-800 text-right font-semibold">Expenses</th>
                                        <th className="p-4 border-b border-slate-800 text-right font-semibold">Profit</th>
                                        <th className="p-4 border-b border-slate-800 text-center font-semibold">Avg. Seats Filled</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-sm text-slate-300 whitespace-nowrap">
                                    {routes.map(route => (
                                        <tr key={route._id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4 font-medium text-white">
                                                <div>{route.name}</div>
                                                <div className="text-xs text-slate-500">{route.from} &rarr; {route.to} ({route.distance_km} km)</div>
                                            </td>
                                            <td className="p-4 text-center font-bold text-slate-200">
                                                {route.tripCount}
                                            </td>
                                            <td className="p-4 text-right text-emerald-400 font-mono">
                                                ₹{(route.totalIncome || 0).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right text-red-400 font-mono">
                                                ₹{(route.totalExpenses || 0).toLocaleString()}
                                            </td>
                                            <td className={`p-4 text-right font-mono font-bold ${route.totalProfit >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                                                ₹{(route.totalProfit || 0).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Users size={14} className="text-slate-400" />
                                                    <span>{route.averageSeatsFilled || 0} passengers</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {routes.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-12 text-slate-600">
                                                No route performance data available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden divide-y divide-slate-800/60">
                            {routes.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 p-4">
                                    No route performance data available.
                                </div>
                            ) : (
                                routes.map(route => (
                                    <div key={route._id} className="p-4 space-y-3 hover:bg-slate-800/10 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-bold text-white text-sm">{route.name}</span>
                                                <span className="block text-xs text-slate-400 mt-1">
                                                    {route.from} &rarr; {route.to}
                                                </span>
                                            </div>
                                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded">
                                                {route.distance_km} KM
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/40 pt-2">
                                            <div>
                                                <span className="text-slate-500 font-medium">Total Trips: </span>
                                                <span className="text-slate-200 font-semibold">{route.tripCount}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 font-medium">Avg Seats: </span>
                                                <span className="text-slate-200 font-semibold">{route.averageSeatsFilled || 0}</span>
                                            </div>
                                        </div>

                                        {/* Financial Breakdown Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
                                            <div className="bg-slate-950 p-2 rounded border border-slate-800/60 text-center">
                                                <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Income</span>
                                                <span className="font-semibold font-mono text-emerald-400">₹{(route.totalIncome || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="bg-slate-950 p-2 rounded border border-slate-800/60 text-center">
                                                <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Expenses</span>
                                                <span className="font-semibold font-mono text-red-400">₹{(route.totalExpenses || 0).toLocaleString()}</span>
                                            </div>
                                            <div className="bg-slate-950 p-2 rounded border border-slate-800/60 text-center">
                                                <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Net Profit</span>
                                                <span className={`font-semibold font-mono ${route.totalProfit >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                                                    ₹{(route.totalProfit || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
