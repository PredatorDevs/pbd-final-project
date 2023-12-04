import connUtil from "../helpers/connectionUtil.js";

const controller = {};

const queries = {
  incomingTransfers: `SELECT * FROM vw_transfers WHERE destinationLocationId = ? ORDER BY transferId DESC LIMIT 50;`,
  incomingTransfersBySentAtRange: `SELECT * FROM vw_transfers WHERE destinationLocationId = ? AND DATE_FORMAT(sentAt, "%Y-%m-%d") BETWEEN ? AND ?;`,
  incomingTransfersByReceivedAtRange: `SELECT * FROM vw_transfers WHERE destinationLocationId = ? AND DATE_FORMAT(receivedAt, "%Y-%m-%d") BETWEEN ? AND ?;`,
  outcomingTransfers: `SELECT * FROM vw_transfers WHERE originLocationId = ? ORDER BY transferId DESC LIMIT 50;`,
  outcomingTransfersBySentAtRange: `SELECT * FROM vw_transfers WHERE originLocationId = ? AND DATE_FORMAT(sentAt, "%Y-%m-%d") BETWEEN ? AND ?;`,
  outcomingTransfersReceivedAtRange: `SELECT * FROM vw_transfers WHERE originLocationId = ? AND DATE_FORMAT(receivedAt, "%Y-%m-%d") BETWEEN ? AND ?;`,
  add: `
    INSERT INTO transfers (originLocationId, destinationLocationid, sentBy, sentAt, status)
    VALUES (?, ?, ?, ?, ?);
  `,
  addDetails: `
    INSERT INTO transferdetails (transferId, productId, quantityExpected, quantityConfirmed, status)
    VALUES ?;
  `,
  findById: `
    SELECT * FROM vw_transfers WHERE transferId = ?;
    SELECT * FROM vw_transferdetails WHERE transferId = ?;
  `,
  confirmTransfer: `CALL usp_ConfirmTransfer(?, ?);`,
  confirmTransferDetail: `CALL usp_ConfirmTransferDetail(?, ?, ?);`,
  rejectTransfer: `CALL usp_RejectTransfer(?, ?);`,
  rejectTransferDetail: `CALL usp_RejectTransferDetail(?, ?);`
}

controller.add = (req, res) => {
  const {
    originLocationId,
    destinationLocationid,
    sentBy,
    sentAt,
    status
  } = req.body;

  req.getConnection(connUtil.connFunc(queries.add, [ originLocationId, destinationLocationid, sentBy, sentAt, status ], res));
}

controller.addDetails = (req, res) => {
  const { bulkData } = req.body;
  req.getConnection(connUtil.connFunc(queries.addDetails, [ bulkData ], res));
}

controller.incomingTransfers = (req, res) => {
  const { destinationLocationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.incomingTransfers, [ destinationLocationId ], res));
}

controller.incomingTransfersBySentAtRange = (req, res) => {
  const { destinationLocationId, initialDate, finalDate } = req.params;
  req.getConnection(connUtil.connFunc(queries.incomingTransfersBySentAtRange, [ destinationLocationId, initialDate, finalDate ], res));
}

controller.incomingTransfersByReceivedAtRange = (req, res) => {
  const { destinationLocationId, initialDate, finalDate } = req.params;
  req.getConnection(connUtil.connFunc(queries.incomingTransfersByReceivedAtRange, [ destinationLocationId, initialDate, finalDate ], res));
}

controller.outcomingTransfers = (req, res) => {
  const { originLocationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.outcomingTransfers, [ originLocationId ], res));
}

controller.outcomingTransfersBySentAtRange = (req, res) => {
  const { originLocationId, initialDate, finalDate } = req.params;
  req.getConnection(connUtil.connFunc(queries.outcomingTransfersBySentAtRange, [ originLocationId, initialDate, finalDate ], res));
}

controller.outcomingTransfersReceivedAtRange = (req, res) => {
  const { originLocationId, initialDate, finalDate } = req.params;
  req.getConnection(connUtil.connFunc(queries.outcomingTransfersReceivedAtRange, [ originLocationId, initialDate, finalDate ], res));
}

controller.findById = (req, res) => {
  const { transferId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findById, [ transferId, transferId ], res));
}

// const { idtoauth } = req.headers;

controller.confirmTransfer = (req, res) => {
  const { idtoauth } = req.headers;
  const { transferId } = req.params;
  req.getConnection(connUtil.connSPFunc(queries.confirmTransfer, [ transferId, idtoauth ], res));
}

controller.confirmTransferDetail = (req, res) => {
  const { idtoauth } = req.headers;
  const { transferDetailId } = req.params;
  const { quantityToConfirm } = req.body;
  req.getConnection(connUtil.connSPFunc(queries.confirmTransferDetail, [ transferDetailId, quantityToConfirm, idtoauth ], res));
}

controller.rejectTransfer = (req, res) => {
  const { idtoauth } = req.headers;
  const { transferId } = req.params;
  req.getConnection(connUtil.connSPFunc(queries.rejectTransfer, [ transferId, idtoauth ], res));
}

controller.rejectTransferDetail = (req, res) => {
  const { idtoauth } = req.headers;
  const { transferDetailId } = req.params;
  req.getConnection(connUtil.connSPFunc(queries.rejectTransferDetail, [ transferDetailId, idtoauth ], res));
}

export default controller;
