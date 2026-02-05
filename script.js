// =======================
// MODELO DE DATOS
// =======================
let data = JSON.parse(localStorage.getItem("elegibles")) || {
  personas: [],
  periodos: [],   // solo funcionarios
  oferentes: []   // solo oferentes
};

// =======================
// ELEMENTOS DOM
// =======================
const formulario = document.getElementById("formulario");

const contFuncionarios = document.getElementById("contenedorFuncionarios");
const contOferentes = document.getElementById("contenedorOferentes");

const buscarNombre = document.getElementById("buscarNombre");
const buscarPuesto = document.getElementById("buscarPuesto");
const limpiarFiltros = document.getElementById("limpiarFiltros");

// Campos
const tipoSelect = document.getElementById("tipo");
const inicioInput = document.getElementById("inicio");
const finInput = document.getElementById("fin");
const fechaInclusionInput = document.getElementById("fechaInclusion");

// Modal
const modal = document.getElementById("modalHistorial");
const tituloHistorial = document.getElementById("tituloHistorial");
const tablaHistorial = document.getElementById("tablaHistorial");
const theadHistorial = document.getElementById("theadHistorial");
const cerrarModalBtn = document.getElementById("cerrarModal");

// =======================
// EVENTOS
// =======================
formulario.addEventListener("submit", guardarRegistro);
buscarNombre.addEventListener("input", render);
buscarPuesto.addEventListener("input", render);
limpiarFiltros.addEventListener("click", limpiarFiltrosUI);
cerrarModalBtn.addEventListener("click", cerrarModal);
modal.addEventListener("click", e => {
  if (e.target === modal) cerrarModal();
});
tipoSelect.addEventListener("change", alternarCampos);

// =======================
// FORMULARIO
// =======================
function alternarCampos() {
  const tipo = tipoSelect.value;
  document.querySelectorAll(".campo-funcionario").forEach(el => {
    el.classList.toggle("oculto", tipo !== "Funcionario");
    el.required = tipo === "Funcionario";
  });
  document.querySelectorAll(".campo-oferente").forEach(el => {
    el.classList.toggle("oculto", tipo !== "Oferente");
    el.required = tipo === "Oferente";
  });
}

// =======================
// GUARDAR
// =======================
function guardarRegistro(e) {
  e.preventDefault();

  const nombre = nombreInput().value.trim();
  const puesto = puestoInput().value.trim();
  const tipo = tipoSelect.value;

  if (tipo === "Funcionario") {
    const inicio = inicioInput.value;
    const fin = finInput.value;
    if (new Date(fin) < new Date(inicio)) {
      alert("La fecha fin no puede ser menor que la fecha inicio.");
      return;
    }

    const dias = calcularDias(inicio, fin);
    const personaId = obtenerOcrearPersona(nombre, puesto, tipo);

    data.periodos.push({
      id: crypto.randomUUID(),
      personaId,
      puesto,
      inicio,
      fin,
      dias
    });
  }

  if (tipo === "Oferente") {
    const fecha = fechaInclusionInput.value;
    const personaId = obtenerOcrearPersona(nombre, puesto, tipo);

    data.oferentes.push({
      id: crypto.randomUUID(),
      personaId,
      puesto,
      fechaInclusion: fecha
    });
  }

  guardar();
  formulario.reset();
  alternarCampos();
  render();
}

// =======================
// ELIMINAR
// =======================
function eliminarPersona(id) {
  if (!confirm("¿Eliminar esta persona y todo su historial?")) return;
  data.personas = data.personas.filter(p => p.id !== id);
  data.periodos = data.periodos.filter(p => p.personaId !== id);
  data.oferentes = data.oferentes.filter(p => p.personaId !== id);
  guardar();
  render();
}

function eliminarPeriodo(id) {
  if (!confirm("¿Eliminar este registro?")) return;
  data.periodos = data.periodos.filter(p => p.id !== id);
  data.oferentes = data.oferentes.filter(p => p.id !== id);
  guardar();
  render();
}

// =======================
// HISTORIAL INDIVIDUAL
// =======================
function abrirHistorial(personaId) {
  const persona = data.personas.find(p => p.id === personaId);

  if (persona.tipo === "Funcionario") {
    const periodos = data.periodos
      .filter(p => p.personaId === personaId)
      .sort((a, b) => new Date(b.inicio) - new Date(a.inicio));

    tituloHistorial.textContent = `Historial — ${persona.nombre} (${persona.puesto})`;
    theadHistorial.innerHTML = `
      <th>Puesto</th>
      <th>Inicio</th>
      <th>Fin</th>
      <th>Días</th>
      <th></th>
    `;
    tablaHistorial.innerHTML = "";

    if (!periodos.length) {
      tablaHistorial.innerHTML = `<tr><td colspan="5" class="vacio">Sin registros</td></tr>`;
    } else {
      periodos.forEach(p => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${p.puesto}</td>
          <td>${p.inicio}</td>
          <td>${p.fin}</td>
          <td>${p.dias}</td>
          <td class="actions">
            <button onclick="eliminarPeriodo('${p.id}')" class="delete">🗑</button>
          </td>
        `;
        tablaHistorial.appendChild(fila);
      });
    }
  }

  if (persona.tipo === "Oferente") {
    const registros = data.oferentes
      .filter(o => o.personaId === personaId)
      .sort((a, b) => new Date(a.fechaInclusion) - new Date(b.fechaInclusion));

    tituloHistorial.textContent = `Historial — ${persona.nombre} (${persona.puesto})`;
    theadHistorial.innerHTML = `
      <th>Puesto</th>
      <th>Fecha inclusión</th>
      <th>Antigüedad (días)</th>
      <th></th>
    `;
    tablaHistorial.innerHTML = "";

    if (!registros.length) {
      tablaHistorial.innerHTML = `<tr><td colspan="4" class="vacio">Sin registros</td></tr>`;
    } else {
      registros.forEach(r => {
        const antiguedad = calcularAntiguedad(r.fechaInclusion);
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${r.puesto}</td>
          <td>${r.fechaInclusion}</td>
          <td>${antiguedad}</td>
          <td class="actions">
            <button onclick="eliminarPeriodo('${r.id}')" class="delete">🗑</button>
          </td>
        `;
        tablaHistorial.appendChild(fila);
      });
    }
  }

  modal.classList.remove("oculto");
}

function cerrarModal() {
  modal.classList.add("oculto");
}

// =======================
// LÓGICA
// =======================
function obtenerOcrearPersona(nombre, puesto, tipo) {
  let persona = data.personas.find(
    p =>
      p.nombre.toLowerCase() === nombre.toLowerCase() &&
      p.puesto.toLowerCase() === puesto.toLowerCase() &&
      p.tipo === tipo
  );

  if (!persona) {
    persona = {
      id: crypto.randomUUID(),
      nombre,
      puesto,
      tipo,
      totalDias: 0,
      fechaMasAntigua: null
    };
    data.personas.push(persona);
  }

  return persona.id;
}

function recalcularTotales() {
  // Funcionarios
  data.personas
    .filter(p => p.tipo === "Funcionario")
    .forEach(p => (p.totalDias = 0));

  data.periodos.forEach(periodo => {
    const persona = data.personas.find(p => p.id === periodo.personaId);
    if (persona) persona.totalDias += periodo.dias;
  });

  // Oferentes → calcular antigüedad más antigua
  data.personas
    .filter(p => p.tipo === "Oferente")
    .forEach(p => (p.fechaMasAntigua = null));

  data.oferentes.forEach(o => {
    const persona = data.personas.find(p => p.id === o.personaId);
    if (!persona) return;
    if (!persona.fechaMasAntigua || o.fechaInclusion < persona.fechaMasAntigua) {
      persona.fechaMasAntigua = o.fechaInclusion;
    }
  });
}

function calcularDias(inicio, fin) {
  const a = new Date(inicio);
  const b = new Date(fin);
  return Math.floor((b - a) / 86400000) + 1;
}

function calcularAntiguedad(fecha) {
  const inicio = new Date(fecha);
  const hoy = new Date();
  return Math.floor((hoy - inicio) / 86400000);
}

function guardar() {
  recalcularTotales();
  localStorage.setItem("elegibles", JSON.stringify(data));
}

// =======================
// RENDER
// =======================
function render() {
  renderFuncionarios();
  renderOferentes();
}

function renderFuncionarios() {
  renderPorTipo("Funcionario", contFuncionarios);
}

function renderOferentes() {
  const textoNombre = buscarNombre.value.toLowerCase();
  const textoPuesto = buscarPuesto.value.toLowerCase();

  const lista = data.personas
    .filter(p =>
      p.tipo === "Oferente" &&
      p.nombre.toLowerCase().includes(textoNombre) &&
      p.puesto.toLowerCase().includes(textoPuesto)
    )
    .sort((a, b) => new Date(a.fechaMasAntigua) - new Date(b.fechaMasAntigua));

  const grupos = {};
  lista.forEach(p => {
    if (!grupos[p.puesto]) grupos[p.puesto] = [];
    grupos[p.puesto].push(p);
  });

  contOferentes.innerHTML = "";

  if (!lista.length) {
    contOferentes.innerHTML = `<p class="vacio">No hay oferentes registrados.</p>`;
    return;
  }

  Object.keys(grupos).sort().forEach(puesto => {
    const card = document.createElement("div");
    card.className = "card";

    const titulo = document.createElement("h4");
    titulo.textContent = `📌 ${puesto}`;
    card.appendChild(titulo);

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>Nombre</th>
          <th>Antigüedad</th>
          <th>Historial</th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    grupos[puesto]
      .sort((a, b) => new Date(a.fechaMasAntigua) - new Date(b.fechaMasAntigua))
      .forEach((p, i) => {
        const antiguedad = calcularAntiguedad(p.fechaMasAntigua);
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${i + 1}</td>
          <td>${p.nombre}</td>
          <td><strong>${antiguedad}</strong></td>
          <td class="actions">
            <button onclick="abrirHistorial('${p.id}')">📂 Ver</button>
          </td>
          <td class="actions">
            <button onclick="eliminarPersona('${p.id}')" class="delete">🗑</button>
          </td>
        `;
        tbody.appendChild(fila);
      });

    card.appendChild(table);
    contOferentes.appendChild(card);
  });
}

function renderPorTipo(tipo, contenedor) {
  const textoNombre = buscarNombre.value.toLowerCase();
  const textoPuesto = buscarPuesto.value.toLowerCase();

  const lista = data.personas
    .filter(p =>
      p.tipo === tipo &&
      p.nombre.toLowerCase().includes(textoNombre) &&
      p.puesto.toLowerCase().includes(textoPuesto)
    )
    .sort((a, b) => b.totalDias - a.totalDias);

  const grupos = {};
  lista.forEach(p => {
    if (!grupos[p.puesto]) grupos[p.puesto] = [];
    grupos[p.puesto].push(p);
  });

  contenedor.innerHTML = "";

  if (!lista.length) {
    contenedor.innerHTML = `<p class="vacio">No hay funcionarios registrados.</p>`;
    return;
  }

  Object.keys(grupos).sort().forEach(puesto => {
    const card = document.createElement("div");
    card.className = "card";

    const titulo = document.createElement("h4");
    titulo.textContent = `📌 ${puesto}`;
    card.appendChild(titulo);

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>Nombre</th>
          <th>Total días</th>
          <th>Historial</th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    grupos[puesto]
      .sort((a, b) => b.totalDias - a.totalDias)
      .forEach((p, i) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${i + 1}</td>
          <td>${p.nombre}</td>
          <td><strong>${p.totalDias}</strong></td>
          <td class="actions">
            <button onclick="abrirHistorial('${p.id}')">📂 Ver</button>
          </td>
          <td class="actions">
            <button onclick="eliminarPersona('${p.id}')" class="delete">🗑</button>
          </td>
        `;
        tbody.appendChild(fila);
      });

    card.appendChild(table);
    contenedor.appendChild(card);
  });
}

function limpiarFiltrosUI() {
  buscarNombre.value = "";
  buscarPuesto.value = "";
  render();
}

// =======================
// HELPERS INPUTS
// =======================
const nombreInput = () => document.getElementById("nombre");
const puestoInput = () => document.getElementById("puesto");

// =======================
alternarCampos();
render();


