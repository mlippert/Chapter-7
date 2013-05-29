/* **************************************************************************
 * helper.js                                                                $
 * **********************************************************************//**
 *
 * @fileoverview Helper functions for use w/ the mocha tests.
 *
 * Created on		May 29, 2013
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

'use strict';

// Note: this is a name in the global space. I'm still not sure of the best
// way to do this. -mjl
// For now, to add a new helper function, define a local variable in the function
// below, and then add a property with that value in the returned object.
var helper = (function () {
    var expect = chai.expect;

	/* **************************************************************************
	 * createNewDiv                                                         *//**
	 *
	 * createNewDiv will find the mocha div in the document and create and
	 * return a sibling div following it.
	 *
	 * @return {Element} the newly created div element
	 *
	 ****************************************************************************/
	var createNewDiv = function createNewDiv()
	{
		var mochaDiv = d3.select("div#mocha");
		var parent = d3.select(mochaDiv.node().parentNode);
		return parent.append("div").node();
	};

	/* **************************************************************************
	 * createNewSvgContainer                                                *//**
	 *
	 * createNewSvgContainer removes the node initially specified in config.node
	 * and resets config.node to a new node (created using createNewDiv), then
	 * creates and returns an SVGContainer using that config.
	 *
	 * @param {Object} config			-A config object for SVGContainer.
	 * @param {d3.selection}
	 * 					config.node		-null, or an existing node to be removed.
	 * @param {number}  config.maxWid	-The maximum width of the svg container (in pixels)
	 * @param {number}  config.maxHt	-The maximum width of the svg container (in pixels)
	 *
	 * @return {SVGContainer} the newly created SVGContainer
	 *
	 ****************************************************************************/
	var createNewSvgContainer = function createNewSvgContainer(config)
	{
		// Clean up node from previous test
		config.node && config.node.remove();
		// Get a reference to an empty div to create the widget in.
		config.node = d3.select(createNewDiv());
		// Create an empty svg container to be able to append a LineGraph to.
		return new SVGContainer(config);
	};

	return {
		createNewDiv: createNewDiv,
		createNewSvgContainer: createNewSvgContainer
	};
})();
