<script lang=ts>

import {hex, M} from './utils';
import RegionShape from './Region.svelte';
import Transform from './Transform.svelte';
import { Geometry } from './geometry';
import { layers as getLayers, rangesOfLayer, RegionMap } from './region';
import type { Config, TypeConfig } from './config';
import AddressColumn from './AddressColumn.svelte';

export let regions: RegionMap = {};
export let start = 0;
export let end = 0;

export let config: Config = { layers:{} };

export let className = '';
export let style = '';

export let topMargin = 1; // px
export let padding = 8; // px
export let addressWidth = 80; // px
export let rowBytes = 1 * M / 1; // bytes
export let rowWidth = 640; // px
export let rowHeight = 16; // px

$: geo = new Geometry(rowBytes, rowWidth, rowHeight);

$: startRow = geo.addressToRow(start);
$: endRow = geo.addressToRow(end);

$: width = addressWidth + padding + rowWidth;
$: height = (endRow - startRow) * rowHeight + 2 * topMargin;

$: start = geo.floor(start);
$: end = geo.ceil(end);

$: layers = getLayers(regions);
const disabledLayers = {};

function configFor(region, config): TypeConfig {
    const typeConfig = config.layers[region.layer]?.types[region.type] ?? {};
    return { color: 'LightSteelBlue', border: true, ...typeConfig };
}

function color(region, config): string {
    return configFor(region, config).color;
}

function border(region, config): boolean {
    return configFor(region, config).border;
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
        <AddressColumn {geo} {start} {end} width={addressWidth} />

        <!-- address map -->
        <Transform translateX={addressWidth + padding}> 
            <RegionShape {geo} start={start} end={end} color='url(#transparent)'/>
            {#each layers as layer(layer)}
                {#if !disabledLayers[layer]}
                    {#each rangesOfLayer(regions, layer) as region}
                        <RegionShape {geo}
                            start={region.addr}
                            end={region.end}
                            color={color(region, config)}
                            border={border(region, config)}
                        />
                    {/each}
                {/if}
            {/each}
        </Transform>
    </Transform>
</svg> 

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