var themeModes = ['auto', 'light', 'dark'];
var themeModeStorageName = 'themeMode';

var tichTheme = (function() {
	var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
	var listeners = [];

	function readMode() {
		try {
			var stored = localStorage.getItem(themeModeStorageName);
			if(themeModes.indexOf(stored) >= 0) {
				return stored;
			}
		} catch(e) {}
		return 'auto';
	}

	var mode = readMode();

	function resolve() {
		if(mode == 'auto') {
			return darkQuery && darkQuery.matches ? 'dark' : 'light';
		}
		return mode;
	}

	function apply() {
		var resolved = resolve();
		var root = document.documentElement;
		root.setAttribute('data-theme', resolved);
		root.setAttribute('data-theme-mode', mode);
		root.style.colorScheme = resolved;
		listeners.forEach(function(listener) {
			listener(mode, resolved);
		});
	}

	function onSystemChange() {
		if(mode == 'auto') {
			apply();
		}
	}

	if(darkQuery) {
		if(darkQuery.addEventListener) {
			darkQuery.addEventListener('change', onSystemChange);
		} else if(darkQuery.addListener) {
			darkQuery.addListener(onSystemChange);
		}
	}

	window.addEventListener('storage', function(event) {
		if(event.key == themeModeStorageName) {
			mode = readMode();
			apply();
		}
	});

	apply();

	return {
		getMode: function() {
			return mode;
		},
		getResolved: resolve,
		setMode: function(newMode) {
			mode = themeModes.indexOf(newMode) >= 0 ? newMode : 'auto';
			try {
				localStorage.setItem(themeModeStorageName, mode);
			} catch(e) {}
			apply();
		},
		cycle: function() {
			this.setMode(themeModes[(themeModes.indexOf(mode) + 1) % themeModes.length]);
		},
		onChange: function(listener) {
			listeners.push(listener);
		}
	};
})();
