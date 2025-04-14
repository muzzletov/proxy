<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    let value = '';
  
    $: dispatch('change', value);
  </script>
  <input type="text" style="padding: 0.5rem" bind:value placeholder="Ziel">