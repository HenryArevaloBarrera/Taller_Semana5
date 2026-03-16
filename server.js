require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a la base de datos (TiDB requiere SSL)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
        rejectUnauthorized: true // Requerido para TiDB Cloud
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Comprobar conexión y estructurar la BD si es necesario
async function initializeDB() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conectado exitosamente a la base de datos TiDB');


    } catch (err) {
        console.error('❌ Error conectando a la base de datos:', err);
    }
}
initializeDB();


// ============ ENDPOINTS ============

// --- DASHBOARD API ---
app.get('/api/stats', async (req, res) => {
    try {
        const [cafes] = await pool.query('SELECT COUNT(*) as count FROM cafes');
        const [clientes] = await pool.query('SELECT COUNT(*) as count FROM clientes');
        const [pedidos] = await pool.query('SELECT COUNT(*) as count FROM pedidos');

        res.json({
            cafes: cafes[0].count,
            clientes: clientes[0].count,
            pedidos: pedidos[0].count,
            puntuacion: 4.8 // Valor estático por ahora
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// --- CAFES API ---
app.get('/api/cafes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cafes ORDER BY fecha_creacion DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo cafés' });
    }
});

app.post('/api/cafes', async (req, res) => {
    try {
        const { nombre, origen, precio, intensidad } = req.body;
        const [result] = await pool.query(
            'INSERT INTO cafes (nombre, origen, precio, intensidad) VALUES (?, ?, ?, ?)',
            [nombre, origen, precio, intensidad]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Error creando café', details: err.message });
    }
});

// --- CLIENTES API ---
app.get('/api/clientes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clientes ORDER BY fecha_registro DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo clientes' });
    }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const { nombre, email, telefono } = req.body;
        const [result] = await pool.query(
            'INSERT INTO clientes (nombre, email, telefono) VALUES (?, ?, ?)',
            [nombre, email, telefono]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Error registrando cliente' });
    }
});

// --- PEDIDOS API ---
app.get('/api/pedidos', async (req, res) => {
    try {
        // Query completa con JOIN para traer los nombres del cliente y del café
        const query = `
            SELECT p.*, c.nombre as cliente_nombre, f.nombre as cafe_nombre 
            FROM pedidos p 
            JOIN clientes c ON p.cliente_id = c.id 
            JOIN cafes f ON p.cafe_id = f.id
            ORDER BY p.fecha_pedido DESC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo pedidos' });
    }
});

app.post('/api/pedidos', async (req, res) => {
    try {
        const { cliente_id, cafe_id, cantidad, estado } = req.body;
        const [result] = await pool.query(
            'INSERT INTO pedidos (cliente_id, cafe_id, cantidad, estado) VALUES (?, ?, ?, ?)',
            [cliente_id, cafe_id, cantidad, estado || 'pendiente']
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Error creando pedido' });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
