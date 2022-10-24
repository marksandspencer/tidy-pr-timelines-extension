# Tidy PR Timelines

PR timelines can get cluttered with hundreds of automated messages about deployment etc.

This extension will hide certain phrases in PR timeline events on https://github.com

A message is shown indicating the number of events that are hidden. Click it to show all events.

## To use this UNPACKED extension

- In Google Chrome visit: [chrome://extensions/](chrome://extensions/)
- Toggle 'Developer mode' ON (top right)
- Click 'Load unpacked' and select the root folder of this repository
- Enable the extension

## Current filter list (See filters.js)

- `temporarily deployed to`
- `had a problem deploying to`
- `Merge branch 'main' into`

## How it works

Because GitHub in a single page app, the extension needs to monitor for page and tab changes.

When a PR timeline element is present, the extension will hide events matching the phrases in filters.js.

If the timeline is long, the timeline is paginated. This extension clicks 'load more' repeatedly until it's all visible, hiding matching events after each re-render.

## Want to contribute?

See the [Contribution Guidelines](/CONTRIBUTING.md).
