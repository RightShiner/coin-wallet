'use strict';

module.exports = Wallet;

function Wallet(option) {
  return {
    generateAddress : function(currency) {
      return this.getModule(currency).generateAddress();
    },

    getAccountInfo : function(currency, address) {
      return this.getModule(currency).getAccountInfo(address);
    },

    /**
      @param {String} currency
      @param {String} params.senderAddress
      @param {String} params.senderSecretKey
      @param {String} params.receiverAddress
      @param {String} params.amount
    **/
    transfer : function(currency, params) {
      return this.getModule(currency).transfer(params);
    },

    getModule : function getModule(currency) {
      // if(currency === 'BTC') return require('./btc')(option);
      if(currency === 'XRP') return require('./xrp')(option);
      throw "No currency";
    }
  }
}
