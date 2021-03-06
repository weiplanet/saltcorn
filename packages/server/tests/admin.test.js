const request = require("supertest");
const getApp = require("../app");
const {
  getStaffLoginCookie,
  getAdminLoginCookie,
  toRedirect,
  itShouldRedirectUnauthToLogin,
  toInclude,
  toSucceed,
  toNotInclude,
  resetToFixtures,
} = require("../auth/testhelp");
const db = require("@saltcorn/data/db");
const fs = require("fs").promises;
const File = require("@saltcorn/data/models/file");

beforeAll(async () => {
  await resetToFixtures();
  const mv = async (fnm) => {
    await fs.writeFile(fnm, "nevergonnagiveyouup");
  };
  await File.from_req_files(
    { mimetype: "image/png", name: "rick.png", mv, size: 245752 },
    1,
    4
  );
});
afterAll(db.close);

describe("admin page", () => {
  itShouldRedirectUnauthToLogin("/admin");
  it("show admin page", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .get("/admin")
      .set("Cookie", loginCookie)
      .expect(toInclude("Restart"));
  });
  it("show download backup", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .post("/admin/backup")
      .set("Cookie", loginCookie)
      .expect(toSucceed());
  });
});

describe("crash log", () => {
  itShouldRedirectUnauthToLogin("/crashlog");
  it("show crashlog list", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .get("/crashlog")
      .set("Cookie", loginCookie)
      .expect(toInclude("No errors reported"));
  });
  it("crashes on missing id", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    console.log(
      "An error is printed below. This is expected as part of the test."
    );
    await request(app)
      .get("/crashlog/99")
      .set("Cookie", loginCookie)
      .expect(toInclude("squirrels", 500));
  });
  it("show crashlog list with errors", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .get("/crashlog")
      .set("Cookie", loginCookie)
      .expect(toInclude("Show"))
      .expect(toInclude("no _sc_errors where id"));
  });
  it("show crashlog entry", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .get("/crashlog/1")
      .set("Cookie", loginCookie)
      .expect(toInclude("no _sc_errors where id"))
      .expect(toInclude("stack"));
  });
});

describe("menu editor", () => {
  itShouldRedirectUnauthToLogin("/menu");
  it("show menu editor", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .get("/menu")
      .set("Cookie", loginCookie)
      .expect(toInclude("Menu editor"));
  });
  it("post menu", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .post("/menu")
      .set("Cookie", loginCookie)
      .send("site_name=Saltcorn")
      .send("site_logo_id=0")
      .send("type_0=View")
      .send("label_0=Foo")
      .send("min_role_0=10")
      .send("url_0=")
      .send("pagename_0=a_page")
      .send("viewname_0=authorlist")
      .send("type_1=Page")
      .send("label_1=Projects")
      .send("min_role_1=10")
      .send("url_1=")
      .send("pagename_1=a_page")
      .send("viewname_1=authorlist")
      .send("type_2=Link")
      .send("label_2=BarMenu")
      .send("min_role_2=10")
      .send("url_2=https%3A%2F%2Fgithub.com%2Fsaltcorn%2Fsaltcorn")
      .send("pagename_2=a_page")
      .send("viewname_2=authorlist")
      .expect(toRedirect("/menu"));
  });
  it("show new menu", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .get("/")
      .set("Cookie", loginCookie)
      .expect(toInclude("BarMenu"));
  });
});
describe("actions", () => {
  itShouldRedirectUnauthToLogin("/actions");
  it("show actions editor", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .get("/actions")
      .set("Cookie", loginCookie)
      .expect(toInclude("Actions available"))
      .expect(toInclude("webhook"));
  });
  it("show new action", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .get("/actions/trigger/new")
      .set("Cookie", loginCookie)
      .expect(toInclude("New trigger"))
      .expect(toInclude("webhook"));
  });
  it("post trigger", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .post("/actions/trigger")
      .set("Cookie", loginCookie)
      .send("action=run_js_code")
      .send("table_id=2")
      .send("when_trigger=Insert")
      .expect(toRedirect("/actions/configure/1"));
  });
  it("show configure", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .get("/actions/configure/1")
      .set("Cookie", loginCookie)
      .expect(toInclude("Configure trigger"))
      .expect(toInclude("Code"));
  });
  it("post config", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .post("/actions/configure/1")
      .set("Cookie", loginCookie)
      .send("code=1")
      .expect(toRedirect("/actions/"));
  });
  it("deletes trigger", async () => {
    const app = await getApp({ disableCsrf: true });
    const loginCookie = await getAdminLoginCookie();
    await request(app)
      .post("/actions/delete/1")
      .set("Cookie", loginCookie)
      .expect(toRedirect("/actions/"));
  });
});
