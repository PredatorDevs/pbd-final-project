import jsonwebtoken from 'jsonwebtoken';
import db from '../database/conn.mjs';
import { ObjectId } from 'mongodb';
const { verify } = jsonwebtoken;

const middleware = {};

middleware.checkToken = (req, res, next) => {
  const { authorization } = req.headers;
  verify(authorization, process.env.PDEV_JWTSECRET, (err, data) => {
    if (err) res.status(401).send(err);
    else next();
  })
}

middleware.checkUserIsActive = async (req, res, next) => {
  const { idtoauth } = req.headers;

  let collection = db.collection("users");
  let result = await collection.findOne({ _id: new ObjectId(idtoauth) });

  if (!result) res.status(400).json({ error: "User verification failed" });
  else {
    if (result.isActive === 1) next();
    else res.status(400).json({ status: 400, message: 'Current users cant be authorized because block or ban' });
  }
}

export default middleware;