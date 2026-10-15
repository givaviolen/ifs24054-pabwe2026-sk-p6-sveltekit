<script lang="ts">
  import { goto } from "$app/navigation";
  import { isLoggedIn, profile, token } from "../states/authStore";

  // Pengalihan hanya terjadi bila token, status login, dan profil sama-sama siap.
  const ready = $derived(Boolean($token && $isLoggedIn && $profile));

  $effect(() => {
    if (ready) {
      goto("/");
    }
  });
</script>
