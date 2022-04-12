const axios = require("axios");

const colors = { firing: 0xd50000, resolved: 0x00c853 };
const maxEmbedsLength = 10;

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

  const embeds = [];

  ctx.request.body.alerts.forEach((alert) => {
    if (alert.annotations && (alert.annotations.summary || alert.annotations.description)) {
      embeds.push({
        title: alert.annotations.summary,
        description: alert.annotations.description,
        color: alert.status === "resolved" ? colors.resolved : colors.firing,
      });
    }
  });

  if (!embeds.length) {
    ctx.status = 400;
    console.warn(
      "Nothing to send, all alerts has been filtered out. Recieved data:",
      ctx.request.body.alerts
    );
    return;
  }

  let chunk = [];
  while ((chunk = embeds.splice(0, maxEmbedsLength)) && chunk.length) {
    await axios
      .post(hook, { embeds: chunk })
      .then(() => {
        console.log(chunk.length + " embeds sent");
      })
      .catch((err) => {
        ctx.status = 500;
        console.error(err);
        return;
      });
  }
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
};
