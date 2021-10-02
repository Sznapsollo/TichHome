var app = Vue.createApp({
	setup() {

		const itemsPerPage = Vue.ref(100);
		const refresher = Vue.ref(true);
		const versionTichHome = Vue.ref('');
		const showCheckLog = Vue.ref(false);
		const showCheckExcLog = Vue.ref(false)

		const translate = function(code) {
			return automation.translate(code);
		}

		const translateAll = function() {
			refresher.value = !refresher.value;
		}

		Vue.onMounted(function() {
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
			window.mittEmitter.on('pageFlagsSet', function(item){
				showCheckLog.value = automation.pageFlag('timeDifferenceDetected')
				showCheckExcLog.value = automation.pageFlag('todayexcexists')
			}); 
			versionTichHome.value = '202110022110';
			itemsPerPage.value = GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault);
		})

		translateAll()
		showCheckLog.value = automation.pageFlag('timeDifferenceDetected')

		return {
			itemsPerPage,
			refresher,
			showCheckLog,
			showCheckExcLog,
			translate,
			versionTichHome
		}
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