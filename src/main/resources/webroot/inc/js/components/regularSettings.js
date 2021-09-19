app.component('regular-settings', {
	props: ['outletId', 'regularActionData', 'randomEnabled'],
	template: `
	<div class="regularSettings">
		<slot></slot>
		<i v-if="dataLoading" class="fa fa-spinner fa-spin"></i>
		<div v-for="(timeUnit, index) in timeUnits">
			<div class="btn-group d-flex"  aria-label="...">
				<div class="btn-group w-100" role="group" v-for="(n, index) in [0,1,2,3,4,5,6]">
					<button type="button" v-bind:class="{'btn-info': isSetDay(timeUnit, n)}" class="btn btn-default w-100" v-on:click="toggleDay(timeUnit, n)" >{{translate('day'+(n+1))}}</button>
				</div>
			</div>
			<div class="form-inline" style="margin: 10px auto 10px auto; text-align: center; margin-top: 10px;">
				<button type="button" class="btn btn-default" style="margin-right: 10px; color: red;" aria-label="Left Align" v-on:click="removeUnit(timeUnit)" v-if="timeUnits.length > 1">
					<i class="fa fa-times"></i>
				</button>
				<input type="time" v-model="timeUnit.timeStart" name="time_start" class="timeInputField">&nbsp-&nbsp<input type="time" v-model="timeUnit.timeEnd" name="time_end" class="timeInputField">
			</div>
			<div v-if="randomEnabled" class="checkbox" style="margin: 10px auto 10px auto; text-align: center; margin-top: 10px;">
				<label class="checkbox-inline"><input type="checkbox" v-model="timeUnit.random" style="margin-right: 10px">{{translate('itemRandom')}}</label>
			</div>
		</div>
		<div style="margin: 10px auto 10px auto; text-align: center">
			<p style="margin-top: 10px">
				<button type="button" class="btn btn-default" style="margin-right: 15px;" aria-label="Left Align" v-on:click="addNew()">
					<i class="fa fa-plus"></i>
				</button>
				<button type="button" :disabled="!isSaveEnabled()" class="btn btn-primary" v-on:click="onSaveRegularSettings()" >{{translate('save')}}</button>
			</p>
		</div>
	</div>
	`,
	setup(props, context) {

		const timeUnits = Vue.ref([])
		const dataLoading = Vue.ref(false)

		const onSaveRegularSettings = function() {
			var timeLine = '';

			for(var i=0; i < timeUnits.value.length; i++) {
				if(timeUnits.value[i].timeStart && !isNaN(getTimeNumber(timeUnits.value[i].timeStart, 'hour')))
					timeLine += getTimeNumber(timeUnits.value[i].timeStart, 'hour')+":"+getTimeNumber(timeUnits.value[i].timeStart, 'minute');
				timeLine += '#';
				if(timeUnits.value[i].timeEnd && !isNaN(getTimeNumber(timeUnits.value[i].timeEnd, 'hour')))
					timeLine += getTimeNumber(timeUnits.value[i].timeEnd, 'hour')+":"+getTimeNumber(timeUnits.value[i].timeEnd, 'minute');
				timeLine += '#';
				timeLine += timeUnits.value[i].daysOfWeek;
				if(props.randomEnabled) {
					timeLine += '#';
					if(timeUnits.value[i].random)
						timeLine += 'true';
					else
						timeLine += 'false';
				}
				timeLine += '|';
			}

			this.$emit('onSaveRegularSettings', timeLine)
		};

		const addNew = function() {
			timeUnits.value.push({timeStart:"00:00",timeEnd:"00:00",daysOfWeek:''});
		}
		
		const removeUnit = function(unit) {
			
			for(var i=0; i < timeUnits.value.length; i++) {
				if(unit.daysOfWeek == timeUnits.value[i].daysOfWeek && unit.timeStart == timeUnits.value[i].timeStart && unit.timeEnd == timeUnits.value[i].timeEnd)
				{
					timeUnits.value.splice(i, 1);
				}
			}
		};

		const toggleDay = function(timeUnit, value) {
			value = String(value);
			var daysOfWeek = timeUnit.daysOfWeek.split(',')
			
			if(daysOfWeek.indexOf(value) >= 0)
			{
				for(var i = daysOfWeek.length; i--;){
					if (daysOfWeek[i] == value) daysOfWeek.splice(i, 1);
				}
			}
			else
				daysOfWeek.push(value);
				
				
			timeUnit.daysOfWeek = daysOfWeek.join(',');
		};

		const isSetDay = function(timeUnit, value) {
			value = String(value);
			if(timeUnit.daysOfWeek.split(',').indexOf(value) >= 0)
				return true;
			else
				return false;
		};

		function getTimeNumber(value, dataType) {
			if(!value || !dataType) {
				return null
			}
			
			var dateParts = []
			if(typeof value === 'string') {
				dateParts = value.split(":")
				if(dateParts.length != 2) {
					dateParts = []
				}
			} else if(typeof value === 'object' && value.getHours) {
				dateParts.push(value.getHours())
				dateParts.push(value.getMinutes())
			}

			if(dateParts.length != 2) {
				return null
			}

			switch(dataType) {
				case 'hour':
					return dateParts[0]
					break
				case 'minute':
					return dateParts[1]
					break
			}
			return null
		}

		const isSaveEnabled = function() {
			
			var valid = true;
			
			for(var i=0; i < timeUnits.value.length; i++) {
				if(timeUnits.value[i].timeStart || timeUnits.value[i].timeEnd) {
					if(timeUnits.value[i].timeStart && timeUnits.value[i].timeEnd) {
						if(getTimeNumber(timeUnits.value[i].timeEnd, 'hour') < getTimeNumber(timeUnits.value[i].timeStart, 'hour')) {
							valid = false;
							break;
						}
						else if(getTimeNumber(timeUnits.value[i].timeEnd, 'hour') == getTimeNumber(timeUnits.value[i].timeStart, 'hour') && (getTimeNumber(timeUnits.value[i].timeEnd, 'minute') <= getTimeNumber(timeUnits.value[i].timeStart, 'minute'))) {
							valid = false;
							break;
						}
					}
				}
				else {
					valid = false;
					break;
				}
			}
			
			return valid;
		};

		const init = function()
		{
			if(typeof props.regularActionData == 'string') {
				props.regularActionData = JSON.parse(props.regularActionData);
			}
			dataLoading.value = true;
			if(props.regularActionData && props.regularActionData.timeUnits) {
				props.regularActionData.timeUnits.forEach(function(element, index) { 
					var startHour = getTimeNumber(element.timeStart, 'hour')
					var startMinute = getTimeNumber(element.timeStart, 'minute')

					startHour = startHour ? startHour : 0
					startMinute = startMinute ? startMinute : 0
					var timeStart = (startHour).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + ':' + (startMinute).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})

					var endHour = getTimeNumber(element.timeEnd, 'hour')
					var endMinute = getTimeNumber(element.timeEnd, 'minute')

					endHour = endHour ? endHour : 0
					endMinute = endMinute ? endMinute : 0
					var timeEnd = (endHour).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + ':' + (endMinute).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})
					
					timeUnits.value.push({timeStart:timeStart,timeEnd:timeEnd,daysOfWeek:element.daysOfWeek,random:element.random});
				});
			}
			
			if(timeUnits.value.length == 0) {
				addNew();
			}
			dataLoading.value = false;
		};

		const translate = function(code) {
			return automation.translate(code);
		};

		init();

		return {
			addNew,
			isSaveEnabled,
			isSetDay,
			onSaveRegularSettings,
			removeUnit,
			timeUnits,
			toggleDay,
			translate
		}
	}
})