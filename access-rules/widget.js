/**
 * Grist Access Rules Manager Widget
 * Visual interface to manage document access rules.
 * Uses grist.docApi (Plugin API) — no external API key needed, no CORS issues.
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
    title: '🔐 Gestion des accès',
    subtitle: 'Gérez les permissions de lecture/écriture par table et colonne',
    tabUsers: '👥 Utilisateurs',
    tabTables: '📊 Tables',
    tabColumns: '📋 Colonnes',
    tabRules: '📜 Règles',
    usersTitle: '👥 Utilisateurs et rôles du document',
    tablesTitle: '📊 Permissions par table',
    columnsTitle: '📋 Permissions par colonne',
    rulesTitle: '📜 Règles d\'accès (ACL)',
    selectTable: 'Table :',
    selectTableOption: '-- Sélectionner une table --',
    selectTablePrompt: 'Sélectionnez une table pour voir les permissions par colonne',
    loading: 'Chargement...',
    noRules: 'Aucune règle d\'accès personnalisée définie',
    defaultRulesTitle: '💡 Règles par défaut',
    defaultRule1: '<strong>Propriétaire (Owner)</strong> : Accès complet (lecture, écriture, gestion)',
    defaultRule2: '<strong>Éditeur (Editor)</strong> : Lecture et écriture des données',
    defaultRule3: '<strong>Lecteur (Viewer)</strong> : Lecture seule',
    defaultRule4: 'Les règles personnalisées ci-dessus <strong>remplacent</strong> les règles par défaut',
    footerCreated: 'Créé par',
    notInGrist: '⚠️ Ce widget doit être utilisé à l\'intérieur de Grist.',
    initError: '❌ Erreur d\'initialisation : ',
    loadingData: '⏳ Chargement des données...',
    errorLoadUsers: '❌ Erreur lors du chargement des utilisateurs : ',
    errorLoadTables: '❌ Erreur lors du chargement des tables : ',
    errorLoadColumns: '❌ Erreur lors du chargement des colonnes : ',
    errorLoadRules: '❌ Erreur lors du chargement des règles : ',
    roleChanged: '✅ Rôle modifié avec succès',
    roleChangeError: '❌ Erreur lors du changement de rôle : ',
    noUsers: 'Aucun utilisateur trouvé',
    noTables: 'Aucune table trouvée',
    noColumns: 'Aucune colonne trouvée',
    usersNotAvailable: 'La gestion des utilisateurs nécessite un accès API non disponible depuis un widget. Utilisez le panneau de partage de Grist.',
    tableName: 'Table',
    columnName: 'Colonne',
    inherited: 'Hérité',
    ruleRead: 'Lecture',
    ruleWrite: 'Écriture',
    ruleCreate: 'Création',
    ruleDelete: 'Suppression',
    ruleAllowed: 'Autorisé',
    ruleDenied: 'Refusé',
    allTables: 'Toutes les tables',
    tabConfigure: '⚙️ Configurer',
    configureTitle: '⚙️ Ajouter une règle d\'accès',
    configureSubtitle: 'Configurez simplement les permissions sans écrire de formule',
    cfgScope: '1. Portée de la règle',
    cfgScopeTable: 'Toute une table',
    cfgScopeColumns: 'Colonnes spécifiques',
    cfgTable: '2. Table',
    cfgColumns: '3. Colonnes',
    cfgRole: '3. Appliquer pour le rôle',
    cfgRoleBoth: 'Editor + Viewer',
    cfgPermissions: '4. Permissions',
    cfgPreview: 'Aperçu de la règle :',
    cfgApply: '✅ Appliquer la règle',
    cfgSelectTable: '❌ Veuillez sélectionner une table',
    cfgSelectColumns: '❌ Veuillez sélectionner au moins une colonne',
    cfgApplying: '⏳ Application de la règle...',
    cfgSuccess: '✅ Règle appliquée avec succès ! Rechargez la page "Permissions avancées" pour la voir.',
    cfgError: '❌ Erreur lors de l\'application : ',
    cfgSelectAll: 'Tout sélectionner',
    cfgDeselectAll: 'Tout désélectionner',
    cfgConditionType: '3. Condition',
    cfgCondRole: 'Par rôle (Lecteur, Éditeur...)',
    cfgCondAttr: 'Par attribut utilisateur (user.UGP, user.Dept...)',
    cfgRoleViewer: 'Lecteur (Viewer)',
    cfgRoleEditor: 'Éditeur (Editor)',
    cfgRoleBoth: 'Éditeur + Lecteur',
    cfgAttrName: 'Attribut',
    cfgAttrValue: 'Valeur',
    cfgAttrValueRequired: '❌ Veuillez entrer une valeur pour l\'attribut',
    cfgSummaryTitle: '📋 Règles actives',
    cfgSummaryNone: 'Aucune règle personnalisée configurée',
    cfgSummaryAllUsers: 'Tous les utilisateurs',
    cfgSummaryAllTables: 'Toutes les tables',
    cfgSummaryWho: 'Qui',
    tabAttributes: '👤 Attributs',
    attrTitle: '👤 Propriétés d\'utilisateur',
    attrSubtitle: 'Les propriétés d\'utilisateur permettent de lier un utilisateur à des données dans une table, pour créer des règles d\'accès personnalisées.',
    attrNone: 'Aucune propriété d\'utilisateur définie',
    attrAddTitle: '➕ Ajouter une propriété d\'utilisateur',
    attrName: 'Nom de l\'attribut',
    attrNamePlaceholder: 'Ex: Departement, Equipe, Site...',
    attrCharId: 'Propriété d\'appairage (utilisateur)',
    attrTableId: 'Table d\'appairage',
    attrLookupCol: 'Colonne cible (dans la table)',
    attrSelectCol: '-- Sélectionner une colonne --',
    attrPreview: 'Aperçu :',
    attrPreviewText: 'Dans vos règles, vous pourrez utiliser :',
    attrApply: '✅ Ajouter la propriété',
    attrNameRequired: '❌ Veuillez entrer un nom pour l\'attribut',
    attrTableRequired: '❌ Veuillez sélectionner une table',
    attrColRequired: '❌ Veuillez sélectionner une colonne',
    attrApplying: '⏳ Ajout de la propriété...',
    attrSuccess: '✅ Propriété ajoutée ! Vous pouvez maintenant utiliser user.{name} dans vos règles.',
    attrError: '❌ Erreur : ',
    attrHelpTitle: '💡 Comment utiliser les attributs ?',
    attrHelp1: 'Ajoutez un attribut ci-dessus (ex: <strong>Departement</strong>). La table sera créée automatiquement.',
    attrHelp2: 'Remplissez la table générée avec les emails et les valeurs (ex: alice@mail.com → Commercial)',
    attrHelp3: 'Dans l\'onglet <strong>Configurer</strong>, utilisez <code>user.VotreAttribut</code> dans les conditions de vos règles',
    attrMode: 'Mode',
    attrModeAuto: '🚀 Automatique (crée la table pour vous)',
    attrModeManual: '🔧 Manuel (utiliser une table existante)',
    attrAutoInfo: '🚀 Ce qui sera créé automatiquement :',
    attrAutoTable: 'Table {table}',
    attrAutoCols: 'Colonnes : <strong>Email</strong> + {attr}',
    attrAutoRule: 'Propriété : {name}',
    attrSubtitle: 'Associez des attributs personnalisés aux utilisateurs pour créer des règles d\'accès avancées. La table est créée automatiquement.',
    attrDataTitle: '📝 Gérer les utilisateurs et attributs',
    attrDataSelect: 'Sélectionner un attribut :',
    attrDataEmpty: 'Aucun utilisateur enregistré. Ajoutez-en ci-dessous.',
    attrDataEmailRequired: '❌ Veuillez entrer une adresse email',
    attrDataValueRequired: '❌ Veuillez entrer une valeur',
    attrDataAdded: '✅ Utilisateur ajouté avec succès',
    attrDeleteConfirm: 'Supprimer l\'attribut "{name}" ?\n\nLa table associée ne sera pas supprimée.',
    attrDeleteWarning: '⚠️ Attention ! {count} règle(s) utilisent l\'attribut "{name}" :',
    attrDeleteConfirmForce: 'Supprimer quand même ? Les règles liées ne fonctionneront plus.',
    attrDeleteTitle: 'Supprimer "{name}"',
    attrDeleteSuccess: '✅ Attribut "{name}" supprimé',
    modalCancel: 'Annuler',
    modalDelete: 'Supprimer',
    attrStep1Title: 'Créer un attribut',
    attrStep1Desc: 'Définissez un attribut personnalisé (ex: Département, Équipe). La table sera créée automatiquement.',
    attrStep2Title: 'Associer les utilisateurs',
    attrStep2Desc: 'Saisissez les emails et les valeurs pour chaque utilisateur.',
    attrStep3Title: 'Utiliser dans les règles',
    attrStep3Desc: 'Allez dans l\'onglet <strong>⚙️ Configurer</strong> et utilisez vos attributs dans les conditions de vos règles d\'accès.'
  },
  en: {
    title: '🔐 Access Rules Manager',
    subtitle: 'Manage read/write permissions per table and column',
    tabUsers: '👥 Users',
    tabTables: '📊 Tables',
    tabColumns: '📋 Columns',
    tabRules: '📜 Rules',
    usersTitle: '👥 Document users and roles',
    tablesTitle: '📊 Permissions per table',
    columnsTitle: '📋 Permissions per column',
    rulesTitle: '📜 Access Rules (ACL)',
    selectTable: 'Table:',
    selectTableOption: '-- Select a table --',
    selectTablePrompt: 'Select a table to see column permissions',
    loading: 'Loading...',
    noRules: 'No custom access rules defined',
    defaultRulesTitle: '💡 Default rules',
    defaultRule1: '<strong>Owner</strong>: Full access (read, write, manage)',
    defaultRule2: '<strong>Editor</strong>: Read and write data',
    defaultRule3: '<strong>Viewer</strong>: Read only',
    defaultRule4: 'Custom rules above <strong>override</strong> default rules',
    footerCreated: 'Created by',
    notInGrist: '⚠️ This widget must be used inside Grist.',
    initError: '❌ Initialization error: ',
    loadingData: '⏳ Loading data...',
    errorLoadUsers: '❌ Error loading users: ',
    errorLoadTables: '❌ Error loading tables: ',
    errorLoadColumns: '❌ Error loading columns: ',
    errorLoadRules: '❌ Error loading rules: ',
    roleChanged: '✅ Role changed successfully',
    roleChangeError: '❌ Error changing role: ',
    noUsers: 'No users found',
    noTables: 'No tables found',
    noColumns: 'No columns found',
    usersNotAvailable: 'User management requires API access not available from a widget. Use the Grist sharing panel.',
    tableName: 'Table',
    columnName: 'Column',
    inherited: 'Inherited',
    ruleRead: 'Read',
    ruleWrite: 'Write',
    ruleCreate: 'Create',
    ruleDelete: 'Delete',
    ruleAllowed: 'Allowed',
    ruleDenied: 'Denied',
    allTables: 'All tables',
    tabConfigure: '⚙️ Configure',
    configureTitle: '⚙️ Add an access rule',
    configureSubtitle: 'Easily configure permissions without writing formulas',
    cfgScope: '1. Rule scope',
    cfgScopeTable: 'Entire table',
    cfgScopeColumns: 'Specific columns',
    cfgTable: '2. Table',
    cfgColumns: '3. Columns',
    cfgRole: '3. Apply for role',
    cfgRoleBoth: 'Editor + Viewer',
    cfgPermissions: '4. Permissions',
    cfgPreview: 'Rule preview:',
    cfgApply: '✅ Apply rule',
    cfgSelectTable: '❌ Please select a table',
    cfgSelectColumns: '❌ Please select at least one column',
    cfgApplying: '⏳ Applying rule...',
    cfgSuccess: '✅ Rule applied successfully! Reload the "Access Rules" page to see it.',
    cfgError: '❌ Error applying rule: ',
    cfgSelectAll: 'Select all',
    cfgDeselectAll: 'Deselect all',
    cfgConditionType: '3. Condition',
    cfgCondRole: 'By role (Viewer, Editor...)',
    cfgCondAttr: 'By user attribute (user.UGP, user.Dept...)',
    cfgRoleViewer: 'Viewer',
    cfgRoleEditor: 'Editor',
    cfgRoleBoth: 'Editor + Viewer',
    cfgAttrName: 'Attribute',
    cfgAttrValue: 'Value',
    cfgAttrValueRequired: '❌ Please enter a value for the attribute',
    cfgSummaryTitle: '📋 Active rules',
    cfgSummaryNone: 'No custom rules configured',
    cfgSummaryAllUsers: 'All users',
    cfgSummaryAllTables: 'All tables',
    cfgSummaryWho: 'Who',
    tabAttributes: '👤 Attributes',
    attrTitle: '👤 User Properties',
    attrSubtitle: 'User properties allow linking a user to data in a table, to create custom access rules.',
    attrNone: 'No user properties defined',
    attrAddTitle: '➕ Add a user property',
    attrName: 'Attribute name',
    attrNamePlaceholder: 'E.g.: Department, Team, Site...',
    attrCharId: 'User matching property',
    attrTableId: 'Matching table',
    attrLookupCol: 'Target column (in the table)',
    attrSelectCol: '-- Select a column --',
    attrPreview: 'Preview:',
    attrPreviewText: 'In your rules, you can use:',
    attrApply: '✅ Add property',
    attrNameRequired: '❌ Please enter an attribute name',
    attrTableRequired: '❌ Please select a table',
    attrColRequired: '❌ Please select a column',
    attrApplying: '⏳ Adding property...',
    attrSuccess: '✅ Property added! You can now use user.{name} in your rules.',
    attrError: '❌ Error: ',
    attrHelpTitle: '💡 How to use attributes?',
    attrHelp1: 'Add an attribute above (e.g. <strong>Department</strong>). The table will be created automatically.',
    attrHelp2: 'Fill the generated table with emails and values (e.g. alice@mail.com → Sales)',
    attrHelp3: 'In the <strong>Configure</strong> tab, use <code>user.YourAttribute</code> in your rule conditions',
    attrMode: 'Mode',
    attrModeAuto: '🚀 Automatic (creates the table for you)',
    attrModeManual: '🔧 Manual (use an existing table)',
    attrAutoInfo: '🚀 What will be created automatically:',
    attrAutoTable: 'Table {table}',
    attrAutoCols: 'Columns: <strong>Email</strong> + {attr}',
    attrAutoRule: 'Property: {name}',
    attrSubtitle: 'Associate custom attributes with users to create advanced access rules. The table is created automatically.',
    attrDataTitle: '📝 Manage users and attributes',
    attrDataSelect: 'Select an attribute:',
    attrDataEmpty: 'No users registered. Add some below.',
    attrDataEmailRequired: '❌ Please enter an email address',
    attrDataValueRequired: '❌ Please enter a value',
    attrDataAdded: '✅ User added successfully',
    attrDeleteConfirm: 'Delete attribute "{name}"?\n\nThe associated table will not be deleted.',
    attrDeleteWarning: '⚠️ Warning! {count} rule(s) use the attribute "{name}":',
    attrDeleteConfirmForce: 'Delete anyway? Linked rules will no longer work.',
    attrDeleteTitle: 'Delete "{name}"',
    attrDeleteSuccess: '✅ Attribute "{name}" deleted',
    modalCancel: 'Cancel',
    modalDelete: 'Delete',
    attrStep1Title: 'Create an attribute',
    attrStep1Desc: 'Define a custom attribute (e.g. Department, Team). The table will be created automatically.',
    attrStep2Title: 'Associate users',
    attrStep2Desc: 'Enter emails and values for each user.',
    attrStep3Title: 'Use in rules',
    attrStep3Desc: 'Go to the <strong>⚙️ Configure</strong> tab and use your attributes in your access rule conditions.'
  }
};

function t(key) {
  return (i18n[currentLang] && i18n[currentLang][key]) || (i18n['fr'] && i18n['fr'][key]) || key;
}

function setLanguage(lang) {
  currentLang = lang;
  document.getElementById('lang-fr').classList.toggle('active', lang === 'fr');
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  applyTranslations();
}

// =============================================================================
// TOAST & MODAL
// =============================================================================

var toastEl = document.getElementById('toast');
var modalOverlay = document.getElementById('modal-overlay');
var modalTitle = document.getElementById('modal-title');
var modalBody = document.getElementById('modal-body');
var modalCancelBtn = document.getElementById('modal-cancel-btn');
var modalConfirmBtn = document.getElementById('modal-confirm-btn');
var modalResolve = null;

function showToast(text, type, duration) {
  type = type || 'info';
  duration = duration || 3000;
  toastEl.className = 'toast toast-' + type;
  toastEl.textContent = text;
  setTimeout(function() { toastEl.classList.add('show'); }, 10);
  setTimeout(function() { toastEl.classList.remove('show'); }, duration);
}

function showModal(title, bodyHtml) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalCancelBtn.textContent = t('modalCancel');
  modalConfirmBtn.textContent = t('modalDelete');
  modalOverlay.classList.add('show');

  return new Promise(function(resolve) {
    modalResolve = resolve;
  });
}

function closeModal(result) {
  modalOverlay.classList.remove('show');
  if (modalResolve) {
    modalResolve(result);
    modalResolve = null;
  }
}

modalCancelBtn.addEventListener('click', function() { closeModal(false); });
modalConfirmBtn.addEventListener('click', function() { closeModal(true); });
modalOverlay.addEventListener('click', function(e) {
  if (e.target === modalOverlay) closeModal(false);
});

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var val = t(key);
    if (val) el.innerHTML = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-placeholder');
    var val = t(key);
    if (val) el.placeholder = val;
  });
}

// =============================================================================
// SECURITY
// =============================================================================

function sanitizeForDisplay(str) {
  if (str === null || str === undefined) return '';
  var div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// =============================================================================
// STATE
// =============================================================================

var tokenInfo = null; // { baseUrl, token, ttlMsecs }
var documentTables = [];
var aclRules = [];

// =============================================================================
// DOM ELEMENTS
// =============================================================================

var messageSection = document.getElementById('message-section');
var setupSection = document.getElementById('setup-section');
var mainContent = document.getElementById('main-content');
var gristUrlSpan = document.getElementById('grist-url');

var tablesLoading = document.getElementById('tables-loading');
var tablesMatrix = document.getElementById('tables-matrix');
var columnsLoading = document.getElementById('columns-loading');
var columnsMatrix = document.getElementById('columns-matrix');
var columnsEmpty = document.getElementById('columns-empty');
var columnTableSelect = document.getElementById('column-table-select');
var rulesLoading = document.getElementById('rules-loading');
var rulesList = document.getElementById('rules-list');
var rulesEmpty = document.getElementById('rules-empty');

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

// =============================================================================
// MESSAGES
// =============================================================================

function showMessage(text, type) {
  messageSection.innerHTML = '<div class="message message-' + type + '">' + text + '</div>';
  messageSection.classList.remove('hidden');
}

function hideMessage() {
  messageSection.classList.add('hidden');
  messageSection.innerHTML = '';
}

// =============================================================================
// API HELPERS (using getAccessToken for same-origin requests)
// =============================================================================

async function getToken() {
  // Refresh token if expired or not yet obtained
  if (!tokenInfo || Date.now() > tokenInfo.expiry) {
    var result = await grist.docApi.getAccessToken({ readOnly: true });
    tokenInfo = {
      baseUrl: result.baseUrl,
      token: result.token,
      expiry: Date.now() + result.ttlMsecs - 30000 // refresh 30s before expiry
    };
  }
  return tokenInfo;
}

async function apiFetch(endpoint) {
  var info = await getToken();
  var url = info.baseUrl + endpoint + (endpoint.includes('?') ? '&' : '?') + 'auth=' + info.token;
  var response = await fetch(url);
  if (!response.ok) {
    var errorText = await response.text();
    throw new Error('API ' + response.status + ': ' + errorText);
  }
  var text = await response.text();
  return text ? JSON.parse(text) : {};
}

// =============================================================================
// LOAD TABLES (for matrix and column selector)
// =============================================================================

async function loadTablesForMatrix() {
  tablesLoading.classList.remove('hidden');
  tablesMatrix.classList.add('hidden');

  try {
    var tableNames = await grist.docApi.listTables();
    console.log('Tables found:', tableNames);

    // Convert to objects and filter internal tables
    documentTables = tableNames
      .filter(function(name) { return !name.startsWith('_grist_'); })
      .map(function(name) { return { id: name }; });

    if (documentTables.length === 0) {
      tablesLoading.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">' + t('noTables') + '</p>';
      return;
    }

    // Populate column table selector
    columnTableSelect.innerHTML = '<option value="">' + t('selectTableOption') + '</option>';
    documentTables.forEach(function(table) {
      var option = document.createElement('option');
      option.value = table.id;
      option.textContent = table.id;
      columnTableSelect.appendChild(option);
    });

    // Populate configure and attributes tab dropdowns
    populateCfgTables();
    populateAttrTables();

    // Build table permissions matrix
    await buildTablesMatrix();

  } catch (error) {
    console.error('Error loading tables:', error);
    showMessage(t('errorLoadTables') + error.message, 'error');
  } finally {
    tablesLoading.classList.add('hidden');
  }
}

async function buildTablesMatrix() {
  var rules = await fetchACLRules();

  // Build a map of table -> permissions
  var tablePerms = {};
  documentTables.forEach(function(table) {
    tablePerms[table.id] = { read: 'inherited', write: 'inherited' };
  });

  // Parse ACL rules for table-level permissions
  rules.forEach(function(rule) {
    if (rule.resource && rule.resource.tableId && rule.resource.tableId !== '*' &&
        (!rule.resource.colIds || rule.resource.colIds === '*')) {
      var tableId = rule.resource.tableId;
      if (tablePerms[tableId] && rule.permissionsText) {
        if (rule.permissionsText.includes('+R')) tablePerms[tableId].read = 'allow';
        if (rule.permissionsText.includes('-R')) tablePerms[tableId].read = 'deny';
        if (rule.permissionsText.includes('+W') || rule.permissionsText.includes('+U') ||
            rule.permissionsText.includes('+C') || rule.permissionsText.includes('+D')) {
          tablePerms[tableId].write = 'allow';
        }
        if (rule.permissionsText.includes('-W') ||
            (rule.permissionsText.includes('-U') && rule.permissionsText.includes('-C') && rule.permissionsText.includes('-D'))) {
          tablePerms[tableId].write = 'deny';
        }
      }
    }
  });

  var html = '<table class="matrix-table">';
  html += '<thead><tr>';
  html += '<th>' + t('tableName') + '</th>';
  html += '<th>' + t('ruleRead') + '</th>';
  html += '<th>' + t('ruleWrite') + '</th>';
  html += '</tr></thead>';
  html += '<tbody>';

  documentTables.forEach(function(table) {
    var perms = tablePerms[table.id];
    html += '<tr>';
    html += '<td>' + sanitizeForDisplay(table.id) + '</td>';
    html += '<td>' + renderPermBadge(perms.read) + '</td>';
    html += '<td>' + renderPermBadge(perms.write) + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  tablesMatrix.innerHTML = html;
  tablesMatrix.classList.remove('hidden');
}

function renderPermBadge(perm) {
  if (perm === 'allow') return '<span class="perm-badge perm-read-write">' + t('ruleAllowed') + '</span>';
  if (perm === 'deny') return '<span class="perm-badge perm-none">' + t('ruleDenied') + '</span>';
  return '<span class="perm-badge perm-inherited">' + t('inherited') + '</span>';
}

// =============================================================================
// LOAD COLUMNS
// =============================================================================

async function loadColumnsForTable(tableId) {
  if (!tableId) {
    columnsMatrix.classList.add('hidden');
    columnsEmpty.classList.remove('hidden');
    columnsLoading.classList.add('hidden');
    return;
  }

  columnsEmpty.classList.add('hidden');
  columnsLoading.classList.remove('hidden');
  columnsMatrix.classList.add('hidden');

  try {
    // Fetch table data to get column names
    var tableData = await grist.docApi.fetchTable(tableId);
    var allCols = Object.keys(tableData).filter(function(col) {
      return col !== 'id' && col !== 'manualSort' && !col.startsWith('gristHelper_');
    });

    if (allCols.length === 0) {
      columnsMatrix.innerHTML = '<p style="text-align:center; color:#94a3b8; padding:20px;">' + t('noColumns') + '</p>';
      columnsMatrix.classList.remove('hidden');
      columnsLoading.classList.add('hidden');
      return;
    }

    // Get ACL rules for this table's columns
    var rules = await fetchACLRules();
    var colPerms = {};
    allCols.forEach(function(col) {
      colPerms[col] = { read: 'inherited', write: 'inherited' };
    });

    rules.forEach(function(rule) {
      if (rule.resource && rule.resource.tableId === tableId && rule.resource.colIds &&
          rule.resource.colIds !== '*') {
        var colIds = rule.resource.colIds;
        if (typeof colIds === 'string') {
          colIds = colIds.split(',').map(function(s) { return s.trim(); });
        }
        colIds.forEach(function(colId) {
          if (colPerms[colId] && rule.permissionsText) {
            if (rule.permissionsText.includes('+R')) colPerms[colId].read = 'allow';
            if (rule.permissionsText.includes('-R')) colPerms[colId].read = 'deny';
            if (rule.permissionsText.includes('+W') || rule.permissionsText.includes('+U')) colPerms[colId].write = 'allow';
            if (rule.permissionsText.includes('-W') || rule.permissionsText.includes('-U')) colPerms[colId].write = 'deny';
          }
        });
      }
    });

    var html = '<table class="matrix-table">';
    html += '<thead><tr>';
    html += '<th>' + t('columnName') + '</th>';
    html += '<th>' + t('ruleRead') + '</th>';
    html += '<th>' + t('ruleWrite') + '</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    allCols.forEach(function(col) {
      var perms = colPerms[col];
      html += '<tr>';
      html += '<td>' + sanitizeForDisplay(col) + '</td>';
      html += '<td>' + renderPermBadge(perms.read) + '</td>';
      html += '<td>' + renderPermBadge(perms.write) + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    columnsMatrix.innerHTML = html;
    columnsMatrix.classList.remove('hidden');

  } catch (error) {
    console.error('Error loading columns:', error);
    showMessage(t('errorLoadColumns') + error.message, 'error');
  } finally {
    columnsLoading.classList.add('hidden');
  }
}

// =============================================================================
// LOAD ACL RULES (from internal Grist tables via Plugin API)
// =============================================================================

async function fetchACLRules() {
  try {
    var rulesData = await grist.docApi.fetchTable('_grist_ACLRules');
    var resourcesData = await grist.docApi.fetchTable('_grist_ACLResources');

    // Build resources map: id -> { tableId, colIds }
    var resources = {};
    if (resourcesData.id) {
      for (var i = 0; i < resourcesData.id.length; i++) {
        resources[resourcesData.id[i]] = {
          tableId: resourcesData.tableId[i],
          colIds: resourcesData.colIds[i]
        };
      }
    }

    // Build rules array
    var rules = [];
    if (rulesData.id) {
      for (var j = 0; j < rulesData.id.length; j++) {
        var resId = rulesData.resource[j];
        var resource = resources[resId] || {};
        rules.push({
          id: rulesData.id[j],
          resource: resource,
          aclFormula: rulesData.aclFormula ? rulesData.aclFormula[j] || '' : '',
          permissionsText: rulesData.permissionsText ? rulesData.permissionsText[j] || '' : '',
          rulePos: rulesData.rulePos ? rulesData.rulePos[j] || 0 : 0,
          memo: rulesData.memo ? rulesData.memo[j] || '' : ''
        });
      }
    }

    aclRules = rules;
    return rules;

  } catch (error) {
    console.error('Error fetching ACL rules:', error);
    return [];
  }
}

async function loadRules() {
  rulesLoading.classList.remove('hidden');
  rulesList.innerHTML = '';
  rulesEmpty.classList.add('hidden');

  try {
    var rules = await fetchACLRules();

    // Filter out default rules (empty formula on * resource)
    var customRules = rules.filter(function(rule) {
      return rule.aclFormula || (rule.resource.tableId && rule.resource.tableId !== '*');
    });

    if (customRules.length === 0) {
      rulesEmpty.classList.remove('hidden');
      rulesLoading.classList.add('hidden');
      return;
    }

    var html = '';
    customRules.forEach(function(rule) {
      var tableLabel = rule.resource.tableId || t('allTables');
      var colLabel = '';
      if (rule.resource.colIds && rule.resource.colIds !== '*') {
        colLabel = ' → ' + sanitizeForDisplay(
          Array.isArray(rule.resource.colIds) ? rule.resource.colIds.join(', ') : rule.resource.colIds
        );
      }

      html += '<div class="rule-item">';
      html += '  <div class="rule-header">';
      html += '    <strong>' + sanitizeForDisplay(tableLabel) + colLabel + '</strong>';
      html += '  </div>';

      if (rule.aclFormula) {
        html += '  <div class="rule-condition">' + sanitizeForDisplay(rule.aclFormula) + '</div>';
      }

      html += '  <div class="rule-permissions">';
      var perms = rule.permissionsText || '';
      if (perms.includes('+R')) html += '<span class="perm-badge perm-read-write">' + t('ruleRead') + ' ✅</span>';
      if (perms.includes('-R')) html += '<span class="perm-badge perm-none">' + t('ruleRead') + ' ❌</span>';
      if (perms.includes('+U') || perms.includes('+W')) html += '<span class="perm-badge perm-read-write">' + t('ruleWrite') + ' ✅</span>';
      if (perms.includes('-U') || perms.includes('-W')) html += '<span class="perm-badge perm-none">' + t('ruleWrite') + ' ❌</span>';
      if (perms.includes('+C')) html += '<span class="perm-badge perm-read-write">' + t('ruleCreate') + ' ✅</span>';
      if (perms.includes('-C')) html += '<span class="perm-badge perm-none">' + t('ruleCreate') + ' ❌</span>';
      if (perms.includes('+D')) html += '<span class="perm-badge perm-read-write">' + t('ruleDelete') + ' ✅</span>';
      if (perms.includes('-D')) html += '<span class="perm-badge perm-none">' + t('ruleDelete') + ' ❌</span>';

      if (rule.memo) {
        html += '<span style="font-size:12px; color:#64748b; margin-left:8px;">📝 ' + sanitizeForDisplay(rule.memo) + '</span>';
      }
      html += '  </div>';
      html += '</div>';
    });

    rulesList.innerHTML = html;

  } catch (error) {
    console.error('Error loading rules:', error);
    showMessage(t('errorLoadRules') + error.message, 'error');
  } finally {
    rulesLoading.classList.add('hidden');
  }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var tabName = this.getAttribute('data-tab');
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
      document.getElementById('tab-' + tabName).classList.add('active');
    });
  });

  // Column table selector
  columnTableSelect.addEventListener('change', function() {
    loadColumnsForTable(this.value);
  });

  // Refresh buttons
  document.getElementById('refresh-tables-btn').addEventListener('click', function() {
    loadTablesForMatrix();
  });
  document.getElementById('refresh-columns-btn').addEventListener('click', function() {
    var tableId = columnTableSelect.value;
    if (tableId) loadColumnsForTable(tableId);
  });
  document.getElementById('refresh-rules-btn').addEventListener('click', function() {
    loadRules();
  });
}

// =============================================================================
// GRIST CHECK
// =============================================================================

function isInsideGrist() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// =============================================================================
// INIT
// =============================================================================

async function init() {
  console.log('Access Rules Manager: Initializing...');

  setupEventListeners();
  setupConfigureListeners();
  setupAttributeListeners();
  applyTranslations();

  if (!isInsideGrist()) {
    showMessage(t('notInGrist'), 'warning');
    return;
  }

  try {
    await grist.ready({ requiredAccess: 'full' });
    console.log('Widget ready with full access');

    // No API key needed — skip setup, show main content directly
    setupSection.classList.add('hidden');
    mainContent.classList.remove('hidden');

    showMessage(t('loadingData'), 'info');

    // Load all data
    await loadTablesForMatrix();
    await loadRules();
    await loadExistingAttributes();
    await loadRulesSummary();

    hideMessage();

  } catch (error) {
    console.error('Initialization error:', error);
    showMessage(t('initError') + error.message, 'error');
  }
}

// =============================================================================
// CONFIGURE TAB
// =============================================================================

var cfgScope = document.getElementById('cfg-scope');
var cfgTable = document.getElementById('cfg-table');
var cfgColumnsSection = document.getElementById('cfg-columns-section');
var cfgColumnsList = document.getElementById('cfg-columns-list');
var cfgConditionType = document.getElementById('cfg-condition-type');
var cfgRoleSection = document.getElementById('cfg-role-section');
var cfgAttrSection = document.getElementById('cfg-attr-section');
var cfgRole = document.getElementById('cfg-role');
var cfgAttrName = document.getElementById('cfg-attr-name');
var cfgAttrOp = document.getElementById('cfg-attr-op');
var cfgAttrValue = document.getElementById('cfg-attr-value');
var cfgPermRead = document.getElementById('cfg-perm-read');
var cfgPermWrite = document.getElementById('cfg-perm-write');
var cfgPermCreate = document.getElementById('cfg-perm-create');
var cfgPermDelete = document.getElementById('cfg-perm-delete');
var cfgPreviewCondition = document.getElementById('cfg-preview-condition');
var cfgPreviewPerms = document.getElementById('cfg-preview-perms');
var cfgApplyBtn = document.getElementById('cfg-apply-btn');
var cfgMessage = document.getElementById('cfg-message');

function buildCfgCondition() {
  if (cfgConditionType.value === 'attribute') {
    var attrName = cfgAttrName.value || 'Attribut';
    var op = cfgAttrOp.value;
    var val = cfgAttrValue.value.trim() || '...';
    return 'user.' + attrName + '.' + attrName + ' ' + op + ' "' + val + '"';
  } else {
    var role = cfgRole.value;
    var roles = role.split(',');
    return 'user.Access in [' + roles.join(', ') + ']';
  }
}

function updateCfgPreview() {
  var condition = buildCfgCondition();
  cfgPreviewCondition.textContent = condition;

  // Build permissions preview
  var html = '';
  if (cfgPermRead.checked) html += '<span class="perm-badge perm-read-write">' + t('ruleRead') + ' ✅</span>';
  else html += '<span class="perm-badge perm-none">' + t('ruleRead') + ' ❌</span>';
  if (cfgPermWrite.checked) html += '<span class="perm-badge perm-read-write">' + t('ruleWrite') + ' ✅</span>';
  else html += '<span class="perm-badge perm-none">' + t('ruleWrite') + ' ❌</span>';
  if (cfgPermCreate.checked) html += '<span class="perm-badge perm-read-write">' + t('ruleCreate') + ' ✅</span>';
  else html += '<span class="perm-badge perm-none">' + t('ruleCreate') + ' ❌</span>';
  if (cfgPermDelete.checked) html += '<span class="perm-badge perm-read-write">' + t('ruleDelete') + ' ✅</span>';
  else html += '<span class="perm-badge perm-none">' + t('ruleDelete') + ' ❌</span>';
  cfgPreviewPerms.innerHTML = html;
}

async function loadCfgColumns() {
  var tableId = cfgTable.value;
  if (!tableId) { cfgColumnsList.innerHTML = ''; return; }

  try {
    var tableData = await grist.docApi.fetchTable(tableId);
    var cols = Object.keys(tableData).filter(function(c) {
      return c !== 'id' && c !== 'manualSort' && !c.startsWith('gristHelper_');
    });

    var html = '<div style="margin-bottom:6px;">';
    html += '<a href="#" onclick="cfgToggleAll(true); return false;" style="font-size:12px; color:#3b82f6;">' + t('cfgSelectAll') + '</a>';
    html += ' | <a href="#" onclick="cfgToggleAll(false); return false;" style="font-size:12px; color:#3b82f6;">' + t('cfgDeselectAll') + '</a>';
    html += '</div>';
    cols.forEach(function(col) {
      html += '<label style="display:flex; align-items:center; gap:6px; padding:4px 0; cursor:pointer;">';
      html += '<input type="checkbox" class="cfg-col-check" value="' + sanitizeForDisplay(col) + '" style="width:16px; height:16px;">';
      html += '<span style="font-size:13px;">' + sanitizeForDisplay(col) + '</span>';
      html += '</label>';
    });
    cfgColumnsList.innerHTML = html;
  } catch (e) {
    console.error('Error loading columns for config:', e);
    cfgColumnsList.innerHTML = '<p style="color:#dc2626; font-size:13px;">Erreur</p>';
  }
}

function cfgToggleAll(checked) {
  document.querySelectorAll('.cfg-col-check').forEach(function(cb) { cb.checked = checked; });
}

async function applyConfigRule() {
  var tableId = cfgTable.value;
  if (!tableId) {
    cfgMessage.innerHTML = '<div class="message message-error">' + t('cfgSelectTable') + '</div>';
    cfgMessage.classList.remove('hidden');
    return;
  }

  var scope = cfgScope.value;
  var colIds = '*';

  if (scope === 'columns') {
    var checked = document.querySelectorAll('.cfg-col-check:checked');
    if (checked.length === 0) {
      cfgMessage.innerHTML = '<div class="message message-error">' + t('cfgSelectColumns') + '</div>';
      cfgMessage.classList.remove('hidden');
      return;
    }
    var selectedCols = [];
    checked.forEach(function(cb) { selectedCols.push(cb.value); });
    colIds = selectedCols.join(',');
  }

  // Build permissions text
  var perms = '';
  perms += cfgPermRead.checked ? '+R' : '-R';
  perms += cfgPermWrite.checked ? '+U' : '-U';
  perms += cfgPermCreate.checked ? '+C' : '-C';
  perms += cfgPermDelete.checked ? '+D' : '-D';

  // Build ACL formula
  var aclFormula;
  if (cfgConditionType.value === 'attribute') {
    var attrNameVal = cfgAttrName.value;
    var op = cfgAttrOp.value;
    var val = cfgAttrValue.value.trim();
    if (!val) {
      cfgMessage.innerHTML = '<div class="message message-error">' + t('cfgAttrValueRequired') + '</div>';
      cfgMessage.classList.remove('hidden');
      cfgApplyBtn.disabled = false;
      return;
    }
    aclFormula = 'user.' + attrNameVal + '.' + attrNameVal + ' ' + op + ' "' + val + '"';
  } else {
    var role = cfgRole.value;
    var roles = role.split(',');
    aclFormula = 'user.Access in [' + roles.join(', ') + ']';
  }

  cfgApplyBtn.disabled = true;
  cfgMessage.innerHTML = '<div class="message message-info">' + t('cfgApplying') + '</div>';
  cfgMessage.classList.remove('hidden');

  try {
    // Step 1: Find existing resource or prepare to create one
    var resourcesData = await grist.docApi.fetchTable('_grist_ACLResources');
    var resourceId = null;

    if (resourcesData.id) {
      for (var i = 0; i < resourcesData.id.length; i++) {
        if (resourcesData.tableId[i] === tableId && resourcesData.colIds[i] === colIds) {
          resourceId = resourcesData.id[i];
          break;
        }
      }
    }

    // Create resource first if needed
    if (!resourceId) {
      var resResult = await grist.docApi.applyUserActions([
        ['AddRecord', '_grist_ACLResources', null, { tableId: tableId, colIds: colIds }]
      ]);
      resourceId = resResult.retValues[0];
    }

    // Then add the rule
    await grist.docApi.applyUserActions([
      ['AddRecord', '_grist_ACLRules', null, {
        resource: resourceId,
        aclFormula: aclFormula,
        permissionsText: perms,
        memo: ''
      }]
    ]);

    // Note: Grist will reload the document after modifying ACL rules.
    // The widget will be re-initialized automatically.
    // Show success message briefly before reload happens.
    cfgMessage.innerHTML = '<div class="message message-success">' + t('cfgSuccess') + '</div>';

  } catch (error) {
    console.error('Error applying rule:', error);
    cfgMessage.innerHTML = '<div class="message message-error">' + t('cfgError') + error.message + '</div>';
    cfgApplyBtn.disabled = false;
  }
}

function setupConfigureListeners() {
  cfgScope.addEventListener('change', function() {
    if (this.value === 'columns') {
      cfgColumnsSection.classList.remove('hidden');
      loadCfgColumns();
    } else {
      cfgColumnsSection.classList.add('hidden');
    }
  });

  cfgTable.addEventListener('change', function() {
    if (cfgScope.value === 'columns') loadCfgColumns();
  });

  cfgConditionType.addEventListener('change', function() {
    if (this.value === 'attribute') {
      cfgRoleSection.classList.add('hidden');
      cfgAttrSection.classList.remove('hidden');
    } else {
      cfgRoleSection.classList.remove('hidden');
      cfgAttrSection.classList.add('hidden');
    }
    updateCfgPreview();
  });

  cfgRole.addEventListener('change', updateCfgPreview);
  cfgAttrName.addEventListener('change', updateCfgPreview);
  cfgAttrOp.addEventListener('change', updateCfgPreview);
  cfgAttrValue.addEventListener('input', updateCfgPreview);
  cfgPermRead.addEventListener('change', updateCfgPreview);
  cfgPermWrite.addEventListener('change', updateCfgPreview);
  cfgPermCreate.addEventListener('change', updateCfgPreview);
  cfgPermDelete.addEventListener('change', updateCfgPreview);

  cfgApplyBtn.addEventListener('click', applyConfigRule);

  document.getElementById('refresh-summary-btn').addEventListener('click', loadRulesSummary);

  // Initial preview
  updateCfgPreview();
}

// =============================================================================
// RULES SUMMARY (human-readable)
// =============================================================================

var cfgSummaryList = document.getElementById('cfg-summary-list');
var cfgSummaryEmpty = document.getElementById('cfg-summary-empty');
var cfgSummaryLoading = document.getElementById('cfg-summary-loading');

function translatePermissions(permText) {
  if (!permText) return '';
  var parts = [];
  if (permText.indexOf('+R') !== -1) parts.push('📖 ' + t('ruleRead'));
  if (permText.indexOf('-R') !== -1) parts.push('🚫 ' + t('ruleRead'));
  if (permText.indexOf('+U') !== -1) parts.push('✏️ ' + t('ruleWrite'));
  if (permText.indexOf('-U') !== -1) parts.push('🚫 ' + t('ruleWrite'));
  if (permText.indexOf('+C') !== -1) parts.push('➕ ' + t('ruleCreate'));
  if (permText.indexOf('-C') !== -1) parts.push('🚫 ' + t('ruleCreate'));
  if (permText.indexOf('+D') !== -1) parts.push('🗑️ ' + t('ruleDelete'));
  if (permText.indexOf('-D') !== -1) parts.push('🚫 ' + t('ruleDelete'));
  return parts.join(' · ');
}

function translateCondition(formula) {
  if (!formula) return t('cfgSummaryAllUsers');
  // user.Access in [VIEWER] → Lecteurs (Viewer)
  var m = formula.match(/user\.Access in \[(.+)\]/);
  if (m) {
    var roles = m[1].split(',').map(function(r) {
      r = r.trim();
      if (r === 'VIEWER') return t('cfgRoleViewer');
      if (r === 'EDITOR') return t('cfgRoleEditor');
      if (r === 'OWNER') return 'Propriétaire (Owner)';
      return r;
    });
    return roles.join(', ');
  }
  // user.UGP.UGP == "commercial" → UGP = "commercial"
  var m2 = formula.match(/user\.(\w+)\.\w+\s*(==|!=)\s*"(.+)"/);
  if (m2) {
    var op = m2[2] === '==' ? '=' : '≠';
    return m2[1] + ' ' + op + ' "' + m2[3] + '"';
  }
  return formula;
}

async function loadRulesSummary() {
  cfgSummaryLoading.classList.remove('hidden');
  cfgSummaryList.innerHTML = '';
  cfgSummaryEmpty.classList.add('hidden');

  try {
    var rulesData = await grist.docApi.fetchTable('_grist_ACLRules');
    var resourcesData = await grist.docApi.fetchTable('_grist_ACLResources');

    // Build resource map
    var resMap = {};
    if (resourcesData.id) {
      for (var i = 0; i < resourcesData.id.length; i++) {
        resMap[resourcesData.id[i]] = {
          tableId: resourcesData.tableId[i],
          colIds: resourcesData.colIds[i]
        };
      }
    }

    var html = '';
    var count = 0;

    if (rulesData.id) {
      for (var j = 0; j < rulesData.id.length; j++) {
        var formula = rulesData.aclFormula ? rulesData.aclFormula[j] : '';
        var perms = rulesData.permissionsText ? rulesData.permissionsText[j] : '';
        var ua = rulesData.userAttributes ? rulesData.userAttributes[j] : '';
        var resId = rulesData.resource ? rulesData.resource[j] : 0;

        // Skip user attribute rules, empty/default rules, and SeedRules
        if (ua && ua !== '') continue;
        if (!formula && !perms) continue;
        var memo = rulesData.memo ? rulesData.memo[j] : '';
        if (perms === 'SPECIAL' || memo === 'SeedRule') continue;

        var res = resMap[resId] || { tableId: '*', colIds: '*' };
        if (res.tableId === '*' && res.colIds === '*' && !formula) continue;

        count++;

        // Build human-readable summary
        var tableName = res.tableId === '*' ? t('cfgSummaryAllTables') : res.tableId;
        var colName = res.colIds === '*' ? '' : ' → ' + t('columnsTitle').replace('📋 ', '') + ': ' + res.colIds;
        var condition = translateCondition(formula);
        var permText = translatePermissions(perms);

        html += '<div class="rule-item" style="margin-bottom: 8px;">';
        html += '  <div style="font-weight:600; font-size:14px; margin-bottom:4px;">';
        html += '    📊 ' + sanitizeForDisplay(tableName) + sanitizeForDisplay(colName);
        html += '  </div>';
        html += '  <div style="font-size:13px; color:#475569; margin-bottom:4px;">';
        html += '    👤 ' + t('cfgSummaryWho') + ' : <strong>' + condition + '</strong>';
        html += '  </div>';
        html += '  <div style="font-size:13px;">' + permText + '</div>';
        html += '</div>';
      }
    }

    if (count === 0) {
      cfgSummaryEmpty.classList.remove('hidden');
    } else {
      cfgSummaryList.innerHTML = html;
    }

  } catch (error) {
    console.error('Error loading rules summary:', error);
  } finally {
    cfgSummaryLoading.classList.add('hidden');
  }
}

function populateCfgAttrNames() {
  cfgAttrName.innerHTML = '';
  if (loadedAttrs && loadedAttrs.length > 0) {
    loadedAttrs.forEach(function(attr) {
      var option = document.createElement('option');
      option.value = attr.name;
      option.textContent = 'user.' + attr.name;
      cfgAttrName.appendChild(option);
    });
  } else {
    var option = document.createElement('option');
    option.value = '';
    option.textContent = t('attrNone');
    cfgAttrName.appendChild(option);
  }
}

// Populate configure table dropdown when tables are loaded
function populateCfgTables() {
  cfgTable.innerHTML = '<option value="">' + t('selectTableOption') + '</option>';
  documentTables.forEach(function(table) {
    var option = document.createElement('option');
    option.value = table.id;
    option.textContent = table.id;
    cfgTable.appendChild(option);
  });
}

// =============================================================================
// ATTRIBUTES TAB
// =============================================================================

var attrMode = document.getElementById('attr-mode');
var attrAutoSection = document.getElementById('attr-auto-section');
var attrManualSection = document.getElementById('attr-manual-section');
var attrName = document.getElementById('attr-name');
var attrNameManual = document.getElementById('attr-name-manual');
var attrCharId = document.getElementById('attr-char-id');
var attrTableId = document.getElementById('attr-table-id');
var attrLookupCol = document.getElementById('attr-lookup-col');
var attrPreviewCode = document.getElementById('attr-preview-code');
var attrApplyBtn = document.getElementById('attr-apply-btn');
var attrMessage = document.getElementById('attr-message');
var attrsLoading = document.getElementById('attrs-loading');
var attrsList = document.getElementById('attrs-list');
var attrsEmpty = document.getElementById('attrs-empty');
var attrAutoInfoTable = document.getElementById('attr-auto-info-table');
var attrAutoInfoCols = document.getElementById('attr-auto-info-cols');
function updateAttrPreview() {
  var isAuto = attrMode.value === 'auto';
  var name = (isAuto ? attrName.value.trim() : attrNameManual.value.trim()) || 'Attribut';
  attrPreviewCode.textContent = 'user.' + name;

  if (isAuto && attrAutoInfoTable && attrAutoInfoCols) {
    var tableName = 'Utilisateurs_' + removeAccents(attrName.value.trim() || 'Attribut');
    attrAutoInfoTable.innerHTML = t('attrAutoTable').replace('{table}', '<strong>' + sanitizeForDisplay(tableName) + '</strong>');
    attrAutoInfoCols.innerHTML = t('attrAutoCols').replace('{attr}', '<strong>' + sanitizeForDisplay(attrName.value.trim() || 'Attribut') + '</strong>');
  }
}

async function loadAttrColumns() {
  var tableId = attrTableId.value;
  attrLookupCol.innerHTML = '<option value="">' + t('attrSelectCol') + '</option>';
  if (!tableId) return;

  try {
    var tableData = await grist.docApi.fetchTable(tableId);
    var cols = Object.keys(tableData).filter(function(c) {
      return c !== 'id' && c !== 'manualSort' && !c.startsWith('gristHelper_');
    });
    cols.forEach(function(col) {
      var option = document.createElement('option');
      option.value = col;
      option.textContent = col;
      attrLookupCol.appendChild(option);
    });
  } catch (e) {
    console.error('Error loading columns for attributes:', e);
  }
}

async function loadExistingAttributes() {
  attrsLoading.classList.remove('hidden');
  attrsList.innerHTML = '';
  attrsEmpty.classList.add('hidden');

  try {
    var rulesData = await grist.docApi.fetchTable('_grist_ACLRules');
    var attrs = [];

    if (rulesData.id) {
      for (var i = 0; i < rulesData.id.length; i++) {
        var ua = rulesData.userAttributes ? rulesData.userAttributes[i] : '';
        if (ua && ua !== '') {
          try {
            var parsed = JSON.parse(ua);
            parsed._ruleId = rulesData.id[i];
            attrs.push(parsed);
          } catch (e) { /* ignore parse errors */ }
        }
      }
    }

    if (attrs.length === 0) {
      attrsEmpty.classList.remove('hidden');
      attrsLoading.classList.add('hidden');
      return;
    }

    var html = '';
    attrs.forEach(function(attr) {
      html += '<div class="rule-item" style="display:flex; justify-content:space-between; align-items:center;">';
      html += '  <div>';
      html += '    <div class="rule-header">';
      html += '      <strong>user.' + sanitizeForDisplay(attr.name) + '</strong>';
      html += '    </div>';
      html += '    <div style="font-size:13px; color:#475569; line-height:1.6;">';
      html += '      <span style="color:#64748b;">user.</span><strong>' + sanitizeForDisplay(attr.charId) + '</strong>';
      html += '      → <span style="color:#64748b;">' + sanitizeForDisplay(attr.tableId) + '.</span><strong>' + sanitizeForDisplay(attr.lookupColId) + '</strong>';
      html += '    </div>';
      html += '  </div>';
      html += '  <button class="btn btn-sm" style="color:#dc2626; padding:4px 8px; flex-shrink:0;" onclick="deleteAttribute(' + attr._ruleId + ', \'' + sanitizeForDisplay(attr.name).replace(/'/g, "\\'") + '\')">🗑️</button>';
      html += '</div>';
    });

    attrsList.innerHTML = html;

    // Store for data management and populate selects
    loadedAttrs = attrs;
    populateAttrDataSelect();
    populateCfgAttrNames();

  } catch (error) {
    console.error('Error loading attributes:', error);
  } finally {
    attrsLoading.classList.add('hidden');
  }
}

async function findDefaultResource() {
  var resourcesData = await grist.docApi.fetchTable('_grist_ACLResources');
  var defaultResourceId = null;
  if (resourcesData.id) {
    for (var i = 0; i < resourcesData.id.length; i++) {
      if (resourcesData.tableId[i] === '*' && resourcesData.colIds[i] === '*') {
        defaultResourceId = resourcesData.id[i];
        break;
      }
    }
  }
  if (!defaultResourceId) {
    var result = await grist.docApi.applyUserActions([
      ['AddRecord', '_grist_ACLResources', null, { tableId: '*', colIds: '*' }]
    ]);
    defaultResourceId = result.retValues[0];
  }
  return defaultResourceId;
}

async function applyAttributeAuto() {
  var name = attrName.value.trim();
  if (!name) {
    attrMessage.innerHTML = '<div class="message message-error">' + t('attrNameRequired') + '</div>';
    attrMessage.classList.remove('hidden');
    return;
  }

  // Sanitize table name (remove accents, no spaces, no special chars)
  var tableName = 'Utilisateurs_' + removeAccents(name).replace(/[^a-zA-Z0-9_]/g, '_');

  attrApplyBtn.disabled = true;
  attrMessage.innerHTML = '<div class="message message-info">' + t('attrApplying') + '</div>';
  attrMessage.classList.remove('hidden');

  try {
    // Step 1: Check if table already exists
    var existingTables = await grist.docApi.listTables();
    var tableExists = existingTables.indexOf(tableName) !== -1;

    if (!tableExists) {
      // Create the table with Email + attribute columns
      await grist.docApi.applyUserActions([
        ['AddTable', tableName, [
          { id: 'Email', type: 'Text' },
          { id: name, type: 'Text' }
        ]]
      ]);
    }

    // Step 2: Find or create the *:* resource
    var defaultResourceId = await findDefaultResource();

    // Step 3: Create the user attribute rule
    var userAttrJson = JSON.stringify({
      name: name,
      tableId: tableName,
      lookupColId: 'Email',
      charId: 'Email'
    });

    await grist.docApi.applyUserActions([
      ['AddRecord', '_grist_ACLRules', null, {
        resource: defaultResourceId,
        aclFormula: '',
        permissionsText: '',
        userAttributes: userAttrJson,
        memo: ''
      }]
    ]);

    var successMsg = t('attrSuccess').replace('{name}', name);
    attrMessage.innerHTML = '<div class="message message-success">' + successMsg + '</div>';

  } catch (error) {
    console.error('Error applying attribute (auto):', error);
    attrMessage.innerHTML = '<div class="message message-error">' + t('attrError') + error.message + '</div>';
    attrApplyBtn.disabled = false;
  }
}

async function applyAttributeManual() {
  var name = attrNameManual.value.trim();
  if (!name) {
    attrMessage.innerHTML = '<div class="message message-error">' + t('attrNameRequired') + '</div>';
    attrMessage.classList.remove('hidden');
    return;
  }

  var tableId = attrTableId.value;
  if (!tableId) {
    attrMessage.innerHTML = '<div class="message message-error">' + t('attrTableRequired') + '</div>';
    attrMessage.classList.remove('hidden');
    return;
  }

  var lookupColId = attrLookupCol.value;
  if (!lookupColId) {
    attrMessage.innerHTML = '<div class="message message-error">' + t('attrColRequired') + '</div>';
    attrMessage.classList.remove('hidden');
    return;
  }

  var charId = attrCharId.value;

  attrApplyBtn.disabled = true;
  attrMessage.innerHTML = '<div class="message message-info">' + t('attrApplying') + '</div>';
  attrMessage.classList.remove('hidden');

  try {
    var defaultResourceId = await findDefaultResource();

    var userAttrJson = JSON.stringify({
      name: name,
      tableId: tableId,
      lookupColId: lookupColId,
      charId: charId
    });

    await grist.docApi.applyUserActions([
      ['AddRecord', '_grist_ACLRules', null, {
        resource: defaultResourceId,
        aclFormula: '',
        permissionsText: '',
        userAttributes: userAttrJson,
        memo: ''
      }]
    ]);

    var successMsg = t('attrSuccess').replace('{name}', name);
    attrMessage.innerHTML = '<div class="message message-success">' + successMsg + '</div>';

  } catch (error) {
    console.error('Error applying attribute (manual):', error);
    attrMessage.innerHTML = '<div class="message message-error">' + t('attrError') + error.message + '</div>';
    attrApplyBtn.disabled = false;
  }
}

async function applyAttribute() {
  if (attrMode.value === 'auto') {
    await applyAttributeAuto();
  } else {
    await applyAttributeManual();
  }
}

function populateAttrTables() {
  attrTableId.innerHTML = '<option value="">' + t('selectTableOption') + '</option>';
  documentTables.forEach(function(table) {
    var option = document.createElement('option');
    option.value = table.id;
    option.textContent = table.id;
    attrTableId.appendChild(option);
  });
}

function setupAttributeListeners() {
  attrMode.addEventListener('change', function() {
    if (this.value === 'auto') {
      attrAutoSection.classList.remove('hidden');
      attrManualSection.classList.add('hidden');
    } else {
      attrAutoSection.classList.add('hidden');
      attrManualSection.classList.remove('hidden');
    }
    updateAttrPreview();
  });

  attrName.addEventListener('input', updateAttrPreview);
  attrNameManual.addEventListener('input', updateAttrPreview);
  attrTableId.addEventListener('change', loadAttrColumns);
  attrApplyBtn.addEventListener('click', applyAttribute);

  var attrApplyBtnManual = document.getElementById('attr-apply-btn-manual');
  if (attrApplyBtnManual) {
    attrApplyBtnManual.addEventListener('click', function() { applyAttributeManual(); });
  }

  document.getElementById('refresh-attrs-btn').addEventListener('click', function() {
    loadExistingAttributes();
  });

  // Data management listeners
  attrDataSelect.addEventListener('change', function() {
    loadAttrData(this.value);
  });
  attrDataAddBtn.addEventListener('click', addAttrDataRow);
  attrDataEmail.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addAttrDataRow();
  });
  attrDataValue.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addAttrDataRow();
  });

  updateAttrPreview();
}

// =============================================================================
// ATTRIBUTE DATA MANAGEMENT
// =============================================================================

var attrDataSection = document.getElementById('attr-data-section');
var attrDataSelect = document.getElementById('attr-data-select');
var attrDataLoading = document.getElementById('attr-data-loading');
var attrDataTableContainer = document.getElementById('attr-data-table-container');
var attrDataTbody = document.getElementById('attr-data-tbody');
var attrDataColHeader = document.getElementById('attr-data-col-header');
var attrDataEmail = document.getElementById('attr-data-email');
var attrDataValue = document.getElementById('attr-data-value');
var attrDataAddBtn = document.getElementById('attr-data-add-btn');
var attrDataMessage = document.getElementById('attr-data-message');

// Store loaded attributes info for data management
var loadedAttrs = [];
var currentValueColName = null;

async function deleteAttribute(ruleId, attrName) {
  // Check if any rules use this attribute
  try {
    var rulesData = await grist.docApi.fetchTable('_grist_ACLRules');
    var linkedRules = [];

    if (rulesData.id) {
      for (var i = 0; i < rulesData.id.length; i++) {
        var formula = rulesData.aclFormula ? rulesData.aclFormula[i] : '';
        var ua = rulesData.userAttributes ? rulesData.userAttributes[i] : '';
        if (rulesData.id[i] === ruleId) continue;
        if (ua && ua !== '') continue;
        if (formula && formula.indexOf('user.' + attrName) !== -1) {
          linkedRules.push(formula);
        }
      }
    }

    var bodyHtml = '';
    if (linkedRules.length > 0) {
      bodyHtml += '<p>' + t('attrDeleteWarning').replace('{count}', linkedRules.length).replace('{name}', attrName) + '</p>';
      bodyHtml += '<ul>';
      linkedRules.forEach(function(r) { bodyHtml += '<li>' + sanitizeForDisplay(r) + '</li>'; });
      bodyHtml += '</ul>';
      bodyHtml += '<p style="color:#dc2626; font-weight:600;">' + t('attrDeleteConfirmForce') + '</p>';
    } else {
      bodyHtml += '<p>' + t('attrDeleteConfirm').replace('{name}', attrName) + '</p>';
    }

    var confirmed = await showModal(t('attrDeleteTitle').replace('{name}', attrName), bodyHtml);
    if (!confirmed) return;

    await grist.docApi.applyUserActions([
      ['RemoveRecord', '_grist_ACLRules', ruleId]
    ]);

    showToast(t('attrDeleteSuccess').replace('{name}', attrName), 'success');

  } catch (error) {
    console.error('Error deleting attribute:', error);
    showToast(t('attrError') + error.message, 'error', 5000);
  }
}

function showAttrDataMessage(text, type) {
  attrDataMessage.innerHTML = '<div class="message message-' + type + '">' + text + '</div>';
  attrDataMessage.classList.remove('hidden');
  if (type === 'success') setTimeout(function() { attrDataMessage.classList.add('hidden'); }, 3000);
}

function populateAttrDataSelect() {
  attrDataSelect.innerHTML = '';
  if (loadedAttrs.length === 0) {
    attrDataSection.classList.add('hidden');
    return;
  }

  attrDataSection.classList.remove('hidden');
  loadedAttrs.forEach(function(attr) {
    var option = document.createElement('option');
    option.value = JSON.stringify({ tableId: attr.tableId, name: attr.name, lookupColId: attr.lookupColId });
    option.textContent = 'user.' + attr.name + ' (' + attr.tableId + ')';
    attrDataSelect.appendChild(option);
  });

  // Auto-load first attribute data
  if (loadedAttrs.length > 0) {
    loadAttrData(attrDataSelect.value);
  }
}

async function loadAttrData(selectValue) {
  if (!selectValue) return;

  var info;
  try { info = JSON.parse(selectValue); } catch (e) { return; }

  attrDataLoading.classList.remove('hidden');
  attrDataTableContainer.classList.add('hidden');
  attrDataColHeader.textContent = info.name;
  attrDataValue.placeholder = info.name + '...';

  try {
    var tableData = await grist.docApi.fetchTable(info.tableId);
    var ids = tableData.id || [];
    var emails = tableData[info.lookupColId] || tableData.Email || [];

    // Find the real value column name (may differ from info.name due to accent removal)
    var valueColName = info.name;
    var allCols = Object.keys(tableData).filter(function(c) {
      return c !== 'id' && c !== 'manualSort' && !c.startsWith('gristHelper_') && c !== info.lookupColId && c !== 'Email';
    });
    if (allCols.length > 0 && !tableData[info.name]) {
      valueColName = allCols[0];
    }
    // Store for addAttrDataRow
    currentValueColName = valueColName;
    var values = tableData[valueColName] || [];

    var html = '';
    for (var i = 0; i < ids.length; i++) {
      var email = emails[i] || '';
      var val = values[i] || '';
      if (!email && !val) continue;
      html += '<tr>';
      html += '<td>' + sanitizeForDisplay(email) + '</td>';
      html += '<td>' + sanitizeForDisplay(val) + '</td>';
      html += '<td><button class="btn btn-sm" style="color:#dc2626; padding:2px 6px;" onclick="deleteAttrDataRow(' + ids[i] + ', \'' + sanitizeForDisplay(info.tableId).replace(/'/g, "\\'") + '\')">🗑️</button></td>';
      html += '</tr>';
    }

    if (!html) {
      html = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:16px;">' + t('attrDataEmpty') + '</td></tr>';
    }

    attrDataTbody.innerHTML = html;
    attrDataTableContainer.classList.remove('hidden');

  } catch (error) {
    console.error('Error loading attribute data:', error);
    attrDataTbody.innerHTML = '<tr><td colspan="3" style="color:#dc2626;">' + error.message + '</td></tr>';
    attrDataTableContainer.classList.remove('hidden');
  } finally {
    attrDataLoading.classList.add('hidden');
  }
}

async function addAttrDataRow() {
  var email = attrDataEmail.value.trim();
  var value = attrDataValue.value.trim();

  if (!email) {
    showAttrDataMessage(t('attrDataEmailRequired'), 'error');
    return;
  }
  if (!value) {
    showAttrDataMessage(t('attrDataValueRequired'), 'error');
    return;
  }

  var info;
  try { info = JSON.parse(attrDataSelect.value); } catch (e) { return; }

  attrDataAddBtn.disabled = true;

  try {
    // Use the real column name detected by loadAttrData
    var colName = currentValueColName || info.name;
    var record = {};
    record[info.lookupColId] = email;
    record[colName] = value;

    await grist.docApi.applyUserActions([
      ['AddRecord', info.tableId, null, record]
    ]);

    attrDataEmail.value = '';
    attrDataValue.value = '';
    showAttrDataMessage(t('attrDataAdded'), 'success');

    // Reload the data table
    await loadAttrData(attrDataSelect.value);

  } catch (error) {
    console.error('Error adding attribute data:', error);
    showAttrDataMessage(t('attrError') + error.message, 'error');
  } finally {
    attrDataAddBtn.disabled = false;
  }
}

async function deleteAttrDataRow(rowId, tableId) {
  try {
    await grist.docApi.applyUserActions([
      ['RemoveRecord', tableId, rowId]
    ]);
    // Reload
    await loadAttrData(attrDataSelect.value);
  } catch (error) {
    console.error('Error deleting row:', error);
    showAttrDataMessage(t('attrError') + error.message, 'error');
  }
}

// Start
init();
