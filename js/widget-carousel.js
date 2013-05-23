/* **************************************************************************
 * $Workfile:: widget-carousel.js                                           $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the Carousel widget.
 *
 * The Carousel widget draws a collection of images in an SVGContainer and
 * allows one of them to be selected.
 *
 * Created on		May 04, 2013
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample configuration objects for classes defined here
(function()
{
	// config for Carousel class
	var carouselConfig =
		{
			id: "crsl1",
			items: [],
			layout: "horizontal",
			itemMargin: {top: 4, bottom: 4, left: 2, right: 2},
			presentation: "scaleToFit", // or "scroll"
			scrollMode: "nowrap"
		};
});

/* **************************************************************************
 * Carousel                                                             *//**
 *
 * The Carousel widget draws a collection of images in an SVGContainer and
 * allows one of them to be selected.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this Carousel
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this Carousel.
 * 										 if undefined a unique id will be assigned.
 * @param {Array.<IWidget>}
 *						config.items	-The list of widgets to be presented by the Carousel.
 * @param {string}		config.layout	-How the carousel will layout the items (vertical or horizontal).
 * @param {{top: number, bottom: number, left: number, right: number}}
 *						config.itemMargin
 *										-The margin around each item, note that the
 *										 intra-item gap will be the sum of the left and right margin.
 * @param {string}		config.presentation
 *										-How should the items be presented if they won't
 *										 fit naturally? scaleToFit or scroll?
 * @param {string}		config.scrollMode
 *										-If the carousel presentation is "scroll" should it
 *										 wrap from one end to the other or stop when the
 *										 first or last item is visible.
 *
 * @todo Implement the "vertical" layout -mjl
 * @todo Implement the "scroll" presentation, after we figure out what it means to fit naturally (maybe it means we specify an itemAspectRatio). -mjl
 *
 ****************************************************************************/
function Carousel(config, eventManager)
{
	var that = this;
	
	/**
	 * A unique id for this instance of the carousel widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, Carousel);

	/**
	 * The list of widgets presented by the Carousel.
	 * @type {Array.<IWidget>}
	 */
	this.items = config.items;

	this.assignMissingItemKeys_();
	
	/**
	 * How the carousel will layout the items (vertical or horizontal).
	 * @type {string}
	 */
	this.layout = config.layout;
	
	/**
	 * The margin around each item, note that the
	 * intra-item gap will be the sum of the left and right margin.
	 * @type {{top: number, bottom: number, left: number, right: number}}
	 */
	this.itemMargin = config.itemMargin;
	
	/**
	 * How should the items be presented if they won't fit naturally? scaleToFit or scroll?
	 * @type {string}
	 */
	this.presentation = config.presentation;
	
	/**
	 * If the carousel presentation is "scroll" should it wrap from one end
	 * to the other or stop when the first or last item is visible.
	 * @type {string}
	 */
	this.scrollMode = config.scrollMode;
	
	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager;

	/**
	 * The event id published when an item in this carousel is selected.
	 * @const
	 * @type {string}
	 */
	this.selectedEventId = this.id + '_itemSelected';
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string} selectKey	-The key associated with the selected item.
	 */

	/**
	 * Information about the last drawn instance of this image (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			size: {height: 0, width: 0},
			widgetGroup: null,
		};
} // end of Carousel constructor

/**
 * Prefix to use when generating ids for instances of LabelGroup.
 * @const
 * @type {string}
 */
Carousel.autoIdPrefix = "crsl_auto_";

/* **************************************************************************
 * Carousel.draw                                                        *//**
 *
 * Draw this Carousel in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the carousel element tree to.
 * @param {Object}	size		-The size in pixels for the carousel
 * @param {number}	size.height	-The height in pixels of the area the carousel is drawn within.
 * @param {number}	size.width	-The width in pixels of the area the carousel is drawn within.
 *
 ****************************************************************************/
Carousel.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;

	var that = this;
	
	var itemMargin = this.itemMargin;
	
	// We don't support anything other than this.presentation === "sizeToFit"
	// and this.layout === "horizontal"
	
	// Carve the width up for the n items
	var itemCnt = this.items.length;
	var itemSize = {height: size.height - (itemMargin.top + itemMargin.bottom),
					width: size.width / (itemCnt ? itemCnt : 1)
									- (itemMargin.left + itemMargin.right)};

	// function used to place each item into its correct position
	var translateItem =
		function (d, i)
		{
			var x = itemMargin.left + i * (itemMargin.left + itemSize.width + itemMargin.right);
			var y = itemMargin.top;
			return attrFnVal("translate", x, y);
		};

	// Make sure they fit
	// TODO: error handling -mjl
	
	
	// make a group to hold the carousel
	var widgetGroup = container.append("g")
		.attr("class", "widgetCarousel")
		.attr("id", this.id);

	// Rect for the background of the carousel
	widgetGroup
		.append("rect")
			.attr("class", "background")
			.attr("width", size.width)
			.attr("height", size.height);

	// Create a group for each item then draw the item in that group
	itemGroups = widgetGroup.selectAll("g.widgetItem").data(this.items);
	
	itemGroups.enter()
		.append("g")
			.attr("class", "widgetItem")
			.each(function (d)
				  {
					  d.draw(d3.select(this), itemSize);
				  })
			.append("rect")
				.attr("class", "selection")
				.attr("width", itemSize.width + 2)
				.attr("height", itemSize.height + 2)
				.attr("stroke-width", 2)
				.attr("x", -1)
				.attr("y", -1);
	
	// position each item
	itemGroups
		.attr("transform", translateItem);

	itemGroups.on('click',
				  function (d, i)
				  {
					  that.selectItemAtIndex(i);
				  });
				
	this.lastdrawn.widgetGroup = widgetGroup;

}; // end of Carousel.draw()

/* **************************************************************************
 * Carousel.redraw                                                      *//**
 *
 * Redraw the image as it may have been changed (new URI or caption). It will be
 * redrawn into the same container area as it was last drawn.
 *
 ****************************************************************************/
Carousel.prototype.redraw = function ()
{
	// TODO: Do we want to allow calling redraw before draw (ie handle it gracefully
	//       by doing nothing? -mjl
	var image = this.widgetGroup.select("image");
	image.attr("xlink:href", this.URI);
	
	var desc = image.select("desc");
	desc.text(this.caption);
};

/* **************************************************************************
 * Carousel.selectedItem                                                *//**
 *
 * Return the selected item in the carousel.
 *
 * @return {Object} the carousel item which is currently selected.
 *
 ****************************************************************************/
Carousel.prototype.selectedItem = function ()
{
	return this.lastdrawn.widgetGroup.select("g.widgetItem.selected").datum();
};

/* **************************************************************************
 * Carousel.selectItemAtIndex                                           *//**
 *
 * Select the item in the carousel at the given index.
 *
 * @param {number}	index	-the 0-based index of the item to flag as selected.
 *
 ****************************************************************************/
Carousel.prototype.selectItemAtIndex = function (index)
{
	var itemGroups = this.lastdrawn.widgetGroup.selectAll("g.widgetItem");
	itemGroups.classed("selected", false);

	var selectedItemGroup = d3.select(itemGroups[0][index]);
	selectedItemGroup.classed("selected", true);

	this.eventManager.publish(this.selectedEventId, {selectKey: selectedItemGroup.datum().key});
};

/* **************************************************************************
 * Carousel.calcOptimumHeightForWidth                                   *//**
 *
 * Calculate the optimum height for this carousel laid out horizontally
 * to fit within the given width.
 *
 * @param {number}	width	-The width available to lay out the images in the carousel.
 *
 * @return {number) The optimum height for the carousel to display its items
 * 					in the given width.
 *
 ****************************************************************************/
Carousel.prototype.calcOptimumHeightForWidth = function (width)
{
	// Carve the width up for the n items
	var itemCnt = this.items.length;
	var itemWidth = width / itemCnt - (this.itemMargin.left + this.itemMargin.right);

	var getHeight = function (item)
	{
		var hwRatio = item.actualSize.height / item.actualSize.width;
		return itemWidth * hwRatio;
	};

	// Try optimum being the average height
	var itemHeights = this.items.map(getHeight);
	var heightSum = itemHeights.reduce(function (pv, cv) {return pv + cv;});

	return (heightSum / itemCnt) + this.itemMargin.top + this.itemMargin.bottom;
};

/* **************************************************************************
 * Carousel.assignMissingItemKeys_                                      *//**
 *
 * Assign a key property value of the index in the item list to any
 * item which doesn't have a key property. This key is used for selection and
 * highlighting.
 * @private
 *
 ****************************************************************************/
Carousel.prototype.assignMissingItemKeys_ = function ()
{
	this.items.forEach(function (item, i)
					   {
						   // A falsy key is invalid, set it to the index
						   if (!item.key)
						   {
							   item.key = i.toString();
						   }
					   });
};

/* **************************************************************************
 * Carousel.lite                                                        *//**
 *
 * Highlight the label(s) associated w/ the given liteKey (key) and
 * remove any highlighting on all other labels.
 *
 * @param {string|number}	liteKey	-The key associated with the label(s) to be highlighted.
 *
 ****************************************************************************/
Carousel.prototype.lite = function (liteKey)
{
	console.log("called Carousel.lite( " + liteKey + " )");

	// todo: this works well when all the items are Images but not so well for other widget types
	this.items.forEach(function (item) {item.lite(liteKey);});
	
}; // end of Carousel.lite()

