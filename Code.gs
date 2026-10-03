const SPREADSHEET_ID = '1cVyaZSRfz4d6kMZmTd8FjgEUK2UBMubhEwOIq10TEZU';
const USER_SHEET_NAME = 'Usuarios';

const USER_HEADERS = [
  'ID', 'Fecha de creación', 'Nombre', 'Apellido', 'Correo electrónico', 'Sal de contraseña', 'Hash de contraseña',
  'Departamento', 'Cargo', 'Teléfono', 'Estado', 'Biografía', 'Habilidades'
];
const USER_EMAIL_COLUMN = 4;
const LEGACY_HEADERS = {
  Usuarios: [
    'id', 'createdAt', 'name', 'surname', 'email', 'passwordSalt', 'passwordHash',
    'department', 'role', 'phone', 'status', 'bio', 'skills'
  ]
};

function doGet() {
  return jsonResponse_({ ok: true, servicio: 'Grupo Mendcord API', accion: 'registrarUsuario' });
}

function doPost(e) {
  const requestId = String(e && e.parameter && e.parameter.requestId || '');
  try {
    const payloadText = e && e.parameter && e.parameter.payload;
    if (!payloadText) throw new Error('No se recibieron datos para procesar.');

    const payload = JSON.parse(payloadText);
    if (payload.action !== 'registrarUsuario') throw new Error('La acción solicitada no está disponible.');

    const result = registerUser(payload.user);
    return postMessageResponse_({
      source: 'mendcord-api',
      requestId,
      ok: true,
      welcomeEmailSent: result.welcomeEmailSent
    });
  } catch (error) {
    return postMessageResponse_({
      source: 'mendcord-api',
      requestId,
      ok: false,
      error: error.message || 'No se pudo procesar el registro.'
    });
  }
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function postMessageResponse_(value) {
  const message = JSON.stringify(value).replace(/</g, '\\u003c');
  const html = '<!doctype html><html><body><script>window.top.postMessage(' + message + ', "*");</script></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupSheets() {
  traducirEncabezados();
  return { ok: true, message: 'Las pestañas y encabezados en español están listos.' };
}

function autorizarCorreoBienvenida() {
  return { ok: true, correosDisponiblesHoy: MailApp.getRemainingDailyQuota() };
}

function traducirEncabezados() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(USER_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(USER_SHEET_NAME);
  sheet.getRange(1, 1, 1, USER_HEADERS.length).setValues([USER_HEADERS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, USER_HEADERS.length).setFontWeight('bold');
  return { ok: true, message: 'Encabezados de Usuarios actualizados en español.' };
}

function registerUser(user) {
  const input = user || {};
  const name = requiredText_(input.name, 'Nombre', 80);
  const surname = requiredText_(input.surname, 'Apellido', 80);
  const email = normalizeEmail_(input.email);
  const password = String(input.password || '');
  const department = requiredText_(input.department, 'Departamento', 100);
  const role = requiredText_(input.role, 'Cargo', 100);
  const phone = requiredText_(input.phone, 'Teléfono', 40);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Introduce un correo electrónico válido.');
  }
  if (password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let userRow;
  try {
    const sheet = getSheet_(USER_SHEET_NAME, USER_HEADERS);
    const rows = sheet.getDataRange().getValues();
    const exists = rows.slice(1).some((row) => normalizeEmail_(row[USER_EMAIL_COLUMN]) === email);
    if (exists) throw new Error('Ya existe una cuenta con ese correo.');

    const salt = Utilities.getUuid();
    userRow = [
      Utilities.getUuid(), new Date().toISOString(), name, surname, email,
      salt, hashPassword_(password, salt), department, role, phone,
      'En línea', '', ''
    ];
    sheet.appendRow(userRow);
  } finally {
    lock.releaseLock();
  }

  let welcomeEmailSent = false;
  try {
    sendWelcomeEmail_({ name, surname, email, department, role, phone });
    welcomeEmailSent = true;
  } catch (error) {
    console.error('No se pudo enviar el correo de bienvenida a ' + email + ': ' + error.message);
  }
  return { ok: true, welcomeEmailSent };
}

function sendWelcomeEmail_(user) {
  const fullName = [user.name, user.surname].filter(Boolean).join(' ');
  const escaped = {
    name: escapeHtml_(fullName),
    email: escapeHtml_(user.email),
    department: escapeHtml_(user.department),
    role: escapeHtml_(user.role),
    phone: escapeHtml_(user.phone)
  };
  const subject = 'Bienvenido/a a Grupo Mendcord | Tu cuenta está lista';
  const body = [
    'Hola ' + fullName + ',',
    '',
    'Te damos la bienvenida a Grupo Mendcord. Tu cuenta del portal interno ya está creada.',
    '',
    'Datos registrados:',
    'Nombre: ' + fullName,
    'Correo: ' + user.email,
    'Departamento: ' + user.department,
    'Cargo: ' + user.role,
    'Teléfono: ' + user.phone,
    '',
    'Por seguridad, este mensaje no incluye tu contraseña.',
    'Si no solicitaste esta cuenta, responde a este correo para recibir asistencia.',
    '',
    'Saludos,',
    'Equipo de Grupo Mendcord'
  ].join('\n');
  const htmlBody = `
    <div style="margin:0;background:#f2f5f2;padding:32px 16px;font-family:Arial,sans-serif;color:#23312a">
      <div style="max-width:580px;margin:0 auto;background:#fff;border:1px solid #dbe5dd;border-radius:12px;overflow:hidden">
        <div style="padding:24px 30px;background:#163b2b;color:#fff">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#b8d8c4">Grupo Mendcord</div>
          <h1 style="margin:12px 0 0;font-size:24px;font-weight:600">Tu cuenta está lista</h1>
        </div>
        <div style="padding:28px 30px">
          <p style="margin:0 0 12px;font-size:16px">Hola ${escaped.name},</p>
          <p style="margin:0 0 22px;color:#526258;line-height:1.6">Te damos la bienvenida al portal interno de Grupo Mendcord. Estos son los datos asociados a tu cuenta:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:10px 0;color:#718078;border-bottom:1px solid #e8eee9">Correo</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #e8eee9">${escaped.email}</td></tr>
            <tr><td style="padding:10px 0;color:#718078;border-bottom:1px solid #e8eee9">Departamento</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #e8eee9">${escaped.department}</td></tr>
            <tr><td style="padding:10px 0;color:#718078;border-bottom:1px solid #e8eee9">Cargo</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #e8eee9">${escaped.role}</td></tr>
            <tr><td style="padding:10px 0;color:#718078">Teléfono</td><td style="padding:10px 0;text-align:right">${escaped.phone}</td></tr>
          </table>
          <p style="margin:24px 0 0;padding:14px 16px;background:#f2f7f3;border-radius:8px;color:#526258;font-size:13px;line-height:1.6">Por seguridad, nunca enviamos contraseñas por correo. Si no solicitaste esta cuenta, responde a este mensaje para recibir asistencia.</p>
          <p style="margin:24px 0 0;color:#526258;line-height:1.6">Saludos,<br><strong>Equipo de Grupo Mendcord</strong></p>
        </div>
      </div>
    </div>`;
  MailApp.sendEmail({
    to: user.email,
    subject,
    body,
    htmlBody,
    name: 'Grupo Mendcord'
  });
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function getSheet_(name, headers) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else {
    const actualHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (headers.some((header, index) => actualHeaders[index] !== header)) {
      const previousHeaders = LEGACY_HEADERS[name];
      const canMigrateHeaders = previousHeaders && previousHeaders.every((header, index) => actualHeaders[index] === header);
      if (!canMigrateHeaders) {
        throw new Error('Los encabezados de la pestaña "' + name + '" no coinciden. Revisa sus columnas antes de continuar.');
      }
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  return sheet;
}

function requiredText_(value, label, maxLength) {
  const text = String(value || '').trim();
  if (!text) throw new Error('El campo ' + label + ' es obligatorio.');
  if (text.length > maxLength) throw new Error('El campo ' + label + ' supera el límite permitido.');
  return text;
}

function normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword_(password, salt) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt) + ':' + String(password),
    Utilities.Charset.UTF_8
  );
  return digest.map((byte) => ('0' + ((byte + 256) % 256).toString(16)).slice(-2)).join('');
}

