/* global NexT, CONFIG, Gitalk */

document.addEventListener('page:loaded', async () => {
  if (!CONFIG.page.comments || !CONFIG.gitalk || !CONFIG.gitalk.enable) return;

  const container = document.querySelector('.gitalk-container');
  if (!container) return;

  const showError = message => {
    container.innerHTML = `<div class="comment-fallback">${message}</div>`;
  };

  if (!CONFIG.gitalk.client_id || !CONFIG.gitalk.client_secret) {
    showError('Gitalk 尚未配置 OAuth，暂时请使用 Valine 或 MLine。');
    return;
  }

  const allowed = {
    title: document.title,
    url  : location.href,
    path : location.pathname,
    lang : navigator.language
  };

  const parsedBody = CONFIG.gitalk.body?.replace(/\$\{([^}]+)}/g, (_, keyRaw) => {
    const key = keyRaw.trim();
    if (!/^[A-Za-z0-9_]+$/.test(key)) return '';
    return String(allowed[key] ?? '');
  });

  try {
    await NexT.utils.loadComments('.gitalk-container');
    await NexT.utils.getScript(CONFIG.gitalk.js, {
      condition: window.Gitalk
    });

    if (!window.Gitalk) {
      showError('Gitalk 暂时无法加载，请切换到其他评论方式。');
      return;
    }

    const gitalk = new Gitalk({
      clientID           : CONFIG.gitalk.client_id,
      clientSecret       : CONFIG.gitalk.client_secret,
      repo               : CONFIG.gitalk.repo,
      owner              : CONFIG.gitalk.github_id,
      admin              : [CONFIG.gitalk.admin_user],
      id                 : CONFIG.gitalk.path_md5,
      proxy              : CONFIG.gitalk.proxy,
      language           : CONFIG.gitalk.language || window.navigator.language,
      distractionFreeMode: CONFIG.gitalk.distraction_free_mode,
      body               : parsedBody
    });
    gitalk.render(container);
  } catch (err) {
    showError('Gitalk 暂时不可用，请切换到 Valine 或 MLine。');
  }
});
