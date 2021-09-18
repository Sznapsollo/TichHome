app.component('manage-item', {
	props: ['id', 'header', 'icon', 'enabled', 'image'],
	template: `	
	<div class="powerswitch" v-bind:class="{'turnedOff': !enabled && id}">
		<i v-if="icon" :class="icon"></i>
		<img v-if="image" class="switchIcon" v-bind:class="{'switchIconClickable':true}" v-on:click="openItemFormModal()" v-bind:src="'graphics/icons/' + image" />
		<span v-if="id" class="switchHeader" v-bind:class="{'switchHeaderClickable':true}" v-on:click="openItemFormModal()">{{header}}</span>
		<span v-if="!id" class="switchHeader" v-bind:class="{'switchHeaderClickable':true}" v-on:click="openItemFormModal()">{{translate('itemAddNewItem')}}</span>
		<img v-if="id" class="switchCalendarIcon" v-on:click="openItemFormModal()" v-bind:src="'graphics/' + settingIconName" />
		<div style="display: none">{{refresher}}</div>
	</div>
	`,
	setup(props, context) {

		const enabled = Vue.ref(false)
		const settingIconName = Vue.ref('')
		const refresher = Vue.ref(true)
		
		const openItemFormModal = function() {
			window.mittEmitter.emit('showItemModal', {id: props.id});
			$('#modalItemDialog').modal('show');
		}

		const translate = function(code) {
			return automation.translate(code)
		}

		const translateAll = function() {
			refresher.value = !refresher.value
		}

		Vue.onMounted(function() {
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll();
			}); 
			
			translateAll()
			settingIconName.value = automation.getIcon('setting','');
			enabled.value = automation.boolValue(props.enabled)
		})

		return {
			enabled,
			openItemFormModal,
			settingIconName,
			refresher,
			translate
		}
	}
})