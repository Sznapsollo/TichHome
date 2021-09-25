const SwitchItemsTab = { 
	props: ['category'],
	template: `
		<div v-if="dataLoading" style="position: absolute; width: 100%; text-align: center;"><i class="fa fa-spinner fa-2x fa-spin"></i></div>
		<div class="switchItemsList">
			<div class="switchItems">
				<switch-item 
				v-bind:item="item" 
				v-bind:index="index" 
				v-bind:key="index" 
				v-for="(item, index) in switchItems"
				></switch-item>
			</div>
		</div>`,
	setup(props, context) {

		// console.log('itemsList created')
		const switchItems = Vue.ref([])
		const route = VueRouter.useRoute()
		const tabCategory = Vue.ref('') 
		const dataLoading = Vue.ref(true)
		
		let refreshDebounce
		const prepareListData = function(clearItems) {
			clearItems = clearItems != null ? clearItems == true : true
			clearTimeout(refreshDebounce)
			refreshDebounce = setTimeout(function() {
				dataLoading.value = true
				prepareListDataInner(clearItems)
			}, 200)
		}

		const prepareListDataInner = function(clearItems) {
			// console.log('prepare list data')
			if(clearItems) {
				switchItems.value = []
			}

			tabCategory.value = route.params.category ? route.params.category : 'general'
			itemsDataService.checkItemsData(tabCategory.value,
			function(data) {
				if(data) {
					dataLoading.value = false
					if(data.message == 'ok') {
						switchItems.value = data.data.items;
						// console.log('got tab data', switchItems.value)
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
				prepareListData(false)
			});
		})

		Vue.watch(
		() => route.params.category,
		async newCategory => {
			prepareListData()
		})

		return {
			dataLoading,
			switchItems,
			tabCategory,
		}
	},
}
