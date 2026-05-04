/* global NexT, CONFIG */

(function() {
  'use strict';

  const state = {
    comments: [],
    submitting: false
  };

  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));

  const normalizeUrl = value => {
    const text = String(value || '').trim();
    if (!text) return '';
    if (/^https?:\/\//i.test(text)) return text;
    return `https://${text}`;
  };

  const formatTime = value => {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat(navigator.language || 'zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(value));
    } catch (err) {
      return value;
    }
  };

  const storageKey = 'mline.commenter';

  const getProfile = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (err) {
      return {};
    }
  };

  const saveProfile = profile => {
    localStorage.setItem(storageKey, JSON.stringify({
      nick: profile.nick,
      mail: profile.mail,
      link: profile.link
    }));
  };

  const apiUrl = (path, params = {}) => {
    const base = (CONFIG.mline.api_base || '').replace(/\/+$/, '');
    const url = new URL(`${base}${path}`, location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => url.searchParams.append(key, item));
      } else if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  };

  const request = async (path, options = {}) => {
    const response = await fetch(apiUrl(path, options.query), {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }
    return data;
  };

  const renderComment = comment => {
    const link = normalizeUrl(comment.link);
    const author = link
      ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener nofollow">${escapeHtml(comment.nick)}</a>`
      : escapeHtml(comment.nick);
    const avatar = comment.mail_hash
      ? `<img class="mline-avatar" src="https://www.gravatar.com/avatar/${comment.mail_hash}?d=mp&s=80" alt="">`
      : '<div class="mline-avatar mline-avatar-fallback"></div>';

    return `
      <article class="mline-comment" id="mline-comment-${comment.id}">
        ${avatar}
        <div class="mline-comment-body">
          <div class="mline-comment-meta">
            <span class="mline-comment-author">${author}</span>
            <time datetime="${escapeHtml(comment.created_at)}">${escapeHtml(formatTime(comment.created_at))}</time>
          </div>
          <div class="mline-comment-content">${escapeHtml(comment.comment).replace(/\n/g, '<br>')}</div>
        </div>
      </article>
    `;
  };

  const render = container => {
    const profile = getProfile();
    const count = state.comments.length;

    container.innerHTML = `
      <div class="mline-box">
        <form class="mline-form">
          <div class="mline-fields">
            <input name="nick" required maxlength="64" placeholder="${escapeHtml(CONFIG.mline.placeholder_nick || '昵称')}" value="${escapeHtml(profile.nick)}">
            <input name="mail" type="email" maxlength="128" placeholder="${escapeHtml(CONFIG.mline.placeholder_mail || '邮箱')}" value="${escapeHtml(profile.mail)}">
            <input name="link" maxlength="255" placeholder="${escapeHtml(CONFIG.mline.placeholder_link || '网站')}" value="${escapeHtml(profile.link)}">
          </div>
          <textarea name="comment" required maxlength="${Number(CONFIG.mline.max_comment_length || 2000)}" rows="5" placeholder="${escapeHtml(CONFIG.mline.placeholder_comment || '写下你的评论')}"></textarea>
          <div class="mline-actions">
            <span class="mline-status" aria-live="polite"></span>
            <button type="submit">${escapeHtml(CONFIG.mline.submit_text || '提交评论')}</button>
          </div>
        </form>
        <div class="mline-list-title">${count ? `${count} 条评论` : '暂无评论'}</div>
        <div class="mline-list">${state.comments.map(renderComment).join('')}</div>
      </div>
    `;
  };

  const bind = container => {
    const form = container.querySelector('.mline-form');
    const status = container.querySelector('.mline-status');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (state.submitting) return;

      const formData = new FormData(form);
      const payload = {
        path: CONFIG.mline.path || location.pathname,
        url: CONFIG.mline.url || location.href,
        title: CONFIG.mline.title || document.title,
        nick: String(formData.get('nick') || '').trim(),
        mail: String(formData.get('mail') || '').trim(),
        link: String(formData.get('link') || '').trim(),
        comment: String(formData.get('comment') || '').trim()
      };

      state.submitting = true;
      status.textContent = CONFIG.mline.submitting_text || '提交中...';
      form.querySelector('button').disabled = true;

      try {
        const data = await request('/comments', {
          method: 'POST',
          body: payload
        });
        saveProfile(payload);
        state.comments.unshift(data.comment);
        form.comment.value = '';
        render(container);
        bind(container);
      } catch (err) {
        status.textContent = err.message;
      } finally {
        state.submitting = false;
        const button = form.querySelector('button');
        if (button) button.disabled = false;
      }
    });
  };

  const boot = async () => {
    if (!CONFIG.page.comments || !CONFIG.mline || !CONFIG.mline.api_base) return;

    const container = document.querySelector('.mline-container');
    if (!container) return;

    await NexT.utils.loadComments('.mline-container');
    container.innerHTML = '<div class="mline-loading">加载评论中...</div>';

    try {
      const data = await request('/comments', {
        query: {
          path: CONFIG.mline.path || location.pathname
        }
      });
      state.comments = data.comments || [];
      render(container);
      bind(container);
    } catch (err) {
      container.innerHTML = `<div class="mline-error">${escapeHtml(err.message)}</div>`;
    }
  };

  document.addEventListener('page:loaded', boot);
})();
