import connUtil from "../helpers/connectionUtil.js";

const controller = {};

const queries = {
  find: `SELECT * FROM vw_rawmaterialrequisitions;`,
  findRecents: `SELECT * FROM vw_rawmaterialrequisitions ORDER BY rawMaterialRequisitionId DESC LIMIT 25;`,
  findById: `SELECT * FROM vw_rawmaterialrequisitions WHERE rawMaterialRequisitionId = ?;`,
  findByLocationCurrentActiveShiftcut: `SELECT * FROM vw_rawmaterialrequisitions WHERE shiftcutId = fn_getlocationcurrentactiveshiftcut(?);`,
  findByRangeDate: `SELECT * FROM vw_rawmaterialrequisitions WHERE DATE_FORMAT(docDatetime, "%Y-%m-%d") BETWEEN ? AND ?;`,
  findByLocationRangeDate: `SELECT * FROM vw_rawmaterialrequisitions WHERE locationId = ? AND DATE_FORMAT(docDatetime, "%Y-%m-%d") BETWEEN ? AND ?;`,
  add: `
    CALL usp_CreateNewRawMaterialRequisition(?, ?, ?, ?, ?);
  `,
  update: `
    UPDATE 
      rawmaterialrequisitions
    SET
      docDatetime = IFNULL(?, docDatetime),
      docNumber = IFNULL(?, docNumber),
      registeredBy = IFNULL(?, registeredBy),
      givenBy = IFNULL(?, givenBy),
      receivedBy = IFNULL(?, receivedBy)
    WHERE
      id = ?;
  `,
  remove: `
    UPDATE rawmaterialrequisitions SET isActive = 0 WHERE id = ?;
    UPDATE rawmaterialrequisitiondetails SET isActive = 0 WHERE rawMaterialRequisitionId = ?;
  `,
  details: {
    findByRawMaterialRequisitionId: `
      SELECT 
        reqdet.id, 
        reqdet.rawMaterialRequisitionId, 
        reqdet.rawMaterialId,
        material.name AS rawMaterialName,
        reqdet.quantity
      FROM 
        rawmaterialrequisitiondetails reqdet
        INNER JOIN rawmaterials material ON reqdet.rawMaterialId = material.id
      WHERE 
        reqdet.rawMaterialRequisitionId = ?
        AND reqdet.isActive = 1;
    `,
    add: `
      INSERT INTO rawmaterialrequisitiondetails (rawMaterialRequisitionId, rawMaterialId, quantity) VALUES ?;
    `,
    update: `
      UPDATE
        rawmaterialrequisitiondetails
      SET
        rawMaterialRequisitionId = IFNULL(?, rawMaterialRequisitionId),
        rawMaterialId = IFNULL(?, rawMaterialId),
        quantity = IFNULL(?, quantity)
      WHERE
        id = ?;
    `,
    remove: `UPDATE rawmaterialrequisitiondetails SET isActive = 0 WHERE id = ?;`
  }
}

controller.find = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.find, [], res));
}

controller.findRecents = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findRecents, [], res));
}

controller.findById = (req, res) => {
  const { rawMaterialRequisitionId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findById, [ rawMaterialRequisitionId ], res));
}

controller.findByLocationCurrentActiveShiftcut = (req, res) => {
  const { locationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByLocationCurrentActiveShiftcut, [ locationId ], res));
}

controller.findByRangeDate = (req, res) => {
  const { initialDate, finalDate } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByRangeDate, [ initialDate, finalDate ], res));
}

controller.findByLocationRangeDate = (req, res) => {
  const { locationId, initialDate, finalDate } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByLocationRangeDate, [ locationId, initialDate, finalDate ], res));
}

controller.add = (req, res) => {
  const { locationId, registeredBy, givenBy, receivedBy, docDatetime } = req.body;
  req.getConnection(connUtil.connSPFunc(queries.add, [ locationId, registeredBy, givenBy, receivedBy, docDatetime ], res));
}

controller.update = (req, res) => {
  const { docDatetime, docNumber, registeredBy, givenBy, receivedBy, rawMaterialRequisitionId } = req.body;
  req.getConnection(connUtil.connFunc(queries.update, [ docDatetime, docNumber, registeredBy, givenBy, receivedBy, rawMaterialRequisitionId || 0 ], res));
}

controller.remove = (req, res) => {
  const { rawMaterialRequisitionId } = req.params;
  req.getConnection(connUtil.connFunc(queries.remove, [ rawMaterialRequisitionId || 0, rawMaterialRequisitionId || 0 ], res));
}

// RAW MATERIAL DETAIL REQUISITION

controller.details = {};

controller.details.findByRawMaterialRequisitionId = (req, res) => {
  const { rawMaterialRequisitionId } = req.params;
  req.getConnection(connUtil.connFunc(queries.details.findByRawMaterialRequisitionId, [ rawMaterialRequisitionId || 0 ], res));
}

// EXPECTED req.body => details = [[rawMaterialRequisitionId, rawMaterialId, quantity], [...]]
controller.details.add = (req, res) => {
  const { bulkData } = req.body;
  req.getConnection(connUtil.connFunc(queries.details.add, [ bulkData ], res));
}

controller.details.update = (req, res) => {
  const { rawMaterialRequisitionId, rawMaterialId, quantity, rawMaterialRequisitionDetailId } = req.body;
  req.getConnection(connUtil.connFunc(queries.details.update, [ rawMaterialRequisitionId, rawMaterialId, quantity, rawMaterialRequisitionDetailId || 0 ], res));
}

controller.details.remove = (req, res) => {
  const { rawMaterialRequisitionDetailId } = req.params;
  req.getConnection(connUtil.connFunc(queries.details.remove, [ rawMaterialRequisitionDetailId || 0 ], res));
}

export default controller;
