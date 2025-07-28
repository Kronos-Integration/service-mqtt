import {
  prepareAttributesDefinitions,
  string_attribute,
  url_attribute,
  boolean_attribute,
  username_attribute,
  password_attribute,
  timeout_attribute,
  integer_attribute
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
      keepalive: {
        ...integer_attribute,
        default: 60,
        isConnectionOption: true
      },
      clean: { ...boolean_attribute, isConnectionOption: true },
      clientId: { ...string_attribute, isConnectionOption: true },
      connectTimeout: { ...timeout_attribute, isConnectionOption: true },
      reconnectPeriod: {
        ...integer_attribute,
        isConnectionOption: true,
      },
      username: username_attribute,
      password: password_attribute
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
      Object.entries(this.attributes)
        .filter(
          ([name, attribute]) =>
            attribute.isConnectionOption && this[name] !== undefined
        )
        .map(([name]) => [name, this[name]])
    );

    options.username = await this.getCredential("username");
    options.password = await this.getCredential("password");

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
      else {
        this.error(`no endpoint for topic ${topic}`);
      }
    });
  }

  async _stop() {
    await this.client.endAsync();
    return super._stop();
  }
}

export default ServiceMQTT;
