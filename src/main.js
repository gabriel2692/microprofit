
import './style.css'

const formulario = document.querySelector('#calculadora')
const aviso = document.querySelector('#aviso')
const panelResultados = document.querySelector('.resultados')
const bloqueResultados = document.querySelector('#bloque-resultados')
const mensajeInicial = document.querySelector('#mensaje-inicial')
const nombreResultado = document.querySelector('#nombre-resultado')
const estado = document.querySelector('#estado')

const botones = {
  guardar: document.querySelector('#guardar'),
  copiar: document.querySelector('#copiar'),
  limpiar: document.querySelector('#limpiar'),
  borrarHistorial: document.querySelector('#borrar-historial'),
}

const listaHistorial = document.querySelector('#lista-historial')

const campos = {
  nombre: document.querySelector('#nombre'),
  precio: document.querySelector('#precio'),
  costo: document.querySelector('#costo'),
  envio: document.querySelector('#envio'),
  comision: document.querySelector('#comision'),
  otros: document.querySelector('#otros'),
}

const salidas = {
  comision: document.querySelector('[data-resultado="comision"]'),
  costoTotal: document.querySelector('[data-resultado="costo-total"]'),
  ganancia: document.querySelector('[data-resultado="ganancia"]'),
  margen: document.querySelector('[data-resultado="margen"]'),
  equilibrio: document.querySelector('[data-resultado="equilibrio"]'),
}

const pesos = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const porcentaje = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

let calculoActual = null
let historial = []

function leerNumero(input) {
  const texto = input.value.trim()
  if (texto === '') return null
  return Number(texto)
}

function leerDatos() {
  return {
    nombre: campos.nombre.value.trim(),
    precio: leerNumero(campos.precio),
    costo: leerNumero(campos.costo),
    envio: leerNumero(campos.envio),
    comision: leerNumero(campos.comision),
    otros: leerNumero(campos.otros),
  }
}

function validar(datos) {
  const numeros = [
    datos.precio,
    datos.costo,
    datos.envio,
    datos.comision,
    datos.otros,
  ]

  if (datos.nombre === '' || numeros.some(v => v === null)) {
    return {
      tipo: 'incompleto',
      mensaje: 'Completa todos los campos para ver el cálculo.',
    }
  }

  if (numeros.some(v => !Number.isFinite(v))) {
    return {
      tipo: 'error',
      mensaje: 'Revisa los números introducidos.',
    }
  }

  if (numeros.some(v => v < 0)) {
    return {
      tipo: 'error',
      mensaje: 'No se permiten valores negativos.',
    }
  }

  if (datos.precio <= 0) {
    return {
      tipo: 'error',
      mensaje: 'El precio de venta debe ser mayor que cero.',
    }
  }

  if (datos.comision >= 100) {
    return {
      tipo: 'error',
      mensaje: 'La comisión debe ser menor que 100%.',
    }
  }

  return { tipo: 'ok', mensaje: '' }
}

function calcular(datos) {
  const comisionDinero = datos.precio * datos.comision / 100
  const gastosFijos = datos.costo + datos.envio + datos.otros
  const costoTotal = gastosFijos + comisionDinero
  const ganancia = datos.precio - costoTotal
  const margen = ganancia / datos.precio * 100
  const precioEquilibrio = gastosFijos / (1 - datos.comision / 100)

  return {
    comisionDinero,
    costoTotal,
    ganancia,
    margen,
    precioEquilibrio,
  }
}

function formatearPesos(valor) {
  const redondeado = Math.round(valor)
  const texto = pesos.format(Math.abs(redondeado))
  return redondeado < 0 ? `-${texto}` : texto
}

function formatearPorcentaje(valor) {
  return `${porcentaje.format(valor)} %`
}

function mostrarAviso(revision) {
  aviso.hidden = revision.tipo === 'ok'
  aviso.textContent = revision.mensaje
  aviso.className = revision.tipo === 'error'
    ? 'aviso aviso-error'
    : 'aviso'
}

function mostrarResultados(datos, cuentas) {
  mensajeInicial.hidden = true
  bloqueResultados.hidden = false
  estado.hidden = false

  nombreResultado.textContent = datos.nombre

  salidas.comision.textContent = formatearPesos(cuentas.comisionDinero)
  salidas.costoTotal.textContent = formatearPesos(cuentas.costoTotal)
  salidas.ganancia.textContent = formatearPesos(cuentas.ganancia)
  salidas.margen.textContent = formatearPorcentaje(cuentas.margen)
  salidas.equilibrio.textContent = formatearPesos(cuentas.precioEquilibrio)

  panelResultados.classList.remove(
    'es-ganancia',
    'es-perdida',
    'es-equilibrio'
  )

  if (cuentas.ganancia > 0) {
    panelResultados.classList.add('es-ganancia')
    estado.textContent = 'Ganancia'
  } else if (cuentas.ganancia < 0) {
    panelResultados.classList.add('es-perdida')
    estado.textContent = 'Pérdida'
  } else {
    panelResultados.classList.add('es-equilibrio')
    estado.textContent = 'Equilibrio'
  }
}

function actualizar() {
  const datos = leerDatos()
  const revision = validar(datos)

  mostrarAviso(revision)

  if (revision.tipo !== 'ok') {
    calculoActual = null
    ocultarResultados(revision)
    actualizarBotones()
    return
  }

  calculoActual = {
    datos,
    cuentas: calcular(datos),
  }

  mostrarResultados(datos, calculoActual.cuentas)
  actualizarBotones()
}

function ocultarResultados(revision) {
  mensajeInicial.hidden = false
  mensajeInicial.textContent = revision.tipo === 'error'
    ? 'Corrige los datos para ver los resultados.'
    : 'Ingresa los datos de tu producto para calcular su rentabilidad.'

  bloqueResultados.hidden = true
  estado.hidden = true
  nombreResultado.textContent = ''

  for (const salida of Object.values(salidas)) {
    salida.textContent = '—'
  }

  panelResultados.classList.remove(
    'es-ganancia',
    'es-perdida',
    'es-equilibrio'
  )
}

function actualizarBotones() {
  const habilitado = calculoActual !== null
  botones.guardar.disabled = !habilitado
  botones.copiar.disabled = !habilitado
}

function limpiarFormulario() {
  formulario.reset()
  calculoActual = null
  actualizar()
  campos.nombre.focus()
}

async function copiarResultados() {
  if (!calculoActual) return

  const { datos, cuentas } = calculoActual

  const texto = [
    `Producto: ${datos.nombre}`,
    `Precio de venta: ${formatearPesos(datos.precio)}`,
    `Costo total: ${formatearPesos(cuentas.costoTotal)}`,
    `Comisión: ${formatearPesos(cuentas.comisionDinero)}`,
    `Ganancia neta: ${formatearPesos(cuentas.ganancia)}`,
    `Margen: ${formatearPorcentaje(cuentas.margen)}`,
    `Precio de equilibrio: ${formatearPesos(cuentas.precioEquilibrio)}`,
  ].join('\n')

  try {
    await navigator.clipboard.writeText(texto)
    aviso.hidden = false
    aviso.className = 'aviso'
    aviso.textContent = 'Resultados copiados correctamente.'
  } catch {
    aviso.hidden = false
    aviso.className = 'aviso aviso-error'
    aviso.textContent = 'No se pudo copiar. Comprueba los permisos del navegador.'
  }
}

function guardarCalculo() {
  if (!calculoActual) return

  const registro = {
    id: crypto.randomUUID(),
    ...JSON.parse(JSON.stringify(calculoActual)),
    fecha: new Date().toLocaleString('es-CL'),
  }

  historial.unshift(registro)

  if (historial.length > 30) {
    historial.pop()
  }

  mostrarHistorial()
  aviso.hidden = false
  aviso.className = 'aviso'
  aviso.textContent = 'Producto guardado en el historial.'
}

function mostrarHistorial() {
  listaHistorial.replaceChildren()

  if (historial.length === 0) {
    const mensaje = document.createElement('p')
    mensaje.className = 'mensaje-inicial'
    mensaje.textContent = 'Todavía no tienes cálculos guardados.'
    listaHistorial.append(mensaje)
    return
  }

  historial.forEach(registro => {
    const fila = document.createElement('article')
    fila.className = 'registro'

    const informacion = document.createElement('div')
    const nombre = document.createElement('strong')
    const fecha = document.createElement('small')
    const ganancia = document.createElement('small')

    nombre.textContent = registro.datos.nombre
    fecha.textContent = registro.fecha
    ganancia.textContent = `Ganancia: ${formatearPesos(registro.cuentas.ganancia)}`
    ganancia.className = registro.cuentas.ganancia >= 0
      ? 'registro-ganancia'
      : 'registro-perdida'

    informacion.append(nombre, fecha, ganancia)

    const acciones = document.createElement('div')
    acciones.className = 'registro-acciones'

    const recuperar = document.createElement('button')
    recuperar.type = 'button'
    recuperar.textContent = 'Ver'
    recuperar.setAttribute('aria-label', `Recuperar ${registro.datos.nombre}`)
    recuperar.addEventListener('click', () => recuperarCalculo(registro))

    const eliminar = document.createElement('button')
    eliminar.type = 'button'
    eliminar.textContent = 'Eliminar'
    eliminar.setAttribute('aria-label', `Eliminar ${registro.datos.nombre}`)
    eliminar.addEventListener('click', () => eliminarCalculo(registro.id))

    acciones.append(recuperar, eliminar)
    fila.append(informacion, acciones)
    listaHistorial.append(fila)
  })
}

function recuperarCalculo(registro) {
  for (const [clave, valor] of Object.entries(registro.datos)) {
    campos[clave].value = valor
  }

  actualizar()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function eliminarCalculo(id) {
  historial = historial.filter(registro => registro.id !== id)
  mostrarHistorial()
}

function borrarHistorial() {
  if (historial.length === 0) return

  const confirmar = window.confirm('¿Quieres borrar todo el historial?')

  if (confirmar) {
    historial = []
    mostrarHistorial()
  }
}

formulario.addEventListener('input', actualizar)
botones.limpiar.addEventListener('click', limpiarFormulario)
botones.copiar.addEventListener('click', copiarResultados)
botones.guardar.addEventListener('click', guardarCalculo)
botones.borrarHistorial.addEventListener('click', borrarHistorial)

actualizar()
mostrarHistorial()
