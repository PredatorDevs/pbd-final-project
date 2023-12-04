import connUtil from "../helpers/connectionUtil.js";

const controller = {};

const queries = {
  findBanks: `SELECT id, name FROM banks WHERE isActive = 1 ORDER BY name;`,
  findDocumentTypes: `SELECT id, name, enableForSales, enableForPurchases FROM documenttypes WHERE isActive = 1;`,
  findPaymentMethods: `SELECT id, name FROM paymentmethods WHERE isActive = 1;`,
  findPaymentTypes: `SELECT id, name FROM paymenttypes WHERE isActive = 1;`,
  validatePolicyDocNumber: `SELECT fn_validatepolicydocnumber(?) AS validated;`,
  findDepartments: `SELECT departmentId, departmentName, departmentZone FROM vw_cities GROUP BY departmentId, departmentName, departmentZone;`,
  findTaxes: `SELECT * FROM taxes;`,
  findCities: `SELECT departmentId, cityId, cityName FROM vw_cities;`,
  findPackageTypes: `SELECT id, name FROM packagetypes WHERE isActive = 1;`
}

controller.findBanks = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findBanks, [], res));
}

controller.findDocumentTypes = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findDocumentTypes, [], res));
}

controller.findPaymentMethods = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findPaymentMethods, [], res));
}

controller.findPaymentTypes = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findPaymentTypes, [], res));
}

controller.validatePolicyDocNumber = (req, res) => {
  const { docNumber } = req.body;
  req.getConnection(connUtil.connFunc(queries.validatePolicyDocNumber, [ docNumber ], res));
}

controller.findDepartments = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findDepartments, [], res));
}

controller.findTaxes = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findTaxes, [], res));
}

controller.findCities = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findCities, [], res));
}

controller.findPackageTypes = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.findPackageTypes, [], res));
}

export default controller;
