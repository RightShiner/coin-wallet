'use strict';

describe('require', function(){
  it('with no call', function(){
    require('../lib');
  });
  it('with no option', function(){
    require('../lib')();
  });
  it('with empty option', function(){
    require('../lib')({});
  });
})
