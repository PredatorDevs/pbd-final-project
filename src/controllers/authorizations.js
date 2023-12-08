import pkg from 'jsonwebtoken';
import connUtil from '../helpers/connectionUtil.js';
import db from '../database/conn.mjs';
const { sign } = pkg;

const controller = {};

const queries = {
  authLogin: `CALL usp_AuthUser(?, ?);`,
  authUserPassword: `CALL usp_AuthUserPassword(?);`,
  authUserPINCode: `CALL usp_AuthUserPINCode(?);`
};

controller.authLogin = async (req, res) => {
  const { username, password } = req.body;

  let collection = db.collection("users");
  let results = await collection.findOne({ username, password });

  if (!results) res.status(400).json({ info: "No has podido logearte" });
  else {
    const token = sign(
      { payload: results }, 
      process.env.PDEV_JWTSECRET,
      { expiresIn: '24h' } // CONFIG OBJECT
    );
    
    res.json({ userdata: results, token: token });
  }
}

controller.authUserPassword = (req, res) => {
  const { password } = req.body;
  req.getConnection(connUtil.connSPFunc(queries.authUserPassword, [password], res));
}

controller.authUserPINCode = (req, res) => {
  const { PINCode } = req.body;
  console.log(PINCode);
  req.getConnection(connUtil.connSPFunc(queries.authUserPINCode, [ PINCode ], res));
}

controller.successVerification = (req, res) => {
  res.json({ status: 200, message: 'Success' });
}

controller.testingmongo = async (req, res) => {
  let collection = db.collection("users");
  let results = await collection.find({})
    .limit(50)
    .toArray();
  res.send(results).status(200);
}

controller.testingmongopost = async (req, res) => {
  let collection = db.collection("posts");
  let newDocument = {
    "id" : 1,
    "fullName" : "Gustavo Sánchez",
    "username" : "predator",
    "password" : "8f4dde1f054b22564ba30aff55ccf8a7b4a00e8681e09bab28b902f5f3cd856fa23d8c4f4cdea5bd2d7e0b68c0f487106cdeddba55d5ae3013aca46def3483ec",
    "PINCode" : "28351",
    "isActive" : 1,
    "roleId" : 1,
    "locationId" : 1,
    "isAdmin" : 1,
    "createdAt" : "2023-03-19 16:09:24",
    "updatedAt" : "2023-03-19 16:09:24",
    "cashierId" : 5,
    "canCloseCashier" : 1
  };
  newDocument.date = new Date();
  let result = await collection.insertOne(newDocument);
  res.send(result).status(204);
}

export default controller;
