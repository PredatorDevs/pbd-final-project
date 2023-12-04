import connUtil from "../helpers/connectionUtil.js";
import errorResponses from "../helpers/errorResponses.js";

const controller = {};

const queries = {
  find: `
    SELECT * FROM vw_ordersales;
  `,
  findById: `
    SELECT * FROM vw_ordersales WHERE id = ?;
  `,
  findByLocationCurrentActiveShiftcut: `
    SELECT * FROM vw_ordersales WHERE shiftcutId = fn_getlocationcurrentactiveshiftcut(?)
    OR (locationId = ? AND status = 1);
  `,
  findByRangeDate: `SELECT * FROM vw_ordersales WHERE DATE_FORMAT(docDatetime, "%Y-%m-%d") BETWEEN ? AND ?;`,
  findByLocationRangeDate: `SELECT * FROM vw_ordersales WHERE locationId = ? AND DATE_FORMAT(docDatetime, "%Y-%m-%d") BETWEEN ? AND ?;`,
  findSettlementByRangeDate: `CALL usp_SettlementOrderSaleByRangeDate(?, ?);`,
  findSettlementByLocationRangeDate: `CALL usp_SettlementOrderSaleByLocationRangeDate(?, ?, ?);`,
  findRecents: `
    SELECT * FROM vw_ordersales
    ORDER BY ordersales.docDatetime DESC
    LIMIT 100;
  `,
  add: `
    CALL usp_CreateNewOrderSale(?, ?, ?, ?, ?, ?);
  `,
  update: `
    UPDATE ordersales
    SET
      locationId = IFNULL(?, locationId),
      customerId = IFNULL(?, customerId),
      docType = IFNULL(?, docType),
      docDatetime = IFNULL(?, docDatetime),
      status = IFNULL(?, status),
      total = IFNULL(?, total),
      createdBy = IFNULL(?, createdBy)
    WHERE
      id = ?;
  `,
  remove: `
    UPDATE ordersales SET isActive = 0 WHERE id = ?;
    UPDATE ordersaledetails SET isActive = 0 WHERE orderSaleId = ?;
  `,
  recalculateTotal: `
    CALL usp_RecalculateOrderSaleTotal(?);
  `,
  changeStatus: `UPDATE ordersales SET status = ? WHERE id = ?;`,
  details: {
    findByOrderSaleId: `
      SELECT 
        detail.id, 
        detail.orderSaleId, 
        detail.productId, 
        detail.unitPrice,
        detail.quantity,
        (detail.unitPrice * detail.quantity) AS subTotal, 
        prod.\`name\` as productName
      FROM
        ordersaledetails detail
        INNER JOIN products prod ON detail.productId = prod.id
      WHERE 
        detail.orderSaleId = ? AND detail.isActive = 1;
    `,
    add: `INSERT INTO ordersaledetails (orderSaleId, productId, unitPrice, quantity) VALUES ?;`,
    update: `
      UPDATE ordersaledetails
      SET
        orderSaleId = IFNULL(?, orderSaleId),
        productId = IFNULL(?, productId),
        unitPrice = IFNULL(?, unitPrice),
        quantity = IFNULL(?, quantity)
      WHERE
        id = ?;
    `,
    remove: `
      UPDATE ordersaledetails SET isActive = 0 WHERE id = ?;
    `
  },
  testHeaderQuery: `
    INSERT INTO tbl_test (name) VALUES ("Name");
  `,
  testDetailsQuery: `
    INSERT INTO tbl_test_details (tbl_test_id, namejlkjkljjlkjlk) VALUES ?;
  `
}

controller.find = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.find, [], res));
}

controller.findById = (req, res) => {
  const { orderSaleId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findById, [ orderSaleId || 0 ], res));
}

controller.findByLocationCurrentActiveShiftcut = (req, res) => {
  const { locationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByLocationCurrentActiveShiftcut, [ locationId || 0, locationId || 0 ], res));
}

controller.findByRangeDate = (req, res) => {
  const { initialDate, finalDate } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByRangeDate, [ initialDate, finalDate ], res));
}

controller.findByLocationRangeDate = (req, res) => {
  const { locationId, initialDate, finalDate } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByLocationRangeDate, [ locationId, initialDate, finalDate ], res));
}

controller.findSettlementByRangeDate = (req, res) => {
  const { initialDate, finalDate } = req.params;
  req.getConnection(connUtil.connFunc(queries.findSettlementByRangeDate, [ initialDate, finalDate ], res));
}

controller.findSettlementByLocationRangeDate = (req, res) => {
  const { locationId, initialDate, finalDate } = req.params;
  req.getConnection(connUtil.connFunc(queries.findSettlementByLocationRangeDate, [ locationId, initialDate, finalDate ], res));
}

controller.findRecents = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findRecents, [], res));
}

controller.add = (req, res) => {
  const { idtoauth } = req.headers;
  const { locationId, customerId, docType, docDatetime, total } = req.body;
  req.getConnection(connUtil.connSPFunc(queries.add, [ locationId || 1, customerId, docType || 1, docDatetime, total, idtoauth ], res));
}

controller.update = (req, res) => {
  const { idtoauth } = req.headers;
  const { locationId, customerId, docType, docDatetime, status, total, orderSaleId } = req.body;
  req.getConnection(connUtil.connFunc(queries.update, [ locationId, customerId, docType, docDatetime, status, total, idtoauth, orderSaleId || 0 ], res));
}

controller.changeStatus = (req, res) => {
  const { status, orderSaleId } = req.body;
  req.getConnection(connUtil.connFunc(queries.changeStatus, [ status || 1, orderSaleId || 0 ], res));
}

controller.remove = (req, res) => {
  const { orderSaleId } = req.params;
  req.getConnection(connUtil.connFunc(queries.remove, [ orderSaleId || 0, orderSaleId || 0 ], res));
}

controller.recalculateTotal = (req, res) => {
  const { orderSaleId } = req.params;
  req.getConnection(connUtil.connSPFunc(queries.recalculateTotal, [ orderSaleId || 0 ], res));
}

// SALE DETAILS

controller.details = {};

controller.details.findByOrderSaleId = (req, res) => {
  const { orderSaleId } = req.params;
  req.getConnection(connUtil.connFunc(queries.details.findByOrderSaleId, [ orderSaleId || 0 ], res));
}

// EXPECTED req.body => details = [[orderSaleId, productId, unitPrice, quantity], [...]]
controller.details.add = (req, res) => {
  const { bulkData } = req.body;
  req.getConnection(connUtil.connFunc(queries.details.add, [ bulkData ], res));
}

controller.details.update = (req, res) => {
  const { orderSaleId, productId, unitPrice, quantity, orderSaleDetailId } = req.body;
  req.getConnection(connUtil.connFunc(queries.details.update, [ orderSaleId, productId, unitPrice, quantity, orderSaleDetailId ], res));
}

controller.details.remove = (req, res) => {
  const { orderSaleDetailId } = req.params;
  req.getConnection(connUtil.connFunc(queries.details.remove, [ orderSaleDetailId || 0 ], res));
}

// ---

controller.bulkInsertAfterNormalInsert = (req, res) => {
  req.getConnection(((connectionError, connection) => {
    if (connectionError) res.status(400).json(errorResponses.status400(connectionError));
    else {
      connection.beginTransaction((transactionError) => {
        if (transactionError) res.status(400).json(errorResponses.status400(transactionError));
        else {
          const { name, data } = req.body;
          connection.query(
            queries.testHeaderQuery,
            [ name ],
            (err, results, fields) => {
              if (err) res.status(400).json(errorResponses.status400(err));
              else {
                const { insertId } = results;
                const fkAddedData = data.map((element) => [insertId, element[1]])
                connection.query(
                  queries.testDetailsQuery,
                  [ fkAddedData ],
                  (err, results, fields) => {
                    if (err) {
                      return connection.rollback((rollbackError) => {
                        res.status(400).json(errorResponses.status400([err, rollbackError]));
                      });
                    }
                    else {
                      connection.commit(function(err) {
                        if (err) {
                          return connection.rollback(function() {
                            res.status(400).json(errorResponses.status400(err));
                          });
                        }
                        res.json(results);
                      });
                    }
                  }
                );
              }
            }
          );
        }
      });
      
      // res.json("SUCCESFULLY TWO CONNS");
    }
  }));
}

export default controller;
