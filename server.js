const env = require('dotenv').config;
const express = require('express');
const Web3 = require('web3');
const fs = require('fs');
const PRIVATE_KEY =
  'cebf36fa8b3b403e02630576c76aeb85d519cc239958c713499e896ed748018c';

const app = express();
const port = 5000;

const indexHTML = fs.readFileSync('index.html', 'utf8');

app.get('/', (req, res) => {
  res.send(indexHTML);
});

// Create the Web3 provider (for Web3.js v1.x)
// const providerURL = `https://polygon-rpc.com`;
// let web3;

// try {
//   web3 = new Web3(new Web3.providers.HttpProvider(providerURL));
// } catch (error) {
//   console.error('Error creating Web3 instance:', error);
//   process.exit(1);
// }
// Correct way to initialize the Web3 instance in v1.x and above
const providerURL = `https://polygon-rpc.com`;
let web3;

try {
  web3 = new Web3(providerURL); // Pass provider URL directly to Web3 constructor
} catch (error) {
  console.error('Error creating Web3 instance:', error);
  process.exit(1);
}

async function sendMaticAndLog(recipientAccountAddress) {
  try {
    const amountInMatic = 0.01;
    const amountInWei = web3.utils.toWei(amountInMatic.toString(), 'ether');

    const rootAccount = await web3.eth.accounts.privateKeyToAccount(
      PRIVATE_KEY
    );

    web3.eth.accounts.wallet.add(rootAccount);
    web3.eth.defaultAccount = rootAccount.address;

    const transactionObject = {
      from: rootAccount.address,
      to: recipientAccountAddress,
      value: amountInWei,
      gas: 21000,
    };

    const signedTransaction = await web3.eth.accounts.signTransaction(
      transactionObject,
      PRIVATE_KEY
    );
    const transactionReceipt = await web3.eth.sendSignedTransaction(
      signedTransaction.rawTransaction
    );

    console.log('Transaction was successful', transactionReceipt);
  } catch (error) {
    console.error('Error sending the transaction', error);
  }
}

app.post('/send-matic', express.urlencoded({ extended: false }), (req, res) => {
  const recipientAccountAddress = req.body.recipientAddress;
  sendMaticAndLog(recipientAccountAddress);
  res.send('Transaction is being processed.');
});

app.listen(port, () => {
  console.log(`Server successfully running on http://localhost:${port}`);
});
