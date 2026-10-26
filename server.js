const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware untuk parsing JSON pada body request
app.use(express.json());

// Konfigurasi koneksi database PostgreSQL menggunakan Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// 1. Middleware Logging Sederhana (Mencatat setiap request yang masuk)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 2. Middleware Validasi Input untuk POST dan PUT
const validateBiodata = (req, res, next) => {
  const { nama, nim, kelas } = req.body;
  if (!nama || !nim || !kelas) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validasi gagal: Field nama, nim, dan kelas wajib diisi!',
    });
  }
  next();
};

// --- ROUTE CRUD ---

// GET: Mengambil semua data mahasiswa
app.get('/api/biodata', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM biodata ORDER BY id ASC');
    res.status(200).json({
      status: 'success',
      totalData: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    next(err); // Meneruskan error ke global error handler
  }
});

// GET by ID: Mengambil data mahasiswa berdasarkan ID
app.get('/api/biodata/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM biodata WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Data mahasiswa tidak ditemukan',
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// POST: Menambahkan data mahasiswa baru
app.post('/api/biodata', validateBiodata, async (req, res, next) => {
  try {
    const { nama, nim, kelas } = req.body;
    const query = 'INSERT INTO biodata (nama, nim, kelas) VALUES ($1, $2, $3) RETURNING *';
    const values = [nama, nim, kelas];

    const result = await pool.query(query, values);
    res.status(201).json({
      status: 'success',
      message: 'Data mahasiswa berhasil ditambahkan',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// PUT: Memperbarui data mahasiswa berdasarkan ID
app.put('/api/biodata/:id', validateBiodata, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nama, nim, kelas } = req.body;

    const query = 'UPDATE biodata SET nama = $1, nim = $2, kelas = $3 WHERE id = $4 RETURNING *';
    const values = [nama, nim, kelas, id];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Data mahasiswa yang akan di-update tidak ditemukan',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Data mahasiswa berhasil diperbarui',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// DELETE: Menghapus data mahasiswa berdasarkan ID
app.delete('/api/biodata/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM biodata WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Data mahasiswa yang akan dihapus tidak ditemukan',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Data mahasiswa berhasil dihapus',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// 3. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan internal pada server',
    error: err.message,
  });
});

