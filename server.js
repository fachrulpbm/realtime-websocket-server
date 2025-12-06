const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// WebSocket Server murni
const wss = new WebSocket.Server({ 
    server,
    path: '/'
});

// Simpan semua client yang terkoneksi
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Client connected. Total:', clients.size + 1);
    clients.add(ws);

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected. Total:', clients.size);
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

// Endpoint untuk PHP mengirim notifikasi
app.use(express.json());
app.post('/notify', (req, res) => {
    const { event, data } = req.body;

    const message = JSON.stringify({ event, data });

    // Broadcast ke semua client
    let sentCount = 0;
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            sentCount++;
        }
    });

    console.log(`Broadcasted "${event}" to ${sentCount} clients`);
    res.json({ success: true, sentTo: sentCount });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Pure WebSocket server running on ws://localhost:${PORT}`);
    console.log(`HTTP notify endpoint: http://localhost:${PORT}/notify`);
});