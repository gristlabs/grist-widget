window.onerror = (err) => {
  console.trace();
  alert(String(err));
};

grist.ready({
  requiredAccess: 'read table'
});

function wavg (n) {
  if (!n) { return; }
  n = n.filter(([note]) => typeof (note) === 'number');
  if (n.length) { return n.map(([note, coef]) => note * coef).reduce((a, b) => a + b) / n.map(([_note, coef]) => coef).reduce((a, b) => a + b); }
}

function weightedAverage ([val, coef]) {
  return (_data, _rowKey, _colKey) => ({
    values: [],
    push: function (rec) { this.values.push([rec[val], rec[coef]]); },
    value: function () { return wavg(this.values); },
    format: function (x) { return (Math.round(x * 100) / 100).toFixed(2); },
    numInputs: 2
  });
}

const aggregators = {
  'Weighted Average': weightedAverage
};

grist.onRecords(async rec => {
  const { rows, cols, vals, aggregatorName, rendererName } = await grist.getOption('settings') ?? {};
  let initialRender = true;
  $('#table').pivotUI(
    rec,
    {
      rows,
      cols,
      vals,
      onRefresh: function (config) {
        if (initialRender) {
          initialRender = false;
          return;
        }
        const { rows, cols, vals, aggregatorName, rendererName } = config;
        grist.setOption('settings', { rows, cols, vals, aggregatorName, rendererName });
      },
      aggregatorName,
      rendererName,
      aggregators: $.extend($.pivotUtilities.aggregators, aggregators),
      renderers: $.extend(
        $.pivotUtilities.renderers,
        $.pivotUtilities.plotly_renderers,
        $.pivotUtilities.d3_renderers,
        $.pivotUtilities.export_renderers
      )
    },
    true
  );
});
