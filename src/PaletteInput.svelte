<script>
    import { getContext, createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();
    const { palette, palette$ } = getContext('ctx');

    export let selected;

    function onSelected(color) {
        selected = color;
        dispatch('select', { color });
    }
</script>
<style>
    .palette {
        background: rgb(255, 255, 255);
        display: flex;
        height: 1.4rem;
        border: .05rem solid #bcc3ce;
        padding: .3rem;
    }

    .palette-step {
        height: 100%;
        display: block;
        flex-grow: 1;
    }

    .selected {
        outline: 2px solid rgb(87 85 217);
        z-index: 1;
    }
</style>
<div class="palette">
    {#each $palette$ as step}
    <div class="palette-step" style="background-color: {step}" class:selected={step === selected} on:click={() => onSelected(step)}>
    </div>
    {/each}
</div>