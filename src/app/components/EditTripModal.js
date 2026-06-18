'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Truck, MapPin, DollarSign, X } from 'lucide-react';

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

export default function EditTripModal({ trip, onClose, onUpdate }) {
    const [vehicles, setVehicles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        trip_date: '',
        vehicle_id: '',
        trip_route: '',
        actual_driver_name: '',
        income: '',
        payment_status: 'received',
        payment_date: '',
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
    });

    useEffect(() => {
        if (trip) {
            setFormData({
                trip_date: trip.trip_date ? new Date(trip.trip_date).toISOString().split('T')[0] : '',
                vehicle_id: trip.vehicle_id?._id || trip.vehicle_id || '',
                trip_route: trip.trip_route || '',
                actual_driver_name: trip.actual_driver_name || '',
                income: trip.trip_income !== undefined ? trip.trip_income : (trip.income || ''),
                payment_status: trip.payment_status || 'received',
                payment_date: trip.payment_date ? new Date(trip.payment_date).toISOString().split('T')[0] : (trip.trip_date ? new Date(trip.trip_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                fuel: trip.fuel || '',
                fasttag: trip.fasttag || '',
                driver_allowance: trip.driver_allowance || '',
                service: trip.service || '',
                adblue: trip.adblue || '',
                grease: trip.grease || '',
                air: trip.air || '',
                other_expense: trip.other_expense || '',
                notes: trip.notes || '',
                bookingId: trip.bookingId || ''
            });
        }
    }, [trip]);

    // Fetch vehicles for dropdown
    useEffect(() => {
        async function fetchVehicles() {
            try {
                const res = await fetch('/api/user/vehicles');
                const json = await res.json();
                if (json.success) {
                    setVehicles(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch vehicles", err);
            }
        }
        fetchVehicles();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const submissionData = {
                ...formData,
                payment_status: formData.payment_status || 'pay_later',
                payment_date: formData.payment_status === 'pay_later' ? null : (formData.payment_date || new Date())
            };
            if (!submissionData.bookingId) delete submissionData.bookingId;

            const res = await fetch(`/api/trips/${trip._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Failed to update trip');
            }

            onUpdate(json.data);
            onClose();

        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate Total Expenses for Preview
    const totalExpenses = [
        'fuel', 'fasttag', 'driver_allowance',
        'service', 'adblue', 'grease', 'air',
        'other_expense'
    ].reduce((sum, field) => sum + (Number(formData[field]) || 0), 0);

    if (!trip) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Edit Trip</h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {formData.bookingId && (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
                                <div className="text-sm font-medium text-slate-400">Linked Booking ID:</div>
                                <div className="font-mono text-sm text-blue-400">{formData.bookingId}</div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-slate-400">
                                        <Truck size={18} />
                                    </div>
                                    <select
                                        name="vehicle_id"
                                        value={formData.vehicle_id}
                                        onChange={handleChange}
                                        required
                                        className="block w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none transition-all"
                                    >
                                        <option value="" disabled>Select Vehicle</option>
                                        {vehicles.map(v => (
                                            <option key={v._id} value={v._id}>{v.vehicle_no} {v.vehicle_name ? `(${v.vehicle_name})` : ''}{v.nickname ? ` - ${v.nickname}` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
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

                        <div className="h-px bg-slate-800" />

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                                <DollarSign size={16} /> Income & Expenses
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputGroup label="Income" name="income" value={formData.income} onChange={handleChange} type="number" placeholder="0" required />
                                <InputGroup label="Fuel" name="fuel" value={formData.fuel} onChange={handleChange} type="number" placeholder="0" />
                                <InputGroup label="FastTag" name="fasttag" value={formData.fasttag} onChange={handleChange} type="number" placeholder="0" />
                                <InputGroup label="Allowance (Driver Bata)" name="driver_allowance" value={formData.driver_allowance} onChange={handleChange} type="number" placeholder="0" />
                                <InputGroup label="Workshop Service" name="service" value={formData.service} onChange={handleChange} type="number" placeholder="0" />
                                <InputGroup label="AdBlue" name="adblue" value={formData.adblue} onChange={handleChange} type="number" placeholder="0" />
                                <InputGroup label="Grease" name="grease" value={formData.grease} onChange={handleChange} type="number" placeholder="0" />
                                <InputGroup label="Air" name="air" value={formData.air} onChange={handleChange} type="number" placeholder="0" />
                            </div>

                            <InputGroup label="Other Expenses" name="other_expense" value={formData.other_expense} onChange={handleChange} type="number" placeholder="0" />

                            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Total Expenses</span>
                                <span className="text-xl font-bold text-white">₹{totalExpenses.toLocaleString()}</span>
                            </div>
                        </div>

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

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
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

                        <div className="pt-4 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
