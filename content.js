/* global chrome, PHRASES_TO_HIDE */

(function () {
  const itemClass = 'TimelineItem';
  const itemHiddenClass = 'TimelineItem-Hidden';
  const toggleButtonID = 'tidy-timeline-button';

  let status = 'active';
  let numMatchingEvents = 0;
  let pageUrl;
  let monitorInterval;

  const showEvent = (el) => {
    el.classList.remove(itemHiddenClass);
    el.classList.add(itemClass);
  };

  const hideEvent = (el) => {
    el.classList.remove(itemClass);
    el.classList.add(itemHiddenClass);
  };

  const querySelectorIncludesText = (selector, text) => {
    return Array.from(document.querySelectorAll(selector)).find((el) =>
      el.textContent.includes(text)
    );
  };

  const getToggleButton = () => {
    return document.getElementById(toggleButtonID)
  }

  const createToggleButton = () => {
    const btn = document.createElement('button');
    btn.setAttribute('id', toggleButtonID);
    btn.onclick = handleClick;
    document.body.appendChild(btn);
    return btn;
  };

  const getItems = () => {
    return document.querySelectorAll(`.${itemClass}`);
  };

  const getHiddenItems = () => {
    return document.querySelectorAll(`.${itemHiddenClass}`);
  };

  const updateStatus = (newStatus) => {
    status = newStatus
    updateToggleButton(status)
  }

  const updateToggleButton = async (status) => {
    const btn = getToggleButton() || createToggleButton();

    if (status !== 'idle') {
      numMatchingEvents = getHiddenItems().length;
    }

    const count = `${numMatchingEvents} event${
      numMatchingEvents === 1 ? '' : 's'
    }`;
    const message = status === 'idle' ? `Click to hide ${count}` : `${count} hidden`;
    const loader =
      status === 'loading'
        ? `<img src='${chrome.runtime.getURL('images/loader.gif')}' />`
        : '';
    const icon = status !== 'idle'
      ? `<span><img src='${chrome.runtime.getURL('images/32.png')}' /></span>`
      : '';

    btn.innerHTML = icon + message + loader;
    await new Promise((res) => setTimeout(res, 10));
    btn.classList.add('visible')
  };

  const loadMoreIfAvailable = () => {
    const loadMoreBtn = querySelectorIncludesText('button', 'Load more');
    if (loadMoreBtn) {
      loadMoreBtn.click();
      updateStatus('loading');
      return true;
    }
    return false;
  };

  const tidyTimeline = () => {
    getItems().forEach((el) => {
      const shouldHide = PHRASES_TO_HIDE.find((phrase) =>
        el.innerText.includes(phrase)
      );
      if (shouldHide) {
        hideEvent(el);
      }
    });
    updateStatus('active');
    const loading = loadMoreIfAvailable();
    if (!loading) {
      stopWatching();
    }
  };

  const observer = new MutationObserver((mutations) => {
    const timelineChanges = mutations.find((mutation) => {
      return [...mutation.addedNodes]
        .map((m) => m.className && m.className.includes('js-timeline-item'))
        .includes(true);
    });
    if (timelineChanges) {
      tidyTimeline();
    }
  });

  const startWatchingForTimelineChanges = (timeline) => {
    observer.observe(timeline, {
      attributes: false,
      characterData: false,
      childList: true,
      subtree: true,
      attributeOldValue: false,
      characterDataOldValue: false,
    });
  };

  const stopWatching = () => {
    observer.disconnect();
  };

  const deactivate = () => {
    getHiddenItems().forEach((el) => {
      showEvent(el);
    });
    updateStatus('idle');
  };

  const handleClick = () => {
    if (status==='active') {
      deactivate();
    } else {
      tidyTimeline();
    }
  };

  const hideToggleButton = async () => {
    const btn = getToggleButton();
    if (btn) {
      btn.classList.remove('visible')
    }
  };

  const monitor = async () => {
    const newPageUrl = document.location.href;
    if (newPageUrl !== pageUrl) {
      pageUrl = newPageUrl;
      await new Promise((res) => setTimeout(res, 500));
      const timeline = document.querySelectorAll('.pull-discussion-timeline')[0];
      if (timeline) {
        startWatchingForTimelineChanges(timeline);
        tidyTimeline();
      } else {
        stopWatching();
        await new Promise((res) => setTimeout(res, 500));
        hideToggleButton();
      }
    }
  };

  const initialise = () => {
    monitorInterval = setInterval(monitor, 1000);
  };

  window.addEventListener(
    'load',
    function load() {
      window.removeEventListener('load', load, false);
      initialise();
    },
    false
  );

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearInterval(monitorInterval);
    } else {
      initialise();
    }
  });
})();
