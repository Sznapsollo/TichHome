app.component('log-details', {
	template: `
	<div id="modalLogDialog" role="dialog" class="modal fade" tabindex="-1">
		<div class="modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">{{header}}</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<p class="modal-body-p">
						<div class="logDetailsArea">
							<div class="form-inline">
								<a class="fakeLink" style="cursor: pointer;" v-on:click="orderByType = !orderByType">Change Sort</a>
								&nbsp;|&nbsp;
								<a class="fakeLink" style="cursor: pointer;" v-if="!dataLoading" v-on:click="checkLogDetails()">Refresh</a>
								<i v-if="dataLoading" class="fa fa-cog fa-spin"></i>
								&nbsp;|&nbsp;
								<input type="text" style="width: 100px" v-model="searchQuery" :placeholder="[[searchLabel]]" class="form-control" >
								<span v-if="dropdownItemsData.length > 0" >
									&nbsp;|&nbsp;
									<select name="dropdownOptions" id="dropdownOptions" v-model="dropdownItemsSelected" class="form-control">
										<option v-for="dropdownItem in dropdownItemsData" v-bind:value="dropdownItem.searchQuery">
											{{ dropdownItem.name }}
										</option>
									</select>
								</span>
								&nbsp;|&nbsp;
								{{logDetailsFilteredLines.length}}
							</div>
							<div>
								<div class="logRow" v-for="logItem in logDetailsFilteredLines" >
									<div style="word-wrap: break-word;">{{logItem}}</div>	
								</div>
							</div>
						</div>
					</p>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{closeLabel}}</button>
				</div>
			</div>
		</div>
	</div>`,
	setup(props, context) {
		
		const orderByType = Vue.ref(true);
		const dropdownItemsData = Vue.ref([]);
		const searchLabel = Vue.ref('search')
		const closeLabel = Vue.ref('close');
		const dataLoading = Vue.ref(false)
		const searchQuery = Vue.ref(null)
		const dropdownItemsSelected = Vue.ref(null)
		const header = Vue.ref('')
		const logDetailsFilteredLines = Vue.ref([])

		let logContentLines = []
		let logType = null
		let fileName = null

		const performFilter = function() {
			
			var searchedValue = logContentLines.slice()
			
			if(orderByType.value) {
				searchedValue.sort()
			} else {
				searchedValue.reverse()
			}

			searchedValue = searchedValue.filter(function(filteredItem) {
				let isOk = true
				if(isOk && searchQuery.value && searchQuery.value.length) {
					if(filteredItem.toLowerCase().indexOf(searchQuery.value.toLowerCase()) >= 0) {
						isOk = true
					} else {
						isOk = false
					}
				}
				if(isOk && dropdownItemsSelected.value && dropdownItemsSelected.value.length) {
					if(filteredItem.toLowerCase().indexOf(dropdownItemsSelected.value.toLowerCase()) >= 0) {
						isOk = true
					} else {
						isOk = false
					}
				}
				return isOk
			})

			logDetailsFilteredLines.value = searchedValue
		}

		const checkLogDetails = function() {
			dataLoading.value = true;
			logContentLines = []
			logDetailsFilteredLines.value = []

			logsDataService.checkLogsFileData(logType, fileName, 
				function(dataResponse) {
					dataLoading.value = false;
					logContentLines = dataResponse.data.logLines;
					performFilter()
				},
				function(response) {
					var error = logType + ' ' + fileName + ' file data read error';
					dataLoading.value = false;
					console.log(error);
					console.log(response);
				}
			);
		};

		const translateAll = function() {
			searchLabel.value = automation.translate('search');
			closeLabel.value = automation.translate('close');
		}

		function init() {
			var filterDropdownValues = automation.pageFlag("logsDropdownFilter");
			if(filterDropdownValues) {
				for(var filterDropdownValuesIndex = 0; filterDropdownValuesIndex < filterDropdownValues.length; filterDropdownValuesIndex++) {
					if(filterDropdownValues[filterDropdownValuesIndex].name == logType) {
						dropdownItemsData.value = filterDropdownValues[filterDropdownValuesIndex].values;
						
						if(dropdownItemsData.value && dropdownItemsData.value.length > 0)
							dropdownItemsSelected.value = dropdownItemsData.value[0];
						break;
					}
				}
			}

			searchQuery.value = null
			dropdownItemsSelected.value = null
			orderByType.value = true

			checkLogDetails();
		}
		
		Vue.onMounted(function() {
			translateAll()
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
			window.mittEmitter.on('showLogs', function(args){
				
				logType = args.logType
				fileName = args.fileName

				init()
				header.value = fileName
			});
		})

		Vue.watch([orderByType, searchQuery, dropdownItemsSelected], (currentValue, oldValue) => {
			performFilter()
		})

		return {
			checkLogDetails,
			closeLabel,
			dataLoading,
			dropdownItemsData,
			dropdownItemsSelected,
			header,
			logDetailsFilteredLines,
			orderByType,
			searchLabel,
			searchQuery
		}
	}
});
