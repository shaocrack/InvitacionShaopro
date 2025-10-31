const nombreInput = document.getElementById('nombre');
const aceptaCheck = document.getElementById('acepta');
const generarBtn = document.getElementById('generar');
const errorEl = document.getElementById('error');
const invitacionSec = document.getElementById('invitacion');
const pauseMusicBtn = document.getElementById('pause-music');
const themeToggleBtn = document.getElementById('theme-toggle');
const terminalLog = document.getElementById('terminal-log');
const jsonOutputEl = document.getElementById('json-output');
const invitePretty = document.getElementById('invite-pretty');
const openMapsBtn = document.getElementById('open-maps');
const toggleViewBtn = document.getElementById('toggle-view');
const pNombre = document.getElementById('p-nombre');
const pMensaje = document.getElementById('p-mensaje');
const pFecha = document.getElementById('p-fecha');
const pHora = document.getElementById('p-hora');
const pLugar = document.getElementById('p-lugar');
const pDireccion = document.getElementById('p-direccion');
const pFirma = document.getElementById('p-firma');
const pFechaPie = document.getElementById('p-fecha-pie');

// Modal confirmación (solo cuando se marca aceptar condiciones)
const confirmModal = document.getElementById('confirm-modal');
const confirmContinue = document.getElementById('confirm-continue');
const confirmExit = document.getElementById('confirm-exit');
const confirmText = document.getElementById('confirm-text');
let pendingAction = 'none';

const audio = document.getElementById('bg-music');

const direccion = 'Portal Shopping, Avenidas Simón Bolívar, Panamericana Norte y calle, Capitán Giovanni Calles, Quito 170133';
const mapsQuery = encodeURIComponent(direccion);

function normalizarNombre(valor) {
  const limpio = valor.trim().replace(/\s+/g, ' ');
  if (!limpio) return '';
  return limpio
    .toLowerCase()
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function construirMensaje(nombre) {
  return (
    `Estimada ${nombre},\n\n` +
    `Usted está cordialmente invitada el día de mañana, 31 de octubre, ` +
    `a una reunión de carácter urgente. Se recomienda ponerse bella ` +
    `(bueno, ya lo es), pero un poquito más bella 😄.\n\n` +
    `Se solicita su amable asistencia.\n\n` +
    `Ubicación: ${direccion}.\n` +
    `Por favor, asistir entre las 6:00 y 6:20 pm.`
  );
}

function actualizarEstadoBoton() {
  const nombre = normalizarNombre(nombreInput.value);
  const ok = nombre.length > 0 && aceptaCheck.checked;
  generarBtn.disabled = !ok;
  errorEl.textContent = '';
}

nombreInput.addEventListener('input', actualizarEstadoBoton);
aceptaCheck.addEventListener('change', actualizarEstadoBoton);

// Mostrar confirmación al marcar aceptar (no al generar)
aceptaCheck.addEventListener('change', () => {
  if (aceptaCheck.checked) {
    pendingAction = 'none';
    abrirConfirmacion();
  }
});

// Autoplay al enfocar o teclear (gesto de usuario)
let audioIntentadoPorInput = false;
nombreInput.addEventListener('focus', () => {
  if (!audioIntentadoPorInput) intentarReproducirAudio(true);
  audioIntentadoPorInput = true;
});
nombreInput.addEventListener('keydown', () => {
  if (audio.paused) intentarReproducirAudio(true);
});

generarBtn.addEventListener('click', () => {
  const nombre = normalizarNombre(nombreInput.value);
  if (!nombre) {
    errorEl.textContent = 'Por favor, escribe tu nombre.';
    return;
  }
  if (!aceptaCheck.checked) {
    errorEl.textContent = 'Debes aceptar las condiciones para continuar.';
    return;
  }
  // Generar directamente (sin modal)
  generarInvitacion(nombre);
});

function continuarDespuesDeConfirmar() {
  // Ya no dispara generación; solo cierra el modal tras confirmar
  // (Se mantiene para compatibilidad si se requiere lógica futura)
}

function generarInvitacion(nombre) {
  const data = construirObjetoInvitacion(nombre);
  renderJson(data);
  invitacionSec.classList.remove('hidden');
  renderPretty(data);
  if (openMapsBtn) openMapsBtn.href = data.maps;

  intentarReproducirAudio();
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  escribirTerminal(`$ node invitacion.js\n`);
  escribirTerminal(`> Generando invitación para ${nombre}...\n`);
  setTimeout(() => escribirTerminal('> Listo. Abra el panel de invitación.\n'), 500);
}

if (pauseMusicBtn) pauseMusicBtn.addEventListener('click', () => {
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(() => {});
    pauseMusicBtn.textContent = 'Pausar música';
  } else {
    audio.pause();
    pauseMusicBtn.textContent = 'Reproducir música';
  }
});

// Copiar dirección
// (Se eliminó botón de copiar/abrir mapa; ahora va en JSON)

// (Se eliminó la puerta de audio)

async function intentarReproducirAudio(forzadoPorUsuario = false) {
  if (!audio) return;
  try {
    audio.volume = 0.9;
    // Autoplay directo; algunos navegadores lo permiten según heurísticas
    await audio.play();
  } catch (_) {
    // Silencioso si falla
  }
}

// Intento de autoplay al cargar; si el navegador lo bloquea, mostramos puerta
window.addEventListener('DOMContentLoaded', () => {
  // Dispara el estado del botón al inicio
  actualizarEstadoBoton();
  aplicarTemaInicial();
  configurarAtajos();
});

// Tema oscuro / claro persistente
function aplicarTemaInicial() {
  const guardado = localStorage.getItem('invite_theme');
  if (guardado === 'dark' || (!guardado && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('theme-dark');
  }
}

function alternarTema() {
  const root = document.documentElement;
  const esOscuro = root.classList.toggle('theme-dark');
  localStorage.setItem('invite_theme', esOscuro ? 'dark' : 'light');
}

themeToggleBtn.addEventListener('click', alternarTema);

// Atajos para devs
function configurarAtajos() {
  document.addEventListener('keydown', (e) => {
    const isEditable = (el) => {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      const editable = el.isContentEditable;
      return editable || tag === 'input' || tag === 'textarea' || tag === 'select';
    };

    // Alt+T -> toggle tema
    if (e.altKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault();
      alternarTema();
      return;
    }
    // Enter en el input -> generar
    if (e.key === 'Enter' && !generarBtn.disabled) {
      e.preventDefault();
      generarBtn.click();
      return;
    }
    // M -> toggle música
    if ((e.key === 'm' || e.key === 'M')) {
      if (isEditable(e.target)) return; // no interferir al escribir
      if (e.repeat) return; // evitar parpadeo por repetición
      e.preventDefault();
      if (pauseMusicBtn) pauseMusicBtn.click();
      return;
    }
    // R -> reiniciar música
    if ((e.key === 'r' || e.key === 'R')) {
      if (isEditable(e.target)) return;
      if (e.repeat) return;
      e.preventDefault();
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        if (pauseMusicBtn) pauseMusicBtn.textContent = 'Pausar música';
      }
      return;
    }
  });
}

function escribirTerminal(texto) {
  if (!terminalLog) return;
  terminalLog.textContent += texto;
}

function renderPretty(data) {
  if (!invitePretty) return;
  if (pNombre) pNombre.textContent = data.destinataria;
  if (pMensaje) pMensaje.textContent = 'Usted está cordialmente invitada el día de mañana a una reunión de carácter urgente. Se recomienda ponerse bella (ya lo es), pero un poquito más bella xD. Por favor, asista.';
  if (pFecha) pFecha.textContent = data.fecha;
  if (pHora) pHora.textContent = data.hora;
  if (pLugar) pLugar.textContent = data.lugar;
  if (pDireccion) pDireccion.textContent = data.direccionCompleta;
  if (pFirma) pFirma.textContent = data.destinataria;
  if (pFechaPie) pFechaPie.textContent = data.fecha;
}

// Confirmación modal
function abrirConfirmacion() {
  if (!confirmModal) return;
  setModalContent({
    message: 'Al aceptar esto y luego presionar ejecutar, usted se compromete a asistir.',
    showExit: true
  });
  confirmModal.classList.remove('hidden');
}

function cerrarConfirmacion() {
  if (!confirmModal) return;
  confirmModal.classList.add('hidden');
}

function setModalContent({ message, showExit }) {
  if (confirmText) confirmText.textContent = message;
  if (confirmExit) confirmExit.style.display = showExit ? '' : 'none';
  const actions = confirmExit?.parentElement;
  if (actions) {
    if (showExit) {
      actions.style.gridTemplateColumns = '1fr 1fr';
    } else {
      actions.style.gridTemplateColumns = '1fr';
    }
  }
}

if (confirmContinue) confirmContinue.addEventListener('click', () => {
  cerrarConfirmacion();
  continuarDespuesDeConfirmar();
});

if (confirmExit) confirmExit.addEventListener('click', () => {
  // Segunda confirmación: solo botón Continuar
  setModalContent({
    message: 'Aquí nadie me rechaza 😎. Has presionado continuar. ',
    showExit: false
  });
});

if (toggleViewBtn) {
  toggleViewBtn.addEventListener('click', () => {
    if (!invitePretty) return;
    const mostrandoPretty = !invitePretty.classList.contains('hidden');
    if (mostrandoPretty) {
      invitePretty.classList.add('hidden');
      toggleViewBtn.textContent = 'Ver invitación';
    } else {
      invitePretty.classList.remove('hidden');
      toggleViewBtn.textContent = 'Ver JSON';
    }
  });
}

// Render JSON estilizado
function renderJson(obj) {
  const json = JSON.stringify(obj, null, 2);
  const escaped = escapeHtml(json);
  const highlighted = escaped
    .replace(/("[^"]+?")(?=\s*:)/g, '<span class="k">$1</span>')
    .replace(/: ("[\s\S]*?")/g, ': <span class="s">$1</span>')
    .replace(/: (\d+(?:\.\d+)?)/g, ': <span class="n">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="b">$1</span>');
  jsonOutputEl.innerHTML = highlighted;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function construirObjetoInvitacion(nombre) {
  return {
    destinataria: nombre,
    fecha: 'Mañana, 31 de octubre',
    hora: 'Entre 6:00 y 6:20 pm',
    lugar: 'Portal Shopping, Quito',
    direccionCompleta: direccion,
    maps: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
    mensaje: 'Usted está cordialmente invitada a una reunión de carácter urgente. Se recomienda ponerse bella (ya lo es) pero un poquito más bella xD.',
    aceptarAsistencia: true
  };
}


