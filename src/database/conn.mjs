import { MongoClient } from "mongodb";

const connectionString = process.env.ATLAS_URI || "mongodb+srv://predator:rCz36qyMmj9uIfOS@predatortestcluster.gb4u0fj.mongodb.net/";

const client = new MongoClient(connectionString);

let conn;

try {
  conn = await client.connect();
} catch(e) {
  console.error(e);
}

let db = conn.db("rutacontrol360");

export default db;
