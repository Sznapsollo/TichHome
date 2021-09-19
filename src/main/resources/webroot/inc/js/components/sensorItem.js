app.component('sensor-item', {
	props: ['outletId', 'header', 'timeUnits', 'onDevices', 'customData'],
	template: `		
	<div class="sensorswitch">
		<span class="switchHeader">{{header}}</span>
		<img class="switchCalendarIcon" v-on:click="toggleRegularOptions()" v-bind:src="'graphics/' + calendarIconName" />
		<button v-if="showRegular" v-on:click="toggleRegularOptions()" type="button" class="btn btn-sm closeSubSectionButton" >
			<i class="fa fa-close"></i>
		</button>
		<img class="switchCalendarIcon" v-on:click="toggleDevicesOptions()" v-bind:src="'graphics/' + actionIconName" />
		<button v-if="showDevices" v-on:click="toggleDevicesOptions()" type="button" class="btn btn-sm closeSubSectionButton" >
			<i class="fa fa-close"></i>
		</button>
		<img v-if="canChangeAlarmSettings" class="switchCalendarIcon" v-on:click="toggleAlarmsTimeUnits()" v-bind:src="'graphics/' + alarmTimeUnitsIconName" />
		<button v-if="showAlarmTimeUnits" v-on:click="toggleAlarmsTimeUnits()" type="button" class="btn btn-sm closeSubSectionButton" >
			<i class="fa fa-close"></i>
		</button>
		<img v-if="canChangeAlarmSettings" class="switchCalendarIcon" v-on:click="toggleAlarmsDevices()" v-bind:src="'graphics/' + alarmDevicesIconName" />
		<button v-if="showAlarmDevices" v-on:click="toggleAlarmsDevices()" type="button" class="btn btn-sm closeSubSectionButton" >
			<i class="fa fa-close"></i>
		</button>
	</div>

	<div v-bind:class="{'sub-section': showRegular || showDevices || showAlarmTimeUnits || showAlarmDevices}">
		<regular-settings v-if="showRegular" v-bind:outletId="outletId" v-bind:regularActionData="regularActionData" v-on:onSaveRegularSettings="saveRegularSettings" ></regular-settings>

		<sensor-devices-settings v-if="showDevices" v-bind:outletId="outletId" v-bind:sensorDevicesData="sensorDevicesData" v-on:onSaveSensorDevicesSettings="saveSensorDevicesSettings"></sensor-devices-settings>

		<sensor-alarm-settings v-if="showAlarmTimeUnits" v-bind:mode="'time'" v-bind:outletId="outletId" ></sensor-alarm-settings>

		<sensor-alarm-settings v-if="showAlarmDevices" v-bind:mode="'devices'" v-bind:outletId="outletId" ></sensor-alarm-settings>
	</div>
	<div style="text-align: center" v-if="showRegular || showDevices || showAlarmTimeUnits || showAlarmDevices" v-on:click="confirmAction()">{{translate('reset')}}</div>
	`,
	setup(props, context) {

		const refresher = Vue.ref(true)
		
		const calendarIconName = Vue.ref(automation.getIcon('calendar',''));
		const actionIconName = Vue.ref(automation.getIcon('action',''));
		const alarmTimeUnitsIconName = Vue.ref(automation.getIcon('alarmTimeUnits',''));
		const alarmDevicesIconName = Vue.ref(automation.getIcon('alarmDevices',''));
		
		const showRegular = Vue.ref(false);
		const showDevices = Vue.ref(false);
		const showAlarmTimeUnits = Vue.ref(false);
		const showAlarmDevices = Vue.ref(false);
		const regularActionData = Vue.ref({});
		const sensorDevicesData = Vue.ref({});
		
		const canChangeAlarmSettings = Vue.ref(false)
		
		init();
		
		function toggleAll(show) {
			showRegular.value = show;
			showDevices.value = show;
			showAlarmTimeUnits.value = show;
			showAlarmDevices.value = show;
		}
		
		function toggleRegularOptions() {
			if(showRegular.value) {
				toggleAll(false);
				return;
			}
			toggleAll(false);
			showRegular.value = true;
		}
		
		function toggleDevicesOptions() {
			if(showDevices.value) {
				toggleAll(false);
				return;
			}
			toggleAll(false);
			showDevices.value = true;
		}
		
		function toggleAlarmsTimeUnits() {
			if(showAlarmTimeUnits.value) {
				toggleAll(false);
				return;
			}
			toggleAll(false);
			showAlarmTimeUnits.value = true;
		}
		
		function toggleAlarmsDevices() {
			if(showAlarmDevices.value) {
				toggleAll(false);
				return;
			}
			toggleAll(false);
			showAlarmDevices.value = true;
		}
		
		function init()
		{
			if(props.timeUnits !== undefined && props.timeUnits.length > 0) {
				if(typeof props.timeUnits == 'string') {
					regularActionData.value.timeUnits = JSON.parse(props.timeUnits);
				} else {
					regularActionData.value.timeUnits = props.timeUnits;
				}
			}
			
			if(props.customData) {
				calendarIconName.value = automation.getIcon('calendar','_enabled');
				actionIconName.value = automation.getIcon('action','_enabled');
			}
				
			if(props.onDevices !== undefined && props.onDevices.length > 0) {
				if(typeof props.onDevices == 'string') {
					sensorDevicesData.value.onDevices = JSON.parse(props.onDevices);
				} else {
					sensorDevicesData.value.onDevices = props.onDevices;
				}
			}
		};
		
		function resetSensorData() {
			toggleAll(false)
			
			sensorsDataService.setSensorTimelineData(props.outletId, null,
				function(dataResponse) {
					if(dataResponse.message == 'ok') {
						window.location.reload();
					} else {
						showErrorMessage(dataResponse);
					}
				},
				function(response) {
					var error = 'Regular action data clear error for ' + props.outletId;
					showErrorMessage(error)	
				}
			);
		}
		
		const saveRegularSettings = function(msg) {
			toggleAll(false)
			sensorsDataService.setSensorTimelineData(props.outletId, msg,
				function(dataResponse) {
					if(dataResponse.message == 'ok') {
						window.location.reload();
					} else {
						showErrorMessage(dataResponse);
					}
				},
				function(response) {
					var error = 'Regular action data set error for ' + props.outletId;
					showErrorMessage(error)	
				}
			);
		}
		
		const saveSensorDevicesSettings = function(msg) {
			toggleAll(false)
			sensorsDataService.setSensorDevicesData(props.outletId, msg, 
				function(dataResponse) {
					if(dataResponse.message == 'ok') {
						window.location.reload();
					} else {
						showErrorMessage(dataResponse);
					}
				},
				function(response) {
					var error = 'Devices data set error for ' + props.outletId;
					showErrorMessage(error)	
				}
			);
		}
		
		const sensorAlarmSettingsSaved = function(msg) {
			toggleAll(false)
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
			window.mittEmitter.on('pageFlagsSet', function(item){
				canChangeAlarmSettings.value = automation.pageFlag('canChangeAlarmSettings')
			}); 
			window.mittEmitter.on('onSensorAlarmTimelineSave', function(alarmTimeline){
				sensorsDataService.setSensorAlarmTimelineData(props.outletId, alarmTimeline,
					function(dataResponse) {
						if(dataResponse.message == 'ok') {
							toggleAll(false)
						} else {
							showErrorMessage(dataResponse);
						}
					},
					function(response) {
						var error = 'Alarm Timeline data set error for ' + props.outletId;
						showErrorMessage(error)	
					}
				);
			}); 
			window.mittEmitter.on('onSensorAlarmDevicesSave', function(alarmDevices){
				sensorsDataService.setSensorAlarmDevicesData(props.outletId, alarmDevices,
					function(dataResponse) {
						if(dataResponse.message == 'ok') {
							toggleAll(false)
						} else {
							showErrorMessage(dataResponse);
						}
					},
					function(response) {
						var error = 'Alarm Devices data set error for ' + props.outletId;
						showErrorMessage(error)	
					}
				);
			}); 
			translateAll();
			canChangeAlarmSettings.value = automation.pageFlag('canChangeAlarmSettings')
			init();
		})

		const confirmAction = function() {
			var r = confirm(translate('careful'));
			if (r == true) {
				resetSensorData()
			}
		}

		return {
			actionIconName,
			alarmDevicesIconName,
			alarmTimeUnitsIconName,
			calendarIconName,
			canChangeAlarmSettings,
			confirmAction,
			refresher,
			regularActionData,
			sensorDevicesData,
			saveSensorDevicesSettings,
			saveRegularSettings,
			sensorAlarmSettingsSaved,
			showAlarmDevices,
			showAlarmTimeUnits,
			showDevices,
			showRegular,
			toggleAlarmsDevices,
			toggleAlarmsTimeUnits,
			toggleDevicesOptions,
			toggleRegularOptions,
			translate
		}
	}
})