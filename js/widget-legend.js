/* **************************************************************************
 * $Workfile:: widget-legend.js                                          $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the Legend widget.
 *
 * The Legend widget provides a line or box legend with the standard
 * fill color sequence and labels.
 *
 * Created on		April 22, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample BarChart constructor configuration
(function()
{
	
	var legConfig = {
		xPos: "right", yPos: "top",
		labels: ["low income", "middle income", "high income"],
		type: "box",
		key: ["foo","bar","fred"]
	};
});
	
/* **************************************************************************
 * Legend                                                               *//**
 *
 * The Legend widget makes a legend for any series of labels. Should be callable
 * either standalone or from another widget that has options to generate a legend
 * from it's data.
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this widget
 * @param {string}		config.id		-String to uniquely identify this widget
 * @param {Array}		config.labels	- strings for each label
 * @param {string}		config.type		- "box", or anything else (ignored) produces lines
 * @param {string}		config.xPos, yPos - position in axes "left"/"right" and  	  
 * 										"bottom"/"top"
 * @param {Array}		config.key		- strings to specify highlighting relationship
 *										to other widgets
 * @param {eventManager} eventManager	- allows the object to emit events
 *
 * NOTES: Measures the number of characters in the longest label, then sizes
 * the box around it based on that.  Eventually might have to resize or rescale
 * axes to make room for this, but for now position it in one corner of axes.
 * TODO: need to add symbols for scatter plots, including custom images
 **************************************************************************/

function Legend(config, eventManager)
{
	/**
	 * A unique id for this instance of the widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, Legend);

	/**
	 * Array of strings for the labels, one per row 
	* @type {Array}
	*/
	this.labels = config.labels;

	/**
	 * The render type is one of:
	 * <ul>
	 *  <li> "box" for small colored squares, typical for bar or chloropleth maps
	 *	<li> "lines" (ignored) for colored lines
	 * </ul>
	 * @type {string}
	 */
	this.type = config.type;
	this.xPos = config.xPos;
	this.yPos = config.yPos;
	this.key = config.key;
	
	/**
	 * Information about the last drawn instance of this widget (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			size: {height: 0, width: 0},
			legendId: 'legend',
			legendRows: null,
		};
		
	//legends must be selectable to highlight related graph elements for accessibility
	//we will eventually have to figure out how to do this with they keyboard too -lb
	this.eventManager = eventManager;
	/**
	 * The event id published when a row in this group is selected.
	 * @const
	 * @type {string}
	 */

	this.selectedEventId = this.id + '_legendSelected';
} // end of Legend constructor


/* **************************************************************************
 * Legend.draw       	                                                *//**
 *
 * The LineGraph widget provides a line (or scatter) graph visualization
 * of sets of data points.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the graph element tree to.
 * @param {Object}	size		-The size in pixels for the graph
 * @param {number}	size.height	-The height for the graph.
 * @param {number}	size.width	-The width for the graph.
 *
 ****************************************************************************/
Legend.prototype.draw = function (container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;
	
	var that = this;
	
	this.lastdrawn.legendId = this.id + '_legend';
	var legendId = this.lastdrawn.legendId;
	
 	var boxLength = 15, //attractive length for the colored lines or boxes
		inset = 10;//attractive spacing from edge of axes boxes (innerWid/Ht)
		//also used to space the enclosing legend box from the text
	//take the number of rows from the number of labels
	var rowCt = this.labels.length;
	//calculate the height of the box that frames the whole legend
	//which should be as tall as the number of rows plus some padding
	var boxHeight = (boxLength + 6) * rowCt;
	
	//to calculate the width of the box big enough for the longest text string, we have to
	//render the string, get its bounding box, then remove it.
	//note: this is the simple algorithm and may fail because of proportional fonts, 
	//in which case we'll have to measure all labels.
	
	var longest = this.labels.reduce(function (prev, cur) { 
		return prev.content.length > cur.content.length ? prev : cur; }).content;
	var longBox = container.append("g");
	longBox.append("text").text(longest);
	 
	this.boxWid = longBox.node().getBBox().width + inset/2 + boxLength + 4;

	//the box around the legend should be the width of the
	//longest piece of text + inset + the marker length
	//so it's always outside the text and markers, plus a little padding
	longBox.remove();
	
	
	//position the legend
	var xOffset = (this.xPos == "left") ? inset : (size.width - this.boxWid - inset);
	//if the position is left, start the legend on the left margin edge,
	//otherwise start it across the graph box less its width less padding
	var yOffset = (this.yPos == "bottom") ? size.height - boxHeight - inset : inset;
	//if the position is at the bottom, measure up from bottom of graph,
	//otherwise just space it down from the top.
		
	//make a new group to hold the legend
	var legendBox = container.append("g")
	.attr("class","widgetLegend")
	.attr('id', this.id)
	//move it to left/right/top/bottom position
	.attr('transform', 'translate(' + xOffset + ',' + yOffset + ')');

	
	//make a filter definition for highlighting
	var filter = legendBox.append("defs").append("filter").attr("id","drop-shadow");
	filter.append("feGaussianBlur").attr("in","SourceAlpha").attr("stdDeviation",2).attr("result","blur");
	filter.append("feOffset").attr("in","blur").attr("dx",2).attr("dy",2).attr("result","offsetBlur");
 	var merge = filter.append("feMerge");
	merge.append("feMergeNode").attr("in","offsetBlur");
	merge.append("feMergeNode").attr("in","SourceGraphic");


	//draw a white box for the legend to sit on
	legendBox.append("rect").attr("x", -5).attr("y", -5)
	//create small padding around the contents at leading edge
	.attr("width", this.boxWid).attr("height", boxHeight) //lineheight+padding x rows
	.attr("class", "legendBox");
	
	//this selects all <g> elements with class legend  
	var legendRows = legendBox.selectAll("g.legend")
	.data(this.labels); //associate the data to create stacked slices
	
	// get rid of any rows without data
	legendRows.exit().remove();
	
	legendRows.enter() //this will create <g> elements for every data element
	.append("g") //create groups
		.attr("class","legend")
	//each row contains a colored marker and a label.  They are spaced according to the
	//vertical size of the markers plus a little padding, 4px in this case
	//counting up from the bottom, make a group for each series and move to stacked position
		.attr("transform", function(d, i) {
			return "translate(0," + (rowCt - i - 1) * (boxLength+4) + ")";
	});
	
	
	// autokey entries which have no key with the data index
	legendRows.each(function (d, i) { 
					//if there is no key assigned, make one from the index
					d.key = 'key' in d ? d.key : i.toString();
					});

	if (this.type == "box") {
		legendRows.append("rect")
		.attr("x", 0).attr("y", 0)
		//make the rectangle a square with width and height set to boxLength
		.attr("width", boxLength)
		.attr("height", boxLength)
		.attr("class", function(d, i) {
			return "fill" + i;
		});
	} else {
		legendRows.append("line") //add a line to each slice
		.attr("class", function(d, i) {
			return "traces stroke" + i;
		}).attr("x1", 0) //start at the left edge of box
		.attr("x2", boxLength) //set line width
		.attr("y1", boxLength / 2).attr("y2", boxLength / 2);
	}

	legendRows.append("text") //this is native svg text, it doesn't wrap
	.attr("text-anchor", "start") //left align text
	.attr("class", "legendLabel").attr("dx", boxLength + 4)
	//offset text to the right beyond marker by 4 px
	.attr("dy", boxLength/2 ) 
	//offset text down so it winds up in the middle of the marker
	.attr("alignment-baseline","central")
	//and put the vertical center of the text on that midline
	.text(function(d, i) {
		return d.content; //get the label from legend array
	});
	
	legendRows.on('click',
				function (d, i)
				{
					that.eventManager.publish(that.selectedEventId, {selectKey:d.key});
				});

	this.lastdrawn.legendRows = legendBox.selectAll("g.legend");
	
}; //end of Legend.draw

Legend.prototype.setScale = function ()
{
};

/* **************************************************************************
 * Legend.lite                                                      *//**
 *
 * Highlight the members of the collection associated w/ the given liteKey (key) and
 * remove any highlighting on all other labels.
 *
 * @param {string}	liteKey	-The key associated with the label(s) to be highlighted.
 *
 ****************************************************************************/
Legend.prototype.lite = function(liteKey)
{
	
	console.log("TODO: log fired Legend highlite " + liteKey);
	
	// Turn off all current highlights
	var allRows = this.lastdrawn.legendRows;
	allRows
		.classed("lit", false);
		
	//var allSeries = this.lastdrawn.series;
	//allSeries
		//.classed("lit", false);

	// create a filter function that will match all instances of the liteKey
	// then find the set that matches
	var matchesKey = function (d, i) { return d.key === liteKey; };
	
	var rowsToLite = allRows.filter(matchesKey);

	// Highlight the labels w/ the matching key
	rowsToLite
		.classed("lit", true);

	if (rowsToLite.empty())
	{
		console.log("No key '" + liteKey + "' in legend " + this.id );
	}

};
