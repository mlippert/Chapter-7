/* **************************************************************************
 * widget-carousel-spec.js                                                  $
 * **********************************************************************//**
 *
 * @fileoverview Carousel widget unit tests
 *
 * Created on		May 28, 2013
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

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

    describe('Carousels: when you need more than one', function () {
		var eventManager = null;

        describe('Creating a Carousel w/ 4 images', function () {
			var configImg =
				[
					{
						URI: 'img/test1.jpg',
						caption: "The seasons",
						preserveAspectRatio: "xMidYMid",
						actualSize: {height: 366, width: 443}
					},
					{
						URI: 'img/test2.png',
						caption: "Seaside Heights, NJ after Hurricane Sandy.",
						preserveAspectRatio: "xMidYMid",
						actualSize: {height: 550, width: 550},
						key: 'foo'
					},
					{
						URI: 'img/test3.jpg',
						caption: "Human Glands",
						preserveAspectRatio: "xMidYMid",
						actualSize: {height: 500, width: 430},
						key: 'foo'
					},
					{
						URI: 'img/test4.jpg',
						caption: "Nuclear Reactor Schematic Diagram",
						preserveAspectRatio: "xMidYMid",
						actualSize: {height: 310, width: 680}
					}
				];

			var configCarousel =
				{
					id: "crsl1",
					items:
						[
							new Image(configImg[0]),
							new Image(configImg[1]),
							new Image(configImg[2]),
							new Image(configImg[3])
						],
					layout: "horizontal",
					itemMargin: {top: 4, bottom: 4, left: 2, right: 2},
					presentation: "scaleToFit", // or "scroll"
					scrollMode: "nowrap"
				};
		
			var myCarousel = null;
			var selectEventCount = 0;
			var lastSelectEventDetails = null;
			var logSelectEvent =
				function logSelectEvent(eventDetails)
				{
					++selectEventCount;
					lastSelectEventDetails = eventDetails;
				};

			before(function () {
				eventManager = new EventManager();
				selectEventCount = 0;
				lastSelectEventDetails = null;

				myCarousel = new Carousel(configCarousel, eventManager);
				eventManager.subscribe(myCarousel.selectedEventId, logSelectEvent);
			});
			
            it('should have the id specified in the config', function () {
                expect(myCarousel.id).to.equal(configCarousel.id);
            });

            it('should create keys for all images w/o a key', function () {
                expect(myCarousel.items[0]).to.have.property('key').that.is.a('string');
                expect(myCarousel.items[3]).to.have.property('key').that.is.a('string');
            });

            it('should leave existing keys on images unchanged', function () {
                expect(myCarousel.items[1]).to.have.property('key', 'foo').that.is.a('string');
                expect(myCarousel.items[2]).to.have.property('key', 'foo').that.is.a('string');
            });

			it('should have an uninitialized lastdrawn property', function () {
                expect(myCarousel.lastdrawn).to.have.property('container').that.is.null;
                expect(myCarousel.lastdrawn).to.have.deep.property('size.height', 0);
                expect(myCarousel.lastdrawn).to.have.deep.property('size.width', 0);
                expect(myCarousel.lastdrawn).to.have.property('widgetGroup').that.is.null;
            });

			describe('.itemKeyToIndex()', function () {
				it('should return the first index with a matching key', function () {
					expect(myCarousel.itemKeyToIndex('foo')).to.equal(1);
				});

				it('should correctly find the first item', function () {
					var firstKey = myCarousel.items[0].key;
					expect(myCarousel.itemKeyToIndex(firstKey)).to.equal(0);
				});

				it('should correctly find the last item', function () {
					var lastKey = myCarousel.items[myCarousel.items.length-1].key;
					expect(myCarousel.itemKeyToIndex(lastKey)).to.equal(myCarousel.items.length-1);
				});

				it("should return null when the key isn't found", function () {
					expect(myCarousel.itemKeyToIndex('bad key')).to.be.null;
				});
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
						cntr.append(myCarousel);
					});
					
					it('should set the lastdrawn container and size properties to the values passed in', function () {
						// get the last element of the container
						// note: this uses internal knowledge of SVGContainer.append which may change. -mjl
						var cntrArg = cntr.svgObj.select("g.widget:last-child");
						var sizeArg = {height: 300, width: 400};
						expect(myCarousel.lastdrawn.container.node()).to.deep.equal(cntrArg.node());
						expect(myCarousel.lastdrawn.size).to.deep.equal(sizeArg);
					});

					it('should have appended a group element with class \'widgetCarousel\' to the container' +
					   ' and set the lastdrawn.widgetGroup to that d3 selection', function () {
						// get the last element of the container
						// note: this uses internal knowledge of SVGContainer.append which may change. -mjl
						var last = cntr.svgObj.select("g.widget:last-child :last-child");
						expect(last.node().nodeName).to.equal('g');
						expect(last.classed('widgetCarousel')).to.be.true;
						expect(myCarousel.lastdrawn.widgetGroup.node()).to.deep.equal(last.node());
					});

					// todo: Implement this test. -mjl
					it.skip('should create a widgetItem group for each image whose 1st child is a selection rect', function () {
					});
				});

				describe('.selectItemAtIndex()', function () {
					it('should publish the carousel.selectedEventId with the key of the item at that index', function () {
						var prevSelectEventCount = selectEventCount;
						myCarousel.selectItemAtIndex(1);
						expect(selectEventCount).is.equal(prevSelectEventCount + 1);
						expect(lastSelectEventDetails.selectKey).is.equal('foo');
					});

					it('should re-select an already selected item', function() {
						var prevSelectEventCount = selectEventCount;
						myCarousel.selectItemAtIndex(1);
						expect(selectEventCount).is.equal(prevSelectEventCount + 1);
						expect(lastSelectEventDetails.selectKey).is.equal('foo');
						lastSelectEventDetails = null;
						myCarousel.selectItemAtIndex(1);
						expect(selectEventCount).is.equal(prevSelectEventCount + 2);
						expect(lastSelectEventDetails.selectKey).is.equal('foo');
					});
				});
			});	
		});
    });
})();
