<script context="module">
    export const TABS = {};
</script>

<script>
    import { onDestroy, setContext } from 'svelte';
    import { writable } from 'svelte/store';

    export let activeTab;
    export let hideHeader = false;

    const tabs = [];
    const selectedTab$ = writable(null);

    function select(tab) {
        $selectedTab$ = tab;
    }

    setContext(TABS, {
        register(tab) {
            tabs.push(tab);

            if(!$selectedTab$) {
                $selectedTab$ = tab;
            }

            onDestroy(() => {
                const index = tabs.indexOf(tab);
                tabs.splice(index, 1);
            });
        },
        select,
        selectedTab$
    });

    $: {
        if(tabs && activeTab) {
            const tab = tabs.find(tab => tab.label == activeTab);
            select(tab);
        }
    }
</script>

<div class="tabs">
    <!-- buttons here -->
    {#if !hideHeader}
    <ul class="tab tab-block">
        {#each tabs as tab}
            <li class="tab-item" class:active={$selectedTab$ === tab}>
                <a href="javascript:void(0)" on:click={() => $selectedTab$ = tab}>{tab.label}</a>
            </li>
        {/each}
    </ul>
    {/if}
    <slot></slot>
</div>