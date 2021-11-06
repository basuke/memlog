<script type=ts>

import { bytes } from "./utils";

export let rowBytes = 0;
export let left: boolean = false;

</script>

<div class="zoom">
    {#if left}
    1 row = {bytes(rowBytes)}
    {/if}
    <button on:click={ev => rowBytes *= 2}><img src="/assets/zoom-out.svg" alt="zoom out"></button>
    <button on:click={ev => rowBytes /= 2}><img src="/assets/zoom-in.svg" alt="zoom in"></button>
    {#if !left}
    1 row = {bytes(rowBytes)}
    {/if}
</div>

<style>

.zoom {
    padding-top: 0.25rem;
    float: right;
}

img {
    width: 1rem;
}
</style>