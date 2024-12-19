# Grist webframe widget

A [Grist](https://www.getgrist.com/) widget that will load any URL into an iframe.  

_Note that many websites disallow getting loaded into an iframe, unfortunately there's nothing this widget can do about that when it happens._  

Provided the URL is the same across records, the widget is smart enough to load it just once rather than everytime Grist emits a "record changed" event.

To use, just add a custom widget in Grist and set its URL to `https://tomnitschke.github.io/gristwidgets/webframe`. Then map a text column that holds the URL to load. Done!
