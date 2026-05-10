/* global NexT, CONFIG, Valine */

document.addEventListener('page:loaded', async () => {
  if (!CONFIG.page.comments || !CONFIG.valine || !CONFIG.valine.enable) return;

  const container = document.querySelector('.valine-container');
  if (!container) return;

  const showError = message => {
    container.innerHTML = `<div class="comment-fallback">${message}</div>`;
  };

  try {
    await NexT.utils.loadComments('.valine-container');
    await NexT.utils.getScript(CONFIG.vendors?.valine || CONFIG.valine.js, {
      condition: window.Valine
    });
    await NexT.utils.getScript(CONFIG.vendors?.leancloud || CONFIG.valine.leancloud, {
      condition: window.AV
    });

    if (!window.Valine || !window.AV) {
      showError('Valine 暂时无法加载，请切换到其他评论方式。');
      return;
    }

    const guestInfo = String(CONFIG.valine.guest_info || 'nick,mail,link')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    new Valine({
      el          : '.valine-container',
      appId       : CONFIG.valine.appid,
      appKey      : CONFIG.valine.appkey,
      notify      : CONFIG.valine.notify,
      verify      : CONFIG.valine.verify,
      placeholder : CONFIG.valine.placeholder,
      avatar      : CONFIG.valine.avatar,
      avatar_cdn  : CONFIG.valine.avatar_cdn,
      guest_info  : guestInfo,
      pageSize    : CONFIG.valine.pageSize,
      lang        : CONFIG.valine.language,
      path        : CONFIG.valine.path_md5 || CONFIG.page.path,
      serverURLs  : CONFIG.valine.serverURLs,
      recordIP    : CONFIG.valine.recordIP,
      visitor     : CONFIG.valine.visitor,
      comment_count: CONFIG.valine.comment_count
    });
  } catch (err) {
    showError('Valine 暂时不可用，请切换到 Gitalk 或 MLine。');
  }
});
