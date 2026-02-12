let personas = JSON.parse(localStorage.getItem("personas")) || [];
let usuarioActual = "Administrador";
let puestoActivo = null;

const formulario = document.getElementById("formulario");
const tipoSelect = document.getElementById("tipo");
const fechasFuncionario = document.getElementById("fechasFuncionario");
const fechaOferenteBox = document.getElementById("fechaOferenteBox");
const tabsContainer = document.getElementById("tabs");
const listaContainer = document.getElementById("listaContainer");

const modal = document.getElementById("modalHistorial");
const historialNombre = document.getElementById("historialNombre");
const historialLista = document.getElementById("historialLista");
const cerrarModalBtn = document.getElementById("cerrarModal");

/* TIPO */
tipoSelect.addEventListener("change", () => {
  if (tipoSelect.value === "Oferente") {
    fechasFuncionario.style.display = "none";
    fechaOferenteBox.style.display = "block";
  } else {
    fechasFuncionario.style.display = "block";
    fechaOferenteBox.style.display = "none";
  }
});

/* GUARDAR */
formulario.addEventListener("submit", e => {
  e.preventDefault();

  const nombre = nombreInput.value.trim();
  const cedula = cedulaInput.value.trim();
  const fechaServicio = fechaServicioInput.value;
  const telefono = telefonoInput.value.trim();
  const correo = correoInput.value.trim();
  const puesto = puestoInput.value;
  const tipo = tipoSelect.value;

  if (!nombre || !cedula) return;

  let persona = personas.find(p => p.cedula === cedula);

  if (!persona) {
    persona = {
      id: crypto.randomUUID(),
      nombre,
      cedula,
      fechaServicio,
      telefono,
      correo,
      puesto,
      tipo,
      historial: [],
      auditoria: []
    };
    personas.push(persona);
  }

  if (tipo === "Funcionario") {
    const inicio = inicioInput.value;
    const fin = finInput.value;
    const dias = calcularDias(inicio, fin);
    persona.historial.push({ inicio, fin, dias });
  } else {
    const fecha = fechaOferenteInput.value;
    persona.historial.push({ fecha });
  }

  persona.auditoria.push({
    usuario: usuarioActual,
    accion: "Registro/Actualización",
    fecha: new Date().toLocaleString()
  });

  guardar();
  formulario.reset();
});

/* PESTAÑAS */
function generarTabs() {
  const puestos = [...new Set(personas.map(p => p.puesto))];
  tabsContainer.innerHTML = "";

  puestos.forEach(puesto => {
    const btn = document.createElement("div");
    btn.className = "tab-btn";
    btn.textContent = puesto;
    btn.onclick = () => {
      puestoActivo = puesto;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    };
    tabsContainer.appendChild(btn);
  });
}

/* RENDER */
function render() {
  generarTabs();
  listaContainer.innerHTML = "";

  if (!puestoActivo) return;

  const lista = personas.filter(p => p.puesto === puestoActivo);

  listaContainer.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Cédula</th>
          <th>Tipo</th>
          <th>Historial</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${lista.map(p => `
          <tr>
            <td>${p.nombre}</td>
            <td>${p.cedula}</td>
            <td>${p.tipo}</td>
            <td><button onclick="verHistorial('${p.id}')">Ver</button></td>
            <td>
              <button onclick="eliminarPersona('${p.id}')">Eliminar</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

/* HISTORIAL */
function verHistorial(id) {
  const persona = personas.find(p => p.id === id);
  historialNombre.textContent = persona.nombre;
  historialLista.innerHTML = "";

  persona.historial.forEach(h => {
    if (persona.tipo === "Funcionario") {
      historialLista.innerHTML += `<li>${h.inicio} → ${h.fin} (${h.dias} días)</li>`;
    } else {
      historialLista.innerHTML += `<li>Oferente desde ${h.fecha}</li>`;
    }
  });

  modal.classList.add("active");
}

cerrarModalBtn.onclick = () => modal.classList.remove("active");

/* ELIMINAR */
function eliminarPersona(id) {
  if (!confirm("¿Eliminar registro?")) return;
  personas = personas.filter(p => p.id !== id);
  guardar();
}

/* STORAGE */
function guardar() {
  localStorage.setItem("personas", JSON.stringify(personas));
  render();
}

/* HELPERS */
function calcularDias(inicio, fin) {
  const d1 = new Date(inicio);
  const d2 = new Date(fin);
  return Math.floor((d2 - d1) / 86400000) + 1;
}

render();


