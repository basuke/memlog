<script type=ts>

import Legend from "./Legend.svelte";

export let index = 0;
export let memlog;
export let config;

let playing = false;

$: regions = memlog.getRegions(index);

function step() {
    if (playing && index < memlog.length - 1) {
        index += 1;
        setTimeout(step, 17);
    } else {
        playing = false;
    }
}

function start() {
    playing = true;
    step();
}

</script>

<div class="base">
    {#if regions && regions.log}<pre>{regions.log.line}</pre>{/if}
    <div class=bar>
        {#if playing}
        <button on:click={ev => playing = false }><img src="/assets/stop.svg" alt="stop playing"></button>
        {:else}
        <button on:click={ev => start()}><img src="/assets/play.svg" alt="play"></button>
        {/if}
        <input type="range" min="0" max={memlog.length - 1} bind:value={index}>
    </div>
    <table>
        {#each Object.keys(config.layers) as name}
            <tr><th>{name}</th><td><Legend types={config.layers[name].types}/></td></tr>
        {/each}
    </table>
</div>

<style>

.bar {
    display: flex;
}

input[type=range] {
    display: block;
    width: 100%;
    margin: 0 0.5rem;
    padding: 0;
}

th {
    text-align: right;
}

img {
    width: 1rem;
}

</style>