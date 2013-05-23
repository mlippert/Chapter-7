/* **************************************************************************
 * $Workfile:: widget-base.js                                               $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the utility functions and objects
 *               used by widgets.
 *
 * Created on		March 27, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/


/* **************************************************************************
 * Utilities
 * **********************************************************************//**
 * @todo These need to be moved out of global scope! -mjl
 * **************************************************************************/

function measure(container)
{
	if (!container)
		return { height: 0, width: 0 };

	//container.append('text').attr({x: -1000, y: -1000}).text(text);
	var bbox = container.node().getBBox();
	//container.remove();
	return { height: bbox.height,
			 width:  bbox.width };
}

function logFormat(d)
{
	var x = (Math.log(d) / Math.log(10)) + 1e-6; //find the log base 10 (plus a little for zero padding)
	//then see if the log has abscissa 1, and only return numbers for those, and even
	return (Math.abs(x - Math.floor(x)) < .1)&&(Math.floor(x)%2==0) ? d3.round(Math.log(d)/Math.log(10)) : "";
}


/* **************************************************************************
 * attrFnVal                                                            *//**
 *
 * Utility method that constructs a string function call given the
 * function name and arguments.
 *
 * @param {string}		fnName		-Function name that will be called.
 * @param {...[number]} arguments	-Arguments for the function call.
 ****************************************************************************/
function attrFnVal(fnName)
{
	// get the fn args into an Array
	var args = Array.prototype.slice.call(arguments, 1);

	var fnCallStr = fnName + '(';
	fnCallStr += args.join(',');
	fnCallStr += ')';
	
	return fnCallStr;
}

/* **************************************************************************
 * getIdFromConfigOrAuto                                                *//**
 *
 * Utility method that returns the id property of the config object or
 * uses the autoIdCount and autoIdPrefix properties of the class to return
 * the next auto assigned id for that class.
 *
 * @param {Object}		config		-object containing optional string id property.
 * @param {Object}		autoIdClass	-class object to supply the auto id
 *
 * @return {string} id from config or generated.
 *
 * @todo seems like this would be better as a static base class method once
 *       we have a base class for widgets.
 ****************************************************************************/
function getIdFromConfigOrAuto(config, autoIdClass)
{
	if (config.id !== undefined)
	{
		return config.id;
	}

	// Get the next auto id from the class
	// handle missing auto id properties
	if (!('autoIdCount' in autoIdClass))
	{
		autoIdClass.autoIdCount = 0;
	}

	if (!('autoIdPrefix' in autoIdClass))
	{
		autoIdClass.autoIdPrefix = "auto" + (++getIdFromConfigOrAuto.autoPrefixCount) + "_";
	}

	return autoIdClass.autoIdPrefix + (++autoIdClass.autoIdCount);
}

/**
 * Count of class autoIdPrefix properties that have been set by getIdFromConfigOrAuto.
 */
getIdFromConfigOrAuto.autoPrefixCount = 0;

//Tests for logFormat function
console.log("logFormat 10^-2 produces negative decade tick label -2", logFormat(Math.pow(10, -2)) == -2);
console.log("logFormat 2*10^-3 produces no tick label", logFormat(2 * Math.pow(10, -3)) == "");
console.log("logFormat 10^3 produces no odd decade tick label", logFormat(Math.pow(10, 3)) == "");


/* **************************************************************************
 * Rect                                                                 *//**
 *
 * A Rect defines a rectangle on a plane whose coordinates increase down and
 * to the right.
 * It has a top, bottom, left, right, width and height.
 * @constructor
 *
 * @param {number}	x		-The x-coordinate location of the left side of the rectangle.
 * @param {number}	y		-The y-coordinate location of the top side of the rectangle.
 * @param {number}	width	-A non-negative value that represents the Width of the rectangle.
 * @param {number}	height	-A non-negative value that represents the Height of the rectangle.
 *
 * @todo consider using javascript property accessor for width/height, so dependent properties stay consistent
 *
 ****************************************************************************/
function Rect(x, y, width, height)
{
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	
	this.top = y;
	this.left = x;
	this.bottom = this.top + height;
	this.right = this.left + width;
}

/* **************************************************************************
 * Rect.getSize                                                         *//**
 *
 * Get the size of this rect in a Size object.
 *
 * @return {Size}
 ****************************************************************************/
 Rect.prototype.getSize = function ()
 {
	return { height: this.height, width: this.width };
 };

/* **************************************************************************
 * Rect.makeRect - static                                               *//**
 *
 * Helper function to create a rect from any 2 vertical values (t,b,h) and
 * any 2 horizontal values (l,r,w). If 3 values are specified, the height
 * and width are the values that will be ignored (not checked that they match
 * the other 2 values).
 *
 * @param {Object} definedBy	-object that must have 2 vertical values (t,b,h)
 *								 and 2 horizontal values (l,r,w).
 * @return {Rect}
 ****************************************************************************/
Rect.makeRect = function (definedBy)
{
	var vertCnt = 0;
	
	if ('t' in definedBy)
	{
		var haveT = true;
		++vertCnt;
	}
	
	if ('b' in definedBy)
	{
		var haveB = true;
		++vertCnt;
	}
	
	if ('h' in definedBy)
	{
		var haveH = true;
		++vertCnt;
	}
	
	var horizCnt = 0;
	
	if ('l' in definedBy)
	{
		var haveL = true;
		++horizCnt;
	}
	
	if ('r' in definedBy)
	{
		var haveR = true;
		++horizCnt;
	}
	
	if ('w' in definedBy)
	{
		var haveW = true;
		++horizCnt;
	}
	
	// todo: What is the appropriate abort mechanism? throw? if so throw what? -mjl
	if (vertCnt < 2)
		console.log("Cannot define rect, not enough vertical values", definedBy);

	if (horizCnt < 2)
		console.log("Cannot define rect, not enough horizontal values", definedBy);
		
	if (haveT)
	{
		var top = definedBy.t;
		var bottom = haveB ? definedBy.b : top + definedBy.h;
		var height = bottom - top;
	}
	else // must have B & H
	{
		var bottom = definedBy.b;
		var height = definedBy.h;
		var top = bottom - height;
	}
	
	if (haveL)
	{
		var left = definedBy.l;
		var right = haveR ? definedBy.r : left + definedBy.w;
		var width = right - left;
	}
	else // must have R & W
	{
		var right = definedBy.r;
		var width = definedBy.w;
		var left = right - width;
	}
	
	return new Rect(left, top, width, height);
}; // end Rect.makeRect

/* **************************************************************************
 * Size                                                                 *//**
 *
 * Size defines a 2 dimensional area. It has a height and a width in some
 * common unit such as pixels.
 *
 * @param {number}	height	-The vertical dimension in the common units
 * @param {number}	width	-The horizontal dimension in the common units
 ****************************************************************************/
function Size(height, width)
{
	/**
	 * The number of units that measures the vertical dimension.
	 * @type {number}
	 */
	this.height = height;

	/**
	 * The number of units that measures the horizontal dimension.
	 * @type {number}
	 */
	this.width = width;
}
 
/* **************************************************************************
 * Size.matchRatioWithHeight                                            *//**
 *
 * Return a Size with the specified height whose aspect ratio is the same as
 * that of the given size.
 *
 * @param {number}	desiredHeight	-The vertical dimension of the Size to be returned.
 * @param {Size}	desiredRatio	-A Size whose ratio should be preserved in the returned Size.
 * @return {Size}
 ****************************************************************************/
Size.matchRatioWithHeight = function (desiredHeight, desiredRatio)
{
	return {height: desiredHeight,
			width: desiredRatio.width * desiredHeight / desiredRatio.height};
};

/* **************************************************************************
 * Size.matchRatioWithWidth                                             *//**
 *
 * Return a Size with the specified width whose aspect ratio is the same as
 * that of the given size.
 *
 * @param {number}	desiredWidth	-The horizontal dimension of the Size to be returned.
 * @param {Size}	desiredRatio	-A Size whose ratio should be preserved in the returned Size.
 * @return {Size}
 ****************************************************************************/
Size.matchRatioWithWidth = function (desiredWidth, desiredRatio)
{
	return {height: desiredRatio.height * desiredWidth / desiredRatio.width,
			width: desiredWidth};
};


/* **************************************************************************
 * Interfaces
 * **************************************************************************/
 
/* **************************************************************************
 * IWidget                                                              *//**
 *
 * IWidget defines the methods and properties that are expected to exist
 * on all widgets defined by this library.
 * @interface
 ****************************************************************************/
IWidget = function () {};
 
/* **************************************************************************
 * IWidget.draw                                                         *//**
 *
 * Render the widget into the given svg container at the given pixel size.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the widget element tree to.
 * @param {Object}	size		-The size in pixels for the widget
 * @param {number}	size.height	-The height for the widget.
 * @param {number}	size.width	-The width for the widget.
 *
 ****************************************************************************/
IWidget.prototype.draw = function (container, size) {};

/* **************************************************************************
 * IWidget.redraw                                                       *//**
 *
 * Redraw the widget assuming its data may have been modified. It will be
 * redrawn into the same container area as it was last drawn.
 *
 ****************************************************************************/
IWidget.prototype.redraw = function () {};

/* **************************************************************************
 * IWidget.setScale                                                     *//**
 *
 * Called to preempt the normal scale definition which is done when the
 * widget is drawn. This is usually called in order to force one widget
 * to use the scaling/data area calculated by another widget.
 *
 * @param {function(number): number}
 *						xScale	-function to convert a horizontal data offset
 *								 to the pixel offset into the data area.
 * @param {function(number): number}
 *						yScale	-function to convert a vertical data offset
 *								 to the pixel offset into the data area.
 ****************************************************************************/
IWidget.prototype.setScale = function (xScale, yScale) {};

/* **************************************************************************
 * IWidget.lite                                                         *//**
 *
 * Highlight the area identified by the given key, unlighting all other
 * liteable areas.
 * Note that how the individual widget associates a given key with a particular
 * area is up to the widget implementation.
 *
 * @param {string}	liteKey	-The key associated with the area to be highlighted.
 *
 ****************************************************************************/
IWidget.prototype.lite = function (liteKey) {};

/* **************************************************************************
 * IWidget.xScale                                                       *//**
 *
 * Convert a data X position into a horizontal pixel position.
 *
 * @param {number}	dataX	-position along the X axis from the data domain.
 * @return {number} horizontal pixel offset corresponding to that data position.
 ****************************************************************************/
IWidget.prototype.xScale = function (dataX) {};

/* **************************************************************************
 * IWidget.yScale                                                       *//**
 *
 * Convert a data Y position into a vertical pixel position.
 *
 * @param {number}	dataY	-position along the Y axis from the data domain.
 * @return {number} vertical pixel offset corresponding to that data position.
 ****************************************************************************/
IWidget.prototype.yScale = function (dataY) {};

 /**
 * Definition of the fields of the configuration object used by the
 * SVGContainer constructor.
 * documentation, not to be called/instantiated.
 * @constructor
 */
function SVGContainerConfig()
{
	/**
	 * The parent node for the created svg element
	 * @type {!d3.selection}
	// Note: may need to change this to be a standard DOM node object -lb
	 */
	this.node = null;

	/**
	 * The maximum width of the svg container (in pixels)
	 * @type {number}
	 */
	this.maxWid = 0;

	/**
	 * The maximum height of the svg container (in pixels)
	 * @type {number}
	 */
	this.maxHt = 0;
}

/* **************************************************************************
 * SVGContainer                                                         *//**
 *
 * @constructor
 *
 * The SVGContainer creates an svg element and appends it as the last
 * child of the given node. The svg elements properties are set based on
 * the given configuration values.
 *
 * @param {Object}        config -The settings to configure this SVGContainer
 * @param {!d3.selection} config.node -The parent node for the created svg element
 * @param {number}        config.maxWid -The maximum width of the svg container (in pixels)
 * @param {number}        config.maxHt -The maximum width of the svg container (in pixels)
 *
 ****************************************************************************/
function SVGContainer(config)
{
	/**
	 * The parent node of the created svg element
	 * @type {d3.selection}
	 */
	this.parentNode = config.node;

	/**
	 * The maximum width of this svg container (in pixels)
	 * @type {number}
	 */
	this.maxWid = config.maxWid;

	/**
	 * The maximum height of this svg container (in pixels)
	 * @type {number}
	 */
	this.maxHt = config.maxHt;

	// It's easy to specify the node incorrectly, lets call that out right away!
	if (this.parentNode.empty())
	{
		alert("SVGContainer parent node doesn't exist.");
		return null;
	}

	// todo: why is the container talking about graphs? in the comment below -mjl
	//maxWid, maxHt: the width and height of the graph region, without margins, integers

	// create the svg element for this container of the appropriate size and scaling
	/**
	 * The svg element representing the container in the document
	 * @type {d3.selection}
	 */
	this.svgObj = this.parentNode.append("svg")						// append the new svg element to the parent node
		.attr("viewBox", "0 0 " + this.maxWid + " " + this.maxHt)	// set its size
		.attr("preserveAspectRatio", "xMinYMin meet")				// make it scale correctly in single-column or phone layouts
		.style("max-width", this.maxWid + "px")						// max width works to make it lay out to scale
		.style("max-height", this.maxHt + "px");					// max height keeps it from forcing whitespace below
																	//  in most cases, but not on Safari or Android.  This is a documented
																	//  webkit bug, which they claim they will fix eventually:
																	//  https://bugs.webkit.org/show_bug.cgi?id=82489
																	//  A horrible Jquery workaround is documented at
																	//  http://www.brichards.co.uk/blog/webkit-svg-height-bug-workaround
}

/* **************************************************************************
 * SVGContainer.append                                                  *//**
 *
 * Append the given widgets to the container at the specified location
 * within it. If multiple widgets are passed in, the x and y scale of
 * the 1st widget will be set on the other widgets before calling draw.
 *
 * @param {Object}	svgWidgets		-The widget or array of widgets to draw in the container
 * @param {Object}	location		-The location in the container where the widget should be placed.
 * @param {number}	location.topPercentOffset
 *									-Fraction offset of the top of the widget.
 * @param {number}	location.leftPercentOffset
 *									-Fraction offset of the left of the widget.
 * @param {number}	location.heightPercent
 *									-Fraction of container height for the widget height.
 * @param {number}	location.widthPercent
 *									-Fraction of container width for the widget width.
 *
 ****************************************************************************/
SVGContainer.prototype.append = function(svgWidgets, location)
{
	if (!$.isArray(svgWidgets))
	{
		this.append_one_(svgWidgets, location);
	}
	else
	{
		// When appending a group of widgets, the data scale of the 1st one
		// should be used by the rest of the widgets.
		for (var i = 0; i < svgWidgets.length; ++i)
		{
			if (i > 0)
			{
				svgWidgets[i].setScale(svgWidgets[0].xScale, svgWidgets[0].yScale);
			}

			this.append_one_(svgWidgets[i], location);
		}
	}
};

/* **************************************************************************
 * SVGContainer.append_one_                                             *//**
 *
 * Private helper that appends the given widget to the container at the
 * specified location within it.
 *
 * @param {Object}	svgWidget		-The widget to draw in the container
 * @param {Object}	location		-The location in the container where the widget should be placed.
 * @param {number}	location.topPercentOffset
 *									-Fraction offset of the top of the widget.
 * @param {number}	location.leftPercentOffset
 *									-Fraction offset of the left of the widget.
 * @param {number}	location.heightPercent
 *									-Fraction of container height for the widget height.
 * @param {number}	location.widthPercent
 *									-Fraction of container width for the widget width.
 *
 * @private
 *
 ****************************************************************************/
SVGContainer.prototype.append_one_ = function(svgWidget, location)
{
	// create a group for the widget to draw into that we can then position
	var g = this.svgObj.append('g').attr("class", "widget");
	var h = d3.round(location.heightPercent * this.maxHt);
	var w = d3.round(location.widthPercent * this.maxWid);
	svgWidget.draw(g, {height: h, width: w});
	
	// position the widget
	var top = d3.round(location.topPercentOffset * this.maxHt);
	var left = d3.round(location.leftPercentOffset * this.maxWid);
	if (top !== 0 || left !== 0)
	{
		g.attr('transform', 'translate(' + left + ',' + top + ')');
	}
};

/**
 * An AxisFormat describes how to format the axis of a graph.
 * objects w/ these fields are arguments to the Axes contructor.
 * @constructor
 */
function AxisFormat()
{
	/**
	 * The type of axis defines its scale.
	 * <ul>
	 * <li> "linear" - ...
	 * <li> "log" - ...
	 * <li> "ordinal" - The values along the axis are determined by a
	 *                  discrete itemized list, gathered from the graphed data.
	 * <li> "double positive" - axis that always counts up from zero,
	 *                          regardless of the sign of the data
	 * </ul>
	 * @type {string}
	 */
	this.type = "linear";

	/**
	 * The number of "ticks" to display along the axis including those
	 * at the ends of the axis. Should be a positive integer or zero and
	 * will be coerced to a valid value in an undefined way if not.
	 * Or if the type of axis is "ordinal" then ticks may be an array
	 * to be displayed evenly distributed along the axis.
	 * @type {number|Array.<*>}
	 */
	this.ticks = 5;

	/**
	 * The minimum and maximum data values expected for the axis in an
	 * array with the minimum as element 0 and the maximum as element 1.
	 * If undefined, will default to [0, 1], or the [min, max] of the ticks
	 * array if it is an array.
	 * @type {Array.<number>|undefined}
	 * TODO: find out why current behavior defaults a vertical axis to [0,1] and a horizontal axis to [1e-10,1] -mjl
	 */
	this.extent = [0, 1];

	/**
	 * There are 2 sets of orientation values, one for a horizontal (x) axis
	 * and one for a vertical (y) axis.
	 * <ul>
	 * <li> Horizontal (x) axis values
	 *   <ul>
	 *   <li> "top" - The axis should be displayed at the top of the display area
	 *   <li> "bottom" - The axis should be displayed at the bottom of the display area
	 *   </ul>
	 * <li> Vertical (y) axis values
	 *   <ul>
	 *   <li> "left" - The axis should be displayed at the left of the display area
	 *   <li> "right" - The axis should be displayed at the right of the display area
	 *   </ul>
	 * </ul>
	 * @type {string}
	 */
	this.orientation = "right";

	/**
	 * The label to display along the axis. It must be valid to be converted to
	 * html as the inner html of a span element. This allows the use of text
	 * markup and character entities in the label. Optional. Embedded in SVG as a 
	 * foreignobject tag.
	 * @type {string|undefined}
	 */
	this.label = "Labels can have extended chars (&mu;m)";
} // end of AxisFormat

/* **************************************************************************
 * Axes                                                                 *//**
 *
 * @constructor
 *
 * Axes draw x-y axes in an SVG Container and provide scaling methods
 * to map data points into the area defined by the axes.
 * The bounds of each axis is defined by either the tick values or by
 * the data extents defined in that axis' AxisFormat.
 *
 * @param {!d3.selection}
 *						container			-The container svg element to append the axes element tree to.
 * @param {Object}		config				-The settings to configure these Axes.
 * @param {string}		config.id			-String to uniquely identify this Axes.
 * @param {Object}		config.size			-The height and width that the axes must fit within.
 * @param {number}		config.size.width	-The width (in pixels) to use for the Axes.
 * @param {number}		config.size.height	-The height (in pixels) to use for the Axes.
 * @param {AxisFormat}	config.xAxisFormat	-The formatting options for the horizontal (x) axis.
 * @param {AxisFormat}	config.yAxisFormat	-The formatting options for the vertical (y) axis.
 *
 ****************************************************************************/
function Axes(container, config)
{
	this.id = config.id;
	this.container = container;

	this.xFmt = config.xAxisFormat;
	this.yFmt = config.yAxisFormat;

	// Set defaults for missing axis extents
	// Use small positive non-zero value to accomodate log scale
	if (!('extent' in this.xFmt))
		this.xFmt.extent = [1e-10, 1];

	if (!('extent' in this.yFmt))
		this.yFmt.extent = [0, 1];

	//default margin is set that is meant to be updated by the constituent
	//objects if they require more space - mostly happens with axes 
	//margin: an associative array/object with keys for top, bottom, left and right
	this.margin = { top: 10,
					bottom: 0,
					left: 10,
					right: 20 };

	//axis format type is a string specifying "linear", "log", "ordinal" or "double positive" for axis that always count up from zero,
	//regardless of the sign of the data - log only hooked up on x and ordinal only on y at the moment.
	//TODO this works for x axis only, if y is needed must be expanded

	//xTicks is either an integer number of ticks or an array of values to use as tickmarks
	//xOrient is a string for orientation "bottom" or "top". Likewise for the yTicks and yOrient
	var xTicks = this.xFmt.ticks;
	var yTicks = this.yFmt.ticks;

	// Add to the margin area for drawing the axis labels depending on their placement and existence
	var xOrient = this.xFmt.orientation;
	var yOrient = this.yFmt.orientation;
	var hasXAxisLabel = 'label' in this.xFmt;
	var hasYAxisLabel = 'label' in this.yFmt;

	if (hasXAxisLabel)
	{
		if (xOrient == 'top')
		{
			this.margin.top = this.margin.top + 40;
			console.log("top margin increased for top label");
			//catches the case where the whole graph renders to fit within the available SVG,
			//but cuts off at the top because it doesn't get pushed down far enough
		}
		else // xOrient === "bottom" (only other valid value)
		{
			this.margin.bottom = this.margin.bottom + 50;
		}
	}

	if (hasYAxisLabel)
	{
		if (yOrient === 'left')
		{
			this.margin.left = this.margin.left + 50;
			console.log("left margin increased for y label");
			//catches the case where the whole graph renders to fit within the available SVG,
			//but cuts off at the right because it gets pushed over too far
		}
		else // yOrient === "right" (only other valid value)
		{
			this.margin.right= this.margin.right + 40;
			console.log("right margin increased for y label");
		}
	}

	//xPerc and yPerc are decimals telling how much of the container box to use,
	//typically between 0 and 1. Multiply the width and height of the hard-set svg box
	//used to calculate the aspect ratio when sizing viewport up or down
	// @todo fix this comment -mjl
	
	// The data area is the area that data points will be drawn in.
	var dataAreaWidth = config.size.width - this.margin.left - this.margin.right;
	var dataAreaHeight = config.size.height - this.margin.top - this.margin.bottom;

	var tickheight = 10;

	 
	this.group = this.container.append("g") //make a group to hold new axes
		.attr("id", this.id) //name it so it can be manipulated or highlighted later
		;
	
		
		
	if (this.xFmt.type)
	{
		if (this.yFmt.type == "ordinal")
		{
			//if we're making horizontal ordinal bars, x axis must include 0
			this.xFmt.extent.push(0);
			this.xFmt.extent = d3.extent(this.xFmt.extent);
		}
		//TEST
		console.log("x extent is two elements" , this.xFmt.extent.length == 2);
		//Check if explicit ticks are specified, and if so, use them as the mapped range of the graph width
		//ignore the actual data range
		var xExtent = ($.isArray(xTicks)) ? d3.extent(xTicks) : this.xFmt.extent;

		if (this.xFmt.type == "linear")
		{
			this.xScale = d3.scale.linear().domain(xExtent)
				.rangeRound([0, dataAreaWidth]);
			//xScale is now a linear function mapping x-data to the width of the drawing space

			//TODO put in logic to reverse the x axis if the axis is on the right,
			//or maybe just add a "reverse" setting.
	     }

		if (this.xFmt.type == "log")
		{
			//always start and end on even decades
			var low = Math.floor(Math.log(xExtent[0]) / Math.log(10));
			var high = Math.ceil(Math.log(xExtent[1]) / Math.log(10));

			this.xScale = d3.scale.log().domain([0.99 * Math.pow(10, low), Math.pow(10, high)])
				.rangeRound([0, dataAreaWidth]);
			//xScale is now a log-scale function mapping x-data to the width of the drawing space
	    }

		//if the axis is double positive then create leftPositive and rightPositive
		//scales that meet at 0. Still use xScale to plot the data.
		if (this.xFmt.type == "double positive")
		{
			this.xScale = d3.scale.linear().domain(xExtent)
				.rangeRound([0, dataAreaWidth]);
			//xScale is now a function mapping x-data to the width of the drawing space

			var negTicks = [];
			var posTicks = [];
           //store all the negative ticks separately
			if ($.isArray(xTicks))
			{
				xTicks.forEach(function(o)
							   {
								   if (o < 0)
								   {
									   negTicks.push(Math.abs(o));
								   }
								   else
								   {
									   posTicks.push(o);
								   }
							   });
			}

            // create two scales from negative min to 0, then 0 to positive max
			//map them to the calculated point for xScale(0) - this will need to get recalc'd if the
			//graph gets resized.
			var leftPositive = d3.scale.linear()
				.domain([Math.abs(xExtent[0]), 0])
				.rangeRound([0, this.xScale(0)]);

			var rightPositive = d3.scale.linear()
				.domain([0, xExtent[1]])
				.rangeRound([this.xScale(0), dataAreaWidth]);
		}

		// Format the ticks w/ the general format using a precision of 1 significant digit.
		var format = d3.format(".1");

		//set up the functions that will generate the x axis
		this.xAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
			.scale(this.xScale) //telling the axis to use the scale defined by the function x
			.orient(xOrient).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);

		if (this.xFmt.type == "log")
		{
			this.xAxis.tickFormat(logFormat);
			//this prevents too many tick labels on log graphs, making
			//them unreadable
		}

		if (this.xFmt.type == "double positive")
		{
			this.leftXAxis = d3.svg.axis()
				.scale(leftPositive) //do the faux positive left-hand axis
				.orient(xOrient).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);

			this.xAxis = d3.svg.axis()
				.scale(rightPositive) //do the real positive right-hand axis
				.orient(xOrient).tickSize(tickheight, 0).tickPadding(3).tickFormat(format);
		}

		//next set the ticks to absolute values or just a number of ticks
		if (this.xFmt.type == "double positive")
		{
			$.isArray(xTicks) ? (this.xAxis.tickValues(posTicks) && this.leftXAxis.tickValues(negTicks))
							  : (this.xAxis.ticks(xTicks - 2) && this.leftXAxis.ticks(2));
		}
		else
		{
			$.isArray(xTicks) ? (this.xAxis.tickValues(xTicks)) : (this.xAxis.ticks(xTicks));
		}

		//now draw the horizontal axis
		this.xaxis = this.group.append("g")
			.call(this.xAxis)
			.attr("transform", "translate(0," + ((xOrient == "bottom") ? dataAreaHeight : 0) + ")")
			//move it down if the axis is at the bottom of the graph
			.attr("class", "x axis");

		//if we want positive tick values radiating from 0, then make the 
		//negative half of the axis separately
		if (this.xFmt.type == "double positive")
		{
			this.xaxis.append("g").call(this.leftXAxis)
				.attr("transform", "translate(0," + ((xOrient == "bottom") ? dataAreaHeight : 0) + ")")
				//move it down if the axis is at the bottom of the graph
				.attr("class", "x axis");
				// make the x-axis label, if it exists
		}

		if (this.xFmt.label)
		{
			var xaxisDims = this.xaxis.node().getBBox();
			this.xLabelObj = this.xaxis.append("foreignObject")
				.attr("x", 0)
				.attr("y", ((xOrient == "top") ? (-1.5) : 1) * (xaxisDims.height + 2))
				.attr("width", dataAreaWidth).attr("height", 40);

			this.xLabelObj.append("xhtml:body").style("margin", "0px")
				//this interior body shouldn't inherit margins from page body
				.append("div").attr("class", "axisLabel").html(this.xFmt.label) //make the label
				;
		}

		var xHt = d3.round(this.group.select(".x.axis").node().getBBox().height);
	}

	if (this.yFmt.type)
	{
		if (this.yFmt.type == "ordinal")
		{
			// @todo changed the domain from yRange to yTicks. The intention is to have the graph set the yTicks when the y axis is ordinal from the data. -mjl
			this.yScale = d3.scale.ordinal().domain(yTicks) //lists all ordinal y vals
				.rangeRoundBands([dataAreaHeight, 0], 0.4);

			//width is broken into even spaces allowing for bar width and
			//a uniform white space between each, in this case, 40% white space
	    }
		else
		{
			//check that the y range extends down to 0, because data graphs
			// that don't include 0 for y are misleading
			if (this.yFmt.extent[0] > 0)
			{
				this.yFmt.extent[0] = 0;
			}

			var yExtent = ($.isArray(yTicks)) ? d3.extent(yTicks) : this.yFmt.extent;

			if (this.yFmt.type == "linear")
			{
				this.yScale = d3.scale.linear().domain(yExtent)
					.rangeRound([dataAreaHeight, 0]);
			}
	    }

		// yScale is a function mapping y-data to height of drawing space.
		//Svg counts height down from the top, so we want the minimum drawn at height
		this.yAxis = d3.svg.axis() //a function that will create the axis and ticks and text labels
			.scale(this.yScale) //telling the axis to use the scale defined earlier
			.orient(yOrient).tickSize(tickheight, 0)
			//sets the height of ticks to tickheight, except for the ends, which don't get ticks
			.tickPadding(3);

		//if y ticks are specified explicitly, use them
		$.isArray(yTicks) ? (this.yAxis.tickValues(yTicks)) : (this.yAxis.ticks(yTicks));
		//test tick type switch
		console.log("ytick specified explicitly?", yTicks, $.isArray(yTicks), this.yAxis.ticks());

		this.yaxis = this.group.append("g")
			.attr("transform", "translate(" + ((yOrient == "right") ? dataAreaWidth : 0) + ",0)")
			//move it over if the axis is at the bottom of the graph
			.call(this.yAxis).attr("class", "y axis");

		// make the y-axis label, if it exists
		if (hasYAxisLabel)
		{
			var yaxisDims = this.yaxis.node().getBBox();
			var yLabelObj = this.yaxis.append("foreignObject")
				.attr("transform", "translate(" + (((yOrient == "left") ? (-1.1) : 1.1) * (yaxisDims.width)
				   + ((yOrient == "left") ? -20 : 0)) + ","
				   + (dataAreaHeight) + ") rotate(-90)")
				// move it out of the way of the ticks to left or right depending on axis orientation
				.attr("width", dataAreaHeight).attr("height", 40);

			var yLabText = yLabelObj.append("xhtml:body").style("margin", "0px")
				//this interior body shouldn't inherit margins from page body
				.append("div")
					.attr("id","label" + this.id)
					.attr("class", "axisLabel")
					.html(this.yFmt.label) //make the label
				;

			console.log("label size ", $('#label' + this.id).height());
			
			//toDO use this to correctly move to the left of axis
		}

		var yWid = d3.round(this.group.select(".y.axis").node().getBBox().width);
	}

	var axesDims = this.group.node().getBBox();
	//check that rendering is all inside available svg viewport.  If not, enlarge
	//margins and calculate a new inner width, then update all scales and renderings
	if (axesDims.width > config.size.width)
	{
		var addMargin =  d3.round(axesDims.width - config.size.width);
		addMargin = addMargin > yWid ? addMargin:yWid;
		if (yOrient === "right")
		{
			this.margin.right = this.margin.right + addMargin;
		}
		else
		{
			this.margin.left = this.margin.left + addMargin ;
		}

		dataAreaWidth = dataAreaWidth - this.margin.right - this.margin.left;
		//using the new dimensions, redo the scale and axes
		this.xScale.rangeRound([0, dataAreaWidth]);
		this.xAxis.scale(this.xScale);
		console.log("x margins increased, new inner width is ", dataAreaWidth, " margin ", this.margin.left, this.margin.right);
		this.xaxis.call(this.xAxis);
		if (this.yaxis)
		{
			this.yaxis.attr("transform", "translate(" + ((yOrient == "right") ? dataAreaWidth : 0) + ",0)");
		}

		if (this.xLabelObj)
		{
			this.xLabelObj.attr("y", d3.round(((xOrient == "top") ? (-1.4) : 1) * (xaxisDims.height + 5)))
				.attr("width", dataAreaWidth).attr("height", 50);
		}
	}

	if (axesDims.height > config.size.height)
	{
		var addMargin = d3.round(axesDims.height - config.size.height);
		if (xOrient === "top")
		{
			this.margin.top = this.margin.top + addMargin;
		}
		else
		{
			this.margin.bottom = this.margin.bottom + addMargin;
		}

		dataAreaHeight = dataAreaHeight - this.margin.top - this.margin.bottom;
		//using the new dimensions, redo the scale and axes
		if (this.yFmt.type=="ordinal")
		{
			this.yScale.rangeRoundBands([dataAreaHeight, 0], .3);
			console.log("ordinal bandsize ", this.yScale.rangeBand());
			//width is broken into even spaces allowing for bar width and
			//a uniform white space between each, in this case, 30% white space
		}
		else
		{
			this.yScale.rangeRound([dataAreaHeight, 0]);
		}

		this.yAxis.scale(this.yScale);
		console.log("y margins increased, new inner height is ", dataAreaHeight, " margin: ", this.margin.top, this.margin.bottom);
		this.yaxis.call(this.yAxis);
		if (this.xaxis)
		{
			this.xaxis.attr("transform", "translate(0," + ((xOrient == "bottom") ? dataAreaHeight : 0) + ")");
		}

		if (yLabelObj)
		{
			yLabelObj.attr("transform", "translate(" + d3.round(((yOrient == "left") ? (-1.1) : 1.1) * (yaxisDims.width)
				   + ((yOrient == "left") ? -19 : 0)) + ","
				   + (dataAreaHeight) + ") rotate(-90)")
				// move it out of the way of the ticks to left or right depending on axis orientation
				.attr("width", dataAreaHeight);
		}
	}

	this.dataRect = Rect.makeRect({t: this.margin.top, l: this.margin.left, h: dataAreaHeight, w: dataAreaWidth});
	
	//and finally, with the margins all settled, move the group down to accomodate the
	//top and left margins and position
	this.group.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
} // end Axes constructor
