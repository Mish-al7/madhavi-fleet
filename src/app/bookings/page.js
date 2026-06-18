'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/app/components/Navbar';
import BookingCalendar from '@/app/components/BookingCalendar';
import { Calendar as CalendarIcon, MapPin, Clock, Car, FileText, Eye, ChevronDown, Plus } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import { useRouter, useSearchParams } from 'next/navigation';
import NotificationBell from '@/components/ui/NotificationBell';

// Status Badge Component
const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    const labels = {
        pending: '🟡 Pending',
        approved: '🟢 Approved',
        rejected: '🔴 Rejected',
    };

    return (
        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

// Booking Card Component
const BookingCard = ({ booking, onViewDetails, activeTab, session }) => {
    let borderColor = 'border-slate-800'; // default

    // booking.created_by could be an object if populated, or a string ID
    const creatorId = booking.created_by?._id || booking.created_by;

    const userId = session?.user?.id;
    const isMine = creatorId === userId;
    
    // Defensive check for driver_id as string or populated object
    const bookingDriverId = booking.driver_id?._id || booking.driver_id;
    const isAssignedToMe = userId && bookingDriverId && bookingDriverId.toString() === userId.toString();

    if (isMine) {
        borderColor = 'border-emerald-500/50'; // Green = my booking
    } else if (isAssignedToMe) {
        borderColor = 'border-purple-500/50'; // Purple = assigned to me
    } else if (booking.created_by?.role === 'admin') {
        borderColor = 'border-blue-500/50'; // Blue = admin booking
    } else {
        borderColor = 'border-slate-500/50'; // Gray = other driver
    }

    const isOverview = activeTab === 'overview';

    return (
        <div className={`bg-slate-900/50 border ${borderColor} rounded-xl p-4 space-y-3`}>
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-sm font-medium text-white">{booking.booking_no}</div>
                    {booking.package_name && (
                        <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-0.5">
                            {booking.package_name}
                        </div>
                    )}
                    <div className="text-xs text-slate-500">{formatDate(booking.booking_date)}</div>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            {isAssignedToMe && !isMine && (
                <div className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] text-purple-400 font-bold uppercase tracking-widest inline-block">
                    Assigned Trip
                </div>
            )}

            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                    <Car size={14} />
                    <span>{booking.vehicle_no}</span>
                </div>
                {!isOverview && (
                    <div className="flex items-center gap-2 text-slate-400">
                        <MapPin size={14} />
                        <span className="truncate">{booking.pickup_location} → {booking.trip_destination}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-slate-400">
                    <CalendarIcon size={14} />
                    <span>
                        {formatDate(booking.journey_start_date)} - {formatDate(booking.journey_return_date)}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} />
                    <span>{booking.trip_start_time} - {booking.trip_end_time}</span>
                </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                {!isOverview ? (
                    <div className="text-xs text-slate-500">
                        Customer: <span className="text-slate-300">{booking.customer_name}</span>
                    </div>
                ) : (
                    <div className="text-xs text-slate-500">
                        Created By: <span className="text-slate-300">{booking.created_by?.name || 'Unknown'}</span>
                    </div>
                )}

                {( !isOverview || isAssignedToMe) && (
                    <button
                        onClick={() => onViewDetails(booking)}
                        className="text-blue-400 text-xs font-medium hover:text-blue-300 flex items-center gap-1"
                    >
                        <Eye size={14} /> View
                    </button>
                )}
            </div>
        </div>
    );
};

// Detail Modal Component
const BookingDetailModal = ({ booking, onClose, onRefresh }) => {
    const router = useRouter();
    const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
    const [recording, setRecording] = useState(false);
    const [recordError, setRecordError] = useState('');

    if (!booking) return null;

    const handleRecordPayment = async () => {
        setRecording(true);
        setRecordError('');
        try {
            const res = await fetch(`/api/bookings/${booking._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_status: 'received',
                    payment_date: recordDate,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Failed to update payment');
            }
            if (onRefresh) onRefresh();
            onClose();
        } catch (err) {
            setRecordError(err.message);
        } finally {
            setRecording(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Booking Details</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-white">{booking.booking_no}</span>
                        <StatusBadge status={booking.status} />
                    </div>

                    {booking.package_name && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Package</div>
                            <div className="text-sm text-white font-medium">{booking.package_name}</div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-slate-500">Vehicle</div>
                            <div className="text-white font-medium">{booking.vehicle_no}</div>
                        </div>
                        <div>
                            <div className="text-slate-500">Vehicle Type</div>
                            <div className="text-white">{booking.vehicle_type || '-'}</div>
                        </div>
                    </div>

                    {booking.itinerary?.some(item => (item.location?.trim() || item.remarks?.trim())) && (
                        <div className="border-t border-slate-800 pt-4">
                            <h3 className="text-sm font-medium text-purple-400 mb-2">Itinerary</h3>
                            <div className="space-y-3">
                                {booking.itinerary.map((row, idx) => (
                                    <div key={idx} className="flex gap-3 text-xs border-l-2 border-slate-800 pl-3">
                                        <div className="shrink-0 w-12 font-medium text-slate-400">{row.time}</div>
                                        <div className="flex-1">
                                            <div className="text-white font-medium">{row.day}: {row.location || '-'}</div>
                                            {row.remarks && <div className="text-slate-500 italic mt-0.5">{row.remarks}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-slate-800 pt-4">
                        <h3 className="text-sm font-medium text-emerald-400 mb-2">Customer</h3>
                        <div className="space-y-1 text-sm">
                            <div><span className="text-slate-500">Name:</span> <span className="text-white">{booking.customer_name}</span></div>
                            <div><span className="text-slate-500">Phone:</span> <span className="text-white">{booking.customer_phone}</span></div>
                            <div><span className="text-slate-500">Address:</span> <span className="text-white">{booking.customer_address || '-'}</span></div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                        <h3 className="text-sm font-medium text-purple-400 mb-2">Trip Summary</h3>
                        <div className="space-y-1 text-sm">
                            <div><span className="text-slate-500">Pickup:</span> <span className="text-white">{booking.pickup_location || '-'}</span></div>
                            <div><span className="text-slate-500">Destination:</span> <span className="text-white">{booking.trip_destination || '-'}</span></div>
                            <div><span className="text-slate-500">Persons:</span> <span className="text-white">{booking.total_persons}</span></div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                        <h3 className="text-sm font-medium text-amber-400 mb-2">Schedule</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-slate-500">Start:</span> <span className="text-white">{formatDate(booking.journey_start_date)}</span></div>
                            <div><span className="text-slate-500">Return:</span> <span className="text-white">{formatDate(booking.journey_return_date)}</span></div>
                            <div><span className="text-slate-500">Time:</span> <span className="text-white">{booking.trip_start_time} - {booking.trip_end_time}</span></div>
                            <div><span className="text-slate-500">Days:</span> <span className="text-white">{booking.total_days}</span></div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                        <h3 className="text-sm font-medium text-green-400 mb-2">Financials</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-slate-500">Advance:</span> <span className="text-white">₹ {booking.advance_amount || 0}</span></div>
                            <div><span className="text-slate-500">Total:</span> <span className="text-white font-bold">₹ {booking.total_amount || 0}</span></div>
                            <div><span className="text-slate-500">Payment Status:</span> <span className={`font-semibold ${booking.payment_status === 'pay_later' ? 'text-amber-400' : 'text-emerald-400'}`}>{booking.payment_status === 'pay_later' ? 'Pay Later' : 'Received'}</span></div>
                            {booking.payment_status === 'received' && (
                                <div><span className="text-slate-500">Payment Date:</span> <span className="text-white">{formatDate(booking.payment_date || booking.createdAt)}</span></div>
                            )}
                        </div>

                        {booking.payment_status === 'pay_later' && (
                            <div className="mt-4 p-3 bg-slate-800/40 border border-slate-700 rounded-xl space-y-3">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Record Payment</div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="date"
                                        value={recordDate}
                                        onChange={(e) => setRecordDate(e.target.value)}
                                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleRecordPayment}
                                        disabled={recording}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-medium transition-all"
                                    >
                                        {recording ? 'Saving...' : 'Mark Paid'}
                                    </button>
                                </div>
                                {recordError && <div className="text-xs text-red-400 mt-1">{recordError}</div>}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-slate-800">
                        {booking.status === 'approved' && (
                            <>
                                {new Date().setHours(0,0,0,0) >= new Date(booking.journey_return_date).setHours(0,0,0,0) ? (
                                    <button
                                        onClick={() => {
                                            const params = new URLSearchParams({
                                                bookingId: booking._id,
                                                vehicleId: booking.vehicle_id?._id || booking.vehicle_id,
                                                tripDate: booking.journey_start_date,
                                                tripRoute: `${booking.pickup_location || ''} → ${booking.trip_destination || ''}`
                                            });
                                            router.push(`/trips/new?${params.toString()}`);
                                        }}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Plus size={20} />
                                        Create Trip
                                    </button>
                                ) : (
                                    <div className="flex-1 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-500 text-sm font-medium flex items-center justify-center gap-2 border-dashed">
                                        <CalendarIcon size={16} /> Available from {new Date(booking.journey_return_date).toLocaleDateString()}
                                    </div>
                                )}
                            </>
                        )}
                        {booking.status === 'completed' && (
                            <button
                                onClick={() => {
                                    router.push(`/trips`); // Driver sees their trips here
                                }}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <Eye size={20} />
                                View Trip
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

function BookingsContent() {
    const { data: session } = useSession();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [activeTab, setActiveTab] = useState('my'); // 'my' | 'overview'
    const searchParams = useSearchParams();

    useEffect(() => {
        const bookingId = searchParams.get('booking_id');
        if (bookingId && bookings.length > 0) {
            const booking = bookings.find(b => b._id === bookingId);
            if (booking) {
                setSelectedBooking(booking);
            }
        }
    }, [searchParams, bookings]);

    useEffect(() => {
        if (session) {
            fetchBookings();
        }
    }, [statusFilter, sortField, sortOrder, activeTab, session]);

    async function fetchBookings() {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            params.append('sortField', sortField);
            params.append('sortOrder', sortOrder);

            const endpoint = activeTab === 'my' ? '/api/bookings/my' : '/api/bookings/overview';
            const url = `${endpoint}?${params.toString()}`;

            const res = await fetch(url);
            const json = await res.json();

            if (json.success) {
                setBookings(json.data);
            } else {
                setError(json.error || 'Failed to fetch bookings');
            }
        } catch (err) {
            setError('Failed to load bookings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredBookings = bookings;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
            {/* Header */}
            <div className="bg-slate-900 pt-8 pb-4 px-6 shadow-lg border-b border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                        Bookings
                    </h1>
                    <NotificationBell />
                </div>

                {/* Tabs */}
                <div className="flex space-x-4">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my'
                            ? 'border-emerald-500 text-emerald-400'
                            : 'border-transparent text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        My Bookings
                    </button>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                            ? 'border-emerald-500 text-emerald-400'
                            : 'border-transparent text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        All Bookings
                    </button>
                </div>
            </div>

            <main className="max-w-lg mx-auto px-6 py-6">
                {/* View API & Status Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-start sm:items-center">
                    {/* Status Filter Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                        {['all', 'pending', 'approved', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${statusFilter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle */}
                    <div className="bg-slate-800 p-1 rounded-lg flex items-center shrink-0">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list'
                                ? 'bg-slate-700 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <FileText size={16} /> List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'calendar'
                                ? 'bg-slate-700 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <CalendarIcon size={16} /> Calendar
                        </button>
                    </div>
                </div>

                {/* Sort Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Sort Field */}
                    <div className="relative flex-1">
                        <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="createdAt">Sort by: Created Date</option>
                            <option value="journey_start_date">Sort by: Journey Date</option>
                            <option value="total_amount">Sort by: Total Amount</option>
                            <option value="status">Sort by: Status</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Sort Order */}
                    <div className="relative flex-1">
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center text-slate-400 py-12">Loading bookings...</div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText size={48} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500">No bookings found</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <div className="space-y-4">
                                {filteredBookings.map(booking => (
                                    <BookingCard
                                        key={booking._id}
                                        booking={booking}
                                        onViewDetails={setSelectedBooking}
                                        activeTab={activeTab}
                                        session={session}
                                    />
                                ))}
                            </div>
                        ) : (
                            <BookingCalendar
                                bookings={filteredBookings}
                                onBookingClick={(booking) => {
                                    const isAssignedToMe = booking.driver_id === session?.user?.id || booking.driver_id?._id === session?.user?.id;
                                    if (activeTab !== 'overview' || isAssignedToMe) {
                                        setSelectedBooking(booking);
                                    }
                                }}
                                showFullVehicleNo={true}
                            />
                        )}
                    </>
                )}
            </main>

            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onRefresh={fetchBookings}
                />
            )}

            <Navbar />
        </div>
    );
}

export default function MyBookingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Loading bookings...</div>
            </div>
        }>
            <BookingsContent />
        </Suspense>
    );
}
