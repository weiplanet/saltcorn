const Table = require("../models/table");
const Field = require("../models/field");
const Trigger = require("../models/trigger");
const db = require("../db");
const { getState } = require("../db/state");
const {
  plugin_with_routes,
  getActionCounter,
  resetActionCounter,
} = require("./mocks");

afterAll(db.close);

beforeAll(async () => {
  await require("../db/reset_schema")();
  await require("../db/fixtures")();
});

describe("Action", () => {
  it("should add insert trigger", async () => {
    getState().registerPlugin("mock_plugin", plugin_with_routes);
    resetActionCounter();
    expect(getActionCounter()).toBe(0);

    const table = await Table.findOne({ name: "patients" });

    await Trigger.create({
      action: "incrementCounter",
      table_id: table.id,
      when_trigger: "Insert",
    });
    expect(getActionCounter()).toBe(0);
    await table.insertRow({ name: "Don Fabrizio" });
    expect(getActionCounter()).toBe(1);
  });
  it("should add update trigger", async () => {
    expect(getActionCounter()).toBe(1);

    const table = await Table.findOne({ name: "patients" });

    await Trigger.create({
      action: "setCounter",
      table_id: table.id,
      when_trigger: "Update",
      configuration: { number: 17 },
    });
    expect(getActionCounter()).toBe(1);
    const don = await table.getRow({ name: "Don Fabrizio" });
    await table.updateRow({ name: "Don Fabrizio II" }, don.id);
    expect(getActionCounter()).toBe(17);
  });
  it("should add update trigger", async () => {
    expect(getActionCounter()).toBe(17);

    const table = await Table.findOne({ name: "patients" });

    await Trigger.create({
      action: "setCounter",
      table_id: table.id,
      when_trigger: "Delete",
      configuration: { number: 37 },
    });
    expect(getActionCounter()).toBe(17);
    await table.deleteRows({ name: "Don Fabrizio" });
    expect(getActionCounter()).toBe(17);

    await table.deleteRows({ name: "Don Fabrizio II" });
    expect(getActionCounter()).toBe(37);
  });
  it("should run js code", async () => {
    const table = await Table.findOne({ name: "books" });

    await Trigger.create({
      action: "run_js_code",
      table_id: table.id,
      when_trigger: "Insert",
      configuration: {
        code: `
        const table = await Table.findOne({ name: "patients" });
        await table.insertRow({ name: "TriggeredInsert" });
      `,
      },
    });
    await table.insertRow({ author: "Giuseppe Tomasi", pages: 209 });
    const patients = await Table.findOne({ name: "patients" });

    const rows = await patients.getRows({ name: "TriggeredInsert" });
    expect(rows.length).toBe(1);
  });
  it("should run webhook", async () => {
    const table = await Table.findOne({ name: "books" });

    await Trigger.create({
      action: "webhook",
      table_id: table.id,
      when_trigger: "Update",
      configuration: {
        // from https://requestbin.com/
        url: "https://b6af540a71dce96ec130de5a0c47ada6.m.pipedream.net",
      },
    });
    const row = await table.getRow({ author: "Giuseppe Tomasi" });
    await table.updateRow({ pages: 210 }, row.id);
  });
});
