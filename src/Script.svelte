<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    let value = '';

    $: dispatch('change', `data:text/plain;base64,${btoa(unescape(encodeURIComponent(value)))}`);
  </script>
  
  <textarea bind:value rows="10" placeholder="Script"></textarea>