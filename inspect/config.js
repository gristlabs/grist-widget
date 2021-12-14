// Handler for onOptions event, invoked after we send ready message
grist.onOptions(options => {
  if (options?.name) {
    document.getElementById("textbox").value = options.name;
  }
});

// Save button handler
async function saveConfig() {
  const name = document.getElementById('textbox').value;
  try {
    if (!grist.widgetApi) {
      throw new Error("WidgetApi is not available");
    }
    await grist.widgetApi.saveOptions({name});
    closeConfig();
  } catch (err) {
    alert(err.message || String(err));
  }
};

// Handler for cancel button and overlay click
function closeConfig() {
  grist.rpc.callRemoteFunc("closePopup");
}

// Message Grist that we are ready.
grist.ready();
