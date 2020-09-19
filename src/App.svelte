<script>
    import { onMount, setContext } from 'svelte';
    import { writable } from 'svelte/store';
    import panzoom from 'panzoom';

    import StylePicker from './StylePicker.svelte';
    import StyleRenderer from './StyleRenderer.svelte';
    import PaletteSettings from './PaletteSettings.svelte';
    import ImageSettings from './ImageSettings.svelte';
    import PositionSettings from './PositionSettings.svelte';
    import Tabs from './Tabs.svelte';
    import Tab from './Tab.svelte';

    import { classes } from './defaults';
    import { getCountriesFromSvg, clip, removeImageFromSvg, xmlns } from './countries';
    import { debounce, delegated, loadSvg } from './utils';

    let mapContainer;
    let mapContent;
    let renderer;
    let panZoomInstance;
    let countries = {};
    let selected = null;
    let hovering = null;
    let selectedCountry = null;
    let activeLeftTab = 'Classes';
    let activeRightTab = 'Style';

    export let mapUrl;

    const palette$ = writable(getSavedPalette());
    const changedEvent$ = writable(null);

    let defaultPosition = {
        scale: 3.815,
        x: -4348.21,
        y: -185.77
    }
    let defaultClasses = {};
    for(const id in classes) {
        const source = classes[id];
        defaultClasses[id] = {
            id: source.id,
            enabled: source.enabled,
            style: { ...source.style }
        }
    }

    function resetState() {
        position = defaultPosition;
        for(const id in countries) {
            const target = countries[id];

            target.enabled = true;
            target.style = {};
            target.image = null;
        }

        for(const id in defaultClasses) {
            const source = defaultClasses[id];
            const target = classes[id];

            target.enabled = source.enabled;
            target.style = source.style;
        }
        renderer.renderAll(countries, classes);
        console.log('Loaded');
    }

    function saveState() {
        console.log('Saving...');
        const state = {
            position: position,
            countries: {},
            classes: {}
        };
        // save classes
        for(const id in countries) {
            const source = countries[id];
            state.countries[id] = {
                enabled: source.enabled,
                style: source.style,
                image: source.image
            }
        }
        // save classes
        for(const id in classes) {
            const source = classes[id];
            state.classes[id] = {
                enabled: source.enabled,
                style: source.style
            }
        }

        localStorage.setItem('state', JSON.stringify(state));
    }

    function loadState() {
        const state = JSON.parse(localStorage.getItem('state'));
        position = state.position;
        for(const id in state.countries) {
            const source = state.countries[id];
            const target = countries[id];

            target.enabled = source.enabled;
            target.style = { ...target.style, ...source.style };
            target.image = source.image ? { ...target.image, ...source.image } : null;
        }

        for(const id in state.classes) {
            const source = state.classes[id];
            const target = classes[id];

            target.enabled = source.enabled;
            target.style = { ...target.style, ...source.style };
        }
        renderer.renderAll(countries, classes);
        console.log('Loaded');
    }

    setContext('ctx', {
        palette$,
        changedEvent$,
        onChanged: (event) => $changedEvent$ = event,
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

    const onTransform = debounce(e => {
        const transform = e.getTransform();
        if(position.x !== transform.x)
            position.x = transform.x;
        if(position.y !== transform.y)
            position.y = transform.y;
        if(position.scale !== transform.scale)
            position.scale = transform.scale;
    }, 250);

    onMount(async () => {
        mapContent = await mapContentLoad$;
        mapContainer.appendChild(mapContent);
        panZoomInstance = window.pan = panzoom(mapContent, {
            bounds: true,
            boundsPadding: 0.5,
            smoothScroll: false
        });
        panZoomInstance.on('transform', onTransform);

        getCountriesFromSvg(mapContent, countries);
        setTransform(position);
        loadState();

        mapContent.addEventListener('click', delegated(target => {
            const id = target.id;
            selected && selected.removeAttribute('data-selected');
            selected = target;
            target.dataset.selected = true;
            selectedCountry = countries[id];
            setSelection(selectedCountry);
        }));

        mapContent.addEventListener('mouseover', delegated(target => {
            hovering && hovering.removeAttribute('data-hover');
            target.dataset.hover = true;
            hovering = target;
        }));
    });

    let selectionRect = null;
    function setSelection(config) {
        const target = config.element;

        if(!selectionRect) {
            selectionRect = document.createElementNS(xmlns, 'rect');
            selectionRect.classList.add('selection');
            mapContent.appendChild(selectionRect);
        }

        const rect = target.getBBox();

        selectionRect.setAttribute('x', rect.x);
        selectionRect.setAttribute('y', rect.y);
        selectionRect.setAttribute('height', rect.height);
        selectionRect.setAttribute('width', rect.width);
    }

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
        const transform = panZoomInstance.getTransform();
        transform.scale = scale;
        transform.x = x;
        transform.y = y;
        panZoomInstance.moveBy(0, 0);
    }

    window.setTransform = setTransform;

    let position = { ...defaultPosition };
    $: {
        if(panZoomInstance) {
            setTransform(position);
        }
    }

    function toSvgDocumentSpace(clientX, clientY) {
        var point = mapContent.createSVGPoint();
        point.x = clientX;
        point.y = clientY;

        var ctm = mapContent.getScreenCTM();
        var inverse = ctm.inverse();
        var p = point.matrixTransform(inverse);
        return {
            x: p.x,
            y: p.y
        };
    }

    let autosave = true;
    let saveDebounced = debounce(() => saveState(), 2500);
    $: {
        if(autosave && $changedEvent$) {
            saveDebounced();
        }
    }
</script>

<style>
    #map-container, .map {
        overflow: hidden;
        height: 100%;
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

    .controls-right {
        grid-area: controls-right; 
        min-width: 260px;
    }

    .sidebar {
        grid-area: sidebar;
        display: flex;
        justify-content: space-between;
        flex-direction: column;
        align-items: center;
    }

    .actions {
        display: flex;
        flex-direction: column;
    }

    .controls-left {
        grid-area: controls-left;
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
            "header  header        header  header        "
            "sidebar controls-left content controls-right"
            "sidebar controls-left content controls-right";
    }
</style>

<svelte:body on:keydown={handleKeydown}/>

<div class="grid pb-2">
    <header class="header navbar bg-primary">
        <section class="navbar-section">
            <a href="https://github.com/ANovokmet/Beautiful-maps" class="navbar-brand mr-2 text-bold text-light">Beautiful-maps</a>
        </section>
        <section class="navbar-section">
            <button class="btn btn-action btn-sm ml-1 tooltip tooltip-bottom" class:active="{activeRightTab == 'Style'}" on:click="{() => activeRightTab = 'Style'}" data-tooltip="Style">
                <i class="material-icons">brush</i>
            </button>
            <button class="btn btn-action btn-sm ml-1 tooltip tooltip-bottom" class:active="{activeRightTab == 'Image'}" on:click="{() => activeRightTab = 'Image'}" data-tooltip="Image">
                <i class="material-icons">add_photo_alternate</i>
            </button>
            <button class="btn btn-action btn-sm ml-1" class:active="{activeRightTab == 'Shortcuts'}" on:click="{() => activeRightTab = 'Shortcuts'}" title="Shortcuts">
                <i class="material-icons">keyboard</i>
            </button>
        </section>
    </header>

    <div class="sidebar pl-2">
        <div class="actions">
            <button class="btn btn-action btn-primary btn-sm mb-1 tooltip tooltip-right" class:active="{activeLeftTab == 'Classes'}" on:click="{() => activeLeftTab = 'Classes'}"  data-tooltip="Classes">
                <i class="material-icons">style</i>
            </button>
            <button class="btn btn-action btn-primary btn-sm mb-1 tooltip tooltip-right" class:active="{activeLeftTab == 'Position'}" on:click="{() => activeLeftTab = 'Position'}"  data-tooltip="Position">
                <i class="material-icons">settings_overscan</i>
            </button>
            <button class="btn btn-action btn-primary btn-sm  tooltip tooltip-right" class:active="{activeLeftTab == 'Palette'}" on:click="{() => activeLeftTab = 'Palette'}"  data-tooltip="Palette">
                <i class="material-icons">gradient</i>
            </button>
        </div>

        <div class="actions">
            <a class="btn btn-action btn-primary btn-sm tooltip tooltip-right" href="https://github.com/ANovokmet/Beautiful-maps#README" target="_blank"  data-tooltip="Help">
                <i class="material-icons">help_center</i>
            </a>
        </div>
    </div>

    <div class="map">
        <div id="map-container" class="panel" bind:this={mapContainer}></div>
    </div>

    <div class="controls-right col-2 pr-2">
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

    <div class="controls-left hide-scrollbar">
        <Tabs activeTab={activeLeftTab} hideHeader="true">
            <Tab label="Classes">
                {#each Object.keys(classes) as klass (klass)}
                    <div class="panel bg-light p-2 mb-2">
                        <StylePicker selector=".{klass}" config={classes[klass]}></StylePicker>
                    </div>
                {/each}
            </Tab>
            <Tab label="Position">
                <div class="panel bg-light p-2">
                    <PositionSettings bind:scale={position.scale} bind:x={position.x} bind:y={position.y} bind:autosave={autosave} on:reset={resetState}></PositionSettings>
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
<StyleRenderer bind:this={renderer} classes={classes} countries={countries}></StyleRenderer>
