// sample test for widget-linegraph
'use strict';


(function () {
    var expect = chai.expect;

	/**
	 * createNewDiv will find the mocha div and create and return a sibling div following it
	 */
	var createNewDiv = function () {
		var mochaDiv = d3.select("div#mocha");
		var parent = d3.select(mochaDiv.node().parentNode);
		return parent.append("div").node();
	};

    describe('LineGraphs should be awesome', function () {
		var eventManager = null;

        describe('Creating a LineGraph with linear data', function () {
			var testData = [
				{ x:    0, y: 1 },
				{ x:    4, y: 4 },
				{ x: 1000, y: 1000 }
			];
				
			var configGraph = {
				id: "lg0",
				Data: [testData],
				type: "lines",
				xAxisFormat: { type: "linear",
							   ticks: 5,
							   orientation: "bottom",
							   label: "one line with markup <span class='math'>y=x<sup>2</sup></span>" },
				yAxisFormat: { type: "linear",
							   ticks: 5,
							   orientation: "right",
							   label: "Labels can have extended chars (&mu;m)" },
			};
		
			var myGraph = null;

			before(function () {
				eventManager = new EventManager();
				myGraph = new LineGraph(configGraph);
			});
			
            it('should create lines id from base id + _lines', function () {
                expect(myGraph.lastdrawn.linesId).to.equal(myGraph.id + '_lines');
            });

			it('should know it has a point at 0,1', function () {
                expect(myGraph.data[0][0]).to.deep.equal({x:0,y:1});
            });

			it('should create an empty array of child Widgets', function () {
                expect(myGraph.childWidgets.beforeData).to.be.empty;
                expect(myGraph.childWidgets.afterData).to.be.empty;
            });

			describe('DOM manipulation (create/update elements) tests', function () {
				var configCntr = {
					node: null,
					maxWid: 400,
					maxHt: 300
				};
				var targetEl = null;
				var cntr = null;

				var createNewSvgContainer = function () {
					// Clean up node from previous test
					configCntr.node && configCntr.node.remove();
					// Get a reference to an empty div to create the widget in.
					configCntr.node = d3.select(createNewDiv());
					// Create an empty svg container to be able to append a LineGraph to.
					cntr = new SVGContainer(configCntr);
				};

				after(function () {
					// Clean up test modifications to the DOM
					configCntr.node && configCntr.node.remove();
				});
					
				describe('draw()', function () {
					before(function () {
						createNewSvgContainer();
						// append will call draw()
						cntr.append(myGraph);
					});
					
					it('should scale the min of x range to the left edge of svg box', function () {
						expect(myGraph.lastdrawn.xScale(0)).to.equal(0);
					});

					 it('should make a group in svg with linesId', function () {
						expect(myGraph.lastdrawn.graph.attr("id")).to.equal(myGraph.lastdrawn.linesId);
					});
				});
			});	
		});
    });
})();
