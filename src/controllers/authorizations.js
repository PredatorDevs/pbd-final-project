import pkg from 'jsonwebtoken';
import connUtil from '../helpers/connectionUtil.js';
const { sign } = pkg;

const controller = {};

const queries = {
  authLogin: `CALL usp_AuthUser(?, ?);`,
  authUserPassword: `CALL usp_AuthUserPassword(?);`,
  authUserPINCode: `CALL usp_AuthUserPINCode(?);`
};

controller.authLogin = (req, res) => {
  req.getConnection((err, conn) => {
    if (err) res.status(500).json({ info: err });
    else {
      const { username, password } = req.body;
      conn.query(
        queries.authLogin,
        [ username, password ], 
        (err, rows) => {
          if (err) res.status(400).json({ info: err });
          else {
            const token = sign(
              { 
                payload: rows[0][0]}, 
                process.env.PDEV_JWTSECRET,
                { expiresIn: '24h' } // CONFIG OBJECT
              );
            res.json({ userdata: rows[0][0], token: token });
          }
      })
    }
  })
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

export default controller;
