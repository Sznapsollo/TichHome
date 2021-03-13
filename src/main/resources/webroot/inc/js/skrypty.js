$(document).ready(function()
{
	initializeEventBus()
	$("#bodyContainer").on("click", ".toggleOutlet", function(event)
	{
		toggleOutlet($(this));
	});
});

var globalPingTimer
var globalEventBus
var callbacksCenter = {}
function registerCallbackInCenter(name, callbackID, callback) {
    if(!name ||!callback) {
        return
    }

    if(!callbacksCenter[name]) {
        callbacksCenter[name] = {}
    }
    
    callbacksCenter[name][callbackID] = callback
}
function runCallbacksFromCenter(name, data) {
    if(!name || !callbacksCenter[name]) {
        return
    }

    for(var callbackID in callbacksCenter[name]) {
        try {
            callbacksCenter[name][callbackID](data)
        } catch(e) {
            console.warn('runCallbacksFromCenter warning')
        }
    }
}

/*
    0: production
    1: thresholds
    2: details
    3: all
*/
var loggingLevel = 3
function localLogger(message, level) {
	if(level == null) {
		level = 3
	}
	if(!loggingLevel) {
        loggingLevel = 0
    }
    if(loggingLevel >= level) {
        var now = new Date();
        console.log(now.toISOString().substring(0, 19), message)
    }
}

function directMessageToProperAlert(responseData) {
    var message = responseData.message ? responseData.message : responseData.data
    switch(responseData.status) {
        case 'OK':
            showSuccessMessage(message)
            break;
        case 'FAIL':
			showDangerMessage(message)
            break;
        default:
            let msg = 'Unrecognized status('+responseData.status+'): ' + message
			showDangerMessage(msg)
            break;
	}
	return true
}

var successAlertHandle
function showSuccessMessage(message, delay) {
    if(!delay) { delay = 3000 }
    $("#success-alert .alert-text").html(message);
    if(successAlertHandle) {
        clearTimeout(successAlertHandle)
        successAlertHandle = null
    }
    $("#success-alert").show("slow")
    successAlertHandle = setTimeout(function() {
        $("#success-alert").hide('slow')
    }, delay)
}

var dangerAlertHandle
function showDangerMessage(message, delay) {
    if(!delay) { delay = 10000 }
    $("#danger-alert .alert-text").html(message);
    if(dangerAlertHandle) {
        clearTimeout(dangerAlertHandle)
        dangerAlertHandle = null
    }
    $("#danger-alert").show("slow")
    dangerAlertHandle = setTimeout(function() {
        $("#danger-alert").hide('slow')
    }, delay)
}

function initializeEventBus() {
    var eventBusAddress = '/eventbus'
    globalEventBus = new EventBus(eventBusAddress);
    globalEventBus.onopen = function () {
        localLogger("Connection to event bus open", 1)

		var data = {type: 'preinitializeEventBusConnection'}
        data = JSON.stringify(data)

        $.post( "actions", data,  function( responseData ) {
            registerAKHomeAutomationOnEventBus(responseData.data)        
        }, "json");      
    }
    globalEventBus.onclose = function() {
        localLogger("Connection to event bus closed. Attempting to reconect", 1)
        setTimeout(function () {
            if (globalEventBus.state !== EventBus.OPEN) {
                initializeEventBus()
            }
        }, 10000);
    }
}

function registerAKHomeAutomationOnEventBus(initializeKey) {
    globalEventBus.send('register/', {registeringPage: true, initializeKey: initializeKey, sessionId: getSessionId()},
        function (responseObj, message) {
            if(message && message.body && message.body.status && message.body.handle) {
                localLogger("Event bus registration: " + message.body.status, 1)
				var webSocketSessionHandle = message.body.handle;
                
                globalEventBus.registerHandler('applicationMessage/' + message.body.handle, function (error, message) {
                    if(error) {
                        localLogger(error, 2)
                    }
                    if(message) {
                        localLogger(message, 2)
                        if(message.body && message.body.data && message.body.type) {
							if(message.body.type == 'callbackCenter') {
								runCallbacksFromCenter(message.body.centerName, message.body.data)
							} else if(message.body.type == 'applicationWarningTextMessage') {
                                directMessageToProperAlert(message.body)
                                // if(message.body.reload == true) {
                                //     $("#confirm-reload").modal('show')
                                // }
                            } else if(message.body.type == 'refreshPage') {
								window.location.reload()
							} else {
                                // addWarning(message.body.warningType, message.body.data)
                            }
                        }
                    }
                });

                // initialize pinger
                if(globalPingTimer) {
                    clearInterval(globalPingTimer)
                    globalPingTimer = null
                }
                globalPingTimer = setInterval(function() {
                    globalEventBus.send('register/', {updatingSession: true, sessionId: webSocketSessionHandle})
                }, 60000)

                if(message && message.body) {
					localLogger('registered')
					// localLogger(message.body)
                    if(message.body.pageflags) {
						automation.SetPageFlags(message.body.pageflags);
					}
					if(message.body.translations) {
						automation.SetTranslations(message.body.translations);
						runCallbacksFromCenter('translationsReceived', null)
                    }
                }
            } else {
                localLogger('Unsuccessful event bus registration', 0);
            }
        }
    )
}

var toggleOutlet = function(buttonClicked) {
    performAction(buttonClicked.attr('data-outletId'), buttonClicked.attr('data-outletStatus'), buttonClicked.attr('data-outletDelayed'));
};

var performAction = function(id, status, delayed) {
	var data = {
		type: 'toggle',
		outletId: id,
		outletStatus: status,
		outletDelayed: delayed,
		outletSource: 'Web',
	}
    data = JSON.stringify(data)
	$.post('actions', data,
		function(data, status) {
			console.log(status);
		});

	$('#deleteModal').modal('hide'); 
}

var itemsPerPageDefault = 48;
var itemsPerPageStorageName = 'itemsPerPage';

function SetLocalStorage(name, value) {
    localStorage[name] = value;
}

function GetLocalStorage(index, defaultValue) {
	if(localStorage[index] == undefined)
		return defaultValue;
	else {
	
		if(typeof defaultValue === 'boolean')
			return JSON.parse(localStorage[index]);
		else
			return localStorage[index];
	}
}


function getSessionId() {
    var cookieName = 'akHomeAutmationSession'
    var currentSession = getCookie(cookieName)

    if(!currentSession || currentSession == '') {
        currentSession = makeid(15)
        setCookie(cookieName, currentSession, 1)
    }

    return currentSession
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

var automation = function() {
	
	_pageFlags = null;
	_translations = null;
	_itemsDictionary = null;
	
	function CheckRequiredFields(requiredFields, collection) {
		if(!collection)
			return false;
		
		for(var requiredIndex = 0; requiredIndex < requiredFields.length; requiredIndex++) {
			for(var devicesIndex = 0; devicesIndex < collection.length; devicesIndex++) {
				if(!collection[devicesIndex][requiredFields[requiredIndex]])
					return false;
			}
		}
		return true;
	}
	
	function GetIcon(name, value) {
		
		switch(name) {
			case "calendar":
				return "calendar_icon"+value+".jpg";
				break;
			case "action":
				return "actions_icon"+value+".jpg";
				break;
			case "alarmTimeUnits":
				return "alarm_time_units_icon"+value+".jpg";
				break;
			case "alarmDevices":
				return "alarm_devices_icon"+value+".jpg";
				break;
			case "setting":
				return "settings_icon"+value+".jpg";
				break;
			default:
				return "";
		} 
		
		return "";
	}
	
	function ProcessPageFlags() {
		if(_pageFlags.serverDateTime) {
			var currentTime = new Date()
			var localTimeStamp = Math.floor(Date.now());
			var localTime = currentTime.getHours() + "" + currentTime.getMinutes();
			var timestampDiff = _pageFlags.serverDateTime.serverTimeStamp - localTimeStamp
			if(timestampDiff > 10 * 60 * 1000) {
				_pageFlags.timeDifferenceDetected = true;
				console.log('Difference in time: ' + timestampDiff);
				console.log('Server time:' + _pageFlags.serverDateTime.serverCompareTime);
				console.log('Local time:' + localTime);
			}
		}
	}
	
	function Translate(code) {
		if(_translations == null)
			return "";
			
		for(var translation of _translations) {
			if(translation.code == code)
				return translation.description;
		}
		
		return code;
	}
	
	function FillAndLaunchLogModal(title, logBody) {
		$('#modalDialog .modal-body-p').html(logBody);
		$('#modalDialog .modal-title').html(title);
		$('#modalDialog').modal('show');
	}
	
	function LaunchItemModal(body) {
		$('#modalItemDialog .modal-content').html(body);
		$('#modalItemDialog').modal('show');
	}
	
	function CloseItemModal() {
		$('#modalItemDialog .modal-content').html('');
		$('#modalItemDialog').modal('toggle');
	}
	
	function Confirm(id, status, delay, message) {
	
		var buttonLabel = status == 'on' ? Translate('enable') : Translate('disable');
		
		$('#deleteModal .confirmTrigger').attr('data-outletId',id);
        $('#deleteModal .confirmTrigger').attr('data-outletStatus',status);
		$('#deleteModal .confirmTrigger').attr('data-outletDelayed',delay);
		$('#deleteModal .confirmTrigger').html(buttonLabel);
        $('#deleteModal .confirmMessage').html(message);

	    $('#deleteModal').modal('show');
	}
	
	function OmitKeys(obj, keys)
	{
		var dup = {};
		for (var key in obj) {
			if (keys.indexOf(key) == -1) {
				dup[key] = obj[key];
			}
		}
		return dup;
	}
	
	return {
		BoolValue: function(value) {
			if (typeof value === "boolean"){
				return value;
			}
			else
				return (value && (value.toLowerCase() == 'true'));
		},
		CheckRequiredFields: function(requiredFields, collection) {
			return CheckRequiredFields(requiredFields, collection);
		},
		GetIcon: function(name, value) {
			return GetIcon(name, value);
		},
		Confirm: function(id, status, delay, message) {
			return Confirm(id, status, delay, message);
		},
		FillAndLaunchLogModal: function(title, logBody) {
			return FillAndLaunchLogModal(title, logBody);
		},
		LaunchItemModal: function(body) {
			return LaunchItemModal(body);
		},
		CloseItemModal: function() {
			return CloseItemModal();
		},
		GetDevicesDictionary: function() {
			return _itemsDictionary;
		},
		GlobalHTACCESSWarning: function() { 
			return Translate("htaccessWarning");
		},
		OmitKeys: function(obj, keys) {
			return OmitKeys(obj, keys);
		},
		Translate: function(code) {
			return Translate(code);
		},
		SetTranslations: function(translations) {
			_translations = translations;
		},
		SetPageFlags: function(pageFlags) {
			_pageFlags = pageFlags;
			ProcessPageFlags();
		},
		PageFlag: function(code) {
			if(!_pageFlags)
				return null;
			else
				return _pageFlags[code];
		},
		SetItemsDictionary: function(itemsDictionary) {
			_itemsDictionary = itemsDictionary;
		}
	}
}();

