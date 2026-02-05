let personas = JSON.parse(localStorage.getItem("personas")) || [];

const formulario = document.getElementById("formulario");
const tipoSelect = document.getElementById("tipo");
const fechasFuncionario = document.getElementById("fechas-funcionario");
const fechaOferenteBox = document.getElementById("fecha-oferente");

const buscarNombre = document.getElementById("buscarNombre");
const buscarPuesto = document.getElementById("buscarPuesto");
const limpiarFiltrosBtn = document.getElementById("limpiarFiltros");

const funcionariosContainer = document.getElementById("funcionariosContainer");
const oferentesContainer = document.getElementById("oferentesContainer");

const modal = document.getElementById("modalHistorial");
const historialNombre = document.getElementById("historialNombre");
const historialLista = document.getElementById("historialLista");

/* -----------------------------
   FORMULARIO
----------------------------- */

tipoSelect.addEventListener("change", () => {
  if (tipoSelect.value === "Oferente") {
    fechasFuncionario.classList.add("hidden");
    fechaOferenteBox.classList.remove("hidden");
  } else {
    fechasFuncionario.classList.remove("hidden");
    fechaOferenteBox.classList.add("hidden");
  }
});

formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = nombreInput().value.trim();
  const puesto = puestoInput().value.trim();
  const tipo = tipoSelect.value;

  if (!nombre || !puesto || !tipo) return;

  let persona = personas.find(
    p => p.nombre === nombre && p.puesto === puesto && p.tipo === tipo
  );

  if (!persona) {
    persona = {
      id: crypto.randomUUID(),
      nombre,
      puesto,
      tipo,
      totalDias: 0,
      fechaIngreso: null,
      historial: []
    };
    personas.push(persona);
  }

  if (tipo === "Funcionario") {
    const inicio = document.getElementById("inicio").value;
    const fin = document.getElementById("fin").value;
    if (!inicio || !fin) return;

    const dias = calcularDias(inicio, fin);
    persona.totalDias += dias;
    persona.historial.push({ inicio, fin, dias });
  } else {
    const fechaOferente = document.getElementById("fechaOferente").value;
    if (!fechaOferente) return;

    persona.fechaIngreso = fechaOferente;
    persona.historial.push({ fecha: fechaOferente });
  }

  guardarYMostrar();
  formulario.reset();
  fechaOferenteBox.classList.add("hidden");
  fechasFuncionario.classList.remove("hidden");
});

/* -----------------------------
   FILTROS
----------------------------- */

buscarNombre.addEventListener("input", mostrarTodo);
buscarPuesto.addEventListener("input", mostrarTodo);
limpiarFiltrosBtn.addEventListener("click", () => {
  buscarNombre.value = "";
  buscarPuesto.value = "";
  mostrarTodo();
});

/* -----------------------------
   UTILIDADES
----------------------------- */

function nombreInput() {
  return document.getElementById("nombre");
}
function puestoInput() {
  return document.getElementById("puesto");
}

function calcularDias(inicio, fin) {
  const d1 = new Date(inicio);
  const d2 = new Date(fin);
  return Math.floor((d2 - d1) / 86400000) + 1;
}

function diasDesde(fecha) {
  const f = new Date(fecha);
  const hoy = new Date();
  return Math.floor((hoy - f) / 86400000);
}

function guardarYMostrar() {
  localStorage.setItem("personas", JSON.stringify(personas));
  mostrarTodo();
}

/* -----------------------------
   RENDER GENERAL
----------------------------- */

function mostrarTodo() {
  mostrarFuncionarios();
  mostrarOferentes();
}

/* -----------------------------
   FUNCIONARIOS
----------------------------- */

function mostrarFuncionarios() {
  funcionariosContainer.innerHTML = "";

  const textoNombre = buscarNombre.value.toLowerCase();
  const textoPuesto = buscarPuesto.value.toLowerCase();

  const funcionarios = personas
    .filter(p => p.tipo === "Funcionario")
    .filter(p =>
      p.nombre.toLowerCase().includes(textoNombre) &&
      p.puesto.toLowerCase().includes(textoPuesto)
    );

  const porPuesto = agruparPor(funcionarios, "puesto");

  Object.keys(porPuesto).forEach(puesto => {
    const lista = porPuesto[puesto].sort((a, b) => b.totalDias - a.totalDias);

    const card = document.createElement("div");
    card.className = "puesto-card";

    card.innerHTML = `
      <div class="puesto-title">📌 ${puesto}</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Total días</th>
            <th>Historial</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map((p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.nombre}</td>
              <td><strong>${p.totalDias}</strong></td>
              <td><span class="action-link" onclick="verHistorial('${p.id}')">Ver</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    funcionariosContainer.appendChild(card);
  });
}

/* -----------------------------
   OFERENTES
----------------------------- */

function mostrarOferentes() {
  oferentesContainer.innerHTML = "";

  const textoNombre = buscarNombre.value.toLowerCase();
  const textoPuesto = buscarPuesto.value.toLowerCase();

  const oferentes = personas
    .filter(p => p.tipo === "Oferente")
    .filter(p =>
      p.nombre.toLowerCase().includes(textoNombre) &&
      p.puesto.toLowerCase().includes(textoPuesto)
    );

  const porPuesto = agruparPor(oferentes, "puesto");

  Object.keys(porPuesto).forEach(puesto => {
    const lista = porPuesto[puesto].sort(
      (a, b) => diasDesde(b.fechaIngreso) - diasDesde(a.fechaIngreso)
    );

    const card = document.createElement("div");
    card.className = "puesto-card";

    card.innerHTML = `
      <div class="puesto-title">📌 ${puesto}</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Antigüedad (días)</th>
            <th>Historial</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map((p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.nombre}</td>
              <td><strong>${diasDesde(p.fechaIngreso)}</strong></td>
              <td><span class="action-link" onclick="verHistorial('${p.id}')">Ver</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    oferentesContainer.appendChild(card);
  });
}

/* -----------------------------
   HISTORIAL MODAL
----------------------------- */

function verHistorial(id) {
  const persona = personas.find(p => p.id === id);
  if (!persona) return;

  historialNombre.textContent = `Historial — ${persona.nombre} (${persona.puesto})`;
  historialLista.innerHTML = "";

  if (persona.historial.length === 0) {
    historialLista.innerHTML = "<li>No hay registros.</li>";
  } else {
    persona.historial.forEach(h => {
      if (persona.tipo === "Funcionario") {
        historialLista.innerHTML += `<li>${h.inicio} → ${h.fin} (${h.dias} días)</li>`;
      } else {
        historialLista.innerHTML += `<li>Incluido como oferente: ${h.fecha}</li>`;
      }
    });
  }

  modal.classList.remove("hidden");
}

function cerrarHistorial() {
  modal.classList.add("hidden");
}

/* -----------------------------
   HELPERS
----------------------------- */

function agruparPor(array, clave) {
  return array.reduce((acc, obj) => {
    acc[obj[clave]] = acc[obj[clave]] || [];
    acc[obj[clave]].push(obj);
    return acc;
  }, {});
}

/* -----------------------------
   INIT
----------------------------- */

mostrarTodo();
