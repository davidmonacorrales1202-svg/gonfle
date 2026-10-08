// Prototipo Gonflé: enrutador por hash, catálogo, ficha de producto y lista de cotización que termina en WhatsApp.

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $("#app");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const linea = (id) => LINEAS.find((l) => l.id === id);
const prod = (id) => PRODUCTOS.find((p) => p.id === id);
const ico = (n) => `<svg aria-hidden="true"><use href="#i-${n}"/></svg>`;

// ───────── Lista de cotización (se guarda en el navegador)
const cot = {
  items: (() => { try { return JSON.parse(localStorage.getItem("gonfle_cot")) || []; } catch { return []; } })(),
  guardar() { try { localStorage.setItem("gonfle_cot", JSON.stringify(this.items)); } catch {} pintarContador(); },
  agregar(id, cant = "") {
    const it = this.items.find((i) => i.id === id);
    if (it) { if (cant) it.cant = cant; } else this.items.push({ id, cant });
    this.guardar();
    medir("agregar_a_cotizacion", { producto: id });
    toast("Agregado a tu cotización");
  },
  quitar(id) { this.items = this.items.filter((i) => i.id !== id); this.guardar(); },
};

function pintarContador() {
  ["#cotN", "#cotN2"].forEach((s) => { const el = $(s); el.textContent = cot.items.length; el.dataset.n = cot.items.length; });
}
let toastT;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("ver");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("ver"), 2200);
}

// ───────── Medición: eventos listos para Google Analytics 4 (se registran cuando se instale gtag)
function medir(evento, datos = {}) {
  (window.dataLayer = window.dataLayer || []).push({ event: evento, ...datos });
  if (typeof window.gtag === "function") window.gtag("event", evento, datos);
}

// ───────── WhatsApp
const wa = (texto) => `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(texto)}`;
const waGeneral = () => wa("Hola Gonflé, quiero cotizar productos para mi empresa.");
const waProducto = (p, cant) => wa(`Hola Gonflé, quiero cotizar: ${p.nombre}${cant ? ` (${cant} unidades)` : ""}.`);

function mensajeCotizacion(d) {
  const lineas = cot.items.map((i) => { const p = prod(i.id); return p ? `• ${p.nombre}${i.cant ? `: ${i.cant} und.` : ""}` : ""; }).filter(Boolean);
  const datos = [
    d.nombre && `Nombre: ${d.nombre}`,
    d.empresa && `Empresa: ${d.empresa}`,
    d.ciudad && `Ciudad: ${d.ciudad}`,
    d.fecha && `Fecha en que lo necesito: ${d.fecha}`,
    d.mensaje && `Detalle: ${d.mensaje}`,
  ].filter(Boolean);
  const bloques = ["Hola Gonflé, quiero solicitar una cotización."];
  if (lineas.length) bloques.push(["Productos:", ...lineas].join("\n"));
  if (datos.length) bloques.push(datos.join("\n"));
  return bloques.join("\n\n");
}

// ───────── Piezas reutilizables
function imagen(p, clase = "", lazy = true) {
  if (p.sinFoto) return `<div class="prod-pend">${ico("foto")}<span>Foto real pendiente</span></div>`;
  const tag = p.ia ? "Imagen ilustrativa (IA)" : p.ref ? "Imagen de referencia" : "";
  return `<img class="${p.cubre ? "cubre" : ""} ${clase}" src="${IMG}${p.img}" alt="${esc(p.nombre)}" ${lazy ? `loading="lazy" decoding="async"` : ""}>${tag ? `<span class="ref">${tag}</span>` : ""}`;
}

function tarjeta(p) {
  const l = linea(p.linea);
  const badge = p.eco ? `<span class="badge eco">Línea ecológica</span>` : p.proyecto ? `<span class="badge pro">A la medida</span>` : "";
  const meta = p.specs["Material"] || p.specs["Tipo"] || p.specs["Producción"] || p.specs["Prendas"] || p.specs["Uso"] || "";
  return `<article class="prod rev">
    <a class="prod-img" href="#/producto/${p.id}" aria-label="Ver ${esc(p.nombre)}">${imagen(p)}${badge}</a>
    <div class="prod-cuerpo">
      <span class="prod-linea">${esc(l.corto)}</span>
      <h3><a href="#/producto/${p.id}">${esc(p.nombre)}</a></h3>
      <p class="prod-meta">${esc(meta)}</p>
      <div class="prod-acc">
        <a class="btn btn-linea btn-s" href="#/producto/${p.id}">Ver ficha</a>
        <button class="btn btn-rojo btn-s" data-add="${p.id}">Cotizar</button>
      </div>
    </div>
  </article>`;
}

const bloquePasos = () => `
  <div class="pasos">
    <div class="paso rev"><h3>Cuéntanos qué necesitas</h3><p>Producto, cantidad aproximada y fecha. Por WhatsApp o con el formulario, en dos minutos.</p></div>
    <div class="paso rev"><h3>Recibe tu cotización</h3><p>Una persona de Gonflé te asesora y te envía la propuesta con precio según cantidad y marcación.</p></div>
    <div class="paso rev"><h3>Aprobamos el arte</h3><p>Montamos tu logo sobre el producto y lo validas antes de producir.</p></div>
    <div class="paso rev"><h3>Producimos y entregamos</h3><p>Con el anticipo inicia la producción. Coordinamos la entrega en la fecha acordada.</p></div>
  </div>
  <div class="condiciones rev">
    <div class="cond"><b>8 a 15 días hábiles</b><span>Producción de inflables</span></div>
    <div class="cond"><b>50 % de anticipo</b><span>Para iniciar producción</span></div>
    <div class="cond"><b>10 días hábiles</b><span>Validez de la cotización</span></div>
    <div class="cond"><b>Arte editable</b><span>Logo en Adobe Illustrator</span></div>
  </div>`;

const bloqueFaq = () => `<div class="faq">${FAQS.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>`;

const bloqueCta = () => `
  <div class="cta-final rev">
    <div>
      <h2>¿Tienes una fecha encima? Empecemos hoy.</h2>
      <p>Cuéntanos qué necesitas y una persona de Gonflé te responde con una propuesta a la medida.</p>
    </div>
    <div class="hero-ctas">
      <a class="btn btn-claro" href="#/cotizar">Solicitar cotización</a>
      <a class="btn btn-fantasma" href="${waGeneral()}" target="_blank" rel="noopener">${ico("wa")}Escribir por WhatsApp</a>
    </div>
  </div>`;

// ───────── Vistas
function vInicio() {
  const destacados = PRODUCTOS.filter((p) => p.destacado).slice(0, 8);
  return `
  <section class="hero">
    <div class="wrap">
      <div>
        <span class="eyebrow">Publicidad para empresas · Medellín</span>
        <h1>Hacemos que tu marca <em>se vea, se toque y se recuerde.</em></h1>
        <p class="lead">Diseñamos y producimos inflables publicitarios, material POP, merchandising y dotaciones personalizadas. Tú nos cuentas la idea; nosotros te acompañamos hasta la entrega.</p>
        <div class="hero-ctas">
          <a class="btn btn-wa" href="${waGeneral()}" target="_blank" rel="noopener">${ico("wa")}Cotizar por WhatsApp</a>
          <a class="btn btn-linea" href="#/catalogo">Ver catálogo ${ico("flecha")}</a>
        </div>
        <div class="hero-datos">
          <div><b>Hasta 14 m</b><span>de alto en inflables</span></div>
          <div><b>8 a 15 días</b><span>hábiles de producción</span></div>
          <div><b>100 %</b><span>personalizado</span></div>
        </div>
      </div>
      <div class="hero-arte">
        <div class="hero-blob"><img src="${IMG}hero-pantera.webp" alt="Inflable publicitario gigante con forma de pantera"><span class="ref">Imagen de referencia</span></div>
        <div class="hero-tag"><b>Inflables a la medida</b>La forma que imagines, con el arte de tu marca.</div>
        <div class="hero-tag hero-tag2"><b>Todo con tu logo</b>No vendemos producto genérico.</div>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="sec-head"><span class="eyebrow">Empieza por aquí</span><h2>¿Qué necesitas resolver?</h2><p>Elige la situación y te mostramos lo que suele funcionar.</p></div>
      <div class="necesidades">
        ${NECESIDADES.map((n) => `<a class="nec rev" href="#/catalogo/${n.f}"><span class="nec-ico">${ico(n.ico)}</span><b>${esc(n.t)}</b><span>${esc(n.s)}</span></a>`).join("")}
      </div>
    </div>
  </section>

  <section class="sec sec-gris">
    <div class="wrap">
      <div class="sec-head"><span class="eyebrow">Líneas de negocio</span><h2>Un solo aliado para toda la visibilidad de tu marca</h2><p>Puedes pedir una sola línea o combinarlas en un mismo proyecto.</p></div>
      <div class="lineas">
        ${LINEAS.map((l, i) => `<a class="linea rev ${i < 2 ? "grande" : ""}" href="#/catalogo/${l.id}">
          <div class="linea-img"><img class="${l.cubre ? "cubre" : ""}" src="${IMG}${l.img}" alt="${esc(l.nombre)}">${l.nuevo ? `<span class="chip-l">Nuevo</span>` : ""}</div>
          <div class="linea-txt"><h3>${esc(l.nombre)}</h3><p>${esc(l.desc)}</p><span class="mas">Ver productos ${ico("flecha")}</span></div>
        </a>`).join("")}
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="sec-head"><span class="eyebrow">Más pedidos</span><h2>Productos destacados</h2><p>Agrega los que te interesen a tu cotización y envíala en un solo mensaje.</p></div>
      <div class="grid-prod">${destacados.map(tarjeta).join("")}</div>
      <p style="margin-top:32px;text-align:center"><a class="btn btn-linea" href="#/catalogo">Ver todo el catálogo ${ico("flecha")}</a></p>
    </div>
  </section>

  <section class="sec sec-gris" id="proceso">
    <div class="wrap">
      <div class="sec-head"><span class="eyebrow">Cómo trabajamos</span><h2>De la idea a la entrega, con una persona que te atiende</h2></div>
      ${bloquePasos()}
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="temporada rev">
        <div class="temporada-txt">
          <span class="eyebrow">Temporada de fin de año</span>
          <h2>Cierra el año con un solo proveedor</h2>
          <p>Regalos corporativos, catering para tus eventos y el material de marca, coordinados en un mismo pedido.</p>
          <div class="temporada-lista"><span>Cajas de Navidad</span><span>Kits para colaboradores</span><span>Brunch y refrigerios</span><span>Semana de la Salud</span><span>Merchandising</span></div>
          <a class="btn btn-claro" href="#/catalogo/regalos">Ver opciones ${ico("flecha")}</a>
        </div>
        <div class="temporada-img">
          <figure><img src="${IMG}ia-regalos.webp" alt="Caja de regalo corporativo de Navidad"><span class="ref">Imagen ilustrativa (IA)</span></figure>
          <figure><img src="${IMG}ia-catering.webp" alt="Catering empresarial"><span class="ref">IA</span></figure>
          <figure><img src="${IMG}ia-bienestar.webp" alt="Kit de bienestar"><span class="ref">IA</span></figure>
        </div>
      </div>
    </div>
  </section>

  <section class="sec sec-gris">
    <div class="wrap">
      <div class="sec-head"><span class="eyebrow">Por qué Gonflé</span><h2>Sentimos tu marca como si fuera nuestra</h2></div>
      <div class="razones">
        <div class="razon rev"><span class="nec-ico">${ico("megafono")}</span><h3>Todo va personalizado</h3><p>Cada pedido se fabrica o se marca con la identidad de tu empresa. No manejamos producto genérico.</p></div>
        <div class="razon rev"><span class="nec-ico">${ico("estrella")}</span><h3>Atención de persona a persona</h3><p>Te asesora alguien que entiende tu necesidad, te acompaña en el arte y responde por la entrega.</p></div>
        <div class="razon rev"><span class="nec-ico">${ico("regalo")}</span><h3>Un proveedor, varias soluciones</h3><p>Inflable, material POP, merchandising y textil en una sola cotización y con una sola línea gráfica.</p></div>
      </div>
      <div style="margin-top:56px">
        <div class="sec-head" style="margin-bottom:22px"><h2 style="font-size:1.35rem">Marcas que han confiado en Gonflé</h2></div>
        <div class="logos">${Array.from({ length: 6 }, (_, i) => `<div class="logo-ph">Logo de cliente ${i + 1}</div>`).join("")}</div>
        <p class="nota-ph">Espacio reservado: publicar solo logos y testimonios de clientes reales que lo autoricen por escrito.</p>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">
      <div class="sec-head centro"><span class="eyebrow">Preguntas frecuentes</span><h2>Lo que nos preguntan antes de cotizar</h2></div>
      ${bloqueFaq()}
    </div>
  </section>

  <section class="wrap">${bloqueCta()}</section>`;
}

function vCatalogo(filtro = "todos") {
  const l = linea(filtro);
  return `
  <section class="pag-head">
    <div class="wrap">
      <p class="migas"><a href="#/">Inicio</a> / ${l ? `<a href="#/catalogo">Catálogo</a> / ${esc(l.corto)}` : "Catálogo"}</p>
      <h1>${l ? esc(l.nombre) : "Catálogo de productos"}</h1>
      <p>${l ? esc(l.desc) : "Explora por línea, agrega lo que te interese y envía una sola solicitud de cotización."}</p>
    </div>
  </section>
  <section class="wrap">
    <div class="filtros" role="navigation" aria-label="Filtrar por línea">
      <a class="filtro ${!l ? "activo" : ""}" href="#/catalogo">Todos</a>
      ${LINEAS.map((x) => `<a class="filtro ${l && l.id === x.id ? "activo" : ""}" href="#/catalogo/${x.id}">${esc(x.corto)}</a>`).join("")}
      <label class="buscar">${ico("lupa")}<input id="q" type="search" placeholder="Buscar producto" aria-label="Buscar producto"></label>
    </div>
    <div class="grid-prod" id="grid"></div>
  </section>
  <section class="wrap" style="margin-top:72px">${bloqueCta()}</section>`;
}

function pintarGrid(filtro, q = "") {
  const l = linea(filtro);
  const n = q.trim().toLowerCase();
  const lista = PRODUCTOS.filter((p) => (!l || p.linea === l.id) && (!n || (p.nombre + " " + p.desc + " " + linea(p.linea).nombre).toLowerCase().includes(n)));
  const intro = l && !n ? `<div class="linea-intro"><span>${esc(l.intro)}</span><a class="btn btn-wa btn-s" href="${wa(`Hola Gonflé, quiero cotizar ${l.nombre.toLowerCase()}.`)}" target="_blank" rel="noopener">${ico("wa")}Hablar con un asesor</a></div>` : "";
  $("#grid").innerHTML = intro + (lista.length ? lista.map(tarjeta).join("") : `<p class="vacio">No encontramos "${esc(q)}". Escríbenos por WhatsApp: si existe, lo conseguimos o lo fabricamos.</p>`);
  revelar();
}

function vProducto(id) {
  const p = prod(id);
  if (!p) return v404();
  const l = linea(p.linea);
  const rel = PRODUCTOS.filter((x) => x.linea === p.linea && x.id !== p.id).slice(0, 4);
  const aviso = p.ia ? "Imagen ilustrativa generada con IA. El producto final se define en la cotización."
    : p.sinFoto ? "Este producto aún no tiene fotografía. Pídenos muestras o fotos de trabajos anteriores por WhatsApp."
    : p.ref ? "Imagen de referencia del catálogo. Las marcas que aparecen son ejemplos de marcación y pertenecen a sus titulares." : "";
  return `
  <section class="wrap">
    <div class="ficha">
      <div class="ficha-img">${imagen(p, "", false)}</div>
      <div>
        <p class="migas"><a href="#/">Inicio</a> / <a href="#/catalogo/${l.id}">${esc(l.corto)}</a></p>
        <span class="prod-linea">${esc(l.nombre)}</span>
        <h1>${esc(p.nombre)}</h1>
        <p class="desc">${esc(p.desc)}</p>
        <dl class="specs">
          ${Object.entries(p.specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v === "Por confirmar" ? `<span class="ph-claro">Por confirmar</span>` : esc(v)}</dd></div>`).join("")}
          <div><dt>Precio</dt><dd>Según cantidad y marcación. Se envía en la cotización.</dd></div>
        </dl>
        <div class="cant">
          <label class="campo" style="width:190px">${p.proyecto ? "Medida o tamaño aproximado" : "Cantidad aproximada"}
            <input id="cant" ${p.proyecto ? `type="text" placeholder="Ej.: 4 m de alto"` : `type="number" min="1" inputmode="numeric" placeholder="Ej.: 500"`}>
          </label>
        </div>
        <div class="ficha-acc">
          <button class="btn btn-rojo" data-add="${p.id}" data-cant="#cant">Agregar a mi cotización</button>
          <a class="btn btn-wa" id="waProd" href="${waProducto(p)}" target="_blank" rel="noopener">${ico("wa")}Preguntar por WhatsApp</a>
        </div>
        <div class="garantias"><ul>
          <li>${ico("check")}Marcado con tu logo e identidad de marca</li>
          <li>${ico("check")}Validas el arte antes de producir</li>
          <li>${ico("check")}Te atiende una persona, no un formulario</li>
        </ul></div>
        ${aviso ? `<p class="aviso-ref">${aviso}</p>` : ""}
      </div>
    </div>
  </section>
  ${rel.length ? `<section class="sec"><div class="wrap"><div class="sec-head"><h2 style="font-size:1.5rem">También en ${esc(l.nombre.toLowerCase())}</h2></div><div class="grid-prod">${rel.map(tarjeta).join("")}</div></div></section>` : ""}`;
}

function vCotizar() {
  return `
  <section class="pag-head"><div class="wrap">
    <p class="migas"><a href="#/">Inicio</a> / Cotización</p>
    <h1>Solicita tu cotización</h1>
    <p>Revisa tu lista, completa tus datos y envíala por WhatsApp. Te responde una persona de Gonflé.</p>
  </div></section>
  <section class="wrap"><div class="cot">
    <div>
      <h2 style="font-size:1.2rem;margin-bottom:14px">Tu lista</h2>
      <div class="cot-lista" id="cotLista"></div>
      <p style="margin-top:16px"><a class="btn btn-linea btn-s" href="#/catalogo">Agregar más productos</a></p>
    </div>
    <form class="form" id="formCot" novalidate>
      <h2>Tus datos</h2>
      <div class="form-2">
        <label class="campo">Nombre<input name="nombre" autocomplete="name" required></label>
        <label class="campo">Empresa<input name="empresa" autocomplete="organization" required></label>
      </div>
      <div class="form-2">
        <label class="campo">Ciudad<input name="ciudad" autocomplete="address-level2"></label>
        <label class="campo">¿Para cuándo lo necesitas?<input name="fecha" type="date"></label>
      </div>
      <label class="campo">Cuéntanos más <small>(opcional)</small><textarea name="mensaje" rows="3" placeholder="Evento, colores, técnica de marcación, presupuesto..."></textarea></label>
      <label class="check"><input type="checkbox" name="acepta" required><span>Autorizo el tratamiento de mis datos según la <a href="#/legal">política de tratamiento de datos</a> (Ley 1581 de 2012).</span></label>
      <button class="btn btn-wa btn-bloque" type="submit">${ico("wa")}Enviar por WhatsApp</button>
      <button class="btn btn-linea btn-bloque" type="button" id="porCorreo">Prefiero enviarla por correo</button>
      <p class="ayuda" id="formMsg">Se abrirá WhatsApp con tu solicitud lista para enviar.</p>
    </form>
  </div></section>`;
}

function pintarCot() {
  const el = $("#cotLista"); if (!el) return;
  el.innerHTML = cot.items.length ? cot.items.map((i) => {
    const p = prod(i.id); if (!p) return "";
    return `<div class="cot-item">
      ${p.sinFoto ? `<span class="mini-ph"></span>` : `<img src="${IMG}${p.img}" alt="">`}
      <div><b>${esc(p.nombre)}</b><small>${esc(linea(p.linea).corto)}</small></div>
      <input type="text" inputmode="${p.proyecto ? "text" : "numeric"}" value="${esc(i.cant || "")}" placeholder="${p.proyecto ? "Medida" : "Cantidad"}" aria-label="${p.proyecto ? "Medida" : "Cantidad"} de ${esc(p.nombre)}" data-cant-id="${p.id}">
      <button class="quitar" type="button" aria-label="Quitar ${esc(p.nombre)}" data-quitar="${p.id}">×</button>
    </div>`;
  }).join("") : `<div class="cot-vacia">Tu lista está vacía. Puedes enviar la solicitud igual y contarnos qué necesitas, o <a href="#/catalogo" style="color:var(--rojo);font-weight:600">explorar el catálogo</a>.</div>`;
}

function vComo() {
  return `
  <section class="pag-head"><div class="wrap">
    <p class="migas"><a href="#/">Inicio</a> / Cómo trabajamos</p>
    <h1>Cómo trabajamos</h1>
    <p>Un proceso simple, con condiciones claras desde el principio.</p>
  </div></section>
  <section class="sec"><div class="wrap">${bloquePasos()}</div></section>
  <section class="sec sec-gris"><div class="wrap"><div class="sec-head centro"><h2>Preguntas frecuentes</h2></div>${bloqueFaq()}</div></section>
  <section class="wrap" style="margin-top:72px">${bloqueCta()}</section>`;
}

function vNosotros() {
  return `
  <section class="pag-head"><div class="wrap">
    <p class="migas"><a href="#/">Inicio</a> / Nosotros</p>
    <h1>Sentimos tu marca</h1>
    <p>Somos una empresa de Medellín basada en la creatividad y la innovación.</p>
  </div></section>
  <section class="wrap"><div class="nos">
    <div>
      <h2>Creemos en el poder de las ideas para diferenciar una marca</h2>
      <p>En Gonflé creamos, desarrollamos y comercializamos productos publicitarios para que la imagen de nuestros clientes genere un impacto positivo: desde un inflable de bolsillo hasta un muñeco gigante para eventos.</p>
      <p>Contamos con dos unidades de producción de inflables, a motor y de sellado por alta frecuencia, y personalizamos cada detalle con estampación, bordado, tampografía y serigrafía.</p>
      <p><span class="ph-claro">Por completar: año de fundación, equipo, fotos de planta y proyectos reales.</span></p>
    </div>
    <div class="nos-img"><img src="${IMG}hero-pantera.webp" alt="Inflable publicitario gigante"><span class="ref">Imagen de referencia</span></div>
  </div></section>
  <section class="sec sec-gris"><div class="wrap">
    <div class="cifras">
      <div class="cifra rev"><b>14 m</b><span>Altura máxima de fabricación en inflables</span></div>
      <div class="cifra rev"><b>2</b><span>Unidades de producción de inflables: motor y sellado</span></div>
      <div class="cifra rev"><b>5</b><span>Líneas para la visibilidad de tu marca</span></div>
    </div>
  </div></section>
  <section class="wrap" style="margin-top:72px">${bloqueCta()}</section>`;
}

function vLegal() {
  return `
  <section class="pag-head"><div class="wrap">
    <p class="migas"><a href="#/">Inicio</a> / Legal</p>
    <h1>Datos y documentos</h1>
    <p>Espacio para los documentos que Gonflé intercambia con clientes y proveedores.</p>
  </div></section>
  <section class="sec"><div class="wrap"><div class="razones">
    <div class="razon"><h3>Política de tratamiento de datos</h3><p>Texto de la política según la Ley 1581 de 2012. <span class="ph-claro">Pendiente: documento vigente de Gonflé.</span></p></div>
    <div class="razon"><h3>Actualización de datos de clientes</h3><p>Formulario para que cada cliente actualice sus datos de facturación y contacto. <span class="ph-claro">Pendiente: campos requeridos.</span></p></div>
    <div class="razon"><h3>Registro de proveedores</h3><p>Formulario de actualización de datos de proveedores. <span class="ph-claro">Pendiente: campos requeridos.</span></p></div>
  </div></div></section>`;
}

const v404 = () => `<section class="sec"><div class="wrap" style="text-align:center"><h1>No encontramos esta página</h1><p style="margin:16px 0 28px">Puede que el enlace haya cambiado.</p><a class="btn btn-rojo" href="#/catalogo">Ir al catálogo</a></div></section>`;

// ───────── Enrutador
let primera = true;
function ruta() {
  const [, a = "", b = ""] = location.hash.replace(/^#/, "").split("/");
  let html, nav = "inicio", titulo = "Gonflé | Inflables publicitarios, material POP y merchandising en Medellín";
  if (a === "") html = vInicio();
  else if (a === "catalogo") { html = vCatalogo(b || "todos"); nav = b === "inflables" ? "inflables" : "catalogo"; titulo = `${linea(b) ? linea(b).nombre : "Catálogo"} | Gonflé`; }
  else if (a === "producto") { html = vProducto(b); nav = "catalogo"; if (prod(b)) titulo = `${prod(b).nombre} | Gonflé`; }
  else if (a === "cotizar") { html = vCotizar(); nav = ""; titulo = "Solicitar cotización | Gonflé"; }
  else if (a === "como-trabajamos") { html = vComo(); nav = "como"; titulo = "Cómo trabajamos | Gonflé"; }
  else if (a === "nosotros") { html = vNosotros(); nav = "nosotros"; titulo = "Nosotros | Gonflé"; }
  else if (a === "legal") { html = vLegal(); nav = ""; titulo = "Datos y documentos | Gonflé"; }
  else html = v404();

  app.innerHTML = html;
  document.title = titulo;
  $$(".nav a").forEach((x) => { const on = x.dataset.nav === nav; x.classList.toggle("activo", on); on ? x.setAttribute("aria-current", "page") : x.removeAttribute("aria-current"); });
  $("#nav").classList.remove("abierto"); $("#burger").setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
  if (primera) primera = false; else app.focus({ preventScroll: true });

  if (a === "catalogo") {
    pintarGrid(b);
    $("#q").addEventListener("input", (e) => pintarGrid(b, e.target.value));
  }
  if (a === "cotizar") pintarCot();
  if (a === "producto" && prod(b)) {
    const c = $("#cant"), w = $("#waProd");
    c && c.addEventListener("input", () => { w.href = waProducto(prod(b), prod(b).proyecto ? "" : c.value) + (prod(b).proyecto && c.value ? encodeURIComponent(` Medida: ${c.value}.`) : ""); });
  }
  revelar();
}

// ───────── Animación de entrada
let obs;
function revelar() {
  if (!("IntersectionObserver" in window)) return $$(".rev").forEach((e) => e.classList.add("in"));
  obs ||= new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } }), { rootMargin: "0px 0px -40px 0px" });
  $$(".rev:not(.in)").forEach((e) => obs.observe(e));
}

// ───────── Eventos globales
document.addEventListener("click", (e) => {
  const w = e.target.closest('a[href^="https://wa.me/"]');
  if (w) medir("clic_whatsapp", { pagina: location.hash || "#/" });
  const add = e.target.closest("[data-add]");
  if (add) { const c = add.dataset.cant ? $(add.dataset.cant) : null; cot.agregar(add.dataset.add, c ? c.value : ""); return; }
  const q = e.target.closest("[data-quitar]");
  if (q) { cot.quitar(q.dataset.quitar); pintarCot(); return; }
  if (e.target.closest("#porCorreo")) { enviar("correo"); return; }
  if (e.target.closest("#burger")) { const ab = $("#nav").classList.toggle("abierto"); $("#burger").setAttribute("aria-expanded", ab); }
});
document.addEventListener("input", (e) => {
  const id = e.target.dataset && e.target.dataset.cantId;
  if (id) { const it = cot.items.find((i) => i.id === id); if (it) { it.cant = e.target.value; cot.guardar(); } }
});
document.addEventListener("submit", (e) => { if (e.target.id === "formCot") { e.preventDefault(); enviar("wa"); } });

function enviar(canal) {
  const f = $("#formCot"), msg = $("#formMsg");
  const d = Object.fromEntries(new FormData(f));
  if (!d.nombre || !d.empresa) { msg.textContent = "Escribe tu nombre y el de tu empresa para poder responderte."; msg.style.color = "var(--rojo)"; (d.nombre ? f.empresa : f.nombre).focus(); return; }
  if (!f.acepta.checked) { msg.textContent = "Necesitamos tu autorización de tratamiento de datos para continuar."; msg.style.color = "var(--rojo)"; f.acepta.focus(); return; }
  const texto = mensajeCotizacion(d);
  msg.style.color = ""; msg.textContent = canal === "wa" ? "Abriendo WhatsApp con tu solicitud..." : "Abriendo tu correo con la solicitud...";
  const url = canal === "wa" ? wa(texto) : `mailto:${CONTACTO.email}?subject=${encodeURIComponent("Solicitud de cotización - " + d.empresa)}&body=${encodeURIComponent(texto)}`;
  medir("solicitud_enviada", { canal, productos: cot.items.length });
  window.open(url, canal === "wa" ? "_blank" : "_self");
}

// ───────── Arranque
$$("[data-wa='general']").forEach((a) => (a.href = waGeneral()));
$("#footLineas").innerHTML = LINEAS.map((l) => `<li><a href="#/catalogo/${l.id}">${esc(l.nombre)}</a></li>`).join("");
$("#footMail").textContent = CONTACTO.email; $("#footMail").href = `mailto:${CONTACTO.email}`;
pintarContador();
window.addEventListener("hashchange", ruta);
ruta();
