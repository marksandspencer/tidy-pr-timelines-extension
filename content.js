/* global chrome, PHRASES_TO_HIDE */

(function () {
  const itemClass = 'TimelineItem';
  const itemHiddenClass = 'TimelineItem-Hidden';

  let isActive = true;
  let numMatchingEvents = 0;
  let timeline;
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

  const getButton = (create = false) => {
    const buttonID = 'tidy-timeline-button';
    const btn = document.getElementById(buttonID);
    if (btn) {
      return btn;
    }
    if (!create) {
      return;
    }

    const newBtn = document.createElement('button');
    newBtn.setAttribute('id', buttonID);
    // eslint-disable-next-line functional/immutable-data
    newBtn.onclick = handleClick;
    document.body.appendChild(newBtn);
    return newBtn;
  };

  const getItems = () => {
    return document.querySelectorAll(`.${itemClass}`);
  };

  const getHiddenItems = () => {
    return document.querySelectorAll(`.${itemHiddenClass}`);
  };

  const updateButton = (isLoading) => {
    const btn = getButton(true);

    if (isActive) {
      numMatchingEvents = getHiddenItems().length;
    }

    const count = `${numMatchingEvents} event${
      numMatchingEvents === 1 ? '' : 's'
    }`;
    const message = isActive ? `${count} hidden` : `Click to hide ${count}`;
    const loader =
      isActive && isLoading
        ? `<img src='${chrome.runtime.getURL('images/loader.gif')}' />`
        : '';
    const icon = isActive
      ? `<span><img src='${chrome.runtime.getURL('images/32.png')}' /></span>`
      : '';

    // eslint-disable-next-line functional/immutable-data
    btn.innerHTML = icon + message + loader;
  };

  const loadMoreIfAvailable = () => {
    const btn = querySelectorIncludesText('button', 'Load more');
    if (btn) {
      btn.click();
      updateButton(true);
      return true;
    }
    return false;
  };

  const tidyTimeline = () => {
    isActive = true;
    getItems().forEach((el) => {
      const shouldHide = PHRASES_TO_HIDE.find((phrase) =>
        el.innerText.includes(phrase)
      );
      if (shouldHide) {
        hideEvent(el);
      }
    });
    updateButton(false);
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

  const startWatchingForTimelineChanges = () => {
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
    isActive = false;
    updateButton();
  };

  const handleClick = () => {
    if (isActive) {
      deactivate();
    } else {
      tidyTimeline();
    }
  };

  const removeButton = () => {
    const btn = getButton();
    if (btn) {
      document.body.removeChild(btn);
    }
  };

  const monitor = async () => {
    const newPageUrl = document.location.href;
    if (newPageUrl !== pageUrl) {
      pageUrl = newPageUrl;

      await new Promise((res) => setTimeout(res, 500));

      timeline = document.querySelectorAll('.pull-discussion-timeline')[0];

      if (timeline) {
        startWatchingForTimelineChanges();
        tidyTimeline();
      } else {
        stopWatching();
        removeButton();
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
