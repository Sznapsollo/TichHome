app.component('sensor-alarm-settings', {
	props: ['mode', 'outletId'],
	template: `		
	<h4>{{translate('alarm_settings')}}</h4>
	<div v-if="mode=='time'">
		<regular-settings v-if="alarmData" v-bind:outletId="outletId" v-bind:regularActionData="regularActionData" v-on:onSaveRegularSettings="saveAlarmTimeUnits">
			<div v-if="!folderSecured" class="alert alert-warning" role="alert">
				{{warning}}
			</div>
		</regular-settings>
	</div>
	<div v-if="mode=='devices'">
		<sensor-alarm-devices-settings v-if="alarmData" v-bind:outletId="outletId" v-bind:sensorDevicesData="devicesData" v-on:onSensorDevicesSettingsSave="saveAlarmDevices">
			<div v-if="!folderSecured" class="alert alert-warning" role="alert">
				{{warning}}
			</div>
		</sensor-alarm-devices-settings>
	</div>
	`,
	setup(props, context) {

		const warning = Vue.ref('')
		const alarmData = Vue.ref(null)
		const regularActionData = Vue.ref({});
		const devicesData = Vue.ref({});
		const folderSecured = Vue.ref(false);
		
		function init()
		{
			var self = this;
			sensorsDataService.checkSensorAlarmData(props.outletId,
				function(dataResponse) {
					if(dataResponse.message == 'ok') {
						var data = dataResponse.data;
						regularActionData.value.timeUnits = data.alarmTimeUnits;
						devicesData.value.onDevices = data.onAlarm;
						alarmData.value = data;
						folderSecured.value = alarmData.value.folderSecured;
					} else {
						showErrorMessage(dataResponse);
					}
				},
				function(response) {
					var error = 'Sensor Alarm data read error for ' + props.outletId;
					showErrorMessage(error)	

					self.$emit('onSensorAlarmSettingsSaved', null)
				}
			);
		};
		
		const saveAlarmTimeUnits = function(msg) {
			window.mittEmitter.emit('onSensorAlarmTimelineSave', msg)
		}
		
		const saveAlarmDevices = function(msg) {
			window.mittEmitter.emit('onSensorAlarmDevicesSave', msg)
		}
	
		const translateAll = function() {
			warning.value = automation.globalHTACCESSWarning();
		}

		function translate(code) {
			return automation.translate(code);
		}

		Vue.onMounted(function() {
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
			translateAll()
			init()
		})

		return {
			alarmData,
			devicesData,
			regularActionData,
			saveAlarmDevices,
			saveAlarmTimeUnits,
			translate,
			warning
		}
	}
})