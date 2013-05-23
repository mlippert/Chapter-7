/* **************************************************************************
 * $Workfile:: widget-linegraph.js                                          $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the LineGraph widget.
 *
 * The LineGraph widget provides a line (or scatter) graph visualization
 * of sets of data points.
 *
 * Created on		March 27, 2013
 * @author			Leslie Bondaryk
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample LineGraph constructor configuration
(function()
{
	var lg1Config = {
			id: "lg1",
			Data: [lineData1],
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
});
	
/* **************************************************************************
 * LineGraph                                                            *//**
 *
 * The LineGraph widget provides a line (or scatter) graph visualization
 * of sets of data points.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this LineGraph
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this LineGraph.
 * 										 if undefined a unique id will be assigned.
 * @param {Array.<Array.<{x: number, y: number}>}
 *						config.Data		-An array of traces (lines on the graph);
 *										 each trace is an array of points defining that trace.
 * @param {string		config.type		-String specifying "lines", "points", or
 *										 "lines+points" for traces.
 * @param {AxisFormat}	config.xAxisFormat -Format of the x axis of the graph.
 * @param {AxisFormat}	config.yAxisFormat -Format of the y axis of the graph.
 *
 * @todo: need to add custom symbols or images for scatter plots.
 *
 ****************************************************************************/
function LineGraph(config)
{
	/**
	 * A unique id for this instance of the line graph widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, LineGraph);

	/**
	 * Array of traces to be graphed, where each trace is an array of points and each point is an
	 * object w/ a {number} x and {number} y property.
	 * @type Array.<Array.<{x: number, y: number}>
	 * e.g. 2 traces, 1st w/ 2 points, 2nd with 3 points:
	 *   [ [{x: -1.2, y: 2.0} {x: 2, y: 3.1}], [{x: -2, y: -2}, {x: 0, y: 0}, {x: 2, y: 2}] ]
	 */
	this.data = config.Data;

	/**
	 * The render type is one of:
	 * <ul>
	 *  <li> "lines" for a line plot
	 *  <li> "points" for a scatter plot
	 *  <li> "lines+points" for interpolated plots
	 * </ul>
	 * @type {string}
	 * TODO supply images as point glyphs
	 */
	this.type = config.type;

	this.xAxisFormat = config.xAxisFormat;
	this.yAxisFormat = config.yAxisFormat;

	/**
	 * List of child widgets which are to be drawn in this line graph's data area.
	 * Child widgets are added using LineGraph.append.
	 * @type {Array.<IWidget>}
	 */
	this.childWidgets = [];
	
	/**
	 * Information about the last drawn instance of this line graph (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			size: {height: 0, width: 0},
			dataRect: new Rect(0, 0, 0, 0),
			linesId: this.id + '_lines',
			axes: null,
			xScale: null,
			yScale: null,
			graph: null,
			traces: null,
			series: null,
		};
} // end of LineGraph constructor

/**
 * Prefix to use when generating ids for instances of LineGraph.
 * @const
 * @type {string}
 */
LineGraph.autoIdPrefix = "lgrf_auto_";


/* **************************************************************************
 * LineGraph.draw                                                       *//**
 *
 * Draw the LineGraph widget into the specified area of the given container.
 *
 * @param {!d3.selection}
 *					container	-The container svg element to append the graph element tree to.
 * @param {Object}	size		-The size in pixels for the graph
 * @param {number}	size.height	-The height for the graph.
 * @param {number}	size.width	-The width for the graph.
 *
 ****************************************************************************/
LineGraph.prototype.draw = function(container, size)
{
	this.lastdrawn.container = container;
	this.lastdrawn.size = size;
	
	// Create the axes (svg canvas) in the container
	var axesConfig = {
			id: this.id + '_axes',
			size: this.lastdrawn.size,
			xAxisFormat: this.xAxisFormat,
			yAxisFormat: this.yAxisFormat,
		};
		
	var dataPts = d3.merge(this.data);
	axesConfig.xAxisFormat.extent = d3.extent(dataPts, function(pt) {return pt.x;});
	axesConfig.yAxisFormat.extent = d3.extent(dataPts, function(pt) {return pt.y;});
	
	if (axesConfig.xAxisFormat.type == 'ordinal' && !$.isArray(axesConfig.xAxisFormat.ticks))
	{
		var ordinalValueMap = d3.set(dataPts.map(function (pt) {return pt.x;}));
		axesConfig.xAxisFormat.ticks = ordinalValueMap.values();
	}
	
	if (axesConfig.yAxisFormat.type == 'ordinal' && !$.isArray(axesConfig.yAxisFormat.ticks))
	{
		var ordinalValueMap = d3.set(dataPts.map(function (pt) {return pt.y;}));
		axesConfig.yAxisFormat.ticks = ordinalValueMap.values();
	}
	
	//make the axes for this graph - draw these first because these are the 
	//pieces that need extra unknown space for ticks, ticklabels, axis label
	this.lastdrawn.axes = new Axes(this.lastdrawn.container, axesConfig);

	//inherit the dataRect from the axes container
	this.lastdrawn.dataRect = this.lastdrawn.axes.dataRect;
	
	// alias for axes once they've been rendered
	var axesDrawn = this.lastdrawn.axes;
	
	//inherit the x and y scales from the axes container
	this.lastdrawn.xScale = axesDrawn.xScale;
	this.lastdrawn.yScale = axesDrawn.yScale;

	var linesId = this.lastdrawn.linesId;

	var clipId = linesId + "_clip";

	var graph = axesDrawn.group.append("g") //make a group to hold new lines
		.attr("class","widgetLineGraph").attr("id", linesId);
	
	
	graph.append("defs")
			.append("clipPath")
				.attr("id", clipId)
				.append("rect")
					.attr("width", axesDrawn.dataRect.width)
					.attr("height", axesDrawn.dataRect.height);

	// make a clippath, which is used in the case that we zoom or pan 
	// the graph dynamically, or for data overflow into the tick and
	// label areas

	//TEST: the graph group now exists and reports it's ID correctly
	console.log("graph group is made:", graph.attr("id") == linesId);
	
	this.lastdrawn.graph = graph;

	// Draw the data (traces and/or points as specified by the graph type)
	this.drawData_();

	// Draw any child widgets that got appended before draw was called
	this.childWidgets.forEach(this.drawWidget_, this);
				
	
}; // end of LineGraph.draw()

/* **************************************************************************
 * LineGraph.redraw                                                     *//**
 *
 * Redraw the line graph data as it may have been modified. It will be
 * redrawn into the same container area as it was last drawn.
 *
 ****************************************************************************/
LineGraph.prototype.redraw = function ()
{
	// TODO: We may want to create new axes if the changed data would cause their
	//       min/max to have changed, but for now we're going to keep them.

	// TODO: Do we want to allow calling redraw before draw (ie handle it gracefully
	//       by doing nothing? -mjl
	this.drawData_();
	
	this.childWidgets.forEach(this.redrawWidget_, this);
};

/* **************************************************************************
 * LineGraph.drawWidget_                                                *//**
 *
 * Draw the given child widget in this line graph's data area.
 * This line graph must have been drawn BEFORE this method is called or
 * bad things will happen.
 *
 * @private
 *
 * @todo implement some form of error handling! -mjl
 *
 ****************************************************************************/
LineGraph.prototype.drawWidget_ = function (widget)
{
	widget.setScale(this.lastdrawn.xScale, this.lastdrawn.yScale);
	widget.draw(this.lastdrawn.axes.group, this.lastdrawn.dataRect.getSize());
};

/* **************************************************************************
 * LineGraph.redrawWidget_                                              *//**
 *
 * Redraw the given child widget.
 * This line graph and this child widget must have been drawn BEFORE this
 * method is called or bad things will happen.
 *
 * @private
 *
 * @todo implement some form of error handling! -mjl
 *
 ****************************************************************************/
LineGraph.prototype.redrawWidget_ = function (widget)
{
	widget.redraw();
};

/* **************************************************************************
 * LineGraph.drawData_                                                  *//**
 *
 * Draw the line graph data (overwriting any existing line graph data).
 *
 * @private
 *
 ****************************************************************************/
LineGraph.prototype.drawData_ = function ()
{
	// local var names are easier to read (shorter)
	var linesId = this.lastdrawn.linesId;
	var xScale = this.lastdrawn.xScale;
	var yScale = this.lastdrawn.yScale;

	// get the group that contains the graph lines
	var graph = this.lastdrawn.graph;

	//TEST: the graph group now exists and reports it's ID correctly
	console.log("line graph group is found:", graph.attr("id") == linesId);  

	var clipId = linesId + "_clip";

	// draw the trace(s)
	if (this.type == "lines" || this.type == "lines+points")
	{
		// d3 utility function for generating all the point to point paths
		// using the scales from the axes
		var line = d3.svg.line()
			// TODO: someday might want to add options for other interpolations -lb
			.interpolate("basis")
			.x(function (d) {return xScale(d.x);})
			.y(function (d) {return yScale(d.y);});

		// rebind the trace data to the trace groups
		var traces = graph.selectAll("g.traces")
			.data(this.data);
			
		// get rid of any trace groups without data
		traces.exit().remove();
					
		// create trace groups for trace data that didn't exist when we last bound the data
		traces.enter().append("g")
			.attr("class", function(d, i) {return "traces stroke" + i;})
			.append("path")
			//pick the colors sequentially off the list
				
				.attr("clip-path", "url(#" + clipId + ")");
			
		// update the data on all traces, new and old
		traces.select("path")
			//use the line function defined above to set the path data
				.attr("d", function(d) {return line(d);});
		
		// autokey entries which have no key with the data index
		traces.each(function (d, i) { 
					// if there is no key assigned, make one from the index
					d.key = 'key' in d ? d.key : i.toString();
					});
					
		this.lastdrawn.traces = graph.selectAll("g.traces");
		
		traces.on('click',
				function (d, i)
				{
					that.eventManager.publish(that.selectedEventId, {selectKey: d.key});
				});
				
	} // end if statement to draw lines

	// draw the points
	if (this.type == "points" || this.type == "lines+points")
	{
		// rebind the series data to the series groups
		var series = graph.selectAll("g.series")
			.data(this.data);
			
		// get rid of any series groups without data
		series.exit().remove();

		// create series groups for series data that didn't exist when we last bound the data
		series.enter().append("g")
			.attr("class", function (d, i) {return "series fill" + i;})
			.attr("clip-path", "url(#" + clipId + ")");
			
		// autokey entries which have no key with the data index
		series.each(function (d, i) { 
					// if there is no key assigned, make one from the index
					d.key = 'key' in d ? d.key : i.toString();
					});

		// make a clean selection of all series (sets of points)
		// for subsequent use in highlighting
		this.lastdrawn.series = graph.selectAll("g.series");

		// rebind the point data of each series to the point groups
		// (the data of the series is an array of point data)
		var points = series.selectAll("g.points") 
			.data(function (d) {return d;});
		
		// get rid of any point groups without data
		points.exit().remove();
		
		// create point groups for point data that didn't exist when we last bound the data
		points.enter().append("g") 
			.attr("class", "points");
		
		// update the data on all points (new and old)
		points
			.attr("transform", function (d){
						// move each symbol to the x,y coordinates in scale
						return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
							   })
			.append("path")
				.attr("d", 
					// j is the index of the series, 
					// i of the data point in the series
					function(d, i, j)
					{
						//pick the shapes sequentially off the list
						return (d3.svg.symbol().type(d3.svg.symbolTypes[j])());
					});
	}
} // end of LineGraph.drawData_()

/* **************************************************************************
 * LineGraph.append                                                     *//**
 *
 * Append the widget or widgets to this line graph and draw it/them on top
 * of the line graph's data area and any widgets appended earlier. If append
 * is called before draw has been called, then the appended widget(s) will be
 * drawn when draw is called.
 *
 * @param {!IWidget|Array.<IWidget>}
 * 						svgWidgets	-The widget or array of widgets to be drawn in
 *									 this line graph's data area.
 *
 ****************************************************************************/
LineGraph.prototype.append = function(svgWidgets)
{
	if (!$.isArray(svgWidgets))
	{
		this.append_one_(svgWidgets);
	}
	else
	{
		svgWidgets.forEach(this.append_one_, this);
	}
		
}; // end of LineGraph.append()

/* **************************************************************************
 * LineGraph.append_one_                                                *//**
 *
 * Helper for append that does the work needed to append a single widget.
 *
 * @param {!IWidget}	widget	-The widget which is to be drawn in this line
 *								 graph's data area.
 *
 * @private
 *
 ****************************************************************************/
LineGraph.prototype.append_one_ = function(widget)
{
	this.childWidgets.push(widget);
	
	if (this.lastdrawn.container !== null)
		this.drawWidget_(widget);
		
}; // end of LineGraph.append_one_()

/* **************************************************************************
 * LineGraph.lite                                                      *//**
 *
 * Highlight the label(s) associated w/ the given liteKey (key) and
 * remove any highlighting on all other labels.
 *
 * @param {string}	liteKey	-The key associated with the label(s) to be highlighted.
 *
 ****************************************************************************/
LineGraph.prototype.lite = function(liteKey)
{
	
	console.log("TODO: log fired LineGraph highlite " + liteKey);
	
	// Turn off all current highlights
	var allTraces = this.lastdrawn.traces;
	allTraces
		.classed("lit", false);
		
	//var allSeries = this.lastdrawn.series;
	//allSeries
		//.classed("lit", false);

	// create a filter function that will match all instances of the liteKey
	// then find the set that matches
	var matchesLabelIndex = function (d, i) { return d.key === liteKey; };
	
	var linesToLite = allTraces.filter(matchesLabelIndex);

	// Highlight the labels w/ the matching key
	linesToLite
		.classed("lit", true);

	if (linesToLite.empty())
	{
		console.log("No key '" + liteKey + "' in line graph " + this.id );
	}

};
