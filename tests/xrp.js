'use strict';

const sut 										     = require('../lib')({'test':true}).getModule("XRP");
const assert    							     = require('assert');
const InvalidAccountError 		     = require('../lib/error').InvalidAccountError;
const InsufficientBalanceError 		 = require('../lib/error').InsufficientBalanceError;
const FIXED_POINT                 = 6;
const TEST_ACCOUNT1 = {
  'address': 'rJBUrESxk8rbdiB1gaSsRp4z8YGc6M2FhQ',
  'secret': 'sn1uHWvYZC9GDXQCkuF4mgLy4fMsg'
}
const TEST_ACCOUNT2 = {
  'address': 'r3L1GXKNVs17m3MsjULHvZJiD4H1xP7NV4',
  'secret': 'sawQBU3FCFLTJUFBd4uLafxpU4cJX'
}
const TEST_ACCOUNT3 = {
  'address': 'rGHzH5wwWNDDkVvq6wGT9HeKijvLqqMmET',
  'secret': 'shjZw9GDt3JoV1Yxemry2fj5xMYdY'
}

describe('generateAddress', function(){
  it('can get address', function(done){
    sut.generateAddress()
    .then((result) => {
      assert.notEqual(result, null);
      assert.notEqual(result.address, null);
      assert.notEqual(result.secret, null);
      return done();
    }).catch((err) => {
      return done(err);
    });
  });
});

describe('getAccountInfo', function(){
  it('can get account info', function(done) {
    sut.getAccountInfo("rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn")
    .then(info => {
      assert.notEqual(info, null);
      assert.notEqual(info.balance, null);
      return done();
    }).catch((err) => {
      return done(err);
    });
  });

  it('error with no address', function(done){
    sut.getAccountInfo(null)
    .then(info => {
      return done("Shouldn't be here");
    }).catch((e) => {
      assert.equal(e instanceof InvalidAccountError, true);
      return done();
    }).catch((e) => {
      return done(e);
    });
  });
});

describe('transfer', function(){
  // send 0.01 XRP from account1 to account2 test
  const TRANSFER_INFO = {
    'senderAddress' : TEST_ACCOUNT1.address,
    'senderSecretKey' : TEST_ACCOUNT1.secret,
    'recieverAddress' : TEST_ACCOUNT2.address,
    'amount' : 0.01
  }
  it('can transfer', function(done){
    var account1Before = null;
    var account1After = null;
    var account2Before = null;
    var account2After = null;
    var fee = null;

    sut.getAccountInfo(TEST_ACCOUNT1.address).then(account1 => {
      // 1. get account1 balance
      account1Before = account1;
      return sut.getAccountInfo(TEST_ACCOUNT2.address)
    }).then(account2 => {
      // 2. get account2 balance
      account2Before = account2;

      // 3. transfer 0.01 XRP from account1 to account2
      return sut.transfer(TRANSFER_INFO);
    }).then(result => {
      assert.notEqual(result, null);
      assert.notEqual(result.id, null);
      assert.notEqual(result.fee, null);
      assert.notEqual(result.timestamp, null);

      fee = parseFloat(result.fee);

      // 4. get account1 balance again
      return sut.getAccountInfo(TEST_ACCOUNT1.address);
    }).then(account1 => {
      account1After = account1;
      // 5. get account2 balance again
      return sut.getAccountInfo(TEST_ACCOUNT2.address);
    }).then(account2 => {
      account2After = account2;

      // 6. check
      assert.equal(account1After.balance, (account1Before.balance - TRANSFER_INFO.amount - fee).toFixed(FIXED_POINT));
      assert.equal(account2After.balance, (account2Before.balance + TRANSFER_INFO.amount).toFixed(FIXED_POINT));
      return done();
    }).catch((e) => {
      return done(e);
    });
  });

  it('throw error with malformed sender address', function(done) {
    var info = deepClone(TRANSFER_INFO);
    info.senderAddress = '';
    sut.transfer(info).then(result => {
      return done("Shouldn't be here");
    }).catch(e => {
      assert.notEqual(e, null);
      return done();
    });
  });

  it('throw error with malformed reciever address', function(done) {
    var info = deepClone(TRANSFER_INFO);
    info.recieverAddress = '';
    sut.transfer(info).then(result => {
      return done("Shouldn't be here");
    }).catch(e => {
      assert.notEqual(e, null);
      return done();
    });
  });

  it('throw error with insufficient balance', function(done) {
    var info = deepClone(TRANSFER_INFO);
    sut.getAccountInfo(info.senderAddress).then(account => {
      info.amount = account.balance + 1;
      return sut.transfer(info);
    }).then(result => {
      return done("Shouldn't be here");
    }).catch(e => {
      assert.notEqual(e, null);
      assert.equal(e instanceof InsufficientBalanceError, true);
      return done();
    }).catch(e => {
      return done(e);
    });
  });
});
//
// describe('multi transfer', function(){
//   // send 0.01 XRP from account1 to account2
//   // send 0.02 XRP from account1 to account3
//   const TRANSFER_INFO1 = {
//     'senderAddress' : TEST_ACCOUNT1.address,
//     'senderSecretKey' : TEST_ACCOUNT1.secret,
//     'recieverAddress' : TEST_ACCOUNT2.address,
//     'amount' : 0.01
//   }
//   const TRANSFER_INFO2 = {
//     'senderAddress' : TEST_ACCOUNT1.address,
//     'senderSecretKey' : TEST_ACCOUNT1.secret,
//     'recieverAddress' : TEST_ACCOUNT3.address,
//     'amount' : 0.02
//   }
//   const TRANSFER_INFOS = [TRANSFER_INFO1, TRANSFER_INFO2];
//
//   function getAccountInfos() {
//     return Promise.all([sut.getAccountInfo(TEST_ACCOUNT1.address)
//                 , sut.getAccountInfo(TEST_ACCOUNT2.address)
//                 , sut.getAccountInfo(TEST_ACCOUNT3.address)]);
//   }
//
//   it('can transfer', function(done) {
//     var before = null;
//     var after = null;
//     var fee = null;
//
//     getAccountInfos().then(accountInfos => {
//       // 1. get account1, account2, account3 balance
//       before = accountInfos;
//
//       // 2. multi transfer
//       // send 0.01 XRP from account1 to account2
//       // send 0.02 XRP from account1 to account3
//       return sut.transfer(TRANSFER_INFOS);
//     }).then(result => {
//       assert.notNull(result, null);
//       assert.notNull(result.fee, null);
//
//       fee = parseFloat(result.fee);
//       return getAccountInfos();
//     }).then(accountInfos => {
//       after = accountInfos;
//
//       // 3. check
//       const account1Before = before[0];
//       const account2Before = before[1];
//       const account3Before = before[2];
//
//       const account1After = after[0];
//       const account2After = after[1];
//       const account3After = after[2];
//
//       console.log(before);
//       console.log(after);
//       console.log(result);
//       return done();
//     }).catch(e => {
//       return done(e);
//     });
//   });
// });

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
