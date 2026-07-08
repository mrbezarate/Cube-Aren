# Underground Arena Workspace Rules

## Browser Subagent Instructions
- **Session Reuse:** Before performing any login or registration action, the browser subagent must check if a user is already logged in (e.g., by looking for the presence of profile elements, dashboard links, or a wallet balance in the header).
- **Avoid Redundant Actions:** If a session already exists, do not clear cookies/localStorage or try to register/login again. Continue executing the task with the current user.
- **Redirection Logic:** Authenticated users trying to access `/auth/login` or `/auth/register` are automatically redirected to `/tournaments` by the middleware. Do not try to load these routes while authenticated.
