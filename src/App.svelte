<script>
    import { onMount, setContext } from 'svelte';
    import { writable } from 'svelte/store';
    import throttle from 'lodash.throttle';
    import panzoom from 'panzoom';

    import StylePicker from './StylePicker.svelte';
    import StyleRenderer from './StyleRenderer.svelte';
    import PaletteInput from './PaletteInput.svelte';
    import PaletteSettings from './PaletteSettings.svelte';
    import ImageSettings from './ImageSettings.svelte';
    import PositionSettings from './PositionSettings.svelte';
    import Tabs from './Tabs.svelte';
    import Tab from './Tab.svelte';

    import { classes } from './defaults';
    import { getCountriesFromSvg, clip, removeImageFromSvg } from './countries';
    import { delegated, loadSvg } from './utils';

    let mapContainer;
    let mapContent;
    let panZoomInstance;
    var countries = {};
    let selected = null;
    let hovering = null;
    let selectedCountry = null;

    export let mapUrl;

    const palette$ = writable(getSavedPalette());
    const changedEvent$ = writable(null);

    const onChanged = (event) => {
        $changedEvent$ = event;
    }
//  throttle((event) => {
//         $changedEvent$ = event;
//     }, 200, { leading: true, trailing: true });

    setContext('ctx', {
        palette$,
        changedEvent$,
        onChanged,
        countries,
        classes
    });

    function getSavedPalette() {
        const str = localStorage.getItem('palette');
        if(str) {
            return JSON.parse(str);
        } else {
            return ['#00429d', '#2e59a8', '#4771b2', '#5d8abd', '#73a2c6', '#8abccf', '#a5d5d8', '#c5eddf', '#ffffe0'];
        }
    }

    $: {
        localStorage.setItem('palette', JSON.stringify($palette$));
    }

    const mapContentLoad$ = loadSvg(mapUrl);

    onMount(async () => {
        mapContent = await mapContentLoad$;
        mapContainer.appendChild(mapContent);

        getCountriesFromSvg(mapContent, countries);

        panZoomInstance = window.pan = panzoom(mapContent, {
            bounds: true,
            boundsPadding: 0.5,
            smoothScroll: false
        });

        panZoomInstance.on('transform', e => {
            const transform = e.getTransform();
            position.x = transform.x;
            position.y = transform.y;
            position.scale = transform.scale; 
        });
        setTransform(position);

        mapContent.addEventListener('click', delegated(target => {
            const id = target.id;

            selected && selected.removeAttribute('data-selected');
            selected = target;
            target.dataset.selected = true;
            selectedCountry = countries[id];
            console.log(countries[id]);
        }));

        mapContent.addEventListener('mouseover', delegated(target => {
            hovering && hovering.removeAttribute('data-hover');
            target.dataset.hover = true;
            hovering = target;
        }));
    });

    function handleKeydown(e) {
        let c = String.fromCharCode(e.keyCode);
        switch(c) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                const color = $palette$[+c-1];
                if(selectedCountry && color) {
                    selectedCountry.style.fill = color;
                }
                break;
            default:
                break;
        }
    }

    function applyImage({imageConfig, url}) {
        selectedCountry.image = clip(`clip-${selectedCountry.id}`, selectedCountry.element, url, imageConfig, mapContent);
        console.log(selectedCountry.image)
    }

    function removeImage({imageConfig}) {
        removeImageFromSvg(imageConfig);
        selectedCountry.image = null;
    }

    export function setTransform({x, y, scale}) {
        const transform = window.pan.getTransform();
        transform.scale = scale;
        transform.x = x;
        transform.y = y;
        window.pan.moveBy(0, 0);
    }

    window.setTransform = setTransform;

    let position = {
        scale: 3.815,
        x: -4348.21,
        y: -185.77
    };
    $: {
        if(panZoomInstance) {
            setTransform(position);
        }
    }

    let activeBottomTab = 'Classes';
    let activeRightTab = 'Style';
</script>

<style>
    #map-container, .map {
        overflow: hidden;
        height: 100%;
    }

    .column {
        padding: 0;
    }
    
    main {
        padding: .4rem;
    }
    .navbar {
        padding: .4rem;
    }

    .panel {
        box-shadow: 0 2px 10px rgba(48,55,66,.10);
    }

    .map {
        grid-area: content;
    }

    .header {
        grid-area: header;
    }

    .context {
        grid-area: context;
    }

    .sidebar {
        grid-area: sidebar;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-left: .4rem;
    }

    .bottom {
        grid-area: bottom;
        width: 260px;
        overflow-y: scroll;
    }

    .grid {
        display: grid;
        width: 100%;
        height: 100%;
        grid-gap: .4rem;
        grid-template-rows: auto auto 1fr;
        grid-template-columns: auto auto auto 1fr;
        grid-template-areas:
            "header  header  header header"
            "sidebar bottom content context"
            "sidebar bottom content context";
    }
</style>

<svelte:body on:keydown={handleKeydown}/>

<div class="grid">
    <header class="header navbar bg-primary">
        <section class="navbar-section">
            <a href="https://github.com/ANovokmet/Beautiful-maps" class="navbar-brand mr-2 text-bold text-light">Beautiful-maps</a>
        </section>
        <section class="navbar-section">
            <button class="btn btn-action btn-sm ml-1" class:active="{activeRightTab == 'Style'}" on:click="{() => activeRightTab = 'Style'}" title="Style">
                <i class="material-icons">brush</i>
            </button>
            <button class="btn btn-action btn-sm ml-1" class:active="{activeRightTab == 'Image'}" on:click="{() => activeRightTab = 'Image'}" title="Image">
                <i class="material-icons">add_photo_alternate</i>
            </button>
            <button class="btn btn-action btn-sm ml-1" class:active="{activeRightTab == 'Shortcuts'}" on:click="{() => activeRightTab = 'Shortcuts'}" title="Shortcuts">
                <i class="material-icons">keyboard</i>
            </button>
        </section>
    </header>

    <div class="sidebar">
        <button class="btn btn-action btn-primary btn-sm mb-1" class:active="{activeBottomTab == 'Classes'}" on:click="{() => activeBottomTab = 'Classes'}" title="Classes">
            <i class="material-icons">style</i>
        </button>
        <button class="btn btn-action btn-primary btn-sm mb-1" class:active="{activeBottomTab == 'Position'}" on:click="{() => activeBottomTab = 'Position'}" title="Position">
            <i class="material-icons">settings_overscan</i>
        </button>
        <button class="btn btn-action btn-primary btn-sm" class:active="{activeBottomTab == 'Palette'}" on:click="{() => activeBottomTab = 'Palette'}" title="Palette">
            <i class="material-icons">gradient</i>
        </button>
    </div>

    <div class="column map">
        <div id="map-container" class="panel" bind:this={mapContainer}></div>
    </div>

    <div class="context column col-2" style="min-width: 260px">
        <Tabs activeTab={activeRightTab} hideHeader="true">
            <Tab label="Style">
                <div class="panel bg-light p-2">
                    {#if selectedCountry}
                    <StylePicker selector=".{selectedCountry.id}" bind:config={selectedCountry}></StylePicker>
                    {:else}
                        Select a country
                    {/if}
                </div>
            </Tab>
            <Tab label="Image">
                <div class="panel bg-light p-2">
                    {#if selectedCountry}
                    <ImageSettings bind:imageConfig={selectedCountry.image} on:apply={e => applyImage(e.detail)} on:remove={e => removeImage(e.detail)}></ImageSettings>
                    {:else}
                        Select a country
                    {/if}
                </div>
            </Tab>
            <Tab label="Shortcuts">
                <div class="panel bg-light p-2">
                    <p><code>1-9</code> apply shades of current palette</p>
                </div>
            </Tab>
            <!-- layers -->
        </Tabs>
    </div>

    <div class="bottom hide-scrollbar">
        <Tabs activeTab={activeBottomTab} hideHeader="true">
            <Tab label="Classes">
                {#each Object.keys(classes) as klass (klass)}
                    <!-- <div class="column"> -->
                        <div class="panel bg-light p-2 mb-2">
                            <StylePicker selector=".{klass}" config={classes[klass]}></StylePicker>
                        </div>
                    <!-- </div> -->
                {/each}
            </Tab>
            <Tab label="Position">
                <div class="panel bg-light p-2">
                    <PositionSettings bind:scale={position.scale} bind:x={position.x} bind:y={position.y}></PositionSettings>
                </div>
            </Tab>
            <Tab label="Palette">
                <div class="panel bg-light p-2">
                    <PaletteSettings></PaletteSettings>
                </div>
            </Tab>
        </Tabs>
    </div>
</div>
<StyleRenderer classes={classes} countries={countries}></StyleRenderer>
