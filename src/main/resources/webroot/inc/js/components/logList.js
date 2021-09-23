const LogList = { 
	template: `<div class="pageContent">
		<h4>{{pageTitle}}</h4>
		
		<div style="display: inline-block; padding: 10px 5px" v-for="(item, index) in items">
			<a style="cursor: pointer" class="fakeLink" v-bind:class="{'font-weight-bold' : todayFileName == item.name}" v-on:click="getFileContent(item.name)">{{item.name}}</a>
		</div>
		
		<i v-if="dataLoading" class="fa fa-spinner fa-2x fa-spin"></i>

		<div v-if="items.length == 0" class="noResults">There are no logs of this type.</div>

		<div>&nbsp;</div>
		
		<div v-if="items.length > 0">
			<pager v-bind:logType="logType" v-bind:startIndex="startIndex" v-bind:itemsPerPage="itemsPerPage" v-bind:allCount="allCount"></pager>
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
		const startIndex = Vue.ref(0)
		const itemsPerPage = Vue.ref(0)
		const allCount = Vue.ref(0)
		
		const translateAll = function() {
			pageTitle.value = automation.translate('logs_' + logType.value);
		}

		const getFileContent = function(fileName) {
			window.mittEmitter.emit('showLogs', {logType: logType.value, fileName: fileName});
			$('#modalLogDialog').modal('show');

			// $('#modalLogDialog .modal-title').html(fileName);  
			// Vue.createApp(LogDetails, {logType: logType.value, fileName: fileName}).mount('#modalLogDialog .modal-body-p');
			// $('#modalLogDialog').modal('show');
		}

		const checkItemsData = function() {
			logType.value = route.params.logType
			dataLoading.value = true;
			items.value = []

			translateAll()

			var date = new Date();
			todayFileName.value = logType.value + "_" + moment(date).format("yyyyMMDD") + ".log";

			logsDataService.checkLogsListData(logType.value, route.params.startIndex, route.params.itemsPerPage,
				function(dataResponse) {
					if(dataResponse.message == 'ok') {
						if(dataResponse.data) {
							dataLoading.value = false;
							items.value = dataResponse.data.items || []
							allCount.value = dataResponse.data.allCount
							itemsPerPage.value = route.params.itemsPerPage
							startIndex.value = route.params.startIndex
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
			allCount,
			checkItemsData,
			getFileContent,
			items,
			dataLoading,
			itemscount,
			itemsPerPage,
			logType,
			pageTitle,
			startIndex,
			url,
			todayFileName
		}
	}
}
