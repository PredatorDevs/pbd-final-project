import { ObjectId } from "mongodb";
import db from "../database/conn.mjs";

const controller = {};

controller.find = async (req, res) => {
  let collection = db.collection("users");
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
  let collection = db.collection("users");
  let result = await collection.insertOne(newDoc);
  res.send(result).status(204);
}

controller.update = async (req, res) => {
  const { idtoauth } = req.headers;
  const { fullName, username, roleId, locationId, cashierId, isAdmin, canCloseCashier, userId } = req.body;
  const query = { _id: new ObjectId(userId) };
  const updates = {
    $set: { fullName, username, roleId, locationId, cashierId, isAdmin, canCloseCashier, updatedAt: new Date(), updatedBy: new ObjectId(idtoauth) }
  };
  let collection = db.collection("users");
  let result = await collection.updateOne(query, updates);
  res.send(result).status(200);
}

controller.remove = async (req, res) => {
  const query = { _id: new ObjectId(req.params.userId) };
  const collection = db.collection("users");
  let result = await collection.deleteOne(query);
  res.send(result).status(200);
}

export default controller;
