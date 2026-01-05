const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const config = require('./config/default');
const testsRouter = require('./routes/tests');
const signedKeysRouter = require('./routes/signedKeys');

const app = express();

// Определяем платформу
const isWindows = process.platform === 'win32';

const corsOptions = {
    origin: function (origin, callback) {
        // Разрешаем запросы без origin (например, от Postman или curl)
        if (!origin) {
            return callback(null, true);
        }

        if (isWindows) {
            // Для Windows разрешаем локальную разработку
            const allowedOrigins = [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'null'  // Для file:// протокола
            ];
            if (allowedOrigins.includes(origin) || origin.startsWith('file://')) {
                return callback(null, true);
            }
        } else {
            // Для Linux (сервер) разрешаем только основной домен
            if (origin === 'http://15.188.48.63') {
                return callback(null, true);
            }
        }

        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Добавляем CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use((req, res, next) => {
    // Log only API requests, not static files
    if (req.path.startsWith('/api')) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
});

app.use('/api/tests', testsRouter);
app.use('/api/signed-keys', signedKeysRouter);

// Serve static files only on Windows (for local development)
// On Linux, Apache handles static files in production
if (isWindows) {
    app.use(express.static(path.resolve(__dirname, '..', 'src')));
    
    // Serve index.html as default
    app.get('/', (req, res) => {
        res.sendFile(path.resolve(__dirname, '..', 'src', 'index.html'));
    });
}

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`API server running on http://0.0.0.0:${port}`);
});