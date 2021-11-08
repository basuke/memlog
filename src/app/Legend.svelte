<script lang="ts">

export let types = {};

</script>

<div>
{#each Object.keys(types) as type}
    <span style="background-color: {types[type].color}">{type}</span>
{/each}
</div>

<style>

div {
    display: flex;
    justify-content: start;
}

span {
    display: block;
    padding: 0 0.5rem 0;
    margin-left: 0.25em;
    border-radius: 0.5rem;
}
</style>
