function showError(msg) {
  let el = document.getElementById('error');
  if (!msg) {
    el.style.display = 'none';
  } else {
    el.innerHTML = msg;
    el.style.display = 'block';
    console.error(msg);
  }
}

function updateDropdown(options) {
  const dropdown = document.getElementById('dropdown');
  dropdown.innerHTML = '';
  console.log('Updating dropdown with options:', JSON.stringify(options));
  if (options.length === 0) {
    const optionElement = document.createElement('option');
    optionElement.textContent = 'No options available';
    dropdown.appendChild(optionElement);
  } else {
    options.forEach((option, index) => {
      const optionElement = document.createElement('option');
      optionElement.value = String(index);  // Use index as value
      optionElement.textContent = String(option);
      dropdown.appendChild(optionElement);
    });
  }
}

function initGrist() {
  console.log('Initializing Grist');
  grist.ready({
    columns: [{ name: "OptionsToSelect", title: 'Options to select', type: 'Any' }],
    requiredAccess: 'read table',
    allowSelectBy: true,  // Enable linking
  });
  console.log('Grist initialized');

  let allRecords = [];

  grist.onRecords(function (records) {
    console.log('Received records:', JSON.stringify(records, null, 2));
    if (!records || records.length === 0) {
      showError("No records received");
      updateDropdown([]);
      return;
    }
    
    allRecords = records;  // Store all records
    const mapped = grist.mapColumnNames(records);
    console.log('Mapped records:', JSON.stringify(mapped, null, 2));

    showError("");
    const options = mapped.map(record => record.OptionsToSelect).filter(option => option !== null && option !== undefined);
    console.log('Filtered options:', JSON.stringify(options, null, 2));
    
    if (options.length === 0) {
      showError("No valid options found");
    }
    updateDropdown(options);
  });

  grist.onRecord(function (record) {
    console.log('Received single record:', JSON.stringify(record, null, 2));
    const mapped = grist.mapColumnNames(record);
    const dropdown = document.getElementById('dropdown');
    const index = allRecords.findIndex(r => r.id === record.id);
    if (index !== -1) {
      dropdown.value = String(index);
    }
    console.log('Set dropdown value to:', dropdown.value);
  });

  // Add event listener for dropdown changes
  document.getElementById('dropdown').addEventListener('change', function(event) {
    const selectedIndex = parseInt(event.target.value);
    const selectedRecord = allRecords[selectedIndex];
    if (selectedRecord) {
      grist.setCursorPos({rowId: selectedRecord.id});
      console.log('Set cursor position to row ID:', selectedRecord.id);
    }
  });

  // Add this to check if we're getting any data at all
  grist.fetchSelectedTable().then(table => {
    console.log('Fetched table:', JSON.stringify(table, null, 2));
  }).catch(err => {
    console.error('Error fetching table:', err);
  });
}

// Initialize Grist when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');
  initGrist();
});

// Add this line to log any errors that occur
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Error:', message, 'at', source, lineno, colno, error);
};