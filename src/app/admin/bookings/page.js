'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Calendar as CalendarIcon, MapPin, Clock, Car, FileText, Eye, Check, X, Filter, ChevronDown, Trash2, Edit, Plus, Download, Truck, Phone } from 'lucide-react';
import BookingEditModal from './BookingEditModal';
import BookingCreateModal from './BookingCreateModal';
import BookingCalendar from '@/app/components/BookingCalendar';
import { formatDate } from '@/lib/dateUtils';
import DateInput from '@/components/ui/DateInput';

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
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium border whitespace-nowrap ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

// Booking Detail Modal
const BookingDetailModal = ({ booking, onClose, onApprove, onReject, actionLoading, onDownloadPDF, downloadLoading, onRefresh }) => {
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
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Booking Details</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-white">{booking.booking_no}</span>
                        <StatusBadge status={booking.status} />
                    </div>

                    {booking.package_name && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
                            <Car className="text-blue-400" size={20} />
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Package Name</div>
                                <div className="text-white font-medium">{booking.package_name}</div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        {/* Vehicle */}
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <h3 className="text-sm font-medium text-blue-400 mb-3">Vehicle</h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-slate-500">Number:</span> <span className="text-white font-medium">{booking.vehicle_no}</span></div>
                                <div><span className="text-slate-500">Type:</span> <span className="text-white">{booking.vehicle_type || '-'}</span></div>
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="bg-slate-800/50 rounded-xl p-4">
                            <h3 className="text-sm font-medium text-emerald-400 mb-3">Customer</h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-slate-500">Name:</span> <span className="text-white">{booking.customer_name}</span></div>
                                <div><span className="text-slate-500">Phone:</span> <span className="text-white">{booking.customer_phone}</span></div>
                                <div><span className="text-slate-500">Address:</span> <span className="text-white">{booking.customer_address || '-'}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Itinerary */}
                    {booking.itinerary?.some(item => (item.location?.trim() || item.remarks?.trim())) && (
                        <div className="bg-slate-800/50 rounded-xl p-4 overflow-hidden">
                            <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                                <MapPin size={16} /> Extended Itinerary
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="pb-2 font-semibold text-slate-500 w-16">Day</th>
                                            <th className="pb-2 font-semibold text-slate-500 w-16">Time</th>
                                            <th className="pb-2 font-semibold text-slate-500">Location</th>
                                            <th className="pb-2 font-semibold text-slate-500">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {booking.itinerary.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="py-2 pr-2 text-white">{row.day}</td>
                                                <td className="py-2 pr-2 text-slate-300">{row.time}</td>
                                                <td className="py-2 pr-2 text-white">{row.location || '-'}</td>
                                                <td className="py-2 text-slate-400 italic">{row.remarks || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Trip (Fallback/Summary) */}
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-purple-400 mb-3">Trip Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-slate-500">Pickup:</span> <span className="text-white">{booking.pickup_location || '-'}</span></div>
                            <div><span className="text-slate-500">Destination:</span> <span className="text-white">{booking.trip_destination || '-'}</span></div>
                            <div><span className="text-slate-500">Persons:</span> <span className="text-white">{booking.total_persons}</span></div>
                            <div><span className="text-slate-500">Night Halts:</span> <span className="text-white">{booking.night_halt_places || '-'}</span></div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-amber-400 mb-3">Schedule</h3>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <div><span className="text-slate-500">Start Date:</span><br /><span className="text-white">{formatDate(booking.journey_start_date)}</span></div>
                            <div><span className="text-slate-500">Return Date:</span><br /><span className="text-white">{formatDate(booking.journey_return_date)}</span></div>
                            <div><span className="text-slate-500">Time:</span><br /><span className="text-white">{booking.trip_start_time} - {booking.trip_end_time}</span></div>
                            <div><span className="text-slate-500">Days / KM:</span><br /><span className="text-white">{booking.total_days} days / {booking.total_kilometers || 0} km</span></div>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-green-400 mb-3">Financials</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-slate-500">Advance:</span> <span className="text-white">₹ {booking.advance_amount || 0}</span></div>
                            <div><span className="text-slate-500">Total Amount:</span> <span className="text-white font-bold text-lg">₹ {booking.total_amount || 0}</span></div>
                            <div><span className="text-slate-500">Other Expenses:</span> <span className="text-white">{booking.other_expenses || '-'}</span></div>
                            <div><span className="text-slate-500">Driver F&A:</span> <span className="text-white">{booking.driver_food_accommodation || '-'}</span></div>
                            <div><span className="text-slate-500">Payment Status:</span> <span className={`font-semibold ${booking.payment_status === 'pay_later' ? 'text-amber-400' : 'text-emerald-400'}`}>{booking.payment_status === 'pay_later' ? 'Pay Later' : 'Received'}</span></div>
                            {booking.payment_status === 'received' && (
                                <div><span className="text-slate-500">Payment Date:</span> <span className="text-white">{formatDate(booking.payment_date || booking.createdAt)}</span></div>
                            )}
                        </div>

                        {booking.payment_status === 'pay_later' && (
                            <div className="mt-4 p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-3">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Record Payment</div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="date"
                                        value={recordDate}
                                        onChange={(e) => setRecordDate(e.target.value)}
                                        className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        {booking.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => onApprove(booking._id)}
                                    disabled={actionLoading}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    <Check size={20} />
                                    Approve
                                </button>
                                <button
                                    onClick={() => onReject(booking._id)}
                                    disabled={actionLoading}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    <X size={20} />
                                    Reject
                                </button>
                            </>
                        )}
                        {booking.status === 'completed' && (
                            <button
                                onClick={() => {
                                    router.push(`/admin/ledger/${booking.vehicle_id?._id || booking.vehicle_id}`);
                                }}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <Eye size={20} />
                                View Trip
                            </button>
                        )}
                    </div>

                    {/* Created By */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-xs text-slate-500">
                            Created by: {booking.created_by?.name || 'Unknown'} on {new Date(booking.createdAt).toLocaleString()}
                        </div>
                        <button
                            onClick={() => onDownloadPDF(booking)}
                            disabled={downloadLoading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-all disabled:opacity-50"
                        >
                            <Download size={14} />
                            {downloadLoading ? 'Generating...' : 'Download PDF'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

function AdminBookingsContent() {
    const [bookings, setBookings] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [editingBooking, setEditingBooking] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [vehicleFilter, setVehicleFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Use query params to auto-open notifications
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const autoOpenBookingId = searchParams.get('booking_id');

    useEffect(() => {
        fetchBookings();
        fetchVehicles();
    }, [statusFilter, vehicleFilter, dateFrom, dateTo, sortField, sortOrder, page]);

    // Effect to handle auto-opening a booking from URL
    useEffect(() => {
        if (autoOpenBookingId && bookings.length > 0 && !selectedBooking) {
            const bookingToOpen = bookings.find(b => b._id === autoOpenBookingId);
            if (bookingToOpen) {
                setSelectedBooking(bookingToOpen);
                // Clear the query parameter so closing the modal doesn't re-trigger this
                router.replace(pathname, { scroll: false });
            } else {
                fetch(`/api/bookings?vehicle_id=&status=all&limit=100`)
                    .then(res => res.json())
                    .then(json => {
                        if (json.success) {
                            const found = json.data.find(b => b._id === autoOpenBookingId)
                            if (found) {
                                setSelectedBooking(found);
                                router.replace(pathname, { scroll: false });
                            }
                        }
                    }).catch(console.error);
            }
        }
    }, [autoOpenBookingId, bookings, selectedBooking, pathname, router]);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (page !== 1) setPage(1);
    }, [statusFilter, vehicleFilter, dateFrom, dateTo, sortField, sortOrder]);

    async function fetchVehicles() {
        try {
            const res = await fetch('/api/vehicles');
            const json = await res.json();
            if (json.success) {
                setVehicles(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch vehicles', err);
        }
    }

    async function fetchBookings() {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (vehicleFilter) params.append('vehicle_id', vehicleFilter);
            if (dateFrom) params.append('start_date', dateFrom);
            if (dateTo) params.append('end_date', dateTo);
            params.append('sortField', sortField);
            params.append('sortOrder', sortOrder);
            params.append('page', page);
            params.append('limit', 15);

            const res = await fetch(`/api/bookings?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setBookings(json.data);
                if (json.pagination) {
                    setPagination(json.pagination);
                }
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

    async function handleStatusChange(bookingId, newStatus) {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to update status');
            }

            // Refresh bookings
            fetchBookings();
            setSelectedBooking(null);
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDelete(bookingId) {
        if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/bookings/${bookingId}`, {
                method: 'DELETE',
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to delete booking');
            }

            fetchBookings();
        } catch (err) {
            alert(err.message);
        }
    }

    async function handleUpdate(bookingId, updatedData) {
        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.error || 'Failed to update booking');
        }

        setEditingBooking(null);
        fetchBookings();
    }

    async function handleDownloadPDF(booking) {
        setDownloadLoading(true);
        try {
            const res = await fetch(`/api/bookings/${booking._id}/pdf`);
            if (!res.ok) throw new Error('Failed to generate PDF');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Booking_${booking.booking_no}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            alert('Error downloading PDF: ' + err.message);
        } finally {
            setDownloadLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-white">Bookings</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage vehicle reservations</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                    <Plus size={18} />
                    <span>Add Booking</span>
                </button>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <Filter size={16} />
                    <span className="text-sm font-medium">Filters</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {/* Status */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Vehicle */}
                    <div className="relative">
                        <select
                            value={vehicleFilter}
                            onChange={(e) => setVehicleFilter(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Vehicles</option>
                            {vehicles.map(v => (
                                <option key={v._id} value={v._id}>{v.vehicle_no}{v.nickname ? ` - ${v.nickname}` : ''}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Date From */}
                    <DateInput
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        placeholder="From Date"
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Date To */}
                    <DateInput
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        placeholder="To Date"
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Sort Field */}
                    <div className="relative">
                        <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="createdAt">Created Date</option>
                            <option value="journey_start_date">Journey Date</option>
                            <option value="total_amount">Total Amount</option>
                            <option value="status">Status</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    {/* Sort Order */}
                    <div className="relative">
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Bookings Content */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">
                        {viewMode === 'list' ? 'Booking List' : 'Calendar View'}
                    </h2>
                    <div className="bg-slate-800 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list'
                                ? 'bg-slate-700 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <FileText size={16} /> List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'calendar'
                                ? 'bg-slate-700 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <CalendarIcon size={16} /> Calendar
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading bookings...</div>
                ) : bookings.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText size={48} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500">No bookings found</p>
                    </div>
                ) : viewMode === 'calendar' ? (
                    <div className="p-4">
                        <BookingCalendar
                            bookings={bookings}
                            onBookingClick={setSelectedBooking}
                            showFullVehicleNo={true}
                        />
                    </div>
                ) : (
                    <div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-800/50 border-b border-slate-700">
                                    <tr className="whitespace-nowrap">
                                        <th className="px-3 py-3 text-left text-slate-400 font-medium">Booking / Vehicle</th>
                                        <th className="px-3 py-3 text-left text-slate-400 font-medium">Customer</th>
                                        <th className="px-3 py-3 text-left text-slate-400 font-medium">Route & Package</th>
                                        <th className="px-3 py-3 text-left text-slate-400 font-medium">Dates</th>
                                        <th className="px-3 py-3 text-left text-slate-400 font-medium">Status</th>
                                        <th className="px-3 py-3 text-center text-slate-400 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 whitespace-nowrap">
                                    {bookings.map(booking => (
                                        <tr key={booking._id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-3 py-3">
                                                <div className="text-white font-medium">{booking.booking_no}</div>
                                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-mono uppercase">
                                                    <Truck size={12} className="text-slate-500" />
                                                    {booking.vehicle_no || 'No Vehicle'}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="text-white font-medium">{booking.customer_name}</div>
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <Phone size={12} className="text-slate-500" />
                                                    {booking.customer_phone}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="text-white font-medium max-w-[150px] truncate flex items-center gap-1.5">
                                                    <MapPin size={13} className="text-slate-500 flex-shrink-0" />
                                                    <span className="truncate">{booking.pickup_location || '-'} → {booking.trip_destination || '-'}</span>
                                                </div>
                                                {booking.package_name && (
                                                    <div className="text-xs text-slate-400 mt-1 max-w-[150px] truncate pl-5">
                                                        Pkg: {booking.package_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-slate-300 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarIcon size={13} className="text-slate-500" />
                                                    <span>{formatDate(booking.journey_start_date)} - {formatDate(booking.journey_return_date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <StatusBadge status={booking.status} />
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedBooking(booking)}
                                                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => setEditingBooking(booking)}
                                                        className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                        title="Edit Booking"
                                                    >
                                                        <Edit size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(booking._id)}
                                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete Booking"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>

                                                    {booking.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusChange(booking._id, 'approved')}
                                                                className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                                title="Approve"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(booking._id, 'rejected')}
                                                                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                                title="Reject"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List View */}
                        <div className="md:hidden divide-y divide-slate-800">
                            {bookings.map(booking => (
                                <div key={booking._id} className="p-4 space-y-3 bg-slate-900/50">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-white text-sm">{booking.booking_no}</span>
                                        <StatusBadge status={booking.status} />
                                    </div>
                                    
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-300">
                                            <MapPin size={13} className="text-slate-500 flex-shrink-0" />
                                            <span className="font-medium">{booking.pickup_location || '-'} → {booking.trip_destination || '-'}</span>
                                        </div>
                                        {booking.package_name && (
                                            <div className="text-slate-400 pl-5">
                                                Pkg: {booking.package_name}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <CalendarIcon size={13} className="text-slate-500" />
                                            <span>{formatDate(booking.journey_start_date)} - {formatDate(booking.journey_return_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400 uppercase font-mono">
                                            <Truck size={12} className="text-slate-500" />
                                            <span>{booking.vehicle_no || 'No Vehicle'}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-800/60 flex justify-between items-center">
                                        <div className="space-y-0.5">
                                            <div className="text-white font-medium text-xs">{booking.customer_name}</div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <Phone size={10} className="text-slate-500" />
                                                {booking.customer_phone}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setSelectedBooking(booking)}
                                                className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye size={15} />
                                            </button>

                                            <button
                                                onClick={() => setEditingBooking(booking)}
                                                className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                title="Edit Booking"
                                            >
                                                <Edit size={15} />
                                            </button>

                                            <button
                                                onClick={() => handleDelete(booking._id)}
                                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Booking"
                                            >
                                                <Trash2 size={15} />
                                            </button>

                                            {booking.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(booking._id, 'approved')}
                                                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                        title="Approve"
                                                    >
                                                        <Check size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(booking._id, 'rejected')}
                                                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pagination Controls */}
                {viewMode === 'list' && !loading && bookings.length > 0 && pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            Showing <span className="text-white font-medium">{bookings.length}</span> of <span className="text-white font-medium">{pagination.total}</span> bookings
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(pagination.totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${page === i + 1
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onApprove={(id) => handleStatusChange(id, 'approved')}
                    onReject={(id) => handleStatusChange(id, 'rejected')}
                    actionLoading={actionLoading}
                    onDownloadPDF={handleDownloadPDF}
                    downloadLoading={downloadLoading}
                    onRefresh={fetchBookings}
                />
            )}

            {editingBooking && (
                <BookingEditModal
                    booking={editingBooking}
                    vehicles={vehicles}
                    onClose={() => setEditingBooking(null)}
                    onUpdate={handleUpdate}
                />
            )}

            {isCreating && (
                <BookingCreateModal
                    vehicles={vehicles}
                    onClose={() => setIsCreating(false)}
                    onCreate={fetchBookings}
                />
            )}
        </div>
    );
}

export default function AdminBookingsPage() {
    return (
        <Suspense fallback={
            <div className="p-8 text-center text-slate-400">Loading bookings...</div>
        }>
            <AdminBookingsContent />
        </Suspense>
    );
}
