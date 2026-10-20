
"use strict";

// Busca un elemento HTML utilizando su identificador.
const obtenerElemento = id => document.getElementById(id);

// Define los caracteres disponibles para cada grupo.
const gruposCaracteres = {
    mayusculas: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    minusculas: "abcdefghijklmnopqrstuvwxyz",
    numeros: "0123456789",
    simbolos: "!@#$%^&*()-_=+[]{};:,.<>?"
};

// Genera un número aleatorio seguro entre cero y el máximo indicado.
function numeroAleatorio(maximo) {
    if (!Number.isInteger(maximo) || maximo < 1 || maximo > 256) {
        throw new RangeError("El máximo debe estar entre 1 y 256.");
    }

    const limite = Math.floor(256 / maximo) * maximo;
    const numero = new Uint8Array(1);

    do {
        crypto.getRandomValues(numero);
    } while (numero[0] >= limite);

    return numero[0] % maximo;
}

// Mezcla los caracteres para que su orden sea aleatorio.
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

// Muestra un aviso temporal en la pantalla.
function mostrarAviso(mensaje) {
    const aviso = obtenerElemento("toast");

    aviso.textContent = mensaje;
    aviso.classList.add("show");

    clearTimeout(aviso.temporizador);

    aviso.temporizador = setTimeout(() => {
        aviso.classList.remove("show");
    }, 2200);
}

// Devuelve los grupos de caracteres seleccionados.
function obtenerGruposSeleccionados() {
    return Object.keys(gruposCaracteres).filter(grupo => {
        return obtenerElemento(grupo).checked;
    });
}

// Actualiza los contadores de grupos y caracteres disponibles.
function actualizarInformacion() {
    const gruposSeleccionados = obtenerGruposSeleccionados();

    const cantidadCaracteres = gruposSeleccionados.reduce(
        (total, grupo) => total + gruposCaracteres[grupo].length,
        0
    );

    obtenerElemento("groupCount").textContent =
        gruposSeleccionados.length;

    obtenerElemento("poolCount").textContent =
        cantidadCaracteres;
}

// Actualiza visualmente el control de longitud.
function actualizarLongitud() {
    const controlLongitud = obtenerElemento("length");
    const longitud = Number(controlLongitud.value);
    const minimo = Number(controlLongitud.min);
    const maximo = Number(controlLongitud.max);

    obtenerElemento("lengthValue").textContent = longitud;

    const porcentaje = ((longitud - minimo) / (maximo - minimo)) * 100;

    controlLongitud.style.background =
        `linear-gradient(90deg, #00ff91 ${porcentaje}%, #1e304c ${porcentaje}%)`;
}

// Genera una contraseña con las opciones seleccionadas.
function generarContrasena() {
    const longitud = Number(obtenerElemento("length").value);
    const gruposSeleccionados = obtenerGruposSeleccionados();

    if (gruposSeleccionados.length === 0) {
        mostrarAviso("Selecciona al menos un tipo de carácter.");
        return;
    }

    if (gruposSeleccionados.length > longitud) {
        mostrarAviso(
            "La longitud es demasiado corta para las opciones seleccionadas."
        );
        return;
    }

    // Reúne todos los caracteres que se pueden utilizar.
    const caracteresDisponibles = gruposSeleccionados
        .map(grupo => gruposCaracteres[grupo])
        .join("");

    // Garantiza al menos un carácter de cada grupo seleccionado.
    const caracteresContrasena = gruposSeleccionados.map(grupo => {
        const caracteresGrupo = gruposCaracteres[grupo];

        return caracteresGrupo[
            numeroAleatorio(caracteresGrupo.length)
        ];
    });

    // Completa la contraseña hasta alcanzar la longitud solicitada.
    while (caracteresContrasena.length < longitud) {
        caracteresContrasena.push(
            caracteresDisponibles[
                numeroAleatorio(caracteresDisponibles.length)
            ]
        );
    }

    // Mezcla los caracteres y construye la contraseña definitiva.
    mezclarCaracteres(caracteresContrasena);

    const contrasena = caracteresContrasena.join("");

    obtenerElemento("password").value = contrasena;

    // Calcula una estimación de la entropía en bits.
    const bitsSeguridad =
        longitud * Math.log2(caracteresDisponibles.length);

    const porcentajeSeguridad = Math.min(
        100,
        (bitsSeguridad / 128) * 100
    );

    // Clasifica el nivel estimado de seguridad.
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

    // Actualiza el texto y la barra de seguridad.
    obtenerElemento("strengthText").textContent = textoSeguridad;

    const barra = obtenerElemento("strengthFill");

    barra.style.width = `${porcentajeSeguridad}%`;
    barra.className = `strength-fill ${nivelSeguridad}`;

    // Muestra la entropía estimada y la longitud de la contraseña.
    obtenerElemento("entropy").textContent =
        `Entropía estimada: ${Math.floor(bitsSeguridad)} bits | ` +
        `${longitud} caracteres`;

    // Actualiza los contadores de la interfaz.
    actualizarInformacion();
}

// Actualiza la longitud cuando se mueve el control deslizante.
obtenerElemento("length").addEventListener("input", () => {
    actualizarLongitud();
});

// Actualiza los contadores al cambiar las opciones de caracteres.
Object.keys(gruposCaracteres).forEach(grupo => {
    obtenerElemento(grupo).addEventListener(
        "change",
        actualizarInformacion
    );
});

// Genera una contraseña nueva al pulsar el botón.
obtenerElemento("generateBtn").addEventListener(
    "click",
    generarContrasena
);

// Copia la contraseña generada al portapapeles.
obtenerElemento("copyBtn").addEventListener("click", async () => {
    const contrasena = obtenerElemento("password").value;

    if (!contrasena) {
        mostrarAviso("Primero genera una contraseña.");
        return;
    }

    try {
        await navigator.clipboard.writeText(contrasena);
        mostrarAviso("Contraseña copiada al portapapeles.");
    } catch {
        // Alternativa para navegadores sin acceso al portapapeles.
        const campo = obtenerElemento("password");

        campo.focus();
        campo.select();

        const copiado = document.execCommand("copy");

        mostrarAviso(
            copiado
                ? "Contraseña copiada al portapapeles."
                : "No se ha podido copiar la contraseña."
        );
    }
});

// Gestiona la navegación entre las secciones de la página.
document.querySelectorAll(".nav-item").forEach(boton => {
    boton.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(elemento => {
            elemento.classList.remove("active");
        });

        boton.classList.add("active");

        const destino = obtenerElemento(boton.dataset.section);

        if (destino) {
            destino.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});

// Caracteres utilizados para decorar la terminal.
const caracteresDecorativos = "01アイウエオカキクケコサシスセソ";

// Genera los caracteres decorativos de la terminal.
obtenerElemento("matrixChars").textContent = Array.from(
    { length: 360 },
    () => caracteresDecorativos[
        numeroAleatorio(caracteresDecorativos.length)
    ]
).join(" ");

// Inicializa la interfaz y genera la primera contraseña.
actualizarLongitud();
actualizarInformacion();
generarContrasena();
