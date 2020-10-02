<script>
    import { getContext } from 'svelte';
    import PaletteInput from './PaletteInput.svelte';
    export let config;
    export let selector;

    const { onChanged } = getContext('ctx');
    $: {
        requestAnimationFrame(() => {
            onChanged({
                id: config.id,
                config: config,
                style: config.style
            });
        })
    }

    let options = [
        {
            label: 'Opacity',
            styleProperty: 'opacity',
            type: 'range',
            min: 0,
            max: 1,
            step: 0.1
        },
        {
            label: 'Fill',
            styleProperty: 'fill',
            type: 'palette'
        },
        {
            label: 'Stroke',
            styleProperty: 'stroke',
            type: 'color'
        },
        {
            label: 'Stroke width',
            styleProperty: 'stroke-width',
            type: 'range',
            min: 0,
            max: 4,
            step: 0.1
        }
    ];
    $: {
        if(config.options) {
            options = config.options;
        }
    }
</script>

<style>
    .form-pair {
        display: flex;
    }

    .form-pair [type="number"] {
        width: 30%;
    }
</style>

<div class="form">
    <div class="form-group">
        <label class="form-switch">
            <input type="checkbox" bind:checked={config.enabled}>
            <i class="form-icon"></i><h6 title="{selector}">{config.hint}</h6>
        </label>
    </div>
    {#each options as opt}
        <div class="form-group">
            <label class="form-label label-sm">{opt.label}</label>
            {#if opt.type === 'range'}
                <div class="form-pair">
                    <input class="form-input input-sm" type="range" bind:value={config.style[opt.styleProperty]} min="{opt.min}" max="{opt.max}" step="{opt.step}">
                    <input class="form-input input-sm" type="number" bind:value={config.style[opt.styleProperty]} min="{opt.min}" max="{opt.max}" step="{opt.step}">
                </div>
            {:else if opt.type === 'palette'}
                <input class="form-input input-sm" type="color" bind:value={config.style[opt.styleProperty]}>
                <PaletteInput selected={config.style[opt.styleProperty]} on:select="{e => config.style[opt.styleProperty] = e.detail.color}"></PaletteInput>
            {:else if opt.type === 'color'}
                <input class="form-input input-sm" type="color" bind:value={config.style[opt.styleProperty]}>
            {/if}
        </div>
    {/each}
</div>