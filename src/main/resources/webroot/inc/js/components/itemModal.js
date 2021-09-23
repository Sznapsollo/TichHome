app.component('item-modal', {
	template: `
	<div id="modalItemDialog" role="dialog" class="modal fade" data-bs-backdrop="static" data-bs-keyboard="false">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">{{header}}</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<p class="modal-body-p">
						<i v-if="dataLoading" class="fa fa-spinner fa-2x fa-spin"></i>
						<div class="form-group">
							<label for="itemName"><strong>{{translate('itemName')}}*</strong>:</label>
							<input v-on:change="checkChanges()" v-bind:disabled="id != null" v-bind:class="{'invalidInput':invalidName}" class="form-control" name="itemName" type="text" v-model="item.name" />
							<small id="itemNameHelp" class="form-text text-muted">{{translate('itemNameHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemCategory"><strong>{{translate('itemCategory')}}*</strong>:</label>
							<select v-on:change="checkChanges()" class="form-control" name="itemCategory" v-model="item.category">
								<option v-for="category in categoriesDictionary" v-bind:value="category.id">
									{{ category.description }}
								</option>
							</select>
							<small id="itemCategoryHelp" class="form-text text-muted">{{translate('itemCategoryHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemHeader"><strong>{{translate('itemHeader')}}*</strong>:</label>
							<input v-on:change="checkChanges()" class="form-control" name="itemHeader" type="text" v-model="item.header" />
							<small id="itemHeaderHelp" class="form-text text-muted">{{translate('itemHeaderHelp')}}</small>
							<p/>
						</div>
						<div class="form-check">
							<input v-on:change="checkChanges()" class="form-check-input" name="itemEnabled" type="checkbox" v-model="item.enabled" /><label class="form-check-label" for="itemEnabled">{{translate('itemEnabled')}}</label>
							<small id="itemEnabledHelp" class="form-text text-muted">{{translate('itemEnabledHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemHotWord">{{translate('itemHotWord')}}:</label>
							<input v-on:change="checkChanges()" class="form-control" name="itemHotWord" type="text" v-model="item.hotword" />
							<small id="itemHotWordHelp" class="form-text text-muted">{{translate('itemHotWordHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemImage">{{translate('itemImage')}}:</label>
							<input v-on:change="checkChanges()" class="form-control" name="itemImage" type="text" v-model="item.image" />
							<small id="itemImageHelp" class="form-text text-muted">{{translate('itemImageHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemIcon">{{translate('itemIcon')}}:</label>
							<input v-on:change="checkChanges()" class="form-control" name="itemIcon" type="text" v-model="item.icon" />
							<small id="itemIconHelp" class="form-text text-muted">{{translate('itemIconHelp')}}</small>
							<p/>
						</div>
						<div class="form-check">
							<input v-on:change="checkChanges()" class="form-check-input" name="itemRegularActions" type="checkbox" v-model="item.regularActions" />
							<label class="form-check-label" for="itemRegularActions">{{translate('itemRegularActions')}}:</label>
							<small id="itemRegularActionsHelp" class="form-text text-muted">{{translate('itemRegularActionsHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemSendOption">{{translate('itemSendOption')}}:</label>
							<select v-on:change="checkChanges()" v-bind:disabled="item.itemIDs_Local.length > 0" class="form-control" name="itemSendOption" v-model="item.sendOption" >
								<option v-for="sendOption in sendOptionDictionary" v-bind:value="sendOption.id">
									{{ sendOption.description }}
								</option>
							</select>
							<small id="itemSendOptionHelp" class="form-text text-muted">{{translate('itemSendOptionHelp')}}</small>
							<p/>
						</div>
						<div v-if="item.sendOption == 2" class="form-group">
							<label for="itemAddress">{{translate('itemAddress')}}:</label>
							<input v-on:change="checkChanges()" class="form-control" name="itemAddress" type="text" v-model="item.address" />
							<small id="itemAddressHelp" class="form-text text-muted">{{translate('itemAddressHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemCodeOn">{{translate('itemCodeOn')}}:</label>
							<ul class="list-group">
								<li class="list-group-item" v-for="(codeOn, index) in item.codeOn_Local">
									<div class="input-group">
										<input v-on:change="checkChanges()" class="form-control" type="text" v-model="codeOn.value">
										<span class="input-group-btn">
											<button type="button" style="float: left" class="btn btn-default" aria-label="Left Align" v-on:click="remove(item.codeOn_Local, index)">
												<i class="fa fa-trash"></i>
											</button>
										</span>
									</div>
								</li>
								<li class="list-group-item" v-on:click="addNewCollectionItem('codeOn_Local', null)">{{translate('itemAddNew')}}</li>
							</ul>
							<small id="itemCodeOnHelp" class="form-text text-muted">{{translate('itemCodeOnHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemCodeOff">{{translate('itemCodeOff')}}:</label>
							<input v-on:change="checkChanges()" class="form-control" name="itemCodeOff" type="text" v-model="item.codeOff" /><small id="itemCodeOffHelp" class="form-text text-muted">{{translate('itemCodeOffHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemDelay">{{translate('itemDelay')}}(s):</label>
							<input v-on:change="checkChanges()" class="form-control" name="itemDelay" type="number" v-model="item.delay" min="-1" />
							<small id="itemDelayHelp" class="form-text text-muted">{{translate('itemDelayHelp')}}</small>
							<p/>
						</div>
						<div class="form-check">
							<input v-on:change="checkChanges()" class="form-check-input" name="itemEnableOn" type="checkbox" v-model="item.enableOn" /><label class="form-check-label" for="itemEnableOn">{{translate('itemEnableOn')}}:</label>
							<small id="itemEnableOnHelp" class="form-text text-muted">{{translate('itemEnableOnHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemQuestionOn">{{translate('itemQuestionOn')}}:</label>
							<input v-on:change="checkChanges()" class="form-control" name="itemQuestionOn" type="text" v-model="item.questionOn" /><small id="itemQuestionOnHelp" class="form-text text-muted">{{translate('itemQuestionOnHelp')}}</small>
							<p/>
						</div>
						<div class="form-check">
							<input v-on:change="checkChanges()" class="form-check-input" name="itemEnableOff" type="checkbox" v-model="item.enableOff" /><label class="form-check-label" for="itemEnableOff">{{translate('itemEnableOff')}}:</label>
							<small id="itemEnableOffHelp" class="form-text text-muted">{{translate('itemEnableOffHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemQuestionOff">{{translate('itemQuestionOff')}}:</label>
							<input v-on:change="checkChanges()" class="form-control" name="itemQuestionOff" type="text" v-model="item.questionOff" /><small id="itemQuestionOffHelp" class="form-text text-muted">{{translate('itemQuestionOffHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemDeviceIDs">{{translate('itemDeviceIDs')}}:</label>
							<ul class="list-group">
								<li class="list-group-item" v-for="(subItem, index) in item.itemIDs_Local">
									<div class="input-group">
										<select v-on:change="checkChanges()" v-bind:class="{'invalidInput':subItem.value.length == 0}" class="form-control" name="itemDeviceIDs" v-model="subItem.value" >
											<option v-for="device in devicesDictionary" v-bind:value="device.id" v-bind:disabled="!isItemSelectable(device.id) || !device.enabled || device.id == id">
												{{ device.header }}
											</option>
										</select>
										<span class="input-group-btn">
											<button type="button" style="float: left" class="btn btn-default" aria-label="Left Align" v-on:click="remove(item.itemIDs_Local, index)">
												<i class="fa fa-trash"></i>
											</button>
										</span>
									</div>
								</li>
								<li class="list-group-item" v-on:click="addNewCollectionItem('itemIDs_Local', null)">{{translate('itemAddNew')}}</li>
							</ul>
							<small id="itemDeviceIDsHelp" class="form-text text-muted">{{translate('itemDeviceIDsHelp')}}</small>
							<p/>
						</div>
						
						
						<div class="form-group">
							<label for="itemReorder">{{translate('itemReorder')}}:</label>
							<select v-on:change="checkChanges()" class="form-control" name="itemReorder" v-model="item.__reorder" >
								<option v-for="reorderOption in reorderDictionary" v-bind:value="reorderOption.id">
									{{ reorderOption.description }}
								</option>
							</select>
							<small id="itemReorderHelp" class="form-text text-muted">{{translate('itemReorderHelp')}}</small>
							<p/>
						</div>
						
						
						<div class="form-group">
							<label for="itemCodeDev">{{translate('itemCodeDev')}}:</label>
							<input v-on:change="checkChanges()" class="form-control" name="itemCodeDev" type="text" v-model="item.codeDev" />
							<small id="itemCodeDevHelp" class="form-text text-muted">{{translate('itemCodeDevHelp')}}</small>
							<p/>
						</div>
					</p>
				</div>
				<div class="modal-footer">
					<button v-if="id && !confirmDeleteItem" type="button" class="btn btn-danger me-auto" v-on:click="preDeleteItem()">{{translate('delete')}}</button>
					<button v-if="id && confirmDeleteItem" type="button" class="btn btn-danger me-auto" v-on:click="deleteItem()">{{translate('delete_confirm')}}</button>
					<button v-bind:disabled="!isSaveEnabled" type="button" class="btn btn-primary" v-on:click="saveItem()">{{translate('save')}}</button>
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{translate('close')}}</button>
				</div>
		
			</div>
		</div>
		<div style="display: none">{{refresher}}</div>
	</div>`,
	setup(props, context) {
		
		const dataLoading = Vue.ref(false)
		const header = Vue.ref('---')
		const refresher = Vue.ref(true)
		const invalidName = Vue.ref(false)
		const item = Vue.ref({itemIDs_Local:[]})
		const confirmDeleteItem = Vue.ref(false)
		const devicesDictionary = Vue.ref([])
		const categoriesDictionary = Vue.ref([])
		const sendOptionDictionary = Vue.ref([])
		const reorderDictionary = Vue.ref([])
		const isSaveEnabled = Vue.ref(false)
		const id = Vue.ref(null);
		const devicesDictionarySelector = Vue.ref([])

		let arraysToOverride = ['codeOn','itemIDs'];
		let arraysOverrideSuffix = "_Local";
		let requiredFields = ['name','header','category'];

		const manageItemData = function() {
			if(item.value) {
				if(item.value.itemIDs_Local && item.value.itemIDs_Local.length > 0) {
					item.value.sendOption = 5;
				}
				if(item.value.sendOption == null)
					item.value.sendOption = 0;
				if(item.value.enabled == null)
					item.value.enabled = true;
				if(item.value.enableOff == null)
					item.value.enableOff = true;
				if(item.value.enableOn == null)
					item.value.enableOn = true;
			}
		}

		function canBeSaved() {
			manageItemData();
			
			// no duplicated item names
			if(item.value.name && item.value.name.length > 0) {
				for(var devIndex = 0; devIndex < devicesDictionary.value.length; devIndex++) {
					if((devicesDictionary.value[devIndex].id != id.value) && (item.value.name == devicesDictionary.value[devIndex].id))
					{
						invalidName.value = true;
						return false;
					}
				}
			}
			invalidName.value = false;
			
			// no empty related Items
			if(item.value.itemIDs_Local && item.value.itemIDs_Local.length > 0 && item.value.itemIDs_Local.filter(function(el){return el.value.length == 0}).length > 0) {
				return false;
			}
			
			return automation.checkRequiredFields(requiredFields, [item.value]);
		}

		const isItemSelectable = function(itemId) {
			if(!item.value.itemIDs_Local || !item.value.itemIDs_Local.length) {
				return true
			}

			return !item.value.itemIDs_Local.find(localItem => localItem.value == itemId)
		}

		const saveItem = function() {
			for (var property in item.value) {
				if (item.value.hasOwnProperty(property)) {
					if(property.endsWith(arraysOverrideSuffix)) {
						var orgPropertyName = property.slice(0, -1*arraysOverrideSuffix.length);
						if(arraysToOverride.includes(orgPropertyName)) {
							item.value[orgPropertyName] = convertLocalCollectionToServer(item.value[property]);
						}
					}
				}
			}
			
			item.value.__processAction = 0;
			if(!id.value) {
				item.value.__processAction = 1;
			} else if(item.value.__delete) {
				item.value.__processAction = 2;
			}
			
			dataLoading.value = true;
			var propertiesToOmmit = arraysToOverride.map(function(el){return el+arraysOverrideSuffix});

			itemsDataService.setItemData(JSON.stringify(automation.omitKeys(item.value, propertiesToOmmit)),
				function(dataResponse) {
					dataLoading.value = false;
					$('#modalItemDialog').modal('hide');
					window.mittEmitter.emit('refreshTab', null);
				},
				function(response) {
					var error = 'Items data set error';
					dataLoading.value = false;
					console.log(error);
					console.log(response);
				}
			)
		}

		const preDeleteItem = function() {
			confirmDeleteItem.value = true;
		}

		const deleteItem = function() {
			item.value.__delete = true;
			saveItem();
		}

		const remove = function(array, index){
			array.splice(index, 1);
		};

		const addNewCollectionItem = function(collectionName, value) {
			if(!item.value[collectionName])
				item.value[collectionName] = [];
				
			if(!value) {
				item.value[collectionName].push({value: ""});
			}
			else
				item.value[collectionName].push({value: value});
		}

		const convertServerCollectionToLocal = function(collectionName, serverCollection) {
			if(Array.isArray(serverCollection) && serverCollection.length > 0) {
				serverCollection.forEach(function(el, index, array) {
					addNewCollectionItem(collectionName, el);
				});
			}
		}

		function convertLocalCollectionToServer(localCollection) {
			var collectionResult = [];
			if(Array.isArray(localCollection) && localCollection.length > 0) {
				localCollection.forEach(function(el, index, array) {
					collectionResult.push(el.value);
				});
			}
			return collectionResult;
		}

		const checkItemsData = function() {
			dataLoading.value = true;
			item.value = {itemIDs_Local: []}

			if(id.value == null) {
				// new item
				dataLoading.value = false;
				isSaveEnabled.value = canBeSaved()
				header.value = automation.translate('itemAddNew')
				return
			}

			itemsDataService.checkItemData(id.value, 
				function(dataResponse) {
					dataLoading.value = false;
					var respData = dataResponse.data
					
					if(respData && respData.item && respData.item.properties) {
						var itemServerObject = respData.item.properties;
						for (var property in itemServerObject) {
							if (itemServerObject.hasOwnProperty(property)) {
								if(arraysToOverride.includes(property)) {
									convertServerCollectionToLocal(property + arraysOverrideSuffix, itemServerObject[property]);
								}
								else {
									item.value[property] = itemServerObject[property];
								}
							}
						}
						isSaveEnabled.value = canBeSaved()
						header.value = item.value.header ? item.value.header : '---'
					}
				},
				function(response) {
					var error = logType + 'Item load ' + id.value + ' error';
					dataLoading.value = false;
					console.log(error);
					console.log(response);
				}
			);
		};

		const translate = function(code) {
			return automation.translate(code)
		}

		const translateAll = function() {
			refresher.value = !refresher.value
		}

		function init() {
			devicesDictionary.value = automation.getDevicesDictionary();

			categoriesDictionary.value = [
				{id:'general',description:automation.translate('homepage')}, 
				{id:'advanced',description: automation.translate('advanced')}
			];
			
			sendOptionDictionary.value = [
				{id:0,description:automation.translate('sendOption_0')}, 
				{id:1,description: automation.translate('sendOption_1')}, 
				{id:2,description: automation.translate('sendOption_2')},
				{id:3,description: automation.translate('sendOption_3')}, 
				{id:4,description: automation.translate('sendOption_4')}, 
				{id:5,description: automation.translate('sendOption_5')}
			];

			// build reorder dictionary start
			reorderDictionary.value = []
			reorderDictionary.value.push({id:-1, description:automation.translate('itemReorderFirst')});
			devicesDictionary.value.forEach(function(el, array, index) {
				reorderDictionary.value.push({id:el.id, description:automation.translate('itemReorderAfter')+el.header});
			});
			reorderDictionary.value.push({id:99, description:automation.translate('itemReorderLast')});
			// build reorder dictionary end

			checkItemsData();
		}
		
		Vue.onMounted(function() {
			translateAll()
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
			window.mittEmitter.on('showItemModal', function(args){
				id.value = args.id
				init()
			});
		})

		const checkChanges = function() {
			console.log('checkChanges')
			isSaveEnabled.value = canBeSaved()
		}
		
		return {
			addNewCollectionItem,
			categoriesDictionary,
			checkChanges,
			confirmDeleteItem,
			dataLoading,
			deleteItem,
			devicesDictionary,
			header,
			id,
			invalidName,
			isItemSelectable,
			isSaveEnabled,
			item,
			preDeleteItem,
			refresher,
			remove,
			reorderDictionary,
			saveItem,
			sendOptionDictionary,
			translate
		}
	}
});
