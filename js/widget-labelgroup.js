/* **************************************************************************
 * $Workfile:: widget-labelgroup.js                                         $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the LabelGroup widget.
 *
 * The LabelGroup widget draws a group of labels at specified locations
 * in an SVGContainer.
 *
 * Created on		April 23, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample Label constructor configuration
(function()
{
	var lbl1Config = {
			id: "lbl1",
			labels: 	
			[	
				{ content: "Pre-development",	xyPos: [ 0, -.25], width: 100 },
				{ content: "Developing",		xyPos: [14, -.25], width:  80 },
				{ content: "Modernizing",		xyPos: [27, -.25], width:  80 },
				{ content: "Developed",			xyPos: [40, -.25], width:  70 },
				{ content: "Post-development",	xyPos: [51, -.25], width: 100 },
			],
		};
});

/**
 * Information needed to process a label in a LabelGroup.
 *
 * @typedef {Object} LabelConfig
 * @property {string}	content	-string with HTML markup to be displayed by the label
 * @property {Array.<nummber, number>}
 *						xyPos	-An array containing the x,y data coordinates for the
 *								 top left corner of the label
 * @property {number}	width	-The pixel width of the label
 *								 @todo we need a better way to deal w/ the width, 
 *									than hard-coding it here. -lb
 * @property {string|undefined}
 *						key		-optional string used to reference the label
 *								 in order to manipulate it (such as highlight it).
 *								 does not need to be unique, and if not all labels
 *								 with the same key will be addressed.
 */
	
/* **************************************************************************
 * LabelGroup                                                           *//**
 *
 * The LabelGroup widget draws a group of labels at specified locations
 * in an SVGContainer.
 * The LabelGroup is usually used on top of another widget which provides the
 * data extents and scale functions to convert data points to pixel positions
 * in the container. If the scale functions are not set before this widget is
 * drawn, it assumes the data extents are 0 - 1.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this LabelGroup
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this LabelGroup.
 * 										 if undefined a unique id will be assigned.
 * @param {Array.<LabelConfig>}
 *						config.labels	-An array describing each label in the group.
 *										 each trace is an array of points defining that trace.
 * @param {string}		type			-string specifying bullets for dots, numbered
 *										 for dots and #, or anything else for just labels
 *
 * NOTES:
 * @todo: role: a string which is one of "label", "distractor".
 * @todo: we need some sort of autowidth intelligence on these, but I don't
 * know how to reconcile that with giving user control over wrapping
 ****************************************************************************/
function LabelGroup(config, eventManager)
{
	/**
	 * A unique id for this instance of the labelgroup widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, LabelGroup);

	/**
	 * Array of traces to be graphed, where each trace is an array of points and each point is an
	 * object w/ a {number} x and {number} y property.
	 * @type Array.<Array.<{x: number, y: number}>
	 * e.g. 2 traces, 1st w/ 2 points, 2nd with 3 points:
	 *   [ [{x: -1.2, y: 2.0} {x: 2, y: 3.1}], [{x: -2, y: -2}, {x: 0, y: 0}, {x: 2, y: 2}] ]
	 */
	this.labels = config.labels;

	/**
	 * The type specifies an adornment on each label or no adornment if it is not specified.
	 * It must be one of:
	 * <ul>
	 *  <li> "bullets" for a solid bullet adornment
	 *  <li> "numbered" for a bullet containing the index number adornment
	 * </ul>
	 * @type {string|undefined}
	 */
	this.type = config.type;
	
	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager;

	/**
	 * The event id published when a label in this group is selected.
	 * @const
	 * @type {string}
	 */
	this.selectedEventId = this.id + '_labelSelected';
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string|number} selectKey	-The key associated with the selected label if it has one,
	 *										 otherwise the label's index within the group.
	 */
	
	/**
	 * The scale functions set explicitly for this LabelGroup using setScale.
	 * If these are not null when draw is called they will be used to position
	 * the labels. Otherwise a data extent of [0,1] will be mapped to the given
	 * container area.
	 * @type Object
	 * @property {function(number): number}
	 *						xScale	-function to convert a horizontal data offset
	 *								 to the pixel offset into the data area.
	 * @property {function(number): number}
	 *						yScale	-function to convert a vertical data offset
	 *								 to the pixel offset into the data area.
	 * @private
	 */
	this.explicitScales_ = {xScale: null, yScale: null};
	
	/**
	 * Information about the last drawn instance of this line graph (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			size: {height: 0, width: 0},
			labelsId: this.id + 'Labels',
			widgetGroup: null,
			xScale: null,
			yScale: null,
		};
} // end of Label constructor

/**
 * Prefix to use when generating ids for instances of LabelGroup.
 * @const
 * @type {string}
 */
LabelGroup.autoIdPrefix = "lblg_auto_";

/* **************************************************************************
 * LabelGroup.draw                                                      *//**
 *
 * Draw this LabelGroup in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the labels element tree to.
 * @param {Object}	size		-The size in pixels for the label
 * @param {number}	size.height	-The height in pixels of the area the labels are drawn within.
 * @param {number}	size.width	-The width in pixels of the area the labels are drawn within.
 *
 ****************************************************************************/
LabelGroup.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;
	
	this.setLastdrawnScaleFns2ExplicitOrDefault_(size);
	
	var that = this;
	var numLabels = this.labels.length;

	var labelsContainer = container.append("g") //make a group to hold labels
		.attr("class", "widgetLabelGroup")
		.attr("id", this.id);
		
	this.lastdrawn.widgetGroup = labelsContainer;

	/*this filter can be used to add dropshadows to highlighted labels and bullets
	var filter = labelsContainer.append("defs").append("filter").attr("id", "drop-shadow");
	filter.append("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 2).attr("result", "blur");
	filter.append("feOffset").attr("in", "blur").attr("dx", 2).attr("dy", 2).attr("result", "offsetBlur");
 	var merge = filter.append("feMerge");
	merge.append("feMergeNode").attr("in", "offsetBlur");
	merge.append("feMergeNode").attr("in", "SourceGraphic");
	*/
	
	// bind the label group collection to the label data
	// the collection is used to highlight and unhighlight
	var labelCollection = labelsContainer.selectAll("g.widgetLabel").data(this.labels);
	
	// on the enter selection (create new ones from data labels) make
	// the groups. This is useful in case you want to pack more than just the
	// text label into the graup with the same relative positioning.  
	labelCollection.enter()
		.append("g")
		.attr("class","widgetLabel");
		
	// autokey entries which have no key with the data index
	labelCollection.each(function (d, i) { 
					// if there is no key assigned, make one from the index
					d.key = 'key' in d ? d.key : i.toString();
					});
					
	// move the labels into position, but do it on the data collection, which 
	// includes both the update and the enter selections, so you can drag them around
	// on a suitable event or redraw.
	labelCollection.attr("transform", function (d, i)  {
					return attrFnVal("translate", that.lastdrawn.xScale(d.xyPos[0]),
												  that.lastdrawn.yScale(d.xyPos[1]));
				  });

	// write each label text as a foreignObject, to get wrapping and full HTML
	// rendering support
	labelCollection.append("foreignObject")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", function (d) { return d.width; })
		.attr("height", 200)
		.append("xhtml:body")
			.style("margin", "0px")
			//this interior body shouldn't inherit margins from page body
			.append("div")
				.attr("class", "descLabel")
				// .style("visibility",function(d,i) { return d.viz;})
				// I punted on the show/hide thing, but it could come back 
				// in the way it does for callouts -lb
				.html(function (d) { return d.content; }); //make the label

	// bullets type just puts big black circle markers on key areas of a diagram
	// a precursor to hotspot answertypes
	if (this.type == "bullets" || this.type == "numbered")
	{
		labelCollection.append("circle")
			.attr("class", "numSteps")
			.attr("r", 16).attr("cx", 0).attr("cy", 0);
	}

	// numbered bullets are what PM is referring to as stepped diagrams,
	// work with text labels or without, but there's a really stupid rendering
	// bug in Chrome when highlighting circles or anything that overlaps the 
	// foreign object. Recommend using either numbers or text labels. -lb
	
	if (this.type == "numbered")
	{
		labelCollection.append("text")
			.attr("text-anchor", "middle")
			.attr("alignment-baseline", "middle")
			.text(function (d, i) { return i + 1; });
	}
	
	labelCollection.on('click',
				function (d, i)
				{
					that.eventManager.publish(that.selectedEventId, {selectKey: d.key});
				});
				
	this.lastdrawn.labelCollection = labelsContainer.selectAll("g.widgetLabel");

}; // end of LabelGroup.draw()

/* **************************************************************************
 * LabelGroup.setScale                                                  *//**
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
 *
 ****************************************************************************/
LabelGroup.prototype.setScale = function (xScale, yScale)
{
	this.explicitScales_.xScale = xScale;
	this.explicitScales_.yScale = yScale;
};

/* **************************************************************************
 * LabelGroup.lite                                                      *//**
 *
 * Highlight the label(s) associated w/ the given liteKey (key) and
 * remove any highlighting on all other labels.
 *
 * @param {string}	liteKey	-The key associated with the label(s) to be highlighted.
 *
 ****************************************************************************/
LabelGroup.prototype.lite = function (liteKey)
{
	console.log("TODO: log fired Label highlite " + liteKey);
	
	// Turn off all current highlights
	var allLabels = this.lastdrawn.labelCollection;
	allLabels
		.classed("lit", false);
	
	// create a filter function that will match all instances of the liteKey
	// then find the set that matches
	var matchesLabelIndex = function (d, i) { return d.key === liteKey; };
	
	var labelsToLite = allLabels.filter(matchesLabelIndex);

	// Highlight the labels w/ the matching key
	labelsToLite
		.classed("lit", true);

	if (labelsToLite.empty())
	{
		console.log("No key '" + liteKey + "' in Labels group " + this.id );
	}
}; // end of LabelGroup.lite()

/* **************************************************************************
 * LabelGroup.setLastdrawnScaleFns2ExplicitOrDefault_                   *//**
 *
 * Set this.lastdrawn.xScale and yScale to those stored in explicitScales
 * or to the default scale functions w/ a data domain of [0,1].
 *
 * @param {Size}	cntrSize	-The pixel size of the container given to draw().
 * @private
 *
 ****************************************************************************/
LabelGroup.prototype.setLastdrawnScaleFns2ExplicitOrDefault_ = function (cntrSize)
{
	if (this.explicitScales_.xScale !== null)
	{
		this.lastdrawn.xScale = this.explicitScales_.xScale;
	}
	else
	{
		// map the default x data domain [0,1] to the whole width of the container
		this.lastdrawn.xScale = d3.scale.linear().rangeRound([0, cntrSize.width]);
	}
	
	if (this.explicitScales_.yScale !== null)
	{
		this.lastdrawn.yScale = this.explicitScales_.yScale;
	}
	else
	{
		// map the default y data domain [0,1] to the whole height of the container
		// but from bottom to top
		this.lastdrawn.yScale = d3.scale.linear().rangeRound([cntrSize.height, 0]);
	}
}; // end of LabelGroup.setLastdrawnScaleFns2ExplicitOrDefault_()

