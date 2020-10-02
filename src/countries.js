

function toCountry(countrySvg) {
    const titleElement = countrySvg.querySelector('title');
    countrySvg.dataset.country = countrySvg.id;
    return {
        id: countrySvg.id,
        element: countrySvg,
        enabled: true,
        title: titleElement ? titleElement.textContent : countrySvg.id,
        hint: titleElement ? titleElement.textContent : countrySvg.id,
        // never have any styles actually
        style: {
            fill: countrySvg.style.fill,
            fillOpacity: countrySvg.style.fillOpacity,
            stroke: countrySvg.style.stroke,
            strokeWidth: countrySvg.style.strokeWidth
        },
        image: null,
    };
}

export function getCountriesFromSvg(rootSvg, countries = {}) {
    for (const child of rootSvg.children) {
        if (child.tagName === 'title' || child.id === 'ocean') continue;
        countries[child.id] = toCountry(child);
    }
    
    // limited recognition
    const limitxx = rootSvg.querySelectorAll('.limitxx');
    for (const child of limitxx) {
        countries[child.id] = toCountry(child);
    }
}

export const xmlns = 'http://www.w3.org/2000/svg';

export function clip(clipId, pathElement, href, imageConfig, mapContent) {
    imageConfig = imageConfig || {};

    const rect = pathElement.getBBox();
    
    let clipPath;
    if(!imageConfig.clipPathElement) {
        clipPath = cloneToPath(pathElement);
        clipPath.id = clipId;
        mapContent.appendChild(clipPath);
    } else {
        clipPath = imageConfig.clipPathElement;
    }
    
    let image;
    if(!imageConfig.imageElement) {
        image = document.createElementNS(xmlns, 'image');
        mapContent.appendChild(image);
        // pathElement.insertAdjacentElement('beforebegin', image);
    } else {
        image = imageConfig.imageElement;
    }

    image.setAttribute('clip-path', `url(#${clipId})`);
    image.setAttribute('href', href);
    image.setAttribute('height', imageConfig.originalHeight || rect.height);
    image.setAttribute('width', imageConfig.originalWidth || rect.width);
    image.setAttribute('x', imageConfig.originalX || rect.x);
    image.setAttribute('y', imageConfig.originalY || rect.y);
    image.setAttribute('preserveAspectRatio', 'none');

    return {
        href,
        scale: 1,
        keepRatio: false,
        originX: rect.x + rect.width / 2,
        originY: rect.y + rect.height / 2,
        originalX: rect.x,
        originalY: rect.y,
        originalWidth: rect.width,
        originalHeight: rect.height,
        imageElement: image,
        clipPathElement: clipPath,
    };
}

export function removeImageFromSvg(imageConfig) {
    if(imageConfig.imageElement) {
        imageConfig.imageElement.remove();
    }
    if(imageConfig.clipPathElement) {
        imageConfig.clipPathElement.remove();
    }
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