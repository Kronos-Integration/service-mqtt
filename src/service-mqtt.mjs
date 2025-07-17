import { mergeAttributes, createAttributes } from "model-attributes";
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

  static get configurationAttributes() {
    return mergeAttributes(
      createAttributes({
        url: {
          description: "url of the mqtt server",
          needsRestart: true,
          type: "url"
        },
        clean: {
          type: "boolean"
        },
        clientId: {
          type: "string"
        },
        connectTimeout: {
          type: "integer"
        },
        reconnectPeriod: {
          type: "integer"
        },
        username: {
          type: "string"
        },
        password: {
          type: "string",
          private: true
        }
      }),
      Service.configurationAttributes
    );
  }

  /**
   * @return {string} name with url
   */
  get extendetName() {
    return `${this.name}(${this.url})`;
  }

  get options() {
    return Object.fromEntries(
      [
        "username",
        "password",
        "clean",
        "clientId",
        "connectTimeout",
        "reconnectPeriod"
      ]
        .filter(key => this[key] !== undefined)
        .map(key => [key, this[key]])
    );

    //return { username: this.username, password: this.password };
  }

  get topics() {
    return Object.keys(this.endpoints).filter(e => e.topic);
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

    console.log(this.options);
    const client = connect(this.url, this.options);

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
        ep.receive(message);
      }
    });
  }

  async _stop() {
    return super._stop();
  }
}

export default ServiceMQTT;
