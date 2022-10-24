(function() { 

  let isActive = true
  let numEventsHidden = 0
  let timeline
  let pageUrl
  let monitorInterval
  const observer = new MutationObserver(checkForTimelineChanges)

  function checkForTimelineChanges(mutations) {
    // when the dom has changed - check if the timeline has been added to
    const timelineChanges = mutations.find((mutation) => {
      return [...mutation.addedNodes].map(m => m.className && m.className.includes('js-timeline-item')).includes(true)
    })
    if (timelineChanges) processTimeline()
  }

  function loadMoreIfAvailable() {
    const btn = querySelectorIncludesText("button", "Load more")
    if (btn) {
      btn.click()
      updateButton(true)
      return true
    }
    return false
  }

  function querySelectorIncludesText(selector, text) {
    return Array.from(document.querySelectorAll(selector)).find((el) =>
      el.textContent.includes(text)
    );
  }

  function removePrNoise() {
    document.querySelectorAll(".TimelineItem").forEach((el) => {
      const shouldHide = PHRASES_TO_HIDE.find((phrase) => el.innerText.includes(phrase))
      if (shouldHide) {
        el.classList.add("TimelineItem-Noise");
        el.classList.remove("TimelineItem")
      }
    });
    updateButton(false)
  }

  function getButton(create = false) {
    const buttonID = 'pr-noise-button'
    const btn = document.getElementById(buttonID)
    if (btn) return btn
    if (!create) return 

    const newBtn = document.createElement("button");
    newBtn.id = buttonID
    newBtn.onclick = function() {
      if (isActive) {
        deactivate()
      }
      else {
        processTimeline()
      }
    };
    document.body.appendChild(newBtn);
    return newBtn
  }

  function deactivate() {
    document.querySelectorAll(".TimelineItem-Noise").forEach((el) => {
      el.classList.remove("TimelineItem-Noise")
      el.classList.add("TimelineItem")
    });
    isActive = false
    updateButton()
  }

  function updateButton(isLoading) {
    const btn = getButton(true)
    let message

    if (!isActive) {
      message = `Click to hide ${numEventsHidden} event${numEventsHidden === 1 ? '' : 's'}`
    }
    else {
      numEventsHidden = document.querySelectorAll(".TimelineItem-Noise").length
      message = `${numEventsHidden} event${numEventsHidden === 1 ? '' : 's'} hidden`
      if (isLoading) message += '&nbsp;&nbsp; <img width="20px" src='+chrome.runtime.getURL("images/loader.gif")+' />'
    }

    btn.innerHTML = (isActive ? '<span class="pr-noise-active" ><img src='+chrome.runtime.getURL("images/32.png")+' /></span> ' : '') + message;
  }

  function removeButton() {
    const btn = getButton()
    if (btn) document.body.removeChild(btn)
  }

  function startWatchingForTimelineChanges() {
    observer.observe(timeline, {
      attributes: false,
      characterData: false,
      childList: true,
      subtree: true,
      attributeOldValue: false,
      characterDataOldValue: false
    })
  }

  function stopWatching() {
    observer.disconnect();
  }

  function processTimeline() {
    isActive = true
    removePrNoise()
    const loading = loadMoreIfAvailable()
    if (!loading) stopWatching()
  }

  async function monitor() {
    // detect url changes on github spa. if a pull request timeline is found - process it
    const newPageUrl = document.location.href
    if (newPageUrl !== pageUrl) {
      // page has changed
      pageUrl = newPageUrl

      // give list a chance to load
      await new Promise((res) => setTimeout(res, 500));

      timeline = document.querySelectorAll('.pull-discussion-timeline')[0]

      if (timeline) {
        startWatchingForTimelineChanges()
        processTimeline()
      }
      else {
        stopWatching()
        removeButton()
      }
    }
  }

  function initialise () {
    monitorInterval = setInterval(monitor, 1000)
  }

  // wait until page has loaded to trigger the listeners
  window.addEventListener('load', function load(e){
    window.removeEventListener('load', load, false);
    initialise()
  }, false);

  // listen for tab switching
  document.addEventListener('visibilitychange', function (event) {
    if (document.hidden) {
        //stop monitoring for page change
        clearInterval(monitorInterval)
    } else {
        //resume monitoring for page change
        initialise()
    }
  });

})(); 