import test from "ava";

import { ReceiveEndpoint } from "@kronos-integration/endpoint";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { ServiceMQTT, TopicEndpoint } from "@kronos-integration/service-mqtt";

test("factory", async t => {
  const sp = new StandaloneServiceProvider();
  const r1 = new ReceiveEndpoint("r1", sp);
  r1.receive = async () => "OK R1";

  const mqtt = await sp.declareService({
    type: ServiceMQTT,
    clean: true,
    clientId: "test",
    url: "mqtt://localhost",
    endpoints: {
      s1: { topic: true, connected: r1 },
      s2: { topic: "s2b", connected: r1 },
      "s2/*/a": { topic: true, connected: r1 }
    }
  });

  t.is(mqtt.clean, true);
  t.is(mqtt.clientId, "test");
  t.is(mqtt.endpoints["s1"].name, "s1");
  t.is(mqtt.endpoints["s2"].name, "s2");
  t.true(mqtt.endpoints["s1"] instanceof TopicEndpoint);
  t.deepEqual(mqtt.topics, ["s1", "s2b", "s2/*/a"]);
});

test("start / stop", async t => {
  const sp = new StandaloneServiceProvider();

  const r1 = new ReceiveEndpoint("r1", sp);

  const received = [];

  r1.receive = async message => received.push(message);

  const mqtt = await sp.declareService({
    type: ServiceMQTT,
    url: "mqtt://localhost",
    clientId: "test",
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
    endpoints: {
      s1: { topic: true, connected: r1 }
    }
  });

  t.is(mqtt.endpoints["s1"].name, "s1");

  await mqtt.start();
  t.is(mqtt.state, "running");

  await mqtt.stop();
  t.is(mqtt.state, "stopped");
});
