'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Trash2, Save, X, Truck, Wrench, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import ServiceLogsTab from './_components/ServiceLogsTab';
import { formatDate } from '@/lib/dateUtils';

export default function VehicleDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('logs'); // Default to logs as requested feature focus? Or ledger? Let's default to ledger usually but for dev testing logs.
    // Spec says: "Tabs: Ledger, Trips, Service Logs".
    // Let's make "Ledger" default.

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVehicle();
        setActiveTab('ledger');
    }, [id]);

    const fetchVehicle = async () => {
        try {
            const res = await fetch(`/api/vehicles/${id}`);
            if (res.ok) {
                const data = await res.json();
                setVehicle(data);
                setEditData({
                    vehicle_no: data.vehicle_no,
                    status: data.status,
                    nickname: data.nickname || '',
                    vehicle_name: data.vehicle_name || '',
                    seats: data.seats || '',
                    ac_type: data.ac_type || 'Non-AC',
                    bus_type: data.bus_type || 'Service Bus'
                });
            } else {
                setError('Vehicle not found');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch(`/api/vehicles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });

            const json = await res.json();
            if (res.ok) {
                setVehicle(json);
                setIsEditing(false);
            } else {
                setError(json.error || 'Update failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this vehicle? This check will fail if trips or logs exist.')) return;

        try {
            const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
            const json = await res.json();

            if (res.ok) {
                router.push('/admin/vehicles');
            } else {
                alert(json.error); // Show the blocking reason
            }
        } catch (err) {
            alert('Delete failed');
        }
    };

    if (loading) return <div className="p-6 text-slate-500">Loading...</div>;
    if (!vehicle) return <div className="p-6 text-white">Vehicle not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/vehicles" className="text-slate-400 hover:text-white">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        {isEditing ? (
                            <div className="flex flex-col gap-3 bg-slate-900/50 p-4 border border-slate-800 rounded-xl mt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase">Vehicle Number</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={editData.vehicle_no}
                                            onChange={e => setEditData({ ...editData, vehicle_no: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase">Vehicle Name</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Vehicle Name"
                                            value={editData.vehicle_name}
                                            onChange={e => setEditData({ ...editData, vehicle_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase">Seat Capacity</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Capacity"
                                            value={editData.seats}
                                            onChange={e => setEditData({ ...editData, seats: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase">AC Status</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={editData.ac_type}
                                            onChange={e => setEditData({ ...editData, ac_type: e.target.value })}
                                        >
                                            <option value="Non-AC">Non-AC</option>
                                            <option value="AC">AC</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase">Bus Type</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={editData.bus_type}
                                            onChange={e => setEditData({ ...editData, bus_type: e.target.value })}
                                        >
                                            <option value="Service Bus">Service Bus</option>
                                            <option value="Tour Bus">Tour Bus</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase">Nickname (Optional)</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Nickname"
                                            value={editData.nickname || ''}
                                            onChange={e => setEditData({ ...editData, nickname: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase">Status</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            value={editData.status}
                                            onChange={e => setEditData({ ...editData, status: e.target.value })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-bold text-white uppercase">{vehicle.vehicle_no}</h1>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${vehicle.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {vehicle.status}
                                    </span>
                                </div>
                                {vehicle.vehicle_name && (
                                    <p className="text-slate-200 text-lg font-semibold">{vehicle.vehicle_name}</p>
                                )}
                                {vehicle.nickname && (
                                    <p className="text-slate-400 text-sm italic">Nickname: {vehicle.nickname}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {vehicle.seats ? (
                                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-3 py-1 rounded-lg">
                                            {vehicle.seats} Seats
                                        </span>
                                    ) : null}
                                    {vehicle.ac_type ? (
                                        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold px-3 py-1 rounded-lg">
                                            {vehicle.ac_type}
                                        </span>
                                    ) : null}
                                    {vehicle.bus_type ? (
                                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-3 py-1 rounded-lg">
                                            {vehicle.bus_type}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        )}
                        <p className="text-slate-400 text-sm">Created {formatDate(vehicle.createdAt)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-white"><X size={20} /></button>
                            <button onClick={handleUpdate} disabled={saving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium">
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                <Edit2 size={18} />
                                Edit
                            </button>
                            <button onClick={handleDelete} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg font-medium transition-colors border border-red-500/20">
                                <Trash2 size={18} />
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">{error}</div>}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('ledger')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'ledger' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2">
                        <BarChart3 size={18} />
                        Ledger
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'logs' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2">
                        <Wrench size={18} />
                        Service Logs
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'ledger' && (
                    <div className="text-center py-12">
                        <p className="text-slate-500 mb-4">View Operational Ledger for this vehicle.</p>
                        <Link href={`/admin/ledger/${id}`} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-colors">
                            Go to Vehicle Ledger
                        </Link>
                    </div>
                )}

                {activeTab === 'logs' && <ServiceLogsTab vehicleId={id} />}
            </div>
        </div>
    );
}
