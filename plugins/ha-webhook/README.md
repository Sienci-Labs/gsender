# Home Assistant Webhook (sample plugin)

A sample gSender plugin that sends machine and job events to a
[Home Assistant webhook trigger](https://www.home-assistant.io/docs/automation/trigger/#webhook-trigger),
so you can build automations such as:

- send a phone notification when a job finishes
- turn the dust collector on while a job runs, and off when it ends
- flash a light when the machine goes into alarm

It only **reads** gSender state (`redux:read` + `storage`). It can't send
commands or move the machine.

## Events

| `event`           | When                                                            |
| ----------------- | --------------------------------------------------------------- |
| `connected`       | gSender connects to the controller                              |
| `disconnected`    | gSender disconnects                                             |
| `machine_state`   | Machine state changes (Idle, Run, Hold, Jog, Home, Door, ...)   |
| `alarm`           | Machine enters Alarm                                            |
| `job_started`     | A job starts                                                    |
| `job_paused`      | A running job is paused                                         |
| `job_resumed`     | A paused job resumes                                            |
| `job_finished`    | A job ends with every line sent                                 |
| `job_stopped`     | A job ends before completion (stopped by the user, or an error) |
| `job_progress`    | Every N seconds while a job is running (configurable)           |
| `test`            | The **Send test** button                                        |

Every event has the same flat set of fields:

```
event, timestamp, connected, machine_state, alarm_code, job_state, file,
progress, lines_received, lines_total, elapsed_s, remaining_s
```

All values are sent as strings. Convert them in templates, e.g. `{{ trigger.data.progress | int }}`.

## Build & install

```sh
cd plugins/ha-webhook
npm install
npm run build        # outputs ui/
```

`react` and `react-dom` are dev dependencies even though this plugin doesn't
use React. The SDK's Vite plugin always bundles them into `ui/vendor`.

Then install the folder through **Tools → Plugins → Install**, or copy it into
your plugins folder and restart gSender. The plugin appears as a
**Home Assistant** tab in the Tools panel on the main screen.

## Set up Home Assistant

1. Create an automation with a webhook trigger. Pick a hard-to-guess ID,
   because anyone on your network who knows it can trigger the automation.
2. In gSender, open the **Home Assistant** tab and enter
   `http://<your-ha-host>:8123/api/webhook/<your-id>`.
3. Choose a body format (see below), tick **Send events**, click **Save**,
   then **Send test**.

### Body format

The plugin runs in gSender's browser window, so browser CORS rules apply.

- **Form fields (default):** sent as a simple form POST in `no-cors` mode.
  It needs no Home Assistant config, but the plugin can't see whether HA
  accepted it (the log only says "sent"). In automations, read the values from
  `trigger.data.<field>`.
- **JSON:** a normal request, so the log shows the real HTTP status. Home
  Assistant must allow gSender's origin, otherwise the browser blocks it:

  ```yaml
  # configuration.yaml
  http:
    cors_allowed_origins:
      - http://localhost:8000   # gSender's address as shown in the browser/app
  ```

  In automations, read the values from `trigger.json.<field>`.

### Example automation

```yaml
alias: CNC job finished
triggers:
  - trigger: webhook
    webhook_id: gsender-cnc-7f3a91
    allowed_methods: [POST]
    local_only: true
conditions:
  - condition: template
    value_template: "{{ trigger.data.event == 'job_finished' }}"
actions:
  - action: notify.mobile_app_my_phone
    data:
      title: CNC
      message: >-
        {{ trigger.data.file }} finished in
        {{ (trigger.data.elapsed_s | int / 60) | round(0) }} min
```

To keep the latest values as sensors, use a
[template trigger sensor](https://www.home-assistant.io/integrations/template/#trigger-based-template-binary-sensors-buttons-images-numbers-selects-and-sensors)
that has the same webhook trigger.

## Limitations

- **It only runs while gSender's UI is open.** The Tools panel keeps
  plugin tabs alive when they aren't selected and when you move to other
  pages. But on a headless install with no browser open, nothing is sent.
- **Every open gSender window sends its own copy.** If you have gSender
  open in two places, Home Assistant receives every event twice.
- **The webhook URL is stored in plain text** in gSender's settings file.
- **Events reflect what the UI sees.** A state change that the UI never
  received (for example, while it was disconnected) won't be sent.
