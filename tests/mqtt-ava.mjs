import test from "ava";

import { ReceiveEndpoint } from "@kronos-integration/endpoint";
import {
  StandaloneServiceProvider,
} from "@kronos-integration/service";
import {
  ServiceMQTT, TopicEndpoint
} from "@kronos-integration/service-mqtt";


test("endpoint factory", async t => {
  const sp = new StandaloneServiceProvider();

  const r1 = new ReceiveEndpoint("r1", sp);
  r1.receive = async () => "OK R1";

  const mqtt = await sp.declareService({
    type: ServiceMQTT,
    listen: {
      socket: 1241
    },
    endpoints: {
      "/s1": { connected: r1,}
    }
  });

  t.is(mqtt.endpoints["/s1"].name, "/s1");
  t.is(mqtt.endpoints["/s1"].path, "/s1");
  t.is(mqtt.endpoints["/s1"].method, "GET");
  t.true(mqtt.endpoints["/s1"] instanceof TopicEndpoint);

  await mqtt.start();

  await mqtt.stop();
});
