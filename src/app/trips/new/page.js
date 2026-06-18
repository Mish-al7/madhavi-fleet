'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { Calendar, Truck, MapPin, DollarSign, Save } from 'lucide-react';
import NotificationBell from '@/components/ui/NotificationBell';

// UI Components
const InputGroup = ({ label, name, value, onChange, type = "text", icon: Icon, placeholder, required = false }) => (
    <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                {Icon && <Icon size={18} />}
            </div>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                onWheel={(e) => e.target.blur()}
                required={required}
                placeholder={placeholder}
                className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
        </div>
    </div>
);

function NewTripForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill parameters
    const bookingId = searchParams.get('bookingId');
    const qVehicleId = searchParams.get('vehicleId');
    const qTripRoute = searchParams.get('tripRoute');
    const qTripDate = searchParams.get('tripDate');

    // Form State
    const [formData, setFormData] = useState({
        bookingId: bookingId || '',
        trip_date: qTripDate ? new Date(qTripDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        vehicle_id: qVehicleId || '',
        trip_route: qTripRoute || '',
        actual_driver_name: '',
        income: '',
        payment_status: 'pay_later',
        payment_date: new Date().toISOString().split('T')[0],
        fuel: '',
        fasttag: '',
        driver_allowance: '',
        service: '',
        adblue: '',
        grease: '',
        air: '',
        other_expense: '',
        notes: ''
    });

    // Fetch Vehicles on Mount
    useEffect(() => {
        async function fetchVehicles() {
            try {
                const res = await fetch('/api/user/vehicles');
                const json = await res.json();
                if (json.success) {
                    setVehicles(json.data);
                    // Auto-select if only one vehicle
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Calculate Total Expenses for Preview
    const totalExpenses = [
        'fuel', 'fasttag', 'driver_allowance',
        'service', 'adblue', 'grease', 'air',
        'other_expense'
    ].reduce((sum, field) => sum + (Number(formData[field]) || 0), 0);

    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess(false);

        try {
            const submissionData = {
                ...formData,
                payment_status: formData.payment_status || 'pay_later',
                payment_date: formData.payment_status === 'pay_later' ? null : (formData.payment_date || new Date())
            };
            if (!submissionData.bookingId) delete submissionData.bookingId;

            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to create trip');
            }

            // Success
            setSuccess(true);
            setSubmitting(false);

            // Reset numerical fields but keep vehicle and date for convenience
            setFormData(prev => ({
                ...prev,
                trip_route: '',
                income: '',
                payment_status: 'pay_later',
                payment_date: new Date().toISOString().split('T')[0],
                fuel: '',
                fasttag: '',
                driver_allowance: '',
                service: '',
                adblue: '',
                grease: '',
                air: '',
                other_expense: '',
                notes: '',
                bookingId: ''
            }));

            // Scroll to top to show success message
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
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        New Trip Entry
                    </h1>
                    <NotificationBell />
                </div>
                <p className="text-slate-400 text-sm">Log your journey details below</p>
            </div>

            <main className="max-w-md mx-auto px-6 py-6 animate-fade-in-up">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
                            <span>Trip saved successfully!</span>
                            <button
                                type="button"
                                onClick={() => router.push(`/admin/ledger/${formData.vehicle_id}`)}
                                className="text-xs font-bold underline bg-emerald-500/10 px-2 py-1 rounded"
                            >
                                New Ledger
                            </button>
                        </div>
                    )}

                    {/* Section: Core Details */}
                    <div className="space-y-4">
                        <InputGroup
                            label="Date"
                            name="trip_date"
                            value={formData.trip_date}
                            onChange={handleChange}
                            type="date"
                            icon={Calendar}
                            required
                        />

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle</label>
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

                        <InputGroup
                            label="Route"
                            name="trip_route"
                            value={formData.trip_route}
                            onChange={handleChange}
                            icon={MapPin}
                            placeholder="e.g. Bangalore to Chennai"
                            required
                        />

                        <InputGroup
                            label="Actual Driver Name (optional)"
                            name="actual_driver_name"
                            value={formData.actual_driver_name}
                            onChange={handleChange}
                            placeholder="Name of person who drove"
                        />
                    </div>

                    <div className="h-px bg-slate-800 my-6" />

                    {/* Section: Financials */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                            <DollarSign size={16} /> Income & Expenses
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="Income" name="income" value={formData.income} onChange={handleChange} type="number" placeholder="0" required />
                            <InputGroup label="Fuel" name="fuel" value={formData.fuel} onChange={handleChange} type="number" placeholder="0" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="FastTag" name="fasttag" value={formData.fasttag} onChange={handleChange} type="number" placeholder="0" />
                            <InputGroup label="Allowance (Driver Bata)" name="driver_allowance" value={formData.driver_allowance} onChange={handleChange} type="number" placeholder="0" />
                        </div>

                        <InputGroup label="Workshop Service" name="service" value={formData.service} onChange={handleChange} type="number" placeholder="0" />

                        <div className="grid grid-cols-3 gap-4">
                            <InputGroup label="AdBlue" name="adblue" value={formData.adblue} onChange={handleChange} type="number" placeholder="0" />
                            <InputGroup label="Grease" name="grease" value={formData.grease} onChange={handleChange} type="number" placeholder="0" />
                            <InputGroup label="Air" name="air" value={formData.air} onChange={handleChange} type="number" placeholder="0" />
                        </div>

                        <InputGroup label="Other Expenses" name="other_expense" value={formData.other_expense} onChange={handleChange} type="number" placeholder="0" />

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Add any additional notes here..."
                                className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all h-24 resize-none"
                            />
                        </div>

                        {/* Total Expense Preview Card */}
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Total Expenses</span>
                            <span className="text-xl font-bold text-white">₹{totalExpenses.toLocaleString()}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                            <div className="flex items-center gap-2.5">
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
                                <div className="flex-1">
                                    <InputGroup
                                        label="Payment Date"
                                        name="payment_date"
                                        value={formData.payment_date}
                                        onChange={handleChange}
                                        type="date"
                                        icon={Calendar}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <span>Saving...</span>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Save Trip</span>
                            </>
                        )}
                    </button>

                </form>
            </main>

            <Navbar />
        </div>
    );
}

export default function NewTripPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
            <NewTripForm />
        </Suspense>
    );
}
