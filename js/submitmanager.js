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

// Sample SubmitManager constructor configuration
(function()
{
	var submit1Config = {
			id: "sm1"
		};
});

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
 * @param {string}		sequenceNodeID	-sequenceNodeID uniquely identifies the item.
 *										 This is a PAF construct.
 *
 ****************************************************************************/

function SubmitManager(config, eventManager)
{
	/**
	 * A unique id for this instance of the SubmitManager widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, SubmitManager);

	/**
	 * The PAF SequenceNodeID, uniquely identifying the item
	 * @type {string}
	 */
	this.sequenceNodeID = config.sequenceNodeID;

	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager;

	/**
	 * The event id published when a submission is returned.
	 * @const
	 * @type {string}
	 */
	this.submittedEventId = this.id + '_submitted';
	
}

/**
 * Prefix to use when generating ids for instances of LabelGroup.
 * @const
 * @type {string}
 */
SubmitManager.autoIdPrefix = "sm_auto_";


/* **************************************************************************
 * SubmitManager.submit                                                 *//**
 *
 * Submit the student's submission to the answer engine.  Publish the result.
 *
 * CURRENT FAKEY STUB...  We send the submission to the fancyAnswerEngine()
 * function in which we can put whatever fakery we want for the short term.
 *
 * IN THE FUTURE...  We likely end up passing the submission to the 
 * Activity Manager which will know where the answer engine is, either 
 * a server-side thing (The Player Backend), a client-side thing (probably also
 * related to the Player), or the PAF Hub.
 *
 * @param {string}	submission	-The student's submission
 *
 ****************************************************************************/
SubmitManager.prototype.submit = function (submission)
{
	// Is this necessary?
	var that = this;

	// pass the submission on to the answer engine.  This will probably be
	// via the ActivityManager I'd think
	var submissionResponse = fancyAnswerEngine(this.sequenceNodeID, submission);

	// publish the result of the submission
	this.eventManager.publish(that.submittedEventId, submissionResponse);
};

/* **************************************************************************
 * fancyAnswerEngine                                                 *//**
 *
 * I'm just a stub
 * Yes, I'm only a stub
 * And I'm sitting here on ...
 *
 * If we want to make this more useful, but still fakey, we could extract this
 * into another included javascript file, pretend it's some passthru in the
 * ActivityManager that shunts the submission (and the whole SequenceNode, 
 * which it would get from the sequenceNodeID we have) off to the real Answer Engine,
 * and hardcode some answer enginey stuff in there based on sequenceNodeID.
 *
 * @param {string}	submission	-The student's submission
 *
 ****************************************************************************/
fancyAnswerEngine = function (sequenceNodeID, submission)
{
	// You're always WRONG!  HAHAHHAHAHA.
	var submissionResponse = {
		grade: 0,
		response: "Sorry, try again."
	};
	return submissionResponse;
};
