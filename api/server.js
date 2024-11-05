const express = require('express');
const cors = require('cors');
const config = require('./config/default');
const testsRouter = require('./routes/tests');

const app = express();

// Более гибкая настройка CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Разрешаем запросы без origin (например, от Postman или curl)
        if (!origin) {
            return callback(null, true);
        }

        // Список разрешенных источников
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://15.188.48.63',
            'null'  // Для file:// протокола origin будет 'null'
        ];

        if (allowedOrigins.includes(origin) || origin.startsWith('file://')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Подключаем роуты
app.use('/api/tests', testsRouter);

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = config.port;
app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});