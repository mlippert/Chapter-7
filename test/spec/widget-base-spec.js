// sample test for widget-base
'use strict';
(function () {
    var expect = chai.expect;

    describe('Utility functions should be awesome', function () {
        describe('logFormat should do logFormatting', function () {
            it('should produce negative decade tick label -2 from 10^2', function () {
                expect(logFormat(Math.pow(10, -2))).to.equal(-2);
            });
            it('should produce no tick label from 2*10-3', function () {
                expect(logFormat(2 * Math.pow(10, -3))).to.equal('');
            });
            it('should produce no odd decade tick label from 10^3', function () {
                expect(logFormat(Math.pow(10, -3))).to.equal('');
            });
        });
		
		describe('sign function determines sign of a number', function () {
            it('negative numbers should return -1', function () {
                expect(sign(-42)).to.equal(-1);
            });
            it('positive numbers should return 1', function () {
                expect(sign(4.5)).to.equal(1);
            });
            it('strings should produce 1', function () {
                expect(sign("foo")).to.equal(1);
            });
			it('NaNs should produce 0', function () {
                expect(sign(NaN)).to.equal(0);
            });
        });
    });
	
	
})();