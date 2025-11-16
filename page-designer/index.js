const { createApp, ref, shallowRef } = Vue;

const status = ref('waiting');

function reportError(err) {
  status.value = String(err).replace(/^Error: /, '');
}

function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  // Initialize Grist connection.
  grist.ready({
    requiredAccess: 'read table',
  });
  grist.onOptions((options) => {
    console.warn("OPTIONS", options);
  })
  grist.onRecords((rows) => {
    try {
      status.value = '';
      records.value = grist.mapColumnNames(rows);
    } catch (e) {
      reportError(e);
    }
  });

  // Initialize Vue.
  const records = shallowRef(null);
  const app = createApp({
    setup() {
      return {records, status};
    }
  });
  app.config.errorHandler = reportError;
  app.mount('#app');
});
