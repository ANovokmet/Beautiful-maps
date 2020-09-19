<script>
    import { getContext } from 'svelte';
    import PaletteInput from './PaletteInput.svelte';
    export let config;
    export let selector;

    const { onChanged } = getContext('ctx');
    
    const defaults = {
        opacity: 1,
        fill: '#cccccc',
        'fill-opacity': 1,
        stroke: '#ffffff',
        'stroke-width': 0.5
    };

	function onFillSelected(event) {
        config.style.fill = event.detail.color;
    }
    
    $: {
        // console.log('onCHanged', config.id)
        requestAnimationFrame(() => {

            onChanged({
                id: config.id,
                config: config,
                style: config.style
            });
        })
    }
</script>

<style>
    .form-pair {
        display: flex;
    }
</style>

<div class="form">
    <div class="form-group">
        <label class="form-switch">
            <input type="checkbox" bind:checked={config.enabled}>
            <i class="form-icon"></i><h6 title="{config.hint}">{selector}</h6>
        </label>
    </div>
    <div class="form-group">
        <label class="form-label label-sm">opacity</label>
        <div class="form-pair">
            <input class="form-input input-sm" type="range" bind:value={config.style.opacity} min="0" max="1" step="0.1">
            <input class="form-input input-sm" type="number" bind:value={config.style.opacity} min="0" max="1" step="0.1">
        </div>
    </div>
    <div class="form-group">
        <label class="form-label label-sm">fill</label>
        <input class="form-input input-sm" type="color" bind:value={config.style.fill}>
        <PaletteInput selected={config.style.fill} on:select="{e => onFillSelected(e)}"></PaletteInput>
    </div>
    <div class="form-group">
        <label class="form-label label-sm">stroke</label>
        <input class="form-input input-sm" type="color" bind:value={config.style.stroke}>
    </div>
    <div class="form-group">
        <label class="form-label label-sm">strokeWidth</label>
        <div class="form-pair">
            <input class="form-input input-sm" type="range" bind:value={config.style['stroke-width']} min="0" max="4" step="0.1">
            <input class="form-input input-sm" type="number" bind:value={config.style['stroke-width']} min="0" max="4" step="0.1">
        </div>
    </div>
</div>