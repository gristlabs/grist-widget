/**
 * Grist Document Template (Mail Merge) Widget
 * WYSIWYG editor with Grist field variables, mail merge preview,
 * Word import, and PDF generation.
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
    title: 'Document Template',
    notInGrist: 'Ce widget doit être utilisé dans Grist.',
    tabEditor: 'Éditeur',
    tabPreview: 'Prévisualisation',
    tabPdf: 'Générer PDF',
    selectTable: '📊 Table source :',
    selectTableOption: '-- Choisir une table --',
    importTitle: 'Importer un document Word',
    importDrop: 'Glissez un fichier .docx ici ou cliquez pour parcourir',
    importSuccess: 'Document Word importé avec succès !',
    importError: 'Erreur lors de l\'import : ',
    varTitle: 'Variables disponibles',
    varHint: '(cliquez pour insérer)',
    saveTemplate: 'Sauvegarder le modèle',
    clearEditor: 'Vider l\'éditeur',
    templateSaved: 'Modèle sauvegardé !',
    templateCleared: 'Éditeur vidé.',
    templateLoaded: 'Modèle chargé depuis la sauvegarde.',
    recordLabel: 'Enregistrement',
    previewEmpty: 'Sélectionnez une table et créez un modèle pour voir la prévisualisation.',
    pdfSingle: 'PDF de cet enregistrement',
    pdfTitle: 'Générer les PDF',
    pdfDesc: 'Générez un PDF pour chaque enregistrement de la table, ou un PDF combiné.',
    pdfFilename: 'Nom du fichier :',
    pdfMode: 'Mode :',
    pdfModeAll: 'Tous les enregistrements (1 PDF)',
    pdfModeCurrent: 'Enregistrement actuel uniquement',
    pdfPageSize: 'Format :',
    pdfGenerate: 'Générer le PDF',
    pdfGenerating: 'Génération en cours... {current}/{total}',
    pdfDone: 'PDF généré avec succès ! ({count} pages)',
    pdfError: 'Erreur lors de la génération : ',
    footerCreated: 'Créé par',
    confirmClear: 'Voulez-vous vraiment vider l\'éditeur ?',
    confirmClearTitle: 'Vider l\'éditeur',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    pdfCancel: 'Annuler (conserver le partiel)',
    pdfCancelled: 'Génération annulée. PDF partiel sauvegardé ({count} pages).',
    noTemplate: 'Aucun modèle. Créez d\'abord un document dans l\'onglet Éditeur.',
    noData: 'Aucune donnée dans la table sélectionnée.',
    editorPlaceholder: '<p style="color:#94a3b8;">Commencez à écrire votre document ici... Utilisez les variables ci-dessus pour insérer des champs dynamiques.</p>',
    templateName: 'Nom du modèle :',
    templateNamePlaceholder: 'Ex: Courrier standard, PV réunion...',
    templateSelect: 'Modèles enregistrés :',
    templateSelectDefault: '-- Nouveau modèle --',
    templateDeleteConfirm: 'Supprimer le modèle "{name}" ?',
    templateDeleted: 'Modèle "{name}" supprimé.',
    templateDelete: 'Supprimer',
    templateLoad: 'Charger'
  },
  en: {
    title: 'Document Template',
    notInGrist: 'This widget must be used inside Grist.',
    tabEditor: 'Editor',
    tabPreview: 'Preview',
    tabPdf: 'Generate PDF',
    selectTable: '📊 Source table:',
    selectTableOption: '-- Choose a table --',
    importTitle: 'Import a Word document',
    importDrop: 'Drag a .docx file here or click to browse',
    importSuccess: 'Word document imported successfully!',
    importError: 'Error importing: ',
    varTitle: 'Available variables',
    varHint: '(click to insert)',
    saveTemplate: 'Save template',
    clearEditor: 'Clear editor',
    templateSaved: 'Template saved!',
    templateCleared: 'Editor cleared.',
    templateLoaded: 'Template loaded from saved data.',
    recordLabel: 'Record',
    previewEmpty: 'Select a table and create a template to see the preview.',
    pdfSingle: 'PDF of this record',
    pdfTitle: 'Generate PDFs',
    pdfDesc: 'Generate a PDF for each record in the table, or a combined PDF.',
    pdfFilename: 'File name:',
    pdfMode: 'Mode:',
    pdfModeAll: 'All records (1 PDF)',
    pdfModeCurrent: 'Current record only',
    pdfPageSize: 'Page size:',
    pdfGenerate: 'Generate PDF',
    pdfGenerating: 'Generating... {current}/{total}',
    pdfDone: 'PDF generated successfully! ({count} pages)',
    pdfError: 'Error generating: ',
    footerCreated: 'Created by',
    confirmClear: 'Do you really want to clear the editor?',
    confirmClearTitle: 'Clear editor',
    cancel: 'Cancel',
    confirm: 'Confirm',
    pdfCancel: 'Cancel (keep partial)',
    pdfCancelled: 'Generation cancelled. Partial PDF saved ({count} pages).',
    noTemplate: 'No template. Create a document in the Editor tab first.',
    noData: 'No data in the selected table.',
    editorPlaceholder: '<p style="color:#94a3b8;">Start writing your document here... Use the variables above to insert dynamic fields.</p>',
    templateName: 'Template name:',
    templateNamePlaceholder: 'E.g.: Standard letter, Meeting notes...',
    templateSelect: 'Saved templates:',
    templateSelectDefault: '-- New template --',
    templateDeleteConfirm: 'Delete template "{name}"?',
    templateDeleted: 'Template "{name}" deleted.',
    templateDelete: 'Delete',
    templateLoad: 'Load'
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
}

// =============================================================================
// UTILS
// =============================================================================

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

// =============================================================================
// STATE
// =============================================================================

var allTables = [];
var selectedTable = '';
var tableColumns = [];
var tableData = null;       // { col: [...], ... }
var currentRecordIndex = 0;
var templateHtml = '';
var editorInstance = null;
var TEMPLATE_STORAGE_KEY = 'grist_doc_template_';
var pdfCancelled = false;

// =============================================================================
// TABS
// =============================================================================

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(function(tc) {
    tc.classList.toggle('active', tc.id === 'tab-' + tabId);
  });
  if (tabId === 'preview') {
    renderPreview();
  }
  if (tabId === 'pdf') {
    refreshPdfTemplateList();
  }
}

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
      console.log('Doc Template widget ready');

      // Listen for widget options (template stored in Grist)
      grist.onOptions(function(options) {
        if (options && options.template && selectedTable) {
          var key = 'template_' + selectedTable;
          if (options[key]) {
            setEditorHtml(options[key]);
            templateHtml = options[key];
            console.log('Template loaded from Grist options for', selectedTable);
          }
        }
      });

      await loadTables();
      initEditor();
    } catch (error) {
      console.error('Init error:', error);
    }
  })();
}

// =============================================================================
// LOAD TABLES
// =============================================================================

async function loadTables() {
  var loading = document.getElementById('table-loading');
  loading.classList.remove('hidden');
  try {
    var tables = await grist.docApi.listTables();
    allTables = tables.filter(function(t) {
      return !t.startsWith('_grist_') && !t.startsWith('GristHidden_');
    });
    var select = document.getElementById('table-select');
    select.innerHTML = '<option value="">' + t('selectTableOption') + '</option>';
    for (var i = 0; i < allTables.length; i++) {
      var opt = document.createElement('option');
      opt.value = allTables[i];
      opt.textContent = allTables[i];
      select.appendChild(opt);
    }
  } catch (error) {
    console.error('Error loading tables:', error);
  } finally {
    loading.classList.add('hidden');
  }
}

async function onTableChange() {
  var select = document.getElementById('table-select');
  selectedTable = select.value;
  if (!selectedTable) {
    tableColumns = [];
    tableData = null;
    document.getElementById('var-panel').classList.add('hidden');
    return;
  }

  try {
    var data = await grist.docApi.fetchTable(selectedTable);
    tableData = data;
    tableColumns = Object.keys(data).filter(function(c) {
      return c !== 'id' && c !== 'manualSort' && !c.startsWith('gristHelper_');
    });
    renderVariableChips();
    document.getElementById('var-panel').classList.remove('hidden');

    // Load saved template for this table
    loadSavedTemplate();

    currentRecordIndex = 0;
  } catch (error) {
    console.error('Error loading table data:', error);
    showToast(t('importError') + error.message, 'error');
  }
}

// =============================================================================
// VARIABLE CHIPS
// =============================================================================

function renderVariableChips() {
  var html = '';
  for (var i = 0; i < tableColumns.length; i++) {
    var col = tableColumns[i];
    html += '<span class="var-chip" onclick="insertVariable(\'' + sanitize(col) + '\')">';
    html += '{{' + sanitize(col) + '}}';
    html += '</span>';
  }
  document.getElementById('var-chips').innerHTML = html;
}

function insertVariable(colName) {
  if (!editorInstance) return;
  var varHtml = '<span style="background:#f3e8ff;color:#7c3aed;padding:2px 6px;border-radius:4px;font-weight:600;" contenteditable="false">{{' + colName + '}}</span>&nbsp;';
  editorInstance.selection.insertHTML(varHtml);
  showToast('{{' + colName + '}} inséré', 'info');
}

// =============================================================================
// JODIT EDITOR
// =============================================================================

function initEditor() {
  editorInstance = Jodit.make('#editor-container', {
    language: currentLang,
    minHeight: 500,
    placeholder: currentLang === 'fr' ? 'Commencez à écrire votre document ici...' : 'Start writing your document here...',
    allowResizeY: true,
    toolbarAdaptive: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    controls: {
      pagebreak: {
        name: 'pagebreak',
        iconURL: '',
        tooltip: currentLang === 'fr' ? 'Saut de page' : 'Page break',
        exec: function(editor) {
          editor.selection.insertHTML(
            '<div class="page-break-marker" contenteditable="false" style="page-break-after:always;">' +
            '✂ ' + (currentLang === 'fr' ? 'Saut de page' : 'Page break') +
            '</div>'
          );
        }
      }
    },
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'font', 'fontsize', '|',
      'brush', '|',
      'paragraph', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'align', '|',
      'table', '|',
      'link', 'image', '|',
      'hr', 'pagebreak', '|',
      'undo', 'redo', '|',
      'eraser', 'source', 'fullsize', 'print'
    ],
    style: {
      'font-family': '"Times New Roman", Times, serif',
      'font-size': '14px',
      'line-height': '1.6'
    },
    iframe: false,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false
  });
}

// =============================================================================
// PAGE FORMAT VISUAL
// =============================================================================

function setEditorPageFormat(format) {
  var wrapper = document.getElementById('editor-page-wrapper');
  if (!wrapper) return;
  wrapper.className = '';
  if (format === 'a4') {
    wrapper.className = 'editor-page-a4';
  } else if (format === 'letter') {
    wrapper.className = 'editor-page-letter';
  } else {
    wrapper.className = 'editor-page-free';
  }
  // Sync with PDF page size selector if it exists
  var pdfPageSize = document.getElementById('pdf-page-size');
  if (pdfPageSize && format !== 'free') {
    pdfPageSize.value = format;
  }
}

// =============================================================================
// SAVE / LOAD TEMPLATE
// =============================================================================

function getEditorHtml() {
  if (!editorInstance) return '';
  return editorInstance.value;
}

function setEditorHtml(html) {
  if (!editorInstance) return;
  editorInstance.value = html;
}

// --- Multi-template management ---

var currentTemplateName = '';

async function getTemplateIndex() {
  // Returns { templates: [ { name: "...", html: "..." }, ... ] }
  try {
    var idx = await grist.widgetApi.getOption('templateIndex');
    if (idx && Array.isArray(idx.templates)) return idx;
  } catch (e) {}
  // Fallback to localStorage
  try {
    var local = localStorage.getItem(TEMPLATE_STORAGE_KEY + 'index');
    if (local) {
      var parsed = JSON.parse(local);
      if (parsed && Array.isArray(parsed.templates)) return parsed;
    }
  } catch (e) {}
  return { templates: [] };
}

async function saveTemplateIndex(index) {
  try {
    await grist.widgetApi.setOption('templateIndex', index);
  } catch (e) {
    console.warn('Could not save template index to Grist:', e);
  }
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY + 'index', JSON.stringify(index));
  } catch (e) {}
}

async function refreshTemplateList() {
  var select = document.getElementById('template-list');
  if (!select) return;
  var index = await getTemplateIndex();
  select.innerHTML = '<option value="">' + t('templateSelectDefault') + '</option>';
  for (var i = 0; i < index.templates.length; i++) {
    var opt = document.createElement('option');
    opt.value = index.templates[i].name;
    opt.textContent = index.templates[i].name;
    if (index.templates[i].name === currentTemplateName) opt.selected = true;
    select.appendChild(opt);
  }
  // Show/hide delete button
  var delBtn = document.getElementById('btn-delete-template');
  if (delBtn) delBtn.style.display = select.value ? '' : 'none';
}

function onTemplateSelectChange() {
  var select = document.getElementById('template-list');
  var nameInput = document.getElementById('template-name-input');
  var delBtn = document.getElementById('btn-delete-template');
  if (!select) return;
  if (select.value) {
    // Load selected template
    loadTemplateByName(select.value);
    if (nameInput) nameInput.value = select.value;
    if (delBtn) delBtn.style.display = '';
  } else {
    // New template mode — clear editor
    if (nameInput) nameInput.value = '';
    currentTemplateName = '';
    if (delBtn) delBtn.style.display = 'none';
    if (editorInstance) {
      editorInstance.value = '';
      templateHtml = '';
    }
  }
}

async function loadTemplateByName(name) {
  var index = await getTemplateIndex();
  for (var i = 0; i < index.templates.length; i++) {
    if (index.templates[i].name === name) {
      setEditorHtml(index.templates[i].html);
      templateHtml = index.templates[i].html;
      currentTemplateName = name;
      showToast(t('templateLoaded'), 'info');
      return;
    }
  }
}

async function saveTemplate() {
  if (!editorInstance) return;
  templateHtml = getEditorHtml();
  if (!selectedTable) return;

  var nameInput = document.getElementById('template-name-input');
  var name = (nameInput ? nameInput.value.trim() : '') || currentTemplateName;
  if (!name) {
    // Prompt for name
    name = prompt(t('templateName'), t('templateNamePlaceholder'));
    if (!name || !name.trim()) return;
    name = name.trim();
  }

  var index = await getTemplateIndex();
  // Update existing or add new
  var found = false;
  for (var i = 0; i < index.templates.length; i++) {
    if (index.templates[i].name === name) {
      index.templates[i].html = templateHtml;
      found = true;
      break;
    }
  }
  if (!found) {
    index.templates.push({ name: name, html: templateHtml });
  }

  await saveTemplateIndex(index);
  currentTemplateName = name;
  if (nameInput) nameInput.value = name;
  await refreshTemplateList();
  showToast(t('templateSaved'), 'success');
}

async function loadSavedTemplate() {
  var index = await getTemplateIndex();

  // Legacy migration: try old per-table templates and migrate to global index
  if (index.templates.length === 0 && selectedTable) {
    var legacyHtml = null;
    try {
      legacyHtml = await grist.widgetApi.getOption('template_' + selectedTable);
    } catch (e) {}
    if (!legacyHtml) {
      try { legacyHtml = localStorage.getItem(TEMPLATE_STORAGE_KEY + selectedTable); } catch (e) {}
    }
    // Also try old per-table index format
    if (!legacyHtml) {
      try {
        var oldIdx = await grist.widgetApi.getOption('templateIndex_' + selectedTable);
        if (oldIdx && Array.isArray(oldIdx.templates) && oldIdx.templates.length > 0) {
          // Migrate all old templates to global index
          index.templates = oldIdx.templates;
          await saveTemplateIndex(index);
        }
      } catch (e) {}
    }
    if (legacyHtml && editorInstance) {
      // Migrate legacy single template
      var legacyName = selectedTable + ' - ' + (currentLang === 'fr' ? 'Modèle importé' : 'Imported template');
      index.templates.push({ name: legacyName, html: legacyHtml });
      await saveTemplateIndex(index);
    }
  }

  if (index.templates.length > 0) {
    // Load the first template by default
    var tpl = index.templates[0];
    setEditorHtml(tpl.html);
    templateHtml = tpl.html;
    currentTemplateName = tpl.name;
    var nameInput = document.getElementById('template-name-input');
    if (nameInput) nameInput.value = tpl.name;
    showToast(t('templateLoaded'), 'info');
  }
  await refreshTemplateList();
}

async function deleteSelectedTemplate() {
  var select = document.getElementById('template-list');
  if (!select || !select.value) return;
  var name = select.value;
  var confirmed = await showModal(t('confirmClearTitle'), t('templateDeleteConfirm').replace('{name}', name));
  if (!confirmed) return;

  var index = await getTemplateIndex();
  index.templates = index.templates.filter(function(tpl) { return tpl.name !== name; });
  await saveTemplateIndex(index);

  currentTemplateName = '';
  var nameInput = document.getElementById('template-name-input');
  if (nameInput) nameInput.value = '';
  editorInstance.value = '';
  templateHtml = '';
  await refreshTemplateList();
  showToast(t('templateDeleted').replace('{name}', name), 'info');
}

async function clearEditor() {
  var confirmed = await showModal(t('confirmClearTitle'), t('confirmClear'));
  if (confirmed && editorInstance) {
    editorInstance.value = '';
    templateHtml = '';
    currentTemplateName = '';
    var nameInput = document.getElementById('template-name-input');
    if (nameInput) nameInput.value = '';
    var select = document.getElementById('template-list');
    if (select) select.value = '';
    var delBtn = document.getElementById('btn-delete-template');
    if (delBtn) delBtn.style.display = 'none';
    showToast(t('templateCleared'), 'info');
  }
}

// --- PDF template selector ---

async function refreshPdfTemplateList() {
  var select = document.getElementById('pdf-template-select');
  if (!select) return;
  var index = await getTemplateIndex();
  var editorLabel = currentLang === 'fr' ? '-- Modèle actuel de l\'éditeur --' : '-- Current editor template --';
  select.innerHTML = '<option value="">' + editorLabel + '</option>';
  for (var i = 0; i < index.templates.length; i++) {
    var opt = document.createElement('option');
    opt.value = index.templates[i].name;
    opt.textContent = index.templates[i].name;
    select.appendChild(opt);
  }
}

async function onPdfTemplateChange() {
  var select = document.getElementById('pdf-template-select');
  if (!select || !select.value) return;
  // Load selected template into templateHtml for PDF generation
  var index = await getTemplateIndex();
  for (var i = 0; i < index.templates.length; i++) {
    if (index.templates[i].name === select.value) {
      templateHtml = index.templates[i].html;
      return;
    }
  }
}

// =============================================================================
// IMPORT WORD (.docx)
// =============================================================================

// Drag & drop
var dropZone = document.getElementById('drop-zone');
if (dropZone) {
  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', function() {
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    var files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.docx')) {
      importWord(files[0]);
    }
  });
}

function importWord(file) {
  if (!file) return;
  showToast(currentLang === 'fr' ? 'Import en cours...' : 'Importing...', 'info');
  var reader = new FileReader();
  reader.onload = function(e) {
    var arrayBuffer = e.target.result;
    var options = {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Titre'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Titre 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Titre 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Titre 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Titre 4'] => h4:fresh",
        "p[style-name='List Paragraph'] => li:fresh",
        "p[style-name='Paragraphe de liste'] => li:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Citation'] => blockquote:fresh",
        "p[style-name='Intense Quote'] => blockquote:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Sous-titre'] => h2:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "b => strong",
        "i => em",
        "u => u",
        "strike => s"
      ],
      convertImage: mammoth.images.imgElement(function(image) {
        return image.read('base64').then(function(imageBuffer) {
          return {
            src: 'data:' + image.contentType + ';base64,' + imageBuffer
          };
        });
      }),
      includeDefaultStyleMap: true
    };
    mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, options).then(function(result) {
      var html = result.value;
      if (result.messages.length > 0) {
        console.log('Mammoth messages:', result.messages);
      }
      // Post-process HTML for better layout
      html = postProcessWordHtml(html);
      if (editorInstance) {
        setEditorHtml(html);
        templateHtml = html;
      }
      var warnings = result.messages.filter(function(m) { return m.type === 'warning'; });
      if (warnings.length > 0) {
        showToast(t('importSuccess') + ' (' + warnings.length + ' avertissements)', 'warning');
      } else {
        showToast(t('importSuccess'), 'success');
      }
    }).catch(function(error) {
      console.error('Word import error:', error);
      showToast(t('importError') + error.message, 'error');
    });
  };
  reader.readAsArrayBuffer(file);
}

function postProcessWordHtml(html) {
  // Add max-width to images so they fit in the editor
  html = html.replace(/<img /g, '<img style="max-width:100%;height:auto;" ');

  // Convert page breaks (Mammoth doesn't handle them well)
  // Some Word docs use <br/> for page breaks - we add a visual separator
  html = html.replace(/<br\s*\/?>\s*<br\s*\/?>\s*<br\s*\/?>/g,
    '<hr style="border:none;border-top:2px dashed #cbd5e1;margin:30px 0;page-break-after:always;">');

  // Ensure empty paragraphs have some height (Word uses them for spacing)
  html = html.replace(/<p><\/p>/g, '<p style="min-height:1em;">&nbsp;</p>');

  // Add some spacing to paragraphs
  html = html.replace(/<p>/g, '<p style="margin-bottom:8px;">');

  // Style tables - no visible borders, just padding for layout
  html = html.replace(/<table>/g, '<table style="border-collapse:collapse;width:100%;margin:10px 0;border:none;">');
  html = html.replace(/<td>/g, '<td style="border:none;padding:6px 10px;vertical-align:top;">');
  html = html.replace(/<td /g, '<td style="border:none;padding:6px 10px;vertical-align:top;" ');
  html = html.replace(/<th>/g, '<th style="border:none;padding:6px 10px;font-weight:bold;vertical-align:top;">');
  html = html.replace(/<th /g, '<th style="border:none;padding:6px 10px;font-weight:bold;vertical-align:top;" ');

  return html;
}

// =============================================================================
// PREVIEW (MAIL MERGE)
// =============================================================================

function getRecordCount() {
  if (!tableData || !tableColumns.length) return 0;
  var firstCol = tableColumns[0];
  return (tableData[firstCol] || []).length;
}

function getRecordAt(index) {
  if (!tableData || index < 0) return {};
  var record = {};
  for (var i = 0; i < tableColumns.length; i++) {
    var col = tableColumns[i];
    var arr = tableData[col] || [];
    record[col] = (index < arr.length) ? arr[index] : '';
  }
  return record;
}

function resolveTemplate(html, record, forPdf) {
  var resolved = html;
  for (var col in record) {
    var val = record[col];
    var display = (val === null || val === undefined || val === '') ? '' : String(val);
    // Replace styled spans (Quill wraps variables in <span style="...">)
    var styledRegex = new RegExp('<span[^>]*>\\{\\{' + escapeRegex(col) + '\\}\\}</span>', 'g');
    if (display) {
      if (forPdf) {
        resolved = resolved.replace(styledRegex, '<strong>' + sanitize(display) + '</strong>');
      } else {
        resolved = resolved.replace(styledRegex, '<span class="var-resolved">' + sanitize(display) + '</span>');
      }
    } else {
      if (forPdf) {
        resolved = resolved.replace(styledRegex, '<em>[' + col + ']</em>');
      } else {
        resolved = resolved.replace(styledRegex, '<span class="var-empty">[' + col + ': vide]</span>');
      }
    }
    // Replace plain text {{col}}
    var plainRegex = new RegExp('\\{\\{' + escapeRegex(col) + '\\}\\}', 'g');
    if (display) {
      if (forPdf) {
        resolved = resolved.replace(plainRegex, '<strong>' + sanitize(display) + '</strong>');
      } else {
        resolved = resolved.replace(plainRegex, '<span class="var-resolved">' + sanitize(display) + '</span>');
      }
    } else {
      if (forPdf) {
        resolved = resolved.replace(plainRegex, '<em>[' + col + ']</em>');
      } else {
        resolved = resolved.replace(plainRegex, '<span class="var-empty">[' + col + ': vide]</span>');
      }
    }
  }
  // For PDF: remove page-break markers (keep them only as split points, not visible)
  if (forPdf) {
    resolved = resolved.replace(/<div[^>]*class="page-break-marker"[^>]*>[\s\S]*?<\/div>/g, '<div style="page-break-after:always;"></div>');
  }
  // For PDF: strip variable styling and table borders
  if (forPdf) {
    resolved = resolved.replace(/background-color:\s*rgb\(243,\s*232,\s*255\);?/g, '');
    resolved = resolved.replace(/background-color:\s*#f3e8ff;?/g, '');
    resolved = resolved.replace(/color:\s*rgb\(124,\s*58,\s*237\);?/g, '');
    resolved = resolved.replace(/color:\s*#7c3aed;?/g, '');
    // Strip all table/cell borders for clean PDF
    resolved = resolved.replace(/(<table[^>]*?)style="[^"]*"/g, function(m, pre) {
      return pre + 'style="border-collapse:collapse;width:100%;border:none;"';
    });
    resolved = resolved.replace(/(<td[^>]*?)style="[^"]*"/g, function(m, pre) {
      return pre + 'style="border:none;padding:6px 10px;vertical-align:top;"';
    });
    resolved = resolved.replace(/(<th[^>]*?)style="[^"]*"/g, function(m, pre) {
      return pre + 'style="border:none;padding:6px 10px;font-weight:bold;vertical-align:top;"';
    });
    // Also handle tables/cells without style attribute
    resolved = resolved.replace(/<table(?![^>]*style=)/g, '<table style="border-collapse:collapse;width:100%;border:none;"');
    resolved = resolved.replace(/<td(?![^>]*style=)/g, '<td style="border:none;padding:6px 10px;vertical-align:top;"');
    resolved = resolved.replace(/<th(?![^>]*style=)/g, '<th style="border:none;padding:6px 10px;font-weight:bold;vertical-align:top;"');
  }
  return resolved;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderPreview() {
  // Get current template from editor
  if (editorInstance) {
    templateHtml = getEditorHtml();
  }

  var count = getRecordCount();
  document.getElementById('record-total').textContent = count;

  var wrapper = document.getElementById('preview-pages-wrapper');

  // Sync preview format with editor format
  var editorFormat = document.getElementById('editor-page-format');
  if (editorFormat && wrapper) {
    var fmt = editorFormat.value;
    wrapper.className = 'preview-pages-wrapper';
    if (fmt === 'a4') wrapper.classList.add('preview-format-a4');
    else if (fmt === 'letter') wrapper.classList.add('preview-format-letter');
  }

  if (!templateHtml || !selectedTable || count === 0) {
    wrapper.innerHTML = '<div class="preview-page"><p style="color:#94a3b8; text-align:center; padding:40px;">' + t('previewEmpty') + '</p></div>';
    document.getElementById('record-current').textContent = '0';
    return;
  }

  if (currentRecordIndex >= count) currentRecordIndex = count - 1;
  if (currentRecordIndex < 0) currentRecordIndex = 0;

  document.getElementById('record-current').textContent = currentRecordIndex + 1;

  var record = getRecordAt(currentRecordIndex);
  var resolved = resolveTemplate(templateHtml, record);

  // Split at page break markers to show separate visual pages
  var pages = splitPreviewIntoPages(resolved);
  var html = '';
  for (var p = 0; p < pages.length; p++) {
    html += '<div class="preview-page">' + pages[p] + '</div>';
    if (p < pages.length - 1) {
      html += '<div class="preview-page-number">' +
        (currentLang === 'fr' ? 'Page ' : 'Page ') + (p + 1) + ' / ' + pages.length +
        '</div>';
    }
  }
  if (pages.length > 1) {
    html += '<div class="preview-page-number">' +
      (currentLang === 'fr' ? 'Page ' : 'Page ') + pages.length + ' / ' + pages.length +
      '</div>';
  }
  wrapper.innerHTML = html;
}

function splitPreviewIntoPages(html) {
  // Split on page-break-marker divs
  var parts = html.split(/<div[^>]*class="page-break-marker"[^>]*>[\s\S]*?<\/div>/g);
  // Also split on invisible page-break divs
  parts = parts.reduce(function(acc, part) {
    var subParts = part.split(/<div[^>]*style="[^"]*page-break-after:\s*always[^"]*"[^>]*>\s*<\/div>/g);
    return acc.concat(subParts);
  }, []);
  // Also split on hr with page-break
  parts = parts.reduce(function(acc, part) {
    var subParts = part.split(/<hr[^>]*style="[^"]*page-break[^"]*"[^>]*\/?>/g);
    return acc.concat(subParts);
  }, []);
  // Filter out empty pages
  return parts.filter(function(p) { return p.trim().length > 0; });
}

function prevRecord() {
  if (currentRecordIndex > 0) {
    currentRecordIndex--;
    renderPreview();
  }
}

function nextRecord() {
  var count = getRecordCount();
  if (currentRecordIndex < count - 1) {
    currentRecordIndex++;
    renderPreview();
  }
}

// =============================================================================
// PDF GENERATION
// =============================================================================

async function generateSinglePdf() {
  if (!templateHtml || !selectedTable) {
    showToast(t('noTemplate'), 'error');
    return;
  }
  var count = getRecordCount();
  if (count === 0) {
    showToast(t('noData'), 'error');
    return;
  }

  var record = getRecordAt(currentRecordIndex);
  var resolved = resolveTemplate(templateHtml, record, true);
  await generatePdfFromHtml(resolved, 'document_' + (currentRecordIndex + 1) + '.pdf');
}

function cancelPdf() {
  pdfCancelled = true;
}

async function generatePdf() {
  if (!templateHtml && editorInstance) {
    templateHtml = getEditorHtml();
  }
  if (!templateHtml || !selectedTable) {
    showToast(t('noTemplate'), 'error');
    return;
  }
  var count = getRecordCount();
  if (count === 0) {
    showToast(t('noData'), 'error');
    return;
  }

  var mode = document.getElementById('pdf-mode').value;
  var filename = document.getElementById('pdf-filename').value.trim() || 'document_publipostage';
  var pageSize = document.getElementById('pdf-page-size').value;

  var btn = document.getElementById('pdf-generate-btn');
  var cancelBtn = document.getElementById('pdf-cancel-btn');
  btn.disabled = true;
  cancelBtn.classList.remove('hidden');
  pdfCancelled = false;
  var progressBar = document.getElementById('pdf-progress');
  var progressFill = document.getElementById('pdf-progress-fill');
  var messageDiv = document.getElementById('pdf-message');
  progressBar.classList.remove('hidden');
  messageDiv.classList.remove('hidden');

  var pagesGenerated = 0;

  try {
    var jsPDF = window.jspdf.jsPDF;
    var orientation = 'portrait';
    var format = pageSize === 'a4' ? 'a4' : 'letter';

    var startIdx = 0;
    var endIdx = count;
    if (mode === 'current') {
      startIdx = currentRecordIndex;
      endIdx = currentRecordIndex + 1;
    }

    var totalPages = endIdx - startIdx;
    var pdf = new jsPDF({ orientation: orientation, unit: 'mm', format: format });
    var pageWidth = pdf.internal.pageSize.getWidth();
    var pageHeight = pdf.internal.pageSize.getHeight();

    for (var i = startIdx; i < endIdx; i++) {
      // Check cancel
      if (pdfCancelled) break;

      var progress = Math.round(((i - startIdx + 1) / totalPages) * 100);
      progressFill.style.width = progress + '%';
      messageDiv.innerHTML = '<div class="message message-info">' +
        t('pdfGenerating').replace('{current}', i - startIdx + 1).replace('{total}', totalPages) + '</div>';

      var record = getRecordAt(i);
      var resolved = resolveTemplate(templateHtml, record, true);

      // Render using block-aware page breaking
      if (i > startIdx) {
        pdf.addPage();
      }
      await renderHtmlToPdfPages(resolved, pdf, pageWidth, pageHeight, pageSize);

      pagesGenerated = i - startIdx + 1;

      // Yield to UI
      await new Promise(function(resolve) { setTimeout(resolve, 50); });
    }

    // Save (full or partial)
    pdf.save(filename + '.pdf');

    if (pdfCancelled && pagesGenerated > 0) {
      progressFill.style.width = Math.round((pagesGenerated / totalPages) * 100) + '%';
      messageDiv.innerHTML = '<div class="message message-warning" style="background:#fffbeb;color:#92400e;border:1px solid #fde68a;">' +
        t('pdfCancelled').replace('{count}', pagesGenerated) + '</div>';
      showToast(t('pdfCancelled').replace('{count}', pagesGenerated), 'warning');
    } else {
      progressFill.style.width = '100%';
      messageDiv.innerHTML = '<div class="message message-success">' +
        t('pdfDone').replace('{count}', totalPages) + '</div>';
      showToast(t('pdfDone').replace('{count}', totalPages), 'success');
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    messageDiv.innerHTML = '<div class="message message-error">' + t('pdfError') + sanitize(error.message) + '</div>';
    showToast(t('pdfError') + error.message, 'error');
  } finally {
    btn.disabled = false;
    cancelBtn.classList.add('hidden');
    pdfCancelled = false;
  }
}

async function generatePdfFromHtml(html, filename) {
  try {
    var jsPDF = window.jspdf.jsPDF;
    var pageSize = document.getElementById('pdf-page-size').value;
    var format = pageSize === 'a4' ? 'a4' : 'letter';

    var pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: format });
    var pageWidth = pdf.internal.pageSize.getWidth();
    var pageHeight = pdf.internal.pageSize.getHeight();

    await renderHtmlToPdfPages(html, pdf, pageWidth, pageHeight, pageSize);

    pdf.save(filename);
    showToast('PDF généré !', 'success');

  } catch (error) {
    console.error('PDF error:', error);
    showToast(t('pdfError') + error.message, 'error');
  }
}

// =============================================================================
// BLOCK-AWARE PDF PAGE RENDERING
// =============================================================================

async function renderHtmlToPdfPages(html, pdf, pageWidth, pageHeight, pageSize) {
  var margin = 10; // mm
  var imgWidth = pageWidth - (margin * 2);
  var availableHeight = pageHeight - (margin * 2);
  var pixelWidth = (pageSize === 'a4' ? 794 : 816);
  var baseCss = 'position:absolute;left:-9999px;top:0;width:' + pixelWidth + 'px;padding:0 60px;font-family:"Times New Roman",Times,serif;font-size:14px;line-height:1.6;background:white;';

  // Split HTML into blocks at page-break markers and top-level elements
  var sections = splitHtmlIntoPageSections(html);
  var currentY = margin;
  var isFirstOnPage = true;

  for (var s = 0; s < sections.length; s++) {
    var section = sections[s];

    // Handle explicit page break
    if (section.isPageBreak) {
      pdf.addPage();
      currentY = margin;
      isFirstOnPage = true;
      continue;
    }

    // Render this block to canvas
    var tempDiv = document.createElement('div');
    tempDiv.style.cssText = baseCss + 'padding-top:20px;padding-bottom:20px;';
    tempDiv.innerHTML = section.html;
    document.body.appendChild(tempDiv);

    await new Promise(function(resolve) { setTimeout(resolve, 50); });

    var canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: tempDiv.scrollWidth,
      windowHeight: tempDiv.scrollHeight
    });

    document.body.removeChild(tempDiv);

    var blockImgHeight = (canvas.height * imgWidth) / canvas.width;

    // If block fits on current page
    if (currentY + blockImgHeight <= pageHeight - margin) {
      var imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, blockImgHeight);
      currentY += blockImgHeight;
      isFirstOnPage = false;
    }
    // If block is too tall for any single page, split it (fallback)
    else if (blockImgHeight > availableHeight) {
      if (!isFirstOnPage) {
        pdf.addPage();
        currentY = margin;
      }
      // Crop the big block across pages
      var yOffset = 0;
      while (yOffset < blockImgHeight) {
        if (yOffset > 0) {
          pdf.addPage();
          currentY = margin;
        }
        var remainH = Math.min(availableHeight, blockImgHeight - yOffset);
        var sourceY = (yOffset / blockImgHeight) * canvas.height;
        var sourceH = (remainH / blockImgHeight) * canvas.height;

        var cropCanvas = document.createElement('canvas');
        cropCanvas.width = canvas.width;
        cropCanvas.height = Math.ceil(sourceH);
        var ctx = cropCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, Math.ceil(sourceH));

        var cropImgData = cropCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(cropImgData, 'JPEG', margin, margin, imgWidth, remainH);

        yOffset += availableHeight;
      }
      currentY = margin + (blockImgHeight % availableHeight || availableHeight);
      isFirstOnPage = false;
    }
    // Block doesn't fit on current page but fits on a fresh page
    else {
      pdf.addPage();
      currentY = margin;
      var imgData2 = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData2, 'JPEG', margin, currentY, imgWidth, blockImgHeight);
      currentY += blockImgHeight;
      isFirstOnPage = false;
    }
  }
}

function splitHtmlIntoPageSections(html) {
  // Create a temporary container to parse the HTML
  var container = document.createElement('div');
  container.innerHTML = html;

  var sections = [];
  var currentHtml = '';

  var children = container.childNodes;
  for (var i = 0; i < children.length; i++) {
    var node = children[i];

    // Check for explicit page break (hr with page-break-after or page-break-before)
    if (node.nodeType === 1) { // Element node
      var style = node.getAttribute('style') || '';
      var tagName = node.tagName.toLowerCase();

      // Detect page break elements (manual markers, Word imports, hr with page-break)
      var classList = node.className || '';
      if (classList.indexOf('page-break-marker') !== -1 ||
          style.indexOf('page-break-after') !== -1 ||
          style.indexOf('page-break-before') !== -1 ||
          (tagName === 'hr' && style.indexOf('page-break') !== -1)) {
        // Push current accumulated content
        if (currentHtml.trim()) {
          sections.push({ html: currentHtml, isPageBreak: false });
          currentHtml = '';
        }
        sections.push({ html: '', isPageBreak: true });
        continue;
      }

      // Group small elements together, but keep tables and large blocks separate
      if (tagName === 'table' || tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
        // Push accumulated content first
        if (currentHtml.trim()) {
          sections.push({ html: currentHtml, isPageBreak: false });
          currentHtml = '';
        }
        // Push this block element as its own section
        sections.push({ html: node.outerHTML, isPageBreak: false });
        continue;
      }
    }

    // Accumulate content (paragraphs, text, inline elements)
    if (node.nodeType === 1) {
      currentHtml += node.outerHTML;
    } else if (node.nodeType === 3 && node.textContent.trim()) {
      currentHtml += node.textContent;
    }

    // Flush accumulated content every few paragraphs to keep blocks manageable
    var tempCheck = document.createElement('div');
    tempCheck.innerHTML = currentHtml;
    var pCount = tempCheck.querySelectorAll('p, li, blockquote, div').length;
    if (pCount >= 5) {
      sections.push({ html: currentHtml, isPageBreak: false });
      currentHtml = '';
    }
  }

  // Push remaining content
  if (currentHtml.trim()) {
    sections.push({ html: currentHtml, isPageBreak: false });
  }

  // If no sections were created, return the whole HTML as one section
  if (sections.length === 0) {
    sections.push({ html: html, isPageBreak: false });
  }

  return sections;
}
