import {
  prepareAttributesDefinitions,
  default_attribute,
  url_attribute,
  boolean_attribute,
  secret_attribute
} from "pacc";
import { Service } from "@kronos-integration/service";
import { connect } from "mqtt";
import { TopicEndpoint } from "./topic-endpoint.mjs";

export { TopicEndpoint };

/**
 * MQTT client.
 */
export class ServiceMQTT extends Service {
  /**
   * @return {string} 'mqtt'
   */
  static get name() {
    return "mqtt";
  }

  static get description() {
    return "mqtt client";
  }

  static attributes = prepareAttributesDefinitions(
    {
      url: {
        ...url_attribute,
        description: "url of the mqtt server",
        needsRestart: true
      },
      clean: boolean_attribute,
      clientId: default_attribute,
      connectTimeout: {
        type: "integer"
      },
      reconnectPeriod: {
        type: "integer"
      },
      username: secret_attribute,
      password: secret_attribute
    },
    Service.attributes
  );

  /**
   * @return {string} name with url
   */
  get extendetName() {
    return `${this.name}(${this.url})`;
  }

  get topics() {
    return Object.values(this.endpoints)
      .filter(e => e.topic)
      .map(e => e.topic);
  }

  /**
   * On demand create TopicEndpoint.
   * @param {string} name
   * @param {Object|string} definition
   * @return {Class} TopicEndpoint if path is present of name starts with '/'
   */
  endpointFactoryFromConfig(name, definition, ic) {
    if (definition.topic) {
      return TopicEndpoint;
    }

    return super.endpointFactoryFromConfig(name, definition, ic);
  }

  async _start() {
    await super._start();

    const options = Object.fromEntries(
      ["clean", "clientId", "connectTimeout", "reconnectPeriod"]
        .filter(key => this[key] !== undefined)
        .map(key => [key, this[key]])
    );

    options.password = await this.getCredential("password");
    options.username = await this.getCredential("username");

    const client = connect(this.url, options);

    this.client = client;

    client.on("connect", err => {
      client.subscribe(this.topics, (err, granted) => {
        if (err) {
          this.error(err);
        }
      });
    });

    client.on("message", (topic, message) => {
      const ep = this.endpoints[topic];
      if (ep) {
        ep.send(message);
      }
    });
  }

  async _stop() {
    await this.client.endAsync();
    return super._stop();
  }
}

export default ServiceMQTT;
