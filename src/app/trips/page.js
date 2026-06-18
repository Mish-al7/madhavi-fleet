'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/app/components/Navbar';
import EditTripModal from '@/app/components/EditTripModal';
import { Truck, MapPin, FileText, PlusCircle, Edit } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import Link from 'next/link';
import NotificationBell from '@/components/ui/NotificationBell';

export default function MyTripsPage() {
    const { data: session } = useSession();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingTrip, setEditingTrip] = useState(null);
    const [quickPaymentDates, setQuickPaymentDates] = useState({});
    const [recordingPayment, setRecordingPayment] = useState({});

    const handleRecordPayment = async (tripId, customDate) => {
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
                await fetchMyTrips();
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

    useEffect(() => {
        if (session) {
            fetchMyTrips();
        }
    }, [session]);

    async function fetchMyTrips() {
        setLoading(true);
        try {
            const res = await fetch('/api/trips/my');
            const json = await res.json();
            if (json.success) {
                setTrips(json.data);
            } else {
                setError(json.error || 'Failed to load trips');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handleUpdate = (updatedTrip) => {
        setTrips(trips.map(t => t._id === updatedTrip._id
            ? { ...t, ...updatedTrip, vehicle_id: t.vehicle_id }
            : t));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
            <div className="bg-slate-900 pt-8 pb-4 px-6 shadow-lg border-b border-slate-800">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                        Recent Trips
                    </h1>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <Link
                            href="/trips/new"
                            className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-md transition-colors"
                        >
                            <PlusCircle size={16} /> New Trip
                        </Link>
                    </div>
                </div>
                <p className="text-slate-400 text-sm">Your recently logged journeys.</p>
            </div>

            <main className="max-w-md mx-auto px-6 py-6 animate-fade-in-up">
                {error && (
                    <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-slate-400">Loading trips...</div>
                ) : trips.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText size={48} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500 mb-4">No trips found</p>
                        <Link
                            href="/trips/new"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
                        >
                            <PlusCircle size={18} /> Add Your First Trip
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trips.map(trip => (
                            <div key={trip._id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-white font-medium">
                                        <Truck size={16} className="text-emerald-400" />
                                        <span>{trip.vehicle_id?.vehicle_no || 'Unknown Vehicle'}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="text-xs text-slate-400">
                                            {formatDate(trip.trip_date)}
                                        </div>
                                        {trip.payment_status === 'pay_later' ? (
                                            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">Pay Later</span>
                                        ) : (
                                            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Received</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 text-sm text-slate-300">
                                    <MapPin size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{trip.trip_route}</span>
                                </div>

                                <div className="pt-3 border-t border-slate-800/50 flex justify-between items-center">
                                    <div className="text-sm">
                                        <span className="text-slate-500">Income: </span>
                                        <span className={`font-medium ${trip.payment_status === 'pay_later' ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                                            ₹{trip.income?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setEditingTrip(trip)}
                                        className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Edit size={14} /> Edit
                                    </button>
                                </div>

                                {trip.payment_status === 'pay_later' && (
                                    <div className="pt-3 border-t border-slate-800/30 space-y-2">
                                        <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Record Payment</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={quickPaymentDates[trip._id] || new Date().toISOString().split('T')[0]}
                                                onChange={(e) => setQuickPaymentDates(prev => ({ ...prev, [trip._id]: e.target.value }))}
                                                className="bg-slate-950 border border-slate-850 text-white rounded-lg px-2 py-1 text-xs focus:outline-none flex-1 max-w-[130px] h-8"
                                            />
                                            <button
                                                onClick={() => handleRecordPayment(trip._id, quickPaymentDates[trip._id] || new Date().toISOString().split('T')[0])}
                                                disabled={recordingPayment[trip._id]}
                                                className="px-3 py-1 h-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors flex-1 shadow-lg shadow-emerald-500/20"
                                            >
                                                {recordingPayment[trip._id] ? 'Saving...' : 'Mark Paid'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {editingTrip && (
                <EditTripModal
                    trip={editingTrip}
                    onClose={() => setEditingTrip(null)}
                    onUpdate={handleUpdate}
                />
            )}

            <Navbar />
        </div>
    );
}
