/* **************************************************************************
 * $Workfile:: widget-selectgroup.js                                         $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the SelectGroup widget.
 *
 * The SelectGroup widget draws a list of choices and allows the user to
 * select one of the choices.
 *
 * Created on		June 12, 2013
 * @author			Leslie Bondaryk
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample configuration objects for classes defined here
(function()
{
	var Q1Choices =
	[
		{
			content: "Dewatering and hydrofracking",
			answerKey: "correct"
		},
		{
			content: "Dewatering and mining",
			response: "Mining is a term generally used to apply to removing solids from the ground.",
			answerKey: "wrong1"
		},
		{
			content: "Hydrofracking and gas distillation",
			response: "Distillation refers to the refinement of gas, not extraction.",
			answerKey: "wrong2"
	
		},
		{
			content: "Dewatering and coalbed methane leaching",
			response: "Coalbed leaching is an older technique.",
			answerKey: "wrong3"
		}
	];
	
	// Select widget config
	var selConfig =
		{
			//id: "SEL1",
			choices: Q1Choices,
		};
	
	// SelectQuestion widget config
	var sqConfig =
	{
		id: "Q1",
		question: "<span id='selTarget'></span> are two examples of new tchniques being used to extract natural gas.",
		choices: Q1Choices,
		type: "randomized", //default, even if not specified
	};
});

/**
 * Answers are presented to users by certain widgets that allow the user to
 * select one (or more of them).
 *
 * @typedef {Object} Answer
 * @property {string}	content		-The content of the answer, which presents the
 * 									 meaning of the answer.
 * @property {string}	response	-The response is presented to the user when
 * 									 they choose/submit this answer.
 * @property {string}	answerKey	-This is the unique ID that will be returned
 * 									 to the scoring engine to identify that the
 * 									 user has chosen this answer.
 *
 * @todo: the content currently must be text (a string) however, we are likely
 * to want to make the content be a chemical symbol or math equation widget in future.
 * @todo: One important use of select is as a quiz-me version of a labeled diagram
 * or image.  We will need to layer these on top of SVG objects in SVG pixel positions.
 */


/* **************************************************************************
 * SelectGroup                                                           *//**
 *
 * The SelectGroup widget draws a list of choices and allows the user to
 * select one of the choices.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this SelectGroup
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this SelectGroup.
 * 										 if undefined a unique id will be assigned.
 * @param {Array.<Answer>}
 *						config.choices	-The list of choices (answers) to be presented by the SelectGroup.
 *
 ****************************************************************************/
function SelectGroup(config, eventManager)
{
	var that = this;
	
	/**
	 * A unique id for this instance of the radio group widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, SelectGroup);

	/**
	 * The list of choices presented by the RadioGroup.
	 * @type {Array.<Answer>}
	 */
	this.choices = config.choices;

	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager || { publish: function () {}, subscribe: function () {} };

	/**
	 * The event id published when an item in this carousel is selected.
	 * @const
	 * @type {string}
	 */
	this.changedValueEventId = this.id + '_option';
	
	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string} selectKey	-The answerKey associated with the selected answer.
	 */

	/**
	 * Information about the last drawn instance of this button (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			widgetGroup: null,
			choiceSelected: null,
		};
} // end of SelectGroup constructor

/**
 * Prefix to use when generating ids for instances of SelectGroup.
 * @const
 * @type {string}
 */
SelectGroup.autoIdPrefix = "sg_auto_";

/* **************************************************************************
 * SelectGroup.draw                                                      *//**
 *
 * Draw this SelectGroup in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container html element to which we 
 *								append the select element tree.
 *
 ****************************************************************************/
SelectGroup.prototype.draw = function(container)
{
	this.lastdrawn.container = container;

	var that = this;
	
	// make a span to hold the select group
	// these are often used inline in sentences, so we don't want a block element.
	var widgetGroup = container.append("span")
		.attr("class", "widgetSelectGroup")
		.attr("id", this.id);
		
	var selectTag = widgetGroup.append("select")
						.attr("name", this.id)
						//set the width to auto so it sizes to content
						.style("width","auto");

	// Create the options from the choices data
	var options = selectTag.selectAll("option").data(this.choices);
	
	options.enter().append("option") 
			.attr("value", function (d) {return d.answerKey;})
			//use html to populate the options so any markup is retained
			.html(function(d) {return d.content});
	
	selectTag.on('change',
				function ()
				{
					that.eventManager.publish(that.changedValueEventId, {
							selectedIndex: this.selectedIndex,
							selectValue: that.choices[this.selectedIndex].answerKey});
				});
	
	//when the page first loads, we want the selectedIndex to be -1
	//which causes the dropdown to display a blank. This means that any choice,
	//even the first one in the list, represents a change.  Prolly want to do
	//this differently once we've implemented state. -lb			
	selectTag[0][0].selectedIndex = -1;
	
	this.lastdrawn.widgetGroup = widgetGroup;

}; // end of SelectGroup.draw()

/* **************************************************************************
 * SelectGroup.getselectedIndex                                           *//**
 *
 * Return the selected item in the select group.
 *
 * @return {Object} the select group item which is currently selected.
 *
 ****************************************************************************/
SelectGroup.prototype.getSelectedIndex = function ()
{
	return document.getElementById(this.id).selectedIndex;
};
/* **************************************************************************
 * SelectGroup.selectedItem                                              *//**
 *
 * Return the selected item in the select group.
 *
 * @return {Object} the select group item which is currently selected.
 *
 ****************************************************************************/
SelectGroup.prototype.setSelectedIndex = function (newIndex)
{
	document.getElementsByName(this.id)[0].selectedIndex = newIndex;
};

