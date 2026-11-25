const test = require("node:test");
const assert = require("node:assert/strict");
const { pedir, esperarEstado, exigirArchivo } = require("./app");

// Cada test crea sus propios planes y socios: no importa qué haya en la base.
const marca = Date.now() % 100000;
const NO_EXISTE = 987654321;

async function crearPlan(nombre) {
  const r = await pedir("POST", "/api/planes", { nombre: `${nombre} ${marca}`, duracionMeses: 1, precio: 120000 });
  esperarEstado(r, [200, 201], "POST /api/planes");
  assert.ok(r.json && Number.isInteger(r.json.id), "POST /api/planes debería devolver el plan con su id");
  return r.json;
}

async function crearSocio(nombre, planId) {
  const r = await pedir("POST", "/api/socios", { nombre: `${nombre} ${marca}`, planId });
  esperarEstado(r, 201, "POST /api/socios", r.status === 404 ? "¿creaste SocioController con @RequestMapping(\"/api/socios\")?" : r.status === 200 ? "al crear se responde 201" : "");
  return r;
}

test("Socio pertenece a un Plan (@ManyToOne)", () => {
  const codigo = exigirArchivo("Socio.java");
  assert.match(codigo, /@Entity\b/, "A Socio le falta @Entity");
  assert.match(codigo, /@Id\b/, "A Socio le falta @Id sobre el atributo id");
  assert.match(codigo, /@ManyToOne\b[\s\S]*?private\s+Plan\s+plan\s*;/, "Socio debería tener: @ManyToOne @JoinColumn(name = \"plan_id\") private Plan plan;");
});

test("Plan tiene su lista de socios (@OneToMany con mappedBy)", () => {
  const codigo = exigirArchivo("Plan.java");
  assert.match(codigo, /@OneToMany\s*\(\s*mappedBy\s*=\s*"plan"\s*\)[\s\S]*?private\s+List\s*<\s*Socio\s*>\s+\w+/, "Plan debería tener: @OneToMany(mappedBy = \"plan\") private List<Socio> socios;");
});

// Devuelve lo que va entre los paréntesis del record, aunque los componentes
// tengan anotaciones con paréntesis (por ejemplo, @NotBlank(message = "…") de la fase 6).
function componentesDelRecord(codigo, nombre) {
  const inicio = codigo.search(new RegExp(`\\brecord\\s+${nombre}\\s*\\(`));
  if (inicio === -1) return null;
  let i = codigo.indexOf("(", inicio) + 1;
  const desde = i;
  let profundidad = 1;
  let enTexto = false;
  for (; i < codigo.length && profundidad > 0; i++) {
    const c = codigo[i];
    if (c === '"' && codigo[i - 1] !== "\\") enTexto = !enTexto;
    else if (!enTexto && c === "(") profundidad++;
    else if (!enTexto && c === ")") profundidad--;
  }
  return codigo.slice(desde, i - 1);
}

test("los DTO son records: PlanRequest, PlanResponse, SocioRequest y SocioResponse", () => {
  for (const nombre of ["PlanRequest", "PlanResponse", "SocioRequest", "SocioResponse"]) {
    const codigo = exigirArchivo(`${nombre}.java`);
    assert.match(codigo, new RegExp(`\\brecord\\s+${nombre}\\s*\\(`), `${nombre} debería ser un record: public record ${nombre}(...)`);
  }
  const planRequest = componentesDelRecord(exigirArchivo("PlanRequest.java"), "PlanRequest").replace(/"[^"]*"/g, "\"\"");
  assert.doesNotMatch(planRequest, /\bid\b/, "PlanRequest no debe tener id: el id lo decide la base de datos");
  const socioRequest = componentesDelRecord(exigirArchivo("SocioRequest.java"), "SocioRequest");
  assert.match(socioRequest, /\bLong\s+planId\b/, "SocioRequest debería tener Long planId: el cliente dice a qué plan se inscribe");
});

test("los controladores ya no reciben ni devuelven entidades", () => {
  for (const archivo of ["PlanController.java", "SocioController.java"]) {
    const codigo = exigirArchivo(archivo);
    const devuelve = codigo.match(/public\s+[\w<>\s]*?\b(Plan|Socio)\b\s*>*\s*\w+\s*\(/);
    assert.equal(devuelve, null, `${archivo} todavía devuelve la entidad ${devuelve && devuelve[1]}: devuelve ${devuelve && devuelve[1]}Response`);
    const recibe = codigo.match(/@RequestBody\s+(Plan|Socio)\b/);
    assert.equal(recibe, null, `${archivo} todavía recibe la entidad ${recibe && recibe[1]} en @RequestBody: recibe ${recibe && recibe[1]}Request`);
  }
});

test("POST /api/socios inscribe un socio y GET /api/socios/{id} lo encuentra", async () => {
  const plan = await crearPlan("Plan socios");
  const r = await crearSocio("Valentina Rojas", plan.id);
  assert.ok(r.json && Number.isInteger(r.json.id), `POST /api/socios debería devolver el socio con su id y devolvió: ${r.texto.slice(0, 120) || "nada"}`);
  assert.equal(r.json.nombre, `Valentina Rojas ${marca}`, "POST /api/socios debería devolver el nombre del socio");
  assert.equal(r.json.plan, `Plan socios ${marca}`, `En SocioResponse, «plan» debería ser el nombre del plan ("Plan socios ${marca}") y es ${JSON.stringify(r.json.plan)}`);
  const uno = await pedir("GET", `/api/socios/${r.json.id}`);
  esperarEstado(uno, 200, `GET /api/socios/${r.json.id}`);
  assert.deepEqual(uno.json, r.json, `GET /api/socios/${r.json.id} debería traer el mismo socio que devolvió el POST`);
  const ninguno = await pedir("GET", `/api/socios/${NO_EXISTE}`);
  esperarEstado(ninguno, 404, `GET /api/socios/${NO_EXISTE}`);
});

test("POST /api/socios con un plan que no existe responde 400", async () => {
  await crearPlan("Plan prueba 400");
  const r = await pedir("POST", "/api/socios", { nombre: `Socio sin plan ${marca}`, planId: NO_EXISTE });
  esperarEstado(r, 400, `POST /api/socios con planId ${NO_EXISTE}`, r.status === 404 ? "¿existe SocioController?" : "si no encuentras el plan, responde ResponseEntity.badRequest().build()");
});

test("con socios inscritos, las listas siguen siendo JSON válido (sin bucle)", async () => {
  const plan = await crearPlan("Plan con socios");
  await crearSocio("Andrés Gómez", plan.id);
  await crearSocio("Camila Torres", plan.id);
  for (const ruta of ["/api/planes", "/api/socios"]) {
    const r = await pedir("GET", ruta);
    assert.ok(Array.isArray(r.json), `GET ${ruta} no trae un JSON válido (respondió ${r.status} con ${r.texto.length} caracteres): es el bucle Plan → socios → plan → … Devuelve DTO, no entidades`);
  }
  const planes = (await pedir("GET", "/api/planes")).json;
  assert.ok(planes.some((p) => p.id === plan.id), `GET /api/planes debería incluir el plan ${plan.id}`);
  const socios = (await pedir("GET", "/api/socios")).json;
  const nombres = socios.map((s) => s.nombre);
  assert.ok(nombres.includes(`Andrés Gómez ${marca}`) && nombres.includes(`Camila Torres ${marca}`), "GET /api/socios debería incluir a los dos socios inscritos");
});
