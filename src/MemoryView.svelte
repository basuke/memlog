<script lang=ts>

import {hex, M} from './utils';
import RegionShape from './Region.svelte';
import Transform from './Transform.svelte';
import { Geometry } from './geometry';
import { calcRange, layers as getLayers, rangesOfLayer, RegionMap } from './region';

export let regions: RegionMap = {};
export let config = {};
export let className = '';
export let style = '';

export let topMargin = 1; // px
export let padding = 8; // px
export let addressWidth = 80; // px
export let rowBytes = 1 * M / 1; // bytes
export let rowWidth = 640; // px
export let rowHeight = 16; // px

console.log('MemoryView: init');

$: geo = new Geometry(rowBytes, rowWidth, rowHeight);

$: range = calcRange(regions);

$: start = geo.floor(range[0]);
$: end = geo.ceil(range[1]);
$: startRow = geo.addressToRow(start);
$: endRow = geo.addressToRow(end);

$: width = addressWidth + padding + rowWidth;
$: height = (endRow - startRow) * rowHeight + 2 * topMargin;

$: layers = getLayers(regions);
const disabledLayers = {};

function color(region, config): string {
    const color = config?.layers[region.layer]?.types[region.type]?.color;
    return region.color || color || 'lightblue';
}

</script>

<ul class="hide-layers">
    <li class=header>Hide Layer:</li>
    {#each layers as layer(layer)}
        <li>
            <input type=checkbox bind:checked={disabledLayers[layer]}>
            {layer}
        </li>
    {/each}
</ul>
<svg {height} {width} {style} class={className}>
    <defs>
        <pattern id="transparent" patternUnits="userSpaceOnUse" patternTransform="rotate(45)" width="8" height="8">
            <rect x="0" y="0" width="4" height="8" fill="lightgray"/>
        </pattern>
    </defs>

    <Transform translateY={topMargin - startRow * rowHeight}>
        <!-- label -->
        <g stroke-width="0.2" font-family=monospace color=black font-size=12 text-anchor=end>
            {#each geo.addressLabels(start, end) as label(label.y)}
                <text x={addressWidth} y={label.y + 12}>{label.text}</text>
            {/each}
        </g>

        <!-- address map -->
        <Transform translateX={addressWidth + padding}> 
            <RegionShape {geo} start={start} end={end} color='url(#transparent)'/>
            {#each layers as layer(layer)}
                {#if !disabledLayers[layer]}
                    {#each rangesOfLayer(regions, layer) as region}
                        <RegionShape {geo}
                            border
                            start={region.start}
                            end={region.start + region.size}
                            color={color(region, config)}
                        />
                    {/each}
                {/if}
            {/each}
            </Transform>
    </Transform>
</svg> 
<br>

range: {range}, start: {hex(start)}, end: {hex(end)}, startRow: {startRow}, endRow: {endRow}, widht: {width}, height: {height}


<style>

.hide-layers {
    display: flex;
    justify-content: center;
    padding: 0;
    list-style: none;
}

.hide-layers li {
    padding-right: 0.5rem;
}

.header {
    font-weight: bolder;
}

</style>