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

    let mapContainer;
    let mapContent;
    var countries = {};
    let selected = null;
    let hovering = null;
    let selectedCountry = null;
    let panZoomInstance;

    const palette$ = writable(['#00429d', '#2e59a8', '#4771b2', '#5d8abd', '#73a2c6', '#8abccf', '#a5d5d8', '#c5eddf', '#ffffe0']);
    const changedEvent$ = writable(null);

    const onChanged = throttle((event) => {
        $changedEvent$ = event;
    }, 400, { leading: true, trailing: true });

    setContext('ctx', {
        palette: ['#00429d', '#2e59a8', '#4771b2', '#5d8abd', '#73a2c6', '#8abccf', '#a5d5d8', '#c5eddf', '#ffffe0'],
        palette$,
        changedEvent$,
        onChanged
    });

    let svgFetch$ = fetch('/world-map.svg')
        .then(response => response.text())
        .then(html => {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'image/svg+xml');
            const svg = doc.getElementsByTagName('svg')[0];
            return svg;
        })
        .catch((err) => console.error('Failed to fetch page: ', err));

    onMount(async () => {
        mapContent = await svgFetch$;
        mapContainer.appendChild(mapContent);

        for (const child of mapContent.children) {
            //child.setAttribute()
            if (child.tagName === 'title' || child.id === 'ocean') continue;

            const titleElement = child.querySelector('title');
            child.dataset.country = child.id;
            countries[child.id] = {
                id: child.id,
                element: child,
                title: titleElement ? titleElement.textContent : child.id,
                hint: titleElement ? titleElement.textContent : child.id,
                enabled: true,
                style: {
                    fill: child.style.fill,
                    fillOpacity: child.style.fillOpacity,
                    stroke: child.style.stroke,
                    strokeWidth: child.style.strokeWidth
                }
            };
        }

        // limited recognition
        const limitxx = mapContent.querySelectorAll('.limitxx, .unxx');
        for (const child of limitxx) {
            const titleElement = child.querySelector('title');
            child.dataset.country = child.id;
            countries[child.id] = {
                id: child.id,
                element: child,
                title: titleElement ? titleElement.textContent : child.id,
                style: {
                    fill: child.style.fill,
                    fillOpacity: child.style.fillOpacity,
                    stroke: child.style.stroke,
                    strokeWidth: child.style.strokeWidth
                }
            };
        }

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

    function delegated(fn) {
        return function (event) {
            let target = event.target.closest('[data-country]');
            if (target && target.dataset['country']) {
                fn(target, event);
            }
        };
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

    function applyImage(data) {
        const element = data.config.element;
        clip(`clip-${data.config.id}`, element, data.url, data.config);
    }

    const xmlns = 'http://www.w3.org/2000/svg';
	function clip(clipId, pathElement, imageHref, config) {
        const rect = pathElement.getBBox();
		const clipPath = cloneToPath(pathElement);
		clipPath.id = clipId;

		const image = document.createElementNS(xmlns, 'image');
		image.setAttribute('clip-path', `url(#${clipId})`);
		image.setAttribute('href', imageHref);
		image.setAttribute('height', rect.height);
        image.setAttribute('width', rect.width);
		image.setAttribute('x', rect.x);
		image.setAttribute('y', rect.y);
        image.setAttribute('preserveAspectRatio', 'none');

        mapContent.appendChild(clipPath);
        // pathElement.insertAdjacentElement('beforebegin', image);
        mapContent.appendChild(image);

        config.scale = 1;
        config.keepRatio = false;
        config.imageOriginX = rect.x + rect.width / 2;
        config.imageOriginY = rect.y + rect.height / 2;
        config.imageOriginalWidth = rect.width;
        config.imageOriginalHeight = rect.height;

        config.imageElement = image;
        config.clipPathElement = clipPath;
        config.appliedImageHref = imageHref;
	}

	function cloneToPath(element) {
		const clipPath = document.createElementNS(xmlns, 'clipPath');
		if(element.tagName === 'path') {
			clipPath.appendChild(element.cloneNode());
		} else {
			for(const node of element.querySelectorAll('path')) {
				clipPath.appendChild(node.cloneNode());
			}
		}
		return clipPath;
    }
    
    export function setTransform({x, y, scale}) {
        const transform = window.pan.getTransform();
        transform.scale = scale;
        transform.x = x;
        transform.y = y;
        window.pan.moveBy(0, 0);
    }

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

</script>

<style>
    #map-container, .map {
        overflow: hidden;
        height: 100%;
    }

    .grow {
        flex-grow: 1;
    }

    .column {
        padding: .4rem;
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
</style>

<svelte:body on:keydown={handleKeydown}/>
<header class="navbar bg-primary">
    <section class="navbar-section">
        <a href="/" class="navbar-brand mr-2 text-bold text-light">Beautiful-maps</a>
    </section>
    <section class="navbar-section">
        <button class="btn btn-sm">Shortcuts</button>
        <a href="https://github.com/ANovokmet/Beautiful-maps" class="btn btn-sm">GitHub</a>
    </section>
</header>
<main class="">
    <div class="columns" style="height: 512px">
        <div class="column map">
            <div id="map-container" class="panel" bind:this={mapContainer}></div>
        </div>
        <div class="column col-2" style="min-width: 260px">
            {#if selectedCountry}
            <Tabs>
                <Tab label="Style">
                    <div class="panel bg-light p-2">
                        <StylePicker selector=".{selectedCountry.id}" bind:config={selectedCountry}></StylePicker>
                    </div>
                </Tab>
                <Tab label="Image">
                    <div class="panel bg-light p-2">
                        <ImageSettings bind:config={selectedCountry} on:apply={e => applyImage(e.detail)}></ImageSettings>
                    </div>
                </Tab>
                <!-- layers -->
            </Tabs>
            {/if}
        </div>
    </div>
    
    <Tabs>
        <Tab label="Classes">
            <div class="columns">
                {#each Object.keys(classes) as klass}
                    <div class="column">
                        <div class="panel bg-light p-2">
                            <StylePicker selector=".{klass}" bind:config={classes[klass]}></StylePicker>
                        </div>
                    </div>
                {/each}
            </div>
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
</main>
<StyleRenderer configs={classes} countries={countries}></StyleRenderer>
