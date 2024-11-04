const express = require('express');
const cors = require('cors');
const config = require('./config/default');
const testsRouter = require('./routes/tests');

const app = express();

app.use(cors());
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