# ADR-0006 · Autenticación (Google/Apple con Identity Platform)

- **Estado:** Aceptado
- **Fecha:** 2026-07-23
- **Relacionado:** [ADR-0001](./ADR-0001-stack-y-arquitectura.md) (Identity Platform)

## Contexto
Falta el login para que patrones **entren y usen el sistema** (ver sus trabajadoras, cuotas,
líneas de captura) y para **proteger** el back office y los endpoints admin.

## Decisión
- **Identity Platform (Firebase Auth)** con **Google y Apple** como proveedores. El cliente hace el
  sign-in y obtiene un **ID token (JWT)**; lo manda como `Authorization: Bearer <token>`.
- El backend verifica el token con **firebase-admin** (`verifyIdToken`) detrás de una interfaz
  `TokenVerifier` con **adaptadores intercambiables**:
  - `firebase` — producción (requiere `FIREBASE_PROJECT_ID` + credenciales ADC/service account).
  - `dev` — desarrollo: token = JSON `{uid,email,nombre}` en base64url. **Nunca** en producción;
    se activa solo cuando no hay `FIREBASE_PROJECT_ID`. Permite probar todo el flujo sin Firebase.
- **Vinculación usuario↔patrón:** en el primer login se busca el patrón por `firebaseUid`, luego por
  `email` (y se vincula), y si no existe se **auto-provisiona** con los datos del token. Así, quien
  se registró por el wizard entra con el mismo correo y encuentra su cuenta.
- **`AuthGuard`** protege los endpoints `/v1/mi/*` (datos del patrón autenticado). El decorador
  `@PatronActual()` inyecta el patrón resuelto.
- **Ops/back office:** se protege después con un rol (`ADMIN`) sobre el mismo mecanismo. ⚠️ Hoy los
  endpoints `/v1/admin/*` siguen abiertos hasta cerrar ese paso.

## Consecuencias
- Un solo mecanismo de token para web y móvil; el móvil usa el mismo Bearer.
- El modo `dev` permite demo local sin cuentas externas; el cambio a producción es solo config.
- Auto-provisión simplifica el "primer login", a costo de crear patrón en cualquier login válido
  (aceptable mientras el alcance sea la app del patrón; revisar al añadir el rol de ops).

## Alcance de esta entrega
- Modelo: `Patron.firebaseUid`.
- `AuthModule` (TokenVerifier dev+firebase, AuthGuard, @PatronActual).
- `MiCuentaController`: perfil, trabajadoras con cuota, líneas de captura, **alta de trabajadora**.
- Frontend: login (Google/Apple cuando hay Firebase; login dev si no) + **dashboard del patrón**.
