
/*
* Below are Cascading Style Sheet (CSS) definitions in use in this file,
* which allow easily changing how countries are displayed.
*
*/

/*
* Circles around small countries
*
* Change opacity to 1 to display all circles.
*
*/
const classes = {};

classes.circlexx = {
    id: 'circlexx',
    hint: 'Circles around small countries',
    enabled: true,
    style: {
        opacity: 0,
        fill: '#e0e0e0',
        stroke: '#000000',
        'stroke-width': 0.5,
    }
}

/*
* Smaller circles around French DOMs and Chinese SARs
*
* Change opacity to 1 to display all subnational circles.
*
*/
classes.subxx = {
    id: 'subxx',
    hint: 'Smaller circles around French DOMs and Chinese SARs',
    enabled: true,
    style: {
        opacity: 0,
        'stroke-width': 0.3,
    }
}


/*
* Circles around small countries, but with no permanent residents 
*
* Change opacity to 1 to display all circles.
*
*/
classes.noxx = {
    id: 'noxx',
    hints: 'Circles around small countries, but with no permanent residents',
    enabled: true,
    style: {
        opacity: 0,
        fill: '#e0e0e0',
        stroke: '#000000',
        'stroke-width': 0.5,
    }
}

/*
* land
*/
classes.landxx = {
    id: 'landxx',
    hints: 'land',
    enabled: true,
    style: {
        fill: '#e0e0e0',
        stroke: '#ffffff',
        'stroke-width': 0.5,
    }
}


/*
* Styles for coastlines of islands with no borders
*/
classes.coastxx = {
    id: 'coastxx',
    hints: 'Styles for coastlines of islands with no borders',
    enabled: true,
    style: {
        fill: '#e0e0e0',
        stroke: '#ffffff',
        'stroke-width': 0.3,
    }
}


/*
* Styles for territories with limited or no recognition
*/
classes.limitxx = {
    id: 'limitxx',
    hints: 'Styles for territories with limited or no recognition',
    enabled: true,
    style: {
        fill: '#e0e0e0',
        stroke: '#ffffff',
        'stroke-width': 0,
    }
}

/*
* Circles around small territories with limited or no recognition
*
* Change opacity to 1 to display all circles.
*
*/
classes.unxx = {
    id: 'unxx',
    hint: 'Circles around small territories with limited or no recognition',
    enabled: true,
    style: {
        opacity: 0,
        fill: '#e0e0e0',
        stroke: '#000000',
        'stroke-width': 0.3,
    }
}


/*
* Styles for territories without permanent population.
*/
classes.antxx = {
    id: 'antxx',
    hint: 'Styles for territories without permanent population.',
    enabled: true,
    style: {
        fill: '#e0e0e0',
        stroke: '#ffffff',
        'stroke-width': 0,
    }
}

/*
* Oceans and seas
*/
classes.oceanxx = {
    id: 'oceanxx',
    hint: 'Oceans and seas',
    enabled: true,
    style: {
        opacity: 1,
        color: '#000000',
        fill: '#ffffff',
        stroke: '#000000',
        'stroke-width': 0,
        'stroke-miterlimit': 1,
    }
}

/*

    Reserved class names:

    .eu - for members of European Union
    .eaeu - for members of Euroasian Economical Union

*/

/*
* Additional style rules
*
* The following are examples of colouring countries.  You can substitute these with your own styles to colour the countries on the map.
*
* Color a few countries:
*
* .gb, .au, .nc
* {
*    fill:       #ff0000,
* }
*
* Color a few small country circles (and the countries):
*
* .ms, .ky
* {
*    opacity:    1,
*    fill:       #ff0000,
* }
*
*/

export { classes };