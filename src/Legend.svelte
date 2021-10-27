<script lang="ts">

export let name = "";
export let types = {};

</script>

<div>
{name}

{#each Object.keys(types) as type}
    <span style="background-color: {types[type].color}">{type}</span>
{/each}
</div>

<style>

div {
    display: flex;
    justify-content: center;
}

span {
    display: block;
    padding: 0 0.5rem 0;
    margin-left: 0.25em;
    border-radius: 0.5rem;
}
</style>
