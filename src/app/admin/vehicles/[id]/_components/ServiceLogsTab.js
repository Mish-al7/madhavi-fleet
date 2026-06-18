'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, Wrench } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';

export default function ServiceLogsTab({ vehicleId }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [formData, setFormData] = useState(initialFormState());
    const [saving, setSaving] = useState(false);

    function initialFormState() {
        return {
            service_date: new Date().toISOString().split('T')[0],
            odometer_reading: '',
            service_category: 'Regular Service',
            description: '',
            parts_cost: '',
            labour_cost: '',
            service_provider: '',
            follow_up_required: false,
            follow_up_completed: false,
            follow_up_notes: '',
            next_service_date: ''
        };
    }

    useEffect(() => {
        fetchLogs(true);
    }, [vehicleId]);

    const fetchLogs = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            console.log('Fetching logs for vehicle:', vehicleId);
            // Add timestamp to prevent caching
            const res = await fetch(`/api/vehicles/${vehicleId}/service-logs?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            } else {
                console.error('Failed to fetch logs:', res.status);
            }
        } catch (error) {
            console.error('Error in fetchLogs:', error);
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    const handleAddClick = () => {
        setEditingLog(null);
        setFormData(initialFormState());
        setShowModal(true);
    };

    const handleEditClick = (log) => {
        setEditingLog(log);
        setFormData({
            service_date: log.service_date.split('T')[0],
            odometer_reading: log.odometer_reading,
            service_category: log.service_category,
            description: log.description || '',
            parts_cost: log.parts_cost || 0,
            labour_cost: log.labour_cost || 0,
            service_provider: log.service_provider || '',
            follow_up_required: log.follow_up_required || false,
            follow_up_completed: log.follow_up_completed || false,
            follow_up_notes: log.follow_up_notes || '',
            next_service_date: log.next_service_date ? log.next_service_date.split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleDeleteClick = async (logId) => {
        if (!confirm('Are you sure you want to delete this service log?')) return;
        try {
            const res = await fetch(`/api/vehicles/${vehicleId}/service-logs/${logId}`, { method: 'DELETE' });
            if (res.ok) fetchLogs(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleDone = async (log) => {
        console.log('Toggle done initiated for log:', log._id);
        try {
            const res = await fetch(`/api/vehicles/${vehicleId}/service-logs/${log._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ follow_up_completed: !log.follow_up_completed })
            });

            if (res.ok) {
                console.log('Successfully toggled done. Refreshing list silently...');
                await fetchLogs(false);
                alert('Service status updated successfully!');
            } else {
                const json = await res.json();
                console.error('API Error:', json);
                alert(json.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Network or JS Error:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingLog
                ? `/api/vehicles/${vehicleId}/service-logs/${editingLog._id}`
                : `/api/vehicles/${vehicleId}/service-logs`;

            const method = editingLog ? 'PUT' : 'POST';

            // Prepare payload with correct types
            const payload = {
                ...formData,
                odometer_reading: parseFloat(formData.odometer_reading), // Required
                parts_cost: parseFloat(formData.parts_cost) || 0,
                labour_cost: parseFloat(formData.labour_cost) || 0,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();

            if (res.ok) {
                setShowModal(false);
                fetchLogs(false);
            } else {
                alert(json.error || 'Failed to save');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const totalCost = (parseFloat(formData.parts_cost || 0) || 0) + (parseFloat(formData.labour_cost || 0) || 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <div>
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Wrench size={20} className="text-blue-400" />
                        Service History
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Maintenance records for this vehicle.</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus size={16} />
                    Add Service Log
                </button>
            </div>

            {/* List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-slate-200 uppercase tracking-wider font-semibold border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Odometer</th>
                                <th className="px-6 py-4">Provider</th>
                                <th className="px-6 py-4 text-right">Cost</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="p-6 text-center">Loading...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="6" className="p-6 text-center">No service logs found.</td></tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log._id} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4 text-white">
                                            {formatDate(log.service_date)}
                                            {log.follow_up_required && (
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${log.follow_up_completed
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                                        {log.follow_up_completed ? 'Service Done' : `Follow-up: ${log.next_service_date ? formatDate(log.next_service_date) : 'N/A'}`}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (!log.follow_up_completed) handleToggleDone(log);
                                                        }}
                                                        disabled={log.follow_up_completed}
                                                        className={`text-[10px] border px-2 py-0.5 rounded-md transition-colors ${log.follow_up_completed
                                                            ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-default'
                                                            : 'bg-blue-600/20 text-blue-400 border-blue-500/20 hover:bg-blue-600/40 cursor-pointer'}`}
                                                    >
                                                        {log.follow_up_completed ? 'Done' : 'Mark Done'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-200 block">{log.service_category}</span>
                                            <span className="text-xs text-slate-500 truncate max-w-[200px] block">{log.description}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono">{log.odometer_reading.toLocaleString()} km</td>
                                        <td className="px-6 py-4">{log.service_provider || '-'}</td>
                                        <td className="px-6 py-4 text-right font-medium text-emerald-400">
                                            ₹{log.total_cost.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditClick(log)} className="p-1 hover:text-blue-400"><Pencil size={16} /></button>
                                                <button onClick={() => handleDeleteClick(log._id)} className="p-1 hover:text-red-400"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-800/60">
                    {loading ? (
                        <div className="p-6 text-center text-slate-500">Loading...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">No service logs found.</div>
                    ) : (
                        logs.map(log => (
                            <div key={log._id} className="p-4 space-y-3 hover:bg-slate-800/10 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs text-slate-400 font-mono">{formatDate(log.service_date)}</span>
                                        <span className="block text-sm font-semibold text-white mt-1">{log.service_category}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Cost</span>
                                        <span className="text-sm font-bold text-emerald-400 font-mono">₹{log.total_cost.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between text-slate-300">
                                        <span>
                                            <span className="text-slate-500">Odometer: </span>
                                            <span className="font-mono text-white">{log.odometer_reading.toLocaleString()} km</span>
                                        </span>
                                        <span>
                                            <span className="text-slate-500">Provider: </span>
                                            <span className="text-white">{log.service_provider || '-'}</span>
                                        </span>
                                    </div>
                                    {log.description && (
                                        <p className="text-slate-400 italic mt-1">&quot;{log.description}&quot;</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                                    <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                                        <span className="text-slate-500 block">Parts Cost</span>
                                        <span className="font-semibold text-slate-300 font-mono">₹{(log.parts_cost || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                                        <span className="text-slate-500 block">Labour Cost</span>
                                        <span className="font-semibold text-slate-300 font-mono">₹{(log.labour_cost || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                {log.follow_up_required && (
                                    <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${log.follow_up_completed
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                            {log.follow_up_completed ? 'Service Done' : `Follow-up: ${log.next_service_date ? formatDate(log.next_service_date) : 'N/A'}`}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!log.follow_up_completed) handleToggleDone(log);
                                            }}
                                            disabled={log.follow_up_completed}
                                            className={`text-[10px] border px-2 py-1 rounded-md font-semibold transition-colors ${log.follow_up_completed
                                                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-default'
                                                : 'bg-blue-600/20 text-blue-400 border-blue-500/20 hover:bg-blue-600/40 cursor-pointer'}`}
                                        >
                                            {log.follow_up_completed ? 'Done' : 'Mark Done'}
                                        </button>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800/50">
                                    <button
                                        onClick={() => handleEditClick(log)}
                                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="Edit Log"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(log._id)}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete Log"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingLog ? 'Edit Service Log' : 'New Service Log'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Service Date</label>
                                    <input type="date" required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                                        value={formData.service_date}
                                        onChange={e => setFormData({ ...formData, service_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Odometer Reading</label>
                                    <input type="number" required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                                        value={formData.odometer_reading}
                                        onChange={e => setFormData({ ...formData, odometer_reading: e.target.value })}
                                        onWheel={e => e.target.blur()}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Category</label>
                                    <select className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                                        value={formData.service_category}
                                        onChange={e => setFormData({ ...formData, service_category: e.target.value })}
                                    >
                                        <option>Regular Service</option>
                                        <option>Oil Change</option>
                                        <option>Tyre Change</option>
                                        <option>Repair</option>
                                        <option>Inspection</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">provider</label>
                                    <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                                        value={formData.service_provider}
                                        onChange={e => setFormData({ ...formData, service_provider: e.target.value })}
                                        placeholder="e.g. Authorized Center"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-400 mb-1">Description</label>
                                <textarea className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Details of work done..."
                                ></textarea>
                            </div>

                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <h4 className="text-sm font-semibold text-emerald-400 mb-3">Cost Breakdown</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Parts Cost</label>
                                        <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                                            value={formData.parts_cost}
                                            onChange={e => setFormData({ ...formData, parts_cost: e.target.value })}
                                            onWheel={e => e.target.blur()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Labour Cost</label>
                                        <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                                            value={formData.labour_cost}
                                            onChange={e => setFormData({ ...formData, labour_cost: e.target.value })}
                                            onWheel={e => e.target.blur()}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Total Cost</label>
                                        <div className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-emerald-400 font-bold">
                                            ₹{totalCost.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600"
                                        checked={formData.follow_up_required}
                                        onChange={e => setFormData({ ...formData, follow_up_required: e.target.checked })}
                                    />
                                    <span className="text-sm text-white">Follow-up Required</span>
                                </label>
                            </div>

                            {formData.follow_up_required && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Follow-up Notes</label>
                                        <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                                            value={formData.follow_up_notes}
                                            onChange={e => setFormData({ ...formData, follow_up_notes: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Next Service Date</label>
                                        <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                                            value={formData.next_service_date}
                                            onChange={e => setFormData({ ...formData, next_service_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                    {saving ? 'Saving...' : 'Save Log'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
