# coin-wallet

Consistent cryto currency interface for Node.js

Support : XRP

Will Support : BTC, ETH ...

## API
### Get Module
```javascript
  const wallet = require('coin-wallet');
  wallet.generateAddress('XRP');
  
  // or
  const XRP = require('coin-wallet').getModule('XRP');
  XRP.generateAddress();
```


### Generate Address

```javascript
  const wallet = require('coin-wallet');
  const CURRENCY = 'XRP';    // BTC, ETH will support
  
  wallet.generateAddress(CURRENCY)
    .then(result => {
      console.log(result.address);
      console.log(result.secret);
    }).catch(console.error)
```

### Get Account Info

```javascript
  const wallet = require('coin-wallet');
  const CURRENCY = 'XRP';    // BTC, ETH will support
  
  wallet.getAccountInfo(CURRENCY, 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn')
    .then(result => {
      console.log(result.address);
      console.log(result.secret);
    }).catch(console.error)
```

### Transfer

```javascript
  const wallet = require('coin-wallet');
  const CURRENCY = 'XRP';    // BTC, ETH will support
  
  wallet.transfer(CURRENCY, {
    'senderAddress': 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
    'senderSecret': 'XXXXXX',
    'recieverAddress': 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn'
    'amount': 1000
  }).then(result => {
      console.log(result.id);
      console.log(result.fee);
      console.log(result.timestamp);
    }).catch(console.error)
```
