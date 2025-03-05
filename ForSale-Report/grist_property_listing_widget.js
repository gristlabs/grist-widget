// Grist Property Listing Widget Module

// Widget state
let widgetState = {
    apiKey: null,
    docId: null,
    tableName: null,
    configured: false
};

// Initialize widget state from saved options
async function initWidgetState() {
    try {
        console.log('Initializing widget state...');
        // First try to get options from widgetApi
        if (typeof grist !== 'undefined' && grist.widgetApi) {
            const options = await grist.widgetApi.getOptions();
            console.log('Widget options:', options);
            
            if (options && options.configured) {
                // If we have saved configuration, use it
                widgetState.apiKey = options.apiKey;
                widgetState.docId = options.docId;
                widgetState.tableName = options.tableName || 'Properties';
                widgetState.configured = true;
                
                // Try to fetch data using the configured table name
                try {
                    if (grist.docApi) {
                        const records = await grist.docApi.fetchTable(widgetState.tableName);
                        await refreshWidget(records);
                        return;
                    } else {
                        console.warn('grist.docApi is not available');
                    }
                } catch (fetchError) {
                    console.warn('Could not fetch configured table, falling back to selected table:', fetchError);
                }
            }
        } else {
            console.warn('grist.widgetApi is not available');
        }
        
        // If no configuration or fetch failed, try to use selected table
        try {
            if (grist.selectedTable) {
                const tableId = await grist.selectedTable.getTableId();
                
                // Fix: Use the correct method to fetch records from the selected table
                // The error shows that fetchSelectedRecords is not a function
                // Let's use the available methods instead
                let records = [];
                
                try {
                    // Try to get records using getSelectedRecords if available
                    if (typeof grist.selectedTable.getSelectedRecords === 'function') {
                        records = await grist.selectedTable.getSelectedRecords();
                    } 
                    // Try alternative method using docApi if available
                    else if (grist.docApi && typeof grist.docApi.fetchSelectedTable === 'function') {
                        records = await grist.docApi.fetchSelectedTable(tableId);
                    }
                    // Fallback to fetching the entire table if we can't get selected records
                    else if (grist.docApi && typeof grist.docApi.fetchTable === 'function') {
                        records = await grist.docApi.fetchTable(tableId);
                    }
                    else {
                        throw new Error('No suitable method found to fetch table records');
                    }
                } catch (fetchError) {
                    console.warn('Error fetching records:', fetchError);
                    throw fetchError;
                }
                
                // Update widget state
                widgetState.tableName = tableId;
                widgetState.configured = true;
                
                // Refresh the widget display
                await refreshWidget(records);
            } else {
                console.warn('grist.selectedTable is not available');
                document.getElementById('widget-root').innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <h3>Property Listing Widget</h3>
                        <p>Please configure the widget or select a table to display properties.</p>
                        <p><small>Error: grist.selectedTable is not available</small></p>
                    </div>
                `;
            }
        } catch (selectedTableError) {
            console.warn('Could not access selected table:', selectedTableError);
            document.getElementById('widget-root').innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h3>Property Listing Widget</h3>
                    <p>Please configure the widget or select a table to display properties.</p>
                    <p><small>Error: ${selectedTableError.message}</small></p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error initializing widget state:', error);
        document.getElementById('widget-root').innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h3>Property Listing Widget</h3>
                <p>An error occurred while initializing the widget.</p>
                <p><small>Error: ${error.message}</small></p>
            </div>
        `;
    }
}

// Function to refresh widget display
async function refreshWidget(records) {
    if (!widgetState.configured) {
        document.getElementById('widget-root').innerHTML = '<div>Please configure the widget first</div>';
        return;
    }

    try {
        console.log('Records received:', records);
        
        // Ensure records is valid
        if (!records) {
            throw new Error('No records data received');
        }
        
        // Handle different data structures that might be returned by Grist API
        let recordsArray = [];
        
        if (Array.isArray(records)) {
            recordsArray = records;
        } else if (typeof records === 'object') {
            // If it's an object with records property (common Grist API response format)
            if (records.records && Array.isArray(records.records)) {
                recordsArray = records.records;
            } 
            // If it's an object with a data property
            else if (records.data && Array.isArray(records.data)) {
                recordsArray = records.data;
            }
            // If it's a record object with fields
            else if (records.fields) {
                recordsArray = [records];
            }
            // If it's just a plain object with properties
            else {
                recordsArray = Object.values(records);
            }
        }
        
        console.log('Processed records array:', recordsArray);

        // Generate HTML content using the template styling
        let content = `
        <style>
            /* Base Styles */
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #fff;
            }
            
            .header {
                text-align: center;
                padding: 20px 0;
                margin-bottom: 30px;
                border-bottom: 2px solid #0056b3;
            }
            
            .header h1 {
                color: #0056b3;
                margin: 0;
                font-size: 28px;
            }
            
            .header p {
                color: #666;
                margin: 5px 0 0;
            }
            
            /* Property Card Styles */
            .property-card {
                margin-bottom: 40px;
                border: 1px solid #ddd;
                border-radius: 5px;
                overflow: hidden;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .property-image {
                width: 100%;
                height: 250px;
                background-color: #eee;
                background-size: cover;
                background-position: center;
            }
            
            .property-details {
                padding: 20px;
            }
            
            .property-name {
                font-size: 22px;
                font-weight: bold;
                color: #0056b3;
                margin: 0 0 10px;
            }
            
            .property-address {
                font-size: 16px;
                color: #555;
                margin-bottom: 15px;
            }
            
            .property-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .property-feature {
                margin-bottom: 5px;
            }
            
            .feature-label {
                font-weight: bold;
                color: #666;
            }
            
            .property-notes {
                padding-top: 15px;
                border-top: 1px solid #eee;
                margin-top: 15px;
            }
            
            .property-notes ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .property-notes li {
                position: relative;
                padding-left: 20px;
                margin-bottom: 8px;
                line-height: 1.4;
            }
            
            .property-notes li:before {
                content: "•";
                position: absolute;
                left: 0;
                color: #0056b3;
            }
            
            .notes-label {
                font-weight: bold;
                color: #666;
                display: block;
                margin-bottom: 5px;
            }
            
            @media (max-width: 600px) {
                .property-grid {
                    grid-template-columns: 1fr;
                }
                
                .header h1 {
                    font-size: 24px;
                }
                
                .property-name {
                    font-size: 20px;
                }
            }
        </style>
        <div class="container">
            <div class="header">
                <h1>FEATURED COMMERCIAL PROPERTIES</h1>
                <p>Curated Properties Matching Your Investment Criteria</p>
            </div>`;
            
        if (recordsArray.length > 0) {
            // Generate property cards
            const propertyCards = recordsArray.map(record => {
                try {
                    const fields = record.fields || record;
                    
                    return `
                    <div class="property-card">
                        <div class="property-image" style="background-image: url('${getImageUrl(fields.photo_url)}');"></div>
                        <div class="property-details">
                            <h2 class="property-name">${fields.Property_Name || 'Unnamed Property'}</h2>
                            <p class="property-address">${fields.Address || 'Address not available'}</p>
                            
                            <div class="property-grid">
                                <div class="property-feature">
                                    <span class="feature-label">Price:</span> ${fields.Price ? `$${formatNumber(fields.Price)}` : 'Price on request'}
                                </div>
                                <div class="property-feature">
                                    <span class="feature-label">Cap Rate:</span> ${fields.Cap_Rate ? `${formatCapRate(fields.Cap_Rate)}%` : 'N/A'}
                                </div>
                                <div class="property-feature">
                                    <span class="feature-label">Lease Term:</span> ${fields.Lease_Term || 'N/A'}
                                </div>
                                ${fields.RBA ? `
                                <div class="property-feature">
                                    <span class="feature-label">Building Size:</span> ${formatNumber(fields.RBA)} SF
                                </div>` : ''}
                            </div>
                            
                            ${fields.Notes ? `
                            <div class="property-notes">
                                <span class="notes-label">Notes:</span>
                                <ul>
                                    ${fields.Notes.split('•').filter(note => note.trim()).map(note => `
                                        <li>${note.trim()}</li>
                                    `).join('')}
                                </ul>
                            </div>` : ''}
                        </div>
                    </div>`;
                } catch (itemError) {
                    console.error('Error processing property card:', itemError, record);
                    return `<div class="property-card">Error processing property</div>`;
                }
            }).join('');
            
            content += propertyCards;
        } else {
            content += `<p style="text-align: center;">No properties found</p>`;
        }
        
        content += `</div>`;
        document.getElementById('widget-root').innerHTML = content;
    } catch (error) {
        console.error('Error refreshing widget:', error);
        document.getElementById('widget-root').innerHTML = `<div>Error: ${error.message}</div>`;
    }
}

// Helper functions for formatting
function formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return 'N/A';
    }
    try {
        const num = parseFloat(value);
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    } catch {
        return 'N/A';
    }
}

function formatCapRate(value) {
    if (value === null || value === undefined || isNaN(value)) {
        return 'N/A';
    }
    try {
        const rate = parseFloat(value);
        return rate.toFixed(2);
    } catch {
        return 'N/A';
    }
}

function getImageUrl(photoUrl) {
    if (!photoUrl || typeof photoUrl !== 'string') {
        return 'https://placehold.co/800x400?text=No+Image+Available';
    }
    try {
        const url = new URL(photoUrl);
        return url.toString();
    } catch (error) {
        console.warn('Invalid image URL:', photoUrl);
        return 'https://placehold.co/800x400?text=Invalid+Image+URL';
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking for Grist API...');
    
    // Check if Grist API is available and initialize widget state
    if (typeof grist !== 'undefined') {
        console.log('Grist object found, initializing widget state...');
        initWidgetState();
    } else {
        console.error('Grist API not found');
        document.getElementById('widget-root').innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h3>Property Listing Widget</h3>
                <p>Grist API not found. Please ensure the widget is running in a Grist environment.</p>
            </div>
        `;
    }
});

/**
 * Configure the widget with API credentials
 * @param {string} apiKey - Grist API key
 * @param {string} docId - Grist document ID
 * @param {string} tableName - Grist table name (default: "Properties")
 */
export async function configure_widget(apiKey, docId, tableName = "Properties") {
    widgetState.apiKey = apiKey;
    widgetState.docId = docId;
    widgetState.tableName = tableName;
    
    try {
        // Verify configuration by attempting to fetch table data
        if (grist.docApi) {
            const records = await grist.docApi.fetchTable(tableName);
            
            // Save configuration to widget options
            if (grist.widgetApi) {
                await grist.widgetApi.setOption('configured', true);
                await grist.widgetApi.setOption('apiKey', apiKey);
                await grist.widgetApi.setOption('docId', docId);
                await grist.widgetApi.setOption('tableName', tableName);
            }
            
            // Update local state
            widgetState.configured = true;
            
            if (grist.api) {
                await grist.api.showMessage("Widget configured successfully");
            }
        } else {
            console.error('grist.docApi is not available');
            if (grist.api) {
                await grist.api.showMessage("Failed to configure widget: grist.docApi is not available");
            }
        }
    } catch (error) {
        console.error('Configuration error:', error);
        if (grist.api) {
            await grist.api.showMessage("Failed to configure widget: " + error.message);
        }
    }
}

/**
 * Preview the property listing in browser
 */
export async function preview_listing() {
    if (!widgetState.configured) {
        if (grist.api) {
            await grist.api.showMessage("Please configure the widget first");
        }
        return;
    }

    try {
        if (grist.docApi) {
            // Fetch all properties from the table
            const records = await grist.docApi.fetchTable(widgetState.tableName);
            
            // Let user select which properties to include
            try {
                const selectedProperties = await selectProperties(records);
                
                // Update the widget with selected properties
                await refreshWidget(selectedProperties);
                
                if (grist.api) {
                    await grist.api.showMessage("Preview updated successfully");
                }
            } catch (selectionError) {
                // User cancelled the selection
                console.log('Property selection cancelled:', selectionError);
                // Don't show an error message for cancellation
                return;
            }
        } else {
            console.error('grist.docApi is not available');
            if (grist.api) {
                await grist.api.showMessage("Failed to preview: grist.docApi is not available");
            }
        }
    } catch (error) {
        console.error('Preview error:', error);
        if (grist.api) {
            await grist.api.showMessage("Failed to preview: " + error.message);
        }
    }
}

/**
 * Preview the property listing in browser
 */
async function selectProperties(records) {
    // Process records into a consistent format
    let recordsArray = [];
    if (Array.isArray(records)) {
        recordsArray = records;
    } else if (typeof records === 'object') {
        if (records.records && Array.isArray(records.records)) {
            recordsArray = records.records;
        } else if (records.data && Array.isArray(records.data)) {
            recordsArray = records.data;
        } else if (records.fields) {
            recordsArray = [records];
        } else {
            recordsArray = Object.values(records);
        }
    }

    // Create choices for the dialog
    const choices = recordsArray.map((record, index) => {
        const fields = record.fields || record;
        return {
            id: index,
            label: `${fields.Property_Name || 'Unnamed Property'} - ${fields.Address || 'Address not available'}`
        };
    });

    try {
        // Show Grist's native selection dialog
        const result = await grist.api.showDialog({
            title: 'Select Properties',
            buttons: [{ label: 'Cancel' }, { label: 'Generate', default: true }],
            selectMulti: {
                label: 'Choose properties to include:',
                choices: choices
            }
        });

        // Check if user cancelled
        if (!result || result.button !== 'Generate') {
            throw new Error('Selection cancelled');
        }

        // Get selected property indices
        const selectedIndices = result.selectMulti || [];

        // If no properties selected, use all
        if (selectedIndices.length === 0) {
            return recordsArray;
        }

        // Return selected records
        return selectedIndices.map(index => recordsArray[index]);
    } catch (error) {
        throw error;
    }
}

/**
 * Generate a complete HTML document for property listings
 * @param {Array} records - Property records from Grist
 * @returns {string} Complete HTML document
 */
function generatePropertyListingHTML(records) {
    // Process records to ensure we have a proper array
    let recordsArray = [];
    
    if (Array.isArray(records)) {
        recordsArray = records;
    } else if (typeof records === 'object') {
        if (records.records && Array.isArray(records.records)) {
            recordsArray = records.records;
        } else if (records.data && Array.isArray(records.data)) {
            recordsArray = records.data;
        } else if (records.fields) {
            recordsArray = [records];
        } else {
            recordsArray = Object.values(records);
        }
    }
    
    // Generate the complete HTML document
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commercial Property Listings</title>
    <style>
        /* Base Styles */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
        }
        
        .header {
            text-align: center;
            padding: 20px 0;
            margin-bottom: 30px;
            border-bottom: 2px solid #0056b3;
        }
        
        .header h1 {
            color: #0056b3;
            margin: 0;
            font-size: 28px;
        }
        
        .header p {
            color: #666;
            margin: 5px 0 0;
        }
        
        /* Property Card Styles */
        .property-card {
            margin-bottom: 40px;
            border: 1px solid #ddd;
            border-radius: 5px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .property-image {
            width: 100%;
            height: 250px;
            background-color: #eee;
            background-size: cover;
            background-position: center;
        }
        
        .property-details {
            padding: 20px;
        }
        
        .property-name {
            font-size: 22px;
            font-weight: bold;
            color: #0056b3;
            margin: 0 0 10px;
        }
        
        .property-address {
            font-size: 16px;
            color: #555;
            margin-bottom: 15px;
        }
        
        .property-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .property-feature {
            margin-bottom: 5px;
        }
        
        .feature-label {
            font-weight: bold;
            color: #666;
        }
        
        .property-notes {
            padding-top: 15px;
            border-top: 1px solid #eee;
            margin-top: 15px;
        }
        
        .property-notes ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .property-notes li {
            position: relative;
            padding-left: 20px;
            margin-bottom: 8px;
            line-height: 1.4;
        }
        
        .property-notes li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #0056b3;
        }
        
        .notes-label {
            font-weight: bold;
            color: #666;
            display: block;
            margin-bottom: 5px;
        }
        
        /* Footer Styles */
        .footer {
            text-align: center;
            padding: 20px 0;
            margin-top: 30px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
        }
        
        .contact-card {
            max-width: 450px;
            margin: 40px auto;
            padding: 25px 30px;
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .contact-name {
            font-size: 20px;
            font-weight: bold;
            color: #0056b3;
            margin-bottom: 8px;
        }
        
        .contact-title {
            font-style: italic;
            color: #495057;
            margin-bottom: 15px;
            font-size: 15px;
        }
        
        .contact-info {
            line-height: 2;
            color: #495057;
        }
        
        .contact-phone {
            letter-spacing: 0.3px;
        }
        
        .contact-email a {
            color: #0056b3;
            text-decoration: none;
            font-weight: 500;
        }
        
        .contact-email a:hover {
            text-decoration: underline;
        }
        
        /* Responsive Design */
        @media (max-width: 600px) {
            .property-grid {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .property-name {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FEATURED COMMERCIAL PROPERTIES</h1>
            <p>Curated Properties Matching Your Investment Criteria</p>
        </div>
        
        ${recordsArray.length > 0 ? recordsArray.map(record => {
            try {
                const fields = record.fields || record;
                
                return `
                <div class="property-card">
                    <div class="property-image" style="background-image: url('${fields.photo_url || 'https://via.placeholder.com/800x400?text=Property+Image'}');"></div>
                    <div class="property-details">
                        <h2 class="property-name">${fields.Property_Name || 'Unnamed Property'}</h2>
                        <p class="property-address">${fields.Address || 'Address not available'}</p>
                        
                        <div class="property-grid">
                            <div class="property-feature">
                                <span class="feature-label">Price:</span> $${formatNumber(fields.Price) || 'Price on request'}
                            </div>
                            <div class="property-feature">
                                <span class="feature-label">Cap Rate:</span> ${formatCapRate(fields.Cap_Rate)}%
                            </div>
                            <div class="property-feature">
                                <span class="feature-label">Lease Term:</span> ${fields.Lease_Term || 'N/A'}
                            </div>
                            ${fields.RBA ? `
                            <div class="property-feature">
                                <span class="feature-label">Building Size:</span> ${formatNumber(fields.RBA)} SF
                            </div>` : ''}
                        </div>
                        
                        ${fields.Notes ? `
                        <div class="property-notes">
                            <span class="notes-label">Notes:</span>
                            <ul>
                                ${fields.Notes.split('•').filter(note => note.trim()).map(note => `
                                    <li>${note.trim()}</li>
                                `).join('')}
                            </ul>
                        </div>` : ''}
                    </div>
                </div>`;
            } catch (itemError) {
                console.error('Error processing property card:', itemError, record);
                return `<div class="property-card">Error processing property</div>`;
            }
        }).join('') : `<p style="text-align: center;">No properties found</p>`}
        
        <div class="footer">
            <p>For more information about these properties, please contact:</p>
            <div class="contact-card">
                <div class="contact-name">Sam Gfroerer</div>
                <div class="contact-title">Broker - National Retail Group</div>
                <div class="contact-info">
                    <div class="contact-address">111 SW 5th Ave #1950, Portland, OR 97204</div>
                    <div class="contact-phone">Office: (503) 200-2063   |   Cell: (971) 344-1260</div>
                    <div class="contact-email">E: <a href="mailto:Sam.G@marcusmillichap.com">Sam.G@marcusmillichap.com</a></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate a PDF of the property listing
 * @param {string} filename - Name of the PDF file to generate
 */
export async function generate_pdf(filename = "properties_listing.pdf") {
    if (!widgetState.configured) {
        if (grist.api) {
            await grist.api.showMessage("Please configure the widget first");
        }
        return;
    }

    try {
        if (grist.docApi) {
            // Fetch all properties from the table
            const records = await grist.docApi.fetchTable(widgetState.tableName);
            
            // Let user select which properties to include
            try {
                const selectedProperties = await selectProperties(records);
                
                // Generate HTML content with selected properties
                const htmlContent = generatePropertyListingHTML(selectedProperties);
                
                // Convert to PDF using a service
                // This is a placeholder - in a real implementation, you would use a PDF generation service
                // or library that works in the browser
                console.log('PDF generation would happen here with content:', htmlContent);
                
                // For now, just show a message
                if (grist.api) {
                    await grist.api.showMessage(`PDF generation is not implemented in this demo. In a full implementation, a PDF named ${filename} would be generated.`);
                }
            } catch (selectionError) {
                // User cancelled the selection
                console.log('Property selection cancelled:', selectionError);
                // Don't show an error message for cancellation
                return;
            }
        } else {
            console.error('grist.docApi is not available');
            if (grist.api) {
                await grist.api.showMessage("Failed to generate PDF: grist.docApi is not available");
            }
        }
    } catch (error) {
        console.error('PDF generation error:', error);
        if (grist.api) {
            await grist.api.showMessage("Failed to generate PDF: " + error.message);
        }
    }
}