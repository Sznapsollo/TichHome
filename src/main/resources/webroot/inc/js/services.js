var itemsDataService = {
	checkItemsData: function(category, callback, failCallback) {
		sendActionsData({type: 'checkItemsData', category: category }, callback, failCallback)
	},
	checkItemData: function(id, callback, failCallback) {
		sendActionsData({type: 'checkItemsData', category: 'manageitems', id: id}, callback, failCallback)
	},
	setItemData: function(item, callback, failCallback) {
		sendActionsData({type: 'setItemData', item: item}, callback, failCallback)
	}
}

var itemAvailabilityService = {
	checkItemAvailability: function(id, callback, failCallback) {
		sendActionsData({type: 'checkItemAvailability', id: id}, callback, failCallback)
	}
}

var delayDataService = {
	checkData: function(id, callback, failCallback) {
		sendActionsData({type: 'checkDelayData', id: id}, callback, failCallback)
	},
	checkRegularActionData: function(id, callback, failCallback) {
		sendActionsData({type: 'checkRegularActionData', id: id}, callback, failCallback)
	},
	setRegularActionData: function(id, timeLine, callback, failCallback) {
		sendActionsData({type: 'setRegularActionData', id: id, timeLine: timeLine}, callback, failCallback)
	}
}

var sensorsDataService = {
	setSensorTimelineData: function(id, timeLine, callback, failCallback) {
		sendActionsData({type: 'setSensorActionData', id: id, timeLine: timeLine}, callback, failCallback)
	},
	setSensorDevicesData: function(id, onDevices, callback, failCallback) {
		sendActionsData({type: 'setSensorActionData', id: id, onDevices: onDevices}, callback, failCallback)
	},
	checkSensorAlarmData: function(id, callback, failCallback) {
		sendActionsData({type: 'checkSensorAlarmData', id: id}, callback, failCallback)
	},
	setSensorAlarmTimelineData: function(id, timeLine, callback, failCallback) {
		sendActionsData({type: 'setSensorAlarmData', id: id, timeLine: timeLine}, callback, failCallback)
	},
	setSensorAlarmDevicesData: function(id, onDevices, callback, failCallback) {
		sendActionsData({type: 'setSensorAlarmData', id: id, onDevices: onDevices}, callback, failCallback)
	}
}

var logsDataService = {
	checkLogsListData: function(logsType, startIndex, itemsPerPage, callback, failCallback) {
		sendActionsData({type: 'checkLogsListData', category: logsType, startIndex: startIndex, itemsPerPage: itemsPerPage}, callback, failCallback)
	},
	checkLogsFileData: function(logType, fileName, callback, failCallback) {
		sendActionsData({type: 'checkLogsFileData', category: logType, fileName: fileName}, callback, failCallback)
	}
}

var sendActionsData = function(data, callback, failCallback) {
	axios.post(('/' + appName + '/actions'), data)
		.then(function (response) {
			if(response && response.data && response.data.message == 'ok') {
				callback(response.data)
			} else {
				var errMsgParts = ['sendActionsData ']
				if(response && response.data) {
					errMsgParts.push(response.data.message ? response.data.message : response.data.data)
				}
				failCallback(errMsgParts.join(' '))
				showErrorMessage(errMsgParts.join(' '))
			}
		})
		.catch(function (error) {
			failCallback(error)
		}
	);
}