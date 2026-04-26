# Sandy Lab Frontend (React + Vite)

UI for Sandy Labs operations:
- dashboard with real backend data
- projects with start/end/deadline fields
- inventory and experiments CRUD
- calendar with separate project milestones vs operational events
- assistant + oversight views

## Setup

```bash
cd frontend
npm install
npm run dev
```

Default dev URL:
- `http://localhost:5173`

Login:
- `http://localhost:5173/login`

## Environment

Optional `frontend/.env` values:

```env
VITE_API_BASE=
VITE_LIVE_AGENT=false
VITE_AGENT_ARCH=deepagent
```

- If `VITE_API_BASE` is empty, Vite proxy forwards `/api` to backend.
- `VITE_LIVE_AGENT=true` enables streaming chat mode.

## Main Routes

- `/` Home (Sandy Labs context/mission)
- `/dashboard` Real-time operations summary
- `/projects` Project CRUD (start/end/deadline)
- `/inventory` Inventory CRUD + transaction workflow
- `/experiments` Experiment CRUD
- `/calendar` Combined timeline (project milestones + events)
- `/assistant` Agent chat (with supervised approvals)
- `/oversight` Usage + orchestration traces
- `/settings` Theme/profile/admin user management

## Build

```bash
npm run build
```

## Notes

- Auth token is stored in localStorage key `sandy_lab_token`.
- Theme preference is stored in `bb-dashboard-theme`.
- Assistant session continuity uses `lab_assistant_session_id`.
