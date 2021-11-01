<script type=ts>

import Legend from "./Legend.svelte";

export let index = 0;
export let memlog;
export let config;
</script>

<pre>{memlog.logs[index]?.line}</pre>
<input type="range" min="0" max={memlog.length - 1} bind:value={index}>
<table>
    {#each Object.keys(config.layers) as name}
        <tr><th>{name}</th><td><Legend types={config.layers[name].types}/></td></tr>
    {/each}
</table>

<style>

input[type=range] {
    display: block;
    width: 100%;
}

th {
    text-align: right;
}

</style>