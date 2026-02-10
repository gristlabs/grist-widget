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
    tabGuide: '📖 Guide',
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
    tabGuide: '📖 Guide',
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
  renderGuide();
}

function renderGuide() {
  var el = document.getElementById('guide-content');
  if (!el) return;
  var fr = currentLang === 'fr';
  var c = function(cls, s, extra) { return '<div class="card" style="margin-top:12px;' + (extra || '') + '">' + s + '</div>'; };
  var th = 'padding:8px 12px; text-align:left; border-bottom:2px solid #e2e8f0;';
  var td = 'padding:8px 12px; border-bottom:1px solid #f1f5f9;';
  var tdn = 'padding:8px 12px;';
  var box = function(bg, color, title, content) { return '<div style="background:' + bg + '; border-radius:8px; padding:12px; margin:10px 0;"><strong style="color:' + color + ';">' + title + '</strong>' + content + '</div>'; };
  var html = '';

  // Intro
  html += '<div class="card" style="text-align:center; padding:24px; background:linear-gradient(135deg, #eff6ff, #f0fdf4); border:1px solid #bfdbfe;">';
  html += '<div style="font-size:40px; margin-bottom:8px;">📖</div>';
  html += '<h2 style="margin:0 0 8px 0; color:#1e40af;">' + (fr ? 'Guide de la gestion des accès' : 'Access Management Guide') + '</h2>';
  html += '<p style="color:#64748b; font-size:13px; margin:0;">' + (fr ? 'Apprenez à gérer les permissions de votre document Grist, étape par étape.' : 'Learn how to manage your Grist document permissions, step by step.') + '</p></div>';

  // Roles
  html += c('', '<h3 style="color:#1e40af; margin:0 0 12px 0;">🎯 ' + (fr ? 'C\'est quoi les "accès" ?' : 'What are "access rules"?') + '</h3>'
    + '<p>' + (fr ? 'Imaginez que votre document Grist est un <strong>immeuble de bureaux</strong>. Chaque personne qui y entre a un badge différent :' : 'Think of your Grist document as an <strong>office building</strong>. Each person who enters has a different badge:') + '</p>'
    + '<table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">'
    + '<thead><tr style="background:#f1f5f9;"><th style="' + th + '">' + (fr ? 'Rôle' : 'Role') + '</th><th style="' + th + '">Badge</th><th style="' + th + '">' + (fr ? 'Ce qu\'il peut faire' : 'What they can do') + '</th></tr></thead>'
    + '<tbody>'
    + '<tr><td style="' + td + '"><strong>' + (fr ? 'Propriétaire' : 'Owner') + '</strong></td><td style="' + td + '">🟡 ' + (fr ? 'Or' : 'Gold') + '</td><td style="' + td + '">' + (fr ? 'Tout faire : lire, écrire, supprimer, gérer les accès' : 'Everything: read, write, delete, manage access') + '</td></tr>'
    + '<tr><td style="' + td + '"><strong>' + (fr ? 'Éditeur' : 'Editor') + '</strong></td><td style="' + td + '">🔵 ' + (fr ? 'Bleu' : 'Blue') + '</td><td style="' + td + '">' + (fr ? 'Lire et modifier les données, mais pas gérer les accès' : 'Read and edit data, but not manage access') + '</td></tr>'
    + '<tr><td style="' + tdn + '"><strong>' + (fr ? 'Lecteur' : 'Viewer') + '</strong></td><td style="' + tdn + '">🟢 ' + (fr ? 'Vert' : 'Green') + '</td><td style="' + tdn + '">' + (fr ? 'Uniquement regarder, aucune modification possible' : 'View only, no modifications allowed') + '</td></tr>'
    + '</tbody></table>');

  // Example
  var exOrg = fr ? 'Les Jardins Partagés' : 'The Community Garden';
  var exDomain = fr ? 'jardins-partages.org' : 'community-garden.org';
  html += '<div class="card" style="margin-top:12px; background:#fefce8; border:1px solid #fde68a;">'
    + '<h3 style="color:#92400e; margin:0 0 12px 0;">📋 ' + (fr ? 'Exemple : L\'association "' + exOrg + '"' : 'Example: "' + exOrg + '" Association') + '</h3>'
    + '<p style="color:#92400e;">' + (fr ? 'L\'association gère un document Grist avec 3 tables :' : 'The association manages a Grist document with 3 tables:') + '</p>'
    + '<div style="display:flex; gap:8px; flex-wrap:wrap; margin:8px 0;">'
    + '<span style="background:#fef3c7; padding:4px 12px; border-radius:6px; font-size:12px; font-weight:600; color:#92400e;">📇 ' + (fr ? 'Membres' : 'Members') + '</span>'
    + '<span style="background:#fef3c7; padding:4px 12px; border-radius:6px; font-size:12px; font-weight:600; color:#92400e;">🌱 ' + (fr ? 'Parcelles' : 'Plots') + '</span>'
    + '<span style="background:#fef3c7; padding:4px 12px; border-radius:6px; font-size:12px; font-weight:600; color:#92400e;">🥕 ' + (fr ? 'Récoltes' : 'Harvests') + '</span></div>'
    + '<table style="width:100%; border-collapse:collapse; font-size:13px; margin:12px 0;">'
    + '<thead><tr style="background:rgba(255,255,255,0.5);"><th style="padding:6px 10px; text-align:left; border-bottom:2px solid #fde68a;">' + (fr ? 'Personne' : 'Person') + '</th><th style="padding:6px 10px; text-align:left; border-bottom:2px solid #fde68a;">' + (fr ? 'Rôle' : 'Role') + '</th><th style="padding:6px 10px; text-align:left; border-bottom:2px solid #fde68a;">Email</th></tr></thead>'
    + '<tbody>'
    + '<tr><td style="padding:6px 10px; border-bottom:1px solid #fde68a;"><strong>Marie</strong> (' + (fr ? 'Présidente' : 'President') + ')</td><td style="padding:6px 10px; border-bottom:1px solid #fde68a;">👑 ' + (fr ? 'Propriétaire' : 'Owner') + '</td><td style="padding:6px 10px; border-bottom:1px solid #fde68a; font-size:12px;">marie@' + exDomain + '</td></tr>'
    + '<tr><td style="padding:6px 10px; border-bottom:1px solid #fde68a;"><strong>Thomas</strong> (' + (fr ? 'Trésorier' : 'Treasurer') + ')</td><td style="padding:6px 10px; border-bottom:1px solid #fde68a;">✏️ ' + (fr ? 'Éditeur' : 'Editor') + '</td><td style="padding:6px 10px; border-bottom:1px solid #fde68a; font-size:12px;">thomas@' + exDomain + '</td></tr>'
    + '<tr><td style="padding:6px 10px; border-bottom:1px solid #fde68a;"><strong>' + (fr ? 'Léa' : 'Lea') + '</strong> (' + (fr ? 'Resp. parcelles' : 'Plot manager') + ')</td><td style="padding:6px 10px; border-bottom:1px solid #fde68a;">✏️ ' + (fr ? 'Éditeur' : 'Editor') + '</td><td style="padding:6px 10px; border-bottom:1px solid #fde68a; font-size:12px;">lea@' + exDomain + '</td></tr>'
    + '<tr><td style="padding:6px 10px;"><strong>Hugo</strong> (' + (fr ? 'Adhérent' : 'Member') + ')</td><td style="padding:6px 10px;">👁️ ' + (fr ? 'Lecteur' : 'Viewer') + '</td><td style="padding:6px 10px; font-size:12px;">hugo@' + exDomain + '</td></tr>'
    + '</tbody></table></div>';

  // Users
  html += c('', '<h3 style="color:#1e40af; margin:0 0 12px 0;">1️⃣ ' + (fr ? 'Gérer les utilisateurs (onglet 👥 Utilisateurs)' : 'Manage users (👥 Users tab)') + '</h3>'
    + '<p>' + (fr ? 'C\'est ici que vous décidez <strong>qui a accès</strong> au document et avec quel rôle.' : 'This is where you decide <strong>who has access</strong> to the document and with which role.') + '</p>'
    + box('#f0fdf4', '#166534', fr ? 'Ajouter un utilisateur' : 'Add a user',
        '<ol style="margin:6px 0 0 0; padding-left:20px; font-size:13px; color:#166534;">'
        + '<li>' + (fr ? 'Allez dans l\'onglet <strong>👥 Utilisateurs</strong>' : 'Go to the <strong>👥 Users</strong> tab') + '</li>'
        + '<li>' + (fr ? 'Dans <strong>➕ Ajouter un utilisateur</strong>, tapez l\'email' : 'In <strong>➕ Add a user</strong>, type the email') + '</li>'
        + '<li>' + (fr ? 'Choisissez le rôle et cliquez sur <strong>➕</strong>' : 'Choose the role and click <strong>➕</strong>') + '</li></ol>')
    + box('#eff6ff', '#1e40af', fr ? 'Changer un rôle' : 'Change a role',
        '<p style="margin:4px 0 0 0; font-size:13px; color:#1e40af;">' + (fr ? 'Trouvez l\'utilisateur → cliquez sur le menu déroulant de son rôle → changez-le.' : 'Find the user → click the role dropdown → change it.') + '</p>')
    + box('#fef2f2', '#991b1b', fr ? 'Retirer un utilisateur' : 'Remove a user',
        '<p style="margin:4px 0 0 0; font-size:13px; color:#991b1b;">' + (fr ? 'Trouvez son nom → cliquez sur le bouton <strong>✕</strong> à droite.' : 'Find their name → click the <strong>✕</strong> button on the right.') + '</p>'));

  // Table rules
  var tMembers = fr ? 'Membres' : 'Members';
  html += c('', '<h3 style="color:#1e40af; margin:0 0 12px 0;">2️⃣ ' + (fr ? 'Règles par table (onglet ⚙️ Configurer)' : 'Table rules (⚙️ Configure tab)') + '</h3>'
    + '<p>' + (fr ? 'Les rôles s\'appliquent à <strong>tout le document</strong>. Mais parfois, on veut être plus précis.' : 'Roles apply to the <strong>entire document</strong>. But sometimes, you need more precision.') + '</p>'
    + box('#fefce8; border:1px solid #fde68a', '#92400e', (fr ? '💡 Le problème' : '💡 The problem'),
        '<p style="margin:4px 0 0 0; font-size:13px; color:#92400e;">' + (fr ? 'Thomas est Éditeur, il peut modifier <strong>toutes</strong> les tables. Mais Marie ne veut pas qu\'il modifie la table <strong>' + tMembers + '</strong> (données sensibles).' : 'Thomas is an Editor, he can modify <strong>all</strong> tables. But Marie doesn\'t want him to modify the <strong>' + tMembers + '</strong> table (sensitive data).') + '</p>')
    + box('#f0fdf4', '#166534', (fr ? '✅ La solution : protéger la table ' + tMembers : '✅ The solution: protect the ' + tMembers + ' table'),
        '<ol style="margin:6px 0 0 0; padding-left:20px; font-size:13px; color:#166534;">'
        + '<li>' + (fr ? 'Allez dans <strong>⚙️ Configurer</strong>' : 'Go to <strong>⚙️ Configure</strong>') + '</li>'
        + '<li>' + (fr ? 'Portée : <strong>Table</strong> → Table : <strong>' + tMembers + '</strong>' : 'Scope: <strong>Table</strong> → Table: <strong>' + tMembers + '</strong>') + '</li>'
        + '<li>' + (fr ? 'Condition : <strong>Rôle</strong> → <strong>Éditeur</strong>' : 'Condition: <strong>Role</strong> → <strong>Editor</strong>') + '</li>'
        + '<li>' + (fr ? 'Permissions : Lecture ✅ | Écriture ❌' : 'Permissions: Read ✅ | Write ❌') + '</li>'
        + '<li>' + (fr ? 'Cliquez sur <strong>Appliquer</strong>' : 'Click <strong>Apply</strong>') + '</li></ol>'
        + '<p style="margin:8px 0 0 0; font-size:13px; color:#166534;"><strong>' + (fr ? 'Résultat :' : 'Result:') + '</strong> ' + (fr ? 'Les Éditeurs peuvent voir les membres mais pas les modifier.' : 'Editors can view members but not modify them.') + '</p>')
    + box('#eff6ff', '#1e40af', (fr ? '🔒 Cacher une colonne' : '🔒 Hide a column'),
        '<ol style="margin:6px 0 0 0; padding-left:20px; font-size:13px; color:#1e40af;">'
        + '<li>' + (fr ? 'Portée : <strong>Colonnes</strong> → Table : <strong>' + tMembers + '</strong> → Colonne : <strong>Telephone</strong>' : 'Scope: <strong>Columns</strong> → Table: <strong>' + tMembers + '</strong> → Column: <strong>Phone</strong>') + '</li>'
        + '<li>' + (fr ? 'Rôle : <strong>Éditeur</strong> → Lecture ❌ | Écriture ❌' : 'Role: <strong>Editor</strong> → Read ❌ | Write ❌') + '</li></ol>'
        + '<p style="margin:8px 0 0 0; font-size:13px; color:#1e40af;"><strong>' + (fr ? 'Résultat :' : 'Result:') + '</strong> ' + (fr ? 'La colonne Téléphone est invisible pour les Éditeurs.' : 'The Phone column is invisible to Editors.') + '</p>'));

  // Attributes
  html += c('', '<h3 style="color:#1e40af; margin:0 0 12px 0;">3️⃣ ' + (fr ? 'Les attributs (onglet 👤 Attributs)' : 'Attributes (👤 Attributes tab)') + '</h3>'
    + '<p>' + (fr ? 'Les attributs permettent de créer des <strong>règles personnalisées par utilisateur</strong>, pas juste par rôle.' : 'Attributes let you create <strong>per-user custom rules</strong>, not just per role.') + '</p>'
    + box('#fefce8; border:1px solid #fde68a', '#92400e', (fr ? '💡 Le problème' : '💡 The problem'),
        '<p style="margin:4px 0 0 0; font-size:13px; color:#92400e;">' + (fr ? 'Léa gère les parcelles <strong>Nord</strong>. Hugo gère les parcelles <strong>Sud</strong>. Chacun ne devrait voir que <strong>ses propres parcelles</strong>.' : 'Lea manages the <strong>North</strong> plots. Hugo manages the <strong>South</strong> plots. Each should only see <strong>their own plots</strong>.') + '</p>')
    + '<div style="background:#f0fdf4; border-radius:8px; padding:12px; margin:10px 0;"><strong style="color:#166534;">' + (fr ? '✅ La solution en 3 étapes' : '✅ The solution in 3 steps') + '</strong>'
    + '<div style="margin:10px 0; padding:10px; background:rgba(255,255,255,0.5); border-radius:6px;"><strong style="font-size:13px;">' + (fr ? 'Étape 1 : Créer l\'attribut' : 'Step 1: Create the attribute') + '</strong><p style="margin:4px 0 0 0; font-size:12px; color:#166534;">' + (fr ? 'Onglet <strong>👤 Attributs</strong> → Créer un attribut nommé <strong>Zone</strong>.' : '<strong>👤 Attributes</strong> tab → Create an attribute named <strong>Zone</strong>.') + '</p></div>'
    + '<div style="margin:10px 0; padding:10px; background:rgba(255,255,255,0.5); border-radius:6px;"><strong style="font-size:13px;">' + (fr ? 'Étape 2 : Associer les utilisateurs' : 'Step 2: Assign users') + '</strong>'
    + '<table style="width:100%; border-collapse:collapse; font-size:12px; margin:6px 0;"><tr style="background:rgba(255,255,255,0.5);"><th style="padding:4px 8px; text-align:left;">Email</th><th style="padding:4px 8px; text-align:left;">Zone</th></tr>'
    + '<tr><td style="padding:4px 8px;">lea@' + exDomain + '</td><td style="padding:4px 8px;"><strong>' + (fr ? 'Nord' : 'North') + '</strong></td></tr>'
    + '<tr><td style="padding:4px 8px;">hugo@' + exDomain + '</td><td style="padding:4px 8px;"><strong>' + (fr ? 'Sud' : 'South') + '</strong></td></tr></table></div>'
    + '<div style="margin:10px 0; padding:10px; background:rgba(255,255,255,0.5); border-radius:6px;"><strong style="font-size:13px;">' + (fr ? 'Étape 3 : Créer la règle' : 'Step 3: Create the rule') + '</strong><p style="margin:4px 0 0 0; font-size:12px; color:#166534;">' + (fr ? 'Onglet <strong>⚙️ Configurer</strong> → Table : <strong>Parcelles</strong> → Condition : <strong>Attribut Zone</strong> → Colonne : <strong>Secteur</strong>' : '<strong>⚙️ Configure</strong> tab → Table: <strong>Plots</strong> → Condition: <strong>Attribute Zone</strong> → Column: <strong>Sector</strong>') + '</p></div>'
    + '<p style="margin:8px 0 0 0; font-size:13px; color:#166534;"><strong>' + (fr ? 'Résultat :' : 'Result:') + '</strong> ' + (fr ? 'Léa voit les parcelles <strong>Nord</strong>, Hugo voit les parcelles <strong>Sud</strong>, Marie voit tout.' : 'Lea sees <strong>North</strong> plots, Hugo sees <strong>South</strong> plots, Marie sees everything.') + '</p></div>');

  // Visualize
  html += c('', '<h3 style="color:#1e40af; margin:0 0 12px 0;">4️⃣ ' + (fr ? 'Visualiser les permissions' : 'Visualize permissions') + '</h3>'
    + '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">'
    + '<div style="background:#eff6ff; border-radius:8px; padding:12px;"><strong style="color:#1e40af; font-size:13px;">📊 ' + (fr ? 'Onglet Tables' : 'Tables tab') + '</strong><p style="margin:4px 0 0 0; font-size:12px; color:#1e40af;">' + (fr ? 'Matrice visuelle : pour chaque table, qui peut lire et écrire.' : 'Visual matrix: for each table, who can read and write.') + '</p></div>'
    + '<div style="background:#eff6ff; border-radius:8px; padding:12px;"><strong style="color:#1e40af; font-size:13px;">📋 ' + (fr ? 'Onglet Colonnes' : 'Columns tab') + '</strong><p style="margin:4px 0 0 0; font-size:12px; color:#1e40af;">' + (fr ? 'Permissions colonne par colonne.' : 'Column-by-column permissions.') + '</p></div>'
    + '<div style="background:#eff6ff; border-radius:8px; padding:12px; grid-column:1/-1;"><strong style="color:#1e40af; font-size:13px;">📜 ' + (fr ? 'Onglet Règles' : 'Rules tab') + '</strong><p style="margin:4px 0 0 0; font-size:12px; color:#1e40af;">' + (fr ? 'Liste toutes les règles d\'accès actives en langage clair.' : 'Lists all active access rules in plain language.') + '</p></div></div>');

  // Summary
  var sumData = fr
    ? [['Ajouter/retirer des personnes','<strong>👥 Utilisateurs</strong>'],['Protéger une table','<strong>⚙️ Configurer</strong> → Portée "Table"'],['Cacher une colonne','<strong>⚙️ Configurer</strong> → Portée "Colonnes"'],['Accès personnalisé','<strong>👤 Attributs</strong> + <strong>⚙️ Configurer</strong>'],['Résumé des permissions','<strong>📊 Tables</strong> / <strong>📋 Colonnes</strong>'],['Règles actives','<strong>📜 Règles</strong>']]
    : [['Add/remove people','<strong>👥 Users</strong>'],['Protect a table','<strong>⚙️ Configure</strong> → Scope "Table"'],['Hide a column','<strong>⚙️ Configure</strong> → Scope "Columns"'],['Per-user access','<strong>👤 Attributes</strong> + <strong>⚙️ Configure</strong>'],['Permission summary','<strong>📊 Tables</strong> / <strong>📋 Columns</strong>'],['Active rules','<strong>📜 Rules</strong>']];
  html += '<div class="card" style="margin-top:12px; background:linear-gradient(135deg, #eff6ff, #f0fdf4); border:1px solid #bfdbfe;">'
    + '<h3 style="color:#1e40af; margin:0 0 12px 0;">🔑 ' + (fr ? 'Récapitulatif' : 'Summary') + '</h3>'
    + '<table style="width:100%; border-collapse:collapse; font-size:13px;"><thead><tr style="background:rgba(255,255,255,0.5);"><th style="padding:8px 10px; text-align:left; border-bottom:2px solid #bfdbfe;">' + (fr ? 'Je veux...' : 'I want to...') + '</th><th style="padding:8px 10px; text-align:left; border-bottom:2px solid #bfdbfe;">' + (fr ? 'J\'utilise...' : 'I use...') + '</th></tr></thead><tbody>';
  sumData.forEach(function(r) { html += '<tr><td style="padding:6px 10px; border-bottom:1px solid #e0f2fe;">' + r[0] + '</td><td style="padding:6px 10px; border-bottom:1px solid #e0f2fe;">' + r[1] + '</td></tr>'; });
  html += '</tbody></table></div>';

  // Best practices
  var tips = fr
    ? [['1. Commencez simple','Donnez les rôles de base avant de créer des règles avancées.'],['2. Moindre privilège','Donnez le minimum d\'accès nécessaire.'],['3. Protégez les données sensibles','Masquez les colonnes contenant des données personnelles.'],['4. Testez vos règles','Connectez-vous avec un compte Éditeur ou Lecteur pour vérifier.'],['5. Un seul Propriétaire suffit','Évitez de donner le rôle Propriétaire à tout le monde.']]
    : [['1. Start simple','Assign basic roles before creating advanced rules.'],['2. Least privilege','Give the minimum access needed.'],['3. Protect sensitive data','Hide columns containing personal data.'],['4. Test your rules','Log in with an Editor or Viewer account to verify.'],['5. One Owner is enough','Avoid giving the Owner role to everyone.']];
  html += c('', '<h3 style="color:#1e40af; margin:0 0 12px 0;">💡 ' + (fr ? 'Bonnes pratiques' : 'Best practices') + '</h3><div style="display:flex; flex-direction:column; gap:8px;">'
    + tips.map(function(t) { return '<div style="background:#f0fdf4; border-radius:8px; padding:10px 14px; font-size:13px;"><strong style="color:#166534;">' + t[0] + '</strong><span style="color:#166534;"> — ' + t[1] + '</span></div>'; }).join('')
    + '</div>');

  el.innerHTML = html;
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

function showModal(title, bodyHtml, confirmText, confirmClass) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalCancelBtn.textContent = t('modalCancel');
  modalConfirmBtn.textContent = confirmText || t('modalDelete');
  modalConfirmBtn.className = 'modal-btn ' + (confirmClass || 'modal-btn-danger');
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
    console.warn('Attribute table not found or inaccessible:', info.tableId, error.message);
    var errMsg = error.message.indexOf('KeyError') !== -1
      ? 'La table <strong>' + sanitizeForDisplay(info.tableId) + '</strong> n\'existe pas. Supprimez cet attribut et recréez-le.'
      : sanitizeForDisplay(error.message);
    attrDataTbody.innerHTML = '<tr><td colspan="3" style="color:#dc2626; padding:12px; font-size:13px;">' + errMsg + '</td></tr>';
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

// =============================================================================
// USERS TAB — Uses Vercel proxy to bypass CORS (works on SaaS + self-hosted)
// =============================================================================

var usersApiKeySetup = document.getElementById('users-apikey-setup');
var usersManagement = document.getElementById('users-management');
var usersRefreshBtn = document.getElementById('users-refresh-btn');
var usersSearchInput = document.getElementById('users-search');
var usersAddEmail = document.getElementById('users-add-email');
var usersAddRole = document.getElementById('users-add-role');
var usersAddBtn = document.getElementById('users-add-btn');
var usersListEl = document.getElementById('users-list');
var usersLoadingEl = document.getElementById('users-loading');
var usersEmptyEl = document.getElementById('users-empty');
var usersStatsEl = document.getElementById('users-stats');

var allUsers = [];
var usersFilterRole = 'all';
var userApiKey = '';
var gristServerUrl = ''; // e.g. "https://docs.getgrist.com"
var gristDocId = '';      // e.g. "t2q2MvbRBWE4"
var proxyAvailable = false;
var directApiAvailable = false; // true if CORS allows direct API calls
var useDirectApi = false;       // which mode is active
var usersPerPage = 10;
var usersCurrentPage = 1;

async function detectGristInfo() {
  var info = await getToken();
  // info.baseUrl = "https://docs.getgrist.com/api/docs/DOC_ID"
  var match = info.baseUrl.match(/^(https?:\/\/[^/]+)\/api\/docs\/([^/?]+)/);
  if (match) {
    gristServerUrl = match[1];
    gristDocId = match[2];
  }
  console.log('Grist server:', gristServerUrl, 'Doc:', gristDocId);
}

function getUserApiStorageKey() {
  return 'grist_user_api_key_' + gristDocId;
}

function loadUserApiKey() {
  try { userApiKey = localStorage.getItem(getUserApiStorageKey()) || ''; } catch (e) { userApiKey = ''; }
  return userApiKey;
}

function saveUserApiKey(key) {
  userApiKey = key.replace(/[^\x20-\x7E]/g, '').trim();
  try { localStorage.setItem(getUserApiStorageKey(), userApiKey); } catch (e) {}
}

function clearUserApiKey() {
  userApiKey = '';
  try { localStorage.removeItem(getUserApiStorageKey()); } catch (e) {}
}

// Direct API call (when CORS is allowed, e.g. self-hosted with proper config)
async function usersDirectFetch(endpoint, method, body) {
  method = method || 'GET';
  var url = gristServerUrl + '/api/docs/' + gristDocId + endpoint;
  var opts = {
    method: method,
    headers: {
      'Authorization': 'Bearer ' + userApiKey,
      'Content-Type': 'application/json'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  var resp = await fetch(url, opts);
  if (!resp.ok) {
    var errText = await resp.text();
    throw new Error(resp.status + ': ' + errText);
  }
  var text = await resp.text();
  return text ? JSON.parse(text) : {};
}

// Proxy API call (when CORS blocks direct calls)
async function usersProxyFetch(endpoint, method, body) {
  method = method || 'GET';
  var proxyUrl = window.location.origin + '/api/proxy';
  var payload = {
    gristUrl: gristServerUrl,
    docId: gristDocId,
    endpoint: endpoint,
    method: method,
    apiKey: userApiKey
  };
  if (body) payload.body = body;

  var resp = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    var errText = await resp.text();
    throw new Error(resp.status + ': ' + errText);
  }
  var text = await resp.text();
  return text ? JSON.parse(text) : {};
}

// Smart fetch: use direct if CORS allows, otherwise proxy
async function usersApiFetch(endpoint, method, body) {
  if (useDirectApi) {
    return usersDirectFetch(endpoint, method, body);
  }
  return usersProxyFetch(endpoint, method, body);
}

function renderUsersStats() {
  var counts = { all: allUsers.length, owners: 0, editors: 0, viewers: 0, members: 0 };
  allUsers.forEach(function(u) {
    if (u.access === 'owners') counts.owners++;
    else if (u.access === 'editors') counts.editors++;
    else if (u.access === 'viewers') counts.viewers++;
    else if (u.access === 'members') counts.members++;
  });

  var html = '';
  html += '<span class="users-stat all' + (usersFilterRole === 'all' ? ' active' : '') + '" onclick="filterUsers(\'all\')">' + counts.all + ' Total</span>';
  if (counts.owners) html += '<span class="users-stat owners' + (usersFilterRole === 'owners' ? ' active' : '') + '" onclick="filterUsers(\'owners\')">👑 ' + counts.owners + ' Propriétaire' + (counts.owners > 1 ? 's' : '') + '</span>';
  if (counts.editors) html += '<span class="users-stat editors' + (usersFilterRole === 'editors' ? ' active' : '') + '" onclick="filterUsers(\'editors\')">✏️ ' + counts.editors + ' Éditeur' + (counts.editors > 1 ? 's' : '') + '</span>';
  if (counts.viewers) html += '<span class="users-stat viewers' + (usersFilterRole === 'viewers' ? ' active' : '') + '" onclick="filterUsers(\'viewers\')">👁️ ' + counts.viewers + ' Lecteur' + (counts.viewers > 1 ? 's' : '') + '</span>';
  if (counts.members) html += '<span class="users-stat members' + (usersFilterRole === 'members' ? ' active' : '') + '" onclick="filterUsers(\'members\')">🔗 ' + counts.members + ' Membre' + (counts.members > 1 ? 's' : '') + '</span>';
  usersStatsEl.innerHTML = html;
}

function filterUsers(role) {
  usersFilterRole = role;
  usersCurrentPage = 1;
  renderUsersStats();
  renderUsersList();
}

function getAvatarClass(access) {
  if (access === 'owners') return 'owner';
  if (access === 'editors') return 'editor';
  if (access === 'viewers') return 'viewer';
  return 'member';
}

function getRoleSelectClass(access) {
  if (access === 'owners') return 'role-owner';
  if (access === 'editors') return 'role-editor';
  if (access === 'viewers') return 'role-viewer';
  return 'role-member';
}

function getInitials(name, email) {
  if (name && name.trim()) {
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return '??';
}

function goToUsersPage(page) {
  usersCurrentPage = page;
  renderUsersList();
}

function renderUsersList() {
  var search = (usersSearchInput.value || '').trim().toLowerCase();
  var filtered = allUsers.filter(function(u) {
    if (usersFilterRole !== 'all' && u.access !== usersFilterRole) return false;
    if (search) {
      var hay = ((u.name || '') + ' ' + (u.email || '')).toLowerCase();
      return hay.indexOf(search) !== -1;
    }
    return true;
  });

  if (filtered.length === 0) {
    usersListEl.innerHTML = '';
    usersEmptyEl.classList.remove('hidden');
    return;
  }

  usersEmptyEl.classList.add('hidden');

  // Pagination
  var totalPages = Math.ceil(filtered.length / usersPerPage);
  if (usersCurrentPage > totalPages) usersCurrentPage = totalPages;
  if (usersCurrentPage < 1) usersCurrentPage = 1;
  var start = (usersCurrentPage - 1) * usersPerPage;
  var pageUsers = filtered.slice(start, start + usersPerPage);

  var html = '';
  pageUsers.forEach(function(u) {
    var initials = getInitials(u.name, u.email);
    var avatarCls = getAvatarClass(u.access);
    var roleCls = getRoleSelectClass(u.access);
    var displayName = u.name || u.email || '—';

    html += '<div class="user-card">';
    html += '  <div class="user-info">';
    html += '    <div class="user-avatar ' + avatarCls + '">' + sanitizeForDisplay(initials) + '</div>';
    html += '    <div class="user-details">';
    html += '      <div class="user-name">' + sanitizeForDisplay(displayName) + '</div>';
    html += '      <div class="user-email">' + sanitizeForDisplay(u.email || '') + '</div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="user-actions">';
    html += '    <select class="role-select ' + roleCls + '" onchange="changeUserRole(\'' + sanitizeForDisplay(u.email).replace(/'/g, "\\'") + '\', this.value)">';
    html += '      <option value="owners"' + (u.access === 'owners' ? ' selected' : '') + '>👑 Propriétaire</option>';
    html += '      <option value="editors"' + (u.access === 'editors' ? ' selected' : '') + '>✏️ Éditeur</option>';
    html += '      <option value="viewers"' + (u.access === 'viewers' ? ' selected' : '') + '>👁️ Lecteur</option>';
    html += '    </select>';
    html += '    <button class="user-remove-btn" onclick="removeUser(\'' + sanitizeForDisplay(u.email).replace(/'/g, "\\'") + '\')" title="Retirer">✕</button>';
    html += '  </div>';
    html += '</div>';
  });

  // Pagination bar (only if more than 1 page)
  if (totalPages > 1) {
    html += '<div style="display:flex; align-items:center; justify-content:center; gap:6px; margin-top:12px; flex-wrap:wrap;">';
    html += '<button class="btn btn-sm btn-secondary" onclick="goToUsersPage(' + (usersCurrentPage - 1) + ')"' + (usersCurrentPage <= 1 ? ' disabled style="opacity:.4;cursor:default;padding:6px 10px;"' : ' style="padding:6px 10px;"') + '>◀</button>';
    for (var p = 1; p <= totalPages; p++) {
      if (p === usersCurrentPage) {
        html += '<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#3b82f6;color:#fff;font-weight:700;font-size:13px;">' + p + '</span>';
      } else if (p === 1 || p === totalPages || Math.abs(p - usersCurrentPage) <= 1) {
        html += '<button class="btn btn-sm btn-secondary" style="width:32px;height:32px;padding:0;font-size:13px;" onclick="goToUsersPage(' + p + ')">' + p + '</button>';
      } else if (Math.abs(p - usersCurrentPage) === 2) {
        html += '<span style="color:#94a3b8;font-size:12px;">…</span>';
      }
    }
    html += '<button class="btn btn-sm btn-secondary" onclick="goToUsersPage(' + (usersCurrentPage + 1) + ')"' + (usersCurrentPage >= totalPages ? ' disabled style="opacity:.4;cursor:default;padding:6px 10px;"' : ' style="padding:6px 10px;"') + '>▶</button>';
    html += '<span style="font-size:12px;color:#94a3b8;margin-left:8px;">' + filtered.length + ' utilisateur' + (filtered.length > 1 ? 's' : '') + '</span>';
    html += '</div>';
  }

  usersListEl.innerHTML = html;
}

async function loadUsers() {
  usersLoadingEl.classList.remove('hidden');
  usersListEl.innerHTML = '';
  usersEmptyEl.classList.add('hidden');

  try {
    var data = await usersApiFetch('/access');
    allUsers = [];
    if (data.users) {
      data.users.forEach(function(u) {
        if (u.email === 'everyone@getgrist.com' || u.email === 'anon@getgrist.com') return;
        allUsers.push({
          id: u.id,
          email: u.email || '',
          name: u.name || '',
          access: u.access || 'viewers'
        });
      });
    }
    var order = { owners: 0, editors: 1, viewers: 2, members: 3 };
    allUsers.sort(function(a, b) {
      var diff = (order[a.access] || 9) - (order[b.access] || 9);
      if (diff !== 0) return diff;
      return (a.email || '').localeCompare(b.email || '');
    });

    renderUsersStats();
    renderUsersList();
  } catch (e) {
    console.error('Error loading users:', e);
    showToast(t('errorLoadUsers') + e.message, 'error', 5000);
  } finally {
    usersLoadingEl.classList.add('hidden');
  }
}

async function changeUserRole(email, newRole) {
  try {
    var delta = { users: {} };
    delta.users[email] = newRole;
    await usersApiFetch('/access', 'PATCH', { delta: delta });
    showToast(t('roleChanged'), 'success');
    await loadUsers();
  } catch (e) {
    console.error('Error changing role:', e);
    showToast(t('roleChangeError') + e.message, 'error', 5000);
    await loadUsers();
  }
}

async function removeUser(email) {
  var bodyHtml = '<p style="font-size:14px; color:#334155; margin:0;">Retirer <strong>' + sanitizeForDisplay(email) + '</strong> du document ?</p>'
    + '<p style="font-size:12px; color:#94a3b8; margin:8px 0 0 0;">Cette personne n\'aura plus accès au document.</p>';
  var confirmed = await showModal('Retirer un utilisateur', bodyHtml, 'Retirer', 'modal-btn-danger');
  if (!confirmed) return;
  try {
    var delta = { users: {} };
    delta.users[email] = null;
    var result = await usersApiFetch('/access', 'PATCH', { delta: delta });
    console.log('Remove user result:', result);
    // Reload and verify
    var countBefore = allUsers.length;
    await loadUsers();
    if (allUsers.length < countBefore) {
      showToast('✅ ' + email + ' retiré', 'success');
    } else {
      showToast('⚠️ ' + email + ' : la suppression n\'a pas été appliquée. Vérifiez vos permissions.', 'warning', 5000);
    }
  } catch (e) {
    console.error('Error removing user:', e);
    showToast('❌ ' + parseApiError(e.message), 'error', 5000);
  }
}

function parseApiError(errMsg) {
  try {
    var match = errMsg.match(/\d+:\s*(.*)/);
    if (match) {
      var json = JSON.parse(match[1]);
      if (json.error) {
        if (json.error.indexOf('collaborators') !== -1 || json.error.indexOf('shares permitted') !== -1) {
          var max = json.details && json.details.limit ? json.details.limit.maximum : '?';
          return '⚠️ Limite atteinte : ' + max + ' collaborateurs max sur ce plan. Passez au plan supérieur ou ajoutez l\'utilisateur comme membre de l\'équipe.';
        }
        return json.error;
      }
    }
  } catch (e) {}
  return errMsg;
}

async function addUser() {
  var email = usersAddEmail.value.trim();
  var role = usersAddRole.value;
  if (!email) { showToast('❌ Email requis', 'error'); return; }

  usersAddBtn.disabled = true;
  try {
    var delta = { users: {} };
    delta.users[email] = role;
    await usersApiFetch('/access', 'PATCH', { delta: delta });
    showToast('✅ ' + email + ' ajouté en tant que ' + role, 'success');
    usersAddEmail.value = '';
    await loadUsers();
  } catch (e) {
    console.error('Error adding user:', e);
    showToast('❌ ' + parseApiError(e.message), 'error', 6000);
  } finally {
    usersAddBtn.disabled = false;
  }
}

function showUsersSetup() {
  if (usersApiKeySetup) usersApiKeySetup.classList.remove('hidden');
  if (usersManagement) usersManagement.classList.add('hidden');
}

function showUsersManagement() {
  if (usersApiKeySetup) usersApiKeySetup.classList.add('hidden');
  if (usersManagement) usersManagement.classList.remove('hidden');
}

function setupUsersListeners() {
  if (usersRefreshBtn) usersRefreshBtn.addEventListener('click', function() { loadUsers(); });
  if (usersSearchInput) usersSearchInput.addEventListener('input', function() { usersCurrentPage = 1; renderUsersList(); });
  if (usersAddBtn) usersAddBtn.addEventListener('click', addUser);
  if (usersAddEmail) usersAddEmail.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addUser();
  });

  var helpToggle = document.getElementById('users-apikey-help-toggle');
  var helpDiv = document.getElementById('users-apikey-help');
  var apiInput = document.getElementById('users-apikey-input');
  var saveBtn = document.getElementById('users-apikey-save-btn');
  var msgDiv = document.getElementById('users-apikey-message');
  var disconnectBtn = document.getElementById('users-disconnect-btn');

  if (helpToggle && helpDiv) {
    helpToggle.addEventListener('click', function(e) {
      e.preventDefault();
      helpDiv.classList.toggle('hidden');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async function() {
      var key = apiInput ? apiInput.value.trim() : '';
      if (!key) {
        if (msgDiv) { msgDiv.innerHTML = '<div class="message message-error">❌ Clé API requise</div>'; msgDiv.classList.remove('hidden'); }
        return;
      }
      saveBtn.disabled = true;
      if (msgDiv) { msgDiv.innerHTML = '<div class="message message-info">⏳ Vérification...</div>'; msgDiv.classList.remove('hidden'); }

      saveUserApiKey(key);
      try {
        // Try proxy first (reliable), then direct
        if (proxyAvailable) {
          useDirectApi = false;
          await usersProxyFetch('/access');
        } else {
          useDirectApi = true;
          await usersDirectFetch('/access');
        }
        var mode = useDirectApi ? 'direct' : 'proxy';
        console.log('Users API: ' + mode + ' mode');
        if (msgDiv) msgDiv.innerHTML = '<div class="message message-success">✅ Connecté</div>';
        setTimeout(function() {
          showUsersManagement();
          loadUsers();
        }, 500);
      } catch (e) {
        clearUserApiKey();
        if (msgDiv) { msgDiv.innerHTML = '<div class="message message-error">❌ Clé invalide : ' + sanitizeForDisplay(parseApiError(e.message)) + '</div>'; }
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  if (apiInput) {
    apiInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && saveBtn) saveBtn.click();
    });
  }

  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', function() {
      clearUserApiKey();
      allUsers = [];
      if (usersListEl) usersListEl.innerHTML = '';
      if (usersStatsEl) usersStatsEl.innerHTML = '';
      if (apiInput) apiInput.value = '';
      showUsersSetup();
      showToast('🔒 Déconnecté', 'info');
    });
  }
}

// Test if direct API calls work (CORS allowed including Authorization header)
// Must test with the actual Authorization header since some servers allow simple CORS but block auth headers
async function detectDirectApi() {
  if (!userApiKey) { directApiAvailable = false; return false; }
  try {
    var url = gristServerUrl + '/api/docs/' + gristDocId + '/access';
    var resp = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + userApiKey }
    });
    // If we get here without TypeError, CORS passed (even if 401/403)
    directApiAvailable = true;
  } catch (e) {
    directApiAvailable = false;
  }
  return directApiAvailable;
}

// Check if the proxy endpoint is available (Vercel deployment vs static hosting)
async function detectProxy() {
  try {
    var resp = await fetch(window.location.origin + '/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gristUrl: '', docId: '', endpoint: '', apiKey: '' })
    });
    proxyAvailable = resp.status !== 404;
  } catch (e) {
    proxyAvailable = false;
  }
  return proxyAvailable;
}

function showUsersNoProxy() {
  if (usersApiKeySetup) usersApiKeySetup.classList.add('hidden');
  if (usersManagement) usersManagement.classList.add('hidden');
  var el = document.getElementById('users-no-proxy');
  if (el) el.classList.remove('hidden');
}

async function initUsersTab() {
  await detectGristInfo();
  setupUsersListeners();

  // Step 1: Check for saved API key
  var key = loadUserApiKey();

  // Step 2: Detect available mode (proxy first, then direct)
  var hasProxy = await detectProxy();

  if (!key) {
    if (hasProxy) {
      showUsersSetup();
    } else {
      showUsersNoProxy();
    }
    return;
  }

  // Step 3: Try proxy first (most reliable, works everywhere)
  if (hasProxy) {
    useDirectApi = false;
    console.log('Users API: proxy mode');
    try {
      await usersApiFetch('/access');
      showUsersManagement();
      loadUsers();
      return;
    } catch (e) {
      clearUserApiKey();
      showUsersSetup();
      return;
    }
  }

  // Step 4: No proxy — try direct API (self-hosted with CORS configured)
  var directOk = await detectDirectApi();
  if (directOk) {
    useDirectApi = true;
    console.log('Users API: direct mode (CORS allowed)');
    try {
      await usersDirectFetch('/access');
      showUsersManagement();
      loadUsers();
      return;
    } catch (e) {
      clearUserApiKey();
      showUsersSetup();
      return;
    }
  }

  // Step 5: Nothing works
  showUsersNoProxy();
}

// Start
init();
renderGuide();
initUsersTab();
