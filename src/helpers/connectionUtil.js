import errorResponses from './errorResponses.js';

const connUtil = {};

connUtil.connSPFunc = (query, queryParams, res) => ((err, conn) => {
  if (err) res.status(400).json(errorResponses.status400(err));
  else {
    conn.query(
      query,
      queryParams,
      (err, rows) => {
        if (err) res.status(400).json(errorResponses.status400(err));
        else res.json(rows[0]);
      }
    )
  }
});

connUtil.connFunc = (query, queryParams, res) => ((err, conn) => {
  if (err) res.status(400).json(errorResponses.status400(err));
  else {
    conn.query(
      query,
      queryParams,
      (err, rows) => {
        if (err) res.status(400).json(errorResponses.status400(err));
        else res.json(rows);
      }
    )
  }
});

export default connUtil;
