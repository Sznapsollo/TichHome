const ManageItemList = { 
		template: `
		<div class="pageContent">
			<div v-if="dataLoading" style="position: absolute; width: 100%; text-align: center;"><i class="fa fa-spinner fa-2x fa-spin"></i></div>
			<h4>{{translate('items')}}</h4>
			<div v-if="!data.folderSecured" class="alert alert-warning" role="alert">
				{{warning}}
			</div>
			<input class="form-control" name="itemsFilter" type="text" v-model="itemsFilter" placeholder="Search items" />
			<manage-item></manage-item>
			<div v-for="(item, index) in filteredItems">
				<manage-item v-bind:id="item.id" v-bind:header="item.header" v-bind:icon="item.icon" v-bind:image="item.image" v-bind:enabled="item.enabled" ></manage-item>
			</div>
			<p>&nbsp;</p>
			<div style="display: none">{{refresher}}</div>
		</div>`,
		setup(props, context) {

			// watch somehow category changes
			// deafult route
	
			console.log('manageItemsList created')
			const data = Vue.ref({})
			const items = Vue.ref([])
			const filteredItems = Vue.ref([])
			const dataLoading = Vue.ref(true)
			const warning = Vue.ref('')
			const refresher = Vue.ref(true)
			const itemsFilter = Vue.ref('')
			
			const translate = function(code) {
				return automation.translate(code)
			}
	
			const translateAll = function() {
				refresher.value = !refresher.value
				warning.value = automation.globalHTACCESSWarning();
			}

			const performFilter = function() {
			
				filteredItems.value = items.value.slice().filter(function(filteredItem) {
					let isOk = true
					if(isOk && itemsFilter.value && itemsFilter.value.length) {
						if(filteredItem.header.toLowerCase().indexOf(itemsFilter.value.toLowerCase()) >= 0) {
							isOk = true
						} else {
							isOk = false
						}
					}
					return isOk
				})
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
				console.log('prepare manageitems list data')

				itemsDataService.checkItemsData('manageitems',
				function(data) {
					if(data) {
						dataLoading.value = false
						if(data.message == 'ok') {
							data.value = data.data
							items.value = data.data.items
							performFilter()
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

			Vue.watch([itemsFilter], (currentValue, oldValue) => {
				performFilter()
			})

			translateAll();
	
			return {
				dataLoading,
				data,
				filteredItems,
				items,
				itemsFilter,
				refresher,
				translate,
				warning
			}
		},
	}
