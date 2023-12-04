import connUtil from "../helpers/connectionUtil.js";

const controller = {};

const queries = {
  // find: `SELECT * FROM vw_productstocks;`,
  find: `SELECT * FROM vw_products;`,
  findByLocationStockData: `
    SELECT vw_products.*,
    ROUND((SELECT stock FROM productstocks WHERE productId = vw_products.productId AND locationId = ?), 2) AS currentLocationStock
    FROM vw_products;
  `,
  findTaxesByProductId: `SELECT taxesData FROM vw_products WHERE productId = ?`,
  findByMultipleParams: `
    SELECT
      prd.*,
      (
        SELECT ROUND(stock, 2) AS stock
        FROM vw_productstocks
        WHERE locationId = ?
        AND productId = prd.productId
      ) AS currentStock
    FROM
      vw_products prd
    WHERE
      (
        productId LIKE ?
        OR productName LIKE ?
        OR productBarcode = ?
      ) AND (
        (? = 0)
        OR
        (? = 1 AND productIsService != 1)
      );
  `,
  findLocationStockCheck: `
    SELECT
      vw_ps.productStockId,
      vw_ps.productName,
      (
        SELECT propri.price 
        FROM productprices propri
        WHERE propri.productId = vw_ps.productId
        ORDER BY propri.id
        LIMIT 1
      ) AS price1,
      (
        SELECT propri.price 
        FROM productprices propri
        WHERE propri.productId = vw_ps.productId
        ORDER BY propri.id
        LIMIT 1, 1
      ) AS price2,
      (
        SELECT propri.price 
        FROM productprices propri
        WHERE propri.productId = vw_ps.productId
        ORDER BY propri.id
        LIMIT 2, 1
      ) AS price3,
      ROUND(vw_ps.stock, 2) AS stock
    FROM
      vw_productstocks vw_ps
    WHERE
      vw_ps.locationId = ?
      AND (SELECT prd.isActive FROM products prd WHERE prd.id = vw_ps.productId) = 1
    ORDER BY
      vw_ps.productName;
  `,
  add: `
    INSERT INTO products (
      name,
      brandId,
      categoryId,
      ubicationId,
      measurementUnitId,
      barcode,
      cost,
      isService,
      isTaxable,
      enabledForProduction,
      packageContent
    ) 
    VALUES (
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?
    );
  `,
  update: `
    UPDATE
      products
    SET
      name = IFNULL(?, name),
      brandId = IFNULL(?, brandId),
      categoryId = IFNULL(?, categoryId),
      ubicationId = IFNULL(?, ubicationId),
      measurementUnitId = IFNULL(?, measurementUnitId),
      barcode = IFNULL(?, barcode),
      cost = IFNULL(?, cost),
      isService = IFNULL(?, isService),
      isTaxable = IFNULL(?, isTaxable),
      enabledForProduction = IFNULL(?, enabledForProduction),
      packageContent = IFNULL(?, packageContent)
    WHERE
      id = ?;
  `,
  remove: `
    UPDATE products SET isActive = 0 WHERE id = ?;
    UPDATE productprices SET isActive = 0 WHERE productId = ?;
  `,
  checkAvailability: `
    SELECT fn_checkifproductisavailable(?, ?, ?) AS isAvailable;
  `,
  stocks: {
    findByProductId: `
      SELECT 
        *
      FROM
        vw_productstocks
      WHERE
        productId = ?;
    `,
    updateById: `
      UPDATE
        productstocks
      SET
        initialStock = ?,
        stock = ?
      WHERE
        id = ?;
    `
  },
  prices: {
    findByProductId: `
      SELECT
        id,
        productId,
        ROUND(price, 2) AS price,
        ROUND(profitRate, 2) AS profitRate,
        profitRateFixed,
        isDefault 
      FROM
        productprices
      WHERE
        productId = ?
      AND
        isActive = 1;
    `,
    add: `
      INSERT INTO productprices (productId, price, profitRate, profitRateFixed) VALUES ?;`,
    update: `
      UPDATE
        productprices
      SET
        price = IFNULL(?, price),
        profitRate = IFNULL(?, profitRate),
        profitRateFixed = IFNULL(?, profitRateFixed),
        updatedAt = NOW()
      WHERE
        id = ?;
    `,
    remove: `UPDATE productprices SET isActive = 0, updatedAt = NOW() WHERE id = ?;`
  },
  packageConfigs: {
    findByProductId: `
      SELECT * FROM vw_productpackageconfigs WHERE productId = ?;
    `,
    add: `
      INSERT INTO productpackageconfig (packageTypeId, productId, measurementUnitId, quantity, createAt, isActive)
      VALUES (?, ?, ?, ?, utc_timestamp(), 1);
    `,
    remove: `
      UPDATE productpackageconfig SET isActive = 0 WHERE id = ?;
    `
  }
}

controller.find = (req, res) => {
  req.getConnection(connUtil.connFunc(queries.find, [], res));
}

controller.findTaxesByProductId = (req, res) => {
  const { productId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findTaxesByProductId, [ productId || 0 ], res));
}

controller.findByLocationStockData = (req, res) => {
  const { locationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByLocationStockData, [ locationId || 0 ], res));
}

controller.findByMultipleParams = (req, res) => {
  const { locationId, productFilterParam, excludeServices } = req.params;
  req.getConnection(connUtil.connFunc(queries.findByMultipleParams, [ locationId || 0, `%${productFilterParam}%` || '', `%${productFilterParam}%` || '', productFilterParam || '', excludeServices || 0, excludeServices || 0 ], res));
}

controller.findLocationStockCheck = (req, res) => {
  const { locationId } = req.params;
  req.getConnection(connUtil.connFunc(queries.findLocationStockCheck, [ locationId || 0 ], res));
}

controller.add = (req, res) => {
  const {
    name,
    brandId,
    categoryId,
    ubicationId,
    measurementUnitId,
    barcode,
    cost,
    isService,
    isTaxable,
    enabledForProduction,
    packageContent
  } = req.body;

  req.getConnection(
    connUtil.connFunc(
      queries.add,
      [
        name,
        brandId,
        categoryId,
        ubicationId,
        measurementUnitId,
        barcode || null,
        cost,
        isService,
        isTaxable,
        enabledForProduction,
        packageContent || 1
      ],
      res
    )
  );
}

controller.update = (req, res) => {
  const {
    name,
    brandId,
    categoryId,
    ubicationId,
    measurementUnitId,
    barcode,
    cost,
    isService,
    isTaxable,
    enabledForProduction,
    packageContent,
    productId
  } = req.body;

  req.getConnection(
    connUtil.connFunc(
      queries.update, 
      [
        name,
        brandId,
        categoryId,
        ubicationId,
        measurementUnitId,
        barcode,
        cost,
        isService,
        isTaxable,
        enabledForProduction,
        packageContent || 1,
        productId || 0
      ],
      res
    )
  );
}

controller.remove = (req, res) => {
  const { productId } = req.params;
  req.getConnection(connUtil.connFunc(queries.remove, [ productId || 0, productId || 0 ], res));
}

controller.checkAvailability = (req, res) => {
  const { locationId, productId, quantity } = req.params;
  req.getConnection(connUtil.connFunc(queries.checkAvailability, [ locationId || 0, productId || 0, quantity || 0 ], res));
}

// PRODUCT LOCATION STOCKS

controller.stocks = {};

controller.stocks.findByProductId = (req, res) => {
  const { productId } = req.params;
  req.getConnection(connUtil.connFunc(queries.stocks.findByProductId, [ productId || 0 ], res));
}

controller.stocks.updateById = (req, res) => {
  const { initialStock, stock, productStockId } = req.body;
  req.getConnection(connUtil.connFunc(queries.stocks.updateById, [ initialStock || 0, stock || 0, productStockId || 0 ], res));
}

// PRODUCT PRICES

controller.prices = {};

controller.prices.findByProductId = (req, res) => {
  const { productId } = req.params;
  req.getConnection(connUtil.connFunc(queries.prices.findByProductId, [ productId || 0 ], res));
}

// EXPECTED req.body => prices = [[productId, price, profitRate, profitRateFixed], [...]]
controller.prices.add = (req, res) => {
  const { bulkData } = req.body;
  req.getConnection(connUtil.connFunc(queries.prices.add, [ bulkData ], res));
}

controller.prices.update = (req, res) => {
  const { price, profitRate, profitRateFixed, productPriceId } = req.body;
  req.getConnection(connUtil.connFunc(queries.prices.update, [ price, profitRate, profitRateFixed, productPriceId || 0 ], res));
}

controller.prices.remove = (req, res) => {
  const { productPriceId } = req.params;
  req.getConnection(connUtil.connFunc(queries.prices.remove, [ productPriceId || 0 ], res));
}

controller.packageConfigs = {};

controller.packageConfigs.findByProductId = (req, res) => {
  const { productId } = req.params;
  req.getConnection(connUtil.connFunc(queries.packageConfigs.findByProductId, [ productId || 0 ], res));
}

controller.packageConfigs.add = (req, res) => {
  const { packageTypeId, productId, measurementUnitId, quantity } = req.body;
  req.getConnection(connUtil.connFunc(queries.packageConfigs.add, [ packageTypeId, productId, measurementUnitId, quantity ], res));
}

controller.packageConfigs.remove = (req, res) => {
  const { productPackageConfigId } = req.params;
  req.getConnection(connUtil.connFunc(queries.packageConfigs.remove, [ productPackageConfigId || 0 ], res));
}

export default controller;
