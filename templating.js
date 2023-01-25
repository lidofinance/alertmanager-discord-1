const sqrl = require("squirrelly");

const titleTmpl = process.env.TITLE_TMPL || "{{it.annotations.summary}}";
const descrTmpl = process.env.DESCR_TMPL || "{{it.annotations.description}}";

const compileTitle = (alert) => {
  return sqrl.render(titleTmpl, alert);
};

const compileDescr = (alert) => {
  return sqrl.render(descrTmpl, alert);
};

module.exports = {
  compileTitle,
  compileDescr,
};
