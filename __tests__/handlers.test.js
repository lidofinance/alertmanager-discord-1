const axios = require("axios");
jest.mock("axios");

const { handleHook } = require("../handlers");

function getAlert(i) {
  return {
    status: "resolved",
    labels: { alertname: "activate" },
    annotations: {
      description: "cinema",
      summary: "donor" + String(i).padStart(2, "0"),
    },
  };
}

test("hook works", async () => {
  // mock
  const ctx = {
    routes: { test: "/dev/null" },
    params: { slug: "test" },

    request: {
      body: {
        alerts: Array.from({ length: 11 }, (_, i) => getAlert(i)),
      },
    },
  };

  axios.post.mockResolvedValue(null);

  await handleHook(ctx, () => {});

  expect(ctx.status).toBe(200);
  expect(axios.post.mock.calls.length).toBe(2);
  expect(axios.post.mock.calls).toMatchSnapshot();
});
