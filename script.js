"use strict";
const obtenerElemento = id => document.getElementById(id);
// Define los caracteres disponibles para cada tipo de contraseña
const gruposCaracteres = {
    mayusculas: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    minusculas: "abcdefghijklmnopqrstuvwxyz",
    numeros: "0123456789",
    simbolos: "!@#$%^&*()-_=+[]{};:,.<>?"
};

// Genera un número aleatorio seguro entre 0 y el máximo indicado
function numeroAleatorio(maximo) {
    const limite = Math.floor(256 / maximo) * maximo;
    const numero = new Uint8Array(1);
    do {
        crypto.getRandomValues(numero);
    } while (numero[0] >= limite);
    return numero[0] % maximo;
}

// Mezcla los caracteres para que su orden sea aleatorio
function mezclarCaracteres(caracteres) {
    for (let i = caracteres.length - 1; i > 0; i--) {
        const posicion = numeroAleatorio(i + 1);
        [caracteres[i], caracteres[posicion]] = [
            caracteres[posicion],
            caracteres[i]
        ];
    }
    return caracteres;
}

// Muestra un mensaje temporal en pantalla
function mostrarAviso(mensaje) {
    const aviso = obtenerElemento("toast");
    aviso.textContent = mensaje;
    aviso.classList.add("show");
    clearTimeout(aviso.temporizador);
    aviso.temporizador = setTimeout(() => {
        aviso.classList.remove("show");
    }, 2200);
}
// Actualiza la información sobre los tipos de caracteres seleccionados.
function actualizarInformacion() {
    // Guarda los grupos que el usuario ha marcado en las opciones.
    const gruposSeleccionados = Object.keys(gruposCaracteres).filter(
        grupo => obtenerElemento(grupo).checked
    );
    const cantidadCaracteres = gruposSeleccionados.reduce(
        (total, grupo) => total + gruposCaracteres[grupo].length,
        0
    );
    obtenerElemento("groupCount").textContent = gruposSeleccionados.length;
    obtenerElemento("poolCount").textContent = cantidadCaracteres;
}
// Crea una contraseña utilizando las opciones seleccionadas.
function generarContrasena() {
    const longitud = Number(obtenerElemento("length").value);
    const gruposSeleccionados = Object.keys(gruposCaracteres).filter(
        grupo => obtenerElemento(grupo).checked
    );
    if (gruposSeleccionados.length === 0) {
        mostrarAviso("Selecciona al menos un tipo de carácter");
        return;
    }
    if (gruposSeleccionados.length > longitud) {
        mostrarAviso("La longitud es demasiado corta para las opciones seleccionadas");
        return;
    }
    const caracteresDisponibles = gruposSeleccionados
        .map(grupo => gruposCaracteres[grupo])
        .join("");
    const caracteresContrasena = gruposSeleccionados.map(grupo => {
        const caracteresGrupo = gruposCaracteres[grupo];
        return caracteresGrupo[numeroAleatorio(caracteresGrupo.length)];
    });
    while (caracteresContrasena.length < longitud) {
        caracteresContrasena.push(
            caracteresDisponibles[
                numeroAleatorio(caracteresDisponibles.length)
            ]
        );
    }
    mezclarCaracteres(caracteresContrasena);
    const contrasena = caracteresContrasena.join("");
    obtenerElemento("password").value = contrasena;
    const bitsSeguridad = longitud * Math.log2(caracteresDisponibles.length);
    const porcentajeSeguridad = Math.min(100, (bitsSeguridad / 128) * 100);

    // Define el nivel de seguridad y el texto que se mostrará.
    let nivelSeguridad;
    let textoSeguridad;
    if (bitsSeguridad < 40) {
        nivelSeguridad = "low";
        textoSeguridad = "BAJA";
    } else if (bitsSeguridad < 60) {
        nivelSeguridad = "medium";
        textoSeguridad = "MODERADA";
    } else if (bitsSeguridad < 80) {
        nivelSeguridad = "high";
        textoSeguridad = "ALTA";
    } else if (bitsSeguridad < 100) {
        nivelSeguridad = "very-high";
        textoSeguridad = "MUY ALTA";
    } else {
        nivelSeguridad = "excellent";
        textoSeguridad = "EXCELENTE";
    }
    obtenerElemento("strengthText").textContent = textoSeguridad;
    obtenerElemento("strengthFill").style.width = `${porcentajeSeguridad}%`;
    obtenerElemento("strengthFill").className = `strength-fill ${nivelSeguridad}`;
    actualizarInformacion();
}

obtenerElemento("length").addEventListener("input", evento => {
    obtenerElemento("lengthValue").textContent = evento.target.value;
});
Object.keys(gruposCaracteres).forEach(grupo => {
    obtenerElemento(grupo).addEventListener("change", actualizarInformacion);
});
// Genera una nueva contraseña al pulsar el botón correspondiente.
obtenerElemento("generateBtn").addEventListener("click", generarContrasena);
// Copia la contraseña al portapapeles cuando se pulsa el botón de copiar.
obtenerElemento("copyBtn").addEventListener("click", async () => {
    const contrasena = obtenerElemento("password").value;
    try {
        await navigator.clipboard.writeText(contrasena);
        mostrarAviso("Contraseña copiada al portapapeles");
    } catch {
        mostrarAviso("No se ha podido copiar la contraseña");
    }
});
// Gestiona los botones de navegación de la página.
document.querySelectorAll(".nav-item").forEach(boton => {
    boton.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(elemento => {
            elemento.classList.remove("active");
        });
        boton.classList.add("active");
        const seccion = boton.dataset.section;
        const destino = document.getElementById(seccion);
        if (destino) {
            destino.scrollIntoView({ behavior: "smooth" });
        }
    });
});

// Caracteres que se utilizan para decorar el diseño
const caracteresDecorativos = "01アイウエオカキクケコサシスセソ";
// Genera una cadena aleatoria para el efecto decorativo del pie de pagina
obtenerElemento("matrixChars").textContent = Array.from(
    { length: 360 },
    () => caracteresDecorativos[
        numeroAleatorio(caracteresDecorativos.length)
    ]
).join("");
// Inicializa los contadores y genera una contraseña al cargar la página.
actualizarInformacion();
generarContrasena();
