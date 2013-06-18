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
	
	
	//initialized the scored return object.  We'll need to know it's container
	//(specifies where to write the responses), the value of the student submission,
	//the score, and any specialized response.
	var scored = {
				container: config.container,
				submission: Number(studAnswer),
				score: 0,
				response: "default response."
				};
				
	//then we switch on the lookup right or wrong response.  This is hard-coded
	//to student answer now, but needs to come from the lookup vs. the student 
	//response.  Should be either 0 for wrong, 1 for right, or anything else for
	//partial credit for the fallthrough case.
				
	switch(Number(studAnswer))
		{
		case 1:
  			// You got it right, hooray!
			scored.score = 1;
			scored.response = "No special extra response for right answers.";
  			break;
			
		case 0:
		// You're always WRONG!  HAHAHHAHAHA.
  			scored.response = "This is an extra hard question.";
  			break;
			
		default:
  			scored.score = 0.5;
			scored.response ="sorta kinda.";
  			break;
		}
	
	//the return the scored object to the submitting page.
	return scored;
	
} //end answerMan function
