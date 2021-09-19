app.component('hours-and-minutes', {
	props: ['delayValue', 'showDate', 'calculatedTime'],
	template: `
	<div style="margin: 0 auto 0 auto; text-align: center">
		<span v-if="delayValue >= 60">{{$filters.formatNumber(mathFloor(delayValue/60))}}h&nbsp;{{$filters.formatNumber(delayValue%60)}}m&nbsp;</span>
		<span v-if="!showDate && delayValue >= 0 && delayValue < 60 ">{{$filters.formatNumber(delayValue%60)}}m&nbsp;</span>
		<span v-if="showDate && delayValue < 60 ">{{$filters.formatNumber(delayValue%60)}}m&nbsp;</span>
		
		<span v-if="delayValue == 0">{{translate('default_delay')}}&nbsp;</span>
		
		<span v-if="!showDate && delayValue < 0">--&nbsp;</span>
		<span v-if="showDate && delayValue < 0">{{translate('no_delay')}}&nbsp;</span>
		
		<span v-if="showDate">&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;<a href="#" style="cursor: pointer" v-on:click="onDelayedDisableClicked()">{{translate('disable_at')}}&nbsp;{{$filters.formatDate(calculatedTime, 'HH:mm')}}</a>

		<div style="display: none">{{refresher}}</div>
	</div>
	`,
	setup(props, context) {

		const refresher = Vue.ref(true)

		const translate = function(code) {
			return automation.translate(code)
		}

		const translateAll = function() {
			refresher.value = !refresher.value
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
			getTime,
			mathFloor,
			onDelayedDisableClicked,
			refresher,
			translate
		}
	}
})