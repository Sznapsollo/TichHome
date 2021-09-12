const LogList = { 
	template: `<div class="pageContent">
		<h4>{{pageTitle}}</h4>
		
		<div style="display: inline-block; padding: 10px 5px" v-for="(item, index) in items">
			<a v-bind:class="{'font-weight-bold' : todayFileName == item.name}" href="" v-on:click="getFileContent(item.name)">{{item.name}}</a>
		</div>
		
		<i v-if="dataLoading" class="fa fa-spinner fa-4x fa-spin"></i>

		<div v-if="items.length == 0" class="noResults">There are no logs of this type.</div>

		<div>&nbsp;</div>
		
		<div v-if="items.length > 0">
			<pager page="logsList/{{logType}}"></pager>
		</div>
		
	</div>`,
	setup(props, context) {
		const itemscount = Vue.ref(0);
		const dataLoading = Vue.ref(true);
		const pageTitle = Vue.ref('');
		const url = Vue.ref("");
		const todayFileName = Vue.ref(null);
		const route = VueRouter.useRoute()
		const items = Vue.ref([])
		const logType = Vue.ref(null)
		
		const translateAll = function() {
			pageTitle.value = automation.translate('logs_' + logType.value);
		}

		const getFileContent = function(fileName) {
			var detailLogNode = document.createElement("log-details");
			detailLogNode.setAttribute("log-name", fileName);
			var detailLogScope = $scope.$new();
			automation.FillAndLaunchLogModal(fileName, $compile(detailLogNode)(detailLogScope));
		}

		const checkItemsData = function() {
			logType.value = route.params.logType
			dataLoading.value = true;
			items.value = []

			translateAll()

			var date = new Date();
			todayFileName.value = logType.value + "_" + moment(date).format("yyyyMMDD") + ".log";

			// debugger
			logsDataService.checkLogsListData(logType.value, route.params.startIndex, route.params.itemsPerPage,
				function(dataResponse) {
					if(dataResponse.message == 'ok') {
						if(dataResponse.data) {
							dataLoading.value = false;
							items.value = dataResponse.data.items || []
							// allCount = dataResponse.data.allCount || 0
							// $rootScope.$broadcast('calculateImagesPaging', $scope.allCount);
						} else {
							showErrorMessage('Logs data receive error for ' + route.params.logsType)			
						}
					} else {
						showErrorMessage(dataResponse);
					}
				},
				function() {
					var error = 'Logs data error for ' + route.params.logsType;
					showErrorMessage(error)	
				}
			)
		};

		Vue.onMounted(function() {
			checkItemsData()
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
		})

		Vue.watch(
		() => [route.params.logType, route.params.startIndex, route.params.itemsPerPage],
		async (newArgs) => {
			checkItemsData()
		})

		return {
			checkItemsData,
			getFileContent,
			items,
			dataLoading,
			itemscount,
			pageTitle,
			url,
			todayFileName
		}
	}
}
