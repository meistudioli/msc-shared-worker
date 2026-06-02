# msc-shared-worker

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/msc-shared-worker) [![DeepScan grade](https://deepscan.io/api/teams/16372/projects/31763/branches/1031957/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=16372&pid=31763&bid=1031957)

&lt;msc-shared-worker /> is a Web Component built on top of the native SharedWorker API. As a UI-less component, its primary purpose is to allow developers to quickly inject and initialize a SharedWorker simply by configuring its HTML attributes.

![<msc-shared-worker />](https://blog.lalacube.com/mei/img/preview/msc-shared-worker.png)

## Basic Usage

&lt;msc-shared-worker /> is a web component. All we need to do is put the required script into your HTML document. Then follow &lt;msc-shared-worker />'s html structure and everything will be all set.

- Required Script

```html
<script
  type="module"
  src="https://unpkg.com/msc-shared-worker/mjs/wc-msc-shared-worker.js">        
</script>
```

- Structure

    Put &lt;msc-shared-worker /> into HTML document. It will have different functions and looks with attribute mutation.
  
```html
<msc-shared-worker>
  <script type="application/json">
    {
      "src": "https://your-shared-worker-script.js",
      "options": {
        "name": "msc-shared-worker"
      }
    }
  </script>
</msc-shared-worker>
```

## JavaScript Instantiation

&lt;msc-shared-worker /> could also use JavaScript to create DOM element. Here comes some examples.

```html
<script type="module">
import { MscSharedWorker } from 'https://unpkg.com/msc-shared-worker/mjs/wc-msc-shared-worker.js';

// use DOM api
const nodeA = document.createElement('msc-shared-worker');
nodeA.src = 'https://your-shared-worker-script.js';
document.body.appendChild(nodeA);

// new instance with Class
const nodeB = new MscSharedWorker();
nodeB.src = 'https://your-shared-worker-script.js';
nodeB.options = {
  name: 'msc-shared-worker'
};
document.body.appendChild(nodeB);

// new instance with Class & default config
const config = {
  src: 'https://your-shared-worker-script.js'
  options: {
    name: 'msc-shared-worker',
    credentials: 'include'
  }
};
const nodeC = new MscSharedWorker(config);
document.body.appendChild(nodeC);
</script>
```

## Attributes

&lt;msc-shared-worker /> supports some attributes to let it become more convenience & useful.

- **src**

    A [TrustedScriptURL object](https://developer.mozilla.org/en-US/docs/Web/API/TrustedScriptURL) or a string representing the URL of the script or module that the worker will execute. This must be same-origin with the caller's document, or a blob: or data: URL. The URL is resolved relative to the current HTML page's location.

    ```html
    <msc-shared-worker
      src="https://your-shared-worker-script.js"
    >
    </msc-shared-worker>
    ```

- **options**

    An object containing option properties that can be set when creating the object instance. Check the available [properties](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker/SharedWorker#options).

  ```html
    <msc-shared-worker
      options='{"name":"msc-shared-worker","credentials":"include"}'
    >
    </msc-shared-worker>
  ```

## Properties
| Property Name | Type | Description |
| ----------- | ----------- | ----------- |
| src | String | Getter / Setter the URL of the script or module that the worker will execute. |
| options| Object | Getter / Setter containing option properties that can be set when creating the object instance. |

## Mathod
| Mathod Signature | Description |
| ----------- | ----------- |
| postMessage | Sends data to the SharedWorker. |

## Events
| Event Signature | Description |
| ----------- | ----------- |
| msc-shared-worker-message | Fired when a message is received from the SharedWorker. |
| msc-shared-worker-error | Fired when an error occurs in the worker. |

## Reference
- [&lt;msc-shared-worker /> demo](https://blog.lalacube.com/mei/webComponent_msc-shared-worker.html)
- [SharedWorker API](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)
- [SharedWorker > available properties](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker/SharedWorker#options)
