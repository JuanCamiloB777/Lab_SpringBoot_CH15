const test = require("node:test");
const assert = require("node:assert/strict");
const { pedir, esperarEstado, exigirArchivo, leer, todasLasClases } = require("./app");

// Cada test crea sus propios planes y socios: no importa qué haya en la base.
const marca = Date.now() % 100000;
const NO_EXISTE = 987654321;

async function crearPlan(nombre) {
  const r = await pedir("POST", "/api/planes", { nombre: `${nombre} ${marca}`, duracionMeses: 1, precio: 120000 });
  esperarEstado(r, [200, 201], "POST /api/planes", "con datos buenos el plan se debe crear");
  assert.ok(r.json && Number.isInteger(r.json.id), "POST /api/planes debería devolver el plan con su id");
  return r.json;
}

// Revisa que la respuesta sea un ErrorResponse: { status, mensaje, campos }.
function esperarError(r, codigo, peticion) {
  esperarEstado(r, codigo, peticion);
  assert.ok(r.json && typeof r.json === "object" && !Array.isArray(r.json),
    `${peticion} debería responder un JSON con status, mensaje y campos y respondió: ${r.texto.slice(0, 120) || "nada"} (¿tu ManejadorDeErrores devuelve un ErrorResponse?)`);
  assert.equal(r.json.status, codigo, `${peticion}: en el JSON, «status» debería ser ${codigo} y es ${JSON.stringify(r.json.status)}`);
  assert.ok(typeof r.json.mensaje === "string" && r.json.mensaje.trim() !== "",
    `${peticion}: en el JSON falta «mensaje» o viene vacío (¿olvidaste super(mensaje) en la excepción?)`);
  assert.ok(r.json.campos && typeof r.json.campos === "object" && !Array.isArray(r.json.campos),
    `${peticion}: en el JSON falta «campos» (un objeto; puede ir vacío: {})`);
  return r.json;
}

function esperarCampos(json, campos, peticion) {
  for (const campo of campos) {
    assert.ok(typeof json.campos[campo] === "string" && json.campos[campo].trim() !== "",
      `${peticion}: en «campos» falta el mensaje de «${campo}» (¿le pusiste su anotación con message y @Valid en el controlador?)`);
  }
}

test("el pom.xml declara spring-boot-starter-validation", () => {
  const xml = leer("pom.xml") || "";
  assert.match(xml, /<artifactId>spring-boot-starter-validation<\/artifactId>/,
    "Falta la dependencia spring-boot-starter-validation en el pom.xml (aunque springdoc la traiga escondida, se declara)");
});

test("ErrorResponse es un record con status, mensaje y campos", () => {
  const codigo = exigirArchivo("ErrorResponse.java");
  const encabezado = codigo.match(/record\s+ErrorResponse\s*\(([^)]*)\)/);
  assert.ok(encabezado, "ErrorResponse debería ser un record: public record ErrorResponse(int status, String mensaje, Map<String, String> campos)");
  assert.match(encabezado[1], /\bint\s+status\b/, "A ErrorResponse le falta el componente int status");
  assert.match(encabezado[1], /\bString\s+mensaje\b/, "A ErrorResponse le falta el componente String mensaje");
  assert.match(encabezado[1], /\bMap\s*<\s*String\s*,\s*String\s*>\s+campos\b/, "A ErrorResponse le falta el componente Map<String, String> campos");
});

test("hay un @RestControllerAdvice y los controladores ya no revisan Optional", () => {
  const manejador = todasLasClases().find((c) => /@RestControllerAdvice\b/.test(c.codigo));
  assert.ok(manejador, "No encuentro ninguna clase con @RestControllerAdvice: crea ManejadorDeErrores en el paquete exception");
  for (const archivo of ["PlanController.java", "SocioController.java"]) {
    const codigo = exigirArchivo(archivo);
    assert.doesNotMatch(codigo, /\bOptional\b/,
      `${archivo} todavía usa Optional: el servicio debe lanzar la excepción y el controlador solo responder el caso feliz`);
  }
});

test("POST /api/planes con datos inválidos responde 400 con un mensaje por campo", async () => {
  const peticion = "POST /api/planes con nombre vacío, duración 0 y precio -1";
  const r = await pedir("POST", "/api/planes", { nombre: "", duracionMeses: 0, precio: -1 });
  if (r.status === 201 || r.status === 200) assert.fail(`${peticion} creó el plan (respondió ${r.status}): ¿falta @Valid en el controlador o las anotaciones en PlanRequest?`);
  const json = esperarError(r, 400, peticion);
  esperarCampos(json, ["nombre", "duracionMeses", "precio"], peticion);
});

test("PUT /api/planes/{id} también valida los datos", async () => {
  const plan = await crearPlan("Plan para validar");
  const peticion = `PUT /api/planes/${plan.id} con nombre vacío`;
  const r = await pedir("PUT", `/api/planes/${plan.id}`, { nombre: "  ", duracionMeses: 1, precio: 120000 });
  if (r.status === 200) assert.fail(`${peticion} lo actualizó (200): ¿falta @Valid en el método actualizar?`);
  const json = esperarError(r, 400, peticion);
  esperarCampos(json, ["nombre"], peticion);
});

test("un JSON ilegible responde 400 con un mensaje", async () => {
  const peticion = "POST /api/planes con «precio»: \"mucho\"";
  const r = await pedir("POST", "/api/planes", { nombre: `Plan ilegible ${marca}`, duracionMeses: 1, precio: "mucho" });
  esperarError(r, 400, peticion + " (¿atendiste HttpMessageNotReadableException en el manejador?)");
});

test("GET, PUT y DELETE de un plan que no existe responden 404 con su mensaje", async () => {
  await crearPlan("Plan prueba 404");
  const casos = [
    ["GET", `/api/planes/${NO_EXISTE}`, undefined],
    ["PUT", `/api/planes/${NO_EXISTE}`, { nombre: "Fantasma", duracionMeses: 1, precio: 1000 }],
    ["DELETE", `/api/planes/${NO_EXISTE}`, undefined],
  ];
  for (const [metodo, ruta, cuerpo] of casos) {
    const peticion = `${metodo} ${ruta}`;
    const json = esperarError(await pedir(metodo, ruta, cuerpo), 404, peticion);
    assert.ok(json.mensaje.includes(String(NO_EXISTE)), `${peticion}: el mensaje debería decir el id que no existe (${NO_EXISTE}) y dice «${json.mensaje}»`);
  }
});

test("GET /api/socios/{id} que no existe responde 404 con su mensaje", async () => {
  await crearPlan("Plan prueba socio 404");
  const peticion = `GET /api/socios/${NO_EXISTE}`;
  const json = esperarError(await pedir("GET", `/api/socios/${NO_EXISTE}`), 404, peticion);
  assert.ok(json.mensaje.includes(String(NO_EXISTE)), `${peticion}: el mensaje debería decir el id que no existe (${NO_EXISTE}) y dice «${json.mensaje}»`);
});

test("POST /api/socios sin nombre o sin planId responde 400 con sus campos", async () => {
  await crearPlan("Plan prueba socio vacío");
  const peticion = "POST /api/socios con nombre vacío y sin planId";
  const r = await pedir("POST", "/api/socios", { nombre: "" });
  if (r.status === 500) assert.fail(`${peticion} respondió 500: falta @NotNull en planId de SocioRequest, o @Valid en SocioController`);
  const json = esperarError(r, 400, peticion);
  esperarCampos(json, ["nombre", "planId"], peticion);
});

test("POST /api/socios con un plan que no existe responde 400 con su mensaje", async () => {
  await crearPlan("Plan prueba regla");
  const peticion = `POST /api/socios con planId ${NO_EXISTE}`;
  const json = esperarError(await pedir("POST", "/api/socios", { nombre: `Socio sin plan ${marca}`, planId: NO_EXISTE }), 400, peticion);
  assert.ok(json.mensaje.includes(String(NO_EXISTE)), `${peticion}: el mensaje debería decir el plan que no existe (${NO_EXISTE}) y dice «${json.mensaje}»`);
});
