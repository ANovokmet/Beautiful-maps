<script>
    import { getContext } from "svelte";

    const { palette$ } = getContext('ctx');

    let paletteStr;
    $: paletteStr = JSON.stringify($palette$);

    function paletteChange(e) {
        let str = e.target.value;
        try {
            const value = JSON.parse(str.replace(/'/g, '"'));
            $palette$ = value;
        }
        catch(e) {
            console.error(e);
        }
    }
</script>
<style>
</style>

<div>
    <a target="_blank" href="https://gka.github.io/palettes/">Color Palette Helper</a>
    
    <div class="form-group">
        <label class="form-label label-sm">Enter color palette as JSON (array of CSS color values)</label>
        <div class="form-pair">
            <textarea style="height: 200px;" class="form-input input-sm" type="text" value={paletteStr} on:input={paletteChange}/>
        </div>
    </div>
</div>