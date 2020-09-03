<script>
    import { getContext } from 'svelte';
    import { TABS } from './Tabs.svelte';

    const { register, selectedTab$ } = getContext(TABS);
    
    export let label;
    const tab = { label };
    $: tab.label = label;

    register(tab);
</script>

<style>

</style>

{#if $selectedTab$ === tab}
    <slot></slot>
{/if}