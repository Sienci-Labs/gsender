<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into gSender. PostHog is initialized in `entry-client.tsx` with `PostHogProvider` and `PostHogErrorBoundary` wrapping the entire app. Event tracking has been added to five key feature areas covering the core CNC workflow: connecting a machine, loading G-code files, controlling jobs, running probe operations, and responding to the data collection consent prompt. Environment variables are stored in `src/app/.env` and referenced via `import.meta.env` in the Vite app.

| Event | Description | File |
|-------|-------------|------|
| `machine_connected` | User successfully connects to a CNC machine | `src/app/src/features/Connection/index.tsx` |
| `machine_disconnected` | User manually disconnects from the CNC machine | `src/app/src/features/Connection/index.tsx` |
| `connection_failed` | Attempt to connect to a CNC machine fails | `src/app/src/features/Connection/index.tsx` |
| `file_loaded` | User loads a G-code file into the application | `src/app/src/features/FileControl/ButtonControlGroup.tsx` |
| `file_closed` | User closes/unloads the currently loaded G-code file | `src/app/src/features/FileControl/ButtonControlGroup.tsx` |
| `job_started` | User starts a CNC job from idle state | `src/app/src/features/JobControl/ControlButton.tsx` |
| `job_paused` | User pauses a running CNC job | `src/app/src/features/JobControl/ControlButton.tsx` |
| `job_resumed` | User resumes a paused CNC job | `src/app/src/features/JobControl/ControlButton.tsx` |
| `job_stopped` | User stops a running or paused CNC job | `src/app/src/features/JobControl/ControlButton.tsx` |
| `probe_run` | User executes a probing routine (Z touch, XYZ touch, etc.) | `src/app/src/features/Probe/index.tsx` |
| `data_collection_accepted` | User accepts anonymous usage data collection | `src/app/src/features/DataCollection/index.tsx` |
| `data_collection_declined` | User declines anonymous usage data collection | `src/app/src/features/DataCollection/index.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/404289/dashboard/1529222)
- **Job start funnel** — conversion from machine connection → file loaded → job started: [inhKbkBs](https://us.posthog.com/project/404289/insights/inhKbkBs)
- **Job activity over time** — daily trend of jobs started, paused, and stopped: [cxJ7dSBT](https://us.posthog.com/project/404289/insights/cxJ7dSBT)
- **Connection success vs failure** — bar chart of successful connections vs failures: [L0ZPQhN9](https://us.posthog.com/project/404289/insights/L0ZPQhN9)
- **Probe usage by type** — breakdown of probe runs by command type (Z Touch, XYZ Touch, etc.): [IogoqwFX](https://us.posthog.com/project/404289/insights/IogoqwFX)
- **Data collection consent rate** — accepted vs declined over the last 90 days: [XX35QL5y](https://us.posthog.com/project/404289/insights/XX35QL5y)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
