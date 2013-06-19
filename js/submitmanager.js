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
 * Page variables
 ****************************************************************************/

// Sample SubmitManager constructor configuration
(function()
{
	var submit1Config = {
			id: "sm1",
			//sequenceNodeID is used to tell the PAF engine where in the assignment 
			//(sequence of activities) this particular activity lives
			sequenceNodeID: 'http://hub.paf.pearson.com/resources/sequences/3314583736548363/nodes/1'
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
	 * pointer to the submission div so responses can be written
	 * @type {d3 selection object}
	 */
	this.container = config.container;


	/**
	 * The PAF SequenceNodeID, uniquely identifying the item
	 * @type {string}
	 */
	this.sequenceNodeID = config.sequenceNodeID;

	/**
	 * map of all submitted answers awaiting a response from
	 * the scoring engine.
	 * @type {Object}
	 */
	this.requestsAwaitingResponse = {};

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
 * SubmitManager.handleRequestsFrom                                                                *//**
 *
 * [Description of handleRequestsFrom]
 *
 * @param {Object}	questionWidget		-[Description of questionWidget]
 *
 ****************************************************************************/
SubmitManager.prototype.handleRequestsFrom = function(questionWidget)
{
	var that = this;
	this.eventManager.subscribe(questionWidget.submitScoreRequestEventId,
								function (eventDetails) {that.handleScoreRequest_(eventDetails);});
};

/* **************************************************************************
 * SubmitManager.handleScoreRequest_                                                                *//**
 *
 * [Description of handleScoreRequest_]
 *
 * @param {Object}	eventDetails		-[Description of eventDetails]
 *
 ****************************************************************************/
SubmitManager.prototype.handleScoreRequest_ = function(eventDetails)
{
	var pendingDetails =
		{
			sequenceNodeId: eventDetails.questionId,
			answer: eventDetails.answerKey,
			responseCallback: eventDetails.responseCallback,
			requestDetails: eventDetails,
		};

	if (this.requestsAwaitingResponse[eventDetails.questionId] !== undefined)
	{
		alert("there's already an outstanding submission request for the sequenceNode: " + eventDetails.questionId);
	}

	this.requestsAwaitingResponse[eventDetails.questionId] = pendingDetails;

	this.submitForScoring(pendingDetails);
};

/* **************************************************************************
 * SubmitManager.submitForScoring                                       *//**
 *
 * [Description of submitForScoring]
 *
 * @param {Object}	submitDetails		-[Description of submitDetails]
 *
 ****************************************************************************/
SubmitManager.prototype.submitForScoring = function(submitDetails)
{
	// pass the submission on to the scoring engine. This will probably be
	// via the ActivityManager I'd think
	// todo: Although we're getting a synchronous response here, we should
	// enhance this to have the "answerMan" give us an asynchronous
	// response, probably via an eventManager event. -mjl
	var submissionResponse = answerMan({sequenceNode: submitDetails.sequenceNodeId},
										submitDetails.answer);

	// We handle the reply from the scoring engine (in the event handler eventually)
	// by removing the request from the list of pending request
	// and calling the given callback if it exists
	var pendingDetails = this.requestsAwaitingResponse[submitDetails.sequenceNodeId];
	delete this.requestsAwaitingResponse[submitDetails.sequenceNodeId];
	if (typeof pendingDetails.responseCallback === "function")
	{
		submissionResponse.submitDetails = pendingDetails.requestDetails;
		pendingDetails.responseCallback(submissionResponse);
	}
};

/* **************************************************************************
 * SubmitManager.submit                                                 *//**
 *
 * Submit the student's submission to the answer engine.  Publish the result.
 *
 * CURRENT FAKEY STUB...  We send the submission to the answerman()
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
	// pass the submission on to the answer engine.  This will probably be
	// via the ActivityManager I'd think
	var submissionResponse = answerMan(
			{	sequenceNode: this.sequenceNodeID,
				container: this.container,
			}, submission);

	// publish the result of the submission
	this.eventManager.publish(this.submittedEventId, submissionResponse);
};

/* **************************************************************************
 * SubmitManager.appendResponseWithDefaultFormatting                    *//**
 *
 * This is a temporary helper method to format the responses to submitted
 * answers.
 *
 * @param {!d3.selection}
 * 					container		-The html element to write the formatted
 * 									 response into.
 * @param {Object}	responseDetails	-The response details returned by the
 * 									 scoring engine.
 *                               grade: 0..1
 *                               response: string response
 ****************************************************************************/
SubmitManager.appendResponseWithDefaultFormatting = function (container, responseDetails)
{
	var responseFormat = {
			correct: {
				icon: "icon-ok-sign",
				answerPrefix: "Congratulations, Your answer, ",
				answerSuffix:  ", is correct. ",
				responseClass: "alert-success"
			},
			incorrect: {
				icon: "icon-remove",
				answerPrefix: "Sorry, Your answer, ",
				answerSuffix:  ", is not correct. ",
				responseClass: "alert-error"
			},
			partial: {
				icon: "icon-adjust",
				answerPrefix: "Your answer, ",
				answerSuffix:  ", is partially correct. ",
				responseClass: "alert-info"
			},
			unknown: {
				icon: "icon-adjust",
				answerPrefix: "something has gone horribly awry - we can't score this answer.",
				responseClass: ""
			}
		};

	var scoreAnsType = ["unknown", "incorrect", "correct"];

	var ansType = "unknown";
	if (typeof responseDetails.score === "number")
	{
		ansType = scoreAnsType[responseDetails.score + 1];
	}

	var responseHtml = "<i class='" + responseFormat[ansType].icon + "'></i> " +
				responseFormat[ansType].answerPrefix +
				(responseDetails.submission || "") +
				(responseFormat[ansType].answerSuffix || "") + " " +
				(responseDetails.response || "");

	// display the results of the submission in the given container
	container.append("div")
		.attr("class", ["alert", responseFormat.responseClass].join(" "))
		.html(responseHtml);
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
