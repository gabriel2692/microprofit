import './style.css'

// Cada cálculo ocurre en el navegador. No hay localStorage ni peticiones de red.

const formulario = document.querySelector('#calculadora')
const aviso = document.querySelector('#aviso')
const panelResultados = document.querySelector('.resultados')
const bloqueResultados = document.querySelector('#bloque-resultados')
const mensajeInicial = document.querySelector('#mensaje-inicial')
const nombreResultado = document.querySelector('#nombre-resultado')
const estado = document.querySelector('#estado')

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
  const numeros = [datos.precio, datos.costo, datos.envio, datos.comision, datos.otros]

  if (datos.nombre === '' || numeros.some((valor) => valor === null)) {
    return {
      tipo: 'incompleto',
      mensaje: 'Completa todos los campos para ver el cálculo.',
    }
  }

  if (numeros.some((valor) => !Number.isFinite(valor))) {
    return {
      tipo: 'error',
      mensaje: 'Revisa los números: hay un valor que no se puede leer.',
    }
  }

  if (numeros.some((valor) => valor < 0)) {
    return {
      tipo: 'error',
      mensaje: 'Los montos y la comisión no pueden ser negativos.',
    }
  }

  if (datos.precio === 0) {
    return {
      tipo: 'error',
      mensaje:
        'El precio de venta debe ser mayor que cero. Si es cero, el margen no se puede calcular.',
    }
  }

  if (datos.comision >= 100) {
    return {
      tipo: 'error',
      mensaje:
        'La comisión debe ser menor que 100%. Con 100% o más no existe un precio de equilibrio.',
    }
  }

  return { tipo: 'ok', mensaje: '' }
}

function calcular(datos) {
  const comisionDinero = (datos.precio * datos.comision) / 100
  const gastosFijos = datos.costo + datos.envio + datos.otros
  const costoTotal = gastosFijos + comisionDinero
  const ganancia = datos.precio - costoTotal
  const margen = (ganancia / datos.precio) * 100
  const precioEquilibrio = gastosFijos / (1 - datos.comision / 100)

  return { comisionDinero, costoTotal, ganancia, margen, precioEquilibrio }
}

function formatearPesos(valor) {
  const redondeado = Math.round(valor)
  const texto = pesos.format(Math.abs(redondeado))
  return redondeado < 0 ? `-${texto}` : texto
}

function formatearPorcentaje(valor) {
  const redondeado = Math.round(valor * 10) / 10
  const visible = redondeado === 0 ? 0 : redondeado
  return `${porcentaje.format(visible)} %`
}

function mostrarAviso(revision) {
  const hayAviso = revision.tipo !== 'ok'
  aviso.hidden = !hayAviso
  aviso.textContent = revision.mensaje
  aviso.className = revision.tipo === 'error' ? 'aviso aviso-error' : 'aviso'
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

  const gananciaVisible = Math.round(cuentas.ganancia)
  panelResultados.classList.remove('es-ganancia', 'es-perdida', 'es-equilibrio')

  if (gananciaVisible > 0) {
    panelResultados.classList.add('es-ganancia')
    estado.textContent = 'Ganancia'
  } else if (gananciaVisible < 0) {
    panelResultados.classList.add('es-perdida')
    estado.textContent = 'Pérdida'
  } else {
    panelResultados.classList.add('es-equilibrio')
    estado.textContent = 'Equilibrio'
  }
}

function ocultarResultados(revision) {
  mensajeInicial.hidden = false
  mensajeInicial.textContent =
    revision.tipo === 'error'
      ? 'Corrige los datos del formulario para ver el resultado.'
      : 'Ingresa el nombre y los costos. Los números se actualizarán solos cada vez que cambies un valor.'
  bloqueResultados.hidden = true
  estado.hidden = true
  nombreResultado.textContent = ''
  for (const salida of Object.values(salidas)) {
    salida.textContent = '—'
  }
  panelResultados.classList.remove('es-ganancia', 'es-perdida', 'es-equilibrio')
}

function actualizar() {
  const datos = leerDatos()
  const revision = validar(datos)
  mostrarAviso(revision)

  if (revision.tipo !== 'ok') {
    ocultarResultados(revision)
    return
  }

  mostrarResultados(datos, calcular(datos))
}

formulario.addEventListener('input', actualizar)
actualizar()
