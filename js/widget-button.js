/* **************************************************************************
 * $Workfile:: widget-button.js                                             $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the button widget.
 *
 * The button widget creates an HTML5 button which publishes (fires) an
 * event when clicked using the event manager.
 *
 * Created on		May 8, 2013
 * @author			Jordan Vishniac
 * @author			Michael Jay Lippert
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

// Sample Button constructor configuration
(function()
{
	var button1Config = {
			id: "button1",
			text: "Hello World"
		};
});
	
/* **************************************************************************
 * Button                                                               *//**
 *
 * @constructor
 *
 * The button widget creates a clickable button that publishes events.
 *
 * @param {Object}		config		-The settings to configure this button
 * @param {string}		config.id	-String to uniquely identify this button
 * @param {string}		config.text	-The text to be displayed on the button
 *
 * @param {Object}		eventManager
 *
 * NOTES: firefox doesn't support HTML5 buttons, they degrade to numeric input
 * fields.
 **************************************************************************/
function Button(config, eventManager)
{
	/**
	 * A unique id for this instance of the button widget
	 * @type {string}
	 */
	this.id = config.id;
	
	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager;
	
	/**
	 * The event id published when this button is clicked.
	 * @const
	 * @type {string}
	 */
	this.pressedEventId = this.id + '_Pressed';
	
	var text = config.text !== undefined ? config.text : "Default text";
	
	/**
	 * The root element of the element tree for this button. It should
	 * be appended into the document where it is expected to be displayed.
	 * @type {Element}
	 * @private
	 *
	 */
	this.rootEl_ = $('<div><button type="button">' + text + '</button></div>');
	
	// publish events when clicked
	var that = this;
	$("button", this.rootEl_).click(
		function()
		{
			that.eventManager.publish(that.pressedEventId);
		});
	
} // end of button constructor

/* **************************************************************************
 * Button.setText                                                       *//**
 *
 * This method sets the text displayed on the button to the given string
 *
 * @param {string}		text	- the text to be displayed on the button
 *
 **************************************************************************/
Button.prototype.setText = function(text)
{	
	// Update the DOM in getRootEl
	var b = $("button", this.rootEl_);
	var t = b.text();
	$("button", this.rootEl_).text(text);
}

/* **************************************************************************
 * Button.getText                                                       *//**
 *
 * This method retrieves the text currently displayed on the button,
 *
 **************************************************************************/
Button.prototype.getText = function()
{
	return $("button", this.rootEl_).text();
}

/* **************************************************************************
 * Button.getRootEl                                                     *//**
 *
 * Get the root element of this button widget.
 *
 **************************************************************************/
Button.prototype.getRootEl = function()
{
	return this.rootEl_;
}

