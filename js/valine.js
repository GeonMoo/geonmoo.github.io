/* global NexT, CONFIG, Valine */

document.addEventListener('page:loaded', async () => {
  if (!CONFIG.page.comments || !CONFIG.valine || !CONFIG.valine.enable) return;

  const container = document.querySelector('.valine-container');
  if (!container) return;

  await NexT.utils.loadComments('.valine-container');
  await NexT.utils.getScript(CONFIG.vendors.valine || CONFIG.valine.js, {
    condition: window.Valine
  });
  await NexT.utils.getScript(CONFIG.vendors.leancloud || CONFIG.valine.leancloud, {
    condition: window.AV
  });

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
});
