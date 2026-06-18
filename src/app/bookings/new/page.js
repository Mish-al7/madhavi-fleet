'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { Calendar, MapPin, Users, Clock, Car, Phone, User, DollarSign, Save, AlertCircle } from 'lucide-react';
import NotificationBell from '@/components/ui/NotificationBell';

// UI Components
const InputGroup = ({ label, name, value, onChange, type = "text", icon: Icon, placeholder, required = false, rows }) => (
    <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
        <div className="relative group">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Icon size={18} />
                </div>
            )}
            {rows ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    rows={rows}
                    placeholder={placeholder}
                    className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onWheel={(e) => e.target.blur()}
                    required={required}
                    placeholder={placeholder}
                    className={`block w-full ${Icon ? 'pl-10' : 'px-4'} pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all`}
                />
            )}
        </div>
    </div>
);

export default function NewBookingPage() {
    const router = useRouter();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [availabilityError, setAvailabilityError] = useState('');
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    // Form State - All fields from PDF
    const [formData, setFormData] = useState({
        // Customer Details
        customer_name: '',
        customer_address: '',
        customer_phone: '',
        // Trip Details
        pickup_location: '',
        trip_destination: '',
        total_persons: '1',
        journey_start_date: '',
        journey_return_date: '',
        // Time & Distance
        trip_start_time: '09:00',
        trip_end_time: '18:00',
        total_days: '1',
        total_kilometers: '',
        // Additional Info
        night_halt_places: '',
        vehicle_type: '',
        // Financials
        advance_amount: '',
        total_amount: '',
        other_expenses: '',
        driver_food_accommodation: '',
        payment_status: 'pay_later',
        payment_date: new Date().toISOString().split('T')[0],
        // Vehicle
        vehicle_id: '',
    });

    // Fetch Vehicles on Mount
    useEffect(() => {
        async function fetchVehicles() {
            try {
                const res = await fetch('/api/user/vehicles');
                const json = await res.json();
                if (json.success) {
                    setVehicles(json.data);
                    if (json.data.length === 1) {
                        setFormData(prev => ({ ...prev, vehicle_id: json.data[0]._id }));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch vehicles', err);
            } finally {
                setLoading(false);
            }
        }
        fetchVehicles();
    }, []);

    // Check availability when vehicle or dates/times change
    useEffect(() => {
        const checkAvailability = async () => {
            const { vehicle_id, journey_start_date, journey_return_date, trip_start_time, trip_end_time } = formData;

            if (!vehicle_id || !journey_start_date || !journey_return_date || !trip_start_time || !trip_end_time) {
                setAvailabilityError('');
                return;
            }

            setCheckingAvailability(true);
            try {
                const res = await fetch('/api/bookings/check-availability', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vehicle_id,
                        journey_start_date,
                        journey_return_date,
                        trip_start_time,
                        trip_end_time
                    }),
                });
                const json = await res.json();

                if (!json.available) {
                    setAvailabilityError(`Vehicle not available. Conflicts with booking: ${json.conflicts.map(c => c.booking_no).join(', ')}`);
                } else {
                    setAvailabilityError('');
                }
            } catch (err) {
                console.error('Availability check failed', err);
            } finally {
                setCheckingAvailability(false);
            }
        };

        // Debounce the check
        const timer = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timer);
    }, [formData.vehicle_id, formData.journey_start_date, formData.journey_return_date, formData.trip_start_time, formData.trip_end_time]);

    // Auto-calculate total days
    useEffect(() => {
        if (formData.journey_start_date && formData.journey_return_date) {
            const start = new Date(formData.journey_start_date);
            const end = new Date(formData.journey_return_date);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            setFormData(prev => ({ ...prev, total_days: String(diffDays) }));
        }
    }, [formData.journey_start_date, formData.journey_return_date]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (availabilityError) {
            setError('Cannot create booking: Vehicle is not available for selected date & time');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess(false);

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    total_persons: Number(formData.total_persons) || 1,
                    total_days: Number(formData.total_days) || 1,
                    total_kilometers: Number(formData.total_kilometers) || 0,
                    advance_amount: Number(formData.advance_amount) || 0,
                    total_amount: Number(formData.total_amount) || 0,
                    payment_status: formData.payment_status || 'pay_later',
                    payment_date: formData.payment_status === 'pay_later' ? null : (formData.payment_date || new Date()),
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to create booking');
            }

            setSuccess(true);
            setSubmitting(false);

            // Reset form
            setFormData({
                customer_name: '',
                customer_address: '',
                customer_phone: '',
                pickup_location: '',
                trip_destination: '',
                total_persons: '1',
                journey_start_date: '',
                journey_return_date: '',
                trip_start_time: '09:00',
                trip_end_time: '18:00',
                total_days: '1',
                total_kilometers: '',
                night_halt_places: '',
                vehicle_type: '',
                advance_amount: '',
                total_amount: '',
                other_expenses: '',
                driver_food_accommodation: '',
                payment_status: 'pay_later',
                payment_date: new Date().toISOString().split('T')[0],
                vehicle_id: vehicles.length === 1 ? vehicles[0]._id : '',
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
            {/* Header */}
            <div className="bg-slate-900 pt-8 pb-6 px-6 shadow-lg border-b border-slate-800">
                <div className="flex justify-between items-center mb-1">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                        New Booking
                    </h1>
                    <NotificationBell />
                </div>
                <p className="text-slate-400 text-sm">Reserve a vehicle for your customer</p>
            </div>

            <main className="max-w-lg mx-auto px-6 py-6 animate-fade-in-up">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
                            <span>Booking created successfully!</span>
                            <button
                                type="button"
                                onClick={() => router.push('/bookings')}
                                className="text-xs font-bold underline bg-emerald-500/10 px-2 py-1 rounded"
                            >
                                View Bookings
                            </button>
                        </div>
                    )}

                    {/* Vehicle Selection */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                            <Car size={16} /> Vehicle Selection
                        </h3>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle *</label>
                            <select
                                name="vehicle_id"
                                value={formData.vehicle_id}
                                onChange={handleChange}
                                required
                                className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none transition-all"
                            >
                                <option value="" disabled>Select Vehicle</option>
                                {loading ? (
                                    <option>Loading...</option>
                                ) : (
                                    vehicles.map(v => (
                                        <option key={v._id} value={v._id}>{v.vehicle_no} {v.vehicle_name ? `(${v.vehicle_name})` : ''}{v.nickname ? ` - ${v.nickname}` : ''}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        {checkingAvailability && (
                            <div className="text-xs text-slate-400">Checking availability...</div>
                        )}

                        {availabilityError && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {availabilityError}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Customer Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                            <User size={16} /> Customer Details
                        </h3>

                        <InputGroup label="Customer Name *" name="customer_name" value={formData.customer_name} onChange={handleChange} icon={User} placeholder="Full name" required />
                        <InputGroup label="Phone *" name="customer_phone" value={formData.customer_phone} onChange={handleChange} icon={Phone} placeholder="+91..." required />
                        <InputGroup label="Address" name="customer_address" value={formData.customer_address} onChange={handleChange} placeholder="Customer address" rows={2} />
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Trip Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-purple-400 flex items-center gap-2">
                            <MapPin size={16} /> Trip Details
                        </h3>

                        <InputGroup label="Pickup Location *" name="pickup_location" value={formData.pickup_location} onChange={handleChange} icon={MapPin} placeholder="Where to pick up" required />
                        <InputGroup label="Destination *" name="trip_destination" value={formData.trip_destination} onChange={handleChange} icon={MapPin} placeholder="Final destination" required />
                        <InputGroup label="Total Persons" name="total_persons" value={formData.total_persons} onChange={handleChange} type="number" icon={Users} placeholder="1" />
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Dates & Times */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-amber-400 flex items-center gap-2">
                            <Calendar size={16} /> Dates & Times
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Start Date *" name="journey_start_date" value={formData.journey_start_date} onChange={handleChange} type="date" required />
                            <InputGroup label="Return Date *" name="journey_return_date" value={formData.journey_return_date} onChange={handleChange} type="date" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Start Time *" name="trip_start_time" value={formData.trip_start_time} onChange={handleChange} type="time" icon={Clock} required />
                            <InputGroup label="End Time *" name="trip_end_time" value={formData.trip_end_time} onChange={handleChange} type="time" icon={Clock} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Total Days" name="total_days" value={formData.total_days} onChange={handleChange} type="number" placeholder="Auto-calculated" />
                            <InputGroup label="Total KM" name="total_kilometers" value={formData.total_kilometers} onChange={handleChange} type="number" placeholder="0" />
                        </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Additional Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-cyan-400">Additional Info</h3>

                        <InputGroup label="Night Halt Places" name="night_halt_places" value={formData.night_halt_places} onChange={handleChange} placeholder="Places for overnight stays" />
                        <InputGroup label="Vehicle Type" name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} placeholder="e.g., SUV, Sedan, Van" />
                    </div>

                    <div className="h-px bg-slate-800" />

                    {/* Financials */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-green-400 flex items-center gap-2">
                            <DollarSign size={16} /> Financials
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Total Amount" name="total_amount" value={formData.total_amount} onChange={handleChange} type="number" placeholder="0" />
                            <InputGroup label="Advance Amount" name="advance_amount" value={formData.advance_amount} onChange={handleChange} type="number" placeholder="0" />
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="payment_status_checkbox"
                                    name="payment_status"
                                    checked={formData.payment_status === 'received'}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        payment_status: e.target.checked ? 'received' : 'pay_later'
                                    }))}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-800/50 text-blue-500 focus:ring-blue-500/50 focus:ring-2 cursor-pointer"
                                />
                                <label htmlFor="payment_status_checkbox" className="text-sm font-semibold text-slate-300 select-none cursor-pointer">
                                    Payment Received
                                </label>
                            </div>
                            {formData.payment_status === 'received' && (
                                <InputGroup
                                    label="Payment Date"
                                    name="payment_date"
                                    value={formData.payment_date}
                                    onChange={handleChange}
                                    type="date"
                                    icon={Calendar}
                                />
                            )}
                        </div>

                        <InputGroup label="Other Expenses" name="other_expenses" value={formData.other_expenses} onChange={handleChange} placeholder="e.g., Tolls, Parking" />
                        <InputGroup label="Driver Food & Accommodation" name="driver_food_accommodation" value={formData.driver_food_accommodation} onChange={handleChange} placeholder="Details" />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !!availabilityError}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <span>Creating Booking...</span>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Create Booking</span>
                            </>
                        )}
                    </button>
                </form>
            </main>

            <Navbar />
        </div>
    );
}
