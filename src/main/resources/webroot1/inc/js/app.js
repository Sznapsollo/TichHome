

var app = Vue.createApp({
	// data() {
	// 	return {
	// 		model: model,
	// 		docUrl: docUrl,
	// 		viewerUrl: viewerUrl
	// 	}
	// } ,
	setup() {

		const showCheckLog = Vue.ref(false)
		const itemsPerPage = Vue.ref(100)
		const refresher = Vue.ref(true)

		const translate = function(code) {
			return automation.translate(code)
		}

		const translateAll = function() {
			refresher.value = !refresher.value
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
			showCheckLog,
			itemsPerPage,
			refresher,
			translate
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