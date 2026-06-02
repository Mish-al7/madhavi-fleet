import path from 'path';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("❌ MONGODB_URI not found in .env.local");
    process.exit(1);
}

console.log(`🔗 Connecting to database: ${MONGO_URI.replace(/:([^:@]+)@/, ':****@')}`);

async function run() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB cluster.");
        
        const db = client.db("madhavi");
        
        // 1. Get all collections and clean them
        const collections = await db.listCollections().toArray();
        console.log("🧹 Cleaning all collections in 'madhavi' database...");
        
        let totalDeleted = 0;
        for (const collInfo of collections) {
            if (collInfo.name.startsWith('system.')) continue;
            
            const result = await db.collection(collInfo.name).deleteMany({});
            console.log(`  Deleted ${result.deletedCount} documents from '${collInfo.name}'`);
            totalDeleted += result.deletedCount;
        }
        console.log(`✨ Finished database cleanup. Total deleted documents: ${totalDeleted}\n`);
        
        // 2. Create the Super Admin User
        console.log("👤 Creating Super Admin account...");
        const superAdminEmail = 'admin@madhavifleet.com';
        const superAdminPasswordRaw = 'MadhaviSuper2026!';
        const superAdminHashedPassword = await bcrypt.hash(superAdminPasswordRaw, 12);
        
        const superAdminDoc = {
            name: "Super Admin",
            email: superAdminEmail,
            password: superAdminHashedPassword,
            role: "super_admin",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection("users").insertOne(superAdminDoc);
        console.log("✅ Super Admin created.");
        
        console.log("\n🚀 ================================================");
        console.log("✨ MADHAVI DATABASE INITIALIZATION COMPLETE!");
        console.log("================================================");
        console.log("🔑 CREDENTIALS FOR YOUR REFERENCE:");
        console.log(`\n👑 [Super Admin]`);
        console.log(`   Email:    ${superAdminEmail}`);
        console.log(`   Password: ${superAdminPasswordRaw}`);
        console.log("================================================\n");
        
    } catch (error) {
        console.error("❌ Error during script execution:", error);
    } finally {
        await client.close();
    }
}

run();
