const express = require("express");
const amqp = require('amqplib');
const http = require("http");

if (!process.env.RABBIT) {
    throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT");
}

const RABBIT = process.env.RABBIT;

//
// Connect to the RabbitMQ server.
//
function connectRabbit() {

    console.log(`Connecting to RabbitMQ server at ${RABBIT}.`);

    return amqp.connect(RABBIT) // Connect to the RabbitMQ server.
        .then(connection => {
            console.log("Connected to RabbitMQ.");

            return connection.createChannel() // Create a RabbitMQ messaging channel.
                .then(messageChannel => {
                    return messageChannel.assertExchange("viewed", "fanout") // Assert that we have a "viewed" exchange.
                        .then(() => {
                            return messageChannel;
                        });
                });
        });
}

//
// Broadcast the "viewed" message.
//
function broadcastAdvertiseMessage(messageChannel, advertiseId) {
    console.log(`Publishing message on "advertise" exchange.`);
        
    const msg = { advertise: { id: advertiseId } };
    const jsonMsg = JSON.stringify(msg);
    messageChannel.publish("advertise", "", Buffer.from(jsonMsg)); // Publish message to the "advertise" exchange.
}

//
// Setup event handlers.
//
function setupHandlers(app, messageChannel) {
    app.get("/advertise", (req, res) => { // Route for streaming video.
        const advertiseId = Math.floor(Math.random() * 10);

        const forwardRequest = http.request( // Forward the request to the advertise storage microservice.
            {
                host: `advertise-storage`,
                path: `/advertise?id=${advertiseId}`,
                method: 'GET',
                headers: req.headers,
            }, 
            forwardResponse => {
                res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
                forwardResponse.pipe(res);
            }
        );
        
        req.pipe(forwardRequest);

        broadcastAdvertiseMessage(messageChannel, advertiseId); // Send "viewed" message to indicate this video has been watched.
    });
}

//
// Start the HTTP server.
//
function startHttpServer(messageChannel) {
    return new Promise(resolve => { // Wrap in a promise so we can be notified when the server has started.
        const app = express();
        setupHandlers(app, messageChannel);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve(); // HTTP server is listening, resolve the promise.
        });
    });
}

//
// Application entry point.
//
function main() {
    return connectRabbit()                          // Connect to RabbitMQ...
        .then(messageChannel => {                   // then...
            return startHttpServer(messageChannel); // start the HTTP server.
        });
}

main()
    .then(() => console.log("Microservice online."))
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });