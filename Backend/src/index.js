import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config.js';
import { getPool } from './db.js';

import usersRouter from './routes/users.js';
import formsRouter from './routes/forms.js';
import submissionsRouter from './routes/submissions.js';
import escolasRouter from './routes/escolas.js';
import projetosRouter from './routes/projetos.js';
import termosRouter from './routes/termos.js';
import declaracoesRouter from './routes/declaracoes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Diagnostic endpoint - shows config without sensitive data
app.get('/api/diagnostic', (req, res) => {
  res.json({
    server: config.server,
    port: config.port,
    database: config.database,
    user: config.user,
    passwordLength: config.password ? config.password.length : 0,
    passwordFirstChars: config.password ? config.password.substring(0, 5) : 'undefined'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.use('/api/users', usersRouter);
app.use('/api/forms', formsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/escolas', escolasRouter);
app.use('/api/projetos', projetosRouter);
app.use('/api/termos', termosRouter);
app.use('/api/declaracoes', declaracoesRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(config.appPort, () => {
  console.log(`ArteEduca API listening on port ${config.appPort}`);
});
