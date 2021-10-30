app.component('results-modal', {
	template: `
	<div class="modal fade" id="showTextModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
				<h5 class="modal-title" id="showTextModalTitle" v-html="title">&nbsp;</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<div class="modal-text" v-html="content">
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-bs-dismiss="modal">{{translate('close')}}</button>
				</div>
			</div>
		</div>
		<div style="display: none">{{refresher}}</div>
	</div>`,
	setup(props, context) {
		
		const title = Vue.ref('')
		const content = Vue.ref('')
		const refresher = Vue.ref(true)
		
		const translate = function(code) {
			return automation.translate(code)
		}

		const translateAll = function() {
			refresher.value = !refresher.value
		}

		Vue.onMounted(function() {
			translateAll()
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
			window.mittEmitter.on('showResultsModal', function(args){
				
				title.value = args.title || ''
				content.value = args.content || ''

				$('#showTextModal').modal('show');
			});
		})

		return {
			content,
			refresher,
			title,
			translate
		}
	}
});
