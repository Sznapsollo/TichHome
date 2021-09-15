app.component('item-modal', {
	template: `
	<div id="modalItemDialog" role="dialog" class="modal fade">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">{{header}}</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<p class="modal-body-p">
						<i ng-show="dataLoading" class="fa fa-spinner fa-4x fa-spin"></i>
					
						<div class="form-group">
							<label for="itemName"><strong>{{translate('itemName')}}*:</strong>:</label>
							<input ng-disabled="id" ng-class="{'invalidInput':invalidName}" class="form-control" name="itemName" type="text" ng-model="item.name" />
							<small id="itemNameHelp" class="form-text text-muted">{{translate('itemNameHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemCategory"><strong>{{translate('itemCategory')}}*</strong>:</label>
							<select class="form-control" name="itemCategory" ng-model="item.category" ng-options="category.id as (category.description) for category in categoriesDictionary">
							</select>
							<small id="itemCategoryHelp" class="form-text text-muted">{{translate('itemCategoryHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemHeader"><strong>{{translate('itemHeader')}}*</strong>:</label>
							<input class="form-control" name="itemHeader" type="text" ng-model="item.header" />
							<small id="itemHeaderHelp" class="form-text text-muted">{{translate('itemHeaderHelp')}}</small>
							<p/>
						</div>
						<div class="form-check">
							<input class="form-check-input" name="itemEnabled" type="checkbox" ng-model="item.enabled" /><label class="form-check-label" for="itemEnabled">{{translate('itemEnabled')}}</label>
							<small id="itemEnabledHelp" class="form-text text-muted">{{translate('itemEnabledHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemHotWord">{{translate('itemHotWord')}}:</label>
							<input class="form-control" name="itemHotWord" type="text" ng-model="item.hotword" />
							<small id="itemHotWordHelp" class="form-text text-muted">{{translate('itemHotWordHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemImage">{{translate('itemImage')}}:</label>
							<input class="form-control" name="itemImage" type="text" ng-model="item.image" />
							<small id="itemImageHelp" class="form-text text-muted">{{translate('itemImageHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemIcon">{{translate('itemIcon')}}:</label>
							<input class="form-control" name="itemIcon" type="text" ng-model="item.icon" />
							<small id="itemIconHelp" class="form-text text-muted">{{translate('itemIconHelp')}}</small>
							<p/>
						</div>
						<div class="form-check">
							<input class="form-check-input" name="itemRegularActions" type="checkbox" ng-model="item.regularActions" />
							<label class="form-check-label" for="itemRegularActions">{{translate('itemRegularActions')}}:</label>
							<small id="itemRegularActionsHelp" class="form-text text-muted">{{translate('itemRegularActionsHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemSendOption">{{translate('itemSendOption')}}:</label>
							<select ng-disabled="item.itemIDs_Local.length > 0" class="form-control" name="itemSendOption" ng-model="item.sendOption" ng-options="sendOption.id as (sendOption.description) for sendOption in sendOptionDictionary" >
							</select>
							<small id="itemSendOptionHelp" class="form-text text-muted">{{translate('itemSendOptionHelp')}}</small>
							<p/>
						</div>
						<div ng-show="item.sendOption == 2" class="form-group">
							<label for="itemAddress">{{translate('itemAddress')}}:</label>
							<input class="form-control" name="itemAddress" type="text" ng-model="item.address" />
							<small id="itemAddressHelp" class="form-text text-muted">{{translate('itemAddressHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemCodeOn">{{translate('itemCodeOn')}}:</label>
							<ul class="list-group">
								<li class="list-group-item" ng-repeat="codeOn in item.codeOn_Local">
									<div class="input-group">
										<input class="form-control" type="text" ng-model="codeOn.value">
										<span class="input-group-btn">
											<button type="button" style="float: left" class="btn btn-default" aria-label="Left Align" ng-click="remove(item.codeOn_Local, $index)">
												<i class="fa fa-trash"></i>
											</button>
										</span>
									</div>
								</li>
								<li class="list-group-item" ng-click="addNewCollectionItem('codeOn_Local', null)">{{translate('itemAddNew')}}</li>
							</ul>
							<small id="itemCodeOnHelp" class="form-text text-muted">{{translate('itemCodeOnHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemCodeOff">{{translate('itemCodeOff')}}:</label>
							<input class="form-control" name="itemCodeOff" type="text" ng-model="item.codeOff" /><small id="itemCodeOffHelp" class="form-text text-muted">{{translate('itemCodeOffHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemDelay">{{translate('itemDelay')}}(s):</label>
							<input class="form-control" name="itemDelay" type="number" ng-model="item.delay" min="-1" />
							<small id="itemDelayHelp" class="form-text text-muted">{{translate('itemDelayHelp')}}</small>
							<p/>
						</div>
						<div class="form-check">
							<input class="form-check-input" name="itemEnableOn" type="checkbox" ng-model="item.enableOn" /><label class="form-check-label" for="itemEnableOn">{{translate('itemEnableOn')}}:</label>
							<small id="itemEnableOnHelp" class="form-text text-muted">{{translate('itemEnableOnHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemQuestionOn">{{translate('itemQuestionOn')}}:</label>
							<input class="form-control" name="itemQuestionOn" type="text" ng-model="item.questionOn" /><small id="itemQuestionOnHelp" class="form-text text-muted">{{translate('itemQuestionOnHelp')}}</small>
							<p/>
						</div>
						<div class="form-check">
							<input class="form-check-input" name="itemEnableOff" type="checkbox" ng-model="item.enableOff" /><label class="form-check-label" for="itemEnableOff">{{translate('itemEnableOff')}}:</label>
							<small id="itemEnableOffHelp" class="form-text text-muted">{{translate('itemEnableOffHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemQuestionOff">{{translate('itemQuestionOff')}}:</label>
							<input class="form-control" name="itemQuestionOff" type="text" ng-model="item.questionOff" /><small id="itemQuestionOffHelp" class="form-text text-muted">{{translate('itemQuestionOffHelp')}}</small>
							<p/>
						</div>
						<div class="form-group">
							<label for="itemDeviceIDs">{{translate('itemDeviceIDs')}}:</label>
							<ul class="list-group">
								<li class="list-group-item" ng-repeat="subItem in item.itemIDs_Local">
									<div class="input-group">
										<select ng-class="{'invalidInput':subItem.value.length == 0}" class="form-control" name="itemDeviceIDs" ng-model="subItem.value" ng-options="device.id as (device.header) for device in devicesDictionary | excludeFrom:otherElements(subItem,item.itemIDs_Local)" >
										</select>
										<span class="input-group-btn">
											<button type="button" style="float: left" class="btn btn-default" aria-label="Left Align" ng-click="remove(item.itemIDs_Local, $index)">
												<i class="fa fa-trash"></i>
											</button>
										</span>
									</div>
								</li>
								<li class="list-group-item" ng-click="addNewCollectionItem('itemIDs_Local', null)">{{translate('itemAddNew')}}</li>
							</ul>
							<small id="itemDeviceIDsHelp" class="form-text text-muted">{{translate('itemDeviceIDsHelp')}}</small>
							<p/>
						</div>
						
						
						<div class="form-group">
							<label for="itemReorder">{{translate('itemReorder')}}:</label>
							<select class="form-control" name="itemReorder" ng-model="item.__reorder" ng-options="reorderOption.id as (reorderOption.description) for reorderOption in reorderDictionary" >
							</select>
							<small id="itemReorderHelp" class="form-text text-muted">{{translate('itemReorderHelp')}}</small>
							<p/>
						</div>
						
						
						<div class="form-group">
							<label for="itemCodeDev">{{translate('itemCodeDev')}}:</label>
							<input class="form-control" name="itemCodeDev" type="text" ng-model="item.codeDev" />
							<small id="itemCodeDevHelp" class="form-text text-muted">{{translate('itemCodeDevHelp')}}</small>
							<p/>
						</div>
					</p>
				</div>
				<div class="modal-footer">
					<button ng-if="id && !confirmDeleteItem" type="button" class="btn btn-danger mr-auto" ng-click="preDeleteItem()">{{translate('delete')}}</button>
					<button ng-if="id && confirmDeleteItem" type="button" class="btn btn-danger mr-auto" ng-click="deleteItem()">{{translate('delete_confirm')}}</button>
					<button ng-disabled="!isSaveEnabled()" type="button" class="btn btn-primary" ng-click="saveItem()">{{translate('save')}}</button>
					<button type="button" data-dismiss="modal" class="btn btn-default">{{translate('close')}}</button>
				</div>
		
			</div>
		</div>
		<div style="display: none">{{refresher}}</div>
	</div>`,
	setup(props, context) {
		
		const dataLoading = Vue.ref(false)
		const header = Vue.ref('---')
		const refresher = Vue.ref(true)
		const item = Vue.ref({})
		

		// $scope.confirmDeleteItem = false;
		//// $scope.arraysToOverride = ['codeOn','itemIDs'];
		//// $scope.arraysOverrideSuffix = "_Local";
		// $scope.requiredFields = ['name','header','category'];
		// $scope.invalidName = false;
		// $scope.automation = automation;
		// $scope.saveItem = saveItem;
		// $scope.preDeleteItem = preDeleteItem;
		// $scope.deleteItem = deleteItem;
		// item.value = {};
		// $scope.dataLoading = true;
		// $scope.isSaveEnabled = isSaveEnabled;
		// $scope.manageItemData = manageItemData;
		// $scope.categoriesDictionary = [];
		// $scope.sendOptionDictionary = [];
		// $scope.reorderDictionary = [];
		// $scope.devicesDictionary = automation.GetDevicesDictionary();
		// $scope.otherElements = otherElements;
		//// $scope.addNewCollectionItem = addNewCollectionItem;
		// $scope.remove = function(array, index){
		// 	array.splice(index, 1);
		// };


		let id = null;
		let arraysToOverride = ['codeOn','itemIDs'];
		let arraysOverrideSuffix = "_Local";

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

		const checkItemsData = function() {
			dataLoading.value = true;
			item.value = {}

			itemsDataService.checkItemData(id, 
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
						manageItemData();
					}
				},
				function(response) {
					var error = logType + 'Item load ' + id + ' error';
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
			
			checkItemsData();
		}
		
		Vue.onMounted(function() {
			translateAll()
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
			window.mittEmitter.on('showItemModal', function(args){
				
				id = args.id

				init()
			});
		})

		// Vue.watch([orderByType, searchQuery, dropdownItemsSelected], (currentValue, oldValue) => {
		// 	performFilter()
		// })

		return {
			dataLoading,
			header,
			refresher,
			translate
		}
	}
});
