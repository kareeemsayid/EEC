# EEC – Employee Exit Command Center

A production-ready React + TypeScript application for managing employee attrition cases at Concentrix. Integrates with Microsoft Azure AD (MSAL), SharePoint (via Microsoft Graph), and Power Automate flows.

---

## Prerequisites

- Node.js 18+
- Azure AD App Registration with the following API permissions:
  - `User.Read`
  - `Sites.ReadWrite.All`
  - `Files.ReadWrite.All`
- SharePoint Online site with the following lists:
  - `Accounts` (Title, WarningHours, CriticalHours, DocumentGraceHours)
  - `LOBs` (Title, Account [lookup])
  - `Sites` (Title)
  - `AttritionCases` (all case fields)
  - `CaseUpdates` (audit log fields)
  - `EmailThreadTracking` (conversation tracking)
- Two Power Automate HTTP-triggered flows (Create Case, Update Case)

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/your-org/eec.git
cd eec
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
REACT_APP_AZURE_AD_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_AZURE_AD_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_AZURE_AD_REDIRECT_URI=http://localhost:3000
REACT_APP_SHAREPOINT_SITE_URL=https://yourtenant.sharepoint.com/sites/yoursite
REACT_APP_POWER_AUTOMATE_CREATE_CASE_URL=https://prod-xx.eastus.logic.azure.com/...
REACT_APP_POWER_AUTOMATE_UPDATE_CASE_URL=https://prod-xx.eastus.logic.azure.com/...
```

### 3. Azure AD App Registration

In the Azure Portal:
1. Create a new App Registration
2. Set **Redirect URI** to `http://localhost:3000` (SPA type)
3. Under **API permissions**, add:
   - Microsoft Graph → `User.Read` (delegated)
   - Microsoft Graph → `Sites.ReadWrite.All` (delegated)
4. Enable **Implicit grant** for Access tokens and ID tokens
5. Copy the **Application (client) ID** and **Directory (tenant) ID** to your `.env.local`

### 4. Run locally

```bash
npm start
```

---

## Deployment – Azure Static Web Apps

### Via GitHub Actions

1. Push to GitHub
2. In Azure Portal → create a **Static Web App**
3. Connect to your GitHub repo
4. Set **App location**: `/` and **Output location**: `build`
5. Add all `REACT_APP_*` environment variables in the **Configuration** section of the Static Web App
6. In your Azure AD App Registration, add the production URL as an additional **Redirect URI**

### Manual build

```bash
npm run build
# Deploy the `build/` folder to your static host
```

---

## Project Structure

```
src/
├── auth/
│   ├── msalConfig.ts       # MSAL configuration & scopes
│   └── useAuth.ts          # Auth hook (login, logout, token, profile)
├── api/
│   ├── sharepoint.ts       # Microsoft Graph / SharePoint CRUD
│   └── powerAutomate.ts    # Power Automate flow triggers
├── pages/
│   ├── LoginPage.tsx       # Microsoft SSO login screen
│   ├── HomeScreen.tsx      # Dashboard with KPIs, cases, activity
│   ├── SubmitCase.tsx      # 3-step case submission form
│   └── UpdateCase.tsx      # Case lookup & update form
├── components/
│   ├── Layout.tsx          # Nav shell
│   ├── RiskBadge.tsx       # Risk status pill with tooltip
│   ├── StageBadge.tsx      # Lifecycle stage pill
│   ├── StepIndicator.tsx   # Multi-step form indicator
│   ├── RiskPreview.tsx     # Live risk assessment widget
│   ├── LoadingSpinner.tsx
│   └── ErrorBanner.tsx
├── utils/
│   ├── types.ts            # All TypeScript interfaces
│   ├── subReasons.ts       # Full 27-category sub-reason map
│   ├── riskLogic.ts        # Risk calculation & severity modifier
│   └── formatters.ts       # Date, hours, time-ago formatters
└── styles/
    └── index.css           # Tailwind + global styles
```

---

## SharePoint List Schema

### AttritionCases
| Field | Type |
|---|---|
| Title | Text (auto) |
| CaseNumber | Text |
| TraineeName | Text |
| OracleID | Text |
| PersonalEmail | Text |
| Account | Lookup → Accounts |
| LOB | Lookup → LOBs |
| Site | Lookup → Sites |
| Wave | Text |
| TrainerName | Text |
| TrainerEmail | Text |
| TrainingManager | Text |
| TrainingManagerEmail | Text |
| AttritionCategory | Choice |
| SubReason | Text |
| SeverityLevel | Choice (Low/Medium/High/Critical) |
| TotalMissedHours | Number |
| IncidentDate | Date |
| RiskStatus | Choice (Monitoring/High Risk/Critical) |
| LifecycleStage | Choice |
| CaseStatus | Choice (Open/Pending/Escalated/Closed) |
| Notes | Multi-line Text |
| DocumentationRequired | Yes/No |
| EscalationRequired | Yes/No |
| OutlookConversationID | Text |

---

## Power Automate Flow Contracts

### Create Case Flow
**Trigger**: HTTP POST  
**Input**: `CreateCasePayload` (see `src/utils/types.ts`)  
**Response**:
```json
{ "caseNumber": "EEC-2024-001", "conversationId": "AAMkAG..." }
```

### Update Case Flow
**Trigger**: HTTP POST  
**Input**: `UpdateCasePayload`  
**Response**:
```json
{ "caseNumber": "EEC-2024-001", "updated": true }
```

---

## License

Concentrix Internal Use Only
