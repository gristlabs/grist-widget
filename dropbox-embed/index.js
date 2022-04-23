// Alias for document.getElementById.
const getElem = (id) => document.getElementById(id);

// Show the given div ID, and hide the others on this page.
function show(divId) {
  for (const id of ["setup", "dropbox", "empty"]) {
    getElem(id).style.display = (id === divId ? 'block' : 'none');
  }
}

grist.ready({
  columns: [
    { name: "DropboxLink", title: 'Dropbox Link', type: 'Text'},
  ],
  requiredAccess: 'read table',
});

const shown = {
  embed: null,
  link: null,
};

function showLink(link) {
  if (link !== shown.link) {
    if (shown.embed) {
      Dropbox.unmount(shown.embed);
    }
    shown.link = link;
    shown.embed = link ? Dropbox.embed({link}, getElem('dropbox')) : null;
  }
}

grist.onNewRecord(() => show("empty"));
grist.onRecord(record => {
  const mapped = grist.mapColumnNames(record);
  if (!mapped) {
    show("setup");
  } else if (!mapped.DropboxLink) {
    show("empty");
  } else {
    show("dropbox");
    showLink(mapped.DropboxLink);
  }
});
