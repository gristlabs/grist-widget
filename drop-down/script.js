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
    optionElement.value = option;
    optionElement.textContent = option;
    dropdown.appendChild(optionElement);
  });
}

grist.ready({
  columns: [{ name: "Options", title: 'Options', type: 'Text' }],
  requiredAccess: 'read table',
});

grist.onRecord(function (record) {
  const mapped = grist.mapColumnNames(record);
  const data = mapped ? mapped.Options : undefined;
  
  if (data === undefined) {
    showError("Please choose a column to show in the Creator Panel.");
  } else {
    showError("");
    if (!data) {
      updateDropdown([]);
    } else {
      const options = data.split(',').map(option => option.trim());
      updateDropdown(options);
    }
  }
});