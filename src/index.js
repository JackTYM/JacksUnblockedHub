import greenlock from "greenlock-express";
import httpProxy from 'http-proxy';
greenlock
    .init(function getConfig() {
        return {
            packageRoot: process.cwd(),
            configDir: "./greenlock.d",
            maintainerEmail: 'jacksonkyarger@gmail.com',
            cluster: false,
        };
    })
    .serve(httpsWorker);

import { createBareServer } from "@tomphttp/bare-server-node";
import express from "express";
import { createServer } from "node:http";
import { hostname } from "node:os";
import path from "node:path";
import fs from "fs";
import { ppid } from "node:process";
import { WebSocketServer, WebSocket } from 'ws';
const wss = new WebSocketServer({ port: 8081 });
import config from '../config.json' assert { type: "json" };;

const bare = createBareServer("/outerspace/");
const server = createServer();
const app = express(server);
const __dirname = process.cwd()

app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(express.static(path.join(__dirname, "html")));

app.get('/scripts/*', (req, res) => {   
    console.log(req.url)
    res.sendFile(path.join(__dirname, "static", req.url));
})

const routes = [
    { path: "/", file: "index.html" },
    { path: "/news", file: "apps.html" },
    { path: "/algebra", file: "games.html" },
    { path: "/settings", file: "settings.html" },
    { path: "/tabs", file: "tabs.html" },
    { path: "/tabinner", file: "tabinner.html" },
    { path: "/go", file: "go.html" },
    { path: "/loading", file: "loading.html" },
    { path: "/404", file: "404.html" },
];

routes.forEach((route) => {
    app.get(route.path, (req, res) => {
        res.sendFile(path.join(__dirname, "static", route.file));
    });
});


// Chat

var messages = [];
var uuids = [];

const slurs = config.slurs;

var online = 0;

wss.on('connection', (socket, req) => {
    messages.slice(-40).forEach((message) => socket.send(JSON.stringify(message)))
    socket.on('message', (data) => {
        const message = JSON.parse(data);
        var color = config.adminPasswords[message.admin] || message.color;

        var sanitizedUsername = slurFilter(message.username, slurs);
        var sanitizedMessage = slurFilter(message.message, slurs);

        var latestMessage = null;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].color === color) {
                latestMessage = messages[i];
                break;
            }
        }

        if (latestMessage && latestMessage.message === sanitizedMessage) {
            return;
        }

        try {
            if (messages.length >= 4
                && color === messages[messages.length - 1].color
                && messages[messages.length - 1].color === messages[messages.length - 2].color
                && messages[messages.length - 2].color === messages[messages.length - 3].color
                && messages[messages.length - 3].color === messages[messages.length - 4].color) {
                return;
            }
        } catch (e) { }

        var messageJson = { username: sanitizedUsername, message: sanitizedMessage, time: Date.now(), color: color, users: online };

        messages.push(messageJson);

        console.log(`[LOG] (${req.headers['x-real-ip'] || req.connection.remoteAddress}) ${message.username}: ${message.message}`)

        fs.appendFileSync('logs.txt', `(${req.headers['x-real-ip'] || req.connection.remoteAddress}) ${message.username}: ${message.message}\n`)

        var tempOnline = 0;
        // Broadcast the message to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                tempOnline++;
                client.send(JSON.stringify(messageJson));
            }
        });
        online = tempOnline
    });

    socket.on('end', () => {
        online--;
    });
});

function slurFilter(inputString, wordsArray) {
    const pattern = new RegExp(wordsArray.join('|'), 'gi');

    const resultString = inputString.replace(pattern, (match) => '*'.repeat(match.length));

    return resultString;
}

// Filter users older than 10 seconds out
setInterval(() => {
    uuids = uuids.filter(u => Date.now() - u.time <= 10000)
}, 1000)

const startTime = Date.now()
var totalBytes = 0;

server.on("request", (req, res) => {
    let dataReceived = 0;

    req.on('data', (chunk) => {
        dataReceived += chunk.length;
    });

    req.on('end', () => {
        totalBytes += dataReceived;
        if (dataReceived > 5000) {
            console.log(req.url)
            console.log(`Received ${dataReceived} bytes of data from ${req.method} ${req.url}`);
            console.log(req.headers['x-bare-path'])
            console.log(`Total Bytes: ${totalBytes} | Seconds: ${(Date.now() - startTime) / 1000}`)
            console.log(`Bytes per second: ${totalBytes / ((Date.now() - startTime) / 1000)}`)
        }
    });
    if (bare.shouldRoute(req)) {
        bare.routeRequest(req, res);
    } else {
        app(req, res);
    }
});

server.on("upgrade", (req, socket, head) => {
    let dataReceived = 0;

    req.on('data', (chunk) => {
        dataReceived += chunk.length;
    });

    req.on('end', () => {
        if (dataReceived > 5000) {
            console.log(req.url)
            console.log(`Upgraded ${dataReceived} bytes of data from ${req.method} ${req.url}`);
        }
    });
    if (bare.shouldRoute(req)) {
        bare.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

server.on("listening", () => {
    const address = server.address();

    console.log("Listening on:");
    console.log(`\thttp://localhost:${address.port}`);
    console.log(`\thttp://${hostname()}:${address.port}`);
    console.log(
        `\thttp://${address.family === "IPv6" ? `[${address.address}]` : address.address
        }:${address.port}`
    );
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close();
    bare.close();
    process.exit(0);
}

server.listen({
    port,
});

function httpsWorker(glx) {
    var server = glx.httpsServer();
    var proxy = httpProxy.createProxyServer({ xfwd: true });

    proxy.on("error", function (err, req, res) {
        console.error(err);
        res.statusCode = 500;
        res.end();
        return;
    });

    // Proxy websockets
    // Port 8081 - Chat
    // Port 8085 - Eaglercraft
    // Everything else - Ultraviolet proxy
    server.on("upgrade", function (req, socket, head) {
        switch (req.url) {
            case "/ws": {
                proxy.ws(req, socket, head, {
                    ws: true,
                    target: "ws://localhost:8081",
                    headers: {
                        "X-Real-IP": req.connection.remoteAddress
                    }
                });
                break;
            }
            case "/Minecraft": {
                proxy.ws(req, socket, head, {
                    ws: true,
                    target: "ws://localhost:8085"
                });
                break;
            }
            default: {
                if (bare.shouldRoute(req)) {
                    bare.routeUpgrade(req, socket, head);
                } else {
                    socket.end();
                }
                break;
            }
        }
    });

    glx.serveApp(function (req, res) {
        if (bare.shouldRoute(req)) {
            bare.routeRequest(req, res);
        } else {
            proxy.web(req, res, {
                target: `http://localhost:${port}`
            });
        }
    });
}