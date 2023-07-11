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
        console.warn(err);
        ctx.throw(400);
      },
    }),
    process.env.WORKING_MODE === 'alternative' ? handleHookAlt : handleHook
  )
  .get("/health", handleHealthcheck);

module.exports = {
  router,
};
