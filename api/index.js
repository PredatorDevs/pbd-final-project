import express, { json, urlencoded, static as staticserve } from 'express';

import path from 'path';
import morgan from 'morgan';
import cors from 'cors';
import fileUpload from 'express-fileupload';

import { config } from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';

import ip from 'ip';
const { address } = ip;

import authRoutes from '../src/routes/authorizations.js';
import markersRoutes from '../src/routes/markers.js';
import reportsRoutes from '../src/routes/reports.js';
import usersRoutes from '../src/routes/users.js';

const server = express();

server.set('port', process.env.PORT || 5001);

config();

const corsConfig = {
  origin: '*',
  credentials: true,
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

server.use(morgan('dev'));
server.use(json());
server.use(urlencoded({extended: true}));
server.use(cors(corsConfig));
server.use(staticserve(__dirname + '/public'));
server.use(fileUpload({useTempFiles: true, tempFileDir: '/tmp'}));

server.use('/api/auth', authRoutes);
server.use('/api/markers', markersRoutes);
server.use('/api/reports', reportsRoutes);
server.use('/api/users', usersRoutes);

server.get('/', (req, res) => {
  res.sendFile(join(__dirname + '/public/index.html'));
});

server.get('*', (req, res) => {
  res.redirect('/');
});

const serverInstance = server.listen(server.get('port'), () => {
  console.log('\u001b[1;36mServer on port: ' + address() + ':' + server.get('port'));
});
