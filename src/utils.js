

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