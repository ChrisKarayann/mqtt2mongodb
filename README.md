# mqtt2mongodb

A lightweight, continuously-running server-side service that bridges an MQTT broker and MongoDB. It subscribes to an MQTT topic, parses incoming JSON messages from IoT devices (or any MQTT publisher), and persists the payloads into MongoDB — each device in its own capped collection.

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Security](#security)
- [Running the Service](#running-the-service)
- [Logging](#logging)
- [ESP8266 Example Client](#esp8266-example-client)

---

## Overview

`mqtt2mongodb` is designed to act as a persistent bridge between a Mosquitto MQTT broker and a MongoDB database. It is intended to run continuously on a server, collecting JSON-encoded telemetry payloads from one or more IoT objects (e.g. weather stations, sensors) and storing them in MongoDB for later retrieval or analysis.

---

## How It Works

1. **Device publishes** a JSON message to the `objects/raw` MQTT topic. The message must include an `id` field that uniquely identifies the device (e.g. the SIM module's IMEI).
2. **Service receives** the message and parses the JSON payload.
3. **Collection routing** — the `id` field is extracted and used as the MongoDB collection name. The `id` key is then removed from the document.
4. **Timestamp** — a `when` field (Unix timestamp) is appended to the document before storage.
5. **Storage** — the cleaned document is inserted into the device's collection. If the collection does not yet exist it is created automatically as a **capped collection** (configurable size/max) to prevent unbounded growth.
6. Each new device that publishes a message automatically gets its own collection in the database.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v8 or later recommended)
- [npm](https://www.npmjs.com/)
- A running [Mosquitto](https://mosquitto.org/) MQTT broker
- A running [MongoDB](https://www.mongodb.com/) instance
- *(Optional)* [PM2](https://pm2.keymetrics.io/) for process management and auto-start

---

## Installation

```bash
# Clone the repository
git clone https://github.com/ChrisKarayann/mqtt2mongodb.git
cd mqtt2mongodb/mqtt2mongodb

# Install dependencies
npm install
```

---

## Configuration

All connection details are stored in `config.json`. This file must be present in the `mqtt2mongodb/` directory before starting the service. It is strongly recommended to keep this file private (e.g. outside the web root, with restricted permissions).

```json
{
  "MQTT": {
    "host": "127.0.0.1",
    "user": "encryptedOrNotOwnMqttBrokerUser",
    "pass": "encryptedOrNotOwnMqttBrokerPassword"
  },
  "MONGO": {
    "host": "127.0.0.1",
    "port": "27017",
    "base": "onesOwnDatabaseForStorage",
    "user": "encryptedOrNotOwnMongoUserForDatabase",
    "pass": "encryptedOrNotOwnMongoPasswordForDatabase"
  },
  "DGL": {
    "p": "onesOwnPathToSecureDrive"
  }
}
```

| Section | Field  | Description |
|---------|--------|-------------|
| `MQTT`  | `host` | IP or hostname of the MQTT broker |
| `MQTT`  | `user` | MQTT broker username (plain or AES-128 encrypted) |
| `MQTT`  | `pass` | MQTT broker password (plain or AES-128 encrypted) |
| `MONGO` | `host` | MongoDB host |
| `MONGO` | `port` | MongoDB port (default: `27017`) |
| `MONGO` | `base` | Target database name |
| `MONGO` | `user` | MongoDB username (plain or AES-128 encrypted) |
| `MONGO` | `pass` | MongoDB password (plain or AES-128 encrypted) |
| `DGL`   | `p`    | Path to the directory on the security dongle that holds decryption keys (`meta.json`) |

---

## Security

The service supports an optional AES-128-CBC encryption layer for all credentials stored in `config.json`.

- **Credentials** (MQTT and MongoDB usernames/passwords) are stored AES-128 encrypted in `config.json`.
- **Keys** are kept on a removable USB dongle at the path specified by `DGL.p`. The dongle must contain a `d/meta.json` file with the key (`ky`) and initialization vector (`iv`).
- **At startup**, the service reads the keys from the dongle, decrypts the credentials in memory, and establishes connections. Once the service is running the dongle can be physically removed — no keys remain on disk.
- **If the dongle is absent** at startup, the service refuses to connect and logs an authorization failure to `error.log`.

> To run the service **without encryption**, replace the encrypted credential values in `config.json` with plain-text values and remove the authorization block from `mqtt2mongoDB.js` as noted in the source comments.

---

## Running the Service

### Directly with Node.js

```bash
node mqtt2mongoDB.js
```

### With PM2 (recommended for production)

[PM2](https://pm2.keymetrics.io/) keeps the service alive across crashes and system reboots.

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start the service
pm2 start mqtt2mongoDB.js --name mqtt2mongodb

# Save the process list and enable startup on boot
pm2 save
pm2 startup
```

---

## Logging

The service creates two log files on the fly (no manual setup required):

| File         | Contents |
|--------------|----------|
| `error.log`  | JSON parse errors and authorization failures, each with a timestamp |
| `assign.log` | A record of every new device (collection) created, identified by its IMEI/ID |

---

## ESP8266 Example Client

The `esp8266-code/` directory contains a reference Arduino sketch (`liturgyMqttDev.ino`) for an ESP8266-based weather station. It demonstrates:

- Connecting to a mobile network via a SIM800 GSM modem (using [TinyGSM](https://github.com/vshymanskyy/TinyGSM))
- Reading sensor data (temperature, pressure) from a BMP280 over I²C
- Publishing a JSON payload — including the modem's IMEI as the `id` field — to the `objects/raw` MQTT topic at a configurable interval using a `Ticker`

This sketch is provided as an illustrative example of a compatible MQTT publisher; any device or software capable of publishing JSON to the configured MQTT topic will work with the service.

---

Have fun and keep walking.
