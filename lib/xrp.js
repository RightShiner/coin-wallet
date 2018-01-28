const InvalidAccountError       = require('./error').InvalidAccountError;
const InsufficientBalanceError  = require('./error').InsufficientBalanceError;
const TransactionError          = require('./error').TransactionError;

module.exports = Xrp;

function Xrp(opt) {
  const option = opt || {};
  const VALIDATION_INTERVAL = 1000;                                   /* Milliseconds to wait between checks for a new ledger. */
  const VALIDATION_LEDGEROFFSET = 5;                                  /* Number of ledgers to check for valid transaction before failing */

  const RippleAPI = require('ripple-lib').RippleAPI;
  const api = new RippleAPI({
    server: option.test ? 'wss://s.altnet.rippletest.net:51233' : 'wss://s1.ripple.com'
  });
  var connection = null;

  return {
    generateAddress : function(){
      return new Promise(function(resolve, reject){
        return resolve(api.generateAddress());
      });
    },

    getAccountInfo : function(address){
      return new Promise(function(resolve, reject){
        if(address == null) {
          return reject(new InvalidAccountError());
        }
        prepare().then(() => {
          return api.getAccountInfo(address);
        }).then(info => {
          return resolve({
            'balance' : parseFloat(info.xrpBalance)
          });
        }).catch(err => {
          return reject(err);
        });
      });
    },

    transfer : function(params) {
      const payment = convert(params);
      const myInstructions = {maxLedgerVersionOffset: VALIDATION_LEDGEROFFSET};

      return new Promise(function(resolve, reject){
        prepare().then(() => {
          return api.preparePayment(payment.myAddr, payment.myOrder, myInstructions).then(prepare => {
            prepare.secret = payment.mySecret;
            return Promise.resolve(prepare);
          });
        }).then(prepared => {
          return api.getLedger().then(ledger => {
            return submitTransaction(ledger.ledgerVersion, prepared);
          });
        }).then((data) => {
          // console.log('Final Result: ', data.outcome.result);
          // console.log('Validated in Ledger: ', data.outcome.ledgerVersion);
          // console.log('Sequence: ', data.sequence);
          // return data.outcome.result === 'tesSUCCESS';
          return resolve({
            'result':'SUCCESS',
            'id': data.id,
            'timestamp': data.outcome.timestamp,
            'fee': data.outcome.fee
          });
        }).catch((e) => {
          return reject(e);
        });
      });

      /* Function to prepare, sign, and submit a transaction to the XRP Ledger. */
      function submitTransaction(lastClosedLedgerVersion, prepared) {
        const signedData = api.sign(prepared.txJSON, prepared.secret);
        const signedTransaction = signedData.signedTransaction;
        return api.submit(signedTransaction).then(data => {
          // console.log('Tentative Result: ', data.resultCode);
          // console.log('Tentative Message: ', data.resultMessage);
          /* If transaction was not successfully submitted throw error */

          // For code information
          // https://ripple.com/build/transactions/#full-transaction-response-list
          if(data.resultCode !== 'tesSUCCESS') {
            if(data.resultCode === 'tecUNFUNDED_PAYMENT') throw new InsufficientBalanceError(data.resultMessage);
            else throw new TransactionError(data.resultMessage);
          }
          /* 'tesSUCCESS' means the transaction is being considered for the next ledger, and requires validation. */

          /* If successfully submitted, begin validation workflow */
          const options = {
            minLedgerVersion: lastClosedLedgerVersion,
            maxLedgerVersion: prepared.instructions.maxLedgerVersion
          };
          return new Promise((resolve, reject) => {
            setTimeout(() => verifyTransaction(signedData.id, options)
          .then(resolve, reject), VALIDATION_INTERVAL);
          });
        });
      }

      /* Verify a transaction is in a validated XRP Ledger version */
      function verifyTransaction(hash, options) {
        // console.log('Verifing Transaction');
        return api.getTransaction(hash, options).then(data => {
          // console.log('Final Result: ', data.outcome.result);
          // console.log('Validated in Ledger: ', data.outcome.ledgerVersion);
          // console.log('Sequence: ', data.sequence);
          // return data.outcome.result === 'tesSUCCESS';
          return new Promise((resolve, reject) => {
            return resolve(data);
          });
        }).catch(error => {
          /* If transaction not in latest validated ledger,
             try again until max ledger hit */
          if (error instanceof api.errors.PendingLedgerVersionError) {
            return new Promise((resolve, reject) => {
              setTimeout(() => verifyTransaction(hash, options)
              .then(resolve, reject), VALIDATION_INTERVAL);
            });
          }
          return error;
        });
      }
    }
  }

  function convert(params) {
    return {
      'myAddr': params.senderAddress,
      'mySecret': params.senderSecret,
      'myOrder': {
        "source": {
          "address": params.senderAddress,
          "maxAmount": {
            "value": params.amount + '',
            "currency": "XRP"
          }
        },
        "destination": {
          "address": params.receiverAddress,
          "amount": {
            "value": params.amount + '',
            "currency": "XRP"
          }
        }
      }
    }
  }

  function prepare() {
    if(connection == null) {
      connection = connect();
    }
    return connection;
  }

  function connect() {
    return api.connect();
  }

  api.on('disconnected', (code) => {
    connection = null;
  });
}
