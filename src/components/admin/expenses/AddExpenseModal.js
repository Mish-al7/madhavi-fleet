'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import DateInput from '@/components/ui/DateInput';

export default function AddExpenseModal({ onClose, onSave, vehicles, initialData = null }) {
    const [formData, setFormData] = useState({
        expense_type: 'Other',
        description: '',
        amount: '',
        frequency: 'One-time',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        vehicle_id: '',
        status: 'Active'
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
                end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
                amount: initialData.amount || '',
                vehicle_id: initialData.vehicle_id?._id || initialData.vehicle_id || '' // Handle populated or raw ID
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(formData);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-slate-700">
                    <h3 className="text-xl font-bold text-white">
                        {initialData ? 'Edit Expense' : 'Add New Expense'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Type & Amount Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                            <select
                                value={formData.expense_type}
                                onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                            >
                                {['EMI', 'Insurance', 'Tax', 'FASTag', 'Other'].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Amount (₹)</label>
                            <input
                                type="number"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Descriptions */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                            placeholder="e.g. Monthly Vehicle Loan"
                        />
                    </div>

                    {/* Frequency & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Frequency</label>
                            <select
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                            >
                                <option value="One-time">One-time</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                            <DateInput
                                required
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                            />
                        </div>
                    </div>

                    {/* Vehicle Link (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Link to Vehicle (Optional)</label>
                        <select
                            value={formData.vehicle_id}
                            onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                        >
                            <option value="">-- Company Expense (No Vehicle) --</option>
                            {vehicles.map(v => (
                                <option key={v._id} value={v._id}>{v.registration_number || v.vehicle_no}</option> // Fallback to vehicle_no if reg not avail
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            {formData.vehicle_id
                                ? "This expense will be DEBITED from the selected vehicle's ledger."
                                : "Company-level expense. Will not affect any vehicle ledger."}
                        </p>
                    </div>

                    {/* End Date (Only for Recurring) */}
                    {formData.frequency !== 'One-time' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">End Date (Optional)</label>
                            <DateInput
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                            />
                        </div>
                    )}

                    {/* Status (Edit Only or Recurring) */}
                    {formData.frequency !== 'One-time' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                            >
                                <option value="Active">Active</option>
                                <option value="Paused">Paused</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? 'Saving...' : (
                                <>
                                    <Check size={20} />
                                    Save Expense
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
