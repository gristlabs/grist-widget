const {dom, Observable, styled} = grainjs;

function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

const isBuilderMode = Observable.create(null, false);

let builderPromise = null;
let rendererPromise = null;

function saveForm(builder) {
  console.warn("BUILDER.FORM", builder.form);
  return grist.setOption('formJson', builder.form);
}

ready(() => {
  grist.ready({
    columns: [],
    requiredAccess: 'none',
    onEditOptions: () => isBuilderMode.set(true),
  });

  grist.onOptions((options, settings) => {
    console.warn("OPTIONS", options, "SETTINGS", settings);
    if (!rendererPromise) {
      const builderElem = dom('div');
      builderPromise = Formio.builder(builderElem, {}, {});
      const rendererElem = dom('div');
      rendererPromise = Formio.createForm(rendererElem, {});
      document.body.innerHTML = '';
      dom.update(document.body,
        cssButton(
          dom.text(use => use(isBuilderMode) ? 'View' : 'Build'),
          dom.on('click', () => { save(); isBuilderMode.set(!isBuilderMode.get()); }),
        ),
        cssWrap(dom.show(isBuilderMode), builderElem),
        cssWrap(dom.hide(isBuilderMode), rendererElem),
      );

      function save() { builderPromise.then(builder => saveForm(builder)); }

      builderPromise.then(builder => {
        builder.on('addComponent', () => saveForm(builder));
        builder.on('removeComponent', () => saveForm(builder));
        builder.on('updateComponent', () => saveForm(builder));
      });
    }

    const formJson = options?.formJson || {};
    rendererPromise.then(form => form.setForm(formJson));
    builderPromise.then(builder => builder.setForm(formJson));
  });
});

const cssWrap = styled('div', `
  padding: 16px;
`);

const cssButton = styled('button', `
  appearance: none;
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 100;
  background-color: #ffffff80;
  border: 1px solid #16b378;
  margin: 0;
  padding: 0;
  border-radius: 4px;
`);
