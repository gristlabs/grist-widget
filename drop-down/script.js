function showError(msg) {
  let el = document.getElementById('error');
  if (!msg) {
    el.style.display = 'none';
  } else {
    el.innerHTML = msg;
    el.style.display = 'block';
  }
}

function updateDropdown(options) {
  const dropdown = document.getElementById('dropdown');
  dropdown.innerHTML = '';
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = String(option);
    optionElement.textContent = String(option);
    dropdown.appendChild(optionElement);
  });
}

grist.ready({
  columns: [{ name: "Options", title: 'Options', type: 'Any' }],
  requiredAccess: 'read table',
});

grist.onRecords(function (records) {
  const mapped = grist.mapColumnNames(records[0]);
  if (!mapped || !mapped.Options) {
    showError("Please choose a column to show in the Creator Panel.");
    return;
  }

  showError("");
  const options = records.map(record => record.Options).filter(option => option !== null && option !== undefined);
  
  if (options.length === 0) {
    updateDropdown([]);
  } else {
    updateDropdown(options);
  }
});

grist.onRecord(function (record) {
  const mapped = grist.mapColumnNames(record);
  if (!mapped || !mapped.Options) return;
  
  const dropdown = document.getElementById('dropdown');
  dropdown.value = String(mapped.Options);
});