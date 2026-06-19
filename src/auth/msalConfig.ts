// src/auth/msalConfig.ts
import { Configuration, LogLevel } from "@azure/msal-browser";

// ─── All values come from environment variables ONLY ───────────────────────
// Never hardcode Client ID, Tenant ID, or Redirect URI in source code.
// Set these as GitHub Secrets → they become REACT_APP_* env vars at build time.
const clientId = process.env.REACT_APP_AZURE_AD_CLIENT_ID!;
const tenantId = process.env.REACT_APP_AZURE_AD_TENANT_ID!;
const redirectUri =
  process.env.REACT_APP_AZURE_AD_REDIRECT_URI ||
  window.location.origin;

// Guard: fail fast during development if vars are missing
if (!clientId || !tenantId) {
  throw new Error(
    "[msalConfig] Missing REACT_APP_AZURE_AD_CLIENT_ID or REACT_APP_AZURE_AD_TENANT_ID. " +
    "Check your GitHub Secrets and workflow env block."
  );
}

export const msalConfig: Configuration = {
  auth: {
    clientId,
    // Use your specific tenant — do NOT use "common" unless you want
    // users from ANY Microsoft tenant (including Concentrix) to log in.
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage", // safer than localStorage
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:   console.error(message); break;
          case LogLevel.Warning: console.warn(message);  break;
          case LogLevel.Info:    console.info(message);  break;
          case LogLevel.Verbose: console.debug(message); break;
        }
      },
      piiLoggingEnabled: false,
    },
  },
};

// Scopes requested at login
export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

// Graph API endpoint (if you need to call MS Graph later)
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};
