const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;

// node-postgres (pg) lee sola las variables estandar PGHOST/PGPORT/PGUSER/
// PGPASSWORD/PGDATABASE, o DATABASE_URL si esta seteada. El Addon de Postgres
// de Kubero deberia inyectar alguna de esas dos formas — al configurarlo en
// vivo, revisen con que nombres quedan las variables de entorno de la app y
// ajusten aca si hace falta (ej. agregar connectionString: process.env.DATABASE_URL).
const pool = new Pool();

async function waitForDatabase(retries = 15, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Conectado a la base de datos.');
      return;
    } catch (err) {
      console.log(`Esperando la base de datos... intento ${i}/${retries}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('No se pudo conectar a la base de datos.');
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/tasks', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, title, done, created_at FROM tasks ORDER BY id ASC',
  );
  res.json(rows);
});

app.post('/tasks', async (req, res) => {
  const title = (req.body?.title || '').trim();
  if (!title) {
    return res.status(400).json({ error: 'title es obligatorio' });
  }
  const { rows } = await pool.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING id, title, done, created_at',
    [title],
  );
  res.status(201).json(rows[0]);
});

app.delete('/tasks/:id', async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

async function bootstrap() {
  await waitForDatabase();
  await initDb();
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});
