/* global NexT, CONFIG, MathJax */

(function() {
  let loading = false;
  let loaded = false;

  const getMathJaxUrl = () => {
    const source = CONFIG.mathjax.js;
    return typeof source === 'string' ? source : source.url;
  };

  const typeset = () => {
    if (typeof MathJax === 'undefined' || !MathJax.typesetPromise) return;
    MathJax.startup.document.state(0);
    MathJax.typesetClear();
    MathJax.texReset();
    MathJax.typesetPromise();
  };

  const boot = () => {
    if (!CONFIG.enableMath) return;

    if (typeof MathJax !== 'undefined') {
      loaded = true;
      typeset();
      return;
    }

    if (loading || loaded) return;
    loading = true;

    window.MathJax = {
      tex: {
        inlineMath : { '[+]': [['$', '$']] },
        displayMath: { '[+]': [['$$', '$$']] },
        tags       : CONFIG.mathjax.tags
      },
      chtml: {
        matchFontHeight: false,
        scale          : 1
      },
      options: {
        renderActions: {
          insertedScript: [200, () => {
            document.querySelectorAll('mjx-container').forEach(node => {
              const target = node.parentNode;
              if (target.nodeName.toLowerCase() === 'li') {
                target.parentNode.classList.add('has-jax');
              }
            });
          }, '', false]
        }
      },
      startup: {
        pageReady: () => MathJax.startup.defaultPageReady().then(() => {
          loaded = true;
        })
      }
    };

    const url = getMathJaxUrl();
    if (NexT?.utils?.getScript) {
      NexT.utils.getScript({ url }, { attributes: { defer: true } });
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.defer = true;
    document.head.appendChild(script);
  };

  document.addEventListener('page:loaded', boot);
  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') setTimeout(boot, 0);
})();
