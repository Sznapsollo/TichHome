const ManageItemList = { 
		template: `
		<div class="pageContent">
			<h4>{{itemsLabel}}</h4>
			<i v-if="dataLoading" class="fa fa-spinner fa-4x fa-spin"></i>
			<div v-if="!data.folderSecured" class="alert alert-warning" role="alert">
				{{warning}}
			</div>
			<manage-item></manage-item>
			<div v-for="(item, index) in data.items">
				<manage-item v-bind:id="item.id" v-bind:header="item.header" v-bind:icon="item.icon" v-bind:image="item.image" v-bind:enabled="item.enabled" ></manage-item>
			</div>
			<p>&nbsp;</p>
		</div>`,
		setup(props, context) {

			// watch somehow category changes
			// deafult route
	
			console.log('manageItemsList created')
			const data = Vue.ref({})
			const itemsLabel = Vue.ref('items') 
			const dataLoading = Vue.ref(true)
			const warning = Vue.ref('')
			
			const translateAll = function() {
				itemsLabel.value = automation.translate('items');
				warning.value = automation.globalHTACCESSWarning();
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
			})

			Vue.onMounted(function() {
				window.mittEmitter.on('translationsReceived', function(item){
					translateAll()
				}); 
			})

			translateAll();
	
			return {
				itemsLabel,
				dataLoading,
				data,
				warning
			}
		},
	}
