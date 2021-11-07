app.component('switch-item', {
	props: ['index', 'item'],
	template: `
	<div v-if="isEnabled">
		<div class="powerswitch">
			<i v-if="icon" :class="icon"></i>
			<img v-if="image" class="switchIcon" v-bind:class="{'switchIconClickable':delay}" v-on:click="toggleSliderOptions()" v-bind:src="'graphics/icons/' + image" />
			<span class="switchHeader" v-bind:class="{'switchHeaderClickable':delay}" v-on:click="toggleSliderOptions()">{{header}}</span>
			<button v-if="showTimer" v-on:click="toggleSliderOptions()" type="button" class="btn btn-sm closeSubSectionButton" >
				<i class="fa fa-close"></i>
			</button>
			<img v-if="boolValue(regularActions)" class="switchCalendarIcon" v-on:click="toggleRegularOptions()" v-bind:src="'graphics/' + calendarIconName" />
			<button v-if="showRegular" v-on:click="toggleRegularOptions()" type="button" class="btn btn-sm closeSubSectionButton" >
				<i class="fa fa-close"></i>
			</button>
			<div class="numberPicker" v-if="delay">
				<hours-and-minutes v-on:click="toggleSliderOptions()" class="timerNormal" v-if="!showTimer" v-bind:delayValue="delayValue"></hours-and-minutes>
			</div>
		</div>
		<div v-if="relatedItems && relatedItems.length" class="relatedItems">
			{{relatedItems ? relatedItems.join(', ') : ''}}
		</div>
		<div class="itemRegularActionsRandomData" v-if="regularActionRandomStart != null && regularActionRandomEnd != null && regularActionRandomStart.length && regularActionRandomEnd.length">
			{{translate('itemRandom')}}: {{regularActionRandomStart}} - {{regularActionRandomEnd}}
		</div>
		<div v-if="hotword != null" class="hotword">
			{{translate('itemHotWord')}}: {{hotword}}
		</div>
		<div class="itemAvailability" v-if="boolValue(canCheckAvailabitylyIp)" v-on:click="checkItemAvailability()">
			<span v-if="itemAvailability == null">{{translate('availability_not_checked')}}</span>
			<span v-if="itemAvailability" style="color:green">{{translate('availability_available')}}</span>
			<span v-if="itemAvailability == false" style="color:red">{{translate('availability_unavailable')}}</span>
		</div>
		<div v-bind:class="{'sub-section': showRegular || showTimer}">

			<regular-settings v-if="showRegular" v-bind:outletId="outletId" v-bind:regularActionData="regularActionData" v-on:onSaveRegularSettings="saveRegularSettings" v-bind:randomEnabled="true" ></regular-settings>

			<hours-and-minutes class="timerChoice" v-if="showTimer" v-bind:calculatedTime="calculatedTime" v-bind:showDate="true" v-bind:delayValue="delayValue" v-on:onDelayedDisableClicked="delayedDisableClicked" v-bind:minSliderValue="minSliderValue" v-bind:maxSliderValue="maxSliderValue" v-on:onChangeMinutes="changeTimer"></hours-and-minutes>
			<div v-if="showTimer" class="input-group">
				<span class="input-group-btn">
					<button type="button" class="btn btn-default" aria-label="Left Align" v-on:click="changeValue(-1)">
						<i class="fa fa-arrow-left"></i>
					</button>
				</span>
				<span class="input-group-btn">
					&nbsp;
				</span>
				<input type="range" min="{{minSliderValue}}" max="{{maxSliderValue}}" v-model="delayValue" v-on:change="changeTimer(delayValue)" class="form-range form-control formRangeSlider" style="float: left;" />
				<span class="input-group-btn">
					&nbsp;
				</span>
				<span class="input-group-btn">
					<button type="button" class="btn btn-default" aria-label="Left Align" v-on:click="changeValue(1)">
						<i class="fa fa-arrow-right"></i>
					</button>
				</span>
				<p>&nbsp;</p>
			</div>
		</div>
		<div class="powerswitchbuttons btn-group d-flex"  aria-label="...">
			<div class="btn-group w-100" role="group" v-if="boolValue(enableOn)">
				<button :disabled="busy" type="button" class="btn btn-default btn-lg btn-success w-100" v-on:click="clickButton({'outletId':outletId,'status':'on','delay':delayValue*60})" v-bind:class="{'turnedOff':!isActive('pin2',1), 'btn-info': questionOn}">{{translate('enable')}}<span class="timerNormal" v-if="showTimer">&nbsp;({{translate('disable_at')}}&nbsp;{{$filters.formatDate(calculatedTime, 'HH:mm')}})</span></button>
			</div>
			<div class="btn-group w-100" role="group"  v-if="boolValue(enableOff)">
				<button  :disabled="busy" type="button" class="btn btn-default btn-lg w-100" v-on:click="clickButton({'outletId':outletId,'status':'off'})" v-bind:class="{'turnedOff':!isActive('pin2',0), 'btn-danger': questionOff, 'btn-disable': !questionOff}"><span v-if="!timeEnd">{{translate('disable')}}</span><span v-if="timeEnd"><span class="timeOff"><span class="timeEnd">{{$filters.formatDate(timeEnd, 'HH:mm:ss')}}</span> (<span class="disableDate">{{$filters.formatDate(disableDate, 'HH:mm')}}</span>)</span></span></button>
			</div>
		</div>
		<div style="display: none">{{refresher}}</div>
	</div>
	`,
	setup(props, context) {

		const item = props.item
		
		// console.log('signatureItem created', item)

		const busy = Vue.ref(false);
		const delay = Vue.ref(item.delay);
		const header = Vue.ref(item.header);
		const enableOn = Vue.ref(item.enableOn);
		const enableOff = Vue.ref(item.enableOff);
		const icon = Vue.ref(item.icon);
		const image = Vue.ref(item.image);
		const itemType = Vue.ref(item.itemType);
		const itemSubType = Vue.ref(item.itemSubType);
		const outletId = Vue.ref(item.id);
		const questionOn = Vue.ref(item.questionOn);
		const questionOff = Vue.ref(item.questionOff);
		const regularActions = Vue.ref(item.regularActions);
		const relatedItems = Vue.ref(item.relatedItems);
		const hotword = Vue.ref(item.hotword);
		const canCheckAvailabitylyIp = Vue.ref(item.canCheckAvailabitylyIp)
		const regularActionRandomStart = Vue.ref(item.regularActionRandomStart)
		const regularActionRandomEnd = Vue.ref(item.regularActionRandomEnd)
		
		const disableDate = Vue.ref(null);
		const calendarIconName = Vue.ref(automation.getIcon('calendar',''))
		const calculatedTime = Vue.ref('---');
		const minSliderValue = Vue.ref(-1);
		const maxSliderValue = Vue.ref(360);
		const questions = Vue.ref({});
		const showRegular = Vue.ref(false);
		const showTimer = Vue.ref(false);
		const delayValue = Vue.ref(null);
		const initialDelayValue = Vue.ref(null);
		const data = Vue.ref({});
		const itemAvailability = Vue.ref(null);
		const timeEnd = Vue.ref("");
		const regularActionData = Vue.ref({});
		const refresher = Vue.ref(true)
		const isEnabled = Vue.ref(false)

		var timerCheckData;
		var timerCountDownDelay;

		const checkItemAvailability = function() {
			busy.value = true;
			itemAvailabilityService.checkItemAvailability(outletId.value, 
				function(data) {
					busy.value = false;
					if(data.message == 'ok') {
						itemAvailability.value = data.data.available;
					} else {
						showErrorMessage(data)	
					}
				},
				function() {
					var error = 'Availability data read error for ' + outletId.value;
					showErrorMessage(error)	
				}
			);
		}

		const unblockButtons = function()
		{
			busy.value = false;
		}

		const delayedDisableClicked = function() {
			clickButton({'outletId':outletId.value,'status':'offd','delay':delayValue.value*60})
			showTimer.value = false
		}

		function setupRegularSettings(regularSettingsData) {
			regularActionData.value = regularSettingsData;
					
			var existsSetting = false;
			
			if(regularActionData.value) {
				if(regularActionData.value.timeUnits !== undefined && regularActionData.value.timeUnits.length > 0) {
				
					for(var i=0; i < regularActionData.value.timeUnits.length; i++) {
						if(regularActionData.value.timeUnits[i].daysOfWeek.length > 0) {
							existsSetting = true;
							break;
						}
					}
				}
				if(existsSetting) {
					calendarIconName.value = automation.getIcon('calendar', '_enabled');
				} else {
					calendarIconName.value = automation.getIcon('calendar', '');
				}
			}
			else {
				calendarIconName.value = automation.getIcon('calendar', '');
			}
		}

		const saveRegularSettings = function(timeLine) {
			showRegular.value = false;
			
			delayDataService.setRegularActionData(outletId.value, timeLine, 
				function(dataResponse) {
					if(dataResponse.message == 'ok') {
						if(dataResponse.data) {
							setupRegularSettings(dataResponse.data);
						} else {
							checkRegularActionData();	
						}
					} else {
						showErrorMessage(dataResponse);
					}
				},
				function() {
					var error = 'Regular action data set error for ' + outletId.value;
					showErrorMessage(error)	
				}
			);
		}

		const checkRegularActionData = function() {
			delayDataService.checkRegularActionData(outletId.value, 
				function(dataResponse) {
					if(dataResponse.message == 'ok') {
						setupRegularSettings(dataResponse.data);
					} else {
						showErrorMessage(dataResponse);
					}
				},
				function(response) {
					var error = 'Regular action data read error for ' + outletId.value;
					showErrorMessage(error)
				}
			);
		}

		const translate = function(code) {
			return automation.translate(code)
		}

		const translateAll = function() {
			refresher.value = !refresher.value
		}

		const boolValue = function(value) {return automation.boolValue(value)};
		
		const isActive = function(obj, value) {
			if(data.value !== undefined && data.value.enabled !== undefined)
				return data.value.enabled === value;
			return true;
		}
		const clickButton = function (params) {
			busy.value = true;
			
			var mode = params.outletId;
			var delayed = params.delay !== undefined ? params.delay : 0;
			
			if(questions.value[params.status]) {
				automation.confirm(mode, params.status, delayed, questions.value[params.status])
			}
			else {
				performAction(mode, params.status, delayed).then(
					function(data, status) {
						if(data.message == 'ok') {
							setupDelayData(data.data)
						}
					}, 
					function(error) {
						// handled at root
					}
				)
			}
			
			setTimeout(function(){
				showTimer.value = false;
				showRegular.value = false;
				delayValue.value = initialDelayValue.value;
				setTimeout(function(){unblockButtons();}, 1000);
			}, 2000);
		}

		const toggleRegularOptions = function() {
			showRegular.value = !showRegular.value;
		}

		const toggleSliderOptions = function() {
		
			if(!delay.value)
				return;
				
			showTimer.value = !showTimer.value;
			
			if(showTimer.value) {
				changeCalculatedTime();
			}
		}

		const changeTimer = function(value) {
			delayValue.value = parseInt(value,10);
			
			changeCalculatedTime();
		}

		const changeValue = function(value) {
 
			if((value < 0 && delayValue.value <= minSliderValue.value) || (value > 0 && delayValue.value >= maxSliderValue.value))
				return; 

			delayValue.value += value;

			changeCalculatedTime();
		}

		const changeCalculatedTime = function() {
			var whatDelay = delayValue.value ? delayValue.value : initialDelayValue.value;
			if(whatDelay < 0)
				calculatedTime.value =  "---";
			else
				calculatedTime.value =  new Date((new Date()).getTime() + whatDelay*60000);
		}

		function countDownDelay() {
			if(disableDate.value == null) {
				timeEnd.value = "";
				return;
			}
			
			var date = new Date();
			
			// hack
			var timeDiff = parseInt(disableDate.value.getTime()) - parseInt(date.getTime());
			
			if(timeDiff < 0) {
				console.log('negative');
				disableDate.value = null
				timeEnd.value = "";
				
				setTimeout(function(){
					checkData();
				}, 2000);
				
				return;
			}
			
			date.setHours(date.getHours() + 1);
			var timeDiff = parseInt(disableDate.value.getTime()) - parseInt(date.getTime());
			
			timeEnd.value = timeDiff;	
		}

		function setDefaultDelay(value) {
			initialDelayValue.value = value;
			delayValue.value = value;
		}

		function checkInterval(timer, fn, timeInterval) {
			new Promise(function(resolve, reject) {
				timer = setTimeout(function() {fn(); resolve()}, 1000 * timeInterval);
			}).then(function() {
				checkInterval(timer, fn, timeInterval)
			});
		}

		function setupDelayData(delayData) {
			if(typeof delayData !== 'object') {
				return
			}
			data.value = delayData;
			// console.log('checkDataInner resp', outletId.value, data.value)
			if(data.value && data.value.time !== undefined && data.value.delay !== undefined) {
				disableDate.value = new Date((parseInt(data.value.time)+parseInt(data.value.delay))*1000);
			}
			else {
				disableDate.value = null;
			}

			if(itemType.value == 'Web') {
				// for webitems that ha$timeout.cancel(timerCheckData);
				if(data.value !== undefined && data.value.enabled != null) {
					if(!timerCheckData) {
						checkInterval(timerCheckData, checkData, 120);
					}
				} else {
					if(timerCheckData) {
						clearTimeout(timerCheckData);
						timerCheckData = null;
					}
				}
			}
		}

		function checkDataInner() {
			// console.log('checkDataInner', outletId.value)
			delayDataService.checkData(outletId.value, 
				function(dataResponse) {
					setupDelayData(dataResponse.data)
				},
				function(response) {
					var error = 'Delay data read error for ' + outletId.value;
					showErrorMessage(error)
					console.log(error);
					console.log(response);
					disableDate.value = null;
				}
			);
		}

		var checkDataPromise
		function checkData() {
			//console.log("Checking delay data for" + outletId.value );
			if(!checkDataPromise) {
				checkDataInner()
				checkDataPromise = setTimeout(function() {
					checkDataPromise = null
				}, 100)
			} else {
				if(checkDataPromise) {
					clearTimeout(checkDataPromise)
					checkDataPromise = null
				}
	
				checkDataPromise = setTimeout(function() {
					checkDataPromise = null
					checkDataInner()
				}, 100)
			}
		}

		function init()
		{
			// console.log('init', outletId.value)
			questions.value.on = questionOn.value;
			questions.value.off = questionOff.value;
		
			// on the start
			if(props.item && props.item.regularActionData) {
				setupRegularSettings(props.item.regularActionData)
			}
			// instead of this
			// checkRegularActionData();
		
			if(delay.value != null) {
				setDefaultDelay(parseInt(delay.value));

				if(props.item && props.item.delayData) {
					setupDelayData(props.item.delayData)
				}
				
				checkInterval(timerCountDownDelay, countDownDelay, 1);

				window.mittEmitter.on('checkData', function(data){
					if(!data) {
						return
					}
					if(itemSubType.value == 'G'){
						return
					}

					if(typeof data == 'object' && data.id) {
						if(data.id == outletId.value) {
							if(data.time !== undefined && data.delay !== undefined) {
								setupDelayData(data)
							} else {
								checkData()	
							}
						}
					} else if(typeof data == 'string') {
						if(data == 'all' || outletId.value == data) {
							// console.log('checkData doing it!!')
							checkData()
						}
					}
				}); 
			}

			if(regularActions.value == true) {
				window.mittEmitter.on('checkRegularData', function(data){
					if(!data) {
						return
					}

					if(typeof data == 'object' && data.name) {
						if(data.name == outletId.value) {
							setupRegularSettings(data)
						}
					} else if(typeof data == 'string') {
						if(data == 'all' || outletId.value == data) {
							// console.log('checkData doing it!!')
							checkRegularActionData()
						}
					}
				});
				window.mittEmitter.on('updateRegularActionDataRandoms', function(data){
					if(!data) {
						return
					}

					if(typeof data == 'object' && data.name) {
						if(data.name == outletId.value) {
							regularActionRandomStart.value = data.regularActionRandomStart,
							regularActionRandomEnd.value = data.regularActionRandomEnd
						}
					}
				});
			}
		};

		Vue.onMounted(function() {
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
			isEnabled.value = automation.boolValue(props.item.enabled)
			init()
			translateAll() 
		})

		Vue.onBeforeUnmount(function() {
			clearTimeout(timerCheckData);
			clearTimeout(timerCountDownDelay);
		})

		Vue.watch(
			() => [props.item],
			async (newArgs) => {
				console.log('watch item', props.item.id)
				init()
			})

		return {
			boolValue,
			busy,
			calculatedTime,
			calendarIconName,
			canCheckAvailabitylyIp,
			changeTimer,
			changeValue,
			checkItemAvailability,
			checkRegularActionData,
			clickButton,
			data,
			delay,
			delayedDisableClicked,
			delayValue,
			disableDate,
			header,
			hotword,
			enableOn,
			enableOff,
			icon,
			image,
			initialDelayValue,
			isActive,
			isEnabled,
			itemType,
			itemSubType,
			itemAvailability,
			maxSliderValue,
			minSliderValue,
			outletId,
			questionOff,
			questionOn,
			questions,
			refresher,
			regularActions,
			regularActionData,
			regularActionRandomStart,
			regularActionRandomEnd,
			relatedItems,
			saveRegularSettings,
			showRegular,
			showTimer,
			timeEnd,
			toggleRegularOptions,
			toggleSliderOptions,
			translate
		}
	}
})