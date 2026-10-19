# Web page viewer

Shows the web page whose URL is in the selected record, so you can browse
linked sites (suppliers, references, docs) next to your table.

## Usage

1. Add a Custom widget and pick **Web page viewer** from the gallery.
2. Give it **Read selected table** access.
3. In the creator panel, map **URL** to a Text column holding web addresses
   (plain URLs, `example.com/page`, or Hyperlink cells like `Label https://...`).
4. Link the widget to your table ("Select by") or use it on the same table.

## Behavior

- A top bar shows the current URL and an **Open in new tab** link.
- Empty or invalid values show a short message instead of a page.
- Only `http:` and `https:` URLs are loaded; `javascript:`, `data:` and others are refused.
- The page loads in a sandboxed iframe (no top-level navigation of Grist) with no referrer.
- Many sites forbid being framed (`X-Frame-Options` / CSP `frame-ancestors`). The browser
  then shows a blank or refused frame; a hint points to **Open in new tab**.
- Changing other cells in the same record doesn't reload the page.

## Credits


## License

Apache-2.0, like the rest of this repository.
