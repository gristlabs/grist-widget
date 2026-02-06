/**
 * Grist Cross-Table Explorer Widget
 * Join multiple tables by a common key, filter and cross-reference data,
 * then generate a result table in Grist.
 *
 * @author Said Hamadou
 * @license Apache-2.0
 * @copyright 2026 Said Hamadou
 */

// =============================================================================
// i18n
// =============================================================================

var currentLang = 'fr';

var i18n = {
  fr: {
    title: 'Cross-Table Explorer',
    notInGrist: 'Ce widget doit être utilisé dans Grist.',
    loading: 'Chargement...',
    step1Title: 'Sélectionner les tables',
    step1Desc: 'Cliquez sur les tables que vous souhaitez croiser (minimum 2).',
    step2Title: 'Mapper la clé commune',
    step2Desc: 'Sélectionnez la colonne clé (ID) dans chaque table pour la jointure.',
    step3Title: 'Choisir les colonnes',
    step3Desc: 'Sélectionnez les colonnes à afficher dans le résultat.',
    step4Title: 'Filtres',
    step4Desc: 'Ajoutez des filtres pour affiner les résultats (optionnel).',
    noTables: 'Aucune table trouvée dans le document.',
    joinTypeLabel: 'Type de jointure :',
    joinInnerDesc: '(correspondances uniquement)',
    joinLeftDesc: '(tout de la 1ère table)',
    joinInnerHelp: '= uniquement les lignes qui ont une correspondance dans toutes les tables.',
    joinLeftHelp: '= toutes les lignes de la 1ère table, même sans correspondance (colonnes vides si pas de match).',
    joinOrderHint: '⚠️ En mode LEFT, la 1ère table sélectionnée (en vert) est la table principale. Toutes ses lignes seront conservées.',
    selectAll: '✓ Tout sélectionner',
    deselectAll: '✗ Tout désélectionner',
    selectCol: '-- Colonne clé --',
    addFilter: 'Ajouter un filtre',
    filterCol: '-- Colonne --',
    filterOp: '-- Opérateur --',
    filterEquals: 'Égal à',
    filterNotEquals: 'Différent de',
    filterContains: 'Contient',
    filterNotContains: 'Ne contient pas',
    filterGreater: 'Supérieur à',
    filterLess: 'Inférieur à',
    filterEmpty: 'Est vide',
    filterNotEmpty: "N'est pas vide",
    filterValue: 'Valeur...',
    executeJoin: 'Croiser les données',
    resultsTitle: 'Résultats',
    resultsCount: '{count} lignes trouvées',
    resultsEmpty: 'Aucun résultat pour cette jointure.',
    generateTitle: 'Générer une table dans Grist',
    generateDesc: 'Créez une nouvelle table dans votre document avec les données croisées.',
    tableNameLabel: 'Nom de la table :',
    generateBtn: 'Créer la table',
    refreshBtn: 'Rafraîchir',
    generating: 'Création de la table en cours...',
    generated: 'Table "{name}" créée avec {count} lignes ! Colonne "Derniere_MAJ" ajoutée.',
    refreshing: 'Rafraîchissement en cours...',
    refreshed: 'Table "{name}" mise à jour avec {count} lignes.',
    generateError: 'Erreur lors de la création : ',
    tableExists: 'La table "{name}" existe déjà. Voulez-vous la remplacer ?',
    tableExistsTitle: 'Table existante',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    replace: 'Remplacer',
    minTwoTables: 'Sélectionnez au moins 2 tables.',
    selectAllKeys: 'Sélectionnez une colonne clé pour chaque table.',
    selectOneCols: 'Sélectionnez au moins une colonne à afficher.',
    executing: 'Croisement en cours...',
    newQuery: 'Nouvelle requête',
    deduplicateLabel: '🧹 Supprimer les doublons',
    deduplicatedInfo: '{removed} doublons supprimés',
    footerCreated: 'Créé par',
    sortAsc: '↑',
    sortDesc: '↓',
    sortNone: '↕',
    exportCsv: 'Exporter CSV',
    tableNamePlaceholder: 'Resultat_Croise'
  },
  en: {
    title: 'Cross-Table Explorer',
    notInGrist: 'This widget must be used inside Grist.',
    loading: 'Loading...',
    step1Title: 'Select tables',
    step1Desc: 'Click on the tables you want to cross-reference (minimum 2).',
    step2Title: 'Map common key',
    step2Desc: 'Select the key column (ID) in each table for the join.',
    step3Title: 'Choose columns',
    step3Desc: 'Select the columns to display in the result.',
    step4Title: 'Filters',
    step4Desc: 'Add filters to refine results (optional).',
    noTables: 'No tables found in the document.',
    joinTypeLabel: 'Join type:',
    joinInnerDesc: '(matches only)',
    joinLeftDesc: '(all from 1st table)',
    joinInnerHelp: '= only rows that have a match in all tables.',
    joinLeftHelp: '= all rows from the 1st table, even without a match (empty columns if no match).',
    joinOrderHint: '⚠️ In LEFT mode, the 1st selected table (in green) is the main table. All its rows will be kept.',
    selectAll: '✓ Select all',
    deselectAll: '✗ Deselect all',
    selectCol: '-- Key column --',
    addFilter: 'Add a filter',
    filterCol: '-- Column --',
    filterOp: '-- Operator --',
    filterEquals: 'Equals',
    filterNotEquals: 'Not equal to',
    filterContains: 'Contains',
    filterNotContains: 'Does not contain',
    filterGreater: 'Greater than',
    filterLess: 'Less than',
    filterEmpty: 'Is empty',
    filterNotEmpty: 'Is not empty',
    filterValue: 'Value...',
    executeJoin: 'Cross-reference data',
    resultsTitle: 'Results',
    resultsCount: '{count} rows found',
    resultsEmpty: 'No results for this join.',
    generateTitle: 'Generate a table in Grist',
    generateDesc: 'Create a new table in your document with the cross-referenced data.',
    tableNameLabel: 'Table name:',
    generateBtn: 'Create table',
    refreshBtn: 'Refresh',
    generating: 'Creating table...',
    generated: 'Table "{name}" created with {count} rows! Column "Derniere_MAJ" added.',
    refreshing: 'Refreshing...',
    refreshed: 'Table "{name}" updated with {count} rows.',
    generateError: 'Error creating table: ',
    tableExists: 'Table "{name}" already exists. Do you want to replace it?',
    tableExistsTitle: 'Table already exists',
    cancel: 'Cancel',
    confirm: 'Confirm',
    replace: 'Replace',
    minTwoTables: 'Select at least 2 tables.',
    selectAllKeys: 'Select a key column for each table.',
    selectOneCols: 'Select at least one column to display.',
    executing: 'Joining data...',
    newQuery: 'New query',
    deduplicateLabel: '🧹 Remove duplicates',
    deduplicatedInfo: '{removed} duplicates removed',
    footerCreated: 'Created by',
    sortAsc: '↑',
    sortDesc: '↓',
    sortNone: '↕',
    exportCsv: 'Export CSV',
    tableNamePlaceholder: 'Cross_Result'
  }
};

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.fr[key]) || key;
}

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.textContent.trim() === lang.toUpperCase());
  });
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  var nameInput = document.getElementById('generate-table-name');
  if (nameInput) nameInput.placeholder = t('tableNamePlaceholder');
}

// =============================================================================
// UTILS
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

function sanitize(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function isInsideGrist() {
  try { return window.self !== window.top; } catch (e) { return true; }
}

// =============================================================================
// TOAST & MODAL
// =============================================================================

function showToast(message, type) {
  var container = document.getElementById('toast-container');
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'info');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3500);
}

var modalResolve = null;
function showModal(title, body) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-overlay').classList.remove('hidden');
  return new Promise(function(resolve) {
    modalResolve = resolve;
  });
}
function closeModal(result) {
  document.getElementById('modal-overlay').classList.add('hidden');
  if (modalResolve) { modalResolve(result || false); modalResolve = null; }
}
document.getElementById('modal-confirm').addEventListener('click', function() { closeModal(true); });
document.getElementById('modal-cancel').addEventListener('click', function() { closeModal(false); });

// =============================================================================
// STATE
// =============================================================================

var allTables = [];          // list of table names
var selectedTables = [];     // tables selected by user
var tableColumns = {};       // { tableName: [colId, ...] }
var tableData = {};          // { tableName: { col: [...], ... } }
var keyMappings = {};        // { tableName: colId }
var selectedColumns = [];    // [{ table: 'T', col: 'C' }, ...]
var filters = [];            // [{ col: 'T.C', op: 'eq', value: 'x' }]
var joinType = 'inner';
var joinedData = [];         // result rows
var joinedColumns = [];      // result column headers
var sortCol = null;
var sortDir = 'asc';
var generatedTableName = null;

// =============================================================================
// DOM REFS
// =============================================================================

var tableChips = document.getElementById('table-chips');
var tablesLoading = document.getElementById('tables-loading');
var tablesEmpty = document.getElementById('tables-empty');
var stepKeys = document.getElementById('step-keys');
var keyMappingsDiv = document.getElementById('key-mappings');
var stepColumns = document.getElementById('step-columns');
var colPicker = document.getElementById('col-picker');
var stepFilters = document.getElementById('step-filters');
var filtersContainer = document.getElementById('filters-container');
var stepExecute = document.getElementById('step-execute');
var stepResults = document.getElementById('step-results');
var resultsInfo = document.getElementById('results-info');
var resultsContainer = document.getElementById('results-container');
var generateSection = document.getElementById('generate-section');
var generateTableName = document.getElementById('generate-table-name');
var generateBtn = document.getElementById('generate-btn');
var refreshBtn = document.getElementById('refresh-btn');
var generateMessage = document.getElementById('generate-message');

// =============================================================================
// INIT
// =============================================================================

if (!isInsideGrist()) {
  document.getElementById('not-in-grist').classList.remove('hidden');
  document.getElementById('main-content').classList.add('hidden');
} else {
  (async function init() {
    try {
      await grist.ready({ requiredAccess: 'full' });
      console.log('Cross-Table widget ready with full access');
      await loadTables();
    } catch (error) {
      console.error('Init error:', error);
      tablesEmpty.classList.remove('hidden');
    }
  })();
}

async function loadTables() {
  tablesLoading.classList.remove('hidden');
  try {
    var tables = await grist.docApi.listTables();
    allTables = tables.filter(function(t) {
      return !t.startsWith('_grist_') && !t.startsWith('GristHidden_');
    });
    renderTableChips();
  } catch (error) {
    console.error('Error loading tables:', error);
    tablesEmpty.classList.remove('hidden');
  } finally {
    tablesLoading.classList.add('hidden');
  }
}

// =============================================================================
// STEP 1: TABLE SELECTION
// =============================================================================

function renderTableChips() {
  if (allTables.length === 0) {
    tablesEmpty.classList.remove('hidden');
    return;
  }
  var html = '';
  for (var i = 0; i < allTables.length; i++) {
    var tbl = allTables[i];
    var isSelected = selectedTables.indexOf(tbl) !== -1;
    var isPrimary = selectedTables[0] === tbl;
    html += '<div class="table-chip' + (isSelected ? ' selected' : '') + (isPrimary ? ' primary' : '') + '" data-table="' + sanitize(tbl) + '" onclick="toggleTable(\'' + sanitize(tbl) + '\')">';
    if (isPrimary) html += '<span style="font-size:10px; background:#065f46; color:white; padding:1px 5px; border-radius:4px; margin-right:4px;">①</span>';
    html += '📊 ' + sanitize(tbl);
    html += '<span class="remove" onclick="event.stopPropagation(); removeTable(\'' + sanitize(tbl) + '\')">✕</span>';
    html += '</div>';
  }
  tableChips.innerHTML = html;
}

function toggleTable(name) {
  var idx = selectedTables.indexOf(name);
  if (idx === -1) {
    selectedTables.push(name);
    loadTableColumns(name);
  } else {
    selectedTables.splice(idx, 1);
    delete tableColumns[name];
    delete tableData[name];
    delete keyMappings[name];
  }
  renderTableChips();
  updateSteps();
}

function removeTable(name) {
  var idx = selectedTables.indexOf(name);
  if (idx !== -1) {
    selectedTables.splice(idx, 1);
    delete tableColumns[name];
    delete tableData[name];
    delete keyMappings[name];
  }
  renderTableChips();
  updateSteps();
}

async function loadTableColumns(tableName) {
  try {
    var data = await grist.docApi.fetchTable(tableName);
    tableData[tableName] = data;
    var cols = Object.keys(data).filter(function(c) {
      return c !== 'id' && c !== 'manualSort' && !c.startsWith('gristHelper_');
    });
    tableColumns[tableName] = cols;
    updateSteps();
  } catch (error) {
    console.error('Error loading columns for', tableName, error);
  }
}

// =============================================================================
// STEP 2: KEY MAPPING
// =============================================================================

function renderKeyMappings() {
  var html = '';
  for (var i = 0; i < selectedTables.length; i++) {
    var tbl = selectedTables[i];
    var cols = tableColumns[tbl] || [];
    html += '<div class="key-mapping-row">';
    html += '<div class="key-mapping-label">📊 ' + sanitize(tbl) + '</div>';
    html += '<select class="key-mapping-select" data-table="' + sanitize(tbl) + '" onchange="updateKeyMapping(this)">';
    html += '<option value="">' + t('selectCol') + '</option>';
    for (var j = 0; j < cols.length; j++) {
      var sel = (keyMappings[tbl] === cols[j]) ? ' selected' : '';
      html += '<option value="' + sanitize(cols[j]) + '"' + sel + '>' + sanitize(cols[j]) + '</option>';
    }
    html += '</select>';
    html += '</div>';
  }
  keyMappingsDiv.innerHTML = '<div class="key-mapping">' + html + '</div>';
}

function updateKeyMapping(select) {
  var table = select.getAttribute('data-table');
  keyMappings[table] = select.value;
  updateSteps();
}

// =============================================================================
// STEP 3: COLUMN SELECTION
// =============================================================================

function renderColumnPicker() {
  var html = '';
  for (var i = 0; i < selectedTables.length; i++) {
    var tbl = selectedTables[i];
    var cols = tableColumns[tbl] || [];
    for (var j = 0; j < cols.length; j++) {
      var colId = tbl + '.' + cols[j];
      var isSelected = selectedColumns.some(function(sc) { return sc.table === tbl && sc.col === cols[j]; });
      html += '<div class="col-chip' + (isSelected ? ' selected' : '') + '" data-table="' + sanitize(tbl) + '" data-col="' + sanitize(cols[j]) + '" onclick="toggleColumn(\'' + sanitize(tbl) + '\', \'' + sanitize(cols[j]) + '\')">';
      html += sanitize(cols[j]);
      html += ' <span class="table-tag">' + sanitize(tbl) + '</span>';
      html += '</div>';
    }
  }
  colPicker.innerHTML = html;
}

function toggleColumn(table, col) {
  var idx = -1;
  for (var i = 0; i < selectedColumns.length; i++) {
    if (selectedColumns[i].table === table && selectedColumns[i].col === col) { idx = i; break; }
  }
  if (idx === -1) {
    selectedColumns.push({ table: table, col: col });
  } else {
    selectedColumns.splice(idx, 1);
  }
  renderColumnPicker();
  updateSteps();
}

function toggleAllColumns() {
  // If all are selected, deselect all. Otherwise select all.
  var totalCols = 0;
  for (var i = 0; i < selectedTables.length; i++) {
    totalCols += (tableColumns[selectedTables[i]] || []).length;
  }
  if (selectedColumns.length >= totalCols) {
    selectedColumns = [];
  } else {
    selectedColumns = [];
    for (var i = 0; i < selectedTables.length; i++) {
      var tbl = selectedTables[i];
      var cols = tableColumns[tbl] || [];
      for (var j = 0; j < cols.length; j++) {
        selectedColumns.push({ table: tbl, col: cols[j] });
      }
    }
  }
  renderColumnPicker();
  updateSelectAllBtn();
  updateSteps();
}

function updateSelectAllBtn() {
  var totalCols = 0;
  for (var i = 0; i < selectedTables.length; i++) {
    totalCols += (tableColumns[selectedTables[i]] || []).length;
  }
  var btn = document.getElementById('select-all-cols');
  if (selectedColumns.length >= totalCols) {
    btn.innerHTML = '<span data-i18n="deselectAll">' + t('deselectAll') + '</span>';
  } else {
    btn.innerHTML = '<span data-i18n="selectAll">' + t('selectAll') + '</span>';
  }
}

// =============================================================================
// STEP 4: FILTERS
// =============================================================================

function addFilter() {
  filters.push({ col: '', op: 'eq', value: '' });
  renderFilters();
}

function removeFilter(idx) {
  filters.splice(idx, 1);
  renderFilters();
}

function renderFilters() {
  var html = '';
  for (var i = 0; i < filters.length; i++) {
    html += '<div class="filter-row">';
    // Column select
    html += '<select onchange="updateFilter(' + i + ', \'col\', this.value)">';
    html += '<option value="">' + t('filterCol') + '</option>';
    for (var j = 0; j < selectedTables.length; j++) {
      var tbl = selectedTables[j];
      var cols = tableColumns[tbl] || [];
      for (var k = 0; k < cols.length; k++) {
        var val = tbl + '.' + cols[k];
        var sel = (filters[i].col === val) ? ' selected' : '';
        html += '<option value="' + sanitize(val) + '"' + sel + '>' + sanitize(cols[k]) + ' (' + sanitize(tbl) + ')</option>';
      }
    }
    html += '</select>';
    // Operator
    html += '<select onchange="updateFilter(' + i + ', \'op\', this.value)">';
    var ops = ['eq', 'neq', 'contains', 'ncontains', 'gt', 'lt', 'empty', 'nempty'];
    var opLabels = ['filterEquals', 'filterNotEquals', 'filterContains', 'filterNotContains', 'filterGreater', 'filterLess', 'filterEmpty', 'filterNotEmpty'];
    for (var o = 0; o < ops.length; o++) {
      var sel = (filters[i].op === ops[o]) ? ' selected' : '';
      html += '<option value="' + ops[o] + '"' + sel + '>' + t(opLabels[o]) + '</option>';
    }
    html += '</select>';
    // Value
    var noValue = (filters[i].op === 'empty' || filters[i].op === 'nempty');
    html += '<input type="text" placeholder="' + t('filterValue') + '" value="' + sanitize(filters[i].value || '') + '" onchange="updateFilter(' + i + ', \'value\', this.value)"' + (noValue ? ' disabled style="opacity:0.3"' : '') + ' />';
    // Remove
    html += '<button class="filter-remove" onclick="removeFilter(' + i + ')">✕</button>';
    html += '</div>';
  }
  filtersContainer.innerHTML = html;
}

function updateFilter(idx, field, value) {
  filters[idx][field] = value;
  if (field === 'op') renderFilters();
}

// =============================================================================
// STEP VISIBILITY
// =============================================================================

function updateSteps() {
  var hasEnoughTables = selectedTables.length >= 2;
  var allColumnsLoaded = selectedTables.every(function(t) { return tableColumns[t]; });

  // Step 2: keys
  if (hasEnoughTables && allColumnsLoaded) {
    stepKeys.classList.remove('hidden');
    renderKeyMappings();
  } else {
    stepKeys.classList.add('hidden');
  }

  // Step 3: columns
  var allKeysSet = hasEnoughTables && selectedTables.every(function(t) { return keyMappings[t]; });
  if (allKeysSet) {
    stepColumns.classList.remove('hidden');
    renderColumnPicker();
    updateSelectAllBtn();
  } else {
    stepColumns.classList.add('hidden');
  }

  // Step 4: filters + execute
  var hasColumns = selectedColumns.length > 0;
  if (hasColumns) {
    stepFilters.classList.remove('hidden');
    stepExecute.classList.remove('hidden');
    renderFilters();
  } else {
    stepFilters.classList.add('hidden');
    stepExecute.classList.add('hidden');
  }
}

// =============================================================================
// JOIN TYPE
// =============================================================================

function resetAll() {
  selectedTables = [];
  tableColumns = {};
  tableData = {};
  keyMappings = {};
  selectedColumns = [];
  filters = [];
  joinType = 'inner';
  joinedData = [];
  joinedColumns = [];
  sortCol = null;
  sortDir = 'asc';
  generatedTableName = null;

  // Reset UI
  renderTableChips();
  stepKeys.classList.add('hidden');
  stepColumns.classList.add('hidden');
  stepFilters.classList.add('hidden');
  stepExecute.classList.add('hidden');
  stepResults.classList.add('hidden');
  generateBtn.classList.remove('hidden');
  refreshBtn.classList.add('hidden');
  generateMessage.classList.add('hidden');
  generateTableName.value = '';
  resultsContainer.innerHTML = '';
  resultsInfo.innerHTML = '';
  filtersContainer.innerHTML = '';

  // Reset join type buttons
  document.querySelectorAll('.join-type-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-type') === 'inner');
  });

  // Scroll to top
  window.scrollTo(0, 0);
  showToast(t('newQuery') + ' ✓', 'info');
}

function setJoinType(type) {
  joinType = type;
  document.querySelectorAll('.join-type-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-type') === type);
  });
}

// =============================================================================
// EXECUTE JOIN
// =============================================================================

async function executeJoin() {
  // Validate
  if (selectedTables.length < 2) { showToast(t('minTwoTables'), 'error'); return; }
  if (!selectedTables.every(function(t) { return keyMappings[t]; })) { showToast(t('selectAllKeys'), 'error'); return; }
  if (selectedColumns.length === 0) { showToast(t('selectOneCols'), 'error'); return; }

  var executeBtn = document.getElementById('execute-btn');
  executeBtn.disabled = true;
  executeBtn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div> ' + t('executing');

  try {
    // Use already loaded data (from loadTableColumns), no need to re-fetch
    // Only fetch if data is missing
    for (var i = 0; i < selectedTables.length; i++) {
      var tbl = selectedTables[i];
      if (!tableData[tbl]) {
        tableData[tbl] = await grist.docApi.fetchTable(tbl);
      }
    }

    // Build index from first table
    var primaryTable = selectedTables[0];
    var primaryKey = keyMappings[primaryTable];
    var primaryData = tableData[primaryTable];
    var primaryIds = primaryData[primaryKey] || [];

    // Build set of needed columns (only selected + key columns) to save memory
    var neededCols = {};
    for (var i = 0; i < selectedColumns.length; i++) {
      neededCols[selectedColumns[i].table + '.' + selectedColumns[i].col] = true;
    }
    // Also need key columns for joining
    for (var i = 0; i < selectedTables.length; i++) {
      neededCols[selectedTables[i] + '.' + keyMappings[selectedTables[i]]] = true;
    }

    // Build rows from primary table (only needed columns)
    var rows = [];
    var primaryCols = (tableColumns[primaryTable] || []).filter(function(c) {
      return neededCols[primaryTable + '.' + c];
    });
    for (var i = 0; i < primaryIds.length; i++) {
      var row = {};
      row['__key__'] = String(primaryIds[i]);
      for (var c = 0; c < primaryCols.length; c++) {
        row[primaryTable + '.' + primaryCols[c]] = (primaryData[primaryCols[c]] || [])[i];
      }
      rows.push(row);
    }

    // Join with other tables (only needed columns)
    for (var t_idx = 1; t_idx < selectedTables.length; t_idx++) {
      var tbl = selectedTables[t_idx];
      var tblKey = keyMappings[tbl];
      var tblData = tableData[tbl];
      var tblKeys = tblData[tblKey] || [];
      var tblCols = (tableColumns[tbl] || []).filter(function(c) {
        return neededCols[tbl + '.' + c];
      });

      // Build lookup: key -> array of row indices
      var lookup = {};
      for (var k = 0; k < tblKeys.length; k++) {
        var keyVal = String(tblKeys[k]);
        if (!lookup[keyVal]) lookup[keyVal] = [];
        lookup[keyVal].push(k);
      }

      var newRows = [];
      for (var r = 0; r < rows.length; r++) {
        var keyVal = rows[r]['__key__'];
        var matches = lookup[keyVal];
        if (matches && matches.length > 0) {
          for (var m = 0; m < matches.length; m++) {
            var newRow = Object.assign({}, rows[r]);
            for (var c = 0; c < tblCols.length; c++) {
              newRow[tbl + '.' + tblCols[c]] = (tblData[tblCols[c]] || [])[matches[m]];
            }
            newRows.push(newRow);
          }
        } else if (joinType === 'left') {
          var newRow = Object.assign({}, rows[r]);
          for (var c = 0; c < tblCols.length; c++) {
            newRow[tbl + '.' + tblCols[c]] = null;
          }
          newRows.push(newRow);
        }
      }
      rows = newRows;

      // Safety: cap at 50000 rows to avoid memory crash
      if (rows.length > 50000) {
        rows = rows.slice(0, 50000);
        showToast('Résultat limité à 50 000 lignes', 'warning');
        break;
      }
    }

    // Apply filters
    rows = applyFilters(rows);

    // Deduplicate if checked
    var deduplicateCheck = document.getElementById('deduplicate-check');
    if (deduplicateCheck && deduplicateCheck.checked) {
      var beforeCount = rows.length;
      var seen = {};
      var uniqueRows = [];
      var cols = selectedColumns.map(function(sc) { return sc.table + '.' + sc.col; });
      for (var r = 0; r < rows.length; r++) {
        var key = '';
        for (var c = 0; c < cols.length; c++) {
          var val = rows[r][cols[c]];
          key += (val === null || val === undefined ? '' : String(val)) + '|||';
        }
        if (!seen[key]) {
          seen[key] = true;
          uniqueRows.push(rows[r]);
        }
      }
      rows = uniqueRows;
      var removed = beforeCount - rows.length;
      if (removed > 0) {
        showToast(t('deduplicatedInfo').replace('{removed}', removed), 'info');
      }
    }

    // Store results
    joinedData = rows;
    joinedColumns = selectedColumns.map(function(sc) { return sc.table + '.' + sc.col; });

    // Reset sort
    sortCol = null;
    sortDir = 'asc';

    // Render
    renderResults();
    stepResults.classList.remove('hidden');
    showToast(t('resultsCount').replace('{count}', rows.length), 'success');

  } catch (error) {
    console.error('Join error:', error);
    showToast(t('generateError') + error.message, 'error');
  } finally {
    executeBtn.disabled = false;
    executeBtn.innerHTML = '🔀 <span data-i18n="executeJoin">' + t('executeJoin') + '</span>';
  }
}

// =============================================================================
// FILTERS LOGIC
// =============================================================================

function applyFilters(rows) {
  if (filters.length === 0) return rows;
  return rows.filter(function(row) {
    for (var i = 0; i < filters.length; i++) {
      var f = filters[i];
      if (!f.col) continue;
      var val = row[f.col];
      var strVal = (val === null || val === undefined) ? '' : String(val).toLowerCase();
      var filterVal = (f.value || '').toLowerCase();

      switch (f.op) {
        case 'eq':
          if (strVal !== filterVal) return false;
          break;
        case 'neq':
          if (strVal === filterVal) return false;
          break;
        case 'contains':
          if (strVal.indexOf(filterVal) === -1) return false;
          break;
        case 'ncontains':
          if (strVal.indexOf(filterVal) !== -1) return false;
          break;
        case 'gt':
          if (Number(val) <= Number(f.value)) return false;
          break;
        case 'lt':
          if (Number(val) >= Number(f.value)) return false;
          break;
        case 'empty':
          if (strVal !== '') return false;
          break;
        case 'nempty':
          if (strVal === '') return false;
          break;
      }
    }
    return true;
  });
}

// =============================================================================
// RENDER RESULTS
// =============================================================================

function renderResults() {
  if (joinedData.length === 0) {
    resultsInfo.innerHTML = '<span>' + t('resultsEmpty') + '</span>';
    resultsContainer.innerHTML = '';
    return;
  }

  // Sort
  var data = joinedData.slice();
  if (sortCol) {
    data.sort(function(a, b) {
      var va = a[sortCol], vb = b[sortCol];
      if (va === null || va === undefined) va = '';
      if (vb === null || vb === undefined) vb = '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Info bar
  resultsInfo.innerHTML =
    '<span><span class="results-count">' + data.length + '</span> ' + t('resultsCount').replace('{count}', data.length).replace(data.length + ' ', '') + '</span>' +
    '<button class="btn btn-secondary btn-sm" onclick="exportCsv()">📄 ' + t('exportCsv') + '</button>';

  // Table
  var html = '<table class="results-table"><thead><tr>';
  for (var c = 0; c < joinedColumns.length; c++) {
    var col = joinedColumns[c];
    var parts = col.split('.');
    var displayName = parts[1] + ' <span style="font-size:10px;color:#94a3b8;">(' + parts[0] + ')</span>';
    var sortIcon = t('sortNone');
    if (sortCol === col) sortIcon = sortDir === 'asc' ? t('sortAsc') : t('sortDesc');
    html += '<th onclick="sortBy(\'' + sanitize(col) + '\')">' + displayName + ' <span class="sort-icon">' + sortIcon + '</span></th>';
  }
  html += '</tr></thead><tbody>';

  // Limit display to 500 rows for performance
  var displayLimit = Math.min(data.length, 500);
  for (var r = 0; r < displayLimit; r++) {
    html += '<tr>';
    for (var c = 0; c < joinedColumns.length; c++) {
      var val = data[r][joinedColumns[c]];
      var display = (val === null || val === undefined) ? '<span style="color:#cbd5e1;">—</span>' : sanitize(String(val));
      html += '<td title="' + sanitize(String(val || '')) + '">' + display + '</td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table>';

  if (data.length > 500) {
    html += '<div style="text-align:center; padding:8px; color:#64748b; font-size:11px;">... ' + (data.length - 500) + ' lignes supplémentaires non affichées</div>';
  }

  resultsContainer.innerHTML = html;
}

function sortBy(col) {
  if (sortCol === col) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol = col;
    sortDir = 'asc';
  }
  renderResults();
}

// =============================================================================
// EXPORT CSV
// =============================================================================

function exportCsv() {
  if (joinedData.length === 0) return;

  var headers = joinedColumns.map(function(c) {
    var parts = c.split('.');
    return parts[1] + ' (' + parts[0] + ')';
  });

  var csvRows = [headers.join(',')];
  for (var r = 0; r < joinedData.length; r++) {
    var row = [];
    for (var c = 0; c < joinedColumns.length; c++) {
      var val = joinedData[r][joinedColumns[c]];
      if (val === null || val === undefined) val = '';
      // Escape CSV
      val = String(val).replace(/"/g, '""');
      if (val.indexOf(',') !== -1 || val.indexOf('"') !== -1 || val.indexOf('\n') !== -1) {
        val = '"' + val + '"';
      }
      row.push(val);
    }
    csvRows.push(row.join(','));
  }

  var blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'cross-table-result.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exporté !', 'success');
}

// =============================================================================
// GENERATE TABLE IN GRIST
// =============================================================================

async function generateTable() {
  var rawName = generateTableName.value.trim() || t('tableNamePlaceholder');
  var tableName = removeAccents(rawName).replace(/[^a-zA-Z0-9_]/g, '_');

  if (joinedData.length === 0) {
    showToast(t('resultsEmpty'), 'error');
    return;
  }

  generateBtn.disabled = true;
  generateMessage.classList.remove('hidden');
  generateMessage.innerHTML = '<div class="message message-info">' + t('generating') + '</div>';

  try {
    // Check if table exists
    var existingTables = await grist.docApi.listTables();
    if (existingTables.indexOf(tableName) !== -1) {
      var confirmed = await showModal(
        t('tableExistsTitle'),
        t('tableExists').replace('{name}', tableName)
      );
      if (!confirmed) {
        generateBtn.disabled = false;
        generateMessage.classList.add('hidden');
        return;
      }
      // Delete existing and recreate
      await deleteAndRecreateTable(tableName);
      return;
    }

    // Build columns definition
    var colDefs = buildColumnDefs();
    // Add timestamp column
    colDefs.push({ id: 'Derniere_MAJ', fields: { label: 'Derniere_MAJ', type: 'Text' } });

    // Create table
    await grist.docApi.applyUserActions([
      ['AddTable', tableName, colDefs]
    ]);

    // Insert data
    await insertJoinedData(tableName, colDefs);

    generatedTableName = tableName;
    generateBtn.classList.add('hidden');
    refreshBtn.classList.remove('hidden');
    generateMessage.innerHTML = '<div class="message message-success">' + t('generated').replace('{name}', tableName).replace('{count}', joinedData.length) + '</div>';
    showToast(t('generated').replace('{name}', tableName).replace('{count}', joinedData.length), 'success');

  } catch (error) {
    console.error('Generate error:', error);
    generateMessage.innerHTML = '<div class="message message-error">' + t('generateError') + sanitize(error.message) + '</div>';
    showToast(t('generateError') + error.message, 'error');
  } finally {
    generateBtn.disabled = false;
  }
}

async function refreshTable() {
  if (!generatedTableName) return;

  refreshBtn.disabled = true;
  generateMessage.classList.remove('hidden');
  generateMessage.innerHTML = '<div class="message message-info">' + t('refreshing') + '</div>';

  try {
    // Re-execute join to get fresh data
    await reExecuteJoin();

    // Remove all existing rows
    var existingData = await grist.docApi.fetchTable(generatedTableName);
    var existingIds = existingData.id || [];
    if (existingIds.length > 0) {
      await grist.docApi.applyUserActions([
        ['BulkRemoveRecord', generatedTableName, existingIds]
      ]);
    }

    // Re-insert
    var colDefs = buildColumnDefs();
    colDefs.push({ id: 'Derniere_MAJ', fields: { label: 'Derniere_MAJ', type: 'Text' } });
    await insertJoinedData(generatedTableName, colDefs);

    generateMessage.innerHTML = '<div class="message message-success">' + t('refreshed').replace('{name}', generatedTableName).replace('{count}', joinedData.length) + '</div>';
    showToast(t('refreshed').replace('{name}', generatedTableName).replace('{count}', joinedData.length), 'success');

    // Also re-render results
    renderResults();

  } catch (error) {
    console.error('Refresh error:', error);
    generateMessage.innerHTML = '<div class="message message-error">' + t('generateError') + sanitize(error.message) + '</div>';
  } finally {
    refreshBtn.disabled = false;
  }
}

async function deleteAndRecreateTable(tableName) {
  try {
    // Remove all rows first
    var existingData = await grist.docApi.fetchTable(tableName);
    var existingIds = existingData.id || [];
    if (existingIds.length > 0) {
      await grist.docApi.applyUserActions([
        ['BulkRemoveRecord', tableName, existingIds]
      ]);
    }

    // Check if columns match, if not we need to remove and recreate
    // For simplicity, just remove all rows and re-add data
    var colDefs = buildColumnDefs();
    colDefs.push({ id: 'Derniere_MAJ', fields: { label: 'Derniere_MAJ', type: 'Text' } });

    // Try to add missing columns
    var existingCols = Object.keys(existingData).filter(function(c) {
      return c !== 'id' && c !== 'manualSort' && !c.startsWith('gristHelper_');
    });
    for (var i = 0; i < colDefs.length; i++) {
      if (existingCols.indexOf(colDefs[i].id) === -1) {
        try {
          await grist.docApi.applyUserActions([
            ['AddColumn', tableName, colDefs[i].id, colDefs[i].fields]
          ]);
        } catch (e) { /* column may already exist with different casing */ }
      }
    }

    await insertJoinedData(tableName, colDefs);

    generatedTableName = tableName;
    generateBtn.classList.add('hidden');
    refreshBtn.classList.remove('hidden');
    generateMessage.innerHTML = '<div class="message message-success">' + t('generated').replace('{name}', tableName).replace('{count}', joinedData.length) + '</div>';
    showToast(t('generated').replace('{name}', tableName).replace('{count}', joinedData.length), 'success');

  } catch (error) {
    console.error('Replace error:', error);
    generateMessage.innerHTML = '<div class="message message-error">' + t('generateError') + sanitize(error.message) + '</div>';
  } finally {
    generateBtn.disabled = false;
  }
}

function buildColumnDefs() {
  var defs = [];
  var seen = {};
  for (var i = 0; i < joinedColumns.length; i++) {
    var parts = joinedColumns[i].split('.');
    var colId = removeAccents(parts[0] + '_' + parts[1]).replace(/[^a-zA-Z0-9_]/g, '_');
    // Avoid duplicates
    if (seen[colId]) {
      colId = colId + '_' + (i + 1);
    }
    seen[colId] = true;
    defs.push({
      id: colId,
      fields: { label: parts[1] + ' (' + parts[0] + ')', type: 'Text' },
      sourceCol: joinedColumns[i]
    });
  }
  return defs;
}

async function insertJoinedData(tableName, colDefs) {
  var now = new Date().toLocaleString('fr-FR');
  var batchSize = 500;

  for (var start = 0; start < joinedData.length; start += batchSize) {
    var end = Math.min(start + batchSize, joinedData.length);
    var records = {};

    // Init arrays
    for (var c = 0; c < colDefs.length; c++) {
      records[colDefs[c].id] = [];
    }

    for (var r = start; r < end; r++) {
      for (var c = 0; c < colDefs.length; c++) {
        if (colDefs[c].id === 'Derniere_MAJ') {
          records['Derniere_MAJ'].push(now);
        } else {
          var val = joinedData[r][colDefs[c].sourceCol];
          records[colDefs[c].id].push(val === null || val === undefined ? '' : String(val));
        }
      }
    }

    await grist.docApi.applyUserActions([
      ['BulkAddRecord', tableName, new Array(end - start).fill(null), records]
    ]);
  }
}

async function reExecuteJoin() {
  // Reload data
  for (var i = 0; i < selectedTables.length; i++) {
    tableData[selectedTables[i]] = await grist.docApi.fetchTable(selectedTables[i]);
  }

  // Redo join (same logic as executeJoin)
  var primaryTable = selectedTables[0];
  var primaryKey = keyMappings[primaryTable];
  var primaryData = tableData[primaryTable];
  var primaryIds = primaryData[primaryKey] || [];

  var rows = [];
  for (var i = 0; i < primaryIds.length; i++) {
    var row = {};
    row['__key__'] = String(primaryIds[i]);
    var cols = tableColumns[primaryTable] || [];
    for (var c = 0; c < cols.length; c++) {
      row[primaryTable + '.' + cols[c]] = (primaryData[cols[c]] || [])[i];
    }
    rows.push(row);
  }

  for (var t_idx = 1; t_idx < selectedTables.length; t_idx++) {
    var tbl = selectedTables[t_idx];
    var tblKey = keyMappings[tbl];
    var tblData = tableData[tbl];
    var tblKeys = tblData[tblKey] || [];
    var tblCols = tableColumns[tbl] || [];

    var lookup = {};
    for (var k = 0; k < tblKeys.length; k++) {
      var keyVal = String(tblKeys[k]);
      if (!lookup[keyVal]) lookup[keyVal] = [];
      lookup[keyVal].push(k);
    }

    var newRows = [];
    for (var r = 0; r < rows.length; r++) {
      var keyVal = rows[r]['__key__'];
      var matches = lookup[keyVal];
      if (matches && matches.length > 0) {
        for (var m = 0; m < matches.length; m++) {
          var newRow = Object.assign({}, rows[r]);
          for (var c = 0; c < tblCols.length; c++) {
            newRow[tbl + '.' + tblCols[c]] = (tblData[tblCols[c]] || [])[matches[m]];
          }
          newRows.push(newRow);
        }
      } else if (joinType === 'left') {
        var newRow = Object.assign({}, rows[r]);
        for (var c = 0; c < tblCols.length; c++) {
          newRow[tbl + '.' + tblCols[c]] = null;
        }
        newRows.push(newRow);
      }
    }
    rows = newRows;
  }

  rows = applyFilters(rows);
  joinedData = rows;
}
