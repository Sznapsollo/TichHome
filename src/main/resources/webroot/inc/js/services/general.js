(function(){
  'use strict';
	app.service('machineAvailabilityService', function($http) {
		this.checkMachineAvailability = function(id) {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'checkMachineAvailability', id: id}
			});
		};
	});
	app.service('delayDataService', function($http) {
		this.checkData = function(id) {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'checkDelayData', id: id}
			});
		};
		this.checkRegularActionData = function(id) {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'checkRegularActionData', id: id}
			});
		};
		this.setRegularActionData = function(id, timeLine) {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'setRegularActionData', id: id, timeLine: timeLine}
			});
		};
	});
	
	app.service('itemsDataService', function($http) {
		this.checkItemsData = function(category) {
			var servicesHub = 'actions';
			return $http({
				url: servicesHub,
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'checkItemsData', category: category}
			});
		};
		this.checkItemData = function(id) {
			var servicesHub = 'actions';
			return $http({
				url: servicesHub,
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'checkItemsData', category: 'manageitems', id: id}
			});
		};
		this.setItemData = function(item) {
			var servicesHub = 'actions';
			return $http({
				url: servicesHub,
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'setItemData', item: item}
			});
		};
	});
	
	app.service('sensorsDataService', function($http) {
		this.setSensorTimelineData = function(id, timeLine) {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'setSensorActionData', id: id, timeLine: timeLine}
			});
		};
		this.setSensorDevicesData = function(id, onDevices) {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'setSensorActionData', id: id, onDevices: onDevices}
			});
		};
		this.checkSensorAlarmData = function(id) {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'checkSensorAlarmData', id: id}
			});
		};
		this.setSensorAlarmTimelineData = function(id, timeLine) {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'setSensorAlarmData', id: id, timeLine: timeLine}
			});
		};
		this.setSensorAlarmDevicesData = function(id, onDevices) {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'setSensorAlarmData', id: id, onDevices: onDevices}
			});
		};
	});
	
	app.service('logsDataService', function($http, $route) {
		this.checkLogsListData = function() {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'checkLogsListData', category: $route.current.params.logsType, startIndex: $route.current.params.startIndex, itemsPerPage: $route.current.params.itemsPerPage}
			});
		};
		this.checkLogsFileData = function(fileName) {
			return $http({
				url: 'actions',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				data: {type: 'checkLogsFileData', category: $route.current.params.logsType, fileName: fileName}
			});
		};
	});
})();
