<script>
    import { getContext } from "svelte";


    export let scale;
    export let x;
    export let y;

    export let width;
    export let height;

    const { changedEvent$, palette$, onChanged, countries, classes } = getContext('ctx');
    const globalConfig = {
        autosave: true
    };
        
    function reset() {

    }

    function save() {
        const state = {
            countries: {},
            classes: {},
            palette: [],
            date: new Date()
        };

        for(const id in countries) {
            const { element, imageElement, clipPathElement, ...country } = countries[id];
            state.countries[id] = country;
        }

        state.classes = classes;
        state.palette = $palette$;

        localStorage.setItem('SAVE_STATE', JSON.stringify(state));
    }
    
    $: {
        if(globalConfig.autosave && $changedEvent$) {
            console.log('saved')
            save();
        }
    }
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

    <div class="divider"></div>

    <div class="form-group">
        <label class="form-switch">
            <input type="checkbox" bind:checked={globalConfig.autosave}>
            <i class="form-icon"></i>enable auto-save
        </label>
    </div>

    <button class="btn btn-primary" on:click={reset}>reset</button>

</div>