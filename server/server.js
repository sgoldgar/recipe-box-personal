const { MongoClient, ObjectId } = require("mongodb");

let clientPromise;

/**
 * Reuse a single MongoClient promise across Lambda invocations.
 * Set MONGO_URI in Netlify site environment variables.
 */
function getClient() {
  if (!clientPromise) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("Missing MONGO_URI env var");
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    clientPromise = client.connect();
  }
  return clientPromise;
}

exports.handler = async (event) => {
  try {
    const client = await getClient();
    const db = client.db(); // DB from URI or default
    const col = db.collection("recipes");

    if (event.httpMethod === "GET") {
      const docs = await col.find().sort({ createdAt: -1 }).toArray();
      const mapped = docs.map((d) => {
        const { _id, ...rest } = d;
        return { id: _id.toString(), ...rest };
      });
      return { statusCode: 200, body: JSON.stringify(mapped) };
    }

    if (event.httpMethod === "POST") {
      const payload = JSON.parse(event.body || "{}");
      if (!payload.createdAt) payload.createdAt = Date.now();
      const result = await col.insertOne(payload);
      const doc = await col.findOne({ _id: result.insertedId });
      const { _id, ...rest } = doc;
      return {
        statusCode: 201,
        body: JSON.stringify({ id: _id.toString(), ...rest }),
      };
    }

    if (event.httpMethod === "DELETE") {
      const id =
        (event.queryStringParameters && event.queryStringParameters.id) || null;
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing id" }),
        };
      }
      await col.deleteOne({ _id: new ObjectId(id) });
      return { statusCode: 204, body: "" };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};