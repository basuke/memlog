<script lang="ts">

import { createEventDispatcher } from 'svelte';

export let label = "Load";

const dispatch = createEventDispatcher();

let files;

function isReady(files) {
    return (files && files.length);
}

function loadFile() {
    if (!isReady(files)) return;

    const reader = new FileReader();
    reader.onload = function() {
        console.log(reader);
        dispatch('load', reader.result as string);
    };
    reader.onerror = function() {
        console.error(reader.error);
    };
    reader.readAsText(files[0]);
}

</script>

<input type=file name="upload" bind:files accept="*/*">
<button disabled={!isReady(files)} on:click={loadFile}>{label}</button>
