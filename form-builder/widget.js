// Widget Grist - Form Builder Pro
// Copiez ce code dans l'onglet JavaScript d'un widget personnalisé Grist

/**
 * Grist Form Builder Pro Widget
 * Copyright 2026 Said Hamadou
 * Licensed under the Apache License, Version 2.0
 * https://github.com/isaytoo/grist-form-builder-widget
 */

// Variables globales
let availableTables = [];
let currentTable = null;
let tableColumns = [];
let formFields = [];
let selectedField = null;
let draggedData = null;
let formConfig = null;
let templates = [];
let snapToGrid = true;
let showGrid = true;
let zoomLevel = 100;
let fieldIdCounter = 0;

// Éléments DOM
const tableSelect = document.getElementById('table-select');
const fieldsList = document.getElementById('fields-list');
const formCanvas = document.getElementById('form-canvas');
const emptyMessage = document.getElementById('empty-message');
const propertiesContent = document.getElementById('properties-content');
const editorView = document.getElementById('editor-view');
const formView = document.getElementById('form-view');
const formFieldsView = document.getElementById('form-fields-view');
const formTitleInput = document.getElementById('form-title-input');
const toast = document.getElementById('toast');
const loading = document.getElementById('loading');
const modalTemplates = document.getElementById('modal-templates');
const templatesList = document.getElementById('templates-list');
const templateNameInput = document.getElementById('template-name');

// Boutons
const btnModeEdit = document.getElementById('btn-mode-edit');
const btnModeFill = document.getElementById('btn-mode-fill');
const btnSave = document.getElementById('btn-save');
const btnClear = document.getElementById('btn-clear');
const btnSubmit = document.getElementById('btn-submit');
const btnResetForm = document.getElementById('btn-reset-form');
const btnGrid = document.getElementById('btn-grid');
const btnSnap = document.getElementById('btn-snap');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnTemplates = document.getElementById('btn-templates');
const btnExportPdf = document.getElementById('btn-export-pdf');
const btnSaveTemplate = document.getElementById('btn-save-template');
const btnCloseTemplates = document.getElementById('btn-close-templates');

// Tabs sidebar
const sidebarTabs = document.querySelectorAll('.sidebar-tab');
const tabPanels = document.querySelectorAll('.tab-panel');

// Éléments draggables
const elementItems = document.querySelectorAll('.element-item');

// Initialisation Grist
grist.ready({
  requiredAccess: 'full',
  allowSelectBy: true
});

// Charger les données au démarrage
grist.onOptions(async function(options) {
  formConfig = options || {};
  templates = formConfig.templates || [];
  
  await loadTables();
  
  if (formConfig.title) {
    formTitleInput.value = formConfig.title;
  }
  
  if (formConfig.fields && formConfig.fields.length > 0) {
    formFields = formConfig.fields;
    fieldIdCounter = Math.max(...formFields.map(f => parseInt(f.id.replace('field_', '')) || 0)) + 1;
    if (formConfig.tableId) {
      tableSelect.value = formConfig.tableId;
      currentTable = formConfig.tableId;
      await loadTableColumns(formConfig.tableId);
    }
    renderFormFields();
  }
  
  hideLoading();
});

// Charger la liste des tables
async function loadTables() {
  try {
    const tables = await grist.docApi.listTables();
    availableTables = tables;
    
    tableSelect.innerHTML = '<option value="">-- Sélectionner une table --</option>';
    tables.forEach(table => {
      const option = document.createElement('option');
      option.value = table;
      option.textContent = table;
      tableSelect.appendChild(option);
    });
    
    if (formConfig && formConfig.tableId) {
      tableSelect.value = formConfig.tableId;
    }
  } catch (error) {
    console.error('Erreur chargement tables:', error);
    showToast('Erreur lors du chargement des tables', 'error');
  }
}

// Charger les colonnes d'une table
async function loadTableColumns(tableId) {
  if (!tableId) {
    fieldsList.innerHTML = '<p style="color: #94a3b8; font-size: 0.85em; padding: 10px;">Sélectionnez une table</p>';
    return;
  }
  
  try {
    currentTable = tableId;
    const columns = await grist.docApi.fetchTable(tableId);
    
    const columnNames = Object.keys(columns).filter(col => 
      col !== 'id' && 
      !col.startsWith('grist') && 
      col !== 'manualSort'
    );
    tableColumns = columnNames.map(name => ({
      id: name,
      name: name,
      type: guessFieldType(columns[name])
    }));
    
    renderFieldsList();
  } catch (error) {
    console.error('Erreur chargement colonnes:', error);
    showToast('Erreur lors du chargement des colonnes', 'error');
  }
}

// Deviner le type de champ
function guessFieldType(values) {
  if (!values || values.length === 0) return 'text';
  const sample = values.find(v => v !== null && v !== undefined && v !== '');
  if (sample === undefined) return 'text';
  if (typeof sample === 'number') return 'number';
  if (typeof sample === 'boolean') return 'checkbox';
  if (typeof sample === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(sample)) return 'date';
  }
  return 'text';
}

// Icônes par type
function getFieldIcon(type) {
  const icons = {
    'text': '📝', 'textarea': '📄', 'number': '🔢', 'date': '📅',
    'email': '📧', 'phone': '📞', 'select': '📋', 'radio': '🔘',
    'checkbox': '☑️', 'signature': '✍️', 'section': '📦'
  };
  return icons[type] || '📝';
}

// Afficher la liste des champs
function renderFieldsList() {
  fieldsList.innerHTML = '';
  
  if (tableColumns.length === 0) {
    fieldsList.innerHTML = '<p style="color: #94a3b8; font-size: 0.85em; padding: 10px;">Aucun champ disponible</p>';
    return;
  }
  
  tableColumns.forEach(col => {
    const fieldItem = document.createElement('div');
    fieldItem.className = 'field-item';
    fieldItem.draggable = true;
    fieldItem.dataset.fieldId = col.id;
    fieldItem.dataset.fieldName = col.name;
    fieldItem.dataset.fieldType = col.type;
    fieldItem.dataset.isColumn = 'true';
    
    fieldItem.innerHTML = `
      <span class="field-icon">${getFieldIcon(col.type)}</span>
      <span class="field-name">${col.name}</span>
      <span class="field-type">${col.type}</span>
    `;
    
    fieldItem.addEventListener('dragstart', handleDragStart);
    fieldItem.addEventListener('dragend', handleDragEnd);
    
    fieldsList.appendChild(fieldItem);
  });
}

// Gestion du drag & drop
function handleDragStart(e) {
  const isColumn = e.target.dataset.isColumn === 'true';
  const elementType = e.target.dataset.elementType;
  
  if (isColumn) {
    draggedData = {
      type: 'column',
      columnId: e.target.dataset.fieldId,
      columnName: e.target.dataset.fieldName,
      fieldType: e.target.dataset.fieldType
    };
  } else if (elementType) {
    draggedData = {
      type: 'element',
      elementType: elementType
    };
  }
  
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'copy';
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedData = null;
}

// Événements éléments
elementItems.forEach(item => {
  item.addEventListener('dragstart', handleDragStart);
  item.addEventListener('dragend', handleDragEnd);
});

// Événements canvas
formCanvas.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  formCanvas.classList.add('drag-over');
});

formCanvas.addEventListener('dragleave', () => {
  formCanvas.classList.remove('drag-over');
});

formCanvas.addEventListener('drop', (e) => {
  e.preventDefault();
  formCanvas.classList.remove('drag-over');
  
  if (!draggedData) return;
  
  const rect = formCanvas.getBoundingClientRect();
  let x = e.clientX - rect.left - 100;
  let y = e.clientY - rect.top - 20;
  
  // Snap to grid
  if (snapToGrid) {
    x = Math.round(x / 20) * 20;
    y = Math.round(y / 20) * 20;
  }
  
  x = Math.max(0, x);
  y = Math.max(0, y);
  
  let newField;
  
  if (draggedData.type === 'column') {
    // Vérifier si la colonne existe déjà
    const existing = formFields.find(f => f.columnId === draggedData.columnId);
    if (existing) {
      showToast('Ce champ est déjà sur le formulaire', 'error');
      return;
    }
    
    newField = {
      id: 'field_' + (fieldIdCounter++),
      columnId: draggedData.columnId,
      fieldType: draggedData.fieldType,
      label: draggedData.columnName,
      x: x,
      y: y,
      width: 250,
      required: false,
      placeholder: '',
      options: [],
      validation: {},
      condition: null
    };
  } else if (draggedData.type === 'element') {
    newField = {
      id: 'field_' + (fieldIdCounter++),
      columnId: null,
      fieldType: draggedData.elementType,
      label: getDefaultLabel(draggedData.elementType),
      x: x,
      y: y,
      width: ['section', 'image'].includes(draggedData.elementType) ? 200 : (draggedData.elementType === 'title' ? 300 : 250),
      height: draggedData.elementType === 'section' ? 150 : (draggedData.elementType === 'image' ? 100 : null),
      imageData: null,
      fontSize: draggedData.elementType === 'title' ? 1.2 : null,
      required: false,
      placeholder: '',
      options: draggedData.elementType === 'select' || draggedData.elementType === 'radio' || draggedData.elementType === 'checkbox' 
        ? ['Option 1', 'Option 2', 'Option 3'] : [],
      validation: {},
      condition: null
    };
  }
  
  formFields.push(newField);
  renderFormFields();
  selectField(newField.id);
  showToast('Champ ajouté', 'success');
});

function getDefaultLabel(type) {
  const labels = {
    'text': 'Texte', 'textarea': 'Description', 'number': 'Nombre',
    'date': 'Date', 'email': 'Email', 'phone': 'Téléphone',
    'image': 'Image', 'title': 'Titre',
    'select': 'Sélection', 'radio': 'Choix', 'checkbox': 'Options',
    'signature': 'Signature', 'section': 'Section'
  };
  return labels[type] || 'Champ';
}

// Afficher les champs sur le formulaire
function renderFormFields() {
  const existingFields = formCanvas.querySelectorAll('.form-field, .form-section, .form-image, .form-title-element');
  existingFields.forEach(f => f.remove());
  
  emptyMessage.style.display = formFields.length === 0 ? 'block' : 'none';
  
  formFields.forEach(field => {
    if (field.fieldType === 'section') {
      const sectionEl = createSectionElement(field);
      formCanvas.appendChild(sectionEl);
    } else if (field.fieldType === 'image') {
      const imageEl = createImageElement(field);
      formCanvas.appendChild(imageEl);
    } else if (field.fieldType === 'title') {
      const titleEl = createTitleElement(field);
      formCanvas.appendChild(titleEl);
    } else {
      const fieldEl = createFormFieldElement(field);
      formCanvas.appendChild(fieldEl);
    }
  });
}

// Créer un élément image
function createImageElement(field) {
  const imageEl = document.createElement('div');
  imageEl.className = 'form-image';
  imageEl.dataset.fieldId = field.id;
  imageEl.style.left = field.x + 'px';
  imageEl.style.top = field.y + 'px';
  imageEl.style.width = field.width + 'px';
  imageEl.style.height = (field.height || 100) + 'px';
  
  if (field.imageData) {
    imageEl.innerHTML = `
      <button class="form-image-delete" title="Supprimer">×</button>
      <img src="${field.imageData}" alt="${field.label}" draggable="false">
      <div class="form-field-resize"></div>
    `;
  } else {
    imageEl.innerHTML = `
      <button class="form-image-delete" title="Supprimer">×</button>
      <div class="form-image-placeholder">🖼️</div>
      <div class="form-field-resize"></div>
    `;
  }
  
  imageEl.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('form-image-delete')) return;
    if (e.target.classList.contains('form-field-resize')) return;
    e.preventDefault();
    selectField(field.id);
    startDragField(e, imageEl, field);
  });
  
  imageEl.querySelector('.form-image-delete').addEventListener('click', () => {
    deleteField(field.id);
  });
  
  // Redimensionnement
  const resizeHandle = imageEl.querySelector('.form-field-resize');
  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    startResizeImage(e, imageEl, field);
  });
  
  return imageEl;
}

// Redimensionner une image (largeur + hauteur)
function startResizeImage(e, imageEl, field) {
  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = field.width;
  const startHeight = field.height || 100;
  
  function onMouseMove(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    let newWidth = startWidth + dx;
    let newHeight = startHeight + dy;
    
    if (snapToGrid) {
      newWidth = Math.round(newWidth / 20) * 20;
      newHeight = Math.round(newHeight / 20) * 20;
    }
    
    field.width = Math.max(50, newWidth);
    field.height = Math.max(50, newHeight);
    imageEl.style.width = field.width + 'px';
    imageEl.style.height = field.height + 'px';
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Créer un élément titre/texte
function createTitleElement(field) {
  const titleEl = document.createElement('div');
  titleEl.className = 'form-title-element';
  titleEl.dataset.fieldId = field.id;
  titleEl.style.left = field.x + 'px';
  titleEl.style.top = field.y + 'px';
  titleEl.style.width = field.width + 'px';
  titleEl.style.fontSize = (field.fontSize || 1.2) + 'em';
  if (field.textColor) titleEl.style.color = field.textColor;
  if (field.bgColor) {
    titleEl.style.backgroundColor = field.bgColor;
    titleEl.style.padding = '8px 12px';
    titleEl.style.borderRadius = '6px';
  }
  
  titleEl.innerHTML = `
    <button class="form-title-element-delete" title="Supprimer">×</button>
    <span>${field.label}</span>
  `;
  
  titleEl.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('form-title-element-delete')) return;
    selectField(field.id);
    startDragField(e, titleEl, field);
  });
  
  titleEl.querySelector('.form-title-element-delete').addEventListener('click', () => {
    deleteField(field.id);
  });
  
  return titleEl;
}

// Créer un élément de champ
function createFormFieldElement(field) {
  const fieldEl = document.createElement('div');
  fieldEl.className = 'form-field';
  fieldEl.dataset.fieldId = field.id;
  fieldEl.style.left = field.x + 'px';
  fieldEl.style.top = field.y + 'px';
  fieldEl.style.width = field.width + 'px';
  
  let inputHtml = '';
  
  switch (field.fieldType) {
    case 'textarea':
      inputHtml = `<textarea class="form-field-input form-field-textarea" placeholder="${field.placeholder || 'Saisir...'}" readonly></textarea>`;
      break;
    case 'select':
      inputHtml = `<select class="form-field-input" disabled>
        <option>${field.placeholder || 'Sélectionner...'}</option>
        ${field.options.map(o => `<option>${o}</option>`).join('')}
      </select>`;
      break;
    case 'radio':
    case 'checkbox':
      inputHtml = `<div class="options-preview">
        ${field.options.slice(0, 3).map(o => `
          <label class="option-item">
            <input type="${field.fieldType === 'radio' ? 'radio' : 'checkbox'}" disabled>
            <span>${o}</span>
          </label>
        `).join('')}
        ${field.options.length > 3 ? '<span style="font-size: 0.75em; color: #94a3b8;">...</span>' : ''}
      </div>`;
      break;
    case 'signature':
      inputHtml = `<div class="signature-pad">✍️ Zone de signature</div>`;
      break;
    case 'date':
      inputHtml = `<input type="date" class="form-field-input" disabled>`;
      break;
    default:
      inputHtml = `<input type="${field.fieldType === 'email' ? 'email' : field.fieldType === 'phone' ? 'tel' : 'text'}" class="form-field-input" placeholder="${field.placeholder || 'Saisir...'}" readonly>`;
  }
  
  fieldEl.innerHTML = `
    <button class="form-field-delete" title="Supprimer">×</button>
    <div class="form-field-label">${field.label}${field.required ? ' *' : ''}</div>
    ${inputHtml}
    <div class="form-field-resize"></div>
  `;
  
  // Événements
  fieldEl.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('form-field-delete')) return;
    if (e.target.classList.contains('form-field-resize')) return;
    selectField(field.id);
    startDragField(e, fieldEl, field);
  });
  
  fieldEl.querySelector('.form-field-delete').addEventListener('click', () => {
    deleteField(field.id);
  });
  
  const resizeHandle = fieldEl.querySelector('.form-field-resize');
  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    startResizeField(e, fieldEl, field);
  });
  
  return fieldEl;
}

// Créer une section
function createSectionElement(field) {
  const sectionEl = document.createElement('div');
  sectionEl.className = 'form-section';
  sectionEl.dataset.fieldId = field.id;
  sectionEl.style.left = field.x + 'px';
  sectionEl.style.top = field.y + 'px';
  sectionEl.style.width = field.width + 'px';
  sectionEl.style.height = (field.height || 150) + 'px';
  if (field.bgColor) sectionEl.style.backgroundColor = field.bgColor;
  
  sectionEl.innerHTML = `
    <button class="form-section-delete" title="Supprimer">×</button>
    <div class="form-section-title" style="${field.textColor ? 'color:' + field.textColor : ''}">${field.label}</div>
    <div class="form-field-resize"></div>
  `;
  
  sectionEl.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('form-section-delete')) return;
    if (e.target.classList.contains('form-field-resize')) return;
    selectField(field.id);
    startDragField(e, sectionEl, field);
  });
  
  sectionEl.querySelector('.form-section-delete').addEventListener('click', () => {
    deleteField(field.id);
  });
  
  // Redimensionnement
  const resizeHandle = sectionEl.querySelector('.form-field-resize');
  resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    startResizeImage(e, sectionEl, field);
  });
  
  return sectionEl;
}

// Trouver les éléments contenus dans une section
function getFieldsInSection(section) {
  const sectionLeft = section.x;
  const sectionTop = section.y;
  const sectionRight = section.x + section.width;
  const sectionBottom = section.y + (section.height || 150);
  
  return formFields.filter(f => {
    if (f.id === section.id) return false;
    if (f.fieldType === 'section') return false;
    
    // Vérifier si le centre du champ est dans la section
    const fieldCenterX = f.x + (f.width / 2);
    const fieldCenterY = f.y + 40; // Approximation du centre vertical
    
    return fieldCenterX >= sectionLeft && 
           fieldCenterX <= sectionRight && 
           fieldCenterY >= sectionTop && 
           fieldCenterY <= sectionBottom;
  });
}

// Déplacer un champ
function startDragField(e, fieldEl, field) {
  const startX = e.clientX;
  const startY = e.clientY;
  const startLeft = field.x;
  const startTop = field.y;
  
  // Si c'est une section, récupérer les éléments à l'intérieur
  let childFields = [];
  let childStartPositions = [];
  if (field.fieldType === 'section') {
    childFields = getFieldsInSection(field);
    childStartPositions = childFields.map(f => ({ id: f.id, x: f.x, y: f.y }));
  }
  
  function onMouseMove(e) {
    let dx = e.clientX - startX;
    let dy = e.clientY - startY;
    
    let newX = startLeft + dx;
    let newY = startTop + dy;
    
    if (snapToGrid) {
      newX = Math.round(newX / 20) * 20;
      newY = Math.round(newY / 20) * 20;
    }
    
    const actualDx = newX - startLeft;
    const actualDy = newY - startTop;
    
    field.x = Math.max(0, newX);
    field.y = Math.max(0, newY);
    
    fieldEl.style.left = field.x + 'px';
    fieldEl.style.top = field.y + 'px';
    
    // Déplacer aussi les éléments enfants
    if (field.fieldType === 'section') {
      childStartPositions.forEach(pos => {
        const childField = formFields.find(f => f.id === pos.id);
        if (childField) {
          childField.x = Math.max(0, pos.x + actualDx);
          childField.y = Math.max(0, pos.y + actualDy);
          const childEl = formCanvas.querySelector(`[data-field-id="${pos.id}"]`);
          if (childEl) {
            childEl.style.left = childField.x + 'px';
            childEl.style.top = childField.y + 'px';
          }
        }
      });
    }
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Redimensionner un champ
function startResizeField(e, fieldEl, field) {
  const startX = e.clientX;
  const startWidth = field.width;
  
  function onMouseMove(e) {
    const dx = e.clientX - startX;
    let newWidth = startWidth + dx;
    
    if (snapToGrid) {
      newWidth = Math.round(newWidth / 20) * 20;
    }
    
    field.width = Math.max(150, newWidth);
    fieldEl.style.width = field.width + 'px';
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// Sélectionner un champ
function selectField(fieldId) {
  const oldSelected = formCanvas.querySelector('.form-field.selected, .form-section.selected, .form-image.selected, .form-title-element.selected');
  if (oldSelected) oldSelected.classList.remove('selected');
  
  const fieldEl = formCanvas.querySelector(`[data-field-id="${fieldId}"]`);
  if (fieldEl) fieldEl.classList.add('selected');
  
  selectedField = formFields.find(f => f.id === fieldId);
  renderPropertiesPanel();
}

// Mettre au premier plan
function bringToFront(fieldId) {
  const index = formFields.findIndex(f => f.id === fieldId);
  if (index === -1 || index === formFields.length - 1) return;
  
  const field = formFields.splice(index, 1)[0];
  formFields.push(field);
  renderFormFields();
  selectField(fieldId);
  showToast('Mis au premier plan', 'success');
}

// Mettre en arrière-plan
function sendToBack(fieldId) {
  const index = formFields.findIndex(f => f.id === fieldId);
  if (index === -1 || index === 0) return;
  
  const field = formFields.splice(index, 1)[0];
  formFields.unshift(field);
  renderFormFields();
  selectField(fieldId);
  showToast('Mis en arrière-plan', 'success');
}

// Supprimer un champ
function deleteField(fieldId) {
  formFields = formFields.filter(f => f.id !== fieldId);
  selectedField = null;
  renderFormFields();
  renderPropertiesPanel();
  showToast('Champ supprimé', 'success');
}

// Panneau de propriétés
function renderPropertiesPanel() {
  if (!selectedField) {
    propertiesContent.innerHTML = '<p style="color: #94a3b8; font-size: 0.85em;">Sélectionnez un champ pour modifier ses propriétés</p>';
    return;
  }
  
  const f = selectedField;
  const isSection = f.fieldType === 'section';
  const isImage = f.fieldType === 'image';
  const isTitle = f.fieldType === 'title';
  const hasOptions = ['select', 'radio', 'checkbox'].includes(f.fieldType);
  const isDecorative = isSection || isImage || isTitle;
  
  let html = `
    <div class="property-group">
      <div class="property-label">${isTitle ? 'Texte' : 'Libellé'}</div>
      <input type="text" class="property-input" id="prop-label" value="${f.label}">
    </div>
  `;
  
  // Image upload
  if (isImage) {
    html += `
      <div class="property-group">
        <div class="property-label">Image</div>
        <input type="file" id="prop-image-upload" accept="image/*" style="font-size: 0.85em;">
        ${f.imageData ? '<p style="color: #10b981; font-size: 0.8em; margin-top: 5px;">✓ Image chargée</p>' : ''}
      </div>
    `;
  }
  
  // Taille de police pour titre
  if (isTitle) {
    html += `
      <div class="property-group">
        <div class="property-label">Taille de police (em)</div>
        <input type="number" class="property-input" id="prop-font-size" value="${f.fontSize || 1.2}" min="0.5" max="4" step="0.1">
      </div>
    `;
  }
  
  // Couleurs (pour section, titre et champs)
  if (isSection || isTitle) {
    html += `
      <div class="property-group">
        <div class="property-label">Couleur du texte</div>
        <input type="color" id="prop-text-color" value="${f.textColor || '#1e293b'}" style="width: 100%; height: 32px; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer;">
      </div>
      <div class="property-group">
        <div class="property-label">Couleur de fond</div>
        <input type="color" id="prop-bg-color" value="${f.bgColor || (isSection ? '#f8fafc' : '#ffffff')}" style="width: 100%; height: 32px; border: 1px solid #e2e8f0; border-radius: 4px; cursor: pointer;">
      </div>
    `;
  }
  
  if (!isDecorative) {
    if (f.columnId) {
      html += `
        <div class="property-group">
          <div class="property-label">Colonne Grist</div>
          <input type="text" class="property-input" value="${f.columnId}" disabled style="background: #f1f5f9;">
        </div>
      `;
    } else {
      html += `
        <div class="property-group">
          <div class="property-label">Lier à une colonne</div>
          <select class="property-select" id="prop-column">
            <option value="">-- Aucune --</option>
            ${tableColumns.map(c => `<option value="${c.id}" ${f.columnId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
      `;
    }
    
    html += `
      <div class="property-group">
        <div class="property-label">Placeholder</div>
        <input type="text" class="property-input" id="prop-placeholder" value="${f.placeholder || ''}">
      </div>
    `;
  }
  
  // Ordre d'affichage (z-index)
  html += `
    <div class="property-group">
      <div class="property-label">Ordre d'affichage</div>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-secondary" id="btn-bring-front" style="flex: 1; padding: 5px 8px; font-size: 0.75em;">⬆️ Premier plan</button>
        <button class="btn btn-secondary" id="btn-send-back" style="flex: 1; padding: 5px 8px; font-size: 0.75em;">⬇️ Arrière-plan</button>
      </div>
    </div>
  `;
  
  const widthCm = (f.width / 37.8).toFixed(1);
  html += `
    <div class="property-group">
      <div class="property-label">Largeur</div>
      <div style="display: flex; gap: 6px; align-items: center;">
        <input type="number" class="property-input" id="prop-width" value="${f.width}" min="50" max="800" style="flex: 1;">
        <span style="font-size: 0.75em; color: #64748b;">px</span>
        <input type="number" class="property-input" id="prop-width-cm" value="${widthCm}" min="1" max="21" step="0.1" style="flex: 1;">
        <span style="font-size: 0.75em; color: #64748b;">cm</span>
      </div>
    </div>
  `;
  
  if (isSection || isImage) {
    const heightCm = ((f.height || 100) / 37.8).toFixed(1);
    html += `
      <div class="property-group">
        <div class="property-label">Hauteur</div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <input type="number" class="property-input" id="prop-height" value="${f.height || 100}" min="30" max="500" style="flex: 1;">
          <span style="font-size: 0.75em; color: #64748b;">px</span>
          <input type="number" class="property-input" id="prop-height-cm" value="${heightCm}" min="1" max="29" step="0.1" style="flex: 1;">
          <span style="font-size: 0.75em; color: #64748b;">cm</span>
        </div>
      </div>
    `;
  }
  
  if (!isDecorative) {
    html += `
      <div class="property-group">
        <label class="property-checkbox">
          <input type="checkbox" id="prop-required" ${f.required ? 'checked' : ''}>
          <span>Champ obligatoire</span>
        </label>
      </div>
    `;
  }
  
  // Options pour select/radio/checkbox
  if (hasOptions) {
    html += `
      <div class="property-group">
        <div class="property-label">Options</div>
        <div class="options-editor" id="options-editor">
          ${f.options.map((opt, i) => `
            <div class="option-row">
              <input type="text" value="${opt}" data-index="${i}">
              <button data-index="${i}">×</button>
            </div>
          `).join('')}
          <button class="add-option-btn" id="btn-add-option">+ Ajouter une option</button>
        </div>
      </div>
    `;
  }
  
  // Validation
  if (!isSection && f.fieldType !== 'signature') {
    html += `
      <div class="property-group">
        <div class="property-label">Validation</div>
        <select class="property-select" id="prop-validation-type">
          <option value="">Aucune</option>
          <option value="email" ${f.validation?.type === 'email' ? 'selected' : ''}>Email</option>
          <option value="phone" ${f.validation?.type === 'phone' ? 'selected' : ''}>Téléphone</option>
          <option value="min" ${f.validation?.type === 'min' ? 'selected' : ''}>Valeur minimum</option>
          <option value="max" ${f.validation?.type === 'max' ? 'selected' : ''}>Valeur maximum</option>
          <option value="regex" ${f.validation?.type === 'regex' ? 'selected' : ''}>Expression régulière</option>
        </select>
      </div>
      <div class="property-group" id="validation-value-group" style="display: ${f.validation?.type && ['min', 'max', 'regex'].includes(f.validation.type) ? 'block' : 'none'};">
        <div class="property-label">Valeur de validation</div>
        <input type="text" class="property-input" id="prop-validation-value" value="${f.validation?.value || ''}">
      </div>
    `;
  }
  
  // Condition d'affichage
  if (!isSection) {
    const otherFields = formFields.filter(of => of.id !== f.id && of.columnId);
    html += `
      <div class="property-group">
        <div class="property-label">Condition d'affichage</div>
        <select class="property-select" id="prop-condition-field">
          <option value="">Toujours visible</option>
          ${otherFields.map(of => `<option value="${of.id}" ${f.condition?.fieldId === of.id ? 'selected' : ''}>${of.label}</option>`).join('')}
        </select>
      </div>
      <div id="condition-details" style="display: ${f.condition ? 'block' : 'none'};">
        <div class="property-group">
          <div class="property-label">Opérateur</div>
          <select class="property-select" id="prop-condition-operator">
            <option value="equals" ${f.condition?.operator === 'equals' ? 'selected' : ''}>Égal à</option>
            <option value="not_equals" ${f.condition?.operator === 'not_equals' ? 'selected' : ''}>Différent de</option>
            <option value="contains" ${f.condition?.operator === 'contains' ? 'selected' : ''}>Contient</option>
            <option value="not_empty" ${f.condition?.operator === 'not_empty' ? 'selected' : ''}>Non vide</option>
          </select>
        </div>
        <div class="property-group" id="condition-value-group">
          <div class="property-label">Valeur</div>
          <input type="text" class="property-input" id="prop-condition-value" value="${f.condition?.value || ''}">
        </div>
      </div>
    `;
  }
  
  propertiesContent.innerHTML = html;
  
  // Event listeners
  document.getElementById('prop-label')?.addEventListener('input', (e) => {
    selectedField.label = e.target.value;
    // Mettre à jour le texte directement sans re-render complet
    const fieldEl = formCanvas.querySelector(`[data-field-id="${selectedField.id}"]`);
    if (fieldEl) {
      if (selectedField.fieldType === 'title') {
        const span = fieldEl.querySelector('span');
        if (span) span.textContent = e.target.value;
      } else if (selectedField.fieldType === 'section') {
        const title = fieldEl.querySelector('.form-section-title');
        if (title) title.textContent = e.target.value;
      } else {
        const label = fieldEl.querySelector('.form-field-label');
        if (label) label.textContent = e.target.value + (selectedField.required ? ' *' : '');
      }
    }
  });
  
  document.getElementById('prop-placeholder')?.addEventListener('input', (e) => {
    selectedField.placeholder = e.target.value;
    renderFormFields();
    selectField(selectedField.id);
  });
  
  document.getElementById('prop-width')?.addEventListener('input', (e) => {
    selectedField.width = parseInt(e.target.value) || 200;
    // Mettre à jour le champ cm
    const cmInput = document.getElementById('prop-width-cm');
    if (cmInput) cmInput.value = (selectedField.width / 37.8).toFixed(1);
    renderFormFields();
    selectField(selectedField.id);
  });
  
  document.getElementById('prop-width-cm')?.addEventListener('change', (e) => {
    const cm = parseFloat(e.target.value) || 5;
    selectedField.width = Math.round(cm * 37.8);
    // Mettre à jour le champ px
    const pxInput = document.getElementById('prop-width');
    if (pxInput) pxInput.value = selectedField.width;
    renderFormFields();
    selectField(selectedField.id);
  });
  
  document.getElementById('prop-height')?.addEventListener('input', (e) => {
    selectedField.height = parseInt(e.target.value) || 150;
    // Mettre à jour le champ cm
    const cmInput = document.getElementById('prop-height-cm');
    if (cmInput) cmInput.value = (selectedField.height / 37.8).toFixed(1);
    renderFormFields();
    selectField(selectedField.id);
  });
  
  document.getElementById('prop-height-cm')?.addEventListener('change', (e) => {
    const cm = parseFloat(e.target.value) || 3;
    selectedField.height = Math.round(cm * 37.8);
    // Mettre à jour le champ px
    const pxInput = document.getElementById('prop-height');
    if (pxInput) pxInput.value = selectedField.height;
    renderFormFields();
    selectField(selectedField.id);
  });
  
  // Upload image
  document.getElementById('prop-image-upload')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        selectedField.imageData = event.target.result;
        renderFormFields();
        selectField(selectedField.id);
        renderPropertiesPanel();
        showToast('Image chargée', 'success');
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Taille de police
  document.getElementById('prop-font-size')?.addEventListener('input', (e) => {
    selectedField.fontSize = parseFloat(e.target.value) || 1.2;
    renderFormFields();
    selectField(selectedField.id);
  });
  
  // Couleur du texte
  document.getElementById('prop-text-color')?.addEventListener('input', (e) => {
    selectedField.textColor = e.target.value;
    renderFormFields();
    selectField(selectedField.id);
  });
  
  // Couleur de fond
  document.getElementById('prop-bg-color')?.addEventListener('input', (e) => {
    selectedField.bgColor = e.target.value;
    renderFormFields();
    selectField(selectedField.id);
  });
  
  // Ordre d'affichage
  document.getElementById('btn-bring-front')?.addEventListener('click', () => {
    bringToFront(selectedField.id);
  });
  
  document.getElementById('btn-send-back')?.addEventListener('click', () => {
    sendToBack(selectedField.id);
  });
  
  document.getElementById('prop-required')?.addEventListener('change', (e) => {
    selectedField.required = e.target.checked;
    renderFormFields();
    selectField(selectedField.id);
  });
  
  document.getElementById('prop-column')?.addEventListener('change', (e) => {
    selectedField.columnId = e.target.value || null;
    // Mettre à jour le libellé avec le nom de la colonne
    if (e.target.value) {
      selectedField.label = e.target.value;
      document.getElementById('prop-label').value = e.target.value;
      renderFormFields();
      selectField(selectedField.id);
    }
  });
  
  // Options
  if (hasOptions) {
    document.querySelectorAll('#options-editor .option-row input').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        selectedField.options[index] = e.target.value;
        renderFormFields();
        selectField(selectedField.id);
      });
    });
    
    document.querySelectorAll('#options-editor .option-row button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        selectedField.options.splice(index, 1);
        renderPropertiesPanel();
        renderFormFields();
        selectField(selectedField.id);
      });
    });
    
    document.getElementById('btn-add-option')?.addEventListener('click', () => {
      selectedField.options.push('Nouvelle option');
      renderPropertiesPanel();
      renderFormFields();
      selectField(selectedField.id);
    });
  }
  
  // Validation
  document.getElementById('prop-validation-type')?.addEventListener('change', (e) => {
    const type = e.target.value;
    selectedField.validation = type ? { type: type, value: '' } : {};
    const valueGroup = document.getElementById('validation-value-group');
    if (valueGroup) {
      valueGroup.style.display = ['min', 'max', 'regex'].includes(type) ? 'block' : 'none';
    }
  });
  
  document.getElementById('prop-validation-value')?.addEventListener('input', (e) => {
    if (selectedField.validation) {
      selectedField.validation.value = e.target.value;
    }
  });
  
  // Conditions
  document.getElementById('prop-condition-field')?.addEventListener('change', (e) => {
    const fieldId = e.target.value;
    if (fieldId) {
      selectedField.condition = { fieldId: fieldId, operator: 'equals', value: '' };
      document.getElementById('condition-details').style.display = 'block';
    } else {
      selectedField.condition = null;
      document.getElementById('condition-details').style.display = 'none';
    }
  });
  
  document.getElementById('prop-condition-operator')?.addEventListener('change', (e) => {
    if (selectedField.condition) {
      selectedField.condition.operator = e.target.value;
      const valueGroup = document.getElementById('condition-value-group');
      if (valueGroup) {
        valueGroup.style.display = e.target.value === 'not_empty' ? 'none' : 'block';
      }
    }
  });
  
  document.getElementById('prop-condition-value')?.addEventListener('input', (e) => {
    if (selectedField.condition) {
      selectedField.condition.value = e.target.value;
    }
  });
}

// Sauvegarder la configuration
async function saveFormConfig() {
  if (!currentTable) {
    showToast('Veuillez sélectionner une table', 'error');
    return;
  }
  
  const config = {
    tableId: currentTable,
    fields: formFields,
    title: formTitleInput.value || 'Formulaire ' + currentTable,
    templates: templates
  };
  
  try {
    await grist.setOptions(config);
    formConfig = config;
    showToast('Configuration sauvegardée', 'success');
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    showToast('Erreur lors de la sauvegarde', 'error');
  }
}

// Vider le formulaire
async function clearForm() {
  if (formFields.length === 0) return;
  
  const confirmed = await showConfirm({
    icon: '🗑️',
    title: 'Vider le formulaire',
    message: 'Voulez-vous vraiment supprimer tous les champs ?',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    danger: true
  });
  
  if (confirmed) {
    formFields = [];
    selectedField = null;
    renderFormFields();
    renderPropertiesPanel();
    showToast('Formulaire vidé', 'success');
  }
}

// Basculer entre les modes
function switchMode(mode) {
  if (mode === 'edit') {
    editorView.classList.remove('hidden');
    formView.classList.remove('active');
    btnModeEdit.classList.add('active');
    btnModeFill.classList.remove('active');
  } else {
    editorView.classList.add('hidden');
    formView.classList.add('active');
    btnModeEdit.classList.remove('active');
    btnModeFill.classList.add('active');
    renderFormView();
  }
}

// Afficher le formulaire de saisie
function renderFormView() {
  if (!formConfig || !formConfig.fields || formConfig.fields.length === 0) {
    formFieldsView.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 40px;">Aucun formulaire configuré.</p>';
    return;
  }
  
  formFieldsView.innerHTML = '';
  
  // Calculer la hauteur minimale du canvas
  let maxY = 297; // A4 height in mm (converted to approximate px later)
  formConfig.fields.forEach(field => {
    const fieldBottom = field.y + (field.height || 80);
    if (fieldBottom > maxY) maxY = fieldBottom;
  });
  
  const canvasView = document.getElementById('form-canvas-view');
  canvasView.style.minHeight = Math.max(maxY + 100, 800) + 'px';
  
  formConfig.fields.forEach(field => {
    if (field.fieldType === 'section') {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'form-section-view';
      sectionDiv.style.position = 'absolute';
      sectionDiv.style.left = field.x + 'px';
      sectionDiv.style.top = field.y + 'px';
      sectionDiv.style.width = field.width + 'px';
      sectionDiv.style.height = (field.height || 150) + 'px';
      if (field.bgColor) sectionDiv.style.backgroundColor = field.bgColor;
      sectionDiv.innerHTML = `<div class="form-section-view-title" style="${field.textColor ? 'color:' + field.textColor : ''}">${field.label}</div>`;
      formFieldsView.appendChild(sectionDiv);
      return;
    }
    
    // Image
    if (field.fieldType === 'image') {
      const imageDiv = document.createElement('div');
      imageDiv.style.position = 'absolute';
      imageDiv.style.left = field.x + 'px';
      imageDiv.style.top = field.y + 'px';
      imageDiv.style.width = field.width + 'px';
      imageDiv.style.height = (field.height || 100) + 'px';
      if (field.imageData) {
        imageDiv.innerHTML = `<img src="${field.imageData}" alt="${field.label}" style="width: 100%; height: 100%; object-fit: contain;">`;
      }
      formFieldsView.appendChild(imageDiv);
      return;
    }
    
    // Titre/Texte
    if (field.fieldType === 'title') {
      const titleDiv = document.createElement('div');
      titleDiv.style.position = 'absolute';
      titleDiv.style.left = field.x + 'px';
      titleDiv.style.top = field.y + 'px';
      titleDiv.style.width = field.width + 'px';
      titleDiv.style.fontSize = (field.fontSize || 1.2) + 'em';
      titleDiv.style.fontWeight = '600';
      titleDiv.style.color = field.textColor || '#1e293b';
      if (field.bgColor) {
        titleDiv.style.backgroundColor = field.bgColor;
        titleDiv.style.padding = '8px 12px';
        titleDiv.style.borderRadius = '6px';
      }
      titleDiv.textContent = field.label;
      formFieldsView.appendChild(titleDiv);
      return;
    }
    
    const group = document.createElement('div');
    group.className = 'form-field-view';
    group.dataset.fieldId = field.id;
    group.style.left = field.x + 'px';
    group.style.top = field.y + 'px';
    group.style.width = field.width + 'px';
    
    if (field.condition) {
      group.dataset.conditionFieldId = field.condition.fieldId;
      group.dataset.conditionOperator = field.condition.operator;
      group.dataset.conditionValue = field.condition.value || '';
    }
    
    let inputHtml = '';
    
    switch (field.fieldType) {
      case 'textarea':
        inputHtml = `<textarea id="input-${field.id}" class="form-textarea-input" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''} style="min-height: 60px;"></textarea>`;
        break;
      case 'select':
        inputHtml = `<select id="input-${field.id}" class="form-select" ${field.required ? 'required' : ''}>
          <option value="">${field.placeholder || 'Sélectionner...'}</option>
          ${field.options.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>`;
        break;
      case 'radio':
        inputHtml = `<div class="form-radio-group" id="input-${field.id}">
          ${field.options.map((o, i) => `
            <label class="form-radio-item">
              <input type="radio" name="radio-${field.id}" value="${o}">
              <span>${o}</span>
            </label>
          `).join('')}
        </div>`;
        break;
      case 'checkbox':
        inputHtml = `<div class="form-checkbox-group" id="input-${field.id}">
          ${field.options.map(o => `
            <label class="form-checkbox-item">
              <input type="checkbox" value="${o}">
              <span>${o}</span>
            </label>
          `).join('')}
        </div>`;
        break;
      case 'signature':
        inputHtml = `
          <div class="signature-canvas-container">
            <canvas id="input-${field.id}" class="signature-canvas"></canvas>
            <button type="button" class="signature-clear" data-canvas="input-${field.id}">Effacer</button>
          </div>
        `;
        break;
      case 'date':
        inputHtml = `<input type="date" id="input-${field.id}" class="form-input" ${field.required ? 'required' : ''}>`;
        break;
      case 'number':
        inputHtml = `<input type="number" id="input-${field.id}" class="form-input" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
        break;
      case 'email':
        inputHtml = `<input type="email" id="input-${field.id}" class="form-input" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
        break;
      case 'phone':
        inputHtml = `<input type="tel" id="input-${field.id}" class="form-input" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
        break;
      default:
        inputHtml = `<input type="text" id="input-${field.id}" class="form-input" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
    }
    
    group.innerHTML = `
      <label class="form-label ${field.required ? 'required' : ''}" for="input-${field.id}">${field.label}</label>
      ${inputHtml}
      <div class="form-error" id="error-${field.id}"></div>
    `;
    
    formFieldsView.appendChild(group);
  });
  
  // Initialiser les signatures
  initSignatureCanvases();
  
  // Initialiser les conditions
  initConditions();
}

// Initialiser les canvas de signature
function initSignatureCanvases() {
  document.querySelectorAll('.signature-canvas').forEach(canvas => {
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      [lastX, lastY] = [e.offsetX, e.offsetY];
    });
    
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);
  });
  
  document.querySelectorAll('.signature-clear').forEach(btn => {
    btn.addEventListener('click', () => {
      const canvasId = btn.dataset.canvas;
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  });
}

// Initialiser les conditions d'affichage
function initConditions() {
  document.querySelectorAll('.form-field-view[data-condition-field-id]').forEach(group => {
    const conditionFieldId = group.dataset.conditionFieldId;
    const operator = group.dataset.conditionOperator;
    const value = group.dataset.conditionValue;
    
    const sourceField = formConfig.fields.find(f => f.id === conditionFieldId);
    if (!sourceField) return;
    
    const sourceInput = document.getElementById(`input-${conditionFieldId}`);
    if (!sourceInput) return;
    
    function checkCondition() {
      let sourceValue = '';
      
      if (sourceField.fieldType === 'radio') {
        const checked = sourceInput.querySelector('input:checked');
        sourceValue = checked ? checked.value : '';
      } else if (sourceField.fieldType === 'checkbox') {
        const checked = sourceInput.querySelectorAll('input:checked');
        sourceValue = Array.from(checked).map(c => c.value).join(',');
      } else {
        sourceValue = sourceInput.value || '';
      }
      
      let visible = false;
      
      switch (operator) {
        case 'equals':
          visible = sourceValue === value;
          break;
        case 'not_equals':
          visible = sourceValue !== value;
          break;
        case 'contains':
          visible = sourceValue.includes(value);
          break;
        case 'not_empty':
          visible = sourceValue !== '';
          break;
      }
      
      group.classList.toggle('hidden', !visible);
    }
    
    // Écouter les changements
    if (sourceField.fieldType === 'radio' || sourceField.fieldType === 'checkbox') {
      sourceInput.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', checkCondition);
      });
    } else {
      sourceInput.addEventListener('input', checkCondition);
      sourceInput.addEventListener('change', checkCondition);
    }
    
    // Vérifier au chargement
    checkCondition();
  });
}

// Soumettre le formulaire
async function submitForm() {
  if (!formConfig || !formConfig.tableId) {
    showToast('Configuration invalide', 'error');
    return;
  }
  
  const record = {};
  let hasError = false;
  
  formConfig.fields.forEach(field => {
    if (field.fieldType === 'section') return;
    if (!field.columnId) return;
    
    const group = document.querySelector(`.form-field-view[data-field-id="${field.id}"]`);
    if (group && group.classList.contains('hidden')) return;
    
    const errorEl = document.getElementById(`error-${field.id}`);
    if (errorEl) errorEl.textContent = '';
    
    let value = null;
    
    if (field.fieldType === 'radio') {
      const container = document.getElementById(`input-${field.id}`);
      const checked = container?.querySelector('input:checked');
      value = checked ? checked.value : null;
    } else if (field.fieldType === 'checkbox') {
      const container = document.getElementById(`input-${field.id}`);
      const checked = container?.querySelectorAll('input:checked');
      value = checked ? Array.from(checked).map(c => c.value) : [];
    } else if (field.fieldType === 'signature') {
      const canvas = document.getElementById(`input-${field.id}`);
      if (canvas) {
        value = canvas.toDataURL();
      }
    } else {
      const input = document.getElementById(`input-${field.id}`);
      if (input) {
        if (field.fieldType === 'number') {
          value = input.value ? parseFloat(input.value) : null;
        } else {
          value = input.value || null;
        }
      }
    }
    
    // Validation obligatoire
    if (field.required) {
      const isEmpty = value === null || value === '' || (Array.isArray(value) && value.length === 0);
      if (isEmpty) {
        if (errorEl) errorEl.textContent = 'Ce champ est obligatoire';
        hasError = true;
      }
    }
    
    // Validation personnalisée
    if (value && field.validation?.type) {
      let isValid = true;
      let errorMsg = '';
      
      switch (field.validation.type) {
        case 'email':
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          errorMsg = 'Email invalide';
          break;
        case 'phone':
          isValid = /^[\d\s\+\-\(\)]{10,}$/.test(value);
          errorMsg = 'Téléphone invalide';
          break;
        case 'min':
          isValid = parseFloat(value) >= parseFloat(field.validation.value);
          errorMsg = `Valeur minimum: ${field.validation.value}`;
          break;
        case 'max':
          isValid = parseFloat(value) <= parseFloat(field.validation.value);
          errorMsg = `Valeur maximum: ${field.validation.value}`;
          break;
        case 'regex':
          try {
            isValid = new RegExp(field.validation.value).test(value);
            errorMsg = 'Format invalide';
          } catch (e) {
            isValid = true;
          }
          break;
      }
      
      if (!isValid) {
        if (errorEl) errorEl.textContent = errorMsg;
        hasError = true;
      }
    }
    
    record[field.columnId] = Array.isArray(value) ? value.join(', ') : value;
  });
  
  if (hasError) {
    showToast('Veuillez corriger les erreurs', 'error');
    return;
  }
  
  try {
    showLoading();
    await grist.docApi.applyUserActions([
      ['AddRecord', formConfig.tableId, null, record]
    ]);
    hideLoading();
    showToast('Enregistrement ajouté avec succès', 'success');
    resetFormInputs();
  } catch (error) {
    hideLoading();
    console.error('Erreur soumission:', error);
    showToast('Erreur: ' + error.message, 'error');
  }
}

// Réinitialiser les champs
function resetFormInputs() {
  if (!formConfig || !formConfig.fields) return;
  
  formConfig.fields.forEach(field => {
    if (field.fieldType === 'section') return;
    
    const errorEl = document.getElementById(`error-${field.id}`);
    if (errorEl) errorEl.textContent = '';
    
    if (field.fieldType === 'radio' || field.fieldType === 'checkbox') {
      const container = document.getElementById(`input-${field.id}`);
      if (container) {
        container.querySelectorAll('input').forEach(input => input.checked = false);
      }
    } else if (field.fieldType === 'signature') {
      const canvas = document.getElementById(`input-${field.id}`);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      const input = document.getElementById(`input-${field.id}`);
      if (input) input.value = '';
    }
  });
  
  // Réinitialiser les conditions
  initConditions();
}

// Export PDF
async function exportPdf() {
  if (formFields.length === 0) {
    showToast('Aucun formulaire à exporter', 'error');
    return;
  }
  
  showLoading();
  
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Capturer le canvas
    const canvas = await html2canvas(formCanvas, {
      scale: 2,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save('formulaire.pdf');
    
    hideLoading();
    showToast('PDF exporté', 'success');
  } catch (error) {
    hideLoading();
    console.error('Erreur export PDF:', error);
    showToast('Erreur lors de l\'export PDF', 'error');
  }
}

// Templates
function openTemplatesModal() {
  renderTemplatesList();
  modalTemplates.classList.remove('hidden');
}

function closeTemplatesModal() {
  modalTemplates.classList.add('hidden');
}

function renderTemplatesList() {
  if (templates.length === 0) {
    templatesList.innerHTML = '<p style="color: #94a3b8; font-size: 0.85em; text-align: center; padding: 20px;">Aucun template</p>';
    return;
  }
  
  templatesList.innerHTML = templates.map((t, i) => `
    <div class="template-item" data-index="${i}">
      <div class="template-name">${t.name}</div>
      <div class="template-date">${t.date}</div>
    </div>
  `).join('');
  
  templatesList.querySelectorAll('.template-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      loadTemplate(index);
    });
  });
}

function saveTemplate() {
  const name = templateNameInput.value.trim();
  if (!name) {
    showToast('Veuillez entrer un nom', 'error');
    return;
  }
  
  if (formFields.length === 0) {
    showToast('Aucun champ à sauvegarder', 'error');
    return;
  }
  
  templates.push({
    name: name,
    date: new Date().toLocaleDateString('fr-FR'),
    fields: JSON.parse(JSON.stringify(formFields)),
    tableId: currentTable
  });
  
  templateNameInput.value = '';
  renderTemplatesList();
  saveFormConfig();
  showToast('Template sauvegardé', 'success');
}

async function loadTemplate(index) {
  const template = templates[index];
  if (!template) return;
  
  if (formFields.length > 0) {
    const confirmed = await showConfirm({
      icon: '📄',
      title: 'Charger le template',
      message: 'Cela remplacera le formulaire actuel. Continuer ?',
      confirmText: 'Charger',
      cancelText: 'Annuler'
    });
    if (!confirmed) return;
  }
  
  formFields = JSON.parse(JSON.stringify(template.fields));
  if (template.tableId) {
    tableSelect.value = template.tableId;
    currentTable = template.tableId;
    loadTableColumns(template.tableId);
  }
  
  renderFormFields();
  closeTemplatesModal();
  showToast('Template chargé', 'success');
}

// Utilitaires
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = 'toast ' + type + ' show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showLoading() {
  loading.classList.remove('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
}

// Modal de confirmation personnalisée
let confirmResolve = null;
const modalConfirm = document.getElementById('modal-confirm');
const confirmIcon = document.getElementById('confirm-icon');
const confirmTitle = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const btnConfirmOk = document.getElementById('btn-confirm-ok');
const btnConfirmCancel = document.getElementById('btn-confirm-cancel');

function showConfirm(options = {}) {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    confirmIcon.textContent = options.icon || '⚠️';
    confirmTitle.textContent = options.title || 'Confirmation';
    confirmMessage.textContent = options.message || 'Êtes-vous sûr ?';
    btnConfirmOk.textContent = options.confirmText || 'Confirmer';
    btnConfirmCancel.textContent = options.cancelText || 'Annuler';
    
    if (options.danger) {
      btnConfirmOk.classList.add('danger');
    } else {
      btnConfirmOk.classList.remove('danger');
    }
    
    modalConfirm.classList.remove('hidden');
  });
}

function closeConfirm(result) {
  modalConfirm.classList.add('hidden');
  if (confirmResolve) {
    confirmResolve(result);
    confirmResolve = null;
  }
}

btnConfirmOk.addEventListener('click', () => closeConfirm(true));
btnConfirmCancel.addEventListener('click', () => closeConfirm(false));
modalConfirm.addEventListener('click', (e) => {
  if (e.target === modalConfirm) closeConfirm(false);
});

// Event listeners
tableSelect.addEventListener('change', (e) => loadTableColumns(e.target.value));

btnModeEdit.addEventListener('click', () => switchMode('edit'));
btnModeFill.addEventListener('click', () => switchMode('fill'));
btnSave.addEventListener('click', saveFormConfig);
btnClear.addEventListener('click', clearForm);
btnSubmit.addEventListener('click', submitForm);
btnResetForm.addEventListener('click', resetFormInputs);
btnExportPdf.addEventListener('click', exportPdf);
btnTemplates.addEventListener('click', openTemplatesModal);
btnSaveTemplate.addEventListener('click', saveTemplate);
btnCloseTemplates.addEventListener('click', closeTemplatesModal);

// Grille et snap
btnGrid.addEventListener('click', () => {
  showGrid = !showGrid;
  formCanvas.classList.toggle('show-grid', showGrid);
  btnGrid.classList.toggle('active', showGrid);
});

btnSnap.addEventListener('click', () => {
  snapToGrid = !snapToGrid;
  btnSnap.classList.toggle('active', snapToGrid);
});

// Zoom
btnZoomIn.addEventListener('click', () => {
  if (zoomLevel < 150) {
    zoomLevel += 10;
    formCanvas.style.transform = `scale(${zoomLevel / 100})`;
    document.getElementById('zoom-level').textContent = zoomLevel + '%';
  }
});

btnZoomOut.addEventListener('click', () => {
  if (zoomLevel > 50) {
    zoomLevel -= 10;
    formCanvas.style.transform = `scale(${zoomLevel / 100})`;
    document.getElementById('zoom-level').textContent = zoomLevel + '%';
  }
});

// Tabs sidebar
sidebarTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    sidebarTabs.forEach(t => t.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// Clic en dehors pour désélectionner
formCanvas.addEventListener('click', (e) => {
  if (e.target === formCanvas || e.target === emptyMessage || e.target.closest('.empty-message')) {
    const oldSelected = formCanvas.querySelector('.form-field.selected, .form-section.selected, .form-image.selected, .form-title-element.selected');
    if (oldSelected) oldSelected.classList.remove('selected');
    selectedField = null;
    renderPropertiesPanel();
  }
});

// Fermer modal en cliquant dehors
modalTemplates.addEventListener('click', (e) => {
  if (e.target === modalTemplates) closeTemplatesModal();
});

// Initialiser snap comme actif
btnSnap.classList.add('active');

// Règles (rulers)
const btnRulers = document.getElementById('btn-rulers');
const rulerH = document.getElementById('ruler-h');
const rulerV = document.getElementById('ruler-v');
const rulerCorner = document.getElementById('ruler-corner');
const workspace = document.getElementById('workspace');
let showRulers = false;

function generateRulerMarks() {
  const rulerHMarks = document.getElementById('ruler-h-marks');
  const rulerVMarks = document.getElementById('ruler-v-marks');
  
  // Obtenir la position de la page A4 par rapport au workspace
  const pageRect = formCanvas.getBoundingClientRect();
  const workspaceRect = workspace.getBoundingClientRect();
  
  const offsetX = pageRect.left - workspaceRect.left - 30; // -30 pour la largeur de la règle verticale
  const offsetY = pageRect.top - workspaceRect.top - 20; // -20 pour la hauteur de la règle horizontale
  
  // A4 = 21cm x 29.7cm, 1cm = 37.8px
  const cmToPx = 37.8;
  
  // Règle horizontale (21 cm)
  let hHtml = '';
  for (let i = 0; i <= 21; i++) {
    hHtml += `<div class="ruler-mark" style="left: ${offsetX + i * cmToPx}px;">${i}</div>`;
  }
  rulerHMarks.innerHTML = hHtml;
  
  // Règle verticale (29.7 cm)
  let vHtml = '';
  for (let i = 0; i <= 30; i++) {
    vHtml += `<div class="ruler-mark" style="top: ${offsetY + i * cmToPx}px;">${i}</div>`;
  }
  rulerVMarks.innerHTML = vHtml;
}

btnRulers.addEventListener('click', () => {
  showRulers = !showRulers;
  btnRulers.classList.toggle('active', showRulers);
  rulerH.classList.toggle('show', showRulers);
  rulerV.classList.toggle('show', showRulers);
  rulerCorner.classList.toggle('show', showRulers);
  workspace.classList.toggle('with-rulers', showRulers);
  
  if (showRulers) {
    setTimeout(generateRulerMarks, 50); // Attendre que le layout soit mis à jour
  }
});

// Mettre à jour les règles lors du scroll
workspace.addEventListener('scroll', () => {
  if (showRulers) {
    generateRulerMarks();
  }
});
