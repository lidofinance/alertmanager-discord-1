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
