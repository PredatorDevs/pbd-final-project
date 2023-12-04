import express, { json, urlencoded, static as staticserve } from 'express';

import path from 'path';
import morgan from 'morgan';
import mysql2, { createPool } from 'mysql2';
import expMyConn from 'express-myconnection';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fileUpload from 'express-fileupload';

import { config } from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';

import ip from 'ip';
const { address } = ip;

import authRoutes from '../src/routes/authorizations.js';
import brandsRoutes from '../src/routes/brands.js';
import cashiersRoutes from '../src/routes/cashiers.js';
import categoriesRoutes from '../src/routes/categories.js';
import customersRoutes from '../src/routes/customers.js';
import deliveryRoutesRoutes from '../src/routes/deliveryRoutes.js';
import expensesRoutes from '../src/routes/expenses.js';
import generalsRoutes from '../src/routes/generals.js';
import locationsRoutes from '../src/routes/locations.js';
import mailsRoutes from '../src/routes/mails.js';
import measurementUnitsRoutes from '../src/routes/measurementUnits.js';
import orderSalesRoutes from '../src/routes/orderSales.js';
import parkingCheckoutsRoutes from '../src/routes/parkingCheckouts.js';
import parkingExpensesRoutes from '../src/routes/parkingExpenses.js';
import parkingReportsRoutes from '../src/routes/parkingReports.js';
import policiesRoutes from '../src/routes/policies.js';
import productionsRoutes from '../src/routes/productions.js';
import productPurchasesRoutes from '../src/routes/productPurchases.js';
import productsRoutes from '../src/routes/products.js';
import rawMaterialsRoutes from '../src/routes/rawMaterials.js';
import rawMaterialRequisitionsRoutes from '../src/routes/rawMaterialRequisitions.js';
import rawMaterialPurchasesRoutes from '../src/routes/rawMaterialPurchases.js';
import reportsRoutes from '../src/routes/reports.js';
import rolesRoutes from '../src/routes/roles.js';
import salesRoutes from '../src/routes/sales.js';
import sellersRoutes from '../src/routes/sellers.js';
import shiftcutsRoutes from '../src/routes/shiftcuts.js';
import suppliersRoutes from '../src/routes/suppliers.js';
import transfersRoutes from '../src/routes/transfers.js';
import ubicationsRoutes from '../src/routes/ubications.js';
import usersRoutes from '../src/routes/users.js';

const server = express();

server.set('port', process.env.PORT || 5001);

config();

const bdInfo = {
  host: process.env.PDEV_DBHOST,
  user: process.env.PDEV_DBUSER,
  password: process.env.PDEV_DBPASSWORD,
  port: process.env.PDEV_DBPORT,
  // database: process.env.PDEV_DBNAME,
  database: 'db_distribuidora_panaderia',
  // database: 'db_todoparacakes',
  dateStrings: true,
  multipleStatements: true,
  ssl: {
    rejectUnauthorized: false
  }
};

const corsConfig = {
  origin: '*',
  credentials: true,
};

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Comercial La Nueva API and Swagger",
      version: "1.0.0",
      description:
        "Documentation about Comercial La Nueva App API",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "SigPro COM",
        // url: "https://logrocket.com",
        email: "gusigpro@gmail.com"
      },
    },
    servers: [
      {
        url: "http://localhost:5001",
      },
    ],
  },
  apis: ["src/routes/*.js"],
};

const specs = swaggerJsdoc(options);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

server.use(morgan('dev'));
server.use(json());
server.use(urlencoded({extended: true}));
server.use(expMyConn(mysql2, bdInfo, 'pool'));
server.use(cors(corsConfig));
server.use(staticserve(__dirname + '/public'));
server.use(fileUpload({useTempFiles: true, tempFileDir: '/tmp'}));

server.use('/api/auth', authRoutes);
server.use('/api/brands', brandsRoutes);
server.use('/api/cashiers', cashiersRoutes);
server.use('/api/categories', categoriesRoutes);
server.use('/api/customers', customersRoutes);
server.use('/api/deliveryroutes', deliveryRoutesRoutes);
server.use('/api/expenses', expensesRoutes);
server.use('/api/generals', generalsRoutes);
server.use('/api/locations', locationsRoutes);
server.use('/api/mails', mailsRoutes);
server.use('/api/measurement-units', measurementUnitsRoutes);
server.use('/api/ordersales', orderSalesRoutes);
server.use('/api/parking-checkouts', parkingCheckoutsRoutes);
server.use('/api/parking-expenses', parkingExpensesRoutes);
server.use('/api/parking-reports', parkingReportsRoutes);
server.use('/api/policies', policiesRoutes);
server.use('/api/productions', productionsRoutes);
server.use('/api/products', productsRoutes);
server.use('/api/product-purchases', productPurchasesRoutes);
server.use('/api/rawmaterials', rawMaterialsRoutes);
server.use('/api/rawmaterialsrequisitions', rawMaterialRequisitionsRoutes);
server.use('/api/rawmaterialspurchases', rawMaterialPurchasesRoutes);
server.use('/api/reports', reportsRoutes);
server.use('/api/roles', rolesRoutes);
server.use('/api/sales', salesRoutes);
server.use('/api/sellers', sellersRoutes);
server.use('/api/shiftcuts', shiftcutsRoutes);
server.use('/api/suppliers', suppliersRoutes);
server.use('/api/transfers', transfersRoutes);
server.use('/api/ubications', ubicationsRoutes);
server.use('/api/users', usersRoutes);

server.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { explorer: true })
);

server.get('/', (req, res) => {
  res.sendFile(join(__dirname + '/public/index.html'));
});

server.get('*', (req, res) => {
  res.redirect('/');
});

const serverInstance = server.listen(server.get('port'), () => {
  console.log('\u001b[1;36mServer on port: ' + address() + ':' + server.get('port'));
  const pool = createPool(bdInfo);
  pool.query('SELECT 1 + 1 AS test;', (error, results, fields) => {
    if (error) {
      console.log(`\u001b[1;31m${error.message}`);
      return;
    };
    console.log(`\u001b[1;32m√ ¡Conexión a la Base de Datos ${bdInfo.database} establecida! √\u001b[1;0m`);
  });
});
