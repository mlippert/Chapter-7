/* **************************************************************************
 * $Workfile:: widget-sketch.js                                         $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the sketch widget.
 *
 * The Sketch widget draws a group of geometric objects at specified locations
 * in an SVGContainer.
 *
 * Created on		May 3, 2013
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
			id: "sketch1",
			drawShape: 	
			[	
				{ shape: "rectangle", fill: "White", data:[{xyPos: [ 0, 5], width: 2, height: 2 }]},
				{ shape: "circle", data:[{xyPos: [5, 5], radius:  2 }]}, 
				{ shape: "hexagon", data:[{xyPos: [3,3], side:  1 }]},
				{ shape: "triangle", data:[{xyPos: [4, 4], side: 2 }]},
				{ shape: "line", data:[{xyPos: [1,1], length: .5, angle: Math.PI/3 }]},
				{ shape: "wedge", data:[{xyPos: [2, 4], length: .5, width: .2, angle: Math.PI/6 }]},
				{ shape: "wedge", data:[{xyPos: [3.5, 2.4], length: .3, width: .15, angle: Math.PI/4, type: "hash"}]},
				{ shape: "textBit", data:[{xyPos: [1.5, 3.5], text: "blah" }]}
			],
		};
});

/**
 * Information needed to process drawings in a sketch
 *
 * @typedef {Object} SketchConfig
 * @property {string}	shape	-name of geometric shape, supports circle, rectangle, hexagon, line
 * @property {Array.<nummber, number>}
 *						xyPos	- top left corner of rectangles, center of circles, local coordinates
 * @property {number}	width	- width of rectange, local coordinates
 * @property {number}	height	- height of rectange, local coordinates
 * @property {number}	radius	- radius of circle or hex, local coordinates
 * @property {number}
 *						length	- local scale length of line
 * @property {number}
 *						angle	- angle of line from start point in radians
 * @property {string|undefined}
 *						key		-optional string used to reference the sketch object
 *								 in order to manipulate it (such as highlight it).
 *								 does not need to be unique, and if not all labels
 *								 with the same key will be addressed.
 * @property {string|undefined} 
 *						fill	- optional string used to determine fill color from css
 */
	
/* **************************************************************************
 * Sketch                                                           *//**
 *
 * The Sketch widget draws a group of geometric objects at specified locations
 * in an SVGContainer.
 * The Sketch widget might be used on top of another widget which provides the
 * data extents and scale functions to convert data points to pixel positions
 * in the container. If the scale functions are not set before this widget is
 * drawn, it assumes the data extents are 0 - 1.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this Sketch
 * @param {string}		config.id		-String to uniquely identify this Sketch.
 * @param {Array.<SketchConfig>}
 *						config.drawShape	-An array describing each drawing object in the group.
 * @param {string}		config.type		- "hot" draws transparent hotspots
 *
 * NOTES:
 * @todo: this might or might not be the start of something like an 
 * equation editor or a chemistry editor
 ****************************************************************************/
function Sketch(config, eventManager)
{
	/**
	 * A unique id for this instance of the labelgroup widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, Sketch);

	/**
	 * Array of objects to be drawn, where each object specifies the shape, position, and size
 	 */
	this.drawShape = config.drawShape;
	
	/**
	 * string specifying whether to use the hotspots class
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
	this.selectedEventId = this.id + '_sketchSelected';
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string|number} sketchIndex	-The key associated with the selected label if it has one,
	 *										 otherwise the label's index within the group.
	 */
	
	/**
	 * The scale functions set explicitly for this Sketch using setScale.
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
			sketchId: this.id + 'Sketch',
			xScale: null,
			yScale: null,
		};
} // end of Label constructor

/**
 * Prefix to use when generating ids for instances of LineGraph.
 * @const
 * @type {string}
 */
Sketch.autoIdPrefix = "auto_";
/* **************************************************************************
 * Sketch.draw                                                      *//**
 *
 * Draw this Sketch in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the labels element tree to.
 * @param {Object}	size		-The size in pixels for the label
 * @param {number}	size.height	-The height in pixels of the area the labels are drawn within.
 * @param {number}	size.width	-The width in pixels of the area the labels are drawn within.
 *
 ****************************************************************************/
Sketch.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;
	
	if (this.explicitScales_.xScale !== null)
	{
		this.lastdrawn.xScale = this.explicitScales_.xScale;
	}
	else
	{
		// map the default x data domain [0,1] to the whole width of the container
		this.lastdrawn.xScale = d3.scale.linear().rangeRound([0, size.width]);
	}
	
	if (this.explicitScales_.yScale !== null)
	{
		this.lastdrawn.yScale = this.explicitScales_.yScale;
	}
	else
	{
		// map the default y data domain [0,1] to the whole height of the container
		// but from bottom to top
		this.lastdrawn.yScale = d3.scale.linear().rangeRound([size.height, 0]);
	}
	

	var sketchContainer = container.append("g") //make a group to hold labels
		.attr("id", this.lastdrawn.sketchId)
		.attr("class","widgetSketch");
	
	// definition of arrowheads if you need 'em
	sketchContainer.append("defs").append("marker")
		.attr("id","triangle")
		.attr("viewBox","0 0 10 10")
		.attr("refX","0")
		.attr("refY","5")
		.attr("markerUnits","strokeWidth")
		.attr("markerWidth","4")
		.attr("markerHeight","3")
		.attr("orient","auto")
			.append("path")
			.attr("d","M 0 0 L 10 5 L 0 10 z");
			
	this.lastdrawn.widgetGroup = sketchContainer;

	this.redraw();
	
	
}; // end of Sketch.draw()

/* **************************************************************************
 * Sketch.setScale                                                  *//**
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
Sketch.prototype.setScale = function (xScale, yScale)
{
	this.explicitScales_.xScale = xScale;
	this.explicitScales_.yScale = yScale;
};

/* **************************************************************************
 * Sketch.move                                                  *//**
 *
 * Move the entire sketch by x and y offset values over a period of time
 *
 * @param {number}		xOffset		- value of x to be added to current x position
 * @param {number}		yOffset		- value of y to be added to current y position
 * @param {number}		duration	- the duration of the transition in milliseconds
 * @param {number}		delay		- the delay before the transition starts in milliseconds
 *
 ****************************************************************************/

Sketch.prototype.move = function (xOffset, yOffset, duration, delay)
{
	var xScale = this.lastdrawn.xScale;
	var yScale = this.lastdrawn.yScale;
	
	var sketchContainer = this.lastdrawn.widgetGroup;

	// get the collection of shapes
	var drawCollection = sketchContainer.selectAll("g.shape");
	

	// get collection of rectangles			  
	var rectangles = drawCollection.selectAll("rect");
	// add the given offset to the x and y positions
	rectangles.transition()
		.attr("x", function(d) { d.xyPos[0] = d.xyPos[0] + xOffset;
								return xScale(d.xyPos[0]); })
		.attr("y", function(d) { d.xyPos[1] = d.xyPos[1] + yOffset;
								return yScale(d.xyPos[1]); })
		.duration(duration).delay(delay);
	
	// get collection of circles
	var circles = drawCollection.selectAll("circle");
	// add the given offset to the x and y positions
	circles.transition()
		.attr("cx", function(d) { d.xyPos[0] = d.xyPos[0] + xOffset;
								return xScale(d.xyPos[0]); })
		.attr("cy", function(d) { d.xyPos[1] = d.xyPos[1] + yOffset;
								return yScale(d.xyPos[1]); })
		.duration(duration).delay(delay);
	
	
	// get collection of polygons
	var polygons = drawCollection.selectAll("polygon");
	// translate the points based on the given offset
	polygons.transition()
		.attr("points",
			function(d)
			{
				// update the x and y positions
				d.xyPos[0] = d.xyPos[0] + xOffset;
				d.xyPos[1] = d.xyPos[1] + yOffset;
				
				// update the points
				var i;
				for (i = 0; i < d.points.length; i++)
				{
					d.points[i][0] = d.points[i][0] + xOffset;
					d.points[i][1] = d.points[i][1] + yOffset;
				}
				return Sketch.pointString(d.points, xScale, yScale);
			})
		.duration(duration).delay(delay);
	
	// wedges, although polygons, might have a mask that needs to be translated
	var wedges = drawCollection.selectAll("polygon.wedge");
	wedges.each(function (d)
		{
			// if the type is a hash-wedge
			if (d.type == "hash")
			{
				// get the mask
				var mask = sketchContainer.select("#" + d.maskid);
				// get the lines inside the mask
				var lines = mask.selectAll("line");
				
				var ratio = .9;
				
				// translate the lines using the offset
				lines.each(function ()
					{
						// since the wedge has already had its data updated,
						// just update the line data based on that
						var line = d3.select(this);
						line.transition()
						.attr("x1", function ()
									{
									return xScale(d.xyPos[0] + ratio*d.length*Math.cos(d.angle)
												+ d.width/2*Math.cos(d.angle + Math.PI/2));
								})
							.attr("y1", function ()
								{
									return yScale(d.xyPos[1] + ratio*d.length*Math.sin(d.angle)
												+ d.width/2*Math.sin(d.angle + Math.PI/2));
								})
							.attr("x2", function ()
								{
									return xScale(d.xyPos[0] + ratio*d.length*Math.cos(d.angle)
												+ d.width/2*Math.cos(d.angle - Math.PI/2));
								})
							.attr("y2", function ()
								{
									return yScale(d.xyPos[1] + ratio*d.length*Math.sin(d.angle)
												+ d.width/2*Math.sin(d.angle - Math.PI/2));
								})
							.attr("stroke-width", "4px")
							.attr("stroke", "white").attr("opacity", 1)
							.duration(duration).delay(delay);
					ratio = ratio - .33;
				});
			}
		});

	// get collection of lines
	var lines = drawCollection.selectAll("line");
	// add the given offset to the x and y positions of both endpoints
	lines.transition()
		.attr("x1", function(d) 
			{
				d.xyPos[0] = d.xyPos[0] + xOffset; 
				return xScale(d.xyPos[0]);
			})
		.attr("y1", function(d)
			{
				d.xyPos[1] = d.xyPos[1] + yOffset;
				return yScale(d.xyPos[1]);
			})
		.attr("x2", function(d)
			{ 
				return xScale(d.length * Math.cos(d.angle) + d.xyPos[0]);
			})
		.attr("y2", function(d)
			{ 
				return yScale(d.length * Math.sin(d.angle) + d.xyPos[1]);
			})
		.duration(duration).delay(delay);
		
	// get collection of textBits
	var textBits = drawCollection.selectAll("text");
	// add the given offset to the x and y position
	textBits.transition()
		.attr("x", function(d)
			{
				d.xyPos[0] = d.xyPos[0] + xOffset; 
				return xScale(d.xyPos[0]);
			})
		.attr("y", function(d)
			{
				d.xyPos[1] = d.xyPos[1] + yOffset; 
				return yScale(d.xyPos[1]);
			})
		.duration(duration).delay(delay);

	this.lastdrawn.drawCollection = sketchContainer.selectAll("g.shape");
	
};

/* **************************************************************************
 * Sketch.reflect                                                  *//**
 *
 * Reflect the sketch over a vertical line, horizontal line, or both
 *
 * @param {number}		xLine		- x value of the vertical line to be reflected over
 * @param {number}		yLine		- y value of the horizontal line to be reflected over
 * @param {number}		duration	- the duration of the transition in milliseconds
 * @param {number}		delay		- the delay before the transition starts in milliseconds
 *
 ****************************************************************************/

Sketch.prototype.reflect = function (xLine, yLine, duration, delay)
{
	var xScale = this.lastdrawn.xScale;
	var yScale = this.lastdrawn.yScale;

	var sketchContainer = this.lastdrawn.widgetGroup;

	// get the collection of shapes
	var drawCollection = sketchContainer.selectAll("g.shape");

	// get collection of rectangles			  
	var rectangles = drawCollection.selectAll("rect");
	// reflect over the given lines
	rectangles.transition()
		.attr("x",
			function(d)
			{
				// reflect over the vertical line (if provided)
				if (xLine != null)
				{
					// rectangle are anchored at the top left corner, so
					// get the center of the rectangle first
					var x = d.xyPos[0] + (d.width/2);
					// reflect it
					d.xyPos[0] = Sketch.reflectValue(x, xLine) - (d.width/2);
				}
				return xScale(d.xyPos[0]);
			})
		.attr("y",
			function(d)
			{
				// reflect over the horizontal line (if provided)
				if (yLine != null)
				{
					// get the center of the rectangle
					var y = d.xyPos[1] - (d.height/2);
					// reflect it
					d.xyPos[1] = Sketch.reflectValue(y, yLine) + (d.height/2);
				}
				return yScale(d.xyPos[1]);
			})
		.duration(duration).delay(delay);

	// get collection of circles
	var circles = drawCollection.selectAll("circle");
	// reflect over the given lines
	circles.transition()
		.attr("cx",
			function(d)
			{
				// reflect over the vertical line (if provided)
				if(xLine != null)
				{
					d.xyPos[0] = Sketch.reflectValue(d.xyPos[0], xLine);
				}
				return xScale(d.xyPos[0]);
			})
		.attr("cy",
			function(d)
			{
				// reflect over the horizontal line (if provided)
				if (yLine != null)
				{
					d.xyPos[1] = Sketch.reflectValue(d.xyPos[1], yLine);
				}
				return yScale(d.xyPos[1]);
			})
		.duration(duration).delay(delay);


	// get collection of polygons
	var polygons = drawCollection.selectAll("polygon");
	// reflect over the given lines
	polygons.transition()
		.attr("points",
			function(d)
			{
				// reflect over the vertical line (if provided)
				if (xLine != null)
				{
					d.xyPos[0] = Sketch.reflectValue(d.xyPos[0], xLine);
				}
				// reflect over the horizontal line (if provided)
				if (yLine != null)
				{
					d.xyPos[1] = Sketch.reflectValue(d.xyPos[1], yLine);
				}
				// reflect all the points as well
				var i;
				for (i = 0; i < d.points.length; i++)
				{
					// reflect over the vertical line (if provided)
					if (xLine != null)
					{
						d.points[i][0] = Sketch.reflectValue(d.points[i][0], xLine);
					}
					// reflect over the horizontal line (if provided)
					if (yLine != null)
					{
						d.points[i][1] = Sketch.reflectValue(d.points[i][1], yLine);
					}
					
				}
				// return the point string
				return Sketch.pointString(d.points, xScale, yScale);
			})
		.duration(duration).delay(delay);
		
		// wedges need to have their angle updated as well
		var wedges = drawCollection.selectAll("polygon.wedge");
		wedges.each(function (d)
			{
				// reflect over the vertical line (if provided)
				if (xLine != null)
				{
					d.angle = Sketch.reflectValue(d.angle, Math.PI/2);
				}
				// reflect over the horizontal line (if provided)
				if (yLine != null)
				{
					d.angle = Sketch.reflectValue(d.angle, Math.PI);
				}
				
				// if the wedge is a hash-wedge
				if (d.type == "hash")
				{
					// get the mask
					var mask = sketchContainer.select("#" + d.maskid);
					var lines = mask.selectAll("line");
					
					var ratio = .9;
					
					// reflect each of the lines inside the mask
					lines.each(function ()
						{
							// since the wedge data has already been changed, just
							// update the line data based on that
							var line = d3.select(this);
							line.transition()
							.attr("x1", function ()
										{
										return xScale(d.xyPos[0] + ratio*d.length*Math.cos(d.angle)
													+ d.width/2*Math.cos(d.angle + Math.PI/2));
									})
								.attr("y1", function ()
									{
										return yScale(d.xyPos[1] + ratio*d.length*Math.sin(d.angle)
													+ d.width/2*Math.sin(d.angle + Math.PI/2));
									})
								.attr("x2", function ()
									{
										return xScale(d.xyPos[0] + ratio*d.length*Math.cos(d.angle)
													+ d.width/2*Math.cos(d.angle - Math.PI/2));
									})
								.attr("y2", function ()
									{
										return yScale(d.xyPos[1] + ratio*d.length*Math.sin(d.angle)
													+ d.width/2*Math.sin(d.angle - Math.PI/2));
									})
								.attr("stroke-width", "4px")
								.attr("stroke", "white").attr("opacity", 1)
								.duration(duration).delay(delay);
						ratio = ratio - .33;
					});
					
				}
			});

	// get collection of lines
	var lines = drawCollection.selectAll("line");
	// reflect over the given lines
	lines.transition()
		.attr("x1",
			function(d) 
			{
				// reflect over the vertical line (if provided)
				if (xLine != null)
				{
					d.xyPos[0] = Sketch.reflectValue(d.xyPos[0], xLine);
				}
				return xScale(d.xyPos[0]);
			})
		.attr("y1",
			function(d)
			{
				// reflect over the horizontal line (if provided)
				if (yLine != null)
				{
					d.xyPos[1] = Sketch.reflectValue(d.xyPos[1], yLine);
				}
				return yScale(d.xyPos[1]);
			})
		.attr("x2",
			function(d)
			{ 
				// reflect over the vertical line (if provided)
				if (xLine != null)
				{
					// update the angle to do so
					var angle = Math.PI - d.angle;
					d.angle = angle;
				}
				return xScale(d.length * Math.cos(d.angle) + d.xyPos[0]);
			})
		.attr("y2",
			function(d)
			{ 
				// reflect over the horizontal line (if provided)
				if (yLine != null)
				{
					// update the angle to do so
					var angle = 2*Math.PI - d.angle;
					d.angle = angle;
				}
				return yScale(d.length * Math.sin(d.angle) + d.xyPos[1]);
			})
		.duration(duration).delay(delay);
		
	// get collection of textBits
	var textBits = drawCollection.selectAll("text");
	textBits.transition()
		.attr("x",
			function(d)
			{
				// reflect over the vertical line (if provided)
				if(xLine != null)
				{
					d.xyPos[0] = Sketch.reflectValue(d.xyPos[0], xLine);
				}
				return xScale(d.xyPos[0]);
			})
		.attr("y",
			function(d)
			{
				// reflect over the horizontal line (if provided)
				if (yLine != null)
				{
					d.xyPos[1] = Sketch.reflectValue(d.xyPos[1], yLine);
				}
				return yScale(d.xyPos[1]);
			})
		.duration(duration).delay(delay);

	this.lastdrawn.drawCollection = sketchContainer.selectAll("g.shape");

};

/* **************************************************************************
 * Sketch.setOpacity                                                  *//**
 *
 * Set the opacity of the sketch
 *
 * @param {number}		opacity		- opacity value to be set to (0: transparent, 1: opaque)
 * @param {number}		duration	- the duration of the transition in milliseconds
 * @param {number}		delay		- the delay before the transition starts in milliseconds
 *
 ****************************************************************************/

Sketch.prototype.setOpacity = function (opacity, duration, delay)
{
	var sketchContainer = this.lastdrawn.widgetGroup;

	// get the collection of shapes
	var drawCollection = sketchContainer.selectAll("g.shape");

	// change the opacity to the given value
	drawCollection.transition()
		.style('opacity', opacity)
		.duration(duration).delay(delay);

};

/* **************************************************************************
 * Sketch.setColor                                                     *//**
 *
 * Set the color of the sketch
 *
 * @param {string}		color		- color the sketch should be set to
 * @param {number}		duration	- the duration of the transition in milliseconds
 * @param {number}		delay		- the delay before the transition starts in milliseconds
 *
 ****************************************************************************/

Sketch.prototype.setColor = function (color, duration, delay)
{
	var sketchContainer = this.lastdrawn.widgetGroup;

	// get the collection of shapes
	var drawCollection = sketchContainer.selectAll("g.shape");

	// change the stroke color of all shapes
	drawCollection.transition()
		.style('stroke', color)
		.duration(duration).delay(delay);
	
	// wedges include a fill as well, so change that color
	var wedges = drawCollection.selectAll("polygon.wedge");
	wedges.transition()
		.style('fill', color)
		.duration(duration).delay(delay);
		
	// textBits also include a fill
	var textbits = drawCollection.selectAll("text");
	textbits.transition()
		.style('fill', color)
		.duration(duration).delay(delay);

	this.lastdrawn.drawCollection = sketchContainer.selectAll("g.shape");

};

/* **************************************************************************
 * Sketch.redraw                        	                             *//**
 *
 * Redraw the sketch as it may have been modified in size or draw bits. It will be
 * redrawn into the same container area as it was last drawn.
 *
 ****************************************************************************/
Sketch.prototype.redraw = function ()
{
	var sketchContainer = this.lastdrawn.widgetGroup;

	var that = this;
	var xScale = this.lastdrawn.xScale;
	var yScale = this.lastdrawn.yScale;
	
	// bind the sketch group collection to the data
	// the collection is used to highlight and unhighlight
	var drawCollection = sketchContainer.selectAll("g.shape").data(this.drawShape);
	
	// on the enter selection (create new ones from drawStuff) make
	// the groups. This is useful in case you want to pack more than just the
	// shape into the graup with the same relative positioning, like a label.  
	drawCollection.enter()
		.append("g")
		.attr("class", function (d) { return "shape fill" +
			 ('fill' in d ? d.fill : "None");
			 });
		
	// get rid of any shapes without data
	drawCollection.exit().remove();
	
	if (this.type == "hot"){
	//when the sketch type is hotspots, the following class will make all the 
	//groups invisble, except when selected (+ .lit).  This is all done with 
	//classes and not inline styles because styles tend to be sticky, and the class
	//information won't overwrite them.  So it makes it tough to change the 
	//highlighting.
		drawCollection.classed("hot",true);
	}
	// autokey entries which have no key with the data index
	drawCollection.each(function (d, i) { 
					// if there is no key assigned, make one from the index
					d.key = 'key' in d ? d.key : i.toString();
					});
					
	// move the sketch objects into position, but do it on the data collection, which 
	// includes both the update and the enter selections, so you can drag them around
	// on a suitable event or redraw.

	// get the collection of rectangles		  
	var rectangles = drawCollection.selectAll("rect")
		.data(function (d,i) {return d.shape == "rectangle"? d.data : [];});
	rectangles.enter().append("rect");
	rectangles.exit().remove();
	// update the properties on all new or changing rectangles
	rectangles.attr("width", function(d) { return xScale(d.width); })
		.attr("height", function(d) { return yScale(0) - yScale(d.height); })
		.attr("x", function(d) { return xScale(d.xyPos[0]); })
		.attr("y", function(d) { return yScale(d.xyPos[1]); })
		;
	
	// TODO: we're likely going to want to label the drawBits, but 
	// I don't need it now, and it's not clear if we should just layer a labelGroup
	// on it or make them part of the groups that hold each thing.
	
	// get the collection of circles
	var circles = drawCollection.selectAll("circle")
		.data(function (d,i) {return d.shape == "circle"? d.data : [];});
	circles.enter().append("circle");
	circles.exit().remove();
	// update the properties on all new or changing circles
	// unclear how to scale the radius, with x or y scale ? -lb
	circles.attr("r", function(d) {
		//this handles the case where the scale does not start at 0
		//so in order for the radius to be to scale, find the distance
		//in the local scale of the given radius from zero in the local
		//scale.  Absolute value because it must always be positive.
			return Math.abs(xScale(d.radius) - xScale(0)); })
		.attr("cx", function(d) { return xScale(d.xyPos[0]); })
		.attr("cy", function(d) { return yScale(d.xyPos[1]); });
	
	// get the collection of hexagons
	var hexagons = drawCollection.selectAll("polygon.hex")
		.data(function (d) { 
			return d.shape == "hexagon"? d.data : []; });
	hexagons.enter().append("polygon").attr("class","hex");
	hexagons.exit().remove();
	// hexagons are polygons, so they need a point string
	hexagons.attr("points", 
				function(d)
				{
					// create an array of points representing a hexagon
					d["points"] = Sketch.createHexagon(d.xyPos[0], d.xyPos[1], d.side);
					
					// turn the array into a string
					return Sketch.pointString(d.points, xScale, yScale);
				});
	
	// get collection of triangles
	var triangles = drawCollection.selectAll("polygon.tri")
		.data(function (d) { return d.shape == "triangle"? d.data : []; });
	triangles.enter().append("polygon").attr("class", "tri");
	triangles.exit().remove();
	// triangles are polygons, so they need a point string
	triangles.attr("points", 
			function(d)
			{
				// create an array of points representing a triangle
				d["points"] = Sketch.createTriangle(d.xyPos[0], d.xyPos[1], d.side);
				
				// turn the array into a string
				return Sketch.pointString(d.points, xScale, yScale);
			});
	
	// get the collection of wedges
	var wedges = drawCollection.selectAll("polygon.wedge")
		.data(function (d) { return d.shape == "wedge"? d.data : []; });
	wedges.enter().append("polygon").attr("class", "wedge");
	wedges.exit().remove();
	// wedges are a type of polygon, so they need a point string
	wedges.attr("points", 
			function(d)
			{	
				// create an array of points representing a wedge
				d["points"] = Sketch.createWedge(d.xyPos[0], d.xyPos[1], d.width,
								d.length, d.angle);
				
				// turn the array into a string		
				return Sketch.pointString(d.points, xScale, yScale);
			})
		.style('fill', 'grey');
		
	// get the id to use for the hash mask (if needed)
	var id = this.id;
	var id2 = 0;
	wedges.each(function(d)
		{
			// update unique id for each wedge
			id2++;
			// if type is a hash, put a mask on it
			if (d.type == "hash")
			{
				// get rid of the outline on the wedge
				var hash = d3.select(this);
				hash.style("stroke-width", "0px");
				
				d["maskid"] = id + id2.toString() + "hashmask";
				
				// append a mask with a unique id
				var defs = sketchContainer.select("defs");
				var mask = defs.append("mask")
					.attr("x", 0).attr("y", 0).attr("width", 1).attr("height", 1)
					.attr("id", d.maskid);
				var i;
				var ratio = .9;
				// the mask is hashed with three lines at different placements
				for (i = 0; i < 3; i++)
				{
					mask.append("line")
						.attr("x1", function ()
							{
								return xScale(d.xyPos[0] + ratio*d.length*Math.cos(d.angle)
											+ d.width/2*Math.cos(d.angle + Math.PI/2));
							})
						.attr("y1", function ()
							{
								return yScale(d.xyPos[1] + ratio*d.length*Math.sin(d.angle)
											+ d.width/2*Math.sin(d.angle + Math.PI/2));
							})
						.attr("x2", function ()
							{
								return xScale(d.xyPos[0] + ratio*d.length*Math.cos(d.angle)
											+ d.width/2*Math.cos(d.angle - Math.PI/2));
							})
						.attr("y2", function ()
							{
								return yScale(d.xyPos[1] + ratio*d.length*Math.sin(d.angle)
											+ d.width/2*Math.sin(d.angle - Math.PI/2));
							})
						.attr("stroke-width", "4px")
						.attr("stroke", "white").attr("opacity", 1);
					ratio = ratio - .33;
				}
				hash.style("mask", "url(#" + d.maskid + ")");
			}
		});


	//lines are just degenerate paths, wonder if we should do these similarly
	//probably have reason to do vector arrows on both straight lines and paths
	var lines = drawCollection.selectAll("line")
	.data(function (d) { return d.shape == "line"? d.data : []; });
	lines.enter().append("line");
	lines.exit().remove();
	lines
		.attr("x1",function(d) { return xScale(d.xyPos[0]);})
		.attr("y1",function(d) { return yScale(d.xyPos[1]);})		
		// calculate the endpoint given the length and angle
		.attr("x2",function(d) { 
					return xScale(d.length * Math.cos(d.angle) + d.xyPos[0]);
					})
		.attr("y2",function(d) { 
					return yScale(d.length * Math.sin(d.angle) + d.xyPos[1]);
					});
	
	lines.each(function (d, i)
		{ 
			// if type is a vector, put a triangle on the end
			if(d.type == "vector")
			{
				lines.attr("marker-end","url(#triangle)");
			}
		});

	var lineGen = d3.svg.line()
		// TODO: someday might want to add options for other interpolations -lb
		//	.interpolate("basis")
			.x(function (d) {return xScale(d.x);})
			.y(function (d) {return yScale(d.y);});

	var paths = drawCollection.selectAll("path")
		.data(function (d) { return d.shape == "path"? d.data : []; });
	paths.enter().append("path");
	paths.exit().remove();
	//d.d is the SVG path data for whatever shape you want to draw
	//it carries with it the information about starting location on 
	//the canvas, so it has to be in coordinates, it doesn't get scaled
	paths.attr("d", function(d) { return d.d});
	//if I supply x-y coordinates, we'd do it like this
	//TODO might need this as an alternative data format
	//just like graphs
	//paths.attr("d", function(d) {return lineGen(d);});
	
	
	// get collection of textBits
	var textBits = drawCollection.selectAll("text")
		.data(function (d) { return d.shape == "textBit"? d.data : []; });
	textBits.enter().append("text");
	textBits.exit().remove();
	textBits.attr("x", function(d) { return xScale(d.xyPos[0]); })
		.attr("y", function(d) { return yScale(d.xyPos[1]); })
			.each(function (d)
			  {
				  var node = d3.select(this);
				  var fragments = Sketch.splitOnNumbers(d.text);
				  var i;
				  for (i = 1; i < fragments.length; i += 2)
				  {
					  // write the normal text (ignore empty strings)
					  if (fragments[i-1])
					  {
						  node.append("tspan").text(fragments[i-1])
						  	.attr("font-size", "14px")
							.attr("text-anchor", "middle");
					  }

					  // write the number subscripted
					  node.append("tspan")
						  .attr("baseline-shift", "sub")
						  .text(fragments[i])
						  .attr("font-size", "10px")
						  .attr("text-anchor", "middle");
				  }
				
				  // write the last piece of normal text (ignoring empty strings)
				  var last = fragments[fragments.length - 1];
				  if (last)
				  {
				  	  node.append("tspan").text(last)	
						  .attr("font-size", "14px")
						  .attr("text-anchor", "middle");
				  }
			  });


	// publish a selected event when any of the shapes in the sketch are clicked
	drawCollection.on('click',
				function (d, i)
				{
					that.eventManager.publish(that.selectedEventId, {selectKey:d.key});
				});

	this.lastdrawn.drawCollection = sketchContainer.selectAll("g.shape");

};

/* **************************************************************************
 * Sketch.createHexagon - static                                       *//**
 *
 * Return an array of points representing an equilateral hexagon
 *
 * @param {number}	x		-The x position of the hexagon's center
 * @param {number}	y		-The y position of the hexagon's center
 * @param {number}	side	-The length of the hexagon's side
 *
 ****************************************************************************/
Sketch.createHexagon = function (x, y, side)
{	
	// use trigonometry to calculate all the points
	
	var angle = (Math.PI/6);
	
	// y values
	var fartop = y + side*(1/2 + Math.sin(angle));	// the top point
	var top = y + side/2;	// the upper middle point
	var bot = y - side/2;	// the lower middle point
	var farbot = y - side*(1/2 + Math.sin(angle));	// the bottom point
	
	// x values
	var left = x - side*Math.cos(angle);	// the left point
	var mid = x;	// the middle point
	var right = x + side*Math.cos(angle);	// the right point
	
	// create an array of points using the values
	var points = [[left, bot] , [mid, farbot] , [right, bot] ,
					[right, top] , [mid, fartop] , [left, top]];
	return points;
}

/* **************************************************************************
 * Sketch.createTriangle - static                                       *//**
 *
 * Return an array of points representing an equilateral triangle
 *
 * @param {number}	x		-The x position of the triangle's center
 * @param {number}	y		-The y position of the triangle's center
 * @param {number}	side	-The length of the triangle's side
 *
 ****************************************************************************/
Sketch.createTriangle = function (x, y, side)
{	
	// use trigonometry to calculate all the points
	
	var angle = (Math.PI/3);
	
	// x values
	var left = x - side/2;	// the left point
	var mid = x;	// the middle point
	var right = x + side/2;	// the right point
	
	// y values
	var bot = y - (side*Math.sin(angle))/2;	// the bottom point
	var top = y + (side*Math.sin(angle))/2;	// the top point
	
	// create an array of points using the values
	var points = [[left, bot] , [right, bot] , [mid, top]];
	return points;
}

/* **************************************************************************
 * Sketch.createWedge - static                                       *//**
 *
 * Return an array of points representing a wedge
 *
 * @param {number}	x		-The x position of the wedge's tip
 * @param {number}	y		-The y position of the wedge's tip
 * @param {number}	wid		-The width of the wedge at its widest
 * @param {number}	len		-The length of the wedge
 * @param {number}	ang		-The angle of the wedge's centerline
 *
 ****************************************************************************/
Sketch.createWedge = function (x, y, wid, len, ang)
{	
	// calculate the centerpoint of the side perpendicular to the length
	var flatx = len * Math.cos(ang) + x;
	var flaty = len * Math.sin(ang) + y;
	
	// get the angle of the side perpendicular to the length
	var angle = ang + Math.PI/2;
	
	// find the endpoints of the side perpendicular to the length
	var tip1x = flatx + wid/2*Math.cos(angle);
	var tip1y = flaty + wid/2*Math.sin(angle);
	var tip2x = flatx - wid/2*Math.cos(angle);
	var tip2y = flaty - wid/2*Math.sin(angle);
	
	// create an array of points based on the values
	var points = [[tip1x, tip1y] , [x, y] , [tip2x, tip2y]];
	return points;
}

/* **************************************************************************
 * Sketch.reflectValue - static                                       *//**
 *
 * Reflects the value over the given line
 *
 * @param {number}	value	-The value to be translated
 * @param {number}	line	-The line to be reflected over
 *
 ****************************************************************************/
Sketch.reflectValue = function (value, line)
{
	// get the distance between the value and the reflection line
	var diff = line - value;
	// reflect it
	return line + diff;
}

/* **************************************************************************
 * Sketch.splitOnNumbers - static                                       *//**
 *
 * Return an array w/ an odd number of elements derived by splitting the given
 * string on groups of decimal digits. Each even element (0, 2, 4...) contains
 * the text before a group of digits, each odd element is the group of digits
 * and the final element is any text after the last digit group.
 *
 * @param {string}	s	-The string to parse on digit groups
 *
 ****************************************************************************/
Sketch.splitOnNumbers = function (s)
{
	if (typeof s === 'number')
	{
		s = s.toString();
	}

	var matches = [];
	var re = /([^0-9]*)([0-9]+)/g;

	var match;
	var lastIndex = re.lastIndex;
	for (match = re.exec(s); match !== null; match = re.exec(s))
	{
		matches.push(match[1], match[2]);
		lastIndex = re.lastIndex;
	}

	matches.push(s.slice(lastIndex));

	return matches;
};

/* **************************************************************************
 * Sketch.pointString - static                                       *//**
 *
 * Return a string matching the format needed for the point string of a d3
 * polygon, based on the given 2-dimensional array of points.
 *
 * @param {array}	a		-The 2-dimensional array of points
 * @param {number}	xScale	-function to convert a horizontal data offset
 *								 to the pixel offset into the data area.
 * @param {number}	yScale	-function to convert a vertical data offset
 *								 to the pixel offset into the data area.
 *
 ****************************************************************************/
Sketch.pointString = function (a, xScale, yScale)
{	
	// formatting function
	var rnd = d3.format('2f');
	
	// start with an empty string
	var pointstr = "";
	
	var i;
	// add the points to the string in the correct format
	for (i = 0; i < a.length; i++)
	{
		pointstr = pointstr + rnd(xScale(a[i][0])) + "," + rnd(yScale(a[i][1]))
		 					+ " ";
	}
	// get rid of last space
	pointstr = pointstr.substring(0, pointstr.length - 1);
	
	// return the string
	return pointstr;
}


/* **************************************************************************
 * Sketch.lite                                                 *//**
 *
 * Highlight the drawing bits associated w/ the given key and
 * remove any highlighting on all others.
 *
 * @param {string|number}	liteKey	-The key associated with the label(s) to be highlighted.
 *
 ****************************************************************************/


Sketch.prototype.lite = function (liteKey)
{
	console.log("TODO: Log fired Sketch Select " + liteKey);
	
	// return all styles to normal on all the labels and numbers
	this.lastdrawn.drawCollection
		.classed('lit', false);	 
	
	// create a filter function that will match all instances of the liteKey
	// then find the set that matches
	var matchesKey = function (d, i) { return d.key === liteKey; };
	
	var set = this.lastdrawn.drawCollection.filter(matchesKey);
	
	// if any are found, highlight the selected label(s)
	if (set[0][0]) 
	{
		// for numbered labels, highlight the selected circle and any others
		// with the same liteKey
		set.classed('lit', true);
	
	} 
	else
	{
		console.log("No key '" + liteKey + "' in Sketch group " + this.id );
	}
}; // end of Sketch.lite()

