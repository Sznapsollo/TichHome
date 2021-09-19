app.component('pager', {
	props: ['logType', 'startIndex', 'itemsPerPage', 'allCount'],
	template: `
	<div class="pagerArea">
		<div>
			<span class="choosePageArea">Items per page: 
				<select v-model="itemsPerPage" v-on:change="updateItemsPerPage()">
					<option v-for="item in itemsPerPageArray" v-bind:value="item">
						{{ item }}
					</option>
				</select>
			</span>		
			<span class="choosePageArea">Page: 
				<select v-model="selectedPage" v-on:change="updateSelectedPage()">
					<option v-for="page in pages" v-bind:value="page">
						{{ page + 1 }}
					</option>
				</select>
			</span>
		</div>
		<div class="pagerButtons">
			<router-link v-if="startIndex > 0" :to="{ name: 'logList', params: {logType: logType, startIndex: firstNode, itemsPerPage: itemsPerPage} }"><<</router-link>
			<router-link v-if="startIndex > 0" :to="{ name: 'logList', params: {logType: logType, startIndex: previousNode, itemsPerPage: itemsPerPage} }"><</router-link>
			<router-link v-if="startIndex + itemsPerPage < totalItems" :to="{ name: 'logList', params: {logType: logType, startIndex: nextNode, itemsPerPage: itemsPerPage} }">></router-link>
			<router-link v-if="startIndex + itemsPerPage < totalItems" :to="{ name: 'logList', params: {logType: logType, startIndex: lastNode, itemsPerPage: itemsPerPage} }">>></router-link>
		</div>
	</div>
	`,
	setup(props, context) {

		const pages = Vue.ref([]);
		const itemsPerPageArray = Vue.ref([12,24,48,96,192,384,768])
		const selectedPage = Vue.ref(0);
		const itemsPerPage = Vue.ref(0)
		const totalItems = Vue.ref(0)
		const startIndex = Vue.ref(0)
		const firstNode = Vue.ref(0)
		const lastNode = Vue.ref(0)
		const previousNode = Vue.ref(0)
		const nextNode = Vue.ref(0)
		const router = VueRouter.useRouter()

		const updateItemsPerPage = function() 
		{
			SetLocalStorage("itemsPerPage", itemsPerPage.value);
			router.push({ name: 'logList', params: {logType: props.logType, startIndex: 0, itemsPerPage: GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault)} })
		}

		const updateSelectedPage = function() 
		{
			router.push({ name: 'logList', params: {logType: props.logType, startIndex: selectedPage.value * itemsPerPage.value, itemsPerPage: GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault)} })
		}
	
		const init = function() {
			startIndex.value = parseInt(props.startIndex, 0);
			itemsPerPage.value = parseInt(props.itemsPerPage, 0);
			totalItems.value = parseInt(props.allCount, 0);
			
			if(itemsPerPage <= 0) {
				itemsPerPage = GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault);
			}
			
			selectedPage.value = startIndex.value / itemsPerPage.value;
			var pagesNumber = totalItems.value / itemsPerPage.value;
			for (var i = 0; i < pagesNumber; i++) { 
				pages.value.push(i);
			} 
 			
			if(startIndex.value > 0) {
				firstNode.value = 0;
				
				if(startIndex.value - itemsPerPage.value > 0)
					previousNode.value = startIndex.value - itemsPerPage.value;
				else 
					previousNode.value = 0;
			}	
			
			if(startIndex.value + itemsPerPage.value < totalItems.value) {
				nextNode.value = startIndex.value + itemsPerPage.value;
				
				lastNode.value = totalItems.value - itemsPerPage.value;
				var itemsRound = itemsPerPage.value + 2;
				
				for(var i=0; i<=itemsRound; i++)
				{
					var calculate = totalItems.value - itemsPerPage.value + i;
					if(calculate % itemsPerPage.value == 0)
					{
						lastNode.value = calculate;
						break;
					}
				}
			}
		}

		Vue.onMounted(function() {
			init()			
		})

		return {
			pages,
			firstNode,
			itemsPerPage,
			itemsPerPageArray,
			lastNode,
			nextNode,
			previousNode,
			selectedPage,
			startIndex,
			totalItems,
			updateItemsPerPage,
			updateSelectedPage,
		}
	}
})