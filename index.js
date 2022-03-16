// Simple Discord webhook proxy for Alertmanager

const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const axios = require('axios');
const yaml = require('js-yaml');
const fs = require('fs');

const port = process.env.PORT || 5001;
const configPath = "/etc/alertmanager-discord.yml";
const hookRegExp = new RegExp('https://discord(?:app)?.com/api/webhooks/[0-9]{18}/[a-zA-Z0-9_-]+');
const colors = {firing: 0xd50000, resolved: 0x00c853};
const maxEmbedsLength = 10;
const routes = {};

async function handleHook(ctx) {
  let hook = routes[ctx.params.slug];

  if (hook === undefined) {
    ctx.status = 404;
    console.warn(`Slug "${ctx.params.slug}" was not found in routes`);
    return;
  }

  if (ctx.request.body === undefined || !Array.isArray(ctx.request.body.alerts)) {
    ctx.status = 400;
    console.error('Unexpected request from Alertmanager:', ctx.request.body);
    return;
  }

  const embeds = [];

  ctx.request.body.alerts.forEach(alert => {
    if (alert.annotations && (alert.annotations.summary || alert.annotations.description)) {
      embeds.push({
        title: alert.annotations.summary,
        description: alert.annotations.description,
        color: alert.status === 'resolved' ? colors.resolved : colors.firing,
      });
    }
  });

  if (!embeds.length) {
    ctx.status = 400;
    console.warn('Nothing to send, all alerts has been filtered out. Recieved data:', ctx.request.body.alerts);
    return;
  }

  let chunk = [];
  while ((chunk = embeds.splice(0, maxEmbedsLength)) && chunk.length) {
    await axios.post(
      hook,
      {embeds: chunk},
    ).then(() => {
      ctx.status = 200;
      console.log(chunk.length + ' embeds sent');
    }).catch(err => {
      ctx.status = 500;
      console.error(err);
      return;
    });
  }

  ctx.status = 500;
}

async function handleHealthcheck(ctx) {
  let hook;

  for (const key in routes) {
    hook = routes[key];
    break;
  }
  
  await axios.get(hook)
    .then(() => {
      ctx.status = 200;
      ctx.body = {uptime: process.uptime()};
    }).catch(err => {
      ctx.status = 503;
      if (err.response && err.response.data) {
        console.error(err.response.data);
      } else {
        console.error(err);
      }
    });
}

const router = new Router();
router.post('/hook/:slug',
  bodyParser({
    enableTypes: ['json'],
    extendTypes: {
      json: ['*/*'],
    },
    onerror: (err, ctx) => {
      console.warn(err);
      ctx.throw(400);
    },
  }),
  handleHook,
).get('/health',
  handleHealthcheck,
);

if (require.main === module) {
  let config;

  try {
    config = yaml.load(fs.readFileSync(configPath));
  } catch (err) {
    console.error('Failed to read configuration file:', err.message);
    process.exit(1);
  }

  if (config.hooks === undefined || !config.hooks.length) {
    console.error('Expected "hooks" array in configuration file');
    process.exit(1);
  }

  for (let route of config.hooks) {
    if (!route.hook || !route.hook.startsWith || !hookRegExp.test(route.hook)) {
      console.error('Not a valid discord web hook:', route.hook);
      process.exit(1);
    }

    routes[route.slug] = route.hook;
  }

  const app = new Koa();

  app.use(router.routes());
  app.listen(port, (err) => {
    if (err) {
      return console.error(err);
    }

    console.info('Listening on port ' + port);
  });
}
