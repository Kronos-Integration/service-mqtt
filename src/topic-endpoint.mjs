import { SendReceiveEndpoint } from "@kronos-integration/endpoint";
import { Service } from "@kronos-integration/service";

export class TopicEndpoint extends SendReceiveEndpoint {
  constructor(name, owner, options) {
    super(name, owner, options);

    if (options.topic) {
      this._topic = options.topic;
    }
  }

  get topic() {
    return this._topic || this.name;
  }
}
