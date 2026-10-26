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
    