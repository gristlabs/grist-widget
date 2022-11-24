# PivotTable custom widget for Grist

This widget builds a [pivot table](https://pivottable.js.org/examples/) from the source data.

Just setting its url gives a pivot table without any row / column definition.

The settings may be adjusted by passing url parameters, for example (with data similar to [this example](https://pivottable.js.org/examples/mps_agg.html)):

```
https://path/to/pivottable?rows=Party,Province&cols=Gender&aggregatorName=Average&rendererName=Col Heatmap
```