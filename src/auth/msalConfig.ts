// src/auth/msalConfig.ts
import { Configuration, LogLevel } from "@azure/msal-browser";

// ─── All values come from environment variables ONLY ───────────────────────
// Never hardcode Client ID, Tenant ID, or Redirect URI in source code.
// Set these as GitHub Secrets → they become REACT_APP_* env vars at build time.
const clientId = process.env.REACT_APP_AZURE_AD_CLIENT_ID || "00000000-0000-0000-0000-000000000000";
const tenantId = process.env.REACT_APP_AZURE_AD_TENANT_ID || "common";
const redirectUri =
  process.env.REACT_APP_AZURE_AD_REDIRECT_URI ||
  window.location.origin;

// Guard: warn during development if vars are missing
if (!clientId || !tenantId) {
  console.warn(
    "[msalConfig] Missing REACT_APP_AZURE_AD_CLIENT_ID or REACT_APP_AZURE_AD_TENANT_ID. " +
    "Set these environment variables for Azure AD authentication to work."
  );
}

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
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

export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read", "User.ReadBasic.All"],
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};
