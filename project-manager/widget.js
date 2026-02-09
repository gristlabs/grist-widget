// =============================================================================
// GRIST PROJECT MANAGER WIDGET
// =============================================================================

var currentLang = 'fr';

var i18n = {
  fr: {
    appTitle: 'Gestion de Projet',
    appSubtitle: 'Organisez et suivez vos tâches avec le tableau Kanban ou la vue tableau',
    notInGrist: 'Ce widget doit être utilisé dans Grist.',
    tabKanban: 'Kanban',
    tabTable: 'Tableau',
    tabGantt: 'Gantt',
    tabTemplates: 'Templates',
    newTask: 'Nouvelle tâche',
    statTotal: 'Total',
    statTodo: 'À faire',
    statProgress: 'En cours',
    statDone: 'Terminées',
    colTodo: 'À faire',
    colProgress: 'En cours',
    colDone: 'Terminé',
    noTasks: 'Aucune tâche',
    addTask: '+ Ajouter une tâche',
    tableTitle: 'Tableau de Gestion',
    tableSubtitle: 'Gérez vos tâches avec édition inline avancée',
    searchPlaceholder: 'Rechercher une tâche...',
    allStatuses: 'Tous les statuts',
    allPriorities: 'Toutes priorités',
    colTaskName: 'Tâche',
    colStatus: 'Statut',
    colPriority: 'Priorité',
    colAssignee: 'Assigné à',
    colStartDate: 'Date de début',
    colDueDate: 'Échéance',
    colActions: 'Actions',
    ganttTitle: 'Diagramme de Gantt',
    ganttYear: 'Année :',
    ganttToday: "Aujourd'hui",
    ganttDays: 'Jours',
    ganttWeeks: 'Semaines',
    ganttMonths: 'Mois',
    ganttFullYear: 'Année complète',
    ganttNavInfo: 'Navigation infinie vers autres années',
    ganttViewRange: 'Vue :',
    templatesTitle: 'Tâches Préformatées',
    templatesSubtitle: 'Gérez les modèles de tâches disponibles pour tous les utilisateurs',
    newTemplate: 'Nouveau modèle',
    modalNewTask: 'Nouvelle tâche',
    modalEditTask: 'Modifier la tâche',
    modalNewTemplate: 'Nouveau modèle de tâche',
    fieldTitle: 'Titre *',
    fieldDescription: 'Description',
    fieldStatus: 'Statut',
    fieldPriority: 'Priorité',
    fieldAssignee: 'Assigné à',
    fieldGroup: 'Groupe',
    fieldStartDate: 'Date de début',
    fieldDueDate: 'Échéance',
    fieldCategory: 'Catégorie',
    fieldEstimatedTime: 'Temps estimé (h)',
    priorityHigh: 'Haute',
    priorityMedium: 'Moyenne',
    priorityLow: 'Basse',
    statusTodo: 'À faire',
    statusProgress: 'En cours',
    statusDone: 'Terminé',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    confirmDelete: 'Supprimer cette tâche ?',
    confirmDeleteTemplate: 'Supprimer ce modèle ?',
    taskCreated: 'Tâche créée !',
    taskUpdated: 'Tâche mise à jour !',
    taskDeleted: 'Tâche supprimée.',
    taskMoved: 'Tâche déplacée.',
    templateCreated: 'Modèle créé !',
    templateDeleted: 'Modèle supprimé.',
    overdue: 'En retard',
    noDate: 'Aucune date',
    notDefined: 'Non définie',
    tablesCreated: 'Tables créées automatiquement.',
    useTemplate: 'Utiliser',
    totalTemplates: 'Total modèles',
    totalUsages: 'Utilisations totales',
    mostUsed: 'Plus utilisé',
    categories: 'Catégories',
    tabTeam: 'Équipe',
    teamUsersTitle: 'Utilisateurs',
    teamUsersSubtitle: 'Gérez les membres de votre équipe',
    teamGroupsTitle: 'Groupes',
    teamGroupsSubtitle: 'Organisez vos utilisateurs en groupes',
    addUser: 'Ajouter',
    addGroup: 'Ajouter',
    modalNewUser: 'Nouvel utilisateur',
    modalNewGroup: 'Nouveau groupe',
    fieldName: 'Nom *',
    fieldEmail: 'Email',
    fieldRole: 'Rôle',
    roleAdmin: 'Administrateur',
    roleMember: 'Membre',
    roleViewer: 'Lecteur',
    userCreated: 'Utilisateur ajouté !',
    userDeleted: 'Utilisateur supprimé.',
    groupCreated: 'Groupe créé !',
    groupDeleted: 'Groupe supprimé.',
    confirmDeleteUser: 'Supprimer cet utilisateur ?',
    confirmDeleteGroup: 'Supprimer ce groupe ?',
    noUsers: 'Aucun utilisateur',
    noGroups: 'Aucun groupe',
    members: 'membres',
    progression: 'Progression',
    advancement: 'Avancement',
    startLabel: 'Début :',
    dueLabel: 'Échéance :',
    quickActions: 'Actions rapides',
    reopenTask: 'Rouvrir la tâche',
    startTask: 'Démarrer la tâche',
    completeTask: 'Terminer la tâche',
    changePriority: 'Changer la priorité',
    taskSummary: 'Résumé de la tâche',
    addAssignee: 'Ajouter',
    searchAssignee: 'Rechercher des noms...'
  },
  en: {
    appTitle: 'Project Management',
    appSubtitle: 'Organize and track your tasks with the Kanban board or table view',
    notInGrist: 'This widget must be used inside Grist.',
    tabKanban: 'Kanban',
    tabTable: 'Table',
    tabGantt: 'Gantt',
    tabTemplates: 'Templates',
    newTask: 'New task',
    statTotal: 'Total',
    statTodo: 'To do',
    statProgress: 'In progress',
    statDone: 'Completed',
    colTodo: 'To do',
    colProgress: 'In progress',
    colDone: 'Done',
    noTasks: 'No tasks',
    addTask: '+ Add a task',
    tableTitle: 'Management Table',
    tableSubtitle: 'Manage your tasks with advanced inline editing',
    searchPlaceholder: 'Search a task...',
    allStatuses: 'All statuses',
    allPriorities: 'All priorities',
    colTaskName: 'Task',
    colStatus: 'Status',
    colPriority: 'Priority',
    colAssignee: 'Assigned to',
    colStartDate: 'Start date',
    colDueDate: 'Due date',
    colActions: 'Actions',
    ganttTitle: 'Gantt Chart',
    ganttYear: 'Year:',
    ganttToday: 'Today',
    ganttDays: 'Days',
    ganttWeeks: 'Weeks',
    ganttMonths: 'Months',
    ganttFullYear: 'Full year',
    ganttNavInfo: 'Infinite navigation to other years',
    ganttViewRange: 'View:',
    templatesTitle: 'Task Templates',
    templatesSubtitle: 'Manage task templates available to all users',
    newTemplate: 'New template',
    modalNewTask: 'New task',
    modalEditTask: 'Edit task',
    modalNewTemplate: 'New task template',
    fieldTitle: 'Title *',
    fieldDescription: 'Description',
    fieldStatus: 'Status',
    fieldPriority: 'Priority',
    fieldAssignee: 'Assigned to',
    fieldGroup: 'Group',
    fieldStartDate: 'Start date',
    fieldDueDate: 'Due date',
    fieldCategory: 'Category',
    fieldEstimatedTime: 'Estimated time (h)',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    statusTodo: 'To do',
    statusProgress: 'In progress',
    statusDone: 'Done',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Delete this task?',
    confirmDeleteTemplate: 'Delete this template?',
    taskCreated: 'Task created!',
    taskUpdated: 'Task updated!',
    taskDeleted: 'Task deleted.',
    taskMoved: 'Task moved.',
    templateCreated: 'Template created!',
    templateDeleted: 'Template deleted.',
    overdue: 'Overdue',
    noDate: 'No date',
    notDefined: 'Not defined',
    tablesCreated: 'Tables created automatically.',
    useTemplate: 'Use',
    totalTemplates: 'Total templates',
    totalUsages: 'Total usages',
    mostUsed: 'Most used',
    categories: 'Categories',
    tabTeam: 'Team',
    teamUsersTitle: 'Users',
    teamUsersSubtitle: 'Manage your team members',
    teamGroupsTitle: 'Groups',
    teamGroupsSubtitle: 'Organize your users into groups',
    addUser: 'Add',
    addGroup: 'Add',
    modalNewUser: 'New user',
    modalNewGroup: 'New group',
    fieldName: 'Name *',
    fieldEmail: 'Email',
    fieldRole: 'Role',
    roleAdmin: 'Administrator',
    roleMember: 'Member',
    roleViewer: 'Viewer',
    userCreated: 'User added!',
    userDeleted: 'User deleted.',
    groupCreated: 'Group created!',
    groupDeleted: 'Group deleted.',
    confirmDeleteUser: 'Delete this user?',
    confirmDeleteGroup: 'Delete this group?',
    noUsers: 'No users',
    noGroups: 'No groups',
    members: 'members',
    progression: 'Progression',
    advancement: 'Progress',
    startLabel: 'Start:',
    dueLabel: 'Due:',
    quickActions: 'Quick Actions',
    reopenTask: 'Reopen task',
    startTask: 'Start task',
    completeTask: 'Complete task',
    changePriority: 'Change priority',
    taskSummary: 'Task Summary',
    addAssignee: 'Add',
    searchAssignee: 'Search names...'
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
    if (i18n[currentLang] && i18n[currentLang][key]) {
      el.textContent = i18n[currentLang][key];
    }
  });
  refreshAllViews();
}

// =============================================================================
// STATE
// =============================================================================

var tasks = [];
var users = [];
var groups = [];
var templates = [];
var ganttMode = 'days';
var ganttYear = new Date().getFullYear();
var ganttMonth = new Date().getMonth();

var TASKS_TABLE = 'PM_Tasks';
var USERS_TABLE = 'PM_Users';
var GROUPS_TABLE = 'PM_Groups';
var TEMPLATES_TABLE = 'PM_Templates';

var isOwner = false;
var currentUserEmail = '';

// =============================================================================
// UTILS
// =============================================================================

function isInsideGrist() {
  try { return window.frameElement !== null || window !== window.parent; }
  catch (e) { return true; }
}

function showToast(msg, type) {
  var container = document.getElementById('toast-container');
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'info');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3000);
}

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(d) {
  if (!d) return '';
  var date = new Date(d * 1000); // Grist stores dates as epoch seconds
  if (isNaN(date.getTime())) {
    date = new Date(d);
    if (isNaN(date.getTime())) return '';
  }
  return date.toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toEpoch(dateStr) {
  if (!dateStr) return null;
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor(d.getTime() / 1000);
}

function isOverdue(task) {
  if (!task.Due_Date || task.Status === 'done') return false;
  var now = Math.floor(Date.now() / 1000);
  return task.Due_Date < now;
}

function priorityLabel(p) {
  if (p === 'high') return t('priorityHigh');
  if (p === 'medium') return t('priorityMedium');
  if (p === 'low') return t('priorityLow');
  return p || '';
}

function statusLabel(s) {
  if (s === 'todo') return t('statusTodo');
  if (s === 'progress') return t('statusProgress');
  if (s === 'done') return t('statusDone');
  return s || '';
}

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
  if (tabId === 'kanban') renderKanbanView();
  if (tabId === 'table') renderTableView();
  if (tabId === 'gantt') renderGanttView();
  if (tabId === 'templates') renderTemplatesView();
  if (tabId === 'team') renderTeamView();
}

// =============================================================================
// INIT — CREATE TABLES IF NEEDED
// =============================================================================

async function ensureTables() {
  try {
    var existingTables = await grist.docApi.listTables();

    if (existingTables.indexOf(TASKS_TABLE) === -1) {
      await grist.docApi.applyUserActions([
        ['AddTable', TASKS_TABLE, [
          { id: 'Title', type: 'Text' },
          { id: 'Description', type: 'Text' },
          { id: 'Status', type: 'Choice', widgetOptions: JSON.stringify({ choices: ['todo', 'progress', 'done'] }) },
          { id: 'Priority', type: 'Choice', widgetOptions: JSON.stringify({ choices: ['high', 'medium', 'low'] }) },
          { id: 'Assignee', type: 'Text' },
          { id: 'Group_Name', type: 'Text' },
          { id: 'Start_Date', type: 'Date' },
          { id: 'Due_Date', type: 'Date' },
          { id: 'Category', type: 'Text' },
          { id: 'Created_At', type: 'Date' }
        ]]
      ]);
    }

    if (existingTables.indexOf(USERS_TABLE) === -1) {
      await grist.docApi.applyUserActions([
        ['AddTable', USERS_TABLE, [
          { id: 'Name', type: 'Text' },
          { id: 'Email', type: 'Text' },
          { id: 'Role', type: 'Choice', widgetOptions: JSON.stringify({ choices: ['admin', 'member', 'viewer'] }) },
          { id: 'Group_Name', type: 'Text' }
        ]]
      ]);
    }

    if (existingTables.indexOf(GROUPS_TABLE) === -1) {
      await grist.docApi.applyUserActions([
        ['AddTable', GROUPS_TABLE, [
          { id: 'Name', type: 'Text' },
          { id: 'Description', type: 'Text' }
        ]]
      ]);
    }

    if (existingTables.indexOf(TEMPLATES_TABLE) === -1) {
      await grist.docApi.applyUserActions([
        ['AddTable', TEMPLATES_TABLE, [
          { id: 'Title', type: 'Text' },
          { id: 'Description', type: 'Text' },
          { id: 'Priority', type: 'Choice', widgetOptions: JSON.stringify({ choices: ['high', 'medium', 'low'] }) },
          { id: 'Category', type: 'Text' },
          { id: 'Estimated_Hours', type: 'Numeric' },
          { id: 'Usage_Count', type: 'Int' },
          { id: 'Updated_At', type: 'Date' }
        ]]
      ]);
    }

    showToast(t('tablesCreated'), 'success');
  } catch (e) {
    console.error('Error ensuring tables:', e);
  }
}

// =============================================================================
// LOAD DATA
// =============================================================================

async function loadAllData() {
  try {
    var taskData = await grist.docApi.fetchTable(TASKS_TABLE);
    tasks = [];
    if (taskData && taskData.id) {
      for (var i = 0; i < taskData.id.length; i++) {
        tasks.push({
          id: taskData.id[i],
          Title: taskData.Title ? taskData.Title[i] : '',
          Description: taskData.Description ? taskData.Description[i] : '',
          Status: taskData.Status ? taskData.Status[i] : 'todo',
          Priority: taskData.Priority ? taskData.Priority[i] : 'medium',
          Assignee: taskData.Assignee ? taskData.Assignee[i] : '',
          Group_Name: taskData.Group_Name ? taskData.Group_Name[i] : '',
          Start_Date: taskData.Start_Date ? taskData.Start_Date[i] : null,
          Due_Date: taskData.Due_Date ? taskData.Due_Date[i] : null,
          Category: taskData.Category ? taskData.Category[i] : '',
          Created_At: taskData.Created_At ? taskData.Created_At[i] : null
        });
      }
    }
  } catch (e) {
    console.warn('Could not load tasks:', e);
    tasks = [];
  }

  try {
    var userData = await grist.docApi.fetchTable(USERS_TABLE);
    users = [];
    if (userData && userData.id) {
      for (var i = 0; i < userData.id.length; i++) {
        users.push({
          id: userData.id[i],
          Name: userData.Name ? userData.Name[i] : '',
          Email: userData.Email ? userData.Email[i] : '',
          Role: userData.Role ? userData.Role[i] : 'member',
          Group_Name: userData.Group_Name ? userData.Group_Name[i] : ''
        });
      }
    }
  } catch (e) {
    users = [];
  }

  try {
    var groupData = await grist.docApi.fetchTable(GROUPS_TABLE);
    groups = [];
    if (groupData && groupData.id) {
      for (var i = 0; i < groupData.id.length; i++) {
        groups.push({
          id: groupData.id[i],
          Name: groupData.Name ? groupData.Name[i] : '',
          Description: groupData.Description ? groupData.Description[i] : ''
        });
      }
    }
  } catch (e) {
    groups = [];
  }

  try {
    var tplData = await grist.docApi.fetchTable(TEMPLATES_TABLE);
    templates = [];
    if (tplData && tplData.id) {
      for (var i = 0; i < tplData.id.length; i++) {
        templates.push({
          id: tplData.id[i],
          Title: tplData.Title ? tplData.Title[i] : '',
          Description: tplData.Description ? tplData.Description[i] : '',
          Priority: tplData.Priority ? tplData.Priority[i] : 'medium',
          Category: tplData.Category ? tplData.Category[i] : '',
          Estimated_Hours: tplData.Estimated_Hours ? tplData.Estimated_Hours[i] : 0,
          Usage_Count: tplData.Usage_Count ? tplData.Usage_Count[i] : 0,
          Updated_At: tplData.Updated_At ? tplData.Updated_At[i] : null
        });
      }
    }
  } catch (e) {
    templates = [];
  }

  refreshAllViews();
}

function refreshAllViews() {
  updateStats();
  var activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    var tab = activeTab.getAttribute('data-tab');
    if (tab === 'kanban') renderKanbanView();
    if (tab === 'table') renderTableView();
    if (tab === 'gantt') renderGanttView();
    if (tab === 'templates') renderTemplatesView();
    if (tab === 'team') renderTeamView();
  }
}

// =============================================================================
// STATS
// =============================================================================

function updateStats() {
  var total = tasks.length;
  var todo = tasks.filter(function(t) { return t.Status === 'todo'; }).length;
  var progress = tasks.filter(function(t) { return t.Status === 'progress'; }).length;
  var done = tasks.filter(function(t) { return t.Status === 'done'; }).length;
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-todo').textContent = todo;
  document.getElementById('stat-progress').textContent = progress;
  document.getElementById('stat-done').textContent = done;
}

// =============================================================================
// KANBAN VIEW
// =============================================================================

function renderKanbanView() {
  var board = document.getElementById('kanban-board');
  var statuses = [
    { key: 'todo', label: t('colTodo'), cssClass: 'col-todo' },
    { key: 'progress', label: t('colProgress'), cssClass: 'col-progress' },
    { key: 'done', label: t('colDone'), cssClass: 'col-done' }
  ];

  var html = '';
  for (var s = 0; s < statuses.length; s++) {
    var st = statuses[s];
    var colTasks = tasks.filter(function(task) { return task.Status === st.key; });

    html += '<div class="kanban-column ' + st.cssClass + '">';
    html += '<div class="kanban-col-header">';
    html += '<div style="display:flex;align-items:center;gap:8px;">' + st.label + ' <span class="col-count">' + colTasks.length + '</span></div>';
    html += '<button class="col-add" onclick="openNewTaskModal(\'' + st.key + '\')">+</button>';
    html += '</div>';
    html += '<div class="kanban-cards" data-status="' + st.key + '" ondragover="onDragOver(event)" ondrop="onDrop(event)" ondragleave="onDragLeave(event)">';

    if (colTasks.length === 0) {
      html += '<div class="kanban-empty"><div class="kanban-empty-icon">📝</div>' + t('noTasks') + '</div>';
    } else {
      for (var i = 0; i < colTasks.length; i++) {
        html += renderTaskCard(colTasks[i]);
      }
    }

    html += '</div>';
    html += '<button class="kanban-add-btn" onclick="openNewTaskModal(\'' + st.key + '\')">' + t('addTask') + '</button>';
    html += '</div>';
  }

  board.innerHTML = html;
}

function renderTaskCard(task) {
  var overdueHtml = isOverdue(task) ? ' <span class="overdue-badge">' + t('overdue') + '</span>' : '';
  var dotClass = task.Priority === 'high' ? 'dot-high' : (task.Priority === 'medium' ? 'dot-medium' : 'dot-low');

  var html = '<div class="task-card" draggable="true" ondragstart="onDragStart(event, ' + task.id + ')" data-id="' + task.id + '" ondblclick="openEditTaskModal(' + task.id + ')">';
  html += '<div class="task-card-header">';
  html += '<div class="task-card-title" style="cursor:pointer;" onclick="openEditTaskModal(' + task.id + ')">' + sanitize(task.Title) + '</div>';
  html += '<div class="task-card-actions">';
  html += '<span class="priority-dot ' + dotClass + '"></span>';
  if (isOwner) html += '<button class="btn-icon" onclick="deleteTask(' + task.id + ')" title="' + t('delete') + '">🗑️</button>';
  html += '</div></div>';

  if (task.Description) {
    html += '<div class="task-card-desc">' + sanitize(task.Description) + '</div>';
  }

  html += '<div class="task-card-meta">';
  html += '<span class="priority-badge priority-' + task.Priority + '">' + priorityLabel(task.Priority) + '</span>';

  if (task.Due_Date) {
    html += '<span class="task-card-date">📅 ' + formatDate(task.Due_Date) + overdueHtml + '</span>';
  }
  if (task.Assignee) {
    var assigneeList = task.Assignee.split(',').map(function(a) { return a.trim(); }).filter(Boolean);
    for (var ai = 0; ai < assigneeList.length; ai++) {
      html += '<span class="task-card-assignee">👤 ' + sanitize(assigneeList[ai]) + '</span>';
    }
  }
  html += '</div>';
  html += '</div>';
  return html;
}

// =============================================================================
// DRAG & DROP
// =============================================================================

var draggedTaskId = null;

function onDragStart(e, taskId) {
  draggedTaskId = taskId;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

async function onDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  var newStatus = e.currentTarget.getAttribute('data-status');
  if (draggedTaskId && newStatus) {
    try {
      await grist.docApi.applyUserActions([
        ['UpdateRecord', TASKS_TABLE, draggedTaskId, { Status: newStatus }]
      ]);
      // Update local state
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === draggedTaskId) {
          tasks[i].Status = newStatus;
          break;
        }
      }
      showToast(t('taskMoved'), 'success');
      refreshAllViews();
    } catch (err) {
      console.error('Error moving task:', err);
    }
  }
  draggedTaskId = null;
}

// =============================================================================
// TABLE VIEW
// =============================================================================

function renderTableView() {
  var search = (document.getElementById('table-search').value || '').toLowerCase();
  var filterStatus = document.getElementById('filter-status').value;
  var filterPriority = document.getElementById('filter-priority').value;

  var filtered = tasks.filter(function(task) {
    if (filterStatus && task.Status !== filterStatus) return false;
    if (filterPriority && task.Priority !== filterPriority) return false;
    if (search) {
      var text = (task.Title + ' ' + task.Description + ' ' + task.Assignee).toLowerCase();
      if (text.indexOf(search) === -1) return false;
    }
    return true;
  });

  var html = '<table class="data-table">';
  html += '<thead><tr>';
  html += '<th>' + t('colTaskName') + '</th>';
  html += '<th>' + t('colStatus') + '</th>';
  html += '<th>' + t('colPriority') + '</th>';
  html += '<th>' + t('colAssignee') + '</th>';
  html += '<th>' + t('colStartDate') + '</th>';
  html += '<th>' + t('colDueDate') + '</th>';
  html += '<th>' + t('colActions') + '</th>';
  html += '</tr></thead><tbody>';

  for (var i = 0; i < filtered.length; i++) {
    var task = filtered[i];
    var statusClass = 'status-' + task.Status;
    var overdueHtml = isOverdue(task) ? ' ⚠️' : '';
    var dotClass = task.Priority === 'high' ? 'dot-high' : (task.Priority === 'medium' ? 'dot-medium' : 'dot-low');

    html += '<tr>';
    html += '<td><div style="font-weight:700;">' + sanitize(task.Title) + '</div>';
    if (task.Description) html += '<div style="font-size:11px;color:#94a3b8;margin-top:2px;">' + sanitize(task.Description).substring(0, 80) + '</div>';
    html += '</td>';
    html += '<td><span class="status-badge ' + statusClass + '">● ' + statusLabel(task.Status) + '</span></td>';
    html += '<td><span class="priority-dot ' + dotClass + '"></span> ' + priorityLabel(task.Priority) + '</td>';
    html += '<td>' + (task.Assignee ? '<span class="assignee-chip">👤 ' + sanitize(task.Assignee) + '</span>' : '') + '</td>';
    html += '<td>' + (task.Start_Date ? formatDate(task.Start_Date) : t('notDefined')) + '</td>';
    html += '<td style="' + (isOverdue(task) ? 'color:#dc2626;font-weight:700;' : '') + '">' + (task.Due_Date ? formatDate(task.Due_Date) + overdueHtml : t('noDate')) + '</td>';
    html += '<td>';
    html += '<button class="btn-icon" onclick="openEditTaskModal(' + task.id + ')" title="Modifier">✏️</button>';
    if (isOwner) html += '<button class="btn-icon" onclick="deleteTask(' + task.id + ')">🗑️</button>';
    html += '</td>';
    html += '</tr>';
  }

  if (filtered.length === 0) {
    html += '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">' + t('noTasks') + '</td></tr>';
  }

  html += '</tbody></table>';
  document.getElementById('table-view').innerHTML = html;
}

// =============================================================================
// GANTT VIEW
// =============================================================================

function getISOWeek(date) {
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekStart(year, weekNum) {
  var jan4 = new Date(year, 0, 4);
  var dayOfWeek = jan4.getDay() || 7;
  var monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (weekNum - 1) * 7);
  return monday;
}

function renderGanttView() {
  var yearSelect = document.getElementById('gantt-year');
  if (yearSelect.options.length === 0) {
    for (var y = 2024; y <= 2030; y++) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === ganttYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }
  }
  yearSelect.value = ganttYear;

  document.querySelectorAll('[data-gantt-mode]').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-gantt-mode') === ganttMode);
  });

  var tasksWithDates = tasks.filter(function(task) { return task.Start_Date || task.Due_Date; });
  document.getElementById('gantt-task-count').textContent = '(' + tasksWithDates.length + ' ' + (currentLang === 'fr' ? 'tâches' : 'tasks') + ')';

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var dayNames = currentLang === 'fr'
    ? ['DIM.', 'LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.']
    : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  var monthNamesShort = currentLang === 'fr'
    ? ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var monthNames = currentLang === 'fr'
    ? ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var html = '<div class="gantt-container"><table class="gantt-table">';

  // ===== WEEKS MODE =====
  if (ganttMode === 'weeks') {
    // Determine week range: show ~10 weeks centered on current month
    var startWeek = getISOWeek(new Date(ganttYear, ganttMonth, 1));
    var numWeeks = 10;
    var weeks = [];
    for (var w = 0; w < numWeeks; w++) {
      var wn = startWeek + w;
      var yr = ganttYear;
      if (wn > 52) { wn -= 52; yr++; }
      var ws = getWeekStart(yr, wn);
      var we = new Date(ws);
      we.setDate(we.getDate() + 6);
      weeks.push({ num: wn, year: yr, start: ws, end: we });
    }

    // Header: week numbers with month subtitle
    html += '<thead><tr><th class="gantt-task-label" style="text-align:left;">' + t('colTaskName') + '</th>';
    for (var wi = 0; wi < weeks.length; wi++) {
      var wk = weeks[wi];
      var isCurrentWeek = getISOWeek(today) === wk.num && today.getFullYear() === wk.year;
      html += '<th style="min-width:80px;' + (isCurrentWeek ? 'background:#fef2f2;color:#ef4444;' : '') + '">';
      html += '<div style="font-size:11px;font-weight:800;">S' + wk.num + '</div>';
      html += '<div style="font-size:9px;font-weight:400;color:#94a3b8;">' + monthNamesShort[wk.start.getMonth()] + ' ' + String(wk.start.getFullYear()).substring(2) + '</div>';
      html += '</th>';
    }
    html += '</tr></thead><tbody>';

    // Task rows
    for (var ti = 0; ti < tasksWithDates.length; ti++) {
      var task = tasksWithDates[ti];
      var dotClass = task.Priority === 'high' ? 'dot-high' : (task.Priority === 'medium' ? 'dot-medium' : 'dot-low');
      var barClass = task.Status === 'done' ? 'gantt-bar-done' : (task.Status === 'progress' ? 'gantt-bar-progress' : 'gantt-bar-todo');
      if (isOverdue(task)) barClass = 'gantt-bar-overdue';

      html += '<tr>';
      html += '<td class="gantt-task-label">';
      html += '<div class="task-name"><span class="priority-dot ' + dotClass + '"></span> ' + sanitize(task.Title) + '</div>';
      html += '<div class="task-info">';
      if (task.Priority) html += '🏷️ ' + priorityLabel(task.Priority);
      if (task.Assignee) html += ' 👤 ' + sanitize(task.Assignee).substring(0, 15) + '…';
      if (task.Due_Date) html += ' ⏰ ' + (currentLang === 'fr' ? 'Échéance: ' : 'Due: ') + formatDate(task.Due_Date);
      html += '</div></td>';

      var tStart = task.Start_Date ? new Date(task.Start_Date * 1000) : null;
      var tEnd = task.Due_Date ? new Date(task.Due_Date * 1000) : null;
      if (!tStart && tEnd) tStart = tEnd;
      if (!tEnd && tStart) tEnd = tStart;
      if (tStart) tStart.setHours(0, 0, 0, 0);
      if (tEnd) tEnd.setHours(23, 59, 59, 999);

      // Find first and last week index where bar should appear
      var barStartIdx = -1, barEndIdx = -1;
      for (var wi = 0; wi < weeks.length; wi++) {
        var wk = weeks[wi];
        if (tStart && tEnd && tStart <= wk.end && tEnd >= wk.start) {
          if (barStartIdx === -1) barStartIdx = wi;
          barEndIdx = wi;
        }
      }

      for (var wi = 0; wi < weeks.length; wi++) {
        var isCurrentWeek = getISOWeek(today) === weeks[wi].num && today.getFullYear() === weeks[wi].year;
        html += '<td class="gantt-cell" style="position:relative;' + (isCurrentWeek ? 'background:#fef2f2;' : '') + '">';
        if (wi === barStartIdx) {
          var spanCols = barEndIdx - barStartIdx + 1;
          var widthPx = spanCols * 80;
          html += '<div class="gantt-bar ' + barClass + '" style="left:2px;width:' + widthPx + 'px;cursor:pointer;" title="' + sanitize(task.Title) + '" onclick="openEditTaskModal(' + task.id + ')">' + sanitize(task.Title).substring(0, 20) + '</div>';
        }
        html += '</td>';
      }

      html += '</tr>';
    }

    // Footer
    var viewStartMonth = monthNames[weeks[0].start.getMonth()];
    var viewEndMonth = monthNames[weeks[weeks.length - 1].start.getMonth()];
    html += '</tbody></table>';
    html += '<div class="gantt-footer">';
    html += '<span>🌟 ' + t('ganttFullYear') + ' • ' + t('ganttNavInfo') + ' • ' + tasksWithDates.length + ' ' + (currentLang === 'fr' ? 'tâches' : 'tasks') + '</span>';
    html += '<span>' + t('ganttViewRange') + ' ' + viewStartMonth + ' - ' + viewEndMonth + ' ' + ganttYear + '</span>';
    html += '</div></div>';

    document.getElementById('gantt-view').innerHTML = html;
    return;
  }

  // ===== MONTHS MODE =====
  if (ganttMode === 'months') {
    var startDate = new Date(ganttYear, 0, 1);
    var endDate = new Date(ganttYear, 11, 31);

    html += '<thead><tr><th class="gantt-task-label" style="text-align:left;">' + t('colTaskName') + '</th>';
    for (var m = 0; m < 12; m++) {
      html += '<th colspan="1">' + monthNames[m].substring(0, 3).toUpperCase() + '</th>';
    }
    html += '</tr></thead><tbody>';

    for (var ti = 0; ti < tasksWithDates.length; ti++) {
      var task = tasksWithDates[ti];
      var dotClass = task.Priority === 'high' ? 'dot-high' : (task.Priority === 'medium' ? 'dot-medium' : 'dot-low');
      var barClass = task.Status === 'done' ? 'gantt-bar-done' : (task.Status === 'progress' ? 'gantt-bar-progress' : 'gantt-bar-todo');
      if (isOverdue(task)) barClass = 'gantt-bar-overdue';

      html += '<tr>';
      html += '<td class="gantt-task-label">';
      html += '<div class="task-name"><span class="priority-dot ' + dotClass + '"></span> ' + sanitize(task.Title) + '</div>';
      html += '<div class="task-info">';
      if (task.Priority) html += '🏷️ ' + priorityLabel(task.Priority);
      if (task.Assignee) html += ' 👤 ' + sanitize(task.Assignee).substring(0, 15) + '…';
      if (task.Due_Date) html += ' ⏰ ' + (currentLang === 'fr' ? 'Échéance: ' : 'Due: ') + formatDate(task.Due_Date);
      html += '</div></td>';

      for (var m = 0; m < 12; m++) {
        var monthStart = new Date(ganttYear, m, 1);
        var monthEnd = new Date(ganttYear, m + 1, 0);
        var tStart = task.Start_Date ? new Date(task.Start_Date * 1000) : null;
        var tEnd = task.Due_Date ? new Date(task.Due_Date * 1000) : null;
        if (!tStart && tEnd) tStart = tEnd;
        if (!tEnd && tStart) tEnd = tStart;

        var inRange = tStart && tEnd && tStart <= monthEnd && tEnd >= monthStart;
        html += '<td class="gantt-cell" style="position:relative;">';
        if (inRange) {
          html += '<div class="gantt-bar ' + barClass + '" style="left:2px;right:2px;cursor:pointer;" title="' + sanitize(task.Title) + '" onclick="openEditTaskModal(' + task.id + ')">' + sanitize(task.Title).substring(0, 10) + '</div>';
        }
        html += '</td>';
      }
      html += '</tr>';
    }

    html += '</tbody></table>';
    html += '<div class="gantt-footer">';
    html += '<span>🌟 ' + t('ganttFullYear') + ' • ' + t('ganttNavInfo') + ' • ' + tasksWithDates.length + ' ' + (currentLang === 'fr' ? 'tâches' : 'tasks') + '</span>';
    html += '<span>' + t('ganttViewRange') + ' ' + monthNames[0] + ' - ' + monthNames[11] + ' ' + ganttYear + '</span>';
    html += '</div></div>';

    document.getElementById('gantt-view').innerHTML = html;
    return;
  }

  // ===== DAYS MODE =====
  var startDate = new Date(ganttYear, ganttMonth, 1);
  var endDate = new Date(ganttYear, ganttMonth + 2, 0);
  var days = [];
  var d = new Date(startDate);
  while (d <= endDate) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  html += '<thead><tr><th class="gantt-task-label" style="text-align:left;">' + t('colTaskName') + '</th>';
  for (var di = 0; di < days.length; di++) {
    var dd = days[di];
    var isToday = dd.getTime() === today.getTime();
    var isWeekend = dd.getDay() === 0 || dd.getDay() === 6;
    html += '<th class="' + (isToday ? 'today' : '') + (isWeekend ? ' weekend' : '') + '">';
    html += '<div>' + dd.getDate() + '</div>';
    html += '<div style="font-size:8px;">' + dayNames[dd.getDay()] + '</div>';
    html += '</th>';
  }
  html += '</tr></thead><tbody>';

  for (var ti = 0; ti < tasksWithDates.length; ti++) {
    var task = tasksWithDates[ti];
    var dotClass = task.Priority === 'high' ? 'dot-high' : (task.Priority === 'medium' ? 'dot-medium' : 'dot-low');
    var barClass = task.Status === 'done' ? 'gantt-bar-done' : (task.Status === 'progress' ? 'gantt-bar-progress' : 'gantt-bar-todo');
    if (isOverdue(task)) barClass = 'gantt-bar-overdue';

    html += '<tr>';
    html += '<td class="gantt-task-label">';
    html += '<div class="task-name"><span class="priority-dot ' + dotClass + '"></span> ' + sanitize(task.Title) + '</div>';
    html += '<div class="task-info">';
    if (task.Priority) html += '🏷️ ' + priorityLabel(task.Priority);
    if (task.Assignee) html += ' 👤 ' + sanitize(task.Assignee).substring(0, 15) + '…';
    if (task.Due_Date) html += ' ⏰ ' + (currentLang === 'fr' ? 'Échéance: ' : 'Due: ') + formatDate(task.Due_Date);
    html += '</div></td>';

    var tStart = task.Start_Date ? new Date(task.Start_Date * 1000) : null;
    var tEnd = task.Due_Date ? new Date(task.Due_Date * 1000) : null;
    if (!tStart && tEnd) tStart = tEnd;
    if (!tEnd && tStart) tEnd = tStart;
    if (tStart) tStart.setHours(0, 0, 0, 0);
    if (tEnd) tEnd.setHours(0, 0, 0, 0);

    for (var di = 0; di < days.length; di++) {
      var dd = days[di];
      var isToday = dd.getTime() === today.getTime();
      var isWeekend = dd.getDay() === 0 || dd.getDay() === 6;
      var cellClass = (isToday ? 'today-col' : '') + (isWeekend ? ' weekend-col' : '');

      html += '<td class="gantt-cell ' + cellClass + '">';
      if (tStart && tEnd && dd.getTime() === tStart.getTime()) {
        var span = Math.max(1, Math.round((tEnd - tStart) / (86400000)) + 1);
        var widthPx = span * 36;
        html += '<div class="gantt-bar ' + barClass + '" style="left:2px;width:' + widthPx + 'px;cursor:pointer;" title="' + sanitize(task.Title) + '" onclick="openEditTaskModal(' + task.id + ')">' + sanitize(task.Title).substring(0, 12) + '</div>';
      }
      html += '</td>';
    }

    html += '</tr>';
  }

  html += '</tbody></table>';
  var viewStart = monthNames[startDate.getMonth()];
  var viewEnd = monthNames[endDate.getMonth()];
  html += '<div class="gantt-footer">';
  html += '<span>🌟 ' + t('ganttFullYear') + ' • ' + t('ganttNavInfo') + ' • ' + tasksWithDates.length + ' ' + (currentLang === 'fr' ? 'tâches' : 'tasks') + '</span>';
  html += '<span>' + t('ganttViewRange') + ' ' + viewStart + ' - ' + viewEnd + ' ' + ganttYear + '</span>';
  html += '</div></div>';

  document.getElementById('gantt-view').innerHTML = html;
}

function ganttNav(dir) {
  if (ganttMode === 'months') {
    ganttYear += dir;
  } else if (ganttMode === 'weeks') {
    // Navigate by ~2.5 months (10 weeks) at a time
    ganttMonth += dir * 3;
    if (ganttMonth > 11) { ganttMonth -= 12; ganttYear++; }
    if (ganttMonth < 0) { ganttMonth += 12; ganttYear--; }
  } else {
    ganttMonth += dir * 2;
    if (ganttMonth > 11) { ganttMonth = 0; ganttYear++; }
    if (ganttMonth < 0) { ganttMonth = 10; ganttYear--; }
  }
  renderGanttView();
}

function ganttToday() {
  ganttYear = new Date().getFullYear();
  ganttMonth = new Date().getMonth();
  renderGanttView();
}

function setGanttMode(mode) {
  ganttMode = mode;
  renderGanttView();
}

// =============================================================================
// TEMPLATES VIEW
// =============================================================================

function renderTemplatesView() {
  var search = (document.getElementById('template-search').value || '').toLowerCase();
  var filterPriority = document.getElementById('filter-template-priority').value;

  var filtered = templates.filter(function(tpl) {
    if (filterPriority && tpl.Priority !== filterPriority) return false;
    if (search) {
      var text = (tpl.Title + ' ' + tpl.Description + ' ' + tpl.Category).toLowerCase();
      if (text.indexOf(search) === -1) return false;
    }
    return true;
  });

  var html = '';
  for (var i = 0; i < filtered.length; i++) {
    var tpl = filtered[i];
    var dotClass = tpl.Priority === 'high' ? 'dot-high' : (tpl.Priority === 'medium' ? 'dot-medium' : 'dot-low');

    html += '<div class="template-card">';
    html += '<div class="template-card-info">';
    html += '<h4>' + sanitize(tpl.Title) + '</h4>';
    html += '<div class="template-meta">';
    if (tpl.Category) html += '🏷️ ' + sanitize(tpl.Category);
    html += ' <span class="priority-dot ' + dotClass + '"></span> ' + priorityLabel(tpl.Priority);
    if (tpl.Estimated_Hours) html += ' ⏱️ ' + tpl.Estimated_Hours + 'h';
    html += ' 📊 ' + (tpl.Usage_Count || 0) + ' ' + (currentLang === 'fr' ? 'utilisations' : 'uses');
    if (tpl.Updated_At) html += ' • ' + (currentLang === 'fr' ? 'Mis à jour le ' : 'Updated ') + formatDate(tpl.Updated_At);
    html += '</div></div>';
    html += '<div style="display:flex;gap:4px;">';
    html += '<button class="btn btn-primary btn-sm" onclick="useTemplate(' + tpl.id + ')">' + t('useTemplate') + '</button>';
    if (isOwner) html += '<button class="btn-icon" onclick="deleteTemplate(' + tpl.id + ')">🗑️</button>';
    html += '</div>';
    html += '</div>';
  }

  if (filtered.length === 0) {
    html = '<div style="text-align:center;padding:40px;color:#94a3b8;">' + t('noTasks') + '</div>';
  }

  document.getElementById('templates-list').innerHTML = html;
}

// =============================================================================
// TEAM VIEW (Users & Groups)
// =============================================================================

function renderTeamView() {
  renderUsersList();
  renderGroupsList();
}

function renderUsersList() {
  var container = document.getElementById('users-list');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">' + t('noUsers') + '</div>';
    return;
  }

  var html = '<table class="data-table"><thead><tr>';
  html += '<th>' + t('fieldName') + '</th>';
  html += '<th>' + t('fieldEmail') + '</th>';
  html += '<th>' + t('fieldRole') + '</th>';
  html += '<th>' + t('fieldGroup') + '</th>';
  html += '<th>' + t('colActions') + '</th>';
  html += '</tr></thead><tbody>';

  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    var roleLabel = u.Role === 'admin' ? t('roleAdmin') : (u.Role === 'viewer' ? t('roleViewer') : t('roleMember'));
    var roleBg = u.Role === 'admin' ? '#fef2f2;color:#dc2626' : (u.Role === 'viewer' ? '#f1f5f9;color:#64748b' : '#eff6ff;color:#1e40af');

    html += '<tr>';
    html += '<td style="font-weight:700;">👤 ' + sanitize(u.Name) + '</td>';
    html += '<td>' + sanitize(u.Email) + '</td>';
    html += '<td><span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;background:' + roleBg + '">' + roleLabel + '</span></td>';
    html += '<td>' + (u.Group_Name ? '<span class="assignee-chip">👥 ' + sanitize(u.Group_Name) + '</span>' : '--') + '</td>';
    html += '<td><button class="btn-icon" onclick="deleteUser(' + u.id + ')">🗑️</button></td>';
    html += '</tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

function renderGroupsList() {
  var container = document.getElementById('groups-list');
  if (!container) return;

  if (groups.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">' + t('noGroups') + '</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < groups.length; i++) {
    var g = groups[i];
    var memberCount = users.filter(function(u) { return u.Group_Name === g.Name; }).length;
    var memberNames = users.filter(function(u) { return u.Group_Name === g.Name; }).map(function(u) { return u.Name || u.Email; });

    html += '<div class="template-card">';
    html += '<div class="template-card-info">';
    html += '<h4>👥 ' + sanitize(g.Name) + '</h4>';
    html += '<div class="template-meta">';
    html += memberCount + ' ' + t('members');
    if (g.Description) html += ' • ' + sanitize(g.Description);
    html += '</div>';
    if (memberNames.length > 0) {
      html += '<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">';
      for (var j = 0; j < memberNames.length; j++) {
        html += '<span class="assignee-chip">👤 ' + sanitize(memberNames[j]) + '</span>';
      }
      html += '</div>';
    }
    html += '</div>';
    html += '<button class="btn-icon" onclick="deleteGroup(' + g.id + ')">🗑️</button>';
    html += '</div>';
  }

  container.innerHTML = html;
}

function openNewUserModal() {
  var groupOptions = '<option value="">--</option>';
  for (var i = 0; i < groups.length; i++) {
    groupOptions += '<option value="' + sanitize(groups[i].Name) + '">' + sanitize(groups[i].Name) + '</option>';
  }

  var html = '<div class="modal-overlay" onclick="closeModal(event)">';
  html += '<div class="modal" onclick="event.stopPropagation()">';
  html += '<div class="modal-header"><h3>' + t('modalNewUser') + '</h3><button class="modal-close" onclick="closeModalForce()">✕</button></div>';
  html += '<div class="modal-body">';
  html += '<div class="form-group"><label>' + t('fieldName') + '</label><input type="text" id="user-name" /></div>';
  html += '<div class="form-group"><label>' + t('fieldEmail') + '</label><input type="email" id="user-email" /></div>';
  html += '<div class="form-row">';
  html += '<div class="form-group"><label>' + t('fieldRole') + '</label><select id="user-role">';
  html += '<option value="member">' + t('roleMember') + '</option>';
  html += '<option value="admin">' + t('roleAdmin') + '</option>';
  html += '<option value="viewer">' + t('roleViewer') + '</option>';
  html += '</select></div>';
  html += '<div class="form-group"><label>' + t('fieldGroup') + '</label><select id="user-group">' + groupOptions + '</select></div>';
  html += '</div>';
  html += '</div>';
  html += '<div class="modal-footer">';
  html += '<button class="btn btn-secondary" onclick="closeModalForce()">' + t('cancel') + '</button>';
  html += '<button class="btn btn-primary" onclick="createUser()">' + t('save') + '</button>';
  html += '</div></div></div>';

  document.getElementById('modal-container').innerHTML = html;
}

function openNewGroupModal() {
  var html = '<div class="modal-overlay" onclick="closeModal(event)">';
  html += '<div class="modal" onclick="event.stopPropagation()">';
  html += '<div class="modal-header"><h3>' + t('modalNewGroup') + '</h3><button class="modal-close" onclick="closeModalForce()">✕</button></div>';
  html += '<div class="modal-body">';
  html += '<div class="form-group"><label>' + t('fieldName') + '</label><input type="text" id="group-name" /></div>';
  html += '<div class="form-group"><label>' + t('fieldDescription') + '</label><textarea id="group-desc"></textarea></div>';
  html += '</div>';
  html += '<div class="modal-footer">';
  html += '<button class="btn btn-secondary" onclick="closeModalForce()">' + t('cancel') + '</button>';
  html += '<button class="btn btn-primary" onclick="createGroup()">' + t('save') + '</button>';
  html += '</div></div></div>';

  document.getElementById('modal-container').innerHTML = html;
}

async function createUser() {
  var name = document.getElementById('user-name').value.trim();
  if (!name) return;

  var record = {
    Name: name,
    Email: document.getElementById('user-email').value.trim(),
    Role: document.getElementById('user-role').value,
    Group_Name: document.getElementById('user-group').value
  };

  try {
    await grist.docApi.applyUserActions([
      ['AddRecord', USERS_TABLE, null, record]
    ]);
    showToast(t('userCreated'), 'success');
    closeModalForce();
    await loadAllData();
  } catch (e) {
    console.error('Error creating user:', e);
    showToast('Error: ' + e.message, 'error');
  }
}

async function createGroup() {
  var name = document.getElementById('group-name').value.trim();
  if (!name) return;

  var record = {
    Name: name,
    Description: document.getElementById('group-desc').value.trim()
  };

  try {
    await grist.docApi.applyUserActions([
      ['AddRecord', GROUPS_TABLE, null, record]
    ]);
    showToast(t('groupCreated'), 'success');
    closeModalForce();
    await loadAllData();
  } catch (e) {
    console.error('Error creating group:', e);
    showToast('Error: ' + e.message, 'error');
  }
}

async function deleteUser(userId) {
  if (!isOwner) return;
  if (!confirm(t('confirmDeleteUser'))) return;
  try {
    await grist.docApi.applyUserActions([
      ['RemoveRecord', USERS_TABLE, userId]
    ]);
    showToast(t('userDeleted'), 'info');
    await loadAllData();
  } catch (e) {
    console.error('Error deleting user:', e);
  }
}

async function deleteGroup(groupId) {
  if (!isOwner) return;
  if (!confirm(t('confirmDeleteGroup'))) return;
  try {
    await grist.docApi.applyUserActions([
      ['RemoveRecord', GROUPS_TABLE, groupId]
    ]);
    showToast(t('groupDeleted'), 'info');
    await loadAllData();
  } catch (e) {
    console.error('Error deleting group:', e);
  }
}

// =============================================================================
// MODALS
// =============================================================================

function openNewTaskModal(defaultStatus) {
  // Reset assignees for new task
  editAssignees = [];

  var groupOptions = '<option value="">--</option>';
  for (var i = 0; i < groups.length; i++) {
    groupOptions += '<option value="' + sanitize(groups[i].Name) + '">' + sanitize(groups[i].Name) + '</option>';
  }

  var dotColor = '#f59e0b'; // default medium

  var html = '<div class="modal-overlay" onclick="closeModal(event)">';
  html += '<div class="modal modal-detail" onclick="event.stopPropagation()">';

  // Top bar
  html += '<div class="modal-detail-top">';
  html += '<span class="group-dot" style="background:' + dotColor + '"></span>';
  html += '<span style="font-size:14px;font-weight:800;">' + t('modalNewTask') + '</span>';
  html += '<div style="flex:1;"></div>';
  html += '<button class="modal-close" onclick="closeModalForce()">✕</button>';
  html += '</div>';

  // Content: left only for creation (no right panel summary yet)
  html += '<div class="modal-detail-content" style="grid-template-columns:1fr;">';

  // === LEFT PANEL ===
  html += '<div class="modal-detail-left">';
  html += '<input class="detail-title-input" type="text" id="task-title" placeholder="' + t('fieldTitle') + '" />';

  // Description
  html += '<div class="detail-field">';
  html += '<div class="detail-field-value"><textarea id="task-desc" placeholder="' + t('fieldDescription') + '"></textarea></div>';
  html += '</div>';

  // Assignees (multi)
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">👤</span>';
  html += '<span class="detail-field-label">' + t('fieldAssignee') + '</span>';
  html += '<div class="detail-field-value">';
  html += '<div class="assignee-chips" id="assignee-chips"></div>';
  html += '<div class="assignee-add-row">';
  html += '<select id="assignee-select">';
  html += '<option value="">-- ' + t('searchAssignee') + ' --</option>';
  for (var i = 0; i < users.length; i++) {
    html += '<option value="' + sanitize(users[i].Email || users[i].Name) + '">' + sanitize(users[i].Name || users[i].Email) + '</option>';
  }
  html += '</select>';
  html += '<button class="assignee-add-btn" onclick="addAssigneeChip(0)">' + t('addAssignee') + '</button>';
  html += '</div>';
  html += '</div></div>';

  // Status + Priority
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">🏷️</span>';
  html += '<span class="detail-field-label">' + t('fieldStatus') + '</span>';
  html += '<div class="detail-field-value"><select id="task-status">';
  html += '<option value="todo"' + (defaultStatus === 'todo' || !defaultStatus ? ' selected' : '') + '>' + t('statusTodo') + '</option>';
  html += '<option value="progress"' + (defaultStatus === 'progress' ? ' selected' : '') + '>' + t('statusProgress') + '</option>';
  html += '<option value="done"' + (defaultStatus === 'done' ? ' selected' : '') + '>' + t('statusDone') + '</option>';
  html += '</select></div></div>';

  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">🔥</span>';
  html += '<span class="detail-field-label">' + t('fieldPriority') + '</span>';
  html += '<div class="detail-field-value"><select id="task-priority">';
  html += '<option value="medium">' + t('priorityMedium') + '</option>';
  html += '<option value="high">' + t('priorityHigh') + '</option>';
  html += '<option value="low">' + t('priorityLow') + '</option>';
  html += '</select></div></div>';
  html += '</div>';

  // Group
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">👥</span>';
  html += '<span class="detail-field-label">' + t('fieldGroup') + '</span>';
  html += '<div class="detail-field-value"><select id="task-group">' + groupOptions + '</select></div>';
  html += '</div>';

  // Dates
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">📅</span>';
  html += '<span class="detail-field-label">' + t('fieldStartDate') + '</span>';
  html += '<div class="detail-field-value"><input type="date" id="task-start" /></div>';
  html += '</div>';

  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">⏰</span>';
  html += '<span class="detail-field-label">' + t('fieldDueDate') + '</span>';
  html += '<div class="detail-field-value"><input type="date" id="task-due" /></div>';
  html += '</div>';
  html += '</div>';

  // Category
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">📁</span>';
  html += '<span class="detail-field-label">' + t('fieldCategory') + '</span>';
  html += '<div class="detail-field-value"><input type="text" id="task-category" /></div>';
  html += '</div>';

  html += '</div>'; // end left
  html += '</div>'; // end content

  // Footer
  html += '<div class="modal-detail-footer">';
  html += '<div></div>';
  html += '<div style="display:flex;gap:8px;">';
  html += '<button class="btn btn-secondary" onclick="closeModalForce()">' + t('cancel') + '</button>';
  html += '<button class="btn btn-primary" onclick="createTask()">' + t('save') + '</button>';
  html += '</div></div>';

  html += '</div></div>'; // end modal + overlay

  document.getElementById('modal-container').innerHTML = html;
}

var editAssignees = [];

function openEditTaskModal(taskId) {
  var task = tasks.find(function(t) { return t.id === taskId; });
  if (!task) return;

  // Parse multi-assignees (comma separated)
  editAssignees = task.Assignee ? task.Assignee.split(',').map(function(a) { return a.trim(); }).filter(Boolean) : [];

  var groupOptions = '<option value="">--</option>';
  for (var i = 0; i < groups.length; i++) {
    var sel = groups[i].Name === task.Group_Name ? ' selected' : '';
    groupOptions += '<option value="' + sanitize(groups[i].Name) + '"' + sel + '>' + sanitize(groups[i].Name) + '</option>';
  }

  var startVal = task.Start_Date ? new Date(task.Start_Date * 1000).toISOString().split('T')[0] : '';
  var dueVal = task.Due_Date ? new Date(task.Due_Date * 1000).toISOString().split('T')[0] : '';

  // Progress calculation
  var progressPct = task.Status === 'done' ? 100 : (task.Status === 'progress' ? 50 : 10);
  var barClass = task.Status === 'done' ? 'bar-done' : (task.Status === 'progress' ? 'bar-progress' : 'bar-todo');

  // Priority dot color
  var dotColor = task.Priority === 'high' ? '#ef4444' : (task.Priority === 'medium' ? '#f59e0b' : '#22c55e');

  var html = '<div class="modal-overlay" onclick="closeModal(event)">';
  html += '<div class="modal modal-detail" onclick="event.stopPropagation()">';

  // Top bar: group + status badge
  html += '<div class="modal-detail-top">';
  html += '<span class="group-dot" style="background:' + dotColor + '"></span>';
  if (task.Group_Name) html += '<span style="font-size:12px;color:#64748b;">' + sanitize(task.Group_Name) + '</span>';
  html += '<span class="status-badge status-' + task.Status + '">● ' + statusLabel(task.Status) + '</span>';
  html += '<div style="flex:1;"></div>';
  html += '<button class="modal-close" onclick="closeModalForce()">✕</button>';
  html += '</div>';

  // Content: left + right
  html += '<div class="modal-detail-content">';

  // === LEFT PANEL ===
  html += '<div class="modal-detail-left">';
  html += '<input class="detail-title-input" type="text" id="task-title" value="' + sanitize(task.Title) + '" />';

  // Description
  html += '<div class="detail-field">';
  html += '<div class="detail-field-value"><textarea id="task-desc" placeholder="' + t('fieldDescription') + '">' + sanitize(task.Description) + '</textarea></div>';
  html += '</div>';

  // Assignees (multi)
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">👤</span>';
  html += '<span class="detail-field-label">' + t('fieldAssignee') + '</span>';
  html += '<div class="detail-field-value">';
  html += '<div class="assignee-chips" id="assignee-chips">';
  html += renderAssigneeChips();
  html += '</div>';
  html += '<div class="assignee-add-row">';
  html += '<select id="assignee-select">';
  html += '<option value="">-- ' + t('searchAssignee') + ' --</option>';
  for (var i = 0; i < users.length; i++) {
    html += '<option value="' + sanitize(users[i].Email || users[i].Name) + '">' + sanitize(users[i].Name || users[i].Email) + '</option>';
  }
  html += '</select>';
  html += '<button class="assignee-add-btn" onclick="addAssigneeChip(' + task.id + ')">' + t('addAssignee') + '</button>';
  html += '</div>';
  html += '</div></div>';

  // Status
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">🏷️</span>';
  html += '<span class="detail-field-label">' + t('fieldStatus') + '</span>';
  html += '<div class="detail-field-value"><select id="task-status">';
  html += '<option value="todo"' + (task.Status === 'todo' ? ' selected' : '') + '>' + t('statusTodo') + '</option>';
  html += '<option value="progress"' + (task.Status === 'progress' ? ' selected' : '') + '>' + t('statusProgress') + '</option>';
  html += '<option value="done"' + (task.Status === 'done' ? ' selected' : '') + '>' + t('statusDone') + '</option>';
  html += '</select></div></div>';

  // Dates
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">📅</span>';
  html += '<span class="detail-field-label">' + t('fieldStartDate') + '</span>';
  html += '<div class="detail-field-value"><input type="date" id="task-start" value="' + startVal + '" /></div>';
  html += '</div>';

  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">⏰</span>';
  html += '<span class="detail-field-label">' + t('fieldDueDate') + '</span>';
  html += '<div class="detail-field-value"><input type="date" id="task-due" value="' + dueVal + '" /></div>';
  html += '</div>';

  // Priority
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">🔥</span>';
  html += '<span class="detail-field-label">' + t('fieldPriority') + '</span>';
  html += '<div class="detail-field-value"><select id="task-priority">';
  html += '<option value="high"' + (task.Priority === 'high' ? ' selected' : '') + '>' + t('priorityHigh') + '</option>';
  html += '<option value="medium"' + (task.Priority === 'medium' ? ' selected' : '') + '>' + t('priorityMedium') + '</option>';
  html += '<option value="low"' + (task.Priority === 'low' ? ' selected' : '') + '>' + t('priorityLow') + '</option>';
  html += '</select></div></div>';

  // Group
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">👥</span>';
  html += '<span class="detail-field-label">' + t('fieldGroup') + '</span>';
  html += '<div class="detail-field-value"><select id="task-group">' + groupOptions + '</select></div>';
  html += '</div>';

  // Category
  html += '<div class="detail-field">';
  html += '<span class="detail-field-icon">📁</span>';
  html += '<span class="detail-field-label">' + t('fieldCategory') + '</span>';
  html += '<div class="detail-field-value"><input type="text" id="task-category" value="' + sanitize(task.Category || '') + '" /></div>';
  html += '</div>';

  html += '</div>'; // end left

  // === RIGHT PANEL ===
  html += '<div class="modal-detail-right">';

  // Progression card
  html += '<div class="detail-card">';
  html += '<h4>⏳ ' + t('progression') + '</h4>';
  html += '<div class="detail-info-row"><span class="info-label">' + t('advancement') + '</span><span class="info-value">' + progressPct + '%</span></div>';
  html += '<div class="progress-bar-bg"><div class="progress-bar-fill ' + barClass + '" style="width:' + progressPct + '%"></div></div>';
  html += '<div class="detail-info-row"><span class="info-label">' + t('startLabel') + '</span><span class="info-value">' + (startVal ? formatDate(task.Start_Date) : '--') + '</span></div>';
  html += '<div class="detail-info-row"><span class="info-label">' + t('dueLabel') + '</span><span class="info-value" style="' + (isOverdue(task) ? 'color:#dc2626;' : '') + '">' + (dueVal ? formatDate(task.Due_Date) : '--') + (isOverdue(task) ? ' ⚠️' : '') + '</span></div>';
  html += '</div>';

  // Quick actions card
  html += '<div class="detail-card">';
  html += '<h4>⚡ ' + t('quickActions') + '</h4>';
  if (task.Status === 'done') {
    html += '<button class="quick-action-btn" onclick="quickAction(' + task.id + ',\'todo\')">🔄 ' + t('reopenTask') + '</button>';
  } else if (task.Status === 'todo') {
    html += '<button class="quick-action-btn" onclick="quickAction(' + task.id + ',\'progress\')">▶️ ' + t('startTask') + '</button>';
    html += '<button class="quick-action-btn" onclick="quickAction(' + task.id + ',\'done\')">✅ ' + t('completeTask') + '</button>';
  } else {
    html += '<button class="quick-action-btn" onclick="quickAction(' + task.id + ',\'done\')">✅ ' + t('completeTask') + '</button>';
    html += '<button class="quick-action-btn" onclick="quickAction(' + task.id + ',\'todo\')">⏪ ' + t('reopenTask') + '</button>';
  }
  html += '</div>';

  // Summary card
  html += '<div class="detail-card">';
  html += '<h4>📋 ' + t('taskSummary') + '</h4>';
  html += '<div class="detail-info-row"><span class="info-label">' + t('fieldStatus') + ' :</span><span class="info-value" style="color:' + (task.Status === 'done' ? '#22c55e' : (task.Status === 'progress' ? '#3b82f6' : '#f59e0b')) + '">' + statusLabel(task.Status) + '</span></div>';
  html += '<div class="detail-info-row"><span class="info-label">' + t('fieldPriority') + ' :</span><span class="info-value" style="color:' + dotColor + '">' + priorityLabel(task.Priority) + '</span></div>';
  html += '<div class="detail-info-row"><span class="info-label">' + t('fieldAssignee') + ' :</span><span class="info-value">' + editAssignees.length + '</span></div>';
  html += '</div>';

  html += '</div>'; // end right
  html += '</div>'; // end content

  // Footer
  html += '<div class="modal-detail-footer">';
  if (isOwner) html += '<button class="btn-danger" onclick="deleteTask(' + task.id + ')">' + t('delete') + '</button>';
  else html += '<div></div>';
  html += '<div style="display:flex;gap:8px;">';
  html += '<button class="btn btn-secondary" onclick="closeModalForce()">' + t('cancel') + '</button>';
  html += '<button class="btn btn-primary" onclick="updateTask(' + task.id + ')">' + t('save') + '</button>';
  html += '</div></div>';

  html += '</div></div>'; // end modal + overlay

  document.getElementById('modal-container').innerHTML = html;
}

function renderAssigneeChips() {
  var html = '';
  for (var i = 0; i < editAssignees.length; i++) {
    var name = editAssignees[i];
    var displayName = name;
    // Try to find user name from email
    for (var j = 0; j < users.length; j++) {
      if (users[j].Email === name || users[j].Name === name) {
        displayName = users[j].Name || users[j].Email;
        break;
      }
    }
    html += '<span class="assignee-chip-tag">' + sanitize(displayName) + ' <span class="chip-remove" onclick="removeAssigneeChip(' + i + ')">✕</span></span>';
  }
  return html;
}

function addAssigneeChip(taskId) {
  var sel = document.getElementById('assignee-select');
  var val = sel.value;
  if (!val || editAssignees.indexOf(val) !== -1) return;
  editAssignees.push(val);
  document.getElementById('assignee-chips').innerHTML = renderAssigneeChips();
  sel.value = '';
}

function removeAssigneeChip(index) {
  editAssignees.splice(index, 1);
  document.getElementById('assignee-chips').innerHTML = renderAssigneeChips();
}

async function quickAction(taskId, newStatus) {
  try {
    await grist.docApi.applyUserActions([
      ['UpdateRecord', TASKS_TABLE, taskId, { Status: newStatus }]
    ]);
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === taskId) { tasks[i].Status = newStatus; break; }
    }
    showToast(t('taskMoved'), 'success');
    closeModalForce();
    refreshAllViews();
  } catch (e) {
    console.error('Error quick action:', e);
  }
}

function openNewTemplateModal() {
  var html = '<div class="modal-overlay" onclick="closeModal(event)">';
  html += '<div class="modal" onclick="event.stopPropagation()">';
  html += '<div class="modal-header"><h3>' + t('modalNewTemplate') + '</h3><button class="modal-close" onclick="closeModalForce()">✕</button></div>';
  html += '<div class="modal-body">';
  html += '<div class="form-group"><label>' + t('fieldTitle') + '</label><input type="text" id="tpl-title" /></div>';
  html += '<div class="form-group"><label>' + t('fieldDescription') + '</label><textarea id="tpl-desc"></textarea></div>';
  html += '<div class="form-row">';
  html += '<div class="form-group"><label>' + t('fieldPriority') + '</label><select id="tpl-priority">';
  html += '<option value="medium">' + t('priorityMedium') + '</option>';
  html += '<option value="high">' + t('priorityHigh') + '</option>';
  html += '<option value="low">' + t('priorityLow') + '</option>';
  html += '</select></div>';
  html += '<div class="form-group"><label>' + t('fieldCategory') + '</label><input type="text" id="tpl-category" /></div>';
  html += '</div>';
  html += '<div class="form-group"><label>' + t('fieldEstimatedTime') + '</label><input type="number" id="tpl-hours" step="0.5" min="0" /></div>';
  html += '</div>';
  html += '<div class="modal-footer">';
  html += '<button class="btn btn-secondary" onclick="closeModalForce()">' + t('cancel') + '</button>';
  html += '<button class="btn btn-primary" onclick="createTemplate()">' + t('save') + '</button>';
  html += '</div></div></div>';

  document.getElementById('modal-container').innerHTML = html;
}

function closeModal(e) {
  if (e.target.classList.contains('modal-overlay')) {
    document.getElementById('modal-container').innerHTML = '';
  }
}

function closeModalForce() {
  document.getElementById('modal-container').innerHTML = '';
}

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

async function createTask() {
  var title = document.getElementById('task-title').value.trim();
  if (!title) return;

  var record = {
    Title: title,
    Description: document.getElementById('task-desc').value.trim(),
    Status: document.getElementById('task-status').value,
    Priority: document.getElementById('task-priority').value,
    Assignee: editAssignees.join(', '),
    Group_Name: document.getElementById('task-group').value,
    Start_Date: toEpoch(document.getElementById('task-start').value),
    Due_Date: toEpoch(document.getElementById('task-due').value),
    Category: document.getElementById('task-category').value.trim(),
    Created_At: Math.floor(Date.now() / 1000)
  };

  try {
    await grist.docApi.applyUserActions([
      ['AddRecord', TASKS_TABLE, null, record]
    ]);
    showToast(t('taskCreated'), 'success');
    closeModalForce();
    await loadAllData();
  } catch (e) {
    console.error('Error creating task:', e);
    showToast('Error: ' + e.message, 'error');
  }
}

async function updateTask(taskId) {
  var title = document.getElementById('task-title').value.trim();
  if (!title) return;

  var record = {
    Title: title,
    Description: document.getElementById('task-desc').value.trim(),
    Status: document.getElementById('task-status').value,
    Priority: document.getElementById('task-priority').value,
    Assignee: editAssignees.join(', '),
    Group_Name: document.getElementById('task-group').value,
    Start_Date: toEpoch(document.getElementById('task-start').value),
    Due_Date: toEpoch(document.getElementById('task-due').value),
    Category: document.getElementById('task-category').value.trim()
  };

  try {
    await grist.docApi.applyUserActions([
      ['UpdateRecord', TASKS_TABLE, taskId, record]
    ]);
    showToast(t('taskUpdated'), 'success');
    closeModalForce();
    await loadAllData();
  } catch (e) {
    console.error('Error updating task:', e);
    showToast('Error: ' + e.message, 'error');
  }
}

async function deleteTask(taskId) {
  if (!isOwner) return;
  if (!confirm(t('confirmDelete'))) return;
  try {
    await grist.docApi.applyUserActions([
      ['RemoveRecord', TASKS_TABLE, taskId]
    ]);
    showToast(t('taskDeleted'), 'info');
    await loadAllData();
  } catch (e) {
    console.error('Error deleting task:', e);
  }
}

async function createTemplate() {
  var title = document.getElementById('tpl-title').value.trim();
  if (!title) return;

  var record = {
    Title: title,
    Description: document.getElementById('tpl-desc').value.trim(),
    Priority: document.getElementById('tpl-priority').value,
    Category: document.getElementById('tpl-category').value.trim(),
    Estimated_Hours: parseFloat(document.getElementById('tpl-hours').value) || 0,
    Usage_Count: 0,
    Updated_At: Math.floor(Date.now() / 1000)
  };

  try {
    await grist.docApi.applyUserActions([
      ['AddRecord', TEMPLATES_TABLE, null, record]
    ]);
    showToast(t('templateCreated'), 'success');
    closeModalForce();
    await loadAllData();
  } catch (e) {
    console.error('Error creating template:', e);
  }
}

async function deleteTemplate(tplId) {
  if (!isOwner) return;
  if (!confirm(t('confirmDeleteTemplate'))) return;
  try {
    await grist.docApi.applyUserActions([
      ['RemoveRecord', TEMPLATES_TABLE, tplId]
    ]);
    showToast(t('templateDeleted'), 'info');
    await loadAllData();
  } catch (e) {
    console.error('Error deleting template:', e);
  }
}

async function useTemplate(tplId) {
  var tpl = templates.find(function(t) { return t.id === tplId; });
  if (!tpl) return;

  // Increment usage count
  try {
    await grist.docApi.applyUserActions([
      ['UpdateRecord', TEMPLATES_TABLE, tplId, { Usage_Count: (tpl.Usage_Count || 0) + 1 }]
    ]);
  } catch (e) {}

  // Open new task modal pre-filled with template data
  openNewTaskModal('todo');
  // Wait for DOM
  setTimeout(function() {
    var titleEl = document.getElementById('task-title');
    var descEl = document.getElementById('task-desc');
    var priorityEl = document.getElementById('task-priority');
    var categoryEl = document.getElementById('task-category');
    if (titleEl) titleEl.value = tpl.Title;
    if (descEl) descEl.value = tpl.Description || '';
    if (priorityEl) priorityEl.value = tpl.Priority || 'medium';
    if (categoryEl) categoryEl.value = tpl.Category || '';
  }, 50);
}

// =============================================================================
// OWNER RESTRICTIONS
// =============================================================================

function applyOwnerRestrictions() {
  // Hide Team tab for non-owners
  var teamTab = document.querySelector('[data-tab="team"]');
  if (teamTab) teamTab.style.display = isOwner ? '' : 'none';

  // Hide "Nouveau modèle" button in Templates tab for non-owners
  var templatesAddBtn = document.querySelector('#tab-templates .btn-new-task');
  if (templatesAddBtn) templatesAddBtn.style.display = isOwner ? '' : 'none';
}

// =============================================================================
// INIT
// =============================================================================

if (!isInsideGrist()) {
  document.getElementById('not-in-grist').classList.remove('hidden');
  document.getElementById('main-content').classList.add('hidden');
} else {
  (async function() {
    await grist.ready({ requiredAccess: 'full' });

    // Detect current user access level
    // Only owners can call getAccessRules — if it fails, user is not owner
    try {
      await grist.docApi.getAccessRules();
      isOwner = true;
    } catch (e) {
      // For custom widgets, getAccessRules may not be available
      // Default to owner (full access was granted)
      isOwner = true;
    }

    applyOwnerRestrictions();
    await ensureTables();
    await loadAllData();
  })();
}
