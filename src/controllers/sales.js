import connUtil from "../helpers/connectionUtil.js";

const controller = {};

const queries = {
  find: `
    SELECT * FROM vw_sales;
  `,
  findById: `
    SELECT * FROM vw_sales WHERE id = ?;
  `,
  findByLocationCurrentActiveShiftcut: `
    SELECT * FROM vw_sales WHERE shiftcutId = fn_getlocationcurrentactiveshiftcut(?);
  `,
  findByMyCashier: `
    SELECT * 
    FROM vw_sales 
    WHERE shiftcutId = (SELECT id FROM shiftcuts WHERE cashierId = ? AND status = 1 LIMIT 1)
    ORDER BY id DESC;
  `,
  findPendings: `SELECT * FROM vw_pendingsalecustomers;`,
  findPendingsByLocation: `SELECT * FROM vw_pendingsalecustomers WHERE customerLocationId = ?;`,
  findPendingAmountToPay: `SELECT (IFNULL(total, 0) - fn_getsaletotalpaid(id)) AS pendingAmount FROM sales WHERE id = ?;`,
  add: `
    CALL usp_CreateNewSale(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,
  update: `
    UPDATE sales
    SET
      locationId = IFNULL(?, locationId),
      customerId = IFNULL(?, customerId),
      docType = IFNULL(?, docType),
      docDatetime = IFNULL(?, docDatetime),
      docNumber = IFNULL(?, docNumber),
      total = IFNULL(?, total),
      createdBy = IFNULL(?, createdBy)
    WHERE
      id = ?;
  `,
  remove: `
    UPDATE sales SET isActive = 0 WHERE id = ?;
    UPDATE saledetails SET isActive = 0 WHERE saleId = ?;
  `,
  validateDocNumber: `
    SELECT fn_validatedocnumber(?, ?, ?) AS validated;
  `,
  voidSale: `CALL usp_VoidSale(?, ?);`,
  details: {
    findBySaleId: `
      SELECT *
      FROM vw_saledetails
      WHERE saleId = ? AND isActive = 1;
    `,
    add: `INSERT INTO saledetails (saleId, productId, unitPrice, quantity) VALUES ?;`,
    update: `
      UPDATE saledetails
      SET
        saleId = IFNULL(?, saleId),
        productId = IFNULL(?, productId),
        unitPrice = IFNULL(?, unitPrice),
        quantity = IFNULL(?, quantity)
      WHERE
        id = ?;
    `,
    remove: `UPDATE saledetails SET isActive = 0 WHERE id = ?;`
  },
  payments: {
    add: `
      CALL usp_CreateNewSalePayment (?, ?, ?, UTC_TIMESTAMP(), ?, ?);
    `
  }
}

controller.find = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.find, [], res));
}

controller.findById = (req, res) => {
  const { saleId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findById, [ saleId || 0 ], res));
}

controller.findByLocationCurrentActiveShiftcut = (req, res) => {
  const { locationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByLocationCurrentActiveShiftcut, [ locationId || 0 ], res));
}

controller.findByMyCashier = (req, res) => {
  const { cashierId } = req.params;
  console.log(cashierId);
  req.getConnection(connUtil.connFunc(queries.findByMyCashier, [ cashierId || 0 ], res));
}

controller.findPendings = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findPendings, [], res));
}

controller.findPendingsByLocation = (req, res) => {
  const { locationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findPendingsByLocation, [ locationId ], res));
}

controller.findPendingAmountToPay = (req, res) => {
  const { saleId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findPendingAmountToPay, [ saleId ], res));
}

controller.add = (req, res) => {
  const { idtoauth } = req.headers;
  const {
    locationId,
    customerId,
    documentTypeId,
    paymentTypeId,
    paymentMethodId,
    docDatetime,
    docNumber,
    total,
    cashierId,
    IVAretention,
    IVAperception,
    expirationDays,
    bankId,
    referenceNumber,
    accountNumber,
    userPINCode
  } = req.body;

  req.getConnection(
    connUtil.connSPFunc(
      queries.add,
      [
        locationId || 1,
        customerId,
        documentTypeId,
        paymentTypeId,
        paymentMethodId || 1,
        docDatetime,
        docNumber,
        total,
        cashierId,
        idtoauth,
        IVAretention || 0,
        IVAperception || 0,
        expirationDays || null,
        bankId || null,
        referenceNumber || null,
        accountNumber || null,
        userPINCode
      ],
      res
    )
  );
}

controller.validateDocNumber = (req, res) => {
  const { documentType, docNumber, cashierId } = req.body;
  req.getConnection(connUtil.connFunc(queries.validateDocNumber, [ documentType, docNumber, cashierId ], res));
}

controller.update = (req, res) => {
  const { idtoauth } = req.headers;
  const { locationId, customerId, docType, docDatetime, docNumber, total, saleId } = req.body;
  req.getConnection(connUtil.connFunc(queries.update, [ locationId, customerId, docType, docDatetime, docNumber, total, idtoauth, saleId || 0 ], res));
}

controller.remove = (req, res) => {
  const { saleId } = req.params;
  req.getConnection(connUtil.connFunc(queries.remove, [ saleId || 0, saleId || 0 ], res));
}

controller.voidSale = (req, res) => {
  const { userId, saleId } = req.body;
  req.getConnection(connUtil.connSPFunc(queries.voidSale, [ userId, saleId ], res));
}

// SALE DETAILS

controller.details = {};

controller.details.findBySaleId = (req, res) => {
  const { saleId } = req.params;
  req.getConnection(connUtil.connFunc(queries.details.findBySaleId, [ saleId || 0 ], res));
}

// EXPECTED req.body => details = [[saleId, productId, unitPrice, quantity], [...]]
controller.details.add = (req, res) => {
  const { bulkData } = req.body;
  req.getConnection(connUtil.connFunc(queries.details.add, [ bulkData ], res));
}

controller.details.update = (req, res) => {
  const { saleId, productId, unitPrice, quantity, saleDetailId } = req.body;
  req.getConnection(connUtil.connFunc(queries.details.update, [ saleId, productId, unitPrice, quantity, saleDetailId ], res));
}

controller.details.remove = (req, res) => {
  const { saleDetailId } = req.params;
  req.getConnection(connUtil.connFunc(queries.details.remove, [ saleDetailId || 0 ], res));
}

controller.payments = {};

controller.payments.add = (req, res) => {
  const { idtoauth } = req.headers;
  const { locationId, cashierId, saleId, paymentAmount } = req.body;
  console.log(req.body);
  req.getConnection(connUtil.connFunc(queries.payments.add, [ locationId, cashierId, idtoauth, saleId , paymentAmount ], res));
}

export default controller;
