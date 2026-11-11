<script>
  import { onMount } from 'svelte';
  import { Copy } from '@lucide/svelte';
  import createAuth from '@tridnguyen/auth/spa';
  import Monthly from './Monthly.svelte';
  import { schwab } from './schwab';

  const authConfig = {
    domain: 'tridnguyen.auth0.com',
    clientId: 'PjP6M9OtNzBT8VerWH6kpFhi3u4LU7bF',
    audience: 'https://sheets.cloud.tridnguyen.com',
    // Request API scopes at login so the refresh token covers them.
    // Asking for extra scopes later in getTokenSilently misses the token cache,
    // falls back to a cross-site iframe that browsers block, and logs the user out.
    scope: 'openid profile email read:list write:list',
  };

  const basePath = import.meta.env.BASE_URL || '/';
  const returnTo = `${window.location.origin}${basePath}`;
  const schwabUrl = import.meta.env.DEV
    ? 'http://localhost:3000/schwab'
    : 'https://sheets.cloud.tridnguyen.com/schwab';

  /** @type {any} */
  let auth;
  let isLoading = true;
  let isAuthenticated = false;
  /** @type {{name?: string, email?: string} | null} */
  let user = null;
  let token = '';
  let authStatus = '';
  let errorMessage = '';
  let schwabLoading = false;
  let schwabError = '';
  let tokenCopyMessage = '';

  function isAuthCallback() {
    return (
      location.search.includes('state=') &&
      (location.search.includes('code=') || location.search.includes('error='))
    );
  }

  function clearAuthState() {
    isAuthenticated = false;
    user = null;
    token = '';
    schwab.set(null);
    schwabLoading = false;
    schwabError = '';
    tokenCopyMessage = '';
  }

  async function refreshAuthState() {
    if (!auth) {
      throw new Error('auth client is not initialized');
    }

    const authenticated = await auth.isAuthenticated();
    isAuthenticated = authenticated;
    if (!authenticated) {
      authStatus = '';
      clearAuthState();
      return;
    }

    token = await auth.getTokenSilently();

    user = await auth.getUser();
    authStatus = user?.name ? `Hello, ${user.name}` : 'User is logged in';
  }

  async function initializeAuth() {
    try {
      auth = await createAuth({
        domain: authConfig.domain,
        clientId: authConfig.clientId,
        authorizationParams: {
          redirect_uri: returnTo,
          audience: authConfig.audience,
          scope: authConfig.scope,
        },
        cacheLocation: 'localstorage',
      });

      if (isAuthCallback()) {
        authStatus = 'Verifying authentication';
        await auth.handleRedirectCallback();
        window.history.replaceState({}, document.title, returnTo);
      }

      await refreshAuthState();
    } catch (error) {
      const authError = /** @type {{error?: string, message?: string}} */ (error || {});
      if (authError?.error === 'login_required' || authError?.error === 'unauthorized') {
        clearAuthState();
      } else {
        errorMessage = `Authentication error: ${authError?.message || JSON.stringify(authError)}`;
      }
    } finally {
      isLoading = false;
    }
  }

  function login() {
    if (!auth) {
      return;
    }
    authStatus = 'Redirecting to login';
    auth.loginWithRedirect();
  }

  function logout() {
    if (!auth) {
      return;
    }

    authStatus = 'Logging out...';
    clearAuthState();
    auth.logout({
      logoutParams: {
        returnTo,
      },
    });
  }

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token);
      tokenCopyMessage = 'Token copied to clipboard.';
    } catch (error) {
      tokenCopyMessage = 'Unable to copy token.';
      console.error('Failed to copy token:', error);
    }
  }

  async function loadSchwabData() {
    if (!token) {
      schwabError = 'No JWT token available. Please log in again.';
      schwab.set(null);
      return;
    }

    schwabLoading = true;
    schwabError = '';

    try {
      const response = await fetch(schwabUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const payload = await response.json();
      schwab.set(payload);
    } catch (error) {
      const requestError = /** @type {{message?: string}} */ (error || {});
      schwabError = requestError.message || 'Unable to call /schwab endpoint.';
      schwab.set(null);
    } finally {
      schwabLoading = false;
    }
  }

  onMount(async () => {
    await initializeAuth();

    if (isAuthenticated) {
      await loadSchwabData();
    }
  });
</script>

<main class="main">
  <h1>divs</h1>

  {#if isLoading}
    <p>Checking authentication...</p>
  {:else}
    {#if errorMessage}
      <p class="error">{errorMessage}</p>
    {/if}

    {#if authStatus}
      <p class="status">{authStatus}</p>
    {/if}

    {#if schwabLoading}
      <p class="status">Loading Schwab data...</p>
    {/if}

    {#if isAuthenticated}
      <div class="user-card relative pr-12">
        {#if token}
          <div class="tooltip tooltip-left absolute right-3 top-3" data-tip={tokenCopyMessage || 'Copy token'}>
            <button
              class="btn btn-ghost btn-xs btn-circle"
              type="button"
              on:click={copyToken}
              aria-label="Copy token"
            >
              <Copy size={14} aria-hidden="true" />
            </button>
          </div>
        {/if}

        <p><strong>Name:</strong> {user?.name || 'Unknown user'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
      </div>
      <div class="actions">
        <button type="button" on:click={logout}>Log Out</button>
      </div>

      {#if schwabError}
        <p class="error">{schwabError}</p>
      {/if}

      <Monthly />
    {:else}
      <button type="button" on:click={login}>Log In</button>
    {/if}
  {/if}
</main>

