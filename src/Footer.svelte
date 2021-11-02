<script type=ts>

import Legend from "./Legend.svelte";
import { bytes } from "./utils";

export let index = 0;
export let memlog;
export let config;
export let rowBytes = 0;

</script>

<div class="base">
    <div class="zoom">
        1 row = {bytes(rowBytes)}
        <button on:click={ev => rowBytes *= 2}><img src="/assets/zoom-out.svg"></button>
        <button on:click={ev => rowBytes /= 2}><img src="/assets/zoom-in.svg"></button>
    </div>

    <pre>{memlog.logs[index]?.line}</pre>
    <input type="range" min="0" max={memlog.length - 1} bind:value={index}>
    <table>
        {#each Object.keys(config.layers) as name}
            <tr><th>{name}</th><td><Legend types={config.layers[name].types}/></td></tr>
        {/each}
    </table>
</div>

<style>

.zoom {
    padding-top: 0.25rem;
    float: right;
}

input[type=range] {
    display: block;
    width: 100%;
}

th {
    text-align: right;
}

img {
    width: 1rem;
}
</style>