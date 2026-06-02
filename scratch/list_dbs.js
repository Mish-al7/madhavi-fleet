import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://mohammednalagath_db_user:Mohammed07@cluster0.n15fuiv.mongodb.net/Dev';

async function listDatabases() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const adminDb = client.db().admin();
        const dbs = await adminDb.listDatabases();
        console.log('Databases:');
        dbs.databases.forEach(db => console.log(` - ${db.name}`));
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

listDatabases();
