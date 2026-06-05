<script>
  import { onMount } from 'svelte';
  import createAuth from '@tridnguyen/auth/spa';

  const authConfig = {
    domain: 'tridnguyen.auth0.com',
    clientId: 'PjP6M9OtNzBT8VerWH6kpFhi3u4LU7bF',
    audience: 'https://sheets.cloud.tridnguyen.com',
    scope: 'openid profile email',
  };

  const basePath = import.meta.env.BASE_URL || '/';
  const returnTo = `${window.location.origin}${basePath}`;
  const schwabUrl = import.meta.env.DEV
    ? 'http://localhost:3000/schwab'
    : 'https://sheets.cloud.tridnguyen.com/schwab';

  let auth;
  let isLoading = true;
  let isAuthenticated = false;
  let user = null;
  let token = '';
  let authStatus = '';
  let errorMessage = '';
  let isCallingSchwab = false;
  let schwabResponse = '';
  let schwabError = '';

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
    schwabResponse = '';
    schwabError = '';
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

    token = await auth.getTokenSilently({
      authorizationParams: {
        audience: authConfig.audience,
        scope: 'read:list write:list',
      },
    });

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
      const authError = error;
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

  async function callSchwab() {
    if (!token) {
      schwabError = 'No JWT token available. Please log in again.';
      schwabResponse = '';
      return;
    }

    isCallingSchwab = true;
    schwabError = '';
    schwabResponse = '';

    try {
      const response = await fetch(schwabUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Request failed (${response.status}): ${text}`);
      }

      try {
        schwabResponse = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        schwabResponse = text;
      }
    } catch (error) {
      schwabError = error?.message || 'Unable to call /schwab endpoint.';
    } finally {
      isCallingSchwab = false;
    }
  }

  onMount(async () => {
    await initializeAuth();
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

    {#if isAuthenticated}
      <div class="user-card">
        <p><strong>Name:</strong> {user?.name || 'Unknown user'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>Token:</strong> <span class="token-value">{token ? token : 'Unavailable'}</span></p>
      </div>
      <div class="actions">
        <button type="button" on:click={callSchwab} disabled={isCallingSchwab}>
          {isCallingSchwab ? 'Calling /schwab...' : 'Call /schwab'}
        </button>
        <button type="button" on:click={logout}>Log Out</button>
      </div>

      {#if schwabError}
        <p class="error">{schwabError}</p>
      {/if}

      {#if schwabResponse}
        <div class="response-card">
          <p><strong>/schwab response</strong></p>
          <pre>{schwabResponse}</pre>
        </div>
      {/if}
    {:else}
      <button type="button" on:click={login}>Log In</button>
    {/if}
  {/if}
</main>
