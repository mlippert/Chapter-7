// tests for widget-sketch
'use strict';
(function () {
    var expect = chai.expect;

    describe('Sketch widget tests', function () {
        describe('Sketch.splitOnNumbers', function () {
            it('should handle the simple case w/ no numbers', function () {
				var result = Sketch.splitOnNumbers("abc");
                expect(result.length).to.equal(1);
                expect(result[0]).to.equal("abc");
            });
            it('should handle the simple case of just a number', function () {
				var result = Sketch.splitOnNumbers(2);
                expect(result).to.have.length(3);
                expect(result[0]).to.be.empty;
                expect(result[1]).to.equal("2");
                expect(result[2]).to.be.empty;
            });
            it('should handle the simple case w/ one number group at end', function () {
				var result = Sketch.splitOnNumbers("abc23");
                expect(result).to.have.length(3);
                expect(result[0]).to.equal("abc");
                expect(result[1]).to.equal("23");
                expect(result[2]).to.be.empty;
            });
            it('should handle the text that starts with a number group', function () {
				var result = Sketch.splitOnNumbers("45abc");
                expect(result).to.have.length(3);
                expect(result[0]).to.be.empty;
                expect(result[1]).to.equal("45");
                expect(result[2]).to.equal("abc");
            });
            it('should handle the text with multiple number groups', function () {
				var result = Sketch.splitOnNumbers("a1b2c3e4f5g6h123cd43foo");
                expect(result).to.have.length(17);
                expect(result[0]).to.equal("a");
                expect(result[1]).to.equal("1");
                expect(result[2]).to.equal("b");
                expect(result[3]).to.equal("2");
                expect(result[4]).to.equal("c");
                expect(result[5]).to.equal("3");
                expect(result[6]).to.equal("e");
                expect(result[7]).to.equal("4");
                expect(result[8]).to.equal("f");
                expect(result[9]).to.equal("5");
                expect(result[10]).to.equal("g");
                expect(result[11]).to.equal("6");
                expect(result[12]).to.equal("h");
                expect(result[13]).to.equal("123");
                expect(result[14]).to.equal("cd");
                expect(result[15]).to.equal("43");
                expect(result[16]).to.equal("foo");
            });
        });
    });
})();
