const Router = require("@koa/router");
const bodyParser = require("koa-bodyparser");

const { handleHook, handleHealthcheck } = require("./handlers_default");
const { handleHook: handleHookAlt } = require("./handlers_alternative");

const router = new Router();

router
  .post(
    "/hook/:slug",
    bodyParser({
      enableTypes: ["json"],
      extendTypes: {
        json: ["*/*"],
      },
      onerror: (err, ctx) => {
        ctx.logger.warn(err.stack);
        ctx.logger.warn(`Body: ${JSON.stringify(err.body)}`);
        ctx.logger.warn(`Body length: ${err.body != null ? err.body.length : 0}`)
        ctx.logger.warn(`Status: ${err.status}`);
        ctx.throw(400);
      },
    }),
    process.env.WORKING_MODE === 'alternative' ? handleHookAlt : handleHook
  )
  .get("/health", handleHealthcheck);

module.exports = {
  router,
};
