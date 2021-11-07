app.component('hours-and-minutes', {
	props: ['delayValue', 'showDate', 'calculatedTime', 'minSliderValue', 'maxSliderValue'],
	template: `
	<div style="margin: 0 auto 0 auto; text-align: center">
		<span v-if="delayValue >= 60">{{$filters.formatNumber(mathFloor(delayValue/60))}}h&nbsp;{{$filters.formatNumber(delayValue%60)}}m&nbsp;</span>
		<span v-if="!showDate && delayValue >= 0 && delayValue < 60 ">{{$filters.formatNumber(delayValue%60)}}m&nbsp;</span>
		<span v-if="showDate && delayValue < 60 ">{{$filters.formatNumber(delayValue%60)}}m&nbsp;</span>
		
		<span v-if="delayValue == 0">{{translate('default_delay')}}&nbsp;</span>
		
		<span v-if="!showDate && delayValue < 0">--&nbsp;</span>
		<span v-if="showDate && delayValue < 0">{{translate('no_delay')}}&nbsp;</span>
		
		<span v-if="showDate">&nbsp;&nbsp;|&nbsp;&nbsp;<a href="#" style="cursor: pointer" v-on:click="onDelayedDisableClicked()">{{translate('disable_at')}}&nbsp;{{$filters.formatDate(calculatedTime, 'HH:mm')}}</a></span>

		<span v-if="showDate">&nbsp;&nbsp;|&nbsp;&nbsp;
			<input type="number" v-model="delayMinutes" v-on:change="onChangeMinutes()" min="{{minSliderValue}}" max="{{maxSliderValue}}" data-min="0" style="width: 70px;" class="timeInputField" /> &nbsp; (m)
		</span>

		<span v-if="showDate">&nbsp;&nbsp;|&nbsp;&nbsp;
			<input v-model="delayTillTime" v-on:change="onChangeTillTime()" type="time" name="delayTillTime" class="timeInputField">
		</span>

		<div style="display: none">{{refresher}}</div>
	</div>
	`,
	setup(props, context) {

		const refresher = Vue.ref(true)
		const delayMinutes = Vue.ref(0)
		const delayTillTime = Vue.ref(null)

		const translate = function(code) {
			return automation.translate(code)
		}

		const translateAll = function() {
			refresher.value = !refresher.value
		}

		const onDelayedDisableClicked = function() {
			this.$emit('onDelayedDisableClicked')
		}

		const onChangeMinutes = function() {
			this.$emit('onChangeMinutes', delayMinutes.value)
		}

		const onChangeTillTime = function() {
			// NJ got to calculate minutes from now
			// console.log(delayTillTime.value)

			var endHour = getTimeNumber(delayTillTime.value, 'hour')
			var endMinute = getTimeNumber(delayTillTime.value, 'minute')

			endHour = endHour
			endMinute = endMinute
			
			if(endHour == null || endMinute == null) {
				// something is not right
				return
			}

			endHour = parseInt(endHour)
			endMinute = parseInt(endMinute)

			var dateReference = new Date();
			var dateTill = new Date()
			dateTill.setHours(endHour, endMinute, 0)
			
			var diff =(dateTill.getTime() - dateReference.getTime()) / 1000;
			diff /= 60;
			// console.log(Math.round(diff));

			diff = Math.max(diff, 0)

			this.$emit('onChangeMinutes', diff)
		}

		const mathFloor = function(number) {
			return Math.floor(number);
		}
		
		const getTime = function() {
			var date = new Date();
			return date;
		}

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

		const transformTimeDataToStringInput = function(inputData) {
			var endHour = getTimeNumber(inputData, 'hour')
			var endMinute = getTimeNumber(inputData, 'minute')

			endHour = endHour
			endMinute = endMinute
			var timeEnd
			
			if(endHour != null && endMinute != null) {
				timeEnd = (endHour).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + ':' + (endMinute).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})
			}
			return timeEnd
		}

		Vue.onMounted(function() {
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
			delayMinutes.value = props.delayValue
			delayTillTime.value = transformTimeDataToStringInput(props.calculatedTime)
		})

		Vue.watch(
			() => [props.delayValue, props.calculatedTime],
			async (newArgs) => {
				delayMinutes.value = props.delayValue
				delayTillTime.value = transformTimeDataToStringInput(props.calculatedTime)
			})

		translateAll() 

		return {
			delayMinutes,
			delayTillTime,
			getTime,
			mathFloor,
			onChangeMinutes,
			onChangeTillTime,
			onDelayedDisableClicked,
			refresher,
			translate
		}
	}
})