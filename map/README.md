# Map widget

Shows the records of a table as pins on a map (Leaflet). Map the Name, Latitude and
Longitude columns; optionally map Address and GeocodedAddress to geocode addresses
(this needs full access). Clicking a row in a linked table zooms to its pin.

## Options

Open the widget's configuration (the "Open configuration" link in the creator panel).

- **Tile server URL** and **Copyright**: the map tiles to use.
- **Default view**: latitude, longitude and zoom (1 to 18) the map opens at.
  - Pan and zoom the map the way you like it, then click **Use current view** to fill
    the three fields from the map. You can also type the values by hand. Latitude must
    be between -90 and 90, longitude between -180 and 180, and zoom is rounded and
    clamped to 1 to 18.
  - Click **Clear** to empty the fields.
  - Click **Save** at the top of the widget to keep the change.

When all three default view fields are set, the map opens at that view, and the home
button under the + and − zoom buttons returns to it. When they are empty, the map fits
all pins on load and the home button fits all pins, as before.

In "Selected row only" mode the map always fits the selected pin, and the default view
is not used.
