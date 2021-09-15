const SwitchItemsTab = { 
	props: ['category'],
	template: `
		<i v-if="dataLoading" class="fa fa-spinner fa-4x fa-spin"></i>
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

		// watch somehow category changes
		// deafult route

		console.log('itemsList created')
		const switchItems = Vue.ref([])
		const route = VueRouter.useRoute()
		const tabCategory = Vue.ref('') 
		const dataLoading = Vue.ref(true)
		
		let refreshDebounce
		const prepareListData = function() {
			clearTimeout(refreshDebounce)
			refreshDebounce = setTimeout(function() {
				dataLoading.value = true
				prepareListDataInner()
			}, 200)
		}

		const prepareListDataInner = function() {
			console.log('prepare list data')
			switchItems.value = []

			tabCategory.value = route.params.category ? route.params.category : 'general'
			itemsDataService.checkItemsData(tabCategory.value,
			function(data) {
				if(data) {
					dataLoading.value = false
					if(data.message == 'ok') {
						switchItems.value = data.data.items;
						console.log('got data', switchItems.value)
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

		Vue.watch(
		() => route.params.category,
		async newCategory => {
			prepareListData()
		})

		// Vue.watch(category, (categoryValue, oldCategoryValue) => {
		// 	prepareListData()
		// })

		return {
			dataLoading,
			switchItems,
			tabCategory,
		}
	},
}
