(function(){
  'use strict';

	app.controller('TabController', function TabController($scope, $rootScope, $route, itemsDataService) {
		
		$scope.automation = automation;
		$scope.dataLoading = true;
		$scope.boolValue = function(value) {return automation.BoolValue(value)};
		
		init();
		
		function init()
		{
			checkItemsData();
			
			$rootScope.$on('refreshTab', function() {
				checkItemsData();
			});
		};
		
		function checkItemsData() {
			$scope.dataLoading = true;
			itemsDataService.checkItemsData($route.current.$$route.fromValue).then(
				function(dataResponse) {
					$scope.dataLoading = false;
					$scope.data = dataResponse.data.data;
					if(dataResponse.data.data.itemsDictionary) {
						automation.SetItemsDictionary(dataResponse.data.data.itemsDictionary);
					}
				},
				function(response) {
					var error = 'Items data read error';
					$scope.dataLoading = false;
					console.log(error);
					console.log(response);
				});
		};
	});
	
})();