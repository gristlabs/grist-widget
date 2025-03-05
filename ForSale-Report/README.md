# Property Report Generator - Grist Custom Widget

This custom Grist widget allows you to generate property reports directly from your Grist document. It integrates with the Dynamic Real Estate Listing Template to create beautiful PDF reports of your selected properties.

## Features

- Select properties directly from your Grist document
- Generate PDF reports with a single click
- Modern, user-friendly interface
- Automatic download of generated reports

## Setup Instructions

1. **Prerequisites**
   - Make sure you have the Dynamic Real Estate Listing Template installed
   - Install required Python packages:
     ```bash
     pip install grist-widget pdfkit jinja2 requests
     ```
   - Install wkhtmltopdf (required for PDF generation):
     - Windows: Download and install from [wkhtmltopdf downloads](https://wkhtmltopdf.org/downloads.html)
     - Mac: `brew install wkhtmltopdf`
     - Linux: `sudo apt-get install wkhtmltopdf`

2. **Widget Installation**
   1. In your Grist document, click on "Add Widget" (+ button)
   2. Choose "Custom Widget"
   3. Enter the following details:
      - Widget URL: Path to your `index.html` file
      - Access: Select "Full document access"

3. **Configuration**
   - The widget will automatically configure itself using your Grist document's API key and document ID
   - Make sure your Properties table has the following columns:
     - Property_Name
     - Address
     - Date_Listed
     - Property_Type
     - Price
     - Cap_Rate
     - Lease_Term
     - RBA (Rentable Building Area)
     - Notes
     - photo_url

## Usage

1. Open your Grist document
2. The widget will display a list of all properties from your Properties table
3. Select the properties you want to include in the report
4. Click "Generate Report"
5. Once generated, click the download link to get your PDF report

## Troubleshooting

- If the widget fails to load, check that all required Python packages are installed
- If PDF generation fails, ensure wkhtmltopdf is properly installed
- Check the browser console for any JavaScript errors
- Verify that your Grist document has the correct table structure

## Support

If you encounter any issues or need assistance, please:
1. Check the error message displayed in the widget
2. Verify all setup steps have been completed
3. Contact support with the error details

## License

This widget is distributed under the same license as the Dynamic Real Estate Listing Template.