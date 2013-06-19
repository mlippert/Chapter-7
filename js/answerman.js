/* **************************************************************************
 * $Workfile:: answerman.js                                             $
 * **********************************************************************//**
 *
 * @fileoverview Client-side answer evaluation engine object.
 *
 * The AnswerMan engine does simple comparisons between its record of an item's
 * data and whether the submitted answer is correct or not.
 *
 * Created on		June 17, 2013
 * @author			Leslie Bondaryk
 *
 * Copyright (c) 2013 Pearson, All rights reserved.
 *
 * **************************************************************************/

/* -----------------------------------------------
Student feedback and scoring functions
-------------------------------------------------*/

function answerMan(config, studAnswer) {
	
	//set the sequence node. This will be used to look up the activity
	this.sequenceNode = config.sequenceNode;
	var activity = this.sequenceNode;
	
	//lookup the student answer in the answer key in fakeactivitydb.js, which
	//got loaded with the page
	var activity = (this.sequenceNode in activities) ? activities[this.sequenceNode] : "activity not found";
	var solution = (studAnswer in activity) ? activity[studAnswer] : "solution key not found";

	// stash the answer score and response in some variables
	//var ansKey = ('score' in solution) ? activity.score : "answer key not found";
	var ansKey = solution.score;
	var feedback = solution.response;
	
	//initialized the scored return object.  We'll need to know it's container
	//(specifies where to write the responses), the value of the student submission,
	//the score, and any specialized response.
	var scored = {
				container: config.container,
				submission: solution.content,
				response: feedback
				};
				
	//then we switch on the lookup right or wrong response.  This is hard-coded
	//to student answer now, but needs to come from the lookup vs. the student 
	//response.  Should be either 0 for wrong, 1 for right, or anything else for
	//partial credit for the fallthrough case.
				
	switch(ansKey)
		{
		case 1:
  		// You got it right, hooray!
			scored.score = 1;
 			break;
			
		case 0:
		// You're always WRONG!  HAHAHHAHAHA.
			scored.score = 0;
  			break;
			
		case undefined: 
			scored.score = -1;
			break;
			
		//fallthrough case for partially correct answers.
		default:
  			scored.score = 0.5;
			scored.response =" Sorta kinda.";
  			break;
		}
	
	//the return the scored object to the submitting page.
	return scored;
	
} //end answerMan function
