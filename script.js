const APPS_SCRIPT_API_URL = 'https://script.google.com/macros/s/AKfycbyFEozgBI4gcRnlWj4AHJujZu6nKRAslTqWR12ELJL_1eKLgEOsfVsFhfw7wER4zMX_/exec';

const introScreen = document.getElementById('introScreen');
const introVideo = document.getElementById('introVideo');
const authShell = document.getElementById('authShell');
const appShell = document.getElementById('appShell');
const tabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const commandPalette = document.getElementById('commandPalette');
const commandInput = document.getElementById('commandInput');
const commandList = document.getElementById('commandList');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const taskFilter = document.getElementById('taskFilter');
const directoryGrid = document.getElementById('directoryGrid');
const wikiCards = document.getElementById('wikiCards');
const wikiSearch = document.getElementById('wikiSearch');
const taskOwner = document.getElementById('taskOwner');
const taskTitle = document.getElementById('taskTitle');

const userDirectory = [
  { name: 'Alicia Torres', role: 'Líder de Desarrollo', department: 'Desarrollo', status: 'online', email: 'alicia@grupomendcord.com', phone: '+54 9 11 5555 1001' },
  { name: 'Mateo Ruiz', role: 'Frontend Engineer', department: 'Desarrollo', status: 'online', email: 'mateo@grupomendcord.com', phone: '+54 9 11 5555 1002' },
  { name: 'Valentina López', role: 'Especialista en Marketing', department: 'Marketing', status: 'busy', email: 'valentina@grupomendcord.com', phone: '+54 9 11 5555 1003' },
  { name: 'Santiago Méndez', role: 'Agente de Soporte', department: 'Soporte', status: 'away', email: 'santiago@grupomendcord.com', phone: '+54 9 11 5555 1004' },
  { name: 'Lucía Gómez', role: 'Contadora', department: 'Administración', status: 'online', email: 'lucia@grupomendcord.com', phone: '+54 9 11 5555 1005' },
  { name: 'Daniel Cruz', role: 'Director Comercial', department: 'Liderazgo', status: 'busy', email: 'daniel@grupomendcord.com', phone: '+54 9 11 5555 1006' }
];

const tasks = [
  { id: 1, title: 'Optimización CRM', description: 'Revisar integración de leads y automatización del scoring.', owner: 'Alicia Torres', priority: 'Alta', area: 'Desarrollo', status: 'Por Hacer', dueDate: '2026-09-09' },
  { id: 2, title: 'Campaña de retención', description: 'Preparar nueva secuencia para clientes maduros.', owner: 'Valentina López', priority: 'Media', area: 'Marketing', status: 'En Proceso', dueDate: '2026-09-12' },
  { id: 3, title: 'Ticket de atención', description: 'Actualizar playbook para usuarios con incidencias de acceso.', owner: 'Santiago Méndez', priority: 'Alta', area: 'Soporte', status: 'En Revisión', dueDate: '2026-09-11' },
  { id: 4, title: 'Cierre mensual', description: 'Emitir estados financieros del mes y aprobar pagos.', owner: 'Lucía Gómez', priority: 'Crítica', area: 'Administración', status: 'Por Hacer', dueDate: '2026-09-14' },
  { id: 5, title: 'Portal interno redesign', description: 'Revisión visual del espacio de proyectos y dashboard.', owner: 'Mateo Ruiz', priority: 'Media', area: 'Desarrollo', status: 'Completado', dueDate: '2026-09-05' }
];

const docs = [
  { title: 'Manual de Onboarding', department: 'Desarrollo', tag: 'Guía', summary: 'Proceso de incorporación de nuevos miembros al stack y ambientes de trabajo.' },
  { title: 'Protocolo de Atención Cliente', department: 'Soporte', tag: 'Soporte', summary: 'Escala de resolución, tiempos SLA y procedimientos de escalamiento.' },
  { title: 'Brand Kit corporativo', department: 'Marketing', tag: 'Branding', summary: 'Versiones de logo, tipografías, colores institucionales y ejemplos de uso.' },
  { title: 'Checklist de cierre financiero', department: 'Administración', tag: 'Finanzas', summary: 'Validación de pagos, facturación y seguimiento trimestral.' },
  { title: 'Política de seguridad', department: 'Liderazgo', tag: 'Seguridad', summary: 'Lineamientos generales para equipos, contraseñas, backups y permisos.' }
];

const commandEntries = [
  { label: 'Dashboard', description: 'Abrir panel principal' },
  { label: 'Equipo', description: 'Ir al organigrama y directorio' },
  { label: 'Proyectos', description: 'Ver tablero de tareas' },
  { label: 'Wiki', description: 'Documentación interna' },
  { label: 'Calendario', description: 'Eventos y licencias' },
  { label: 'Perfil', description: 'Editar perfil personal' },
  { label: 'Solicitar licencia', description: 'Registrar ausencia' }
];

const statusLabels = {
  online: 'En línea',
  busy: 'En reunión',
  away: 'Ausente'
};

let currentUser = null;

function callAppsScript(method, ...args) {
  if (!window.google || !window.google.script || !window.google.script.run) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    window.google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler((error) => reject(new Error(error.message || 'No se pudo completar la operación.')))
      [method](...args);
  });
}

function submitRegistration(user, onStatus) {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const frameName = `mendcord-registration-${requestId}`;
    const frame = document.createElement('iframe');
    const form = document.createElement('form');
    const payload = { action: 'registrarUsuario', user };
    const requestIdInput = document.createElement('input');
    const payloadInput = document.createElement('input');

    frame.name = frameName;
    frame.title = 'Respuesta del servicio de registro';
    frame.hidden = true;
    form.method = 'POST';
    form.action = APPS_SCRIPT_API_URL;
    form.target = frameName;
    form.hidden = true;

    requestIdInput.type = 'hidden';
    requestIdInput.name = 'requestId';
    requestIdInput.value = requestId;
    payloadInput.type = 'hidden';
    payloadInput.name = 'payload';
    payloadInput.value = JSON.stringify(payload);
    form.append(requestIdInput, payloadInput);
    document.body.append(frame, form);

    const slowRequestId = window.setTimeout(() => {
      onStatus('El servidor tarda más de lo habitual. La solicitud sigue en curso...');
    }, 8000);
    const timeoutId = window.setTimeout(() => finish(() => reject(new Error(
      'No recibimos respuesta en 30 segundos. Comprueba que Apps Script tenga desplegada la última versión y permisos sobre la hoja y el correo.'
    ))), 30000);
    const handleResponse = (event) => {
      let hostname = '';
      try {
        hostname = new URL(event.origin).hostname;
      } catch (error) {
        return;
      }
      const trustedOrigin = hostname === 'script.google.com'
        || hostname === 'script.googleusercontent.com'
        || hostname.endsWith('.script.googleusercontent.com')
        || hostname.endsWith('-script.googleusercontent.com');
      const response = event.data;
      if (!trustedOrigin || !response || response.source !== 'mendcord-api' || response.requestId !== requestId) return;

      finish(() => {
        if (response.ok) resolve(response);
        else reject(new Error(response.error || 'No se pudo completar el registro.'));
      });
    };
    const finish = (callback) => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(slowRequestId);
      window.removeEventListener('message', handleResponse);
      form.remove();
      frame.remove();
      callback();
    };

    onStatus('Conectando con el servicio de registro...');
    window.addEventListener('message', handleResponse);
    try {
      form.submit();
    } catch (error) {
      finish(() => reject(new Error('No se pudo enviar la solicitud al servicio de registro.')));
    }
  });
}

function updateClock() {
  const current = new Date();
  const time = current.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  document.getElementById('localTime').textContent = time;
}

function setActiveAuthTab(tab) {
  tabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
  authForms.forEach((form) => {
    form.classList.toggle('active', form.id === (tab === 'login' ? 'loginForm' : 'registerForm'));
  });
}

function showView(target) {
  const nextView = Array.from(views).find((section) => section.id === target);
  const currentView = document.querySelector('.view.active');

  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.target === target);
  });

  if (!nextView || nextView === currentView) return;

  const direction = Array.from(views).indexOf(nextView) > Array.from(views).indexOf(currentView)
    ? 'page-turn-forward'
    : 'page-turn-back';
  views.forEach((section) => {
    section.classList.remove('active', 'page-turn-forward', 'page-turn-back');
  });
  nextView.classList.add('active', direction);
  nextView.addEventListener('animationend', () => {
    nextView.classList.remove(direction);
  }, { once: true });
}

function renderDirectory() {
  directoryGrid.innerHTML = userDirectory.map((person) => {
    return `
      <article class="directory-card glass-panel">
        <div class="directory-top">
          <div class="avatar avatar-aurora">${person.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
          <div class="directory-info">
            <h4>${person.name}</h4>
            <p>${person.role}</p>
          </div>
        </div>
        <div class="directory-meta">
          <span class="status-tag ${person.status}">${statusLabels[person.status]}</span>
          <span class="chip">${person.department}</span>
        </div>
        <div class="directory-actions">
          <a href="mailto:${person.email}">Correo</a>
          <a href="https://wa.me/${person.phone.replace(/\D/g, '')}" target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      </article>
    `;
  }).join('');
}

function renderTasks() {
  const filterValue = taskFilter.value;
  const filtered = filterValue === 'all' ? tasks : tasks.filter((task) => task.area === filterValue);

  const columns = ['Por Hacer', 'En Proceso', 'En Revisión', 'Completado'];

  const taskBoard = document.getElementById('taskBoard');
  taskBoard.innerHTML = columns.map((status) => {
    const columnTasks = filtered.filter((task) => task.status === status);
    return `
      <div class="kanban-column">
        <div class="column-head">
          <h4>${status}</h4>
          <span class="count-badge">${columnTasks.length}</span>
        </div>
        <div class="task-list">
          ${columnTasks.map((task) => `
            <article class="task-card">
              <h5>${task.title}</h5>
              <p>${task.description}</p>
              <div class="task-meta">
                <span class="badge ${task.priority.toLowerCase().replace(' ', '-')}">${task.priority}</span>
                <span class="chip">${task.area}</span>
              </div>
              <div class="task-footer">
                <span>${task.owner}</span>
                <span>${task.dueDate}</span>
              </div>
            </article>
          `).join('') || '<p class="empty-state">Sin tareas</p>'}
        </div>
      </div>
    `;
  }).join('');
}

function renderWiki() {
  const value = wikiSearch.value.trim().toLowerCase();
  const filtered = docs.filter((doc) => {
    if (!value) return true;
    return `${doc.title} ${doc.department} ${doc.summary}`.toLowerCase().includes(value);
  });

  wikiCards.innerHTML = filtered.map((doc) => `
    <article class="wiki-card glass-panel">
      <span class="doc-label">${doc.tag}</span>
      <h4>${doc.title}</h4>
      <p>${doc.summary}</p>
      <span class="chip">${doc.department}</span>
    </article>
  `).join('') || '<div class="glass-panel"><p>No se encontraron documentos.</p></div>';
}

function setupCommandPalette() {
  const renderCommands = (query = '') => {
    const normalized = query.trim().toLowerCase();
    const items = commandEntries.filter((entry) => {
      return !normalized || entry.label.toLowerCase().includes(normalized) || entry.description.toLowerCase().includes(normalized);
    });

    commandList.innerHTML = items.map((entry) => `
      <li class="command-item" data-action="${entry.label}">
        <span>${entry.label}</span>
        <small>${entry.description}</small>
      </li>
    `).join('');

    commandList.querySelectorAll('.command-item').forEach((item) => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        const viewMap = {
          Dashboard: 'dashboard',
          Equipo: 'equipo',
          Proyectos: 'proyectos',
          Wiki: 'wiki',
          Calendario: 'calendario',
          Perfil: 'perfil'
        };

        if (viewMap[action]) {
          showView(viewMap[action]);
          commandPalette.classList.add('hidden');
        }
      });
    });
  };

  renderCommands();
  commandInput.addEventListener('input', (event) => renderCommands(event.target.value));
  document.getElementById('commandLauncher').addEventListener('click', () => {
    commandPalette.classList.remove('hidden');
    commandInput.value = '';
    commandInput.focus();
    renderCommands();
  });

  document.querySelector('.close-btn').addEventListener('click', () => commandPalette.classList.add('hidden'));
  document.querySelectorAll('.close-btn')[1].addEventListener('click', () => taskModal.classList.add('hidden'));

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      commandPalette.classList.toggle('hidden');
      if (!commandPalette.classList.contains('hidden')) {
        commandInput.focus();
      }
    }

    if (event.key === 'Escape') {
      commandPalette.classList.add('hidden');
      taskModal.classList.add('hidden');
    }
  });
}

function populateTaskOwner() {
  taskOwner.innerHTML = userDirectory.map((person) => `<option value="${person.name}">${person.name}</option>`).join('');
}

function formatNameFromEmail(email) {
  return email.split('@')[0].replace(/[.-]/g, ' ').split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function enterWorkspace(user) {
  currentUser = user;
  authShell.classList.remove('active');
  authShell.classList.add('hidden');
  appShell.classList.remove('hidden');

  const fullName = [user.name, user.surname].filter(Boolean).join(' ') || formatNameFromEmail(user.email);
  const shortName = fullName.split(' ').slice(0, 2).join(' ');
  document.getElementById('welcomeTitle').textContent = fullName;
  document.getElementById('miniName').textContent = shortName;
  document.getElementById('profileName').textContent = fullName;
  document.getElementById('inputName').value = fullName;
  document.getElementById('miniRole').textContent = user.role || 'Miembro del equipo';
  document.getElementById('profileRole').textContent = user.role || 'Miembro del equipo';
  document.getElementById('inputRole').value = user.role || '';
  document.getElementById('inputDept').value = user.department || '';
  document.getElementById('inputBio').value = user.bio || '';
  document.getElementById('inputSkills').value = user.skills || '';
  document.getElementById('inputStatus').value = user.status || 'En línea';
  loadTasks();
  animateMetrics();
}

async function handleLogin(event) {
  event.preventDefault();
  const email = loginForm.querySelector('input[type="email"]').value;
  const password = loginForm.querySelector('input[type="password"]').value;
  try {
    const response = await callAppsScript('loginUser', email, password);
    const user = response ? { ...response.user, sessionToken: response.sessionToken } : {
      email,
      name: formatNameFromEmail(email),
      role: 'Líder de Desarrollo',
      department: 'Desarrollo',
      status: 'En línea'
    };
    enterWorkspace(user);
  } catch (error) {
    alert(error.message);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const submitButton = registerForm.querySelector('button[type="submit"]');
  const feedback = document.getElementById('registrationFeedback');
  const status = document.getElementById('registrationStatus');
  const elapsed = document.getElementById('registrationElapsed');
  const progress = document.getElementById('registrationProgress');
  const hint = document.getElementById('registrationHint');
  const startedAt = Date.now();
  let elapsedTimer;
  const user = {
    name: document.getElementById('registerName').value,
    surname: document.getElementById('registerSurname').value,
    email: document.getElementById('registerEmail').value,
    password: document.getElementById('registerPassword').value,
    department: document.getElementById('registerDepartment').value,
    role: document.getElementById('registerRole').value,
    region: document.getElementById('registerRegion').value,
    phone: document.getElementById('registerPhone').value
  };

  feedback.classList.remove('hidden', 'is-error', 'is-success');
  feedback.classList.add('is-loading');
  registerForm.setAttribute('aria-busy', 'true');
  submitButton.disabled = true;
  submitButton.textContent = 'Registrando...';
  status.textContent = 'Conectando con el servicio de registro...';
  hint.textContent = 'Mantén esta ventana abierta mientras procesamos la solicitud.';
  progress.hidden = false;
  elapsed.textContent = '0 s';
  elapsedTimer = window.setInterval(() => {
    elapsed.textContent = `${Math.floor((Date.now() - startedAt) / 1000)} s`;
  }, 1000);

  try {
    const response = await submitRegistration(user, (message) => {
      status.textContent = message;
    });
    registerForm.reset();
    setActiveAuthTab('login');
    loginForm.querySelector('input[type="email"]').value = user.email;
    feedback.classList.remove('is-loading');
    feedback.classList.add('is-success');
    status.textContent = 'Registro completado';
    hint.textContent = response.welcomeEmailSent
      ? 'La cuenta se guardó y el comprobante fue enviado a tu correo.'
      : 'La cuenta se guardó, pero no se pudo enviar el comprobante. Contacta con administración.';
    progress.hidden = true;
  } catch (error) {
    feedback.classList.remove('is-loading');
    feedback.classList.add('is-error');
    status.textContent = 'No se pudo completar el registro';
    hint.textContent = error.message;
    progress.hidden = true;
  } finally {
    window.clearInterval(elapsedTimer);
    registerForm.removeAttribute('aria-busy');
    submitButton.disabled = false;
    submitButton.textContent = 'Crear cuenta';
  }
}

async function handleProfileSave(event) {
  event.preventDefault();
  const profile = {
    name: document.getElementById('inputName').value,
    role: document.getElementById('inputRole').value,
    department: document.getElementById('inputDept').value,
    status: document.getElementById('inputStatus').value,
    bio: document.getElementById('inputBio').value,
    skills: document.getElementById('inputSkills').value
  };
  try {
    if (currentUser && currentUser.sessionToken) {
      await callAppsScript('updateUserProfile', currentUser.email, profile, currentUser.sessionToken);
      Object.assign(currentUser, profile);
    }
  } catch (error) {
    alert(error.message);
    return;
  }
  const name = profile.name;
  const role = profile.role;
  document.getElementById('welcomeTitle').textContent = name;
  document.getElementById('miniName').textContent = name.split(' ').slice(0, 2).map((entry) => entry.charAt(0).toUpperCase() + entry.slice(1)).join(' ');
  document.getElementById('profileName').textContent = name;
  document.getElementById('profileRole').textContent = role;
  document.getElementById('miniRole').textContent = role;
  alert('Perfil guardado.');
}

function openTaskModal() {
  taskModal.classList.remove('hidden');
}

async function handleTaskSubmit(event) {
  event.preventDefault();
  const task = {
    title: taskTitle.value,
    description: document.getElementById('taskDescription').value || 'Sin descripción añadida.',
    owner: taskOwner.value,
    priority: document.getElementById('taskPriority').value,
    area: document.getElementById('taskArea').value,
    dueDate: document.getElementById('taskDueDate').value || 'Sin fecha'
  };
  let newTask;
  try {
    const response = await callAppsScript('createTask', task, currentUser && currentUser.sessionToken);
    newTask = response ? response.task : { ...task, id: Date.now(), status: 'Por Hacer' };
  } catch (error) {
    alert(error.message);
    return;
  }
  tasks.unshift(newTask);
  if (!window.google || !window.google.script || !window.google.script.run) {
    localStorage.setItem('mendcordTasks', JSON.stringify(tasks));
  }
  taskForm.reset();
  taskModal.classList.add('hidden');
  renderTasks();
}

async function loadTasks() {
  try {
    const savedTasks = await callAppsScript('getTasks', currentUser && currentUser.sessionToken);
    if (Array.isArray(savedTasks)) {
      tasks.splice(0, tasks.length, ...savedTasks);
    } else {
      const localTasks = JSON.parse(localStorage.getItem('mendcordTasks') || 'null');
      if (Array.isArray(localTasks)) tasks.splice(0, tasks.length, ...localTasks);
    }
  } catch (error) {
    console.error(error);
  }
  renderTasks();
}

function registerEvents() {
  tabs.forEach((tab) => tab.addEventListener('click', () => setActiveAuthTab(tab.dataset.tab)));
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  navButtons.forEach((button) => button.addEventListener('click', () => showView(button.dataset.target)));
  taskFilter.addEventListener('change', renderTasks);
  wikiSearch.addEventListener('input', renderWiki);
  document.getElementById('requestLeaveBtn').addEventListener('click', () => alert('Solicitud de licencia enviada al administrador.'));
  document.getElementById('newTaskBtn').addEventListener('click', openTaskModal);
  taskForm.addEventListener('submit', handleTaskSubmit);
  document.getElementById('profileForm').addEventListener('submit', handleProfileSave);
}

function animateMetrics() {
  const metrics = document.querySelectorAll('[data-value]');

  metrics.forEach((metric) => {
    const value = Number(metric.dataset.value || 0);
    const suffix = value >= 100 ? '%' : '';
    let current = 0;
    const increment = Math.max(1, Math.ceil(value / 18));

    const tick = () => {
      current = Math.min(current + increment, value);
      metric.textContent = `${current}${suffix}`;

      if (current < value) {
        setTimeout(tick, 35);
      }
    };

    setTimeout(tick, 120);
  });
}

function initIntro() {
  if (!introScreen || !introVideo) return;

  const hideIntro = () => {
    introScreen.classList.add('hidden');
  };

  introVideo.play().catch(() => {
    console.warn('La reproducción automática del video intro fue bloqueada por el navegador.');
  });

  introVideo.addEventListener('ended', hideIntro, { once: true });
  window.setTimeout(hideIntro, 7000);
}

function init() {
  updateClock();
  setInterval(updateClock, 1000);
  renderDirectory();
  renderTasks();
  renderWiki();
  populateTaskOwner();
  setupCommandPalette();
  registerEvents();
  animateMetrics();
  initIntro();
}

init();
