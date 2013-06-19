/* **************************************************************************
 * $Workfile:: widget-selectonequestion.js                                  $
 * **********************************************************************//**
 *
 * @fileoverview Implementation of the SelectOneQuestion widget.
 *
 * The SelectOneQuestion widget displays a question and a set of possible
 * answers one of which must be selected and submitted to be scored.
 *
 * Created on		May 29, 2013
 * @author			Michael Jay Lippert
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
			content: "Because as the population increases, the absolute number of births increases even though the growth rate stays constant.",
			response: "Growth rate stays constant.",
			answerKey: "correct"
		},
		{
			content: "Because the growth rate increases as the population rises.",
			response: "Does the growth rate change with population size?",
			answerKey: "wrong1"
		},
		{
			content: "Because the total fertility rate increases with population.",
			response: "Does the fertility rate change with population size?",
			answerKey: "wrong2"
	
		},
		{
			content: "Because social behaviors change and people decide to have more children.",
			response: "This might happen but is it something is necessarily occurs?",
			answerKey: "wrong3"
		}
	];
	
	// RadioButton widget config
	var rbConfig =
		{
			id: "RG1",
			choices: Q1Choices,
			numberFormat: "latin-upper"
		};
	
	// RadioButtonQuestion widget config
	var rbqConfig =
	{
		id: "Q1",
		questionId: "SanVan003",
		question: "Why?",
		choices: Q1Choices,
		type: "randomized", //default, even if not specified
		widget: RadioGroup,
		widgetConfig: { numberFormat: "latin-upper" } // id and choices will be added by SelectOneQuestion
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
 * 									 they choose this answer.
 * @property {string}	answerKey	-This is the unique ID that will be returned
 * 									 to the scoring engine to identify that the
 * 									 user has chosen this answer.
 *
 * @todo: the content currently must be text (a string) however, we are likely
 * to want to make the content be any widget.
 */


/* **************************************************************************
 * SelectOneQuestion                                                    *//**
 *
 * The SelectOneQuestion widget displays a question and a set of possible
 * answers one of which must be selected and submitted to be scored.
 *
 * @constructor
 * @implements {IWidget}
 *
 * @param {Object}		config			-The settings to configure this SelectOneQuestion
 * @param {string|undefined}
 * 						config.id		-String to uniquely identify this SelectOneQuestion.
 * 										 if undefined a unique id will be assigned.
 * @param {string}		config.questionId
 * 										-Scoring engine Id of this question
 * @param {string}		config.question	-The question being posed to the user which should
 * 										 be answered by choosing one of the presented choices.
 * @param {Array.<Answer>}
 *						config.choices	-The list of choices (answers) to be presented by the SelectOneQuestion.
 * @param {string|undefined}
 *						config.numberFormat
 *										-The format for numbering the choices. default is "none"
 * @param {EventManager}
 * 						eventManager	-The event manager to use for publishing events
 * 										 and subscribing to them.
 *
 ****************************************************************************/
function SelectOneQuestion(config, eventManager)
{
	/**
	 * A unique id for this instance of the select one question widget
	 * @type {string}
	 */
	this.id = getIdFromConfigOrAuto(config, SelectOneQuestion);

	/**
	 * The scoring engine id of this question.
	 * @type {string}
	 */
	this.questionId = config.questionId;

	/**
	 * The question text.
	 * @type {string}
	 */
	this.question = config.question;

	/**
	 * The configuration options for the widget that will display the choices that
	 * answer this question.
	 * Add an id and adjust the choices according to the question type and add them
	 * to the config.
	 * @type {Object}
	 */
	var widgetConfig = config.widgetConfig;

	widgetConfig.id = this.id + "_wdgt";

	if (config.type === undefined || config.type === "randomized")
	{
		randomizeArray(config.choices);
	}

	widgetConfig.choices = config.choices;

	/**
	 * The widget used to present the choices that may be selected to answer
	 * this question.
	 * @type {IWidget}
	 */
	this.choiceWidget = new config.widget(widgetConfig, eventManager);

	// The configuration options for the submit button
	var submitBtnConfig =
	{
		id: this.id + "_sbmtBtn",
		text: "Select an answer above",
		enabled: false
	};

	/**
	 * The button widget which allows the answer to the question to be submitted
	 * for scoring.
	 * @type {IWidget}
	 */
	this.submitButton = new Button(submitBtnConfig, eventManager);

	/**
	 * List of responses that have been received for all submitted
	 * scoring requests.
	 * @type {Array.<Object>}
	 */
	this.responses = [];

	/**
	 * The event manager to use to publish (and subscribe to) events for this widget
	 * @type {EventManager}
	 */
	this.eventManager = eventManager;

	/**
	 * The event id published when a choice in this question is selected.
	 * @const
	 * @type {string}
	 */
	this.selectedEventId = this.choiceWidget.selectedEventId;

	/**
	 * The event details for this.selectedEventId events
	 * @typedef {Object} SelectedEventDetails
	 * @property {string} selectKey	-The answerKey associated with the selected answer.
	 */

	/**
	 * The event id published when the submit button is clicked.
	 * @const
	 * @type {string}
	 */
	this.submitScoreRequestEventId = this.id + "_submitAnswerRequest";

	/**
	 * The event details for this.submitScoreRequestEventId events
	 * @typedef {Object} SubmitAnswerRequest
	 * @property {SelecOneQuestion} question	-This question widget
	 * @property {string} 			questionId	-The id which identifies this question to the scoring engine.
	 * @property {string} 			answerKey	-The answerKey associated with the selected answer.
	 */

	// subscribe to events of our 'child' widgets
	var that = this;
	eventManager.subscribe(this.submitButton.pressedEventId, function () {that.handleSubmitRequested_();});
	eventManager.subscribe(this.choiceWidget.selectedEventId, function () {that.handleAnswerSelected_();});

	/**
	 * Information about the last drawn instance of this widget (from the draw method)
	 * @type {Object}
	 */
	this.lastdrawn =
		{
			container: null,
			widgetGroup: null,
		};
} // end of SelectOneQuestion constructor

/**
 * Prefix to use when generating ids for instances of SelectOneQuestion.
 * @const
 * @type {string}
 */
SelectOneQuestion.autoIdPrefix = "s1Q_auto_";

/* **************************************************************************
 * SelectOneQuestion.handleSubmitRequested_                             *//**
 *
 * Handle the pressed event from the submit button which means that we want
 * to fire the submit answer requested event.
 * @private
 *
 ****************************************************************************/
SelectOneQuestion.prototype.handleSubmitRequested_ = function()
{
	var that = this;
	var submitAnsDetails =
		{
			question: this,
			questionId: this.questionId,
			answerKey: this.choiceWidget.selectedItem().answerKey,
			responseCallback: function (responseDetails) { that.handleSubmitResponse_(responseDetails); }
		};

	this.eventManager.publish(this.submitScoreRequestEventId, submitAnsDetails);
};

/* **************************************************************************
 * SelectOneQuestion.handleAnswerSelected_                              *//**
 *
 * Handle the selected event from the choice widget which means that the
 * submit button can be enabled.
 * @private
 *
 ****************************************************************************/
SelectOneQuestion.prototype.handleAnswerSelected_ = function()
{
	this.submitButton.setText("Submit Answer");
	this.submitButton.setEnabled(true);
};

/* **************************************************************************
 * SelectOneQuestion.handleSubmitResponse_                              *//**
 *
 * Handle the response to submitting an answer.
 *
 * @param {Object}	responseDetails	-An object containing details about how
 * 									 the submitted answer was scored.
 * @private
 *
 ****************************************************************************/
SelectOneQuestion.prototype.handleSubmitResponse_ = function(responseDetails)
{
	this.responses.push(responseDetails);

	var responseDiv = this.lastdrawn.widgetGroup.select("div.responses");

	// For now just use the helper function to write the response.
	SubmitManager.appendResponseWithDefaultFormatting(responseDiv, responseDetails);
};

/* **************************************************************************
 * SelectOneQuestion.draw                                               *//**
 *
 * Draw this SelectOneQuestion in the given container.
 *
 * @param {!d3.selection}
 *					container	-The container html element to append the
 *								 question element tree to.
 *
 ****************************************************************************/
SelectOneQuestion.prototype.draw = function(container)
{
	this.lastdrawn.container = container;

	var that = this;
	
	// make a div to hold the select one question
	var widgetGroup = container.append("div")
		.attr("class", "widgetSelectOneQuestion")
		.attr("id", this.id);

	var question = widgetGroup.append("p")
		.attr("class", "question")
		.text(this.question);
	
	var choiceWidgetCntr = widgetGroup.append("div")
		.attr("class", "choices");

	this.choiceWidget.draw(choiceWidgetCntr);

	var submitButtonCntr = widgetGroup.append("div")
		.attr("class", "submit");

	this.submitButton.draw(submitButtonCntr);

	widgetGroup.append("div")
		.attr("class", "responses");

	this.lastdrawn.widgetGroup = widgetGroup;

}; // end of SelectOneQuestion.draw()

/* **************************************************************************
 * SelectOneQuestion.selectedItem                                       *//**
 *
 * Return the selected choice from the choice widget or null if nothing has been
 * selected.
 *
 * @return {Object} the choice which is currently selected or null.
 *
 ****************************************************************************/
SelectOneQuestion.prototype.selectedItem = function ()
{
	return this.choiceWidget.selectedItem();
};

/* **************************************************************************
 * SelectOneQuestion.selectItemAtIndex                                  *//**
 *
 * Select the choice in the choice widget at the given index. If the choice is
 * already selected, do nothing. The index is the displayed choice index and
 * not the config choice index (in other words if the choices have been randomized
 * then the configuration index is NOT the displayed index).
 *
 * @param {number}	index	-the 0-based index of the choice to mark as selected.
 *
 ****************************************************************************/
SelectOneQuestion.prototype.selectItemAtIndex = function (index)
{
	this.choiceWidget.selectItemAtIndex(index);
};

