# Sports Oracle API

[![Netlify Status](https://api.netlify.com/api/v1/badges/fc0c23a2-fe04-4a0e-93a3-263f97fae7bc/deploy-status)](https://app.netlify.com/sites/sportsfi-prices-api/deploys)

Welcome to the Sports Oracle API! This API provides sports data and statistics for various sports and leagues.

In one line, this project: Runs forever, waking up every 45 seconds to read a 60‑second TWAP from several Uniswap V3 pools and, only when the price has actually moved (or 10 minutes have passed), push the new value on‑chain to a custom Oracle contract.

## Features

- Retrieve live prices and liquidity metrics
- Access historical data and statistics
- Coming Soon: Get information on teams and players

## Installation

To install the dependencies, run:

```
yarn
```

## Usage

To start the server, run:

```
yarn start
```

## Endpoints

- `/api/prices` - Get live prices
- `/api/liquidity` - Get team information
- `/api/status` - Get the API's status

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.