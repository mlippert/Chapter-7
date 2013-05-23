/* **************************************************************************
 * $Workfile:: widget-imageviewer.js                                        $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the ImageViewer widget.
 *
 * The ImageViewer widget draws the common widget configuration of a
 * Carousel widget presenting a collection of images with the selected
 * image displayed in an Image widget below the carousel.
 *
 * Created on		May 18, 2013
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample configuration objects for classes defined here
(function()
{
	// config for ImageViewer class
	var imageviewerConfig =
		{
			id: "imgvwr1",
			items: [],
		};
});

/* **************************************************************************
 * ImageViewer                                                          *//**
 *
 * The ImageViewer widget draws the common widget configuration of a
 * Carousel widget presenting a collection of images with the selected
 * image displayed in an Image widget below the carousel.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}			config			-The settings to configure this ImageViewer
 * @param {string|undefined}
 * 							config.id		-String to uniquely identify this ImageViewer.
 * 											 if undefined a unique id will be assigned.
 * @param {Array.<Image>}	config.items	-The list of Image widgets to be presented by the ImageViewer.
 * @param {EventManager}	eventManager	-allows the widget to publish and subscribe to events
 *
 ****************************************************************************/
function ImageViewer(config, eventManager)
{
	var that = this;
	
	/**
	 * A unique id for this instance of the image viewer widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, ImageViewer);

	/**
	 * The list of widgets presented by the Carousel in this ImageViewer.
	 * @type {Array.<IWidget>}
	 */
	this.items = config.items;

	this.assignMissingItemKeys_();

	// The ImageViewer uses a standard layout of the Carousel to make its
	// configuration simpler.
	var crslConfig =
		{
			id: this.id + "_crsl",
			items: this.items,
			layout: "horizontal",
			itemMargin: {top: 4, bottom: 4, left: 2, right: 2},
			presentation: "scaleToFit",
			scrollMode: "nowrap"
		};

	/**
	 * The carousel widget used by this ImageViewer to present the images.
	 * @type {Carousel}
	 */
	this.carousel = new Carousel(crslConfig, eventManager);

	// We may want to eventually support an empty image, but for now
	// we'll just copy the 1st image into the display image.
	var imgConfig =
		{
			URI: this.items[0].URI,
			caption: this.items[0].caption,
			preserveAspectRatio: this.items[0].preserveAspectRatio,
			actualSize: this.items[0].actualSize
		};

	var cimgConfig =
		{
			id: this.id + "_cimg",
			image: new Image(imgConfig),
			captionPosition: "below"
		};

	/**
	 * The captioned image widget which displays the image selected
	 * in the carousel.
	 * @type {CaptionedImage}
	 */
	this.image = new CaptionedImage(cimgConfig);

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
	this.selectedEventId = this.carousel.selectedEventId;
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string} selectKey	-The key associated with the selected item.
	 */

	// event handler that connects the carousel selection to changing and redrawing
	// the image below.
	var handleCarouselSelection = function (eventDetails)
	{
		that.image.changeImage(that.carousel.selectedItem().URI,
							   that.carousel.selectedItem().caption);
		that.image.redraw();
	};

	eventManager.subscribe(this.carousel.selectedEventId, handleCarouselSelection);

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
} // end of ImageViewer constructor

/**
 * Prefix to use when generating ids for instances of ImageViewer.
 * @const
 * @type {string}
 */
ImageViewer.autoIdPrefix = "imgvwr_auto_";

/* **************************************************************************
 * ImageViewer.draw                                                     *//**
 *
 * Draw this ImageViewer in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the carousel element tree to.
 * @param {Object}	size		-The size in pixels for the carousel
 * @param {number}	size.height	-The height in pixels of the area the carousel is drawn within.
 * @param {number}	size.width	-The width in pixels of the area the carousel is drawn within.
 *
 ****************************************************************************/
ImageViewer.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;

	var that = this;
	
	// make a group to hold the imageviewer
	var widgetGroup = container.append("g")
		.attr("class", "widgetImageViewer")
		.attr("id", this.id);

	// Rect for the background of the image viewer
	widgetGroup
		.append("rect")
			.attr("class", "background")
			.attr("width", size.width)
			.attr("height", size.height);

	// calculate the optimum carousel height for the given width, but don't let
	// it be greater than 35% of the total height of this ImageViewer.
	var carouselHeight = Math.min(this.carousel.calcOptimumHeightForWidth(size.width),
								  0.35 * size.height);

	// Carousel goes at the top
	var carouselGroup = widgetGroup.append("g");
	this.carousel.draw(carouselGroup, {height: carouselHeight, width: size.width});

	// Image goes below carousel
	var imageGroup = widgetGroup.append("g")
		.attr("transform", attrFnVal("translate", 0, carouselHeight));

	this.image.draw(imageGroup, {height: size.height - carouselHeight, width: size.width});

	this.lastdrawn.widgetGroup = widgetGroup;

	// Initial selection is the 1st image
	this.selectItemAtIndex(0);

}; // end of ImageViewer.draw()

/* **************************************************************************
 * ImageViewer.redraw                                                   *//**
 *
 * Redrawing the ImageViewer currently does nothing.
 *
 ****************************************************************************/
ImageViewer.prototype.redraw = function ()
{
};

/* **************************************************************************
 * ImageViewer.selectedItem                                             *//**
 *
 * Return the selected item in the carousel.
 *
 * @return {Object} the carousel item which is currently selected.
 *
 ****************************************************************************/
ImageViewer.prototype.selectedItem = function ()
{
	return this.carousel.selectedItem();
};

/* **************************************************************************
 * ImageViewer.selectItemAtIndex                                        *//**
 *
 * Select the item in the carousel at the given index.
 *
 * @param {number}	index	-the 0-based index of the item to flag as selected.
 *
 ****************************************************************************/
ImageViewer.prototype.selectItemAtIndex = function (index)
{
	this.carousel.selectItemAtIndex(index);
};

/* **************************************************************************
 * ImageViewer.assignMissingItemKeys_                                   *//**
 *
 * Assign a key property value of the index in the item list to any
 * item which doesn't have a key property. This key is used for selection and
 * highlighting.
 * @private
 *
 ****************************************************************************/
ImageViewer.prototype.assignMissingItemKeys_ = function ()
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
 * ImageViewer.lite                                                     *//**
 *
 * Highlight the image(s) associated w/ the given liteKey (key) and
 * remove any highlighting on all other images.
 *
 * @param {string|number}	liteKey	-The key associated with the image(s) to be highlighted.
 *
 ****************************************************************************/
ImageViewer.prototype.lite = function (liteKey)
{
	console.log("called ImageViewer.lite( " + liteKey + " )");

	this.carousel.lite(liteKey);
	this.image.lite(liteKey);
	
}; // end of ImageViewer.lite()

