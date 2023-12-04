import connUtil from "../helpers/connectionUtil.js";

const controller = {};

const queries = {
  find: `
    SELECT * FROM vw_rawmaterialpurchases;
  `,
  findRecents: `
    SELECT * FROM vw_rawmaterialpurchases
    ORDER BY
      docDatetime
    DESC
    LIMIT 10;
  `,
  findById: `
    SELECT * FROM vw_rawmaterialpurchases WHERE id = ?;
  `,
  findResume: `
    SELECT
      COUNT(id) AS PurchaseQuantity,
      COALESCE(SUM(total),0) AS PurchaseTotal
    FROM
      rawmaterialpurchases
    WHERE
      isActive = 1;
  `,
  add: `
    CALL usp_CreateNewRawMaterialPurchase(?, ?, ?, ?, ?, ?);
  `,
  update: `
    UPDATE 
      rawmaterialpurchases 
    SET 
      supplierId = IFNULL(?, supplierId), 
      docDatetime = IFNULL(?, docDatetime), 
      docNumber = IFNULL(?, docNumber),
      total = IFNULL(?, total)
    WHERE
      id = ?;
  `,
  remove: `
    UPDATE 
      rawmaterialpurchases 
    SET 
      isActive = 0 
    WHERE 
      id = ?;
    UPDATE 
      rawmaterialpurchasedetails 
    SET 
      isActive = 0 
    WHERE 
      rawMaterialPurchaseId = ?;
  `,
  details: {
    findByRawMaterialPurchaseId: `
      SELECT * FROM vw_rawmaterialpurchasedetails WHERE rawMaterialPurchaseId = ?;
    `,
    add: `
      INSERT INTO rawmaterialpurchasedetails (
        rawMaterialPurchaseId, 
        rawMaterialId,
        unitCost,
        quantity
      ) VALUES ?;
    `,
    update: `
      UPDATE
        rawmaterialpurchasedetails
      SET
        rawMaterialPurchaseId = IFNULL(?, rawMaterialPurchaseId),
        rawMaterialId = IFNULL(?, rawMaterialId),
        unitCost = IFNULL(?, unitCost),
        quantity = IFNULL(?, quantity)
      WHERE
        id = ?;
    `,
    remove: `UPDATE rawmaterialpurchasedetails SET isActive = 0 WHERE id = ?;`
  }
}

controller.find = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.find, [], res));
}

controller.findResume = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findResume, [], res));
}

controller.findRecents = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findRecents, [], res));
}

controller.findById = (req, res) => {
  const { rawMaterialPurchaseId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findById, [ rawMaterialPurchaseId ], res));
}

controller.add = (req, res) => {
  const { idtoauth } = req.headers;
  const { locationId, supplierId, docDatetime, docNumber, total } = req.body;
  req.getConnection(connUtil.connSPFunc(queries.add, [ locationId, supplierId, idtoauth, docDatetime, docNumber, total ], res));
}

controller.update = (req, res) => {
  const { supplierId, docDatetime, docNumber, total, rawMaterialPurchaseId } = req.body;
  req.getConnection(connUtil.connFunc(queries.update, [ supplierId, docDatetime, docNumber, total, rawMaterialPurchaseId || 0 ], res));
}

controller.remove = (req, res) => {
  const { rawMaterialPurchaseId } = req.params;
  req.getConnection(connUtil.connFunc(queries.remove, [ rawMaterialPurchaseId || 0, rawMaterialPurchaseId || 0 ], res));
}

// RAW MATERIAL DETAIL PURCHASES

controller.details = {};

controller.details.findByRawMaterialPurchaseId = (req, res) => {
  const { rawMaterialPurchaseId } = req.params;
  req.getConnection(connUtil.connFunc(queries.details.findByRawMaterialPurchaseId, [ rawMaterialPurchaseId || 0 ], res));
}

// EXPECTED req.body => details = [[rawMaterialPurchaseId, rawMaterialId, unitCost, quantity], [...]]
controller.details.add = (req, res) => {
  const { bulkData } = req.body;
  req.getConnection(connUtil.connFunc(queries.details.add, [ bulkData ], res));
}

controller.details.update = (req, res) => {
  const { rawMaterialPurchaseId, rawMaterialId, unitCost, quantity, rawMaterialPurchaseDetailId } = req.body;
  req.getConnection(connUtil.connFunc(queries.details.update, [ rawMaterialPurchaseId, rawMaterialId, unitCost, quantity, rawMaterialPurchaseDetailId || 0 ], res));
}

controller.details.remove = (req, res) => {
  const { rawMaterialPurchaseDetailId } = req.params;
  req.getConnection(connUtil.connFunc(queries.details.remove, [ rawMaterialPurchaseDetailId || 0 ], res));
}

export default controller;
