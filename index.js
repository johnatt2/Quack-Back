console.log("started");
const https = require("https");
const list_is_empty = "#list_is_empty#";

/**
 * List API end-point.
 */
const api_url = 'api.amazonalexa.com';
//const api_port = '443';

const slotName = "Name";
const APP_ID = "amzn1.ask.skill.94b7f13c-ee49-49c8-8d4f-581ca89f0e13";

var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback) {
    console.log("in console log handler");
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

/**
 * Called when the session starts.
 */
const newSessionRequestHandler = function() {
    console.log("Starting newSessionRequestHandler");
    if (this.event.request.type === "IntentRequest") {
        this.emit(this.event.request.intent.name);
    }
    else {
        this.emit(LAUNCH_REQUEST);
    }
    console.log("Ending newSessionRequestHandler");
};

/**
 * Handler for the launch request event.
 */
const launchRequestHandler = function() {
    console.log("Starting launchRequestHandler");
    if(!this.event.session.user.permissions) {
        speechOutput = "Alexa List permissions are missing. You can grant permissions within the Alexa app.";
        var permissions = ["read::alexa:household:list"];
        this.emit(":tellWithPermissionCard", speechOutput, permissions);
    }
    else {
        var speechOutput = "Welcome. Who should I quack back at?";
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(":responseReady");
    }
    console.log("Ending launchRequestHandler");
};

/**
 * This is the handler for the SessionEnded event.
 */
const sessionEndedRequestHandler = function() {
    console.log("Starting sessionEndedRequestHandler");
    var speechOutput = "I'm paddling away now. Splish. Splash. See you in a flash.";
    this.response.speak(speechOutput);
    this.emit(":responseReady");
    console.log("Ending sessionEndedRequestHandler");
};

/**
 * This is the handler for the Unhandled event.
 */
const unhandledRequestHandler = function() {
    console.log("Starting unhandledRequestHandler");
    var speechOutput = "This request is not supported.";
    this.response.speak(speechOutput).listen(speechOutput);
    this.emit(":responseReady");
    console.log("Ending unhandledRequestHandler");
};

/**
 * This is the handler for the Amazon help built in intent.
 */
const amazonHelpHandler = function() {
    console.log("Starting amazonHelpHandler");
    if(!this.event.session.user.permissions) {
        speechOutput = "Alexa List permissions are missing. You can grant permissions within the Alexa app.";
        var permissions = ["read::alexa:household:list"];
        this.emit(":tellWithPermissionCard", speechOutput, permissions);
    }
    else {
        var speechOutput = "I can quack back at one of the names on your custom lists";
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(":responseReady");
    }
    console.log("Ending amazonHelpHandler");
};

/**
 * This is the handler for the Amazon cancel built-in intent.
 */
const amazonCancelHandler = function() {
    console.log("Starting amazonCancelHandler");
    var speechOutput = "I'm paddling away now. Splish. Splash. See you in a flash.";
    this.response.speak(speechOutput);
    this.emit(":responseReady");
    console.log("Ending amazonCancelHandler");
};

/**
 * This is the handler for the Amazon stop built in intent.
 */
const amazonStopHandler = function() {
    console.log("Starting amazonStopHandler");
    var speechOutput = "I'm paddling away now. Splish. Splash. See you in a flash.";
    this.response.speak(speechOutput);
    this.emit(":responseReady");
    console.log("Ending amazonStopHandler");
};

/**
 * This is the handler for the getName intent.
 */
const getNameHandler = function() {
    var speechOutput = "";
    var that = this;
    console.log("Starting get name handler");
    console.log("this.event = " + JSON.stringify(this.event));
    

    var intent = this.event.request.intent.name;

    var slotValue = isSlotValid(this.event.request, slotName); //slot value or false
    console.log(slotValue);
    if  (slotValue) {
        getName(slotValue, this.event.context, this.event.session, function(itemName) {
            if(!itemName) {
                speechOutput = "Alexa List permissions are missing. You can grant permissions within the Alexa app.";
                var permissions = ["read::alexa:household:list"];
                that.emit(":tellWithPermissionCard", speechOutput, permissions);
            } else if(itemName === list_is_empty) {
                speechOutput = "There's nothing to quack back at for " + slotValue + ".";
                that.response.speak(speechOutput);
                that.emit(':responseReady');
            } else {
                console.log("getting item Name" + itemName);
                speechOutput = itemName;
                var repromptSpeech = "If you would like me to continue quacking back say another name or say stop to stop";
                that.response.speak(speechOutput);
                that.response.listen(repromptSpeech);
                that.emit(":responseReady");
            }
        });
    } else {
        //no valid slot
        speechOutput="Sorry I couldn't quite hear a name.";
        this.response.speak(speechOutput);
        this.emit(':responseReady');
    }
    console.log("Ending get name handler");
};

// --------------- Helper List API functions -----------------------

/**
 * List API to retrieve the List of Lists : Lists Metadata.
 */
const getListsMetadata = function(context, session, callback) {
    if(!session.user.permissions) {
        console.log("permissions are not defined meta data");
        callback(null);
        return;
    }
    console.log("Starting the get list metadata call.");
    var options = {
        host: api_url,
        //port: api_port,
        path: '/v2/householdlists/',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + context.System.apiAccessToken,
            'Content-Type': 'json'
        }
    }

    var req = https.request(options, (res) => {
        console.log("getListsMetadata")
        console.log('STATUS: ', res.statusCode);
        console.log('HEADERS: ', JSON.stringify(res.headers));

        if(res.statusCode === 403) {
            console.log("permissions are not granted");
            callback(null);
            return;
        }

        var body = [];
        res.on('data', function(chunk) {
            body.push(chunk);
        }).on('end', function() {
            body = Buffer.concat(body).toString();
            callback(body);
        });

        res.on('error', (e) => {
            console.log(`Problem with request: ${e.message}`);
        });
    }).end();
};

/**
 * List API to retrieve the customer to-do list.
 */
const getToDoList = function(intent, context, session, callback) {
    if(!session.user.permissions) {
        console.log("permissions are not defined get todo");
        callback(null);
        return;
    }
    console.log("Starting get todo list call.");

    getListsMetadata(context, session, function(returnValue) {
        if(!returnValue) {
            console.log("permissions are not defined metadata2");
            callback(null);
            return;
        }
        var obj = JSON.parse(returnValue);
        var todo_path = "";
        console.log(obj.lists[0].statusMap);
        for (var i=2; i < obj.lists.length; i++) {
            console.log(obj.lists[i].name);
    	    if (obj.lists[i].name.toLowerCase() === intent.toLowerCase()) {
    	        todo_path = obj.lists[i].statusMap[0].href;
    	    }
	    }
	    
	    if(!todo_path) {
	        callback("{items:[]}");
	    }
        var options = {
           host: api_url,
           //port: api_port,
           path: todo_path,
           method: 'GET',
           headers: {
               'Authorization': 'Bearer ' + context.System.apiAccessToken,
               'Content-Type': 'application/json'
           }
        }

        var req = https.request(options, (res) => {
            console.log("getlist");
            console.log(api_url);
            console.log(todo_path);
           console.log('STATUS: ', res.statusCode);
           console.log('HEADERS: ', JSON.stringify(res.headers));

           if(res.statusCode === 403) {
             console.log("permissions are not granted");
             callback(null);
             return;
           }

           var body = [];
           res.on('data', function(chunk) {
               body.push(chunk);
            }).on('end', function() {
               body = Buffer.concat(body).toString();
               console.log(JSON.parse(body));
               callback(JSON.parse(body));
               
            });

            res.on('error', (e) => {
               console.log(`Problem with request: ${e.message}`);
            });
         }).end();
    });
};

/**
 * Helper function to retrieve the top to-do item.
 */
const getName = function(intent, context, session, callback) {
    getToDoList(intent, context, session, function(returnValue) {
       if(!returnValue) {
           console.log("returned nothing");
           callback(null);
       }
       else if(!returnValue.items || returnValue.items.length === 0) {
           console.log("empty" + returnValue.items);
           callback(list_is_empty);
       }
       else {
           console.log("random value: " + returnValue.items[Math.floor(Math.random()*returnValue.items.length)].value);
           callback(returnValue.items[Math.floor(Math.random()*returnValue.items.length)].value);
       }
    });
};

/**
 * Helper function to check slot validity
 */
function isSlotValid(request, slotName){
        var slot = request.intent.slots[slotName];
        //console.log("request = "+JSON.stringify(request)); //uncomment if you want to see the request
        var slotValue;

        //if we have a slot, get the text and store it into speechOutput
        if (slot && slot.value) {
            //we have a value in the slot
            slotValue = slot.value.toLowerCase();
            return slotValue;
        } else {
            //we didn't get a value in the slot.
            return false;
        }
}

// Define events and intents
const NEW_SESSION = "NewSession";
const LAUNCH_REQUEST = "LaunchRequest";
const SESSION_ENDED = "SessionEndedRequest";
const UNHANDLED = "Unhandled";

const NAME_INTENT = "GetNameIntent";
const AMAZON_HELP = "AMAZON.HelpIntent";
const AMAZON_CANCEL = "AMAZON.CancelIntent";
const AMAZON_STOP = "AMAZON.StopIntent";

const handlers = {};

// Event handlers
handlers[NEW_SESSION] = newSessionRequestHandler;
handlers[LAUNCH_REQUEST] = launchRequestHandler;
handlers[SESSION_ENDED] = sessionEndedRequestHandler;
handlers[UNHANDLED] = unhandledRequestHandler;

// Intent handlers
handlers[NAME_INTENT] = getNameHandler;

handlers[AMAZON_CANCEL] = amazonCancelHandler;
handlers[AMAZON_STOP] = amazonStopHandler;
handlers[AMAZON_HELP] = amazonHelpHandler;
