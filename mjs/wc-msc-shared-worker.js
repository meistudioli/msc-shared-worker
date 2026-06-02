import { _wcl } from './common-lib.js';
import { _wccss } from './common-css.js';

const defaults = {
  src: '',
  options: {}
};

const booleanAttrs = [];
const objectAttrs = ['options'];
const custumEvents = {
  message: 'msc-shared-worker-message',
  error: 'msc-shared-worker-error'
};

const template = document.createElement('template');
template.innerHTML = `
<style>
${_wccss}

:host{position:relative;inline-size:0;block-size:0;display:block;visibility:hidden;}
</style>

<div class="main" ontouchstart="" tabindex="0">
</div>
`;

export class MscSharedWorker extends HTMLElement {
  #data;
  #nodes;
  #config;

  constructor(config) {
    super();

    // template
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // data
    this.#data = {
      controller: '',
      worker: '',
      pendingUpdate: false,
    };

    // nodes
    this.#nodes = {
      // styleSheet: this.shadowRoot.querySelector('style')
    };

    // config
    this.#config = {
      ...defaults,
      ...config // new MscSharedWorker(config)
    };

    // evts
    this._onMessage = this._onMessage.bind(this);
    this._onError = this._onError.bind(this);
  }

  async connectedCallback() {
   const { config, error } = await _wcl.getWCConfig(this);

    if (error || !window?.SharedWorker) {
      console.warn(`${_wcl.classToTagName(this.constructor.name)}: ${error}`);
      this.remove();
      return;
    } else {
      this.#config = {
        ...this.#config,
        ...config
      };
    }

    // upgradeProperty
    Object.keys(defaults).forEach((key) => this.#upgradeProperty(key));
  }

  disconnectedCallback() {
    if (this.#data?.controller) {
      this.#data.controller.abort?.();
    }
  }

  #format(attrName, oldValue, newValue) {
    const hasValue = newValue !== null;

    if (!hasValue) {
      if (booleanAttrs.includes(attrName)) {
        this.#config[attrName] = false;
      } else {
        this.#config[attrName] = defaults[attrName];
      }
    } else {
      switch (attrName) {
        case 'options': {
          let values;

          try {
            values = JSON.parse(newValue);
          } catch(err) {
            console.warn(`${_wcl.classToTagName(this.constructor.name)}: ${err.message}`);
            values = window.structuredClone(defaults.options);
          }

          this.#config[attrName] = values;
          break;
        }

        case 'src': {
          this.#config[attrName] = newValue;
          break;
        }
      }
    }
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (!MscSharedWorker.observedAttributes.includes(attrName)) {
      return;
    }

    this.#format(attrName, oldValue, newValue);

    switch (attrName) {
      case 'src':
      case 'options': {
        this.#scheduleUpdate();
        break;
      }
    }
  }

  static get observedAttributes() {
    return Object.keys(defaults); // MscSharedWorker.observedAttributes
  }

  static get supportedEvents() {
    return Object.keys(custumEvents).map(
      (key) => {
        return custumEvents[key];
      }
    );
  }

  #upgradeProperty(prop) {
    let value;

    if (MscSharedWorker.observedAttributes.includes(prop)) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        value = this[prop];
        delete this[prop];
      } else {
        if (booleanAttrs.includes(prop)) {
          value = (this.hasAttribute(prop) || this.#config[prop]) ? true : false;
        } else if (objectAttrs.includes(prop)) {
          value = this.hasAttribute(prop) ? this.getAttribute(prop) : JSON.stringify(this.#config[prop]);
        } else {
          value = this.hasAttribute(prop) ? this.getAttribute(prop) : this.#config[prop];
        }
      }

      this[prop] = value;
    }
  }

  #scheduleUpdate() {
    if (this.#data.pendingUpdate) {
      return;
    }

    this.#data.pendingUpdate = true;

    // execute Microtask when Macro-task finish
    Promise.resolve().then(
      () => {
        this.#data.pendingUpdate = false;
        this.#initWorker();
      }
    );
  }

  #initWorker() {
    if (!this.src) {
      return;
    }

    if (this.#data.worker) {
      this.#data.worker?.port?.close();
    }

    this.#data.worker = new SharedWorker(this.src, this.options);
    this.#addEventsListener();
    this.#data.worker.port.start();
  }

  set src(value) {
    if (value) {
      this.setAttribute('src', value);
    } else {
      this.removeAttribute('src');
    }
  }

  get src() {
    return this.#config.src;
  }

  set options(value) {
    if (value) {
      const newValue = {
        ...defaults.options,
        ...this.options,
        ...(typeof value === 'string' ? JSON.parse(value) : value)
      };
      this.setAttribute('options', JSON.stringify(newValue));
    } else {
      this.removeAttribute('options');
    }
  }

  get options() {
    return this.#config.options;
  }

  #fireEvent(evtName, detail) {
    this.dispatchEvent(new CustomEvent(evtName,
      {
        bubbles: true,
        composed: true,
        ...(detail && { detail })
      }
    ));
  }

  #addEventsListener() {
    this.#data.controller?.abort?.();

    const { worker } = this.#data;
    const port = worker?.port;

    this.#data.controller = new AbortController();
    const signal = this.#data.controller.signal;

    worker?.addEventListener('error', this._onError, { signal });
    port?.addEventListener('message', this._onMessage, { signal });
  }

  _onMessage(evt) {
    const { data = {} } = evt;

    this.#fireEvent(custumEvents.message, { ...data });
  }

  _onError(evt) {
    console.warn(`${_wcl.classToTagName(this.constructor.name)}: ${evt}`);
    this.#fireEvent(custumEvents.error, { ...evt });
  }

  postMessage(data) {
    this.#data.worker?.port?.postMessage?.(data);
  }
}

// define web component
const S = _wcl.supports();
const T = _wcl.classToTagName('MscSharedWorker');
if (S.customElements && S.shadowDOM && S.template && !window.customElements.get(T)) {
  window.customElements.define(_wcl.classToTagName('MscSharedWorker'), MscSharedWorker);
}