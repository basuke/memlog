<script lang=ts>

import RegionShape from './Region.svelte';
import Transform from './Transform.svelte';
import AddressColumn from './AddressColumn.svelte';
import { M, Geometry, Regions, hex } from '../memlog';
import type { Config, TypeConfig } from '../memlog';

export let regions: Regions;
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

$: startAddr = geo.floor(regions?.addr ?? 0);
$: endAddr = geo.ceil(regions?.end ?? 0);

$: startRow = geo.addressToRow(startAddr);
$: endRow = geo.addressToRow(endAddr);

$: width = addressWidth + padding + rowWidth;
$: height = (endRow - startRow) * rowHeight + 2 * topMargin;

function configFor(layer, region, config): TypeConfig {
    const typeConfig = config.layers[layer]?.types[region.type] ?? {};
    return { color: 'LightSteelBlue', border: true, ...typeConfig };
}

function color(layer, region, config): string {
    return configFor(layer, region, config).color;
}

function border(layer, region, config): boolean {
    return configFor(layer, region, config).border;
}

export function shouldRenderLayer(layer: string, config: Config): boolean {
    const layerConfig = config.layers[layer];
    return !layerConfig.disabled;
}
</script>

<div class=box>
<svg {height} {width} {style}>
    <defs>
        <pattern id="transparent" patternUnits="userSpaceOnUse" patternTransform="rotate(45)" width="8" height="8">
            <rect x="0" y="0" width="4" height="8" fill="lightgray"/>
        </pattern>
    </defs>

    <Transform translateY={topMargin - startRow * rowHeight}>
        <!-- label -->
        <AddressColumn {geo} start={startAddr} end={endAddr} width={addressWidth} />

        <!-- address map -->
        <Transform translateX={addressWidth + padding}> 
            <RegionShape {geo} start={startAddr} end={endAddr} color='url(#transparent)'/>
        </Transform>
        {#each regions.activeLayers() as layer(layer.name)}
            <Transform translateX={addressWidth + padding} comment={layer.name}> 
                {#if shouldRenderLayer(layer.name, config)}
                    {#each layer.regions as region}
                        <RegionShape {geo}
                            start={region.addr}
                            end={region.end}
                            color={color(layer.name, region, config)}
                            border={border(layer.name, region, config)}
                        />
                    {/each}
                {/if}
            </Transform>
        {/each}
    </Transform>
</svg> 

{#each regions.activeLayers() as layer(layer.name)}
    <div class="regions" style="height: {height}px">
        <div class=title>{layer.name}</div>

        {#each layer.regions as region(region.addr)}
            <div class="region">{hex(region.addr, '')}-{hex(region.end, '')}</div>
        {/each}
    </div>
{/each}
</div>

<style>

.regions {
    margin-left: 0.5rem;
    min-height: 10rem;
    overflow-x: hidden;
    overflow-y: auto;
}

.region {
    word-break: keep-all;
}

.box {
    display: flex;
    font-family: 'Courier New', Courier, monospace;
    font-size: x-small;
}

</style>