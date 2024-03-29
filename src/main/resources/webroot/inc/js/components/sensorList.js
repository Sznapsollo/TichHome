const SensorList = { 
	template: `
	<div class="pageContent">
		<div v-if="dataLoading" style="position: absolute; width: 100%; text-align: center;"><i class="fa fa-spinner fa-2x fa-spin"></i></div>
		<h4>{{translate('sensors')}}</h4>
		<div v-for="(item, index) in items">
			<sensor-item v-bind:outletId="item.id" v-bind:header="item.header" v-bind:timeUnits="item.timeUnits" v-bind:onDevices="item.on" v-bind:customData="item.customData" ></sensor-item>
		</div>
		<p>&nbsp;</p>
		<div style="display: none">{{refresher}}</div>
	</div>`,
	setup(props, context) {

		console.log('sensorList created')
		const data = Vue.ref({})
		const items = Vue.ref([])
		const dataLoading = Vue.ref(true)
		const refresher = Vue.ref(true)
		
		const translate = function(code) {
			return automation.translate(code)
		}

		const translateAll = function() {
			refresher.value = !refresher.value
		}

		let refreshDebounce
		const prepareListData = function() {
			clearTimeout(refreshDebounce)
			refreshDebounce = setTimeout(function() {
				dataLoading.value = true
				prepareListDataInner()
			}, 200)
		}

		const prepareListDataInner = function() {
			console.log('prepare sensors list data')

			itemsDataService.checkItemsData('sensors',
			function(data) {
				if(data) {
					dataLoading.value = false
					if(data.message == 'ok') {
						data.value = data.data
						items.value = data.data.items
						if(data.data.itemsDictionary) {
							automation.setItemsDictionary(data.data.itemsDictionary);
						}
					} else {
						showErrorMessage(data)	
					}
				}
			}, 
			function() {
				showErrorMessage(defaultSystemErrorMessage)	
			})
		}

		Vue.onMounted(function() {
			prepareListData()
			window.mittEmitter.on('refreshTab', function(data){
				prepareListData()
			});
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
		})

		translateAll();

		return {
			dataLoading,
			data,
			items,
			refresher,
			translate
		}
	},
}
