var eventManager = {
    subscribe : function(topic, callback) {
        amplify.subscribe(topic, callback);
    },

    publish : function(topic, data) {
        amplify.publish(topic, data);
    },
    
    unsubscribe : function(topic, callback) {
        amplify.unsubscribe(topic, callback);
    }
}

var activityManager = {
    
    getEventManager : function() {
        // We create the eventManager in init.  We use this as a getter method if need be.
        return this.eventManager_;
    },

    collectContent : function(contentURL) {
        // THIS IS FAKE.
        // This is where you'd call to the PAF hub (or whatever content repo) using the contentURL
        // and return the JSON content (perhaps the enriched sequenceNode).
        // Instead we'll just fake up some json.

        // grab the id out of the contentURL so we can populate a couple of fake examples
        var regPattern = /\d*$/;
        var myid = regPattern.exec(contentURL);

        // This is the config that drives the interactives.  It's then buried in the enriched sequence node
        // below in "targetActivity"
        var interactiveConfig;
        if (myid[0] == '8883774665') {
            interactiveConfig = {
                "master" : {
                    "widget" : {
                        "type" : "button",
                        "targetid" : "button1",
                        "id" : "button1",
                        "text" : "Submit #1"
                    }
                }
            };
        } else if (myid[0] == '12345') {
            interactiveConfig = {
                "master" : {
                    "widget" : {
                        "type" : "button",
                        "targetid" : "button2",
                        "id" : "button2",
                        "text" : "Submit #2"
                    }
                }
            };
        }

        // let's pretend we have an "enriched" SequenceNode (step 5 in Assignment Startup sequence
        // diagram: https://hub.pearson.com/confluence/display/AF/Assignment+Startup)
        var sequenceNodeRich = {
          "@context" : "http://purl.org/pearson/paf/v1/ctx/core/SequenceNodeRich",
          "@type" : "SequenceNode",
          "@id" : 'http://paf.hub.pearson.com/resources/sequences/' + myid[0] + '/nodes/1',
          "nodeIndex" : 1,
          "startTime" : Date(),
          "parentSequence" : {
            "@id" : 'http://paf.hub.pearson.com/resources/sequences/' + myid[0],
            "user" : "http://idm.api.pearson.com/resources/identities/29d32894735b731",
            "learningContext" : {
              "@type" : "CourseSection",
              "@id" : "urn:udson:pearson.com/sms/prod:course/jsmith38271"
            },
            "overallActivity" : 'http://repo.paf.pearson.com/resources/activity/' + myid[0]
          },
          "targetBinding" : {
            "@id" : "http://repo.paf.pearson.com/resources/activity/4924948879517615/bindings/2",
            "boundActivity" : "http://repo.paf.pearson.com/resources/activity/59239547267",
            "activityFormat" : "application/vnd.pearson.qti.v2.asi.xml",
            "activityTitle" : "We'll put this in the targetActivity, thank you.",
            "credit" : "ForCredit",
            "scoreConstraints" : {
              "normalMaximum" : 10
            }
          },
          "targetActivity" : interactiveConfig,
          "aggregateResult" : {
            "templateVariables" : []
          },
          "player" : {
            "frameFrontend" : "http://example.com/myplayer",
            "widgetStartPage" : "http://hub.paf.pearson.com/widgets/83282736384572/index.html"
          },
          "resultCollection" : 'http://hub.paf.pearson.com/resources/sequences/' + myid[0] + '/nodes/1/results'
        };

        return sequenceNodeRich;
    },

    loadNodes : function(callback) {
        // get the nodeList
        var nodeList = this.scanNodes();
        
        // loop over it
        var nodeLength = nodeList.length;
        var counter = 0;
        while (counter < nodeLength) {
            // grab the 'about' url containing the content identifier (PAF).
            var contentURL = nodeList[counter].attributes.about.nodeValue;

            // pull down the content from PAF, local content repo, or wherever
            var content = this.collectContent(contentURL);

            // throw content back to the originating callback
            callback(content);

            counter++;
        }
    },

    scanNodes : function() {
        // scan through looking for 'Activity' divs.  We can change this to <object> tags if that's what
        // inkling prefers.
        // we're assuming we have jquery
        var nodes = $("div[typeof='Activity']");
        return nodes;
    },

    initActivityManager : function() {
        // 'that = this' avoids having to reference whatever we named our object (aM.) within this factory
        var that = this;
        // create the eventManager
        this.eventManager_ = Object.create(eventManager);
        window.onload = function() {
            that.loadNodes(function(content){
                // initialize master player widget for each chunk of content
                var interactive = interactives();
                interactive.init(content, eventManager);
            });
        };
    }
}