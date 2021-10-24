<script lang="ts">

import MemoryView from './MemoryView.svelte';
import { M } from './utils';

let regions = [
    { layer: 'bmalloc', color: 'green', start: 0x20014000, size: 5 * M},
    { layer: 'bmalloc', color: 'gray', start: 0x20514000, size: 1 * M - 0x8000},
    { layer: 'bmalloc', color: 'pink', start: 0x20614000, size: M - 0x13000},
    { layer: 'bmalloc', color: 'orange', start: 0x20700000, size: 0x100000 + 1230},
];

</script>

<main>
    <h1>Memory Viewer</h1>
    <MemoryView {regions} rowBytes={64 * 1024 * 4}/>
</main>

<style>

main {
}

h1 {
    text-align: center;
    color: #ff3e00;
    font-size: 1.5rem;
    font-weight: lighter;
}
</style>