(function() {
  /**
   * NexT Theme Custom Tracker
   * Records: Session ID, IP (Server-side), Duration, Attention (Scroll), Visited URLs
   */

  // 配置：请替换为你的数据接收接口
  // 如果没有后端，可以使用 console.log 调试，或者接入 Google Analytics / Microsoft Clarity
  const CONFIG = {
    endpoint: 'https://your-analytics-api.com/collect', // 接收数据的 API 地址
    enableConsoleLog: true, // 开发模式下在控制台打印
  };

  // --- 1. Session ID 管理 ---
  function getSessionId() {
    const STORAGE_KEY = 'analytics_session_id';
    let sid = sessionStorage.getItem(STORAGE_KEY);
    if (!sid) {
      // 生成简单的 UUID
      sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      sessionStorage.setItem(STORAGE_KEY, sid);
    }
    return sid;
  }

  // --- 2. 状态初始化 ---
  const state = {
    sessionId: getSessionId(),
    enterTime: Date.now(),
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer,
    maxScrollY: 0,
    maxScrollPercent: 0,
    visitedUrls: []
  };

  // 记录已访问 URL
  try {
    const visited = JSON.parse(sessionStorage.getItem('visited_urls') || '[]');
    if (!visited.includes(state.path)) {
      visited.push(state.path);
      sessionStorage.setItem('visited_urls', JSON.stringify(visited));
    }
    state.visitedUrls = visited;
  } catch (e) {
    console.error('Tracker storage error', e);
  }

  // --- 3. Scroll & Attention 监听 ---
  let scrollTimer = null;
  function handleScroll() {
    if (scrollTimer) return;
    scrollTimer = setTimeout(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // 更新最大滚动深度
      if (scrollTop > state.maxScrollY) {
        state.maxScrollY = Math.round(scrollTop);
      }
      
      const percent = docHeight > winHeight 
        ? Math.round(((scrollTop + winHeight) / docHeight) * 100) 
        : 100;
        
      if (percent > state.maxScrollPercent) {
        state.maxScrollPercent = percent;
      }
      
      scrollTimer = null;
    }, 500); // 500ms 节流
  }
  
  window.addEventListener('scroll', handleScroll);

  // --- 4. 数据发送逻辑 ---
  function sendData(triggerType) {
    const now = Date.now();
    const duration = now - state.enterTime;
    
    // 最终的滚动位置
    const currentScrollY = window.scrollY || document.documentElement.scrollTop;

    const payload = {
      session_id: state.sessionId,
      url: state.url,
      path: state.path,
      referrer: state.referrer,
      timestamp: now,
      duration_ms: duration,
      scroll_stats: {
        max_depth_px: state.maxScrollY,
        max_depth_percent: state.maxScrollPercent,
        exit_depth_px: currentScrollY
      },
      visited_history: state.visitedUrls,
      trigger: triggerType,
      user_agent: navigator.userAgent
      // IP 地址通常由服务端从请求 Header (X-Forwarded-For) 中获取，前端不直接处理
    };

    if (CONFIG.enableConsoleLog) {
      console.log(`[Tracker] Sending data (${triggerType}):`, payload);
    }

    // 优先使用 Beacon API (不阻塞页面关闭)
    if (navigator.sendBeacon && CONFIG.endpoint.startsWith('http')) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(CONFIG.endpoint, blob);
    } else if (CONFIG.endpoint.startsWith('http')) {
      // 降级方案
      fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(e => console.warn('Tracker failed:', e));
    }
  }

  // --- 5. 生命周期绑定 ---
  
  // 页面隐藏/关闭时发送
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendData('visibility_hidden');
    }
  });

  // 兼容旧浏览器
  window.addEventListener('pagehide', () => {
    sendData('pagehide');
  });

  // 可选：定期发送心跳 (每10秒)，防止意外崩溃丢失数据
  // setInterval(() => sendData('heartbeat'), 10000);

})();
