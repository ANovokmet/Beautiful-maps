import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		mapUrl: './world-map.svg'
	}
});

export default app;