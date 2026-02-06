/**
 * Grist Data Import Widget
 * Import Excel (.xlsx, .xls), CSV, and JSON files into Grist tables.
 *
 * @author Said Hamadou
 * @license Apache-2.0
 * @copyright 2026 Said Hamadou
 */

// =============================================================================
// INTERNATIONALIZATION (i18n)
// =============================================================================

var currentLang = (navigator.language || navigator.userLanguage || 'fr').substring(0, 2) === 'en' ? 'en' : 'fr';

var i18n = {
  fr: {
    title: "📥 Import de données",
    subtitle: "Importez vos données depuis Excel (.xlsx, .xls), CSV ou JSON",
    dropTitle: "Glissez-déposez votre fichier ici",
    dropSubtitle: "ou cliquez pour parcourir",
    dropFormats: "Formats acceptés : .xlsx, .xls, .csv, .json (max 50 MB)",
    clearBtn: "✕ Supprimer",
    sheetLabel: "📄 Sélectionner la feuille à importer :",
    csvOptionsTitle: "⚙️ Options CSV :",
    csvDelimiterLabel: "Séparateur",
    csvTabOption: "Tabulation",
    csvEncodingLabel: "Encodage",
    previewTitle: "👁️ Aperçu des données",
    importConfigTitle: "⚙️ Configuration de l'import",
    targetTableLabel: "📊 Table de destination :",
    loading: "Chargement...",
    refreshTitle: "Actualiser la liste des tables",
    deleteTableTitle: "Supprimer la table sélectionnée",
    tablesAvailable: "ℹ️ Tables disponibles :",
    newTableLabel: "📝 Nom de la nouvelle table :",
    newTablePlaceholder: "Ex: MesImports",
    newTableHint: "La table sera créée avec les colonnes du fichier importé",
    createNewTable: "Créer une nouvelle table",
    firstRowHeader: "La première ligne contient les en-têtes",
    clearTable: "Effacer les données existantes avant l'import",
    importBtn: "🚀 Importer les données",
    deleteConfirmPrefix: '⚠️ Voulez-vous vraiment supprimer la table "',
    confirmDeleteBtn: "Oui, supprimer",
    cancelBtn: "Annuler",
    progressTitle: "⏳ Import en cours...",
    guideTitle: "💡 Guide d'utilisation",
    guideExcel: "<strong>Excel (.xlsx, .xls)</strong> : Sélectionnez la feuille à importer si le fichier en contient plusieurs",
    guideCsv: "<strong>CSV</strong> : Ajustez le séparateur et l'encodage si nécessaire",
    guideJson: "<strong>JSON</strong> : Le fichier doit contenir un tableau d'objets",
    guideColumns: "Les colonnes seront créées automatiquement si elles n'existent pas dans la table",
    guideMaxSize: "Taille maximale : 50 MB",
    footerCreated: "Créé par",
    msgOutsideGrist: "⚠️ Ce widget doit être utilisé à l'intérieur de Grist.<br>Ajoutez-le comme widget personnalisé avec l'URL :<br><code>https://grist-import-widget.vercel.app/index.html</code>",
    msgInitError: "Erreur lors de l'initialisation du widget: ",
    msgNoTables: "⚠️ Aucune table trouvée dans ce document",
    msgNoTableOption: "Aucune table disponible",
    msgLoadError: "Erreur de chargement",
    msgLoadTablesError: "❌ Impossible de charger les tables: ",
    msgTablesRefreshed: "✅ Liste des tables actualisée",
    msgSelectTableToDelete: "❌ Veuillez sélectionner une table à supprimer",
    msgDeletingTable: "⏳ Suppression de la table en cours...",
    msgTableDeleted: '✅ Table "{name}" supprimée avec succès',
    msgDeleteError: "❌ Erreur lors de la suppression : ",
    msgFileTooLarge: "Le fichier est trop volumineux ({size} MB, max 50 MB)",
    msgUnsupportedFormat: "Format de fichier non supporté",
    msgExcelError: "Erreur lors de la lecture du fichier Excel: ",
    msgCsvError: "Erreur lors de la lecture du fichier CSV: ",
    msgJsonNotArray: "Le fichier JSON doit contenir un tableau d'objets",
    msgJsonError: "Erreur lors de la lecture du fichier JSON: ",
    msgFileEmpty: "Le fichier est vide",
    msgEnterTableName: "❌ Veuillez entrer un nom pour la nouvelle table",
    msgSelectValidTable: "❌ Veuillez sélectionner une table de destination valide",
    msgNoData: "❌ Aucune donnée à importer",
    msgNoValidData: "⚠️ Aucune donnée valide à importer (vérifiez que le fichier contient des données)",
    msgPreparingData: "Préparation des données...",
    msgCreatingTable: "Création de la table...",
    msgTableCreated: '✅ Table "{name}" créée',
    msgVerifyingTable: "Vérification de la table...",
    msgTableNotFound: 'La table "{name}" n\'existe pas ou n\'est pas accessible',
    msgDeletingData: "Suppression des données existantes...",
    msgCheckingColumns: "Vérification des colonnes...",
    msgCreatingColumns: "Création des colonnes manquantes...",
    msgImportingData: "Import des données...",
    msgImportProgress: "Import en cours... {current}/{total} lignes",
    msgImportDone: "Import terminé !",
    msgImportSuccess: '✅ {count} ligne(s) importée(s) avec succès dans la table "{name}"',
    msgImportError: "❌ Erreur lors de l'import : ",
    previewLines: "{total} ligne(s) • Aperçu des {count} premières",
    tablesCountText: "{count} table(s) disponible(s)"
  },
  en: {
    title: "📥 Data Import",
    subtitle: "Import your data from Excel (.xlsx, .xls), CSV or JSON",
    dropTitle: "Drag and drop your file here",
    dropSubtitle: "or click to browse",
    dropFormats: "Accepted formats: .xlsx, .xls, .csv, .json (max 50 MB)",
    clearBtn: "✕ Remove",
    sheetLabel: "📄 Select the sheet to import:",
    csvOptionsTitle: "⚙️ CSV Options:",
    csvDelimiterLabel: "Delimiter",
    csvTabOption: "Tab",
    csvEncodingLabel: "Encoding",
    previewTitle: "👁️ Data Preview",
    importConfigTitle: "⚙️ Import Configuration",
    targetTableLabel: "📊 Destination table:",
    loading: "Loading...",
    refreshTitle: "Refresh table list",
    deleteTableTitle: "Delete selected table",
    tablesAvailable: "ℹ️ Available tables:",
    newTableLabel: "📝 New table name:",
    newTablePlaceholder: "Ex: MyImports",
    newTableHint: "The table will be created with the columns from the imported file",
    createNewTable: "Create a new table",
    firstRowHeader: "First row contains headers",
    clearTable: "Clear existing data before import",
    importBtn: "🚀 Import Data",
    deleteConfirmPrefix: '⚠️ Are you sure you want to delete the table "',
    confirmDeleteBtn: "Yes, delete",
    cancelBtn: "Cancel",
    progressTitle: "⏳ Importing...",
    guideTitle: "💡 User Guide",
    guideExcel: "<strong>Excel (.xlsx, .xls)</strong>: Select the sheet to import if the file contains multiple sheets",
    guideCsv: "<strong>CSV</strong>: Adjust the delimiter and encoding if necessary",
    guideJson: "<strong>JSON</strong>: The file must contain an array of objects",
    guideColumns: "Columns will be created automatically if they do not exist in the table",
    guideMaxSize: "Maximum size: 50 MB",
    footerCreated: "Created by",
    msgOutsideGrist: "⚠️ This widget must be used inside Grist.<br>Add it as a custom widget with the URL:<br><code>https://grist-import-widget.vercel.app/index.html</code>",
    msgInitError: "Error initializing widget: ",
    msgNoTables: "⚠️ No tables found in this document",
    msgNoTableOption: "No tables available",
    msgLoadError: "Loading error",
    msgLoadTablesError: "❌ Unable to load tables: ",
    msgTablesRefreshed: "✅ Table list refreshed",
    msgSelectTableToDelete: "❌ Please select a table to delete",
    msgDeletingTable: "⏳ Deleting table...",
    msgTableDeleted: '✅ Table "{name}" deleted successfully',
    msgDeleteError: "❌ Error deleting table: ",
    msgFileTooLarge: "File is too large ({size} MB, max 50 MB)",
    msgUnsupportedFormat: "Unsupported file format",
    msgExcelError: "Error reading Excel file: ",
    msgCsvError: "Error reading CSV file: ",
    msgJsonNotArray: "The JSON file must contain an array of objects",
    msgJsonError: "Error reading JSON file: ",
    msgFileEmpty: "The file is empty",
    msgEnterTableName: "❌ Please enter a name for the new table",
    msgSelectValidTable: "❌ Please select a valid destination table",
    msgNoData: "❌ No data to import",
    msgNoValidData: "⚠️ No valid data to import (check that the file contains data)",
    msgPreparingData: "Preparing data...",
    msgCreatingTable: "Creating table...",
    msgTableCreated: '✅ Table "{name}" created',
    msgVerifyingTable: "Verifying table...",
    msgTableNotFound: 'Table "{name}" does not exist or is not accessible',
    msgDeletingData: "Deleting existing data...",
    msgCheckingColumns: "Checking columns...",
    msgCreatingColumns: "Creating missing columns...",
    msgImportingData: "Importing data...",
    msgImportProgress: "Importing... {current}/{total} rows",
    msgImportDone: "Import complete!",
    msgImportSuccess: '✅ {count} row(s) imported successfully into table "{name}"',
    msgImportError: "❌ Import error: ",
    previewLines: "{total} row(s) • Preview of first {count}",
    tablesCountText: "{count} table(s) available"
  }
};

function t(key, params) {
  var text = (i18n[currentLang] && i18n[currentLang][key]) || (i18n.fr[key]) || key;
  if (params) {
    Object.keys(params).forEach(function(k) {
      text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), String(params[k]));
    });
  }
  return text;
}

function setLanguage(lang) {
  currentLang = lang;
  document.getElementById('lang-fr').classList.toggle('active', lang === 'fr');
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.documentElement.lang = lang;
  applyTranslations();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var text = t(key);
    if (text.indexOf('<') !== -1) {
      el.innerHTML = text;
    } else {
      el.textContent = text;
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
}

// =============================================================================
// SECURITY: Sanitization utilities
// =============================================================================

function sanitizeForDisplay(str) {
  if (str === null || str === undefined) return '';
  var div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function sanitizeCellValue(val) {
  if (val === null || val === undefined) return null;
  var str = String(val);
  // Block Grist formula injection: values starting with = could be interpreted as formulas
  if (str.length > 0 && str.charAt(0) === '=') {
    str = "'" + str;
  }
  // Limit cell value length to prevent abuse (100KB per cell)
  if (str.length > 102400) {
    str = str.substring(0, 102400);
  }
  return str;
}

function sanitizeIdentifier(str) {
  var cleaned = String(str).trim();
  cleaned = removeAccents(cleaned);
  cleaned = cleaned.replace(/[^a-zA-Z0-9_]/gi, '_');
  cleaned = cleaned.replace(/_+/g, '_');
  cleaned = cleaned.replace(/^_|_$/g, '');
  if (/^[0-9]/.test(cleaned)) {
    cleaned = '_' + cleaned;
  }
  if (cleaned.length > 64) {
    cleaned = cleaned.substring(0, 64);
  }
  return cleaned || 'Column';
}

// =============================================================================
// UTILITIES
// =============================================================================

function removeAccents(str) {
  var accentsMap = {
    'à': 'a', 'â': 'a', 'ä': 'a', 'á': 'a', 'ã': 'a',
    'è': 'e', 'ê': 'e', 'ë': 'e', 'é': 'e',
    'ì': 'i', 'î': 'i', 'ï': 'i', 'í': 'i',
    'ò': 'o', 'ô': 'o', 'ö': 'o', 'ó': 'o', 'õ': 'o',
    'ù': 'u', 'û': 'u', 'ü': 'u', 'ú': 'u',
    'ç': 'c', 'ñ': 'n',
    'À': 'A', 'Â': 'A', 'Ä': 'A', 'Á': 'A', 'Ã': 'A',
    'È': 'E', 'Ê': 'E', 'Ë': 'E', 'É': 'E',
    'Ì': 'I', 'Î': 'I', 'Ï': 'I', 'Í': 'I',
    'Ò': 'O', 'Ô': 'O', 'Ö': 'O', 'Ó': 'O', 'Õ': 'O',
    'Ù': 'U', 'Û': 'U', 'Ü': 'U', 'Ú': 'U',
    'Ç': 'C', 'Ñ': 'N'
  };
  return str.split('').map(function(c) { return accentsMap[c] || c; }).join('');
}

// =============================================================================
// GLOBAL STATE
// =============================================================================

var currentFile = null;
var parsedData = null;
var fileType = null;
var workbook = null;
var currentSheet = null;
var availableTables = [];

// =============================================================================
// DOM ELEMENTS
// =============================================================================

var dropZone = document.getElementById('drop-zone');
var fileInput = document.getElementById('file-input');
var fileInfo = document.getElementById('file-info');
var fileName = document.getElementById('file-name');
var fileDetails = document.getElementById('file-details');
var clearBtn = document.getElementById('clear-btn');
var sheetSelector = document.getElementById('sheet-selector');
var sheetSelect = document.getElementById('sheet-select');
var csvOptions = document.getElementById('csv-options');
var csvDelimiter = document.getElementById('csv-delimiter');
var csvEncoding = document.getElementById('csv-encoding');
var previewSection = document.getElementById('preview-section');
var previewInfo = document.getElementById('preview-info');
var previewTable = document.getElementById('preview-table');
var importConfig = document.getElementById('import-config');
var targetTable = document.getElementById('target-table');
var refreshBtn = document.getElementById('refresh-btn');
var currentTableInfo = document.getElementById('current-table-info');
var tablesCount = document.getElementById('tables-count');
var firstRowHeader = document.getElementById('first-row-header');
var clearTableCheckbox = document.getElementById('clear-table');
var createNewTableCheckbox = document.getElementById('create-new-table');
var newTableSection = document.getElementById('new-table-section');
var newTableName = document.getElementById('new-table-name');
var importButton = document.getElementById('import-button');
var deleteTableBtn = document.getElementById('delete-table-btn');
var deleteConfirm = document.getElementById('delete-confirm');
var deleteTableName = document.getElementById('delete-table-name');
var confirmDeleteBtn = document.getElementById('confirm-delete-btn');
var cancelDeleteBtn = document.getElementById('cancel-delete-btn');
var progressSection = document.getElementById('progress-section');
var progressBar = document.getElementById('progress-bar');
var progressText = document.getElementById('progress-text');
var messageSection = document.getElementById('message-section');

// =============================================================================
// INITIALIZATION
// =============================================================================

function isInsideGrist() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

async function init() {
  console.log('Initialisation du widget...');
  applyTranslations();
  setupEventListeners();

  if (!isInsideGrist()) {
    showMessage(t('msgOutsideGrist'), 'warning');
    importButton.disabled = true;
    return;
  }

  try {
    await grist.ready({ requiredAccess: 'full' });
    console.log('Widget prêt avec accès complet');
    await loadTables();
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error);
    showMessage(t('msgInitError') + sanitizeForDisplay(error.message), 'error');
  }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  dropZone.addEventListener('click', function() { fileInput.click(); });

  fileInput.addEventListener('change', handleFileSelect);

  clearBtn.addEventListener('click', clearFile);
  refreshBtn.addEventListener('click', refreshTables);
  importButton.addEventListener('click', importData);

  sheetSelect.addEventListener('change', handleSheetChange);
  csvDelimiter.addEventListener('change', handleDelimiterChange);
  csvEncoding.addEventListener('change', handleEncodingChange);
  firstRowHeader.addEventListener('change', handleHeaderChange);

  createNewTableCheckbox.addEventListener('change', handleCreateNewTableChange);

  deleteTableBtn.addEventListener('click', showDeleteConfirm);
  confirmDeleteBtn.addEventListener('click', deleteSelectedTable);
  cancelDeleteBtn.addEventListener('click', hideDeleteConfirm);
}

// =============================================================================
// TABLE MANAGEMENT
// =============================================================================

function handleCreateNewTableChange() {
  var isChecked = createNewTableCheckbox.checked;
  newTableSection.style.display = isChecked ? 'block' : 'none';
  targetTable.disabled = isChecked;
  clearTableCheckbox.disabled = isChecked;

  if (isChecked && currentFile) {
    var suggestedName = currentFile.name.replace(/\.[^/.]+$/, '');
    suggestedName = sanitizeIdentifier(suggestedName);
    newTableName.value = suggestedName;
  }
}

function showDeleteConfirm() {
  var selected = targetTable.value;
  if (!selected || selected === t('msgNoTableOption') || selected === t('msgLoadError')) {
    showMessage(t('msgSelectTableToDelete'), 'error');
    return;
  }
  deleteTableName.textContent = selected;
  deleteConfirm.style.display = 'block';
}

function hideDeleteConfirm() {
  deleteConfirm.style.display = 'none';
}

async function deleteSelectedTable() {
  var selected = targetTable.value;
  hideDeleteConfirm();

  try {
    showMessage(t('msgDeletingTable'), 'warning');
    await grist.docApi.applyUserActions([['RemoveTable', selected]]);
    showMessage(t('msgTableDeleted', { name: sanitizeForDisplay(selected) }), 'success');
    await loadTables();
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    showMessage(t('msgDeleteError') + sanitizeForDisplay(error.message), 'error');
  }
}

async function loadTables() {
  try {
    console.log('Chargement des tables...');
    var tables = await grist.docApi.listTables();
    console.log('Tables trouvées:', tables);

    targetTable.innerHTML = '';

    if (!tables || tables.length === 0) {
      targetTable.innerHTML = '<option value="">' + sanitizeForDisplay(t('msgNoTableOption')) + '</option>';
      showMessage(t('msgNoTables'), 'warning');
      return;
    }

    availableTables = tables;

    tables.forEach(function(tableId) {
      var option = document.createElement('option');
      option.value = tableId;
      option.textContent = tableId;
      targetTable.appendChild(option);
    });

    tablesCount.textContent = t('tablesCountText', { count: tables.length });
    currentTableInfo.classList.remove('hidden');
    console.log('Tables chargées avec succès');
  } catch (error) {
    console.error('Erreur lors du chargement des tables:', error);
    targetTable.innerHTML = '<option value="">' + sanitizeForDisplay(t('msgLoadError')) + '</option>';
    showMessage(t('msgLoadTablesError') + sanitizeForDisplay(error.message), 'error');
  }
}

async function refreshTables() {
  refreshBtn.disabled = true;
  refreshBtn.textContent = '⏳';

  await loadTables();
  showMessage(t('msgTablesRefreshed'), 'success');

  setTimeout(function() {
    refreshBtn.disabled = false;
    refreshBtn.textContent = '🔄';
    hideMessage();
  }, 1500);
}

// =============================================================================
// DRAG & DROP / FILE SELECTION
// =============================================================================

function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  dropZone.classList.add('dragover');
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  dropZone.classList.remove('dragover');
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  dropZone.classList.remove('dragover');
  if (event.dataTransfer.files.length > 0) {
    processFile(event.dataTransfer.files[0]);
  }
}

function handleFileSelect(event) {
  if (event.target.files.length > 0) {
    processFile(event.target.files[0]);
  }
}

// =============================================================================
// FILE PROCESSING
// =============================================================================

function processFile(file) {
  console.log('Traitement du fichier:', file.name, 'Taille:', file.size, 'bytes');

  var maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    var sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    showMessage(t('msgFileTooLarge', { size: sizeMB }), 'error');
    return;
  }

  var fileNameLower = file.name.toLowerCase();
  if (!fileNameLower.endsWith('.xlsx') && !fileNameLower.endsWith('.xls') &&
      !fileNameLower.endsWith('.csv') && !fileNameLower.endsWith('.json')) {
    showMessage(t('msgUnsupportedFormat'), 'error');
    return;
  }

  currentFile = file;

  if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
    fileType = 'excel';
    parseExcel(file);
  } else if (fileNameLower.endsWith('.csv')) {
    fileType = 'csv';
    parseCSV(file);
  } else if (fileNameLower.endsWith('.json')) {
    fileType = 'json';
    parseJSON(file);
  }

  fileName.textContent = file.name;
  fileDetails.textContent = (file.size / 1024).toFixed(2) + ' KB • ' + fileType.toUpperCase();
  fileInfo.classList.remove('hidden');
  importConfig.classList.remove('hidden');
  hideMessage();
}

// =============================================================================
// PARSERS
// =============================================================================

function parseExcel(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = new Uint8Array(e.target.result);
      workbook = XLSX.read(data, { type: 'array', codepage: 65001 });

      if (workbook.SheetNames.length > 1) {
        sheetSelect.innerHTML = '';
        workbook.SheetNames.forEach(function(name) {
          var option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          sheetSelect.appendChild(option);
        });
        sheetSelector.classList.remove('hidden');
        currentSheet = workbook.SheetNames[0];
      } else {
        currentSheet = workbook.SheetNames[0];
        sheetSelector.classList.add('hidden');
      }

      csvOptions.classList.add('hidden');
      parseExcelSheet();
    } catch (error) {
      console.error('Erreur lors du parsing Excel:', error);
      showMessage(t('msgExcelError') + sanitizeForDisplay(error.message), 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseExcelSheet() {
  var worksheet = workbook.Sheets[currentSheet];
  parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
  if (parsedData.length > 0) {
    console.log('En-têtes bruts du fichier:', parsedData[0]);
  }
  showPreview();
}

function handleSheetChange() {
  currentSheet = sheetSelect.value;
  parseExcelSheet();
}

function parseCSV(file) {
  csvOptions.classList.remove('hidden');
  sheetSelector.classList.add('hidden');

  var delimiter = getCSVDelimiter();
  var encoding = csvEncoding.value;

  Papa.parse(file, {
    delimiter: delimiter,
    encoding: encoding,
    complete: function(results) {
      parsedData = results.data;
      showPreview();
    },
    error: function(error) {
      console.error('Erreur lors du parsing CSV:', error);
      showMessage(t('msgCsvError') + sanitizeForDisplay(error.message), 'error');
    }
  });
}

function getCSVDelimiter() {
  var value = csvDelimiter.value;
  return value === 'tab' ? '\t' : value;
}

function handleDelimiterChange() {
  if (fileType === 'csv' && currentFile) parseCSV(currentFile);
}

function handleEncodingChange() {
  if (fileType === 'csv' && currentFile) parseCSV(currentFile);
}

function parseJSON(file) {
  csvOptions.classList.add('hidden');
  sheetSelector.classList.add('hidden');

  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var json = JSON.parse(e.target.result);

      if (!Array.isArray(json)) {
        showMessage(t('msgJsonNotArray'), 'error');
        return;
      }

      if (json.length > 0) {
        var keys = Object.keys(json[0]);
        parsedData = [keys];
        json.forEach(function(obj) {
          var row = keys.map(function(key) { return obj[key] !== undefined ? obj[key] : ''; });
          parsedData.push(row);
        });
      } else {
        parsedData = [];
      }

      showPreview();
    } catch (error) {
      console.error('Erreur lors du parsing JSON:', error);
      showMessage(t('msgJsonError') + sanitizeForDisplay(error.message), 'error');
    }
  };
  reader.readAsText(file);
}

// =============================================================================
// PREVIEW (uses textContent for XSS safety)
// =============================================================================

function showPreview() {
  if (!parsedData || parsedData.length === 0) {
    showMessage(t('msgFileEmpty'), 'warning');
    return;
  }

  var previewRows = Math.min(10, parsedData.length);
  previewTable.innerHTML = '';

  previewInfo.textContent = t('previewLines', { total: parsedData.length, count: previewRows });

  for (var i = 0; i < previewRows; i++) {
    var row = document.createElement('tr');
    var cells = parsedData[i];

    for (var j = 0; j < cells.length; j++) {
      var cell = document.createElement(i === 0 ? 'th' : 'td');
      // textContent is safe against XSS
      cell.textContent = cells[j] !== null && cells[j] !== undefined ? cells[j] : '';
      row.appendChild(cell);
    }
    previewTable.appendChild(row);
  }

  previewSection.classList.remove('hidden');
}

function handleHeaderChange() {}

// =============================================================================
// DATA IMPORT (with security sanitization)
// =============================================================================

async function importData() {
  var isCreatingNewTable = createNewTableCheckbox.checked;
  var selectedTable;

  if (isCreatingNewTable) {
    selectedTable = newTableName.value.trim();
    if (!selectedTable) {
      showMessage(t('msgEnterTableName'), 'error');
      return;
    }
    selectedTable = sanitizeIdentifier(selectedTable);
  } else {
    selectedTable = targetTable.value;
    if (!selectedTable || selectedTable === '' ||
        selectedTable === t('msgNoTableOption') || selectedTable === t('msgLoadError')) {
      showMessage(t('msgSelectValidTable'), 'error');
      return;
    }
  }

  if (!parsedData || parsedData.length === 0) {
    showMessage(t('msgNoData'), 'warning');
    return;
  }

  var hasHeader = firstRowHeader.checked;
  var shouldClearTable = !isCreatingNewTable && clearTableCheckbox.checked;

  importButton.disabled = true;
  progressSection.classList.remove('hidden');

  try {
    updateProgress(10, t('msgPreparingData'));
    var headers = [];
    var dataRows = [];

    if (hasHeader && parsedData.length > 1) {
      headers = parsedData[0].map(function(h) {
        return sanitizeIdentifier(h);
      });
      dataRows = parsedData.slice(1);
    } else {
      var colCount = parsedData[0] ? parsedData[0].length : 0;
      headers = Array.from({ length: colCount }, function(_, i) { return 'Column_' + (i + 1); });
      dataRows = parsedData;
    }

    // Deduplicate headers
    var uniqueHeaders = [];
    var headerCount = {};
    headers.forEach(function(h) {
      if (headerCount[h]) {
        headerCount[h]++;
        uniqueHeaders.push(h + '_' + headerCount[h]);
      } else {
        headerCount[h] = 1;
        uniqueHeaders.push(h);
      }
    });
    headers = uniqueHeaders;

    console.log('dataRows avant filtre:', dataRows.length, 'lignes');

    // Filter empty rows
    dataRows = dataRows.filter(function(row) {
      if (!row || !Array.isArray(row)) return false;
      return row.some(function(cell) {
        if (cell === null || cell === undefined) return false;
        return String(cell).trim() !== '';
      });
    });

    console.log('dataRows après filtre:', dataRows.length, 'lignes');

    if (dataRows.length === 0) {
      showMessage(t('msgNoValidData'), 'warning');
      importButton.disabled = false;
      return;
    }

    console.log('En-têtes:', headers);
    console.log('Nombre de lignes à importer:', dataRows.length);

    // Create new table if requested
    if (isCreatingNewTable) {
      updateProgress(20, t('msgCreatingTable'));
      console.log('Création de la table:', selectedTable, 'avec colonnes:', headers);

      var columns = headers.map(function(colName) {
        return { id: colName, fields: { type: 'Text' } };
      });

      await grist.docApi.applyUserActions([
        ['AddTable', selectedTable, columns]
      ]);

      console.log('Table créée avec succès');
      showMessage(t('msgTableCreated', { name: sanitizeForDisplay(selectedTable) }), 'success');
      await loadTables();
    } else {
      updateProgress(20, t('msgVerifyingTable'));
      console.log('Vérification de la table:', selectedTable);

      try {
        await grist.docApi.fetchTable(selectedTable);
      } catch (err) {
        throw new Error(t('msgTableNotFound', { name: selectedTable }));
      }

      if (shouldClearTable) {
        updateProgress(25, t('msgDeletingData'));
        var existingData = await grist.docApi.fetchTable(selectedTable);
        if (existingData.id && existingData.id.length > 0) {
          await grist.docApi.applyUserActions([
            ['BulkRemoveRecord', selectedTable, existingData.id]
          ]);
        }
      }

      updateProgress(30, t('msgCheckingColumns'));
      var tableData = await grist.docApi.fetchTable(selectedTable);
      var existingColumns = Object.keys(tableData).filter(function(col) {
        return col !== 'id' && col !== 'manualSort';
      });
      console.log('Colonnes existantes:', existingColumns);

      updateProgress(40, t('msgCreatingColumns'));
      var columnsToCreate = headers.filter(function(h) {
        return !existingColumns.includes(h);
      });
      console.log('Colonnes à créer:', columnsToCreate);

      if (columnsToCreate.length > 0) {
        var addColumnActions = columnsToCreate.map(function(colName) {
          return ['AddColumn', selectedTable, colName, { type: 'Text' }];
        });
        await grist.docApi.applyUserActions(addColumnActions);
        console.log('Colonnes créées avec succès');
      }
    }

    updateProgress(50, t('msgImportingData'));

    var batchSize = 1000;
    var totalBatches = Math.ceil(dataRows.length / batchSize);

    for (var i = 0; i < totalBatches; i++) {
      var start = i * batchSize;
      var end = Math.min(start + batchSize, dataRows.length);
      var batch = dataRows.slice(start, end);

      var colData = {};
      headers.forEach(function(header, colIndex) {
        colData[header] = batch.map(function(row) {
          var val = row[colIndex];
          if (val === undefined || val === null) return null;
          // Sanitize each cell value for security
          return sanitizeCellValue(val);
        });
      });

      console.log('Import batch ' + (i + 1) + '/' + totalBatches + ': ' + batch.length + ' lignes');

      await grist.docApi.applyUserActions([
        ['BulkAddRecord', selectedTable, Array(batch.length).fill(null), colData]
      ]);

      var progress = 50 + Math.floor((i + 1) / totalBatches * 50);
      updateProgress(progress, t('msgImportProgress', { current: end, total: dataRows.length }));
    }

    updateProgress(100, t('msgImportDone'));
    showMessage(t('msgImportSuccess', { count: dataRows.length, name: sanitizeForDisplay(selectedTable) }), 'success');

    setTimeout(function() {
      clearFile();
    }, 2000);

  } catch (error) {
    console.error("Erreur lors de l'import:", error);
    showMessage(t('msgImportError') + sanitizeForDisplay(error.message), 'error');
  } finally {
    importButton.disabled = false;

    setTimeout(function() {
      progressSection.classList.add('hidden');
    }, 3000);
  }
}

// =============================================================================
// UI HELPERS
// =============================================================================

function updateProgress(percent, text) {
  progressBar.style.width = percent + '%';
  progressText.textContent = percent + '% - ' + text;
}

function clearFile() {
  currentFile = null;
  parsedData = null;
  fileType = null;
  workbook = null;
  currentSheet = null;

  fileInput.value = '';
  fileInfo.classList.add('hidden');
  importConfig.classList.add('hidden');
  previewSection.classList.add('hidden');
  progressSection.classList.add('hidden');
  sheetSelector.classList.add('hidden');
  csvOptions.classList.add('hidden');
  hideMessage();
}

function showMessage(text, type) {
  var colors = {
    success: 'message-success',
    error: 'message-error',
    warning: 'message-warning'
  };
  var colorClass = colors[type] || colors.warning;
  messageSection.innerHTML = '<div class="message ' + colorClass + '">' + text + '</div>';
  messageSection.classList.remove('hidden');
}

function hideMessage() {
  messageSection.classList.add('hidden');
}

// =============================================================================
// START
// =============================================================================

init();
