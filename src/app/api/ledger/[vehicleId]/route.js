import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import AdminExpense from '@/models/AdminExpense';
import OpeningBalance from '@/models/OpeningBalance';
import Vehicle from '@/models/Vehicle';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { vehicleId } = await params;
        const company_id = session.user.company_id;
        const { searchParams } = new URL(req.url);
        const year = searchParams.get('year') || new Date().getFullYear();

        // Verify vehicle belongs to company
        const vehicle = await Vehicle.findOne({ _id: vehicleId, company_id });
        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        // Fetch opening balance (scoped to company)
        const openingBalanceDoc = await OpeningBalance.findOne({
            vehicle_id: vehicleId,
            year: parseInt(year),
            company_id
        });
        const openingBalance = openingBalanceDoc?.opening_balance || 0;

        const startOfYear = new Date(`${year}-01-01`);
        const endOfYear = new Date(`${parseInt(year) + 1}-01-01`);
        const vehObjId = new mongoose.Types.ObjectId(vehicleId);
        const compObjId = new mongoose.Types.ObjectId(company_id);

        // Aggregation Pipeline Stages Explained:
        // 1. $match: Filters initial trip documents by vehicle, company, and year.
        // 2. $project: Formats trip fields and calculates 'total_expenses' by explicitly summing: fuel, fasttag, service, driver allowance, and adblue.
        // 3. $unionWith: Merges admin expenses for the same company/vehicle and time period into the pipeline.
        // 4. $lookup & $addFields: Populates the driver's name for trips, simulating Mongoose populate().
        // 5. $sort: Orders all merged entries chronologically by date and creation time.
        // 6. $setWindowFields: Calculates 'cumulative_income' and 'cumulative_expenses' natively server-side for each document using running totals.
        // 7. $addFields: Computes the precise 'running_balance' stringently following the formula: Opening Balance + (cumulative_income - cumulative_expenses).
        // 8. $group: Groups the entire sorted sequence into a single 'ledger' array and resolves the 'closingBalance', strictly utilizing $group as an overarching wrap.

        const pipeline = [
            // Stage 1: Match base trips
            {
                $match: {
                    vehicle_id: vehObjId,
                    company_id: compObjId,
                    month: { $regex: `^${year}` }
                }
            },
            // Stage 2: Format trips and calculate specific total expenses
            {
                $project: {
                    _id: 1,
                    trip_date: 1,
                    month: 1,
                    trip_route: 1,
                    driver_id: 1,
                    actual_driver_name: 1,
                    income: {
                        $cond: {
                            if: { $eq: ["$payment_status", "pay_later"] },
                            then: 0,
                            else: { $ifNull: ["$income", 0] }
                        }
                    },
                    trip_income: { $ifNull: ["$income", 0] },
                    payment_status: { $ifNull: ["$payment_status", "received"] },
                    payment_date: { $ifNull: ["$payment_date", null] },
                    fuel: { $ifNull: ["$fuel", 0] },
                    fasttag: { $ifNull: ["$fasttag", 0] },
                    driver_allowance: { $ifNull: ["$driver_allowance", 0] },
                    service: { $ifNull: ["$service", 0] },
                    adblue: { $ifNull: ["$adblue", 0] },
                    grease: { $ifNull: ["$grease", 0] },
                    air: { $ifNull: ["$air", 0] },
                    other_expense: { $ifNull: ["$other_expense", 0] },
                    bookingId: 1,
                    notes: 1,
                    createdAt: 1,
                    is_admin_expense: { $literal: false },
                    is_company_level: { $literal: false },
                    trip_type: { $ifNull: ["$trip_type", "regular"] },
                    cleaner_name: { $ifNull: ["$cleaner_name", ""] },
                    cleaner_payment: { $ifNull: ["$cleaner_payment", 0] },
                    driver_payment: { $ifNull: ["$driver_payment", 0] },
                    seats_filled: { $ifNull: ["$seats_filled", 0] },
                    toll: { $ifNull: ["$toll", 0] },
                    office_offline_collection: { $ifNull: ["$office_offline_collection", 0] },
                    online_booking_collection: { $ifNull: ["$online_booking_collection", 0] },
                    total_expenses: {
                        $cond: {
                            if: { $eq: ["$trip_type", "nightly"] },
                            then: {
                                $add: [
                                    { $ifNull: ["$fuel", 0] },
                                    { $ifNull: ["$toll", 0] },
                                    { $ifNull: ["$driver_payment", 0] },
                                    { $ifNull: ["$cleaner_payment", 0] },
                                    { $ifNull: ["$other_expense", 0] }
                                ]
                            },
                            else: {
                                $add: [
                                    { $ifNull: ["$fuel", 0] },
                                    { $ifNull: ["$fasttag", 0] },
                                    { $ifNull: ["$service", 0] },
                                    { $ifNull: ["$driver_allowance", 0] },
                                    { $ifNull: ["$adblue", 0] }
                                ]
                            }
                        }
                    }
                }
            },
            // Stage 3: Merge AdminExpenses
            {
                $unionWith: {
                    coll: "adminexpenses",
                    pipeline: [
                        {
                            $match: {
                                vehicle_id: vehObjId,
                                company_id: compObjId,
                                start_date: { $gte: startOfYear, $lt: endOfYear },
                                status: "Completed"
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                trip_date: "$start_date",
                                month: {
                                    $dateToString: { format: "%Y-%m", date: "$start_date" }
                                },
                                trip_route: { $concat: ["Admin Exp: ", "$expense_type"] },
                                driver_id: { $literal: null },
                                actual_driver_name: { $literal: "Admin" },
                                income: { $literal: 0 },
                                trip_income: { $literal: 0 },
                                fuel: { $literal: 0 },
                                fasttag: { $literal: 0 },
                                driver_allowance: { $literal: 0 },
                                service: { $literal: 0 },
                                adblue: { $literal: 0 },
                                grease: { $literal: 0 },
                                air: { $literal: 0 },
                                other_expense: { $literal: 0 },
                                notes: "$description",
                                createdAt: 1,
                                is_admin_expense: { $literal: true },
                                is_company_level: { $eq: ["$vehicle_id", null] },
                                total_expenses: { $ifNull: ["$amount", 0] }
                            }
                        }
                    ]
                }
            },
            // Stage 4: Lookup to mock Mongoose populate('driver_id', 'name')
            {
                $lookup: {
                    from: "users",
                    localField: "driver_id",
                    foreignField: "_id",
                    as: "driver"
                }
            },
            {
                $addFields: {
                    driver_id: {
                        $cond: {
                            if: { $eq: ["$is_admin_expense", true] },
                            then: "$$REMOVE",
                            else: {
                                _id: "$driver_id",
                                name: { $arrayElemAt: ["$driver.name", 0] }
                            }
                        }
                    }
                }
            },
            {
                $project: { driver: 0 }
            },
            // Stage 5: Sort the merged output chronologically
            {
                $sort: { trip_date: 1, createdAt: 1 }
            },
            // Stage 6: Calculate cumulative income and expenses server-side
            {
                $setWindowFields: {
                    sortBy: { trip_date: 1, createdAt: 1 },
                    output: {
                        cumulative_income: {
                            $sum: "$income",
                            window: { documents: ["unbounded", "current"] }
                        },
                        cumulative_expenses: {
                            $sum: "$total_expenses",
                            window: { documents: ["unbounded", "current"] }
                        }
                    }
                }
            },
            // Stage 7: Calculate final dynamic running balance
            {
                $addFields: {
                    running_balance: {
                        $add: [
                            openingBalance,
                            { $subtract: ["$cumulative_income", "$cumulative_expenses"] }
                        ]
                    }
                }
            },
            // Stage 8: Aggregate all back into structured format with $group
            {
                $group: {
                    _id: null,
                    ledger: { $push: "$$ROOT" },
                    closingBalance: { $last: "$running_balance" }
                }
            }
        ];

        const aggregateResult = await Trip.aggregate(pipeline);

        let ledger = [];
        let closingBalance = openingBalance;

        if (aggregateResult.length > 0) {
            ledger = aggregateResult[0].ledger;
            closingBalance = aggregateResult[0].closingBalance;
        }

        return NextResponse.json({
            success: true,
            data: {
                vehicle,
                opening_balance: openingBalance,
                selected_year: parseInt(year),
                ledger,
                closingBalance,
            }
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
