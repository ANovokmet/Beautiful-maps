

export function delegated(fn) {
    return function (event) {
        let target = event.target.closest('[data-country]');
        if (target && target.dataset['country']) {
            fn(target, event);
        }
    };
}


export async function loadSvg(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'image/svg+xml');
        const svg = doc.getElementsByTagName('svg')[0];
        return svg;
    } catch(err) {
        console.error('Failed to fetch page: ', err);
    }
}

export function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var ctx = this, args = arguments;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			timeout = null;
			if (!immediate) func.apply(ctx, args);
		}, wait);
		if (immediate && !timeout) func.apply(ctx, args);
	};
}