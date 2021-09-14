$(document).ready(function()
{
	initializeEventBus()
	$("#confirmModal").on("click", ".toggleOutlet", function(event)
	{
		toggleOutlet($(this));
	});
});

var toggleOutlet = function(buttonClicked) {
	var outletId = buttonClicked.attr('data-outletId')
	var outletStatus = buttonClicked.attr('data-outletStatus')
	var delayed = buttonClicked.attr('data-outletDelayed')
    performAction(outletId, outletStatus, delayed);
};

var performAction = function(id, status, delayed) {
	var data = {
		type: 'toggle',
		outletId: id,
		outletStatus: status,
		outletDelayed: delayed,
		outletSource: 'Web',
	}

	$('#confirmModal').modal('hide'); 

	return new Promise(function(resolve, reject) {
		axios.post(('/' + appName + '/actions'), data)
			.then(function (response) {
				if(response && response.data && response.data.message == 'ok') {
					resolve(response.data)
				} else {
					var errMsgParts = ['performAction ', id, status]
					if(response && response.data) {
						errMsgParts.push(response.data.message ? response.data.message : response.data.data)
					}
					reject(errMsgParts.join(' '))
					showErrorMessage(errMsgParts.join(' '))
				}
			})
			.catch(function (error) {
				showErrorMessage(error)
			}
		);
	});
}

function showErrorMessage(message) {
	message = message ? message : ''
	if(typeof message === 'object') {
		if(message.message) {
			message = message.message
		} else if(message.data) {
			message = message.data
		}
	}

	directMessageToProperAlert({status: 'FAIL', message: message})
}

var appName = 'tichhome'
var globalEventBus
var globalPingTimer
function initializeEventBus() {
    var eventBusAddress = '/eventbus'
    globalEventBus = new EventBus(eventBusAddress);
    globalEventBus.onopen = function () {
        localLogger("Connection to event bus open", 1)

		var data = {type: 'preinitializeEventBusConnection'}
        data = JSON.stringify(data)

		$.ajax({
			url:"actions",
			type:"POST",
			data:data,
			contentType:"application/json; charset=utf-8",
			dataType:"json",
			success: function(responseData){
				registerAKHomeAutomationOnEventBus(responseData.data)        
			}
		  })

		// sends XMLHttpRequest
        // $.post( "actions", {json_string:JSON.stringify(data)},  function( responseData ) {
        //     registerAKHomeAutomationOnEventBus(responseData.data)        
        // }, "json");      
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
                                window.mittEmitter.emit(message.body.centerName, message.body.data)
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
						automation.setPageFlags(message.body.pageflags);
						window.mittEmitter.emit('pageFlagsSet', null)
					}
					if(message.body.translations) {
						automation.setTranslations(message.body.translations);
                        window.mittEmitter.emit('translationsReceived', null)
                    }
                }
            } else {
                localLogger('Unsuccessful event bus registration', 0);
            }
        }
    )
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
	
	function checkRequiredFields(requiredFields, collection) {
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
	
	function getIcon(name, value) {
		
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
	
	function processPageFlags() {
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
	
	function translate(code) {
		if(_translations == null) {
			return code;
		}
			
		for(var translation of _translations) {
			if(translation.code == code) {
				return translation.description;
			}
		}
		
		return code;
	}
	
	function launchItemModal(body) {
		$('#modalItemDialog .modal-content').html(body);
		$('#modalItemDialog').modal('show');
	}
	
	function closeItemModal() {
		$('#modalItemDialog .modal-content').html('');
		$('#modalItemDialog').modal('toggle');
	}
	
	function confirm(id, status, delay, message) {
	
		var buttonLabel = status == 'on' ? translate('enable') : translate('disable');
		
		$('#confirmModal .confirmTrigger').attr('data-outletId',id);
        $('#confirmModal .confirmTrigger').attr('data-outletStatus',status);
		$('#confirmModal .confirmTrigger').attr('data-outletDelayed',delay);
		$('#confirmModal .confirmTrigger').html(buttonLabel);
        $('#confirmModal .confirmMessage').html(message);

	    $('#confirmModal').modal('show');
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
		boolValue: function(value) {
			if (typeof value === "boolean"){
				return value;
			}
			else
				return (value && (value.toLowerCase() == 'true'));
		},
		checkRequiredFields: function(requiredFields, collection) {
			return checkRequiredFields(requiredFields, collection);
		},
		closeItemModal: function() {
			return closeItemModal();
		},
		confirm: function(id, status, delay, message) {
			return confirm(id, status, delay, message);
		},
		fillAndLaunchLogModal: function(title, logBody) {
			return fillAndLaunchLogModal(title, logBody);
		},
		getIcon: function(name, value) {
			return getIcon(name, value);
		},
		getDevicesDictionary: function() {
			return _itemsDictionary;
		},
		globalHTACCESSWarning: function() { 
			return translate("htaccessWarning");
		},
		launchItemModal: function(body) {
			return launchItemModal(body);
		},
		omitKeys: function(obj, keys) {
			return omitKeys(obj, keys);
		},
		pageFlag: function(code) {
			if(!_pageFlags)
				return null;
			else
				return _pageFlags[code];
		},
		setItemsDictionary: function(itemsDictionary) {
			_itemsDictionary = itemsDictionary;
		},
		setPageFlags: function(pageFlags) {
			_pageFlags = pageFlags;
			processPageFlags();
		},
		setTranslations: function(translations) {
			_translations = translations;
		},
		translate: function(code) {
			return translate(code);
		}
	}
}();