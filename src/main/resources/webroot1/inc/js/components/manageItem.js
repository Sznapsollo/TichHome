app.component('manage-item', {
	props: ['id', 'header', 'icon', 'enabled', 'image'],
	template: `	
	<div class="powerswitch" v-bind:class="{'turnedOff': !enabled && id}">
		<i v-if="icon" class="{{icon}}"></i>
		<img v-if="image" class="switchIcon" v-bind:class="{'switchIconClickable':true}" v-on:click="openItemFormPanel()" v-bind:src="'graphics/icons/' + image" />
		<span v-if="id" class="switchHeader" v-bind:class="{'switchHeaderClickable':true}" v-on:click="openItemFormPanel()">{{header}}</span>
		<span v-if="!id" class="switchHeader" v-bind:class="{'switchHeaderClickable':true}" v-on:click="openItemFormPanel()">{{addNewItemLabel}}</span>
		<img v-if="id" class="switchCalendarIcon" v-on:click="openItemFormPanel()" v-bind:src="'graphics/' + settingIconName" />
	</div>
	`,
	setup(props, context) {

		const enabled = Vue.ref(false)
		const settingIconName = Vue.ref('')
		const addNewItemLabel = Vue.ref('itemAddNewItem')
		const openItemFormPanel = function() {
			console.log(props.item.id)

			// var itemFormNode = document.createElement("item-form");
			// if(id) {
			// 	itemFormNode.setAttribute("id", id);
			// }
				
			// var itemFormScope = $scope.$new();
			// automation.LaunchItemModal($compile(itemFormNode)(itemFormScope));
		}

		Vue.onMounted(function() {
			window.mittEmitter.on('translationsReceived', function(item){
				addNewItemLabel.value = automation.translate('itemAddNewItem')
			}); 
			
			settingIconName.value = automation.getIcon('setting','');
			enabled.value = automation.boolValue(props.enabled)
		})

		return {
			addNewItemLabel,
			enabled,
			openItemFormPanel,
			settingIconName
		}
	}
})