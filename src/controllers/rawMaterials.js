import connUtil from "../helpers/connectionUtil.js";

const controller = {};

const queries = {
  find: `SELECT id, name, cost FROM rawmaterials WHERE isActive = 1;`,
  findByLocationStockData: `
    SELECT rawmaterials.id, rawmaterials.name, rawmaterials.cost,
    (SELECT stock FROM rawmaterialstocks WHERE rawMaterialId = rawmaterials.id AND locationId = ?) AS currentLocationStock
    FROM rawmaterials WHERE isActive = 1;  
  `,
  findCurrentStock: `
    SELECT * FROM vw_rawmaterialcurrentstocks
    ORDER BY rawMaterialName;
  `,
  add: `INSERT INTO rawmaterials (name, cost) VALUES (?, ?);`,
  update: `UPDATE rawmaterials SET name = IFNULL(?, name), cost = IFNULL(?, cost) WHERE id = ?;`,
  remove: `UPDATE rawmaterials SET isActive = 0 WHERE id = ?;`,
  stocks: {
    findByRawMaterialId: `SELECT * FROM vw_rawmaterialstocks WHERE rawMaterialId = ?;`,
    updateById: `UPDATE rawmaterialstocks SET initialStock = ?, stock = ? WHERE id = ?;`
  },
}

controller.find = (req, res) => req.getConnection(connUtil.connFunc(queries.find, [], res));

controller.findByLocationStockData = (req, res) => {
  const { locationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByLocationStockData, [ locationId || 0 ], res));
}

controller.findCurrentStock = (req, res) => req.getConnection(connUtil.connFunc(queries.findCurrentStock, [], res));

controller.add = (req, res) => {
  const { name, cost } = req.body;
  req.getConnection(connUtil.connFunc(queries.add, [ name, cost ], res));
}

controller.update = (req, res) => {
  const { name, cost, rawMaterialId } = req.body;
  req.getConnection(connUtil.connFunc(queries.update, [ name, cost, rawMaterialId || 0 ], res));
}

controller.remove = (req, res) => {
  const { rawMaterialId } = req.params;
  req.getConnection(connUtil.connFunc(queries.remove, [ rawMaterialId || 0, rawMaterialId || 0 ], res));
}

// RAW MATERIAL STOCKS

controller.stocks = {};

controller.stocks.findByRawMaterialId = (req, res) => {
  const { rawMaterialId } = req.params;
  req.getConnection(connUtil.connFunc(queries.stocks.findByRawMaterialId, [ rawMaterialId || 0 ], res));
}

controller.stocks.updateById = (req, res) => {
  const { initialStock, stock, rawMaterialStockId } = req.body;
  req.getConnection(connUtil.connFunc(queries.stocks.updateById, [ initialStock || 0, stock || 0, rawMaterialStockId || 0 ], res));
}

export default controller;
