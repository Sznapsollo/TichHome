app.component('sensor-devices-settings', {
	props: ['outletId', 'sensorDevicesData'],
	template: `		
	<h5>{{translate('alarm_devices_trigger')}}</h5>
	<div v-for="onDevice in onDevices" class="settingsSection" >
		<div style="display: inline-block; margin-right: 15px;">
			<button type="button" class="btn btn-default" style="color: red;" aria-label="Left Align" v-on:click="removeDevice(onDevice)" >
				<i class="fa fa-times"></i>
			</button>
		</div>
		<div style="display: inline-block;vertical-align:top;">
			<label for="device">{{translate('device')}}:</label>
			<select v-on:change="checkChanges()" class="form-control" name="device" v-model="onDevice.id">
				<option v-for="device in devicesDictionary" v-bind:value="device.id">
					{{ device.header }}
				</option>
			</select>
			<p/>
			<label for="delay">{{translate('delay')}}(s):</label>
			<input v-on:change="checkChanges()" class="form-control" name="delay" type="number" v-model="onDevice.delay" />
			<p/>
			<label for="rebound">{{translate('rebound')}}:</label>
			<input v-on:change="checkChanges()" class="form-control" name="rebound" type="number" v-model="onDevice.rebound" />
			<p/>
			<label for="dependencyMethod">{{translate('dependencyMethod')}}:</label>
			<select v-on:change="checkChanges()" class="form-control" name="dependencyMethod" v-model="onDevice.dependencyMethod">
				<option v-for="dependencyMethod in dependencyMethods" v-bind:value="dependencyMethod.value">
					{{ dependencyMethod.name }}
				</option>
			</select>
			<p/>
			<label for="dependencyOperation">{{translate('dependencyOperation')}}:</label>
			<select class="form-control" name="dependencyOperation" v-model="onDevice.dependencyOperation">
				<option v-for="dependencyOperation in dependencyOperations" v-bind:value="dependencyOperation.value">
					{{ dependencyOperation.name }}
				</option>
			</select>
			<p/>
			<label for="dependencyValue">{{translate('dependencyValue')}}:</label>
			<input v-on:change="checkChanges()" class="form-control" name="dependencyValue" type="number" v-model="onDevice.dependencyValue" />
		</div>
	</div>
	<div style="margin: 10px auto 10px auto; text-align: center">
		<p style="margin-top: 10px">
			<button type="button" class="btn btn-default" style="margin-right: 15px;" aria-label="Left Align" v-on:click="addNew()">
				<i class="fa fa-plus"></i>
			</button>
			<button type="button" v-bind:disabled="!isSaveEnabled" class="btn btn-primary" v-on:click="saveSensorDevicesSettings()" >{{translate('save')}}</button>
		</p>
	</div>
	`,
	setup(props, context) {


		const devicesDictionary = Vue.ref([]);
		const onDevices = Vue.ref([]);
		const isSaveEnabled = Vue.ref(false);
		
		const dependencyMethods = Vue.ref([{name: '', value: ''}, {name: 'Check Luminosity', value: 'checkLuminosity'}]);
		const dependencyOperations = Vue.ref([{name: '', value: ''}, {name: '>', value: 'grtr'}, {name: '<', value: 'lwr'}]);
		
		const saveSensorDevicesSettings = function() {
			this.$emit('onSaveSensorDevicesSettings', onDevices.value)
		}
		
		const addNew = function() {
			onDevices.value.push({id:null,delay:0,rebound:0,dependencyMethod:null,dependencyOperation:null,dependencyValue:null});
		}
		
		const removeDevice = function(unit) {
			
			for(var i=0; i < onDevices.value.length; i++) {
				if(unit.id == onDevices.value[i].id)
				{
					onDevices.value.splice(i, 1);
				}
			}
		}
		
		function translate(code) {
			return automation.translate(code);
		}

		const checkChanges = function() {
			isSaveEnabled.value = automation.checkRequiredFields(['id'], onDevices.value);
		}

		function init()
		{
			if(props.sensorDevicesData) {
				if(typeof props.sensorDevicesData == 'string') {
					props.sensorDevicesData = JSON.parse(props.sensorDevicesData);
				}
				
				if(props.sensorDevicesData.onDevices && props.sensorDevicesData.onDevices.length) {
					onDevices.value = props.sensorDevicesData.onDevices;
				}
			}
			
			if(onDevices.value.length == 0) {
				addNew();
			}

			checkChanges();
		};

		Vue.onMounted(function() {
			devicesDictionary.value = automation.getDevicesDictionary();
			init()
		})

		return {
			addNew,
			checkChanges,
			dependencyMethods,
			dependencyOperations,
			devicesDictionary,
			isSaveEnabled,
			onDevices,
			removeDevice,
			saveSensorDevicesSettings,
			translate
		}
	}
})