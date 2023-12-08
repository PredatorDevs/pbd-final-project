import { ObjectId } from "mongodb";
import db from "../database/conn.mjs";

const controller = {};

controller.find = async (req, res) => {
  let collection = db.collection("markers");
  let results = await collection.find().toArray();

  if (!results) res.status(400).json({ info: "No se pudieron obtener los usuarios" });
  else {
    res.json(results);
  }
}

controller.findById = (req, res) => {
  
}

controller.add = async (req, res) => {
  const { idtoauth } = req.headers;

  let newDoc = req.body;
  newDoc.createdAt = new Date();
  newDoc.updatedAt = new Date();
  newDoc.createdBy = new ObjectId(idtoauth);
  let collection = db.collection("markers");
  let result = await collection.insertOne(newDoc);
  res.send(result).status(204);
}

controller.remove = async (req, res) => {
  const query = { _id: new ObjectId(req.params.markerId) };
  const collection = db.collection("markers");
  let result = await collection.deleteOne(query);
  res.send(result).status(200);
}

export default controller;
