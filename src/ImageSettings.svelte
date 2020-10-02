<script>
    import { createEventDispatcher, getContext } from 'svelte';

    export let imageConfig;
    let url;

    const dispatch = createEventDispatcher();

    function apply() {
        if(url) {
            dispatch('apply', { imageConfig, url });
            url = '';
        } else {
            console.error('No url entered');
        }
    }

    function remove() {
        if(imageConfig) {
            dispatch('remove', { imageConfig });
        }
    }

    function changeScale(scale) {
        const image = imageConfig.imageElement;
        console.log(imageConfig)

        const width = imageConfig.originalWidth * scale;
        const height = imageConfig.originalHeight * scale;

        const x = imageConfig.originX - width / 2;
        const y = imageConfig.originY - height / 2;
        
        image.setAttribute('x', x);
        image.setAttribute('y', y);
        image.setAttribute('width', width);
        image.setAttribute('height', height);
    }

    function changeKeepRatio(keepRatio) {
        const image = imageConfig.imageElement;

        if(keepRatio) {
            image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        } else {
            image.setAttribute('preserveAspectRatio', 'none');
            imageConfig.scale = 1;
        }
    }

    $: {
        if(imageConfig) {
            changeScale(imageConfig.scale);
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
    {#if imageConfig}
        <div class="img-container">
            <img src="{imageConfig.href}" alt="image preview">
        </div>
        <div class="form-group">
            <label class="form-label label-sm">Scale</label>
            <div class="form-pair">
                <input class="form-input input-sm" type="range" bind:value={imageConfig.scale} min="0" max="4" step="0.1">
                <input class="form-input input-sm" type="number" bind:value={imageConfig.scale} min="0" max="4" step="0.1">
            </div>
        </div>
        <div class="form-group">
            <label class="form-checkbox label-sm" title="If checked, image will keep its original height:width ratio.">
                <input type="checkbox" bind:checked={imageConfig.keepRatio} on:change={e => changeKeepRatio(e.target.checked)}>
                <i class="form-icon"></i> Keep ratio
            </label>
        </div>
    {/if}
    <div class="form-group">
        <label class="form-label label-sm">Image URL</label>
        <div class="form-pair">
            <input class="form-input input-sm" type="text" bind:value={url}>
        </div>
    </div>
    <div class="btns-apart">
        <button class="btn btn-primary" on:click={apply}>Apply</button>
        {#if imageConfig}
        <button class="btn btn-primary" on:click={remove}>Remove</button>
        {/if}
    </div>
</div>