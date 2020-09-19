<script>
    import { getContext, onMount } from 'svelte';

    let styleContainer;
    let styleMap = {};

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
        res += '\n}'
        return res;
    }

    let htmlString;
    function createCssNode() {
        htmlString = '<style>';
        for(const key in classes) {
            const config = classes[key];
            htmlString += renderStyle(config.style, `.${key}`, config.enabled);
        }

        for(const key in countries) {
            const config = countries[key];
            htmlString += renderStyle(config.style, `.${key}`, config.enabled);
        }
        htmlString += '</style>';
    }

    let mounted = false;
    onMount(() => {
        mounted = true;
        for(const key in classes) {
            const config = classes[key];
            create(config);
        }
    })

    function create(config) {
        if(!config.styleElement) {
            config.styleElement = document.createElement('style');
            styleContainer.appendChild(config.styleElement);
        }
        config.styleElement.innerHTML = renderStyle(config.style, `.${config.id}`, config.enabled)
    }

    $: {
        //console.log('Recreating CSS', $changedEvent$);
        if(mounted && $changedEvent$) {
            //createCssNode();
            create($changedEvent$.config);
        }
    }
</script>

<!-- {@html htmlString} -->

<div class="styles" bind:this={styleContainer}></div>