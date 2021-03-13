(function(){
  'use strict';

	app.controller('RFButtonsController', function RFButtonsController($scope, $timeout, delayDataService, machineAvailabilityService) {

		$scope.minSliderValue = -1;
		$scope.maxSliderValue = 360;
		$scope.questions = {};
		$scope.boolValue = function(value) {return automation.BoolValue(value)};
		$scope.clickButton = clickButton;
		$scope.getCssClass = getCssClass;
		$scope.toggleSliderOptions = toggleSliderOptions;
		$scope.toggleRegularOptions = toggleRegularOptions;
		$scope.changeTimer = changeTimer;
		$scope.changeValue = changeValue;
		$scope.saveRegularSettings = saveRegularSettings;
		$scope.calendarIconName = automation.GetIcon('calendar','');
		$scope.translate = translate;
		$scope.checkAvailability = checkAvailability;
		
		$scope.machineAvailability = null;
		$scope.showTimer = false;
		$scope.showRegular = false;
		$scope.disableDate = null;
		$scope.timeEnd = "";
		$scope.regularActionData = {};
		$scope.isActive = isActive;
		$scope.busy = false;
		
		var timerCheckData;
		var timerCountDownDelay;
		
		init();
		
		$scope.$on('$destroy', function(){
			$timeout.cancel(timerCheckData);
			$timeout.cancel(timerCountDownDelay);
		});
		
		function clickButton(params) {
		
			$scope.busy = true;
			
			var mode = params.outletId;
			var delayed = params.delay !== undefined ? params.delay : 0;
			
			if($scope.questions[params.status]) {
				automation.Confirm(mode, params.status, delayed, $scope.questions[params.status])
			}
			else
				performAction(mode, params.status, delayed);
			
			$timeout(function(){
				$scope.showTimer = false;
				$scope.showRegular = false;
				$scope.delayValue = $scope.initialDelayValue;
				$timeout(function(){unblockButtons();}, 1000);
			}, 2000);
		}
		
		function unblockButtons()
		{
			$scope.busy = false;
		}
		
		function toggleRegularOptions() {
			$scope.showRegular = !$scope.showRegular;
		}
		
		function toggleSliderOptions() {
		
			if(!$scope.delay)
				return;
				
			$scope.showTimer = !$scope.showTimer;
			
			if($scope.showTimer) {
				changeCalculatedTime();
			}
		}
		
		function getCssClass(value, defaultValue) {
			if(value != undefined && value.length > 0)
				return value;
			else
				return defaultValue;
		}
		
		function changeTimer(value) {
			$scope.delayValue = parseInt(value,10);
			
			changeCalculatedTime();
		}
		
		function changeValue(value) {
 
			if((value < 0 && $scope.delayValue <= $scope.minSliderValue) || (value > 0 && $scope.delayValue >= $scope.maxSliderValue))
				return; 

			$scope.delayValue += value;

			changeCalculatedTime();
		}
		
		function changeCalculatedTime() {
			var whatDelay = $scope.delayValue ? $scope.delayValue : $scope.initialDelayValue;
			if(whatDelay < 0)
				$scope.calculatedTime =  "---"
			else
				$scope.calculatedTime =  new Date((new Date()).getTime() + whatDelay*60000);
		}
		
		function init()
		{
			// console.log('init', $scope.outletId)
			$scope.questions.on = $scope.questionOn;
			$scope.questions.off = $scope.questionOff;
		
			checkRegularActionData();
		
			if(!$scope.delay)
				return;
		
			setDefaultDelay(parseInt($scope.delay));
			checkData();
			
			// checkInterval(timerCheckData, checkData, 120);
			checkInterval(timerCountDownDelay, countDownDelay, 1);

			registerCallbackInCenter('checkData', 'item_' + $scope.outletId, function (data) {
				// console.log('checkData received for ', 'item_' + $scope.outletId, data)
				if(data == 'all' || $scope.outletId == data) {
					// console.log('checkData doing it!!')
					checkData()
				}
			})
			registerCallbackInCenter('checkRegularData', 'item_' + $scope.outletId, function (data) {
				// console.log('checkRegularData received for ', 'item_' + $scope.outletId, data)
				if($scope.outletId == data) {
					// console.log('checkRegularData doing it!!')
					checkRegularActionData()
				}
			})
		};
		
		function checkInterval(timer, fn, timeInterval) {
			timer = $timeout(fn, 1000 * timeInterval);
			
			return timer.then(function(data) {
				checkInterval(timer, fn, timeInterval)
			});
		}
		

		function checkDataInner() {
			// console.log('checkDataInner', $scope.outletId)
			delayDataService.checkData($scope.outletId).then(
				function(dataResponse) {
					$scope.data = dataResponse.data.data;
					// console.log('checkDataInner resp', $scope.outletId, $scope.data)
					if($scope.data.time !== undefined && $scope.data.delay !== undefined) {
						$scope.disableDate = new Date((parseInt($scope.data.time)+parseInt($scope.data.delay))*1000);
					}
					else {
						$scope.disableDate = null;
					}
				},
				function(response) {
					var error = 'Delay data read error for ' + $scope.outletId;
					console.log(error);
					console.log(response);
					$scope.disableDate = null;
				}
			);
		}

		var checkDataPromise
		function checkData() {
			//console.log("Checking delay data for" + $scope.outletId );
			if(!checkDataPromise) {
				checkDataInner()
				checkDataPromise = $timeout(function() {
					checkDataPromise = null
				}, 100)
			} else {
				if(checkDataPromise) {
					$timeout.cancel(checkDataPromise)
					checkDataPromise = null
				}
	
				checkDataPromise = $timeout(function() {
					checkDataPromise = null
					checkDataInner()
				}, 100)
			}
		}
		
		function checkRegularActionData() {
			delayDataService.checkRegularActionData($scope.outletId).then(
				function(dataResponse) {
					$scope.regularActionData = dataResponse.data.data;
					
					var existsSetting = false;
					
					if(!($scope.regularActionData.length == 0)) {
						if($scope.regularActionData.timeUnits !== undefined && $scope.regularActionData.timeUnits.length > 0) {
						
							for(var i=0; i < $scope.regularActionData.timeUnits.length; i++) {
								if($scope.regularActionData.timeUnits[i].daysOfWeek.length > 0) {
									existsSetting = true;
									break;
								}
							}
						}
						if(existsSetting)
							$scope.calendarIconName = automation.GetIcon('calendar', '_enabled');
						else
							$scope.calendarIconName = automation.GetIcon('calendar', '');
					}
					else
						$scope.calendarIconName = automation.GetIcon('calendar', '');
				},
				function(response) {
					var error = 'Regular action data read error for ' + $scope.outletId;
					console.log(error);
					console.log(response);
				});
		}
		
		function countDownDelay() {
		
			if($scope.disableDate == null) {
				$scope.timeEnd = "";
				return;
			}
			
			var date = new Date();
			
			// hack
			var timeDiff = parseInt($scope.disableDate.getTime()) - parseInt(date.getTime());
			
			if(timeDiff < 0) {
				console.log('negative');
				$scope.disableDate = null
				$scope.timeEnd = "";
				
				$timeout(function(){
					checkData();
				}, 2000);
				
				return;
			}
			
			date.setHours(date.getHours() + 1);
			var timeDiff = parseInt($scope.disableDate.getTime()) - parseInt(date.getTime());
			
			$scope.timeEnd = timeDiff;
				
		}
		
		function setDefaultDelay(value) {
			$scope.initialDelayValue = value;
			$scope.delayValue = value;
		}
		
		function saveRegularSettings(msg) {
			$scope.showRegular = false;
			
			delayDataService.setRegularActionData($scope.outletId, msg).then(
				function(dataResponse) {
					checkRegularActionData();
				},
				function(response) {
					var error = 'Regular action data set error for ' + $scope.outletId;
					console.log(error);
					console.log(response);
				}
			);
		}
		
		function translate(code) {
			return automation.Translate(code);
		}
		
		function isActive(obj, value) {
			if($scope.data !== undefined && $scope.data.enabled !== undefined)
				return $scope.data.enabled === value;
			return true;
		}
		
		function checkAvailability() {
			$scope.busy = true;
			machineAvailabilityService.checkMachineAvailability($scope.outletId).then(
				function(dataResponse) {
					$scope.machineAvailability = dataResponse.data.data.available;
					$scope.busy = false;
				},
				function(response) {
					var error = 'Availability data read error for ' + $scope.outletId;
					console.log(error);
					console.log(response);
					$scope.busy = false;
				});
		}

	});
	
})();
