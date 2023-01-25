const axios = require("axios");
const { compileTitle, compileDescr } = require("./templating");

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
    try {
      if (!alert.annotations?.summary && !alert.annotations?.description) return;

      let body = {
        embeds: [
          {
            title: compileTitle(alert),
            description: compileDescr(alert),
            color: colors[alert.status],
          },
        ],
      };

      const mentions = getMentions(alert);
      if (mentions.length) {
        body.allowed_mentions = { parse: ["users"] };
        body.content = mentions.join(" ");
      }

      objectsToSend.push(body);
    } catch (err) {
      console.error(err);
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
