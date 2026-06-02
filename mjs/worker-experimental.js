// structure: id -> { port, status, isAlive, isProcessing }
const tabs = new Map();

const findAvailableTabId = () => {
  let tabId;

  if (tabs.size === 1) {
    tabId = tabs.keys().next().value;
  } else {
    for (const [id, tab] of tabs) {
      const { status, isProcessing } = tab;

      if (status === 'background' && !isProcessing) {
        tabId = id;
        break;
      }
    }

    if (!tabId) {
      for (const [id, tab] of tabs) {
        const { isProcessing } = tab;

        if (!isProcessing) {
          tabId = id;
          break;
        }
      }
    }

    if (!tabId) {
      tabId = tabs.keys().next().value;
    }
  }

  return tabId;
}

const broadcast = (message, senderTabId) => {
  if (tabs.size === 0) {
    return;
  }

  for (const [id, tab] of tabs) {
    if (id === senderTabId) {
      continue;
    }

    try {
      tab.port.postMessage(message);
    } catch (error) {
      tabs.delete(id); 
    }
  }
}

const onMessage = (evt) => {
  const { data = {}, target:port } = evt;
  const { type, id, payload = {} } = data;
  
  switch (type) {
    // system level
    case 'REGISTER': {
      tabs.set(id, { 
        port: port, 
        status: 'idle',
        isAlive: true,
        isProcessing: false
      });

      console.log(`[Worker] 分頁註冊成功: ${id}. 當前總分頁數: ${tabs.size}`);
      break;
    }

    case 'CLOSING': {
      if (tabs.has(id)) {
        tabs.delete(id);
        console.log(`[Worker] 分頁 ${id} 主動離線。剩餘分頁數: ${tabs.size}`);
      }

      if (tabs.size === 0) {
        console.log('CLEAR');
        tabs.clear();
        self.close();
      }
      break;
    }

    case 'STATUS_UPDATE': {
      const { status } = payload;

      if (tabs.has(id)) {
        tabs.get(id).status = status; // 'active' || 'background'
        console.log(`[Worker] 分頁 ${id} 狀態變更為: ${status}`);
      }
      break;
    }

    case 'PONG': {
      if (tabs.has(id)) {
        tabs.get(id).isAlive = true;
      }
      break;
    }

    case 'TERMINATE': {
      console.log('--- [Worker] 🚨 收到系統終止指令，開始執行強制摧毀 ---');
        
      tabs.forEach(
        (tab) => {
          try {
            tab.port.postMessage({ type: 'SYSTEM_WORKER_DYING' });
          } catch(err) {}
        }
      );
      
      tabs.clear();
      self.close();
      break;
    }

    case 'REQUEST_AI_INFERENCE': {
      const id = findAvailableTabId();

      if (tabs.has(id)) {
        const tab = tabs.get(id)

        tab.isProcessing = true;
        tab.port.postMessage({
          type: 'AI_INFERENCE_DISPATCH',
          payload
        });
      }
      break;
    }

    case 'AI_INFERENCE_FINISH': {
      if (tabs.has(id)) {
        tabs.get(id).isProcessing = false;
      }

      const { id:requestTabId, ...others } = payload;

      if (tabs.has(requestTabId)) {
        tabs.get(requestTabId).port.postMessage({
          type: 'AI_RESULT_BROADCAST',
          payload: { ...others }
        });
      }

      // broadcast(
      //   {
      //     type: 'AI_RESULT_BROADCAST',
      //     payload
      //   },
      //   id
      // );
      // console.table(Array.from(tabs.entries()));
      break;
    }
  }
};

onconnect = (evt) => {
  const port = evt.ports[0];

  port.addEventListener('message', onMessage);
  port.start();
};

// detect tab
setInterval(() => {
  if (tabs.size === 0) {
    return;
  }

  for (let [id, tab] of tabs) {
    if (tab.isAlive === false) {
      tabs.delete(id);
      console.log(`[Worker] 🚨 心跳超時！分頁 ${id} 已無回應，強制剔除。剩餘: ${tabs.size}`);
      continue;
    }

    tab.isAlive = false;

    try {
      tab.port.postMessage({ type: 'PING' });
    } catch (err) {
      tabs.delete(id);
    }
  }
}, 5000);