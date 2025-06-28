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
        "url": {
          description: "server listen definition",

          attributes: {
            url: {
              description: "url of the mqtt server",
              needsRestart: true,
              type: "url"
            }
          }
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

  /**
   * On demand create TopicEndpoint.
   * @param {string} name
   * @param {Object|string} definition
   * @return {Class} TopicEndpoint if path is present of name starts with '/'
   */
  endpointFactoryFromConfig(name, definition, ic) {

    if (
      definition.method ||
      definition.path ||
      name[0] === "/" ||
      name.match(/^\w+:\//)
    ) {
      return TopicEndpoint;
    }

    return super.endpointFactoryFromConfig(name, definition, ic);
  }

  async _start() {
    await super._start();

    this.client = connect(this.url);
  }

  async _stop() {
    return super._stop();
  }
}

export default ServiceMQTT;
