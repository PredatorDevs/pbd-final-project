import PdfPrinter from 'pdfmake';
import * as fs from 'fs';
import connUtil from "../helpers/connectionUtil.js";
import renders from "../helpers/pdfRendering.js";
import rendersAlt from "../helpers/pdfRenderingAlt.js";
import errorResponses from '../helpers/errorResponses.js';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database/conn.mjs';

const controller = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

controller.generateMarkersReport = async (req, res) => {
  let collection = db.collection("markers");
  let results = await collection.find().toArray();

  if (!results) res.status(400).json({ info: "No se pudieron obtener los usuarios" });
  else {
    try {
      const data = results;
      console.log(data);

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

      const tableBodyData = [];
      tableBodyData.push([
        'ID',
        'NOMBRE',
        { text: 'LATITUD' || '', bold: false, alignment: 'right' },
        { text: 'LONGITUD' || '', bold: false, alignment: 'right' },
        'FECHA CREACION'
      ]);
      
      for(const marker of (data || [])) {
        console.log(marker?._id.toString());
        console.log(marker?.createdAt.toString());
        tableBodyData.push([
          { text: marker?._id.toString() || '', bold: false },
          { text: marker?.name || '', bold: false },
          { text: Number(marker?.latitude) || '', bold: false, alignment: 'right' },
          { text: Number(marker?.longitude) || '', bold: false, alignment: 'right' },
          { text: marker?.createdAt.toLocaleDateString("en-US") || '', bold: false }
        ]);
      }
  
      const docDefinition = {
        header: function(currentPage, pageCount, pageSize) {
          return [
            { text: 'Marcadores Registrados en el Sistema', fontSize: 16, alignment: 'left', margin: [40, 30, 40, 0] },
            { text: 'RutaControl360', alignment: 'left', margin: [40, 0, 40, 0] }
          ]
        },
        footer: function(currentPage, pageCount) {
          // Podemos tener hasta cuatro líneas de pie de página
          return [
            { text: `PredatorDevs`, alignment: 'right', margin: [40, 0, 40, 0] },
            { text: `${currentPage.toString()} de ${pageCount}`, alignment: 'right', margin: [40, 0, 40, 0] }
          ]
        },
        content: [
          {
            layout: 'headerLineOnly', // optional
            table: {
              // Los encabezados se muestran automáticamente en todas las páginas en las que se extienda la tabla
              // Puedes definir el número de filas que serán tratadas como encabezados de la tabla
              headerRows: 1,
              widths: ['20%', '30%', '15%', '15%', '20%'],
              body: tableBodyData
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
  }
}


export default controller;
