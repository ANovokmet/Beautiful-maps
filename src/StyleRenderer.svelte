<script>
    import { getContext } from 'svelte';
    export let configs;
    export let countries;
    
    const { changedEvent$ } = getContext('ctx');

    function renderStyle(style, selector) {
        let res = `\n${selector} {`;
        if(style.opacity != null) {
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
        for(const key in configs) {
            const config = configs[key];
            if(config.enabled) {
                htmlString += renderStyle(config.style, `.${key}`);
            }
        }

        for(const key in countries) {
            const config = countries[key];
            if(config.enabled) {
                htmlString += renderStyle(config.style, `.${key}`);
            }
        }
        htmlString += '</style>';
    }

    $: {
        console.log('Recreating CSS', $changedEvent$);
        if($changedEvent$) {
            createCssNode($changedEvent$);
        }
    }
</script>

{@html htmlString}