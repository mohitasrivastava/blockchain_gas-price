const axios = require('axios');
const {
  Worker,
  isMainThread,
  workerData,
  parentPort,
} = require('worker_threads');
const mysql = require('mysql2');

const rpcUrls = [
  'https://eth.llamarpc.com',
  'https://polygon-rpc.com',
  'https://rpc.pulsechain.com/',
  'https://mainnet.fusionnetwork.io',
  'https://rpc.fantom.gateway.fm',
];

//dbConfig mysql connection configuration

dbConfig = {
  host: '127.0.0.1',
  port: '3306',
  password: ' ',
  database: 'multithread',
};

function getGasPrice(rpcUrl) {
  try {
    const payload = {
      jsonrpc: '2.0',
      method: 'eth_gasPrice',
      params: [],
      id: 1,
    };

    return axios.post(rpcUrl, payload).then((response) => {
      const gasPrice = parseInt(response.data.result, 16);
      return gasPrice;
    });
  } catch (error) {
    console.log(
      `An error occurred while retrieving the gas price for ${rpcUrl}: ${error.message}`
    );
    return Promise.resolve(null);
  }
}

function logGasPriceInDatabase(gasPrices) {
  const connection = mysql.createConnection(dbConfig);

  connection.connect((error) => {
    if (error) {
      console.error(`Error connecting to MySQL database: ${error}`);
      return;
    }

    const query =
      'INSERT INTO gas_prices (eth, polygon, pulsechain, fusion, fantom) VALUES (?, ?, ?, ?, ?)';

    connection.query(query, gasPrices, (error, results) => {
      if (error) {
        console.error(`Error inserting gas prices into database: ${error}`);
      }

      connection.end();
    });
  });
}

if (isMainThread) {
  async function calculateGasPrices() {
    const gasPrices = [];

    for (const rpcUrl of rpcUrls) {
      try {
        const gasPrice = await getGasPrice(rpcUrl);

        if (gasPrice) {
          console.log(`Gas price for network ${rpcUrl}: ${gasPrice} Wei`);
          gasPrices.push(gasPrice);
        }
      } catch (error) {
        console.error(
          `An error occurred while calculating gas prices for ${rpcUrl}: ${error.message}`
        );
      }
    }

    if (gasPrices.length > 0) {
      logGasPriceInDatabase(gasPrices);
    }
  }

  calculateGasPrices().catch((error) => {
    console.error(error);
    process.exit(1);
  });

  setInterval(() => {
    calculateGasPrices().catch((error) => {
      console.error(error);
      process.exit(1);
    });
  }, 10000);
} else {
  const rpcUrl = workerData; //Each url putted as worker thread

  getGasPrice(rpcUrl)
    .then((gasPrice) => {
      parentPort.postMessage(gasPrice); //parentPort is putting data into main thread
    })
    .catch((error) => {
      console.error(error);
    });
}
