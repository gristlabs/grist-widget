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
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = String(option);
      optionElement.textContent = String(option);
      dropdown.appendChild(optionElement);
    });
  }
}

function initGrist() {
  console.log('Initializing Grist');
  grist.ready({
    columns: [{ name: "Options", title: 'Options', type: 'Any' }],
    requiredAccess: 'read table',
  });
  console.log('Grist initialized');

  grist.onRecords(function (records) {
    console.log('Received records:', JSON.stringify(records, null, 2));
    if (!records || records.length === 0) {
      showError("No records received");
      updateDropdown([]);
      return;
    }
    
    const mapped = grist.mapColumnNames(records[0]);
    console.log('Mapped record:', JSON.stringify(mapped, null, 2));
    
    if (!mapped || !mapped.Options) {
      showError("Please choose a column to show in the Creator Panel.");
      updateDropdown([]);
      return;
    }

    showError("");
    const options = records.map(record => record.Options).filter(option => option !== null && option !== undefined);
    console.log('Filtered options:', JSON.stringify(options, null, 2));
    
    if (options.length === 0) {
      showError("No valid options found");
    }
    updateDropdown(options);
  });

  grist.onRecord(function (record) {
    console.log('Received single record:', JSON.stringify(record, null, 2));
    const mapped = grist.mapColumnNames(record);
    if (!mapped || !mapped.Options) {
      console.log('No Options field in mapped record');
      return;
    }
    
    const dropdown = document.getElementById('dropdown');
    dropdown.value = String(mapped.Options);
    console.log('Set dropdown value to:', dropdown.value);
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