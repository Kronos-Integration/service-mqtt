import { SendEndpoint } from "@kronos-integration/endpoint";

export class TopicEndpoint extends SendEndpoint {
  constructor(name, owner, options) {
    super(name, owner, options);

    if (typeof options.topic === "string") {
      this._topic = options.topic;
    }
  }

  get topic() {
    return this._topic || this.name;
  }
}
