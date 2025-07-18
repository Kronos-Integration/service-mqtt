import test from "ava";

import { ReceiveEndpoint } from "@kronos-integration/endpoint";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { ServiceMQTT, TopicEndpoint } from "@kronos-integration/service-mqtt";

test("endpoint factory", async t => {
  const sp = new StandaloneServiceProvider();

  const r1 = new ReceiveEndpoint("r1", sp);
  r1.receive = async () => "OK R1";

  const mqtt = await sp.declareService({
    type: ServiceMQTT,
    endpoints: {
      s1: { topic: true, connected: r1 },
      s2: { topic: "s2b", connected: r1 }
    }
  });

  t.is(mqtt.endpoints["s1"].name, "s1");
  t.is(mqtt.endpoints["s2"].name, "s2");
  t.true(mqtt.endpoints["s1"] instanceof TopicEndpoint);
  t.deepEqual(mqtt.topics, ["s1", "s2b"]);
});

test("start / stop", async t => {
  const sp = new StandaloneServiceProvider();

  const r1 = new ReceiveEndpoint("r1", sp);
  r1.receive = async () => "OK R1";

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

  t.is(mqtt.status, "running");
});
