<script context="module">
    export const TABS = {};
</script>

<script>
    import { onDestroy, setContext } from 'svelte';
    import { writable } from 'svelte/store';

    const tabs = [];
    const selectedTab$ = writable(null);

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
        select(tab) {
            $selectedTab$ = tab;
        },
        selectedTab$
    });
</script>

<div class="tabs">
    <!-- buttons here -->
    <ul class="tab tab-block">
        {#each tabs as tab}
            <li class="tab-item" class:active={$selectedTab$ === tab}>
                <a href="javascript:void(0)" on:click={() => $selectedTab$ = tab}>{tab.label}</a>
            </li>
        {/each}
    </ul>
    <slot></slot>
</div>