<script lang=ts>

import {calcRange, hex, roundDown, roundUp, M} from './utils';
import Region from './Region.svelte';
import { Geometry } from './geometry';

export let regions = [
    { id: 'bmalloc:chunk:1234', layer: 'bmalloc', start: 0x20001000, size: 5 * M},
];
export let className = '';
export let style = '';
export let width = 500;
export let height = 500;

let topMargin = 10; // px
let addressWidth = 100; // px
let rowSize = 1 * M; // bytes
let rowWidth = 800; // px
let rowHeight = 12; // px

$: geo = new Geometry(rowSize, rowWidth, rowHeight);

$: range = calcRange(regions);

$: start = geo.roundDown(range[0]);
$: end = geo.roundUp(range[1]);
$: startRow = geo.addressToRow(start);

</script>

<svg {height} {width} {style} class={className}>
	<circle cx="50" cy="50" r="50" stroke="#880000" stroke-width="2" fill="red" />
    <g name="virtical-roll" transform="translate(0, {topMargin - startRow * rowHeight})">
        <g name="address-label" stroke-width="0.2">
            <circle cx="50" cy="50" r="50" stroke="#880000" fill="blue" />
        </g>
        <g name="address-space" transform="translate({addressWidth}, 0)" stroke-width="0.1">
            {#each regions as region(region.id)}
                <Region {geo} start={region.start} end={region.start + region.size}/>
            {/each}
        </g>
    </g>
</svg> 
start: {hex(start)}, end: {hex(end)}