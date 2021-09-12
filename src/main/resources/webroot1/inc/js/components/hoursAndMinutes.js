app.component('hours-and-minutes', {
	props: ['delayValue', 'showDate', 'calculatedTime'],
	template: `
	<div style="margin: 0 auto 0 auto; text-align: center">
		<span v-if="delayValue >= 60">{{$filters.formatNumber(mathFloor(delayValue/60))}}h&nbsp;{{$filters.formatNumber(delayValue%60)}}m&nbsp;</span>
		<span v-if="!showDate && delayValue >= 0 && delayValue < 60 ">{{$filters.formatNumber(delayValue%60)}}m&nbsp;</span>
		<span v-if="showDate && delayValue < 60 ">{{$filters.formatNumber(delayValue%60)}}m&nbsp;</span>
		
		<span v-if="delayValue == 0">{{defaultDelayLabel}}&nbsp;</span>
		
		<span v-if="!showDate && delayValue < 0">--&nbsp;</span>
		<span v-if="showDate && delayValue < 0">{{noDelayLabel}}&nbsp;</span>
		
		<span v-if="showDate">&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;<a href="#" style="cursor: pointer" v-on:click="onDelayedDisableClicked()">{{disableAtLabel}}&nbsp;{{$filters.formatDate(calculatedTime, 'HH:mm')}}</a>
	</div>
	`,
	setup(props, context) {


		// delayValue: '=',
		// showDate: '@',
		// calculatedTime: '=',
		// onDelayedDisableClicked:'&'

		const defaultDelayLabel = Vue.ref('default_delay')
		const noDelayLabel = Vue.ref('no_delay')
		const disableAtLabel = Vue.ref('disable_at')

		const translateAll = function() {
			defaultDelayLabel.value = automation.translate('default_delay');
			noDelayLabel.value = automation.translate('no_delay')
			disableAtLabel.value = automation.translate('disable_at')
		}

		const onDelayedDisableClicked = function() {
			this.$emit('onDelayedDisableClicked')
		}

		const mathFloor = function(number) {
			return Math.floor(number);
		};
		;
		
		const getTime = function() {
			var date = new Date();
			return date;
		}

		Vue.onMounted(function() {
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
		})

		translateAll() 

		return {
			defaultDelayLabel,
			disableAtLabel,
			getTime,
			mathFloor,
			noDelayLabel,
			onDelayedDisableClicked
		}
	}
})