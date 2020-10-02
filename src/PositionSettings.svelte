<script>
    import { createEventDispatcher } from "svelte";

    export let scale;
    export let x;
    export let y;

    export let width;
    export let height;
    export let autosave = true;


    const dispatch = createEventDispatcher();
</script>

<div class="form-horizontal">
    <div class="form-group">
        <div class="col-3 col-sm-12"><label class="form-label label-sm">Scale</label></div>
        <div class="col-9 col-sm-12"><input class="form-input input-sm" type="number" bind:value={scale} step="any"></div>
    </div>
    <div class="form-group">
        <div class="col-3 col-sm-12"><label class="form-label label-sm">X</label></div>
        <div class="col-9 col-sm-12"><input class="form-input input-sm" type="number" bind:value={x} step="any"></div>
    </div>
    <div class="form-group">
        <div class="col-3 col-sm-12"><label class="form-label label-sm">Y</label></div>
        <div class="col-9 col-sm-12"><input class="form-input input-sm" type="number" bind:value={y} step="any"></div>
    </div>

    <div class="divider"></div>

    <div class="form-group">
        <div class="col-3 col-sm-12"><label class="form-label label-sm">Width (px)</label></div>
        <div class="col-9 col-sm-12"><input class="form-input input-sm" type="number" bind:value={width}></div>
    </div>
    <div class="form-group">
        <div class="col-3 col-sm-12"><label class="form-label label-sm">Height (px)</label></div>
        <div class="col-9 col-sm-12"><input class="form-input input-sm" type="number" bind:value={height}></div>
    </div>

    <div class="divider"></div>

    <div class="form-group">
        <label class="form-switch">
            <input type="checkbox" bind:checked={autosave}>
            <i class="form-icon"></i>Auto-save
        </label>
    </div>

    <button class="btn btn-primary" on:click={() => dispatch('reset')}>reset</button>

</div>