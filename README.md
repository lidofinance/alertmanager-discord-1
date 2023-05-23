Converts Prometheus Alertmanager webhook to Discord webhook.

## Usage

Default port to listen on is 5001 and can be configured by environment variable `PORT`.

Store configuration at `/etc/alertmanager-discord.yml` file e.g.:

```yaml
hooks:
  - slug: collaterals-monitoring
    hook: https://discord.com/api/webhook/123
  - slug: balval-alerts
    hook: https://discord.com/api/webhook/456
  - slug: automation-eng
    hook: https://discord.com/api/webhook/789
```

Configure alertmanager to send alerts to the related hook:

```yaml
receivers:
  - name: "collaterals-monitoring"
    webhook_configs:
      - url: "http://alertmanager-discord:5001/hook/collaterals-monitoring"
        send_resolved: false

  - name: "balval-alerts"
    webhook_configs:
      - url: "http://alertmanager-discord:5001/hook/balval-alerts"
```

## Additional features

#### Discord users mentions

Provide `mentions` alert's label value to mention arbitrary Discord user:

```yaml
mentions: <user_id_0>,<user_id_1>
```

User ID may be found on Discord by **Copy ID** context menu item available with
developer mode is turned on.

#### Title and description templating

Provide `TITLE_TMPL` and `DESCR_TMPL` to override title and/or description, e.g. in docker-compose:

```yaml
environment:
  TITLE_TMPL: >
    {{@if(it.status==='resolved'}}
    {{it.annotations.onResolved|d('')}}
    {{/if}}
```

If template is evaluating to an empty string, `annotations.summary` and `annotations.description` fields
will be used for title and description respectivelly.

Look at [squirrelly](https://squirrelly.js.org) docs for templating reference.

#### Inline fields

Provide `inline_fields` alert's annotation to insert the inline fields with the values provided by the markdown list:

```yaml
inline_fields: |
  - hello
  - there
```

## Release flow

To create new release:

1. Merge all changes to the `master` branch
1. Navigate to Repo => Actions
1. Run action "Prepare release" action against `master` branch
1. When action execution is finished, navigate to Repo => Pull requests
1. Find pull request named "chore(release): X.X.X" review and merge it with "Rebase and merge" (or "Squash and merge")
1. After merge release action will be triggered automatically
1. Navigate to Repo => Actions and see last actions logs for further details
