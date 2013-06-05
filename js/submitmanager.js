/* **************************************************************************
 * $Workfile:: submitmanager.js                                             $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of a SubmitManager object.
 *
 * The SubmitManager does some stuff.
 *
 * Created on		June 04, 2013
 * @author			Seann
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

/* **************************************************************************
 * Constants
 ****************************************************************************/

/* **************************************************************************
 * Page variables
 ****************************************************************************/

/* **************************************************************************
 * SubmitManager                                                         *//**
 *
 * @constructor
 *
 * The event manager handles your submissions, yo.
 *
 * @constructor
 *
 * @param {Object}		config			-The settings to configure this SubmitManager
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this SubmitManager.
 * 										 if undefined a unique id will be assigned.
 *
 ****************************************************************************/
function SubmitManager(config)
{
	/**
	 * A unique id for this instance of the SubmitManager widget
	 * @type {string}
	 */
	this.id = 1;//getIdFromConfigOrAuto(config, SubmitManager);
}
