const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const config = require('../config/default');
const path = require('path');
const fs = require('fs').promises;

// GET /api/tests
router.get('/', (req, res) => {
    const tests = [
        { id: 'test1', name: 'First Test' },
        { id: 'test2', name: 'Second Test' }
    ];
    res.json(tests);
});

// POST /api/tests/run
router.post('/run', (req, res) => {
    try {
        const { tests, environment } = req.body;
        console.log('Received request:', { tests, environment });

        const isWindows = process.platform === 'win32';
        const testPath = isWindows ? config.testPaths.windows : config.testPaths.linux;
        
        const baseCommand = isWindows ? config.testCommands.windows : config.testCommands.linux;
        let command = `${baseCommand} ${environment} --sequential`;

        const testsArray = Array.isArray(tests) ? tests : [tests];
        if (testsArray.length > 0 && testsArray[0]) {
            command += ` --tests=${testsArray.join(',')}`;
        }

        console.log('Executing command:', command);
        console.log('Working directory:', testPath);

        const options = {
            cwd: testPath,
            stdio: 'inherit'
        };

        const { spawn } = require('child_process');
        const childProcess = spawn('node', ['runTests2.js', environment, '--sequential', `--tests=${testsArray.join(',')}`], {
            cwd: testPath,
            stdio: 'pipe'
        });

        childProcess.stdout.on('data', (data) => {
            console.log(`runTests2.js stdout: ${data}`);
        });

        childProcess.stderr.on('data', (data) => {
            console.error(`runTests2.js stderr: ${data}`);
        });

        childProcess.on('close', (code) => {
            console.log(`runTests2.js process exited with code ${code}`);
        });

        res.json({ 
            status: 'started',
            command,
            workingDir: testPath
        });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tests/results
router.get('/results', async (req, res) => {
    try {
        const isWindows = process.platform === 'win32';
        const testPath = isWindows ? config.testPaths.windows : config.testPaths.linux;
        const environments = ['prod', 'stage', 'dev'];
        let allResults = [];

        for (const env of environments) {
            const envPath = path.join(testPath, 'results', env);
            
            try {
                const envExists = await fs.access(envPath).then(() => true).catch(() => false);
                if (!envExists) {
                    console.log(`Environment directory ${env} does not exist, skipping`);
                    continue;
                }

                // Получаем список директорий, сортируем по убыванию и берем только 20 последних
                const dirs = (await fs.readdir(envPath))
                    .sort((a, b) => b.localeCompare(a))
                    .slice(0, 20);
                
                const envResults = await Promise.all(
                    dirs.map(async (dir) => {
                        const resultPath = path.join(envPath, dir, 'results.json');
                        try {
                            const fileExists = await fs.access(resultPath).then(() => true).catch(() => false);
                            if (!fileExists) {
                                console.log(`Results file not found: ${resultPath}, skipping`);
                                return null;
                            }

                            const data = await fs.readFile(resultPath, 'utf8');
                            return {
                                timestamp: dir,
                                environment: env,
                                results: JSON.parse(data)
                            };
                        } catch (err) {
                            console.log(`Skipping invalid result file: ${resultPath}`);
                            return null;
                        }
                    })
                );
                
                allResults = allResults.concat(envResults.filter(r => r !== null));
            } catch (err) {
                console.log(`Error reading environment ${env}, skipping:`, err.message);
            }
        }

        // Сортируем все результаты и берем 5 последних
        allResults.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        res.json(allResults.slice(0, 5));
    } catch (err) {
        console.error('Error getting test results:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/tests/status
router.get('/status', async (req, res) => {
    try {
        const isWindows = process.platform === 'win32';
        const testPath = isWindows ? config.testPaths.windows : config.testPaths.linux;
        const environments = ['prod', 'stage', 'dev'];
        const statuses = {};
        
        // Читаем статусы из всех окружений
        for (const env of environments) {
            const statusPath = path.join(testPath, 'results', env, 'test-status.json');
            
            try {
                const exists = await fs.access(statusPath).then(() => true).catch(() => false);
                if (exists) {
                    const data = await fs.readFile(statusPath, 'utf8');
                    statuses[env] = JSON.parse(data);
                }
            } catch (err) {
                console.log(`No status file in ${env} environment`);
            }
        }
        
        res.json(statuses);
    } catch (err) {
        console.error('Error reading status:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;