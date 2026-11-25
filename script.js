// Una sola página: las secciones se muestran u ocultan según el #hash.
// Opciones, carrito y usuarios se guardan en localStorage.
const CLAVE_CARRITO = "carrito";
const CLAVE_OPCIONES = "opciones";
const CLAVE_PRENDA = "prenda";
const CLAVE_USUARIOS = "usuarios";
const CLAVE_SESION = "sesion";

function leer(clave, porDefecto) {
    try {
        const valor = localStorage.getItem(clave);
        return valor ? JSON.parse(valor) : porDefecto;
    } catch (e) {
        return porDefecto;
    }
}

function guardar(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch (e) { /* almacenamiento no disponible */ }
}

function borrar(clave) {
    try { localStorage.removeItem(clave); } catch (e) { /* nada */ }
}

/* ---------- Navegación entre secciones ---------- */
const VISTAS = ["inicio", "catalogo", "opciones", "carrito", "sesion"];
const TITULOS = {
    inicio: "Inicio",
    catalogo: "Catálogo",
    opciones: "Opciones",
    carrito: "Carrito",
    sesion: "Mi cuenta"
};

function irA(nombre) {
    if (location.hash === "#" + nombre) {
        mostrarVista();
    } else {
        location.hash = nombre;
    }
}

function mostrarVista() {
    let nombre = location.hash.replace("#", "");
    if (VISTAS.indexOf(nombre) === -1) nombre = "inicio";

    document.querySelectorAll(".vista").forEach(function (vista) {
        vista.classList.toggle("activa", vista.dataset.vista === nombre);
    });
    document.querySelectorAll("[data-nav]").forEach(function (enlace) {
        enlace.classList.toggle("activo", enlace.dataset.nav === nombre);
    });
    document.title = TITULOS[nombre] + " | Ropa de Alta Costura Personalizada";

    // Cierra el menú lateral (móvil) si está abierto
    try {
        const drawer = document.getElementById("navbarDrawer");
        if (drawer && drawer.open) drawer.close();
    } catch (e) { /* nada */ }

    if (nombre === "opciones") mostrarOpciones();
    if (nombre === "carrito") mostrarCarrito();
    if (nombre === "sesion") mostrarCuenta();
    window.scrollTo(0, 0);
}

/* ---------- Inicio: formulario de contacto ---------- */
const formContacto = document.getElementById("form-contacto");
if (formContacto) {
    const mensajeContacto = document.getElementById("mensaje-contacto");
    formContacto.addEventListener("submit", function (evento) {
        evento.preventDefault();
        mensajeContacto.textContent = "¡Mensaje enviado! Nuestro equipo se contactará contigo en las próximas 24 horas para asistencia.";
        formContacto.reset();
    });
}

/* ---------- Catálogo: elegir prenda y enviarla a Opciones ---------- */
document.querySelectorAll(".btn-agregar").forEach(function (boton) {
    boton.addEventListener("click", function () {
        const nombre = boton.closest(".prenda").querySelector("h3").textContent;
        guardar(CLAVE_PRENDA, nombre);
        irA("opciones");
    });
});

/* ---------- Opciones: personalización ---------- */
const CAMPOS_OBLIGATORIOS = ["talla", "color", "estampado", "modelo"];
const CAMPOS = CAMPOS_OBLIGATORIOS.concat(["accesorios", "diseno"]);
const mensajeOpciones = document.getElementById("mensaje-opciones");

function campoOpcion(campo) {
    return document.getElementById("op-" + campo);
}

function mostrarOpciones() {
    const prenda = leer(CLAVE_PRENDA, null);
    const etiqueta = document.getElementById("op-prenda");
    if (prenda) {
        etiqueta.textContent = prenda;
    } else {
        etiqueta.innerHTML = 'ninguna todavía. Elígela en el <a href="#catalogo">catálogo</a>.';
    }

    const guardadas = leer(CLAVE_OPCIONES, null);
    CAMPOS.forEach(function (campo) {
        const valor = guardadas && guardadas[campo] !== undefined ? guardadas[campo] : null;
        if (valor !== null) {
            campoOpcion(campo).value = valor;
        }
    });
    mensajeOpciones.textContent = "";
}

function leerFormularioOpciones() {
    const opciones = {};
    CAMPOS.forEach(function (campo) {
        opciones[campo] = campoOpcion(campo).value.trim();
    });
    return opciones;
}

function faltanDatos(opciones) {
    return CAMPOS_OBLIGATORIOS.some(function (campo) { return opciones[campo] === ""; });
}

document.getElementById("btn-guardar").addEventListener("click", function () {
    const opciones = leerFormularioOpciones();

    if (faltanDatos(opciones)) {
        alert("Elige talla, color, estampado y modelo antes de continuar.");
        return;
    }

    guardar(CLAVE_OPCIONES, opciones);
    mensajeOpciones.textContent = "Personalización guardada.";
});

document.getElementById("btn-agregar-carrito").addEventListener("click", function () {
    const prenda = leer(CLAVE_PRENDA, null);
    if (!prenda) {
        alert("Primero elige una prenda en el catálogo.");
        irA("catalogo");
        return;
    }

    const opciones = leerFormularioOpciones();
    if (faltanDatos(opciones)) {
        alert("Elige talla, color, estampado y modelo antes de agregar el vestido.");
        return;
    }

    const carrito = leer(CLAVE_CARRITO, []);
    carrito.push({
        nombre: prenda,
        talla: opciones.talla,
        color: opciones.color,
        estampado: opciones.estampado,
        modelo: opciones.modelo,
        accesorios: opciones.accesorios,
        diseno: opciones.diseno
    });
    guardar(CLAVE_CARRITO, carrito);

    // Igual que antes: las opciones se reinician para el siguiente vestido
    borrar(CLAVE_OPCIONES);
    borrar(CLAVE_PRENDA);
    CAMPOS.forEach(function (campo) {
        const el = campoOpcion(campo);
        if (el.tagName === "SELECT") {
            el.selectedIndex = 0;
        } else {
            el.value = "";
        }
    });
    document.getElementById("op-prenda").textContent = "";
    mensajeOpciones.textContent = "";
    mensajeOpciones.appendChild(document.createTextNode(prenda + " se agregó al carrito. "));
    const verCarrito = document.createElement("a");
    verCarrito.href = "#carrito";
    verCarrito.textContent = "Ver carrito";
    const otro = document.createElement("a");
    otro.href = "#catalogo";
    otro.textContent = "elegir otro vestido";
    mensajeOpciones.appendChild(verCarrito);
    mensajeOpciones.appendChild(document.createTextNode(" o "));
    mensajeOpciones.appendChild(otro);
    mensajeOpciones.appendChild(document.createTextNode("."));
});

/* ---------- Carrito: mostrar, quitar y poner la orden ---------- */
const listaCarrito = document.getElementById("lista-carrito");
const mensajePedido = document.getElementById("mensaje-pedido");

function mostrarCarrito() {
    const carrito = leer(CLAVE_CARRITO, []);
    listaCarrito.innerHTML = "";

    carrito.forEach(function (prenda, indice) {
        const item = document.createElement("li");

        const detalle = document.createElement("span");
        const titulo = document.createElement("strong");
        titulo.textContent = prenda.nombre;
        detalle.appendChild(titulo);
        detalle.appendChild(document.createElement("br"));

        let texto = "Talla: " + prenda.talla + " | Color: " + prenda.color +
            " | Estampado: " + prenda.estampado + " | Modelo: " + prenda.modelo;
        if (prenda.accesorios && prenda.accesorios !== "Ninguno") {
            texto += " | Accesorios: " + prenda.accesorios;
        }
        detalle.appendChild(document.createTextNode(texto));
        if (prenda.diseno) {
            detalle.appendChild(document.createElement("br"));
            detalle.appendChild(document.createTextNode("Diseño personalizado: " + prenda.diseno));
        }

        const quitar = document.createElement("button");
        quitar.className = "btn-quitar";
        quitar.textContent = "Quitar";
        quitar.addEventListener("click", function () {
            const actual = leer(CLAVE_CARRITO, []);
            actual.splice(indice, 1);
            guardar(CLAVE_CARRITO, actual);
            mostrarCarrito();
        });

        item.appendChild(detalle);
        item.appendChild(quitar);
        listaCarrito.appendChild(item);
    });
}

document.getElementById("btn-pedido").addEventListener("click", function () {
    if (leer(CLAVE_CARRITO, []).length === 0) {
        mensajePedido.textContent = "Tu carrito está vacío. Agrega un vestido primero.";
    } else {
        mensajePedido.textContent = "¡Pedido recibido! El servicio al cliente se contactará contigo en 48 horas laborales para cotizar detalles de la orden.";
        borrar(CLAVE_CARRITO);
        mostrarCarrito();
    }
});

/* ---------- Inicio de sesión y registro ---------- */
// Aviso: es un sistema de demostración que guarda los datos en el navegador.
// En un sitio real, la autenticación debe hacerse en un servidor.
function nuevaSal() {
    const bytes = new Uint8Array(8);
    if (window.crypto && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
}

async function cifrarClave(clave, sal) {
    const datos = sal + clave;
    if (window.crypto && crypto.subtle) {
        const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(datos));
        return Array.from(new Uint8Array(buffer)).map(function (b) {
            return b.toString(16).padStart(2, "0");
        }).join("");
    }
    let h = 5381;
    for (let i = 0; i < datos.length; i++) h = ((h << 5) + h + datos.charCodeAt(i)) | 0;
    return "d" + h;
}

function usuarioActual() {
    const correo = leer(CLAVE_SESION, null);
    if (!correo) return null;
    return leer(CLAVE_USUARIOS, []).find(function (u) { return u.correo === correo; }) || null;
}

function mostrarCuenta() {
    const usuario = usuarioActual();
    document.getElementById("panel-cuenta").hidden = !usuario;
    document.getElementById("panel-acceso").hidden = !!usuario;

    const enlace = document.getElementById("nav-sesion");
    if (usuario) {
        document.getElementById("cuenta-nombre").textContent = usuario.nombre;
        document.getElementById("cuenta-correo").textContent = usuario.correo;
        enlace.textContent = "Mi cuenta";
    } else {
        enlace.textContent = "Iniciar sesión";
    }
}

function cambiarModo(modo) {
    document.getElementById("form-login").hidden = modo !== "login";
    document.getElementById("form-registro").hidden = modo !== "registro";
    document.querySelectorAll(".pestana").forEach(function (p) {
        p.classList.toggle("activa", p.dataset.modo === modo);
    });
}

document.querySelectorAll(".pestana").forEach(function (pestana) {
    pestana.addEventListener("click", function () { cambiarModo(pestana.dataset.modo); });
});

document.getElementById("form-registro").addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const mensaje = document.getElementById("mensaje-registro");
    const nombre = document.getElementById("reg-nombre").value.trim();
    const correo = document.getElementById("reg-correo").value.trim().toLowerCase();
    const clave = document.getElementById("reg-clave").value;
    const clave2 = document.getElementById("reg-clave2").value;

    if (nombre === "" || correo === "" || clave === "") {
        mensaje.textContent = "Completa todos los campos.";
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        mensaje.textContent = "Escribe un correo electrónico válido.";
        return;
    }
    if (clave.length < 6) {
        mensaje.textContent = "La contraseña debe tener al menos 6 caracteres.";
        return;
    }
    if (clave !== clave2) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        return;
    }

    const usuarios = leer(CLAVE_USUARIOS, []);
    if (usuarios.some(function (u) { return u.correo === correo; })) {
        mensaje.textContent = "Ese correo ya está registrado. Inicia sesión.";
        return;
    }

    const sal = nuevaSal();
    usuarios.push({ nombre: nombre, correo: correo, sal: sal, clave: await cifrarClave(clave, sal) });
    guardar(CLAVE_USUARIOS, usuarios);
    guardar(CLAVE_SESION, correo);

    evento.target.reset();
    mensaje.textContent = "";
    mostrarCuenta();
});

document.getElementById("form-login").addEventListener("submit", async function (evento) {
    evento.preventDefault();
    const mensaje = document.getElementById("mensaje-login");
    const correo = document.getElementById("login-correo").value.trim().toLowerCase();
    const clave = document.getElementById("login-clave").value;

    const usuario = leer(CLAVE_USUARIOS, []).find(function (u) { return u.correo === correo; });
    if (!usuario || (await cifrarClave(clave, usuario.sal)) !== usuario.clave) {
        mensaje.textContent = "Correo o contraseña incorrectos.";
        return;
    }

    guardar(CLAVE_SESION, correo);
    evento.target.reset();
    mensaje.textContent = "";
    mostrarCuenta();
});

document.getElementById("btn-logout").addEventListener("click", function () {
    borrar(CLAVE_SESION);
    cambiarModo("login");
    mostrarCuenta();
});

/* ---------- Arranque ---------- */
window.addEventListener("hashchange", mostrarVista);
mostrarCuenta();
mostrarVista();
