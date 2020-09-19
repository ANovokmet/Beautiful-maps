<script>
    import { getContext, onMount } from 'svelte';

    let styleContainer;
    
    export let classes;
    export let countries;
    
    const { changedEvent$ } = getContext('ctx');

    function renderStyle(style, selector, display) {
        let res = `\n${selector} {`;
        if(!display) {
            res += `\nopacity: 0;`;
        } else if(style.opacity != null) {
            res += `\nopacity: ${style.opacity};`
        }
        if(style.fill) {
            res += `\nfill: ${style.fill};`
        }
        if(style.stroke) {
            res += `\nstroke: ${style.stroke};`
        }
        if(style['stroke-width'] != null) {
            res += `\nstroke-width: ${style['stroke-width']};`
        }
        if(style.r != null) {
            res += `\nr: ${style.r};`
        }
        res += '\n}'
        return res;
    }

    let mounted = false;
    onMount(() => {
        mounted = true;
        for(const key in classes) {
            create(classes[key]);
        }
    })

    function create(config) {
        if(!config.styleElement) {
            config.styleElement = document.createElement('style');
            styleContainer.appendChild(config.styleElement);
        }
        config.styleElement.innerHTML = renderStyle(config.style, `.${config.id}`, config.enabled)
    }

    export function renderAll(countries, classes) {
        for(const key in countries) {
            create(countries[key]);
        }

        for(const key in classes) {
            create(classes[key]);
        }
    }

    $: {
        if(mounted && $changedEvent$) {
            console.log('Rendering...', $changedEvent$);
            create($changedEvent$.config);
        }
    }
</script>

<div class="styles" bind:this={styleContainer}></div>