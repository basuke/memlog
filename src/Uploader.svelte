<script lang="ts">

import { createEventDispatcher } from 'svelte';

export let label = "Load";

const dispatch = createEventDispatcher();

let files;

$: if (files && files.length) {
    const reader = new FileReader();
    reader.onload = function() {
        dispatch('load', reader.result as string);
    };
    reader.onerror = function() {
        console.error(reader.error);
    };
    reader.readAsText(files[0]);
}

</script>

<input type=file name="upload" bind:files accept="*/*">
