var app = Vue.createApp({
	setup() {

		const itemsPerPage = Vue.ref(100);
		const refresher = Vue.ref(true);
		const versionTichHome = Vue.ref('');
		const showCheckLog = Vue.ref(false);
		const showCheckExcLog = Vue.ref(false)
		const themeMode = Vue.ref(tichTheme.getMode())

		const themeIcons = {auto: 'fa-adjust', light: 'fa-sun-o', dark: 'fa-moon-o'}
		const themeDefaultLabels = {auto: 'Auto', light: 'Light', dark: 'Dark'}

		const translate = function(code) {
			return automation.translate(code);
		}

		const themeIcon = function(mode) {
			return themeIcons[mode];
		}

		const themeLabel = function(mode) {
			const code = 'theme_' + mode;
			const translated = automation.translate(code);
			return translated == code ? themeDefaultLabels[mode] : translated;
		}

		const setThemeMode = function(mode) {
			tichTheme.setMode(mode);
		}

		tichTheme.onChange(function(mode) {
			themeMode.value = mode;
		});

		const translateAll = function() {
			refresher.value = !refresher.value;
		}

		Vue.onMounted(function() {
			window.mittEmitter.on('translationsReceived', function(item){
				translateAll()
			}); 
			window.mittEmitter.on('pageFlagsSet', function(item){
				showCheckLog.value = automation.pageFlag('timeDifferenceDetected')
				showCheckExcLog.value = automation.pageFlag('todayexcexists')
			}); 
			if(typeof tichHomeVersion == "string") {
				versionTichHome.value = tichHomeVersion
			}
			itemsPerPage.value = GetLocalStorage(itemsPerPageStorageName, itemsPerPageDefault);
		})

		translateAll()
		showCheckLog.value = automation.pageFlag('timeDifferenceDetected')

		return {
			itemsPerPage,
			refresher,
			showCheckLog,
			showCheckExcLog,
			setThemeMode,
			themeIcon,
			themeLabel,
			themeMode,
			themeModes,
			translate,
			versionTichHome
		}
	}
})

const themeState = Vue.reactive({ resolved: tichTheme.getResolved() });
tichTheme.onChange(function(mode, resolved) {
	themeState.resolved = resolved;
});
app.config.globalProperties.$theme = themeState;

app.mixin({
	methods: {
		graphicSrc: function(name) {
			return 'graphics/' + (this.$theme.resolved == 'dark' ? 'dark/' : '') + name;
		},
		itemIconSrc: function(image) {
			return 'graphics/icons/' + (this.$theme.resolved == 'dark' ? 'dark/' : '') + image.replace(/\.jpe?g$/i, '.png');
		},
		onItemIconError: function(event, image) {
			const fallbacks = ['graphics/icons/' + image.replace(/\.jpe?g$/i, '.png'), 'graphics/icons/' + image];
			const stage = Number(event.target.dataset.fallback || 0);
			if(stage < fallbacks.length) {
				event.target.dataset.fallback = stage + 1;
				event.target.src = fallbacks[stage];
			}
		},
		// isEmbeddedMode: function() {
		// 	return embeddedMode == true
		// }
	}
});

// NJ example use {{ $filters.currencyUSD(accountBalance) }}
app.config.globalProperties.$filters = {
	formatDate(value, format) {
		if(!value) {
			return value
		}
		if(typeof value === 'string') {
			return value
		}
		try {
			return moment(value).format(format)
		} catch(e) {
			console.warn('format date')
		}
		return value
	},
	formatNumber(value) {
		return value
	}
};