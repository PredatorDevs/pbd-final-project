import connUtil from "../helpers/connectionUtil.js";

const controller = {};

const queries = {
  find: `SELECT * FROM vw_shitfcuts;`,
  findById: `SELECT * FROM vw_shitfcuts WHERE shiftcutId = ?;`,
  settlements: `
    SELECT shiftcutId, shiftcutNumber, openedAt, closedAt, initialAmount, finalAmount, remittedAmount, shiftcutDatetime FROM vw_shitfcuts
    WHERE shiftcutStatus = 2
    ORDER BY shiftcutId DESC;
  `,
  settlementsById: `
    CALL usp_SettlementByShiftcut(?);
  `,
  settlementsByLocation: `
    SELECT 
      cashierName, shiftcutId, shiftcutNumber, openedAt, closedAt, 
      initialAmount, finalAmount, remittedAmount, shiftcutDatetime,
      locationName
    FROM 
      vw_shitfcuts
    WHERE 
      locationId = ?
      AND shiftcutStatus = 2
    ORDER BY
      shiftcutId DESC;
  `,
  settlementsOrderSaleById: `
    CALL usp_SettlementOrderSaleByShiftcut(?);
  `,
}

controller.find = (req, res) => req.getConnection(connUtil.connFunc(queries.find, [], res));

controller.findById = (req, res) => {
  const { shiftcutId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findById, [ shiftcutId ], res));
}

controller.settlements = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.settlements, [ ], res));
}

controller.settlementsById = (req, res) => {
  const { shiftcutId } = req.params;
  req.getConnection(connUtil.connFunc(queries.settlementsById, [ shiftcutId ], res));
}

controller.settlementsByLocation = (req, res) => {
  const { locationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.settlementsByLocation, [ locationId ], res));
}

controller.settlementsOrderSaleById = (req, res) => {
  const { shiftcutId } = req.params;
  req.getConnection(connUtil.connFunc(queries.settlementsOrderSaleById, [ shiftcutId ], res));
}

export default controller;
