<script>
    export let scale;
    export let x;
    export let y;

    export let width;
    export let height;
</script>

<div class="form-horizontal">
    <div class="form-group">
        <div class="col-3 col-sm-12"><label class="form-label label-sm">scale</label></div>
        <div class="col-9 col-sm-12"><input class="form-input input-sm" type="number" bind:value={scale} step="any"></div>
    </div>
    <div class="form-group">
        <div class="col-3 col-sm-12"><label class="form-label label-sm">x</label></div>
        <div class="col-9 col-sm-12"><input class="form-input input-sm" type="number" bind:value={x} step="any"></div>
    </div>
    <div class="form-group">
        <div class="col-3 col-sm-12"><label class="form-label label-sm">y</label></div>
        <div class="col-9 col-sm-12"><input class="form-input input-sm" type="number" bind:value={y} step="any"></div>
    </div>

    <div class="divider"></div>

    <div class="form-group">
        <div class="col-3 col-sm-12"><label class="form-label label-sm">width (px)</label></div>
        <div class="col-9 col-sm-12"><input class="form-input input-sm" type="number" bind:value={width}></div>
    </div>
    <div class="form-group">
        <div class="col-3 col-sm-12"><label class="form-label label-sm">height (px)</label></div>
        <div class="col-9 col-sm-12"><input class="form-input input-sm" type="number" bind:value={height}></div>
    </div>
</div>