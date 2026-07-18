const LOGIN_USERNAME = 'COMBO2027';
const LOGIN_PASSWORD = 'Combo2027@';
const STORAGE_KEY = 'combo2027Records';
const SESSION_KEY = 'combo2027Authenticated';
const OTHER_PROFILE_VALUE = '__OTHER__';
const RECORDS_COLLECTION = 'combo2027_records';

// Reemplace estos valores con los de su proyecto Firebase para activar sincronizacion multi-dispositivo.
const firebaseConfig = {
  apiKey: 'AIzaSyDHKR1VUkqAaTJlKa_v9euo3aFb4E2X1oA',
  authDomain: 'cronograma-47eed.firebaseapp.com',
  projectId: 'cronograma-47eed',
  storageBucket: 'cronograma-47eed.firebasestorage.app',
  messagingSenderId: '527539901782',
  appId: '1:527539901782:web:fa171e6fe41898be54b2f7'
};

const profileGroups = {
  'Carreras profesionales': [
    'Administración de Empresas',
    'Arquitectura',
    'Bacteriología',
    'Biología',
    'Comunicación Social',
    'Contaduría Pública',
    'Derecho',
    'Diseño Gráfico',
    'Diseño Industrial',
    'Economía',
    'Enfermería',
    'Fisioterapia',
    'Ingeniería Ambiental',
    'Ingeniería Civil',
    'Ingeniería de Alimentos',
    'Ingeniería de Sistemas',
    'Ingeniería Industrial',
    'Ingeniería Mecánica',
    'Instrumentación Quirúrgica',
    'Licenciatura en Educación',
    'Medicina',
    'Medicina Veterinaria',
    'Microbiología',
    'Negocios Internacionales',
    'Odontología',
    'Psicología',
    'Química Farmacéutica',
    'Trabajo Social',
    'Zootecnia'
  ],
  'Tecnologías': [
    'Tecnología en Análisis y Desarrollo de Software',
    'Tecnología en Gestión Administrativa',
    'Tecnología en Gestión Contable y Financiera',
    'Tecnología en Gestión Empresarial',
    'Tecnología en Logística',
    'Tecnología en Producción Multimedia',
    'Tecnología en Regencia de Farmacia',
    'Tecnología en Seguridad y Salud en el Trabajo',
    'Tecnología en Sistemas',
    'Tecnología en Telecomunicaciones'
  ],
  'Técnicos': [
    'Técnico Administrativo',
    'Técnico en Archivo',
    'Técnico en Atención a la Primera Infancia',
    'Técnico en Cocina',
    'Técnico en Construcción',
    'Técnico en Enfermería',
    'Técnico en Logística',
    'Técnico en Mantenimiento de Equipos',
    'Técnico en Mercadeo y Ventas',
    'Técnico en Recursos Humanos',
    'Técnico en Sistemas',
    'Técnico Laboral Auxiliar Contable'
  ],
  'Oficios y ocupaciones': [
    'Auxiliar Administrativo',
    'Auxiliar de Bodega',
    'Auxiliar de Cocina',
    'Auxiliar de Enfermería',
    'Auxiliar de Farmacia',
    'Auxiliar de Oficina',
    'Conductor',
    'Mensajero',
    'Operario',
    'Recepcionista',
    'Servicios Generales',
    'Vendedor'
  ]
};

const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const candidateForm = document.getElementById('candidateForm');
const profileSelect = document.getElementById('profile');
const customProfileWrapper = document.getElementById('customProfileWrapper');
const customProfileInput = document.getElementById('customProfile');
const recordsTableBody = document.getElementById('recordsTableBody');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const totalRecords = document.getElementById('totalRecords');
const filteredRecords = document.getElementById('filteredRecords');
const recordIdInput = document.getElementById('recordId');
const formTitle = document.getElementById('formTitle');
const saveBtn = document.getElementById('saveBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const syncStatus = document.getElementById('syncStatus');

let records = loadRecords();
let searchTerm = '';
let cloudDb = null;
let cloudReady = false;
let cloudAuth = null;
let unsubscribeCloudRecords = null;

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => String(value || '').trim() !== '');
}

function setSyncStatus(message, mode) {
  if (!syncStatus) {
    return;
  }

  syncStatus.textContent = message;
  syncStatus.classList.remove('sync-online', 'sync-offline', 'sync-pending');
  syncStatus.classList.add(mode);
}

function isCloudAuthEnabled() {
  return cloudReady && cloudAuth;
}

function toRecordShape(item) {
  return {
    id: item.id,
    firstName: item.firstName || '',
    lastName: item.lastName || '',
    documentId: item.documentId || '',
    profile: item.profile || '',
    familyReference: item.familyReference || '',
    phone: item.phone || '',
    availableOtherCity: item.availableOtherCity || '',
    zoneInfluence: item.zoneInfluence || '',
    email: item.email || '',
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function applyRecords(nextRecords) {
  records = nextRecords.map(toRecordShape).sort((a, b) => {
    const aTime = Date.parse(a.createdAt) || 0;
    const bTime = Date.parse(b.createdAt) || 0;
    return bTime - aTime;
  });

  saveRecords();
  renderTable();
}

function stopCloudRecordsListener() {
  if (unsubscribeCloudRecords) {
    unsubscribeCloudRecords();
    unsubscribeCloudRecords = null;
  }
}

function startCloudRecordsListener() {
  if (!cloudDb || !cloudAuth || !cloudAuth.currentUser) {
    return;
  }

  stopCloudRecordsListener();
  setSyncStatus('Sincronizando en nube...', 'sync-pending');

  unsubscribeCloudRecords = cloudDb.collection(RECORDS_COLLECTION).onSnapshot((snapshot) => {
    const cloudRecords = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    applyRecords(cloudRecords);
    setSyncStatus('Sincronizado en nube', 'sync-online');
  }, () => {
    setSyncStatus('Error de sincronizacion', 'sync-offline');
  });
}

function initializeCloudSync() {
  if (!hasFirebaseConfig()) {
    setSyncStatus('Sincronizacion local', 'sync-offline');
    return;
  }

  if (typeof firebase === 'undefined') {
    setSyncStatus('Firebase no disponible', 'sync-offline');
    return;
  }

  try {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
    }

    cloudDb = firebase.firestore();
    cloudAuth = firebase.auth();
    cloudReady = true;
    setSyncStatus('Nube lista - inicie sesion', 'sync-pending');

    cloudAuth.onAuthStateChanged((user) => {
      if (user) {
        setAuthenticated(true);
        loginError.textContent = '';
        showApp();
        startCloudRecordsListener();
      } else {
        setAuthenticated(false);
        stopCloudRecordsListener();
        setSyncStatus('Sesion cerrada en nube', 'sync-offline');
        showLogin();
      }
    });
  } catch {
    setSyncStatus('Error de configuracion nube', 'sync-offline');
  }
}

function populateProfiles() {
  Object.entries(profileGroups).forEach(([groupName, options]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = groupName;

    options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option;
      optionElement.textContent = option;
      optgroup.appendChild(optionElement);
    });

    profileSelect.appendChild(optgroup);
  });

  const otherOption = document.createElement('option');
  otherOption.value = OTHER_PROFILE_VALUE;
  otherOption.textContent = 'Otra';
  profileSelect.appendChild(otherOption);
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function isAuthenticated() {
  return localStorage.getItem(SESSION_KEY) === 'true';
}

function setAuthenticated(value) {
  localStorage.setItem(SESSION_KEY, String(value));
}

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
}

function showLogin() {
  appView.hidden = true;
  loginView.hidden = false;
}

function normalizeText(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function getFormData() {
  const selectedProfile = profileSelect.value;
  const customProfile = customProfileInput.value.trim();
  const profile = selectedProfile === OTHER_PROFILE_VALUE ? customProfile : selectedProfile;

  return {
    id: recordIdInput.value || crypto.randomUUID(),
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    documentId: document.getElementById('documentId').value.trim(),
    profile: profile.trim(),
    familyReference: document.getElementById('familyReference').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    availableOtherCity: document.getElementById('availableOtherCity').value,
    zoneInfluence: document.getElementById('zoneInfluence').value.trim(),
    email: document.getElementById('email').value.trim(),
    createdAt: new Date().toISOString()
  };
}

function resetForm() {
  candidateForm.reset();
  recordIdInput.value = '';
  formTitle.textContent = 'Nuevo registro';
  saveBtn.textContent = 'Guardar registro';
  cancelEditBtn.hidden = true;
  toggleCustomProfile(false);
}

function toggleCustomProfile(show) {
  customProfileWrapper.hidden = !show;
  customProfileWrapper.classList.toggle('hidden-field', show);
  customProfileInput.required = show;
  if (!show) {
    customProfileInput.value = '';
  }
}

function filterRecords() {
  if (!searchTerm) {
    return [...records];
  }

  const normalizedTerm = normalizeText(searchTerm);
  return records.filter((record) => {
    const haystack = [
      record.firstName,
      record.lastName,
      record.documentId,
      record.profile,
      record.familyReference,
      record.phone,
      record.availableOtherCity || '',
      record.zoneInfluence || '',
      record.email || ''
    ].map(normalizeText).join(' ');

    return haystack.includes(normalizedTerm);
  });
}

function renderTable() {
  const filtered = filterRecords();
  totalRecords.textContent = String(records.length);
  filteredRecords.textContent = String(filtered.length);

  if (filtered.length === 0) {
    recordsTableBody.innerHTML = '<tr><td colspan="10" class="empty-state">No se encontraron registros.</td></tr>';
    return;
  }

  recordsTableBody.innerHTML = filtered.map((record) => `
    <tr>
      <td>${escapeHtml(record.firstName)}</td>
      <td>${escapeHtml(record.lastName)}</td>
      <td>${escapeHtml(record.documentId)}</td>
      <td>${escapeHtml(record.profile)}</td>
      <td>${escapeHtml(record.familyReference)}</td>
      <td>${escapeHtml(record.phone)}</td>
      <td>${escapeHtml(record.availableOtherCity || '')}</td>
      <td>${escapeHtml(record.zoneInfluence || '')}</td>
      <td>${escapeHtml(record.email || '')}</td>
      <td>
        <div class="table-actions">
          <button class="table-btn edit" type="button" data-action="edit" data-id="${record.id}">Editar</button>
          <button class="table-btn delete" type="button" data-action="delete" data-id="${record.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function upsertRecord(record) {
  const index = records.findIndex((item) => item.id === record.id);

  const normalized = toRecordShape(record);

  if (index >= 0) {
    records[index] = { ...records[index], ...normalized };
  } else {
    records.unshift(normalized);
  }

  saveRecords();
  renderTable();

  if (!isCloudAuthEnabled() || !cloudAuth.currentUser) {
    return;
  }

  try {
    await cloudDb.collection(RECORDS_COLLECTION).doc(normalized.id).set(normalized, { merge: true });
    setSyncStatus('Sincronizado en nube', 'sync-online');
  } catch {
    setSyncStatus('No se pudo sincronizar', 'sync-offline');
  }
}

function startEdit(recordId) {
  const record = records.find((item) => item.id === recordId);
  if (!record) {
    return;
  }

  recordIdInput.value = record.id;
  document.getElementById('firstName').value = record.firstName;
  document.getElementById('lastName').value = record.lastName;
  document.getElementById('documentId').value = record.documentId;
  document.getElementById('familyReference').value = record.familyReference;
  document.getElementById('phone').value = record.phone;
  document.getElementById('availableOtherCity').value = record.availableOtherCity || '';
  document.getElementById('zoneInfluence').value = record.zoneInfluence || '';
  document.getElementById('email').value = record.email || '';

  const knownProfile = Object.values(profileGroups).some((options) => options.includes(record.profile));
  if (knownProfile) {
    profileSelect.value = record.profile;
    toggleCustomProfile(false);
  } else {
    profileSelect.value = OTHER_PROFILE_VALUE;
    toggleCustomProfile(true);
    customProfileInput.value = record.profile;
  }

  formTitle.textContent = 'Editar registro';
  saveBtn.textContent = 'Actualizar registro';
  cancelEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteRecord(recordId) {
  const confirmed = window.confirm('¿Desea eliminar este registro?');
  if (!confirmed) {
    return;
  }

  records = records.filter((item) => item.id !== recordId);
  saveRecords();
  renderTable();

  if (isCloudAuthEnabled() && cloudAuth.currentUser) {
    try {
      await cloudDb.collection(RECORDS_COLLECTION).doc(recordId).delete();
      setSyncStatus('Sincronizado en nube', 'sync-online');
    } catch {
      setSyncStatus('No se pudo sincronizar', 'sync-offline');
    }
  }

  if (recordIdInput.value === recordId) {
    resetForm();
  }
}

function exportToExcel() {
  if (records.length === 0) {
    window.alert('No hay registros para exportar.');
    return;
  }

  const exportData = records.map((record) => ({
    Nombres: record.firstName,
    Apellidos: record.lastName,
    Cedula: record.documentId,
    'Perfil o profesion': record.profile,
    'Referencia familiar': record.familyReference,
    Telefono: record.phone,
    'Disponibilidad para viajar a otra ciudad': record.availableOtherCity || '',
    'Zona de influencia': record.zoneInfluence || '',
    Correo: record.email || ''
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hojas de Vida');
  XLSX.writeFile(workbook, 'banco-hojas-de-vida-combo-2027.xlsx');
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (isCloudAuthEnabled()) {
    try {
      setSyncStatus('Validando acceso...', 'sync-pending');
      await cloudAuth.signInWithEmailAndPassword(username, password);
      setAuthenticated(true);
      loginError.textContent = '';
      showApp();
      return;
    } catch {
      loginError.textContent = 'Credenciales invalidas o usuario no autorizado.';
      setSyncStatus('Acceso denegado', 'sync-offline');
      return;
    }
  }

  if (username === LOGIN_USERNAME && password === LOGIN_PASSWORD) {
    setAuthenticated(true);
    loginError.textContent = '';
    showApp();
    return;
  }

  loginError.textContent = 'Usuario o contraseña incorrectos.';
});

logoutBtn.addEventListener('click', async () => {
  if (isCloudAuthEnabled() && cloudAuth.currentUser) {
    await cloudAuth.signOut();
  }

  setAuthenticated(false);
  loginForm.reset();
  showLogin();
});

profileSelect.addEventListener('change', () => {
  toggleCustomProfile(profileSelect.value === OTHER_PROFILE_VALUE);
});

candidateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = getFormData();

  if (!formData.profile) {
    window.alert('Debe seleccionar o escribir una profesión u oficio.');
    return;
  }

  const duplicatedDocument = records.some((record) => record.documentId === formData.documentId && record.id !== formData.id);
  if (duplicatedDocument) {
    window.alert('Ya existe un registro con esa cédula.');
    return;
  }

  await upsertRecord(formData);
  resetForm();
});

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

searchInput.addEventListener('input', (event) => {
  searchTerm = event.target.value;
  renderTable();
});

recordsTableBody.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const action = target.dataset.action;
  const recordId = target.dataset.id;

  if (!action || !recordId) {
    return;
  }

  if (action === 'edit') {
    startEdit(recordId);
  }

  if (action === 'delete') {
    await deleteRecord(recordId);
  }
});

exportBtn.addEventListener('click', exportToExcel);

populateProfiles();
renderTable();
initializeCloudSync();

if (isAuthenticated() && !isCloudAuthEnabled()) {
  showApp();
} else {
  showLogin();
}
