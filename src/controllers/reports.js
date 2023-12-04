import PdfPrinter from 'pdfmake';
import * as fs from 'fs';
import connUtil from "../helpers/connectionUtil.js";
import renders from "../helpers/pdfRendering.js";
import rendersAlt from "../helpers/pdfRenderingAlt.js";
import errorResponses from '../helpers/errorResponses.js';
import path from 'path';
import { fileURLToPath } from 'url';

const controller = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const queries = {
  kardexByProduct: `
    SELECT * FROM (
      SELECT
        log.id AS logId,
        IFNULL(policies.docNumber, '-') AS referenceNumber,
        IFNULL(policies.docDatetime, '1990-01-01 00:00:00') AS referenceDatetime,
        CONCAT("Ingreso de póliza #", IFNULL(policies.docNumber, '-')) AS concept,
        'Póliza' AS referenceType,
        0.00 AS sales,
        log.quantity AS purchases,
        log.newBalance AS balance
      FROM
        productstocklogs log
        INNER JOIN policies 
          ON log.referenceId = policies.id
        INNER JOIN policydetails 
          ON policies.id = policydetails.policyId
      WHERE
        log.productStockId = (
          SELECT id FROM productstocks WHERE locationId = ? AND productId = ? LIMIT 1
        )
        AND log.referenceType = 'policy'
        AND DATE_FORMAT(policies.docDatetime, "%Y-%m-%d") BETWEEN ? AND ?
      UNION
      SELECT
        log.id AS logId,
        IFNULL(sales.docNumber, '-') AS referenceNumber,
        IFNULL(sales.docDatetime, '1990-01-01 00:00:00') AS referenceDatetime,
        CONCAT("Venta #", IFNULL(sales.docNumber, '-')) AS concept,
        'Venta' AS referenceType,
        log.quantity AS sales,
        0.00 AS purchases,
        log.newBalance AS balance
      FROM
        productstocklogs log
        INNER JOIN sales 
          ON log.referenceId = sales.id
        INNER JOIN saledetails 
          ON sales.id = saledetails.saleId
      WHERE 
        log.productStockId = (
          SELECT id FROM productstocks WHERE locationId = ? AND productId = ? LIMIT 1
        )
        AND log.referenceType = 'sale'
        AND DATE_FORMAT(sales.docDatetime, "%Y-%m-%d") BETWEEN ? AND ?
    ) AS result
    ORDER BY result.referenceDatetime;
  `,
  getLocationProductsByCategory: `
    SELECT id, name FROM categories
    WHERE id IN (SELECT categoryId FROM products WHERE isActive = 1);
    SELECT
      productId,
      productName,
      packageContent,
      productCost,
      productCategoryId,
      ROUND((
        SELECT
          stock
        FROM
          productstocks
        WHERE
          productId = vw_products.productId
          AND locationId = ?
      ), 2) AS currentLocationStock
    FROM
      vw_products;
  `,
  getLocationProductsByBrand: `
    SELECT id, name FROM brands
    WHERE id IN (SELECT brandId FROM products WHERE isActive = 1);
    SELECT
      productId,
      productName,
      packageContent,
      productCost,
      productBrandId,
      ROUND((
        SELECT
          stock
        FROM
          productstocks
        WHERE
          productId = vw_products.productId
          AND locationId = ?
      ), 2) AS currentLocationStock
    FROM
      vw_products;
  `,
  shiftcutSettlement: `
    SELECT * FROM vw_shitfcuts WHERE shiftcutId = ?;
    CALL usp_ReportShiftcutSales(?);
    CALL usp_ShiftcutSummary(?);
    CALL usp_ShiftcutPayments(?);
    CALL usp_ShiftcutCashFundMovements(?);
  `
}

controller.testquery = (req, res) => {
  const { data } = req.body;
  req.getConnection(
    connUtil.connFunc(
      `SELECT * FROM testtable WHERE id = @param AND name = @param;`, 
      [
        data.id,
        data.name
      ], 
      res
    )
  );
}

controller.kardexByProduct = (req, res) => {
  const { locationId, productId, startDate, endDate } = req.params;
  req.getConnection(
    connUtil.connFunc(
      queries.kardexByProduct, 
      [
        locationId || 0, productId || 0, startDate, endDate, 
        locationId || 0, productId || 0, startDate, endDate
      ], 
      res
    )
  );
}

controller.createNewPdf = (req, res) => {
  try {
    renders.generateNewPdf();
    res.json({ status: 200, message: 'success' });
  } catch(error) {
    res.json({ status: 400, message: 'error' });
  }
}

controller.createNewPdfAlt = (req, res) => {
  try {
    rendersAlt.generateNewPdf();
    res.json({ status: 200, message: 'success' });
  } catch(error) {
    console.log(error);
    res.json({ status: 400, message: 'error' });
  }
}

controller.getPdf = (req, res) => {
  try {
    const file = fs.createReadStream(process.cwd() + '/src/pdfs/newpdfalt.pdf');
    const stat = fs.statSync(process.cwd() + '/src/pdfs/newpdfalt.pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
    file.pipe(res);
  } catch(error) {
    console.log(error);
    res.json({ status: 400, message: 'error' });
  }
}

controller.getLocationProductsByCategory = (req, res) => {
  let result = [];

  req.getConnection((error, conn) => {
    if (error) 
      res.status(500).json(errorResponses.status500(error));

    conn.beginTransaction((transactionError) => {
      if (transactionError) res.status(500).json(errorResponses.status500(error));

      const { locationId } = req.params;

      conn.query(
        queries.getLocationProductsByCategory,
        [ locationId ],
        (queryError, queryRows) => {
          if (queryError)
            conn.rollback(() => res.status(500).json(errorResponses.status500(queryError)));

          result = queryRows;

          conn.commit((commitError) => {
            if (commitError) conn.rollback(() => { res.status(500).json(errorResponses.status500(queryError)); });

            try {
              const categoriesData = result[0];
              const productsData = result[1];

              const fonts = {
                Roboto: {
                  normal: path.resolve(__dirname, '../fonts/Roboto-Regular.ttf'),
                  bold: path.resolve(__dirname, '../fonts/Roboto-Medium.ttf'),
                  italics: path.resolve(__dirname, '../fonts/Roboto-Italic.ttf'),
                  bolditalics: path.resolve(__dirname, '../fonts/Roboto-MediumItalic.ttf')
                }
              };

              console.log(process.cwd());
              
              const printer = new PdfPrinter(fonts);
          
              const bodyData = [];
              bodyData.push(['CODIGO', 'NOMBRE', 'EXISTENCIAS', 'CONTENIDO', 'GENERAL', 'COSTO', 'VALOR']);
          
              for(const category of (categoriesData || [])) {
                bodyData.push([
                  '',
                  { text: category?.name || '', bold: true, decoration: 'underline' },
                  '',
                  '',
                  '',
                  '',
                  ''
                ]);
                for(const product of (productsData || []).filter(x => x.productCategoryId === category.id)) {
                  bodyData.push([
                    product?.productId || 0,
                    product?.productName || '',
                    product?.currentLocationStock || 0,
                    product?.packageContent || 0,
                    ((+product?.currentLocationStock || 0) / (+product?.packageContent || 0)).toFixed(2),
                    product?.productCost || 0,
                    ((+product?.currentLocationStock || 0) * (+product?.productCost || 0)).toFixed(2)
                  ]);
                }
              }
          
              const docDefinition = {
                header: function(currentPage, pageCount, pageSize) {
                  // Podemos tener hasta cuatro líneas de encabezado de página
                  return [
                    { text: 'Reporte de Productos por Categoría', alignment: 'left', margin: [40, 30, 40, 0] },
                    { text: 'Todo Para Cake', alignment: 'left', margin: [40, 0, 40, 0] }
                    // { text: 'Reporte de Productos por Categoría', alignment: 'left', margin: [40, 0, 40, 0] },
                    // { text: 'Reporte de Productos por Categoría', alignment: 'left', margin: [40, 0, 40, 0] }
                  ]
                },
                footer: function(currentPage, pageCount) {
                  // Podemos tener hasta cuatro líneas de pie de página
                  return [
                    { text: `Sistema de Información Gerencial SigProCOM`, alignment: 'right', margin: [40, 0, 40, 0] },
                    { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] }
                    // { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] },
                    // { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] }
                  ]
                },
                content: [
                  {
                    layout: 'headerLineOnly', // optional
                    table: {
                      // Los encabezados se muestran automáticamente en todas las páginas en las que se extienda la tabla
                      // Puedes definir el número de filas que serán tratadas como encabezados de la tabla
                      headerRows: 1,
                      widths: ['10%', '40%', '10%', '10%', '10%', '10%', '10%'],
                      body: bodyData
                    }
                  }
                ],
                defaultStyle: {
                  font: 'Roboto',
                  fontSize: 6
                },
                pageSize: 'LETTER',
                pageMargins: [ 40, 60, 40, 60 ]
              };
              
              const options = {};

              const pdfDoc = printer.createPdfKitDocument(docDefinition, options);

              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'attachment; filename=bycategories.pdf');

              pdfDoc.pipe(res);
              pdfDoc.end();
            } catch(error) {
              res.json({ status: 400, message: 'error', errorContent: error });
            }
          });
        }
      );
    });
  });
}

controller.getLocationProductsByBrand = (req, res) => {
  let result = [];

  req.getConnection((error, conn) => {
    if (error) 
      res.status(500).json(errorResponses.status500(error));

    conn.beginTransaction((transactionError) => {
      if (transactionError) res.status(500).json(errorResponses.status500(error));

      const { locationId } = req.params;

      conn.query(
        queries.getLocationProductsByBrand,
        [ locationId ],
        (queryError, queryRows) => {
          if (queryError)
            conn.rollback(() => res.status(500).json(errorResponses.status500(queryError)));

          result = queryRows;

          conn.commit((commitError) => {
            if (commitError) conn.rollback(() => { res.status(500).json(errorResponses.status500(queryError)); });

            try {
              const brandsData = result[0];
              const productsData = result[1];

              const fonts = {
                // Roboto: {
                //   normal: process.cwd() + '/src/fonts/Roboto-Regular.ttf',
                //   bold: process.cwd() + '/src/fonts/Roboto-Medium.ttf',
                //   italics: process.cwd() + '/src/fonts/Roboto-Italic.ttf',
                //   bolditalics: process.cwd() + '/src/fonts/Roboto-MediumItalic.ttf'
                // },
                Roboto: {
                  normal: path.resolve(__dirname, '../fonts/Roboto-Regular.ttf'),
                  bold: path.resolve(__dirname, '../fonts/Roboto-Medium.ttf'),
                  italics: path.resolve(__dirname, '../fonts/Roboto-Italic.ttf'),
                  bolditalics: path.resolve(__dirname, '../fonts/Roboto-MediumItalic.ttf')
                }
              };

              const printer = new PdfPrinter(fonts);
          
              const bodyData = [];
              bodyData.push(['CODIGO', 'NOMBRE', 'EXISTENCIAS', 'CONTENIDO', 'GENERAL', 'COSTO', 'VALOR']);
          
              for(const brand of (brandsData || [])) {
                bodyData.push([
                  '',
                  { text: brand?.name || '', bold: true, decoration: 'underline' },
                  '',
                  '',
                  '',
                  '',
                  ''
                ]);
                for(const product of (productsData || []).filter(x => x.productBrandId === brand.id)) {
                  bodyData.push([
                    product?.productId || 0,
                    product?.productName || '',
                    product?.currentLocationStock || 0,
                    product?.packageContent || 0,
                    ((+product?.currentLocationStock || 0) / (+product?.packageContent || 0)).toFixed(2),
                    product?.productCost || 0,
                    ((+product?.currentLocationStock || 0) * (+product?.productCost || 0)).toFixed(2)
                  ]);
                }
              }
          
              const docDefinition = {
                header: function(currentPage, pageCount, pageSize) {
                  // Podemos tener hasta cuatro líneas de encabezado de página
                  return [
                    { text: 'Reporte de Productos por Marca', alignment: 'left', margin: [40, 30, 40, 0] },
                    { text: 'Todo Para Cake', alignment: 'left', margin: [40, 0, 40, 0] }
                    // { text: 'Reporte de Productos por Categoría', alignment: 'left', margin: [40, 0, 40, 0] },
                    // { text: 'Reporte de Productos por Categoría', alignment: 'left', margin: [40, 0, 40, 0] }
                  ]
                },
                footer: function(currentPage, pageCount) {
                  // Podemos tener hasta cuatro líneas de pie de página
                  return [
                    { text: `Sistema de Información Gerencial SigProCOM`, alignment: 'right', margin: [40, 0, 40, 0] },
                    { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] }
                    // { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] },
                    // { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] }
                  ]
                },
                content: [
                  {
                    layout: 'headerLineOnly', // optional
                    table: {
                      // Los encabezados se muestran automáticamente en todas las páginas en las que se extienda la tabla
                      // Puedes definir el número de filas que serán tratadas como encabezados de la tabla
                      headerRows: 1,
                      widths: ['10%', '40%', '10%', '10%', '10%', '10%', '10%'],
                      body: bodyData
                    }
                  }
                ],
                defaultStyle: {
                  font: 'Roboto',
                  fontSize: 6
                },
                pageSize: 'LETTER',
                pageMargins: [ 40, 60, 40, 60 ]
              };
              
              const options = {};

              const pdfDoc = printer.createPdfKitDocument(docDefinition, options);

              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'attachment; filename=bycategories.pdf');

              pdfDoc.pipe(res);
              pdfDoc.end();
            } catch(error) {
              res.json({ status: 400, message: 'error', errorContent: error });
            }
          });
        }
      );
    });
  });
}

controller.getLocationProductsByFilteredData = (req, res) => {
  try {
    const { productsData } = req.body;

    const fonts = {
      Roboto: {
        normal: path.resolve(__dirname, '../fonts/Roboto-Regular.ttf'),
        bold: path.resolve(__dirname, '../fonts/Roboto-Medium.ttf'),
        italics: path.resolve(__dirname, '../fonts/Roboto-Italic.ttf'),
        bolditalics: path.resolve(__dirname, '../fonts/Roboto-MediumItalic.ttf')
      }
    };

    console.log(process.cwd());
    
    const printer = new PdfPrinter(fonts);

    const bodyData = [];
    bodyData.push(['CODIGO', 'NOMBRE', 'EXISTENCIAS', 'CONTENIDO', 'GENERAL', 'COSTO', 'VALOR']);

    for(const product of (productsData || [])) {
      bodyData.push([
        product?.productId || 0,
        product?.productName || '',
        product?.currentLocationStock || 0,
        product?.packageContent || 0,
        ((+product?.currentLocationStock || 0) / (+product?.packageContent || 0)).toFixed(2),
        product?.productCost || 0,
        ((+product?.currentLocationStock || 0) * (+product?.productCost || 0)).toFixed(2)
      ]);
    }

    const docDefinition = {
      header: function(currentPage, pageCount, pageSize) {
        // Podemos tener hasta cuatro líneas de encabezado de página
        return [
          { text: 'Reporte de Productos (Filtro Personalizado)', alignment: 'left', margin: [40, 30, 40, 0] },
          { text: 'Todo Para Cake', alignment: 'left', margin: [40, 0, 40, 0] }
          // { text: 'Reporte de Productos por Categoría', alignment: 'left', margin: [40, 0, 40, 0] },
          // { text: 'Reporte de Productos por Categoría', alignment: 'left', margin: [40, 0, 40, 0] }
        ]
      },
      footer: function(currentPage, pageCount) {
        // Podemos tener hasta cuatro líneas de pie de página
        return [
          { text: `Sistema de Información Gerencial SigProCOM`, alignment: 'right', margin: [40, 0, 40, 0] },
          { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] }
          // { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] },
          // { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] }
        ]
      },
      content: [
        {
          layout: 'headerLineOnly', // optional
          table: {
            // Los encabezados se muestran automáticamente en todas las páginas en las que se extienda la tabla
            // Puedes definir el número de filas que serán tratadas como encabezados de la tabla
            headerRows: 1,
            widths: ['10%', '40%', '10%', '10%', '10%', '10%', '10%'],
            body: bodyData
          }
        }
      ],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 6
      },
      pageSize: 'LETTER',
      pageMargins: [ 40, 60, 40, 60 ]
    };
    
    const options = {};

    const pdfDoc = printer.createPdfKitDocument(docDefinition, options);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=bycategories.pdf');

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch(error) {
    res.json({ status: 400, message: 'error', errorContent: error });
  }
}

controller.shiftcutSettlement = (req, res) => {
  let result = [];

  req.getConnection((error, conn) => {
    if (error) 
      res.status(500).json(errorResponses.status500(error));

    conn.beginTransaction((transactionError) => {
      if (transactionError) res.status(500).json(errorResponses.status500(error));

      const { shiftcutId } = req.params;

      conn.query(
        queries.shiftcutSettlement,
        [ shiftcutId, shiftcutId, shiftcutId, shiftcutId, shiftcutId ],
        (queryError, queryRows) => {
          if (queryError)
            conn.rollback(() => res.status(500).json(errorResponses.status500(queryError)));

          result = queryRows;

          conn.commit((commitError) => {
            if (commitError) conn.rollback(() => { res.status(500).json(errorResponses.status500(queryError)); });

            try {
              // console.log(result[0]);
              /*
                [
                  {
                    id: 94,
                    isHeader: 0,
                    isFooter: 0,
                    saleId: 402,
                    docNumber: '',
                    documentTypeId: 2,
                    documentTypeName: '',
                    paymentTypeName: '',
                    customerId: 3735,
                    productId: 2910,
                    customerFullname: '',
                    productName: 'HARINA FUERTE - DEL PANADERO ',
                    totalSale: '24.00',
                    cashSale: '0.00',
                    creditSale: '24.00',
                    document: ' '
                  }
                ]
              */
              // console.log(result[2]);
              /*
              [
                {
                  movementType: 'Efectivo Inicial',
                  descrip: '',
                  totalAmount: '100.0000000000'
                }
              ]
              */
              // console.log(result[4]);
              /*
                [
                  {
                    paymentId: null,
                    docDatetime: null,
                    registeredByFullname: '',
                    saleId: null,
                    docNumber: null,
                    documentTypeId: null,
                    documentTypeName: null,
                    document: null,
                    customerId: null,
                    customerFullname: 'TOTAL',
                    totalPaid: null
                  }
                ]
              */

              const shiftcutData = result[0];
              const salesReportData = result[1];
              const summaryData = result[3];
              const paymentsData = result[5];
              const movementsData = result[7];

              const fonts = {
                Roboto: {
                  normal: path.resolve(__dirname, '../fonts/Roboto-Regular.ttf'),
                  bold: path.resolve(__dirname, '../fonts/Roboto-Medium.ttf'),
                  italics: path.resolve(__dirname, '../fonts/Roboto-Italic.ttf'),
                  bolditalics: path.resolve(__dirname, '../fonts/Roboto-MediumItalic.ttf')
                }
              };

              // console.log(process.cwd());
              
              const printer = new PdfPrinter(fonts);
          
              const summaryBodyData = [];
              summaryBodyData.push(['CONCEPTO', { text: 'MONTO' || '', bold: false, alignment: 'right' }]);
          
              const salesReportBodyData = [];
              salesReportBodyData.push(['DOCUMENTO', 'TIPO', 'CLIENTE', 'DESCRIPCIÓN', { text: 'MONTO' || '', bold: false, alignment: 'right' }]);

              const paymentsBodyData = [];
              paymentsBodyData.push(['REGISTRADO POR', 'DOCUMENTO', 'CLIENTE', { text: 'MONTO' || '', bold: false, alignment: 'right' }]);

              const movementsBodyData = [];
              movementsBodyData.push([
                'OPERACION',
                'POR',
                'RAZON',
                { text: 'ANTERIOR' || '', bold: false, alignment: 'right' },
                { text: 'MONTO' || '', bold: false, alignment: 'right' },
                { text: 'SALDO' || '', bold: false, alignment: 'right' }
              ]);
              
              let saleReportTotalSaleAmount = 0;
              for(const sale of (salesReportData || [])) {
                if (sale.saleId === null) {
                  saleReportTotalSaleAmount += +sale?.totalSale;
                }
                salesReportBodyData.push([
                  { text: sale?.document || '', bold: false },
                  { text: sale?.paymentTypeName || '', bold: false },
                  { text: sale?.customerFullname || '', bold: false },
                  { text: sale?.productName || '', bold: false },
                  { text: sale?.totalSale || '', bold: false, alignment: 'right' }
                ]);
              }

              salesReportBodyData.push([
                { text: '', bold: false },
                { text: '', bold: false },
                { text: '', bold: false },
                { text: 'TOTAL GENERAL', bold: false },
                { text: Number(saleReportTotalSaleAmount).toFixed(2) || '', bold: false, alignment: 'right' }
              ]);

              for(const concept of (summaryData || [])) {
                summaryBodyData.push([
                  { text: concept?.movementType || '', bold: false },
                  { text: Number(concept?.totalAmount).toFixed(2) || '', bold: false, alignment: 'right' }
                ]);
              }

              for(const payment of (paymentsData || [])) {
                paymentsBodyData.push([
                  { text: payment?.registeredByFullname || '', bold: false },
                  { text: payment?.document || '', bold: false },
                  { text: payment?.customerFullname || '', bold: false },
                  { text: Number(payment?.totalPaid).toFixed(2) || '', bold: false, alignment: 'right' }
                ]);
              }

              for(const movement of (movementsData || [])) {
                movementsBodyData.push([
                  { text: movement?.movementTypeName || '', bold: false },
                  { text: movement?.userPINCodeFullname || '', bold: false },
                  { text: movement?.comments || '', bold: false },
                  { text: Number(movement?.prevAmount).toFixed(2) || '', bold: false, alignment: 'right' },
                  { text: Number(movement?.amount).toFixed(2) || '', bold: false, alignment: 'right' },
                  { text: Number(movement?.newAmount).toFixed(2) || '', bold: false, alignment: 'right' }
                ]);
              }
          
              const docDefinition = {
                header: function(currentPage, pageCount, pageSize) {
                  // Podemos tener hasta cuatro líneas de encabezado de página
                  return [
                    { text: 'Reporte de Cierre de Caja', fontSize: 16, alignment: 'left', margin: [40, 30, 40, 0] },
                    { text: 'Todo Para Cake', alignment: 'left', margin: [40, 0, 40, 0] }
                    // { text: 'Reporte de Productos por Categoría', alignment: 'left', margin: [40, 0, 40, 0] },
                    // { text: 'Reporte de Productos por Categoría', alignment: 'left', margin: [40, 0, 40, 0] }
                  ]
                },
                footer: function(currentPage, pageCount) {
                  // Podemos tener hasta cuatro líneas de pie de página
                  return [
                    { text: `Sistema de Información Gerencial SigProCOM`, alignment: 'right', margin: [40, 0, 40, 0] },
                    { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] }
                    // { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] },
                    // { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] }
                  ]
                },
                content: [
                  { text: 'Información de cierre', fontSize: 13 },
                  { text: `${shiftcutData[0]?.cashierName} - Turno #${shiftcutData[0]?.shiftcutNumber}` },
                  { text: `Apertura`, bold: true },
                  { text: `${shiftcutData[0]?.openedAt} por ${shiftcutData[0]?.openedByFullname}` },
                  { text: `Cierre`, bold: true },
                  { text: `${shiftcutData[0]?.closedAt} por ${shiftcutData[0]?.closedByFullname}` },
                  { text: '-', fontSize: 13 },
                  { text: 'Resumen de caja', fontSize: 13 },
                  {
                    layout: 'headerLineOnly', // optional
                    table: {
                      // Los encabezados se muestran automáticamente en todas las páginas en las que se extienda la tabla
                      // Puedes definir el número de filas que serán tratadas como encabezados de la tabla
                      headerRows: 1,
                      widths: ['25%', '25%'],
                      body: [
                        ...summaryBodyData,
                        [
                          { text: 'Caja Chica Final', bold: false },
                          { text: Number(shiftcutData[0]?.cashFunds).toFixed(2) || '', bold: false, alignment: 'right' }
                        ],
                        [
                          { text: 'Efectivo Total Final', bold: false },
                          { text: Number(shiftcutData[0]?.finalAmount).toFixed(2) || '', bold: false, alignment: 'right' }
                        ],
                        [
                          { text: 'Efectivo a entregar', bold: false },
                          { text: Number(+shiftcutData[0]?.finalAmount - +shiftcutData[0]?.initialAmount - +shiftcutData[0]?.cashFunds).toFixed(2) || '', bold: false, alignment: 'right' }
                        ],
                        [
                          { text: 'Efectivo entregado', bold: false },
                          { text: Number(shiftcutData[0]?.remittedAmount).toFixed(2) || '', bold: false, alignment: 'right' }
                        ],
                        [
                          { text: 'Diferencia', bold: false },
                          { text: Number(+shiftcutData[0]?.remittedAmount - (+shiftcutData[0]?.finalAmount - +shiftcutData[0]?.initialAmount - +shiftcutData[0]?.cashFunds)).toFixed(2) || '', bold: false, alignment: 'right' }
                        ]
                      ]
                    }
                  },
                  { text: '-', fontSize: 13 },
                  { text: 'Resumen de ventas', fontSize: 13 },
                  {
                    layout: 'headerLineOnly', // optional
                    table: {
                      // Los encabezados se muestran automáticamente en todas las páginas en las que se extienda la tabla
                      // Puedes definir el número de filas que serán tratadas como encabezados de la tabla
                      headerRows: 1,
                      widths: ['10%', '10%', '30%', '40%', '10%'],
                      body: salesReportBodyData
                    }
                  },
                  { text: '-', fontSize: 13 },
                  { text: 'Resumen de abonos', fontSize: 13 },
                  {
                    layout: 'headerLineOnly', // optional
                    table: {
                      // Los encabezados se muestran automáticamente en todas las páginas en las que se extienda la tabla
                      // Puedes definir el número de filas que serán tratadas como encabezados de la tabla
                      headerRows: 1,
                      widths: ['20%', '20%', '40%', '20%'],
                      body: paymentsBodyData
                    }
                  },
                  { text: '-', fontSize: 13 },
                  { text: 'Movimientos de Caja Chica', fontSize: 13 },
                  {
                    layout: 'headerLineOnly', // optional
                    table: {
                      // Los encabezados se muestran automáticamente en todas las páginas en las que se extienda la tabla
                      // Puedes definir el número de filas que serán tratadas como encabezados de la tabla
                      headerRows: 1,
                      widths: ['10%', '20%', '40%', '10%', '10%', '10%'],
                      body: movementsBodyData
                    }
                  }
                ],
                defaultStyle: {
                  font: 'Roboto',
                  fontSize: 6
                },
                pageSize: 'LETTER',
                pageMargins: [ 40, 60, 40, 60 ]
              };
              
              const options = {};

              const pdfDoc = printer.createPdfKitDocument(docDefinition, options);

              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'attachment; filename=shiftcutsettlement.pdf');

              pdfDoc.pipe(res);
              pdfDoc.end();
            } catch(error) {
              res.json({ status: 400, message: 'error', errorContent: error });
            }
          });
        }
      );
    });
  });
}

export default controller;
