

var app = Vue.createApp({
	// data() {
	// 	return {
	// 		model: model,
	// 		docUrl: docUrl,
	// 		viewerUrl: viewerUrl
	// 	}
	// } ,
	setup() {

		const homeLabel = Vue.ref('home');
		const advancedLabel = Vue.ref('advanced');
		const sensorsLabel = Vue.ref('sensors');
		const adminLabel = Vue.ref('admin');
		const itemsLabel = Vue.ref('items');
		const carefulLabel = Vue.ref('careful');
		const disableLabel = Vue.ref('disable');
		const closeLabel = Vue.ref('close');
		const logsActionsLabel = Vue.ref('logs_actions');
		const logsSensorsLabel = Vue.ref('logs_sensors');
		const logsExceptionsLabel = Vue.ref('logs_exceptions');
		const showCheckLog = Vue.ref(false)
		const itemsPerPage = Vue.ref(100)

		const translateAll = function() {
			homeLabel.value = automation.translate('homepage');
			advancedLabel.value = automation.translate('advanced');
			sensorsLabel.value = automation.translate('sensors');
			adminLabel.value = automation.translate('admin');
			itemsLabel.value = automation.translate('items');
			carefulLabel.value = automation.translate('careful');
			disableLabel.value = automation.translate('disable');
			closeLabel.value = automation.translate('close');
			logsActionsLabel.value = automation.translate('logs_actions');
			logsSensorsLabel.value = automation.translate('logs_sensors');
			logsExceptionsLabel.value = automation.translate('logs_exceptions');
		}

		// const isCompactView = Vue.ref(false)
		// const selectedTab = Vue.ref('detailsTab')
		// const tabs = Vue.ref([
		// 	{id: 'detailsTab', title: 'Szczegóły'}
		// ])

		// const selectTab = function(i) {
		// 	selectedTab.value = i
		// }

		// const canShowSignaturePage = function() {
		// 	return model.task != null && model.signatures != null && model.documentURL != null
		// }

		// const noPageMessage = Vue.computed(() => {
		// 	if(model.message != null) {
		// 		return model.message
		// 	}
		// 	return messages['response.taskNotFound']
		// })

		// const checkWindowSize = function() {
		// 	if(window.innerWidth < 630) {
		// 		if(isCompactView.value == false) {
		// 			tabs.value.splice(1, 0, {id: 'compactPdf', title: 'Dokument'});
		// 		}
		// 		isCompactView.value = true
		// 	} else {
		// 		if(isCompactView.value == true) {
		// 			tabs.value = tabs.value.filter(function(tabItem) { return tabItem.id != 'compactPdf'})
		// 			if(selectedTab.value == 'compactPdf') {
		// 				selectedTab.value = tabs.value[0].id
		// 			}
		// 		}
		// 		isCompactView.value = false
		// 	}
		// }

		// const handleResize = function(event) {
		// 	console.log('app handleResize')
		// 	checkWindowSize()
		// 	window.mittEmitter.emit('windowResized', event)
		// }

		// Vue.onBeforeUnmount(function() {
		// 	window.removeEventListener('resize', handleResize);
		// })

		// window.addEventListener('resize', handleResize);
		// checkWindowSize()
		// selectTab('detailsTab')


		

		// // function(dataResponse) {
		// // 	$scope.dataLoading = false;
		// // 	$scope.data = dataResponse.data.data;
		// // 	if(dataResponse.data.data.itemsDictionary) {
		// // 		automation.SetItemsDictionary(dataResponse.data.data.itemsDictionary);
		// // 	}
		// // },
		// // function(response) {
		// // 	var error = 'Items data read error';
		// // 	$scope.dataLoading = false;
		// // 	console.log(error);
		// // 	console.log(response);
		// // });
		Vue.onMounted(function() {
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
			window.mittEmitter.on('pageFlagsSet', function(item){
				showCheckLog.value = automation.pageFlag('timeDifferenceDetected')
			}); 
			itemsPerPage.value = GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault);
		})

		translateAll()
		showCheckLog.value = automation.pageFlag('timeDifferenceDetected')

		return {
			homeLabel,
			advancedLabel,
			sensorsLabel,
			adminLabel,
			itemsLabel,
			carefulLabel,
			disableLabel,
			closeLabel,
			logsActionsLabel,
			logsSensorsLabel,
			logsExceptionsLabel,
			showCheckLog,
			itemsPerPage
		}
	},
	created: function() {
		
	}, 
	mounted: function() {
		
	}
})

app.mixin({
	methods: {
		// isEmbeddedMode: function() {
		// 	return embeddedMode == true
		// }
	}
});

// NJ example use {{ $filters.currencyUSD(accountBalance) }}
app.config.globalProperties.$filters = {
	formatDate(value, format) {
		if(!value) {
			return value
		}
		if(typeof value === 'string') {
			return value
		}
		try {
			return moment(value).format(format)
		} catch(e) {
			console.warn('format date')
		}
		return value
	},
	formatNumber(value) {
		return value
	}
};