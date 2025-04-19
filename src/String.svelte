<script lang="ts">
    let {value = $bindable() } = $props();
</script>
<input
        type="text"
        style="padding: 0.5rem"
        bind:value
        placeholder="Ziel"
/>