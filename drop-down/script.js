function showError(msg) {
  let el = document.getElementById('error');
  if (!msg) {
    el.style.display = 'none';
  } else {
    el.innerHTML = msg;
    el.style.display = 'block';
    console.error(msg);  // Log error to console
  }
}

function updateDropdown(options) {
  const dropdown = document.getElementById('dropdown');
  dropdown.innerHTML = '';
  console.log('Updating dropdown with options:', options);  // Log options
  if (options.length === 0) {
    const optionElement = document.createElement('option');
    optionElement.textContent = 'No options available';
    dropdown.appendChild(optionElement);
  } else {
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = String(option);
      optionElement.textContent = String(option);
      dropdown.appendChild(optionElement);
    });
  }
}

grist.ready({
  columns: [{ name: "Options", title: 'Options', type: 'Any' }],
  requiredAccess: 'read table',
}).then(() => {
  console.log('Grist ready');  // Log when Grist is ready
}).catch(err => {
  showError('Error initializing Grist: ' + err.message);
});

grist.onRecords(function (records) {
  console.log('Received records:', records);  // Log received records
  if (!records || records.length === 0) {
    showError("No records received");
    updateDropdown([]);
    return;
  }
  
  const mapped = grist.mapColumnNames(records[0]);
  console.log('Mapped record:', mapped);  // Log mapped record
  
  if (!mapped || !mapped.Options) {
    showError("Please choose a column to show in the Creator Panel.");
    updateDropdown([]);
    return;
  }

  showError("");
  const options = records.map(record => record.Options).filter(option => option !== null && option !== undefined);
  console.log('Filtered options:', options);  // Log filtered options
  
  if (options.length === 0) {
    showError("No valid options found");
  }
  updateDropdown(options);
});

grist.onRecord(function (record) {
  console.log('Received single record:', record);  // Log received record
  const mapped = grist.mapColumnNames(record);
  if (!mapped || !mapped.Options) {
    console.log('No Options field in mapped record');  // Log if Options is missing
    return;
  }
  
  const dropdown = document.getElementById('dropdown');
  dropdown.value = String(mapped.Options);
  console.log('Set dropdown value to:', dropdown.value);  // Log set value
});

// Add this line to log any errors that occur
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Error:', message, 'at', source, lineno, colno, error);
};