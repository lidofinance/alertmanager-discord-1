const axios = require("axios");

const colors = { firing: 0xd50000, resolved: 0x00c853 };

function getMentions(alert) {
  const mentions = alert.labels["mentions"];
  if (!mentions) {
    return [];
  }

  return mentions
    .replace(/\s/g, "")
    .split(",")
    .filter(Boolean)
    .map((m) => `<@${m}>`);
}

async function handleHook(ctx) {
  ctx.status = 200;

  let hook = ctx.routes[ctx.params.slug];
  if (hook === undefined) {
    ctx.status = 404;
    console.warn(`Slug "${ctx.params.slug}" was not found in routes`);
    return;
  }

  if (ctx.request.body === undefined || !Array.isArray(ctx.request.body.alerts)) {
    ctx.status = 400;
    console.error("Unexpected request from Alertmanager:", ctx.request.body);
    return;
  }

  const objectsToSend = [];

  ctx.request.body.alerts.forEach((alert) => {
    if (alert.annotations && (alert.annotations.summary || alert.annotations.description)) {
      let body = {
        embeds: [
          {
            title: alert.annotations.summary,
            description: alert.annotations.description,
            color: alert.status === "resolved" ? colors.resolved : colors.firing,
          },
        ],
      };

      const mentions = getMentions(alert);
      body = mentions.length
        ? {
            allowed_mentions: { parse: ["users"] },
            content: mentions.join(" "),
            ...body,
          }
        : body;

      objectsToSend.push(body);
    }
  });

  if (!objectsToSend.length) {
    ctx.status = 400;
    console.warn(
      "Nothing to send, all alerts has been filtered out. Recieved data:",
      ctx.request.body.alerts
    );
    return;
  }

  for (const body of objectsToSend) {
    await axios.post(hook, body).catch((err) => {
      ctx.status = 500;
      console.error(err);
      return;
    });
  }

  console.log(`${objectsToSend.length} objects have been sent`);
}

async function handleHealthcheck(ctx) {
  let hook;

  for (const key in ctx.routes) {
    hook = ctx.routes[key];
    break;
  }

  if (hook === undefined) {
    console.warn("No routes has been configured!");
    ctx.status = 503;
    return;
  }

  await axios
    .get(hook)
    .then(() => {
      ctx.status = 200;
      ctx.body = { uptime: process.uptime() };
    })
    .catch((err) => {
      ctx.status = 503;
      if (err.response && err.response.data) {
        console.error(err.response.data);
      } else {
        console.error(err);
      }
    });
}

module.exports = {
  handleHook,
  handleHealthcheck,
  getMentions,
};
