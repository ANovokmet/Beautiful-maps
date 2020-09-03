<script>
    import { createEventDispatcher, getContext } from 'svelte';

    export let config;
    let url;

    const dispatch = createEventDispatcher();
    const { onChanged } = getContext('ctx');

    function apply() {
        if(url) {
            dispatch('apply', { config, url });
            url = '';
        } else {
            console.error('No url entered');
        }
    }

    function remove() {
        if(config) {

        }
    }

    function changeScale(scale) {
        const image = config.imageElement;

        const width = config.imageOriginalWidth * scale;
        const height = config.imageOriginalHeight * scale;

        const x = config.imageOriginX - width / 2;
        const y = config.imageOriginY - height / 2;
        
        image.setAttribute('x', x);
        image.setAttribute('y', y);
        image.setAttribute('width', width);
        image.setAttribute('height', height);
    }

    function changeKeepRatio(keepRatio) {
        const image = config.imageElement;

        if(keepRatio) {
            image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        } else {
            image.setAttribute('preserveAspectRatio', 'none');
            config.scale = 1;
        }
    }

    $: {
        if(config.imageElement) {
            changeKeepRatio(config.keepRatio);
            changeScale(config.scale);
        }
    }
</script>

<style>
    .img-container {
        width: 100%;
        height: 100px;
    }
    img {
        max-width: 100%;
        max-height: 100%;
    }

    .btns-apart {
        display: flex;
        justify-content: space-between;
    }
    
    .form-pair {
        display: flex;
    }
</style>

<div class="form">
    {#if config.appliedImageHref}
        <div class="img-container">
            <img src="{config.appliedImageHref}" alt="image preview">
        </div>
        <div class="form-group">
            <label class="form-label label-sm">scale</label>
            <div class="form-pair">
                <input class="form-input input-sm" type="range" bind:value={config.scale} min="0" max="4" step="0.1">
                <input class="form-input input-sm" type="number" bind:value={config.scale} min="0" max="4" step="0.1">
            </div>
        </div>
        <div class="form-group">
            <label class="form-checkbox label-sm">
                <input type="checkbox" bind:checked={config.keepRatio}>
                <i class="form-icon"></i> keep ratio
            </label>
        </div>
    {/if}
    <div class="form-group">
        <label class="form-label label-sm">image url</label>
        <div class="form-pair">
            <input class="form-input input-sm" type="text" bind:value={url}>
        </div>
    </div>
    <div class="btns-apart">
        <button class="btn btn-primary" on:click={apply}>Apply</button>
        {#if config.appliedImageHref}
        <button class="btn btn-primary" on:click={remove}>Remove</button>
        {/if}
    </div>
</div>