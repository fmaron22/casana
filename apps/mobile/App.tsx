// Casana · App móvil (Expo). Role-aware: Patrón y Trabajadora (ADR-0003).
// Navegación simple por estado; se migrará a expo-router al crecer.
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

// En dispositivo físico apunta a la IP LAN de tu máquina (EXPO_PUBLIC_API_URL).
const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const C = {
  primary: '#C23760',
  houseTop: '#BF3B69',
  houseBottom: '#D02660',
  dark: '#20252C',
  soft: '#5B626B',
  line: '#E7E3E6',
  bg: '#F6F4F5',
  ok: '#1E8E5A',
};

const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const pesos = (c: number) => mxn.format(c / 100);

type Pantalla = 'inicio' | 'patron' | 'trabajadora';

export default function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');
  return (
    <View style={s.app}>
      <StatusBar style="dark" />
      {pantalla === 'inicio' && <Inicio onElegir={setPantalla} />}
      {pantalla === 'patron' && <PatronHome onAtras={() => setPantalla('inicio')} />}
      {pantalla === 'trabajadora' && <TrabajadoraHome onAtras={() => setPantalla('inicio')} />}
    </View>
  );
}

/* ---------------- Marca ---------------- */
function LogoCasa({ size = 84 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      {/* Techo */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.5,
          borderRightWidth: size * 0.5,
          borderBottomWidth: size * 0.38,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: C.houseTop,
        }}
      />
      {/* Cuerpo con sonrisa */}
      <LinearGradient
        colors={[C.houseTop, C.houseBottom]}
        style={{
          width: size * 0.84,
          height: size * 0.52,
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: size * 0.42,
            height: size * 0.21,
            borderBottomWidth: 5,
            borderColor: '#fff',
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}
        />
      </LinearGradient>
    </View>
  );
}

function Header({ titulo, onAtras }: { titulo: string; onAtras: () => void }) {
  return (
    <View style={s.header}>
      <Pressable onPress={onAtras} hitSlop={12}>
        <Text style={s.atras}>‹ Inicio</Text>
      </Pressable>
      <Text style={s.headerTitulo}>{titulo}</Text>
      <View style={{ width: 52 }} />
    </View>
  );
}

/* ---------------- Inicio (selector de rol) ---------------- */
function Inicio({ onElegir }: { onElegir: (p: Pantalla) => void }) {
  return (
    <View style={s.inicio}>
      <LogoCasa />
      <Text style={s.wordmark}>casana</Text>
      <Text style={s.lema}>Protege a quien cuida tu hogar</Text>

      <Pressable style={s.rolBtn} onPress={() => onElegir('patron')}>
        <Text style={s.rolTitulo}>Soy patrón / patrona</Text>
        <Text style={s.rolSub}>Cotiza y administra el aseguramiento</Text>
      </Pressable>
      <Pressable style={[s.rolBtn, s.rolBtnAlt]} onPress={() => onElegir('trabajadora')}>
        <Text style={s.rolTitulo}>Trabajo en el hogar</Text>
        <Text style={s.rolSub}>Consulta tus pagos y tu seguro</Text>
      </Pressable>
    </View>
  );
}

/* ---------------- Patrón: cotizador ---------------- */
interface Preview {
  dias: number;
  obligacionesCentavos: number;
  salarioPeriodoCentavos: number;
  cargo: { comision: { total: number }; totalACobrar: number };
}

function PatronHome({ onAtras }: { onAtras: () => void }) {
  const [salario, setSalario] = useState('400');
  const [data, setData] = useState<Preview | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const monto = parseFloat(salario);
    if (!(monto > 0)) return;
    const t = setTimeout(() => {
      setCargando(true);
      setError(null);
      fetch(`${API}/v1/cotizador?salarioDiario=${Math.round(monto * 100)}&modalidad=mesCompleto`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((j: Preview) => setData(j))
        .catch(() => setError('Sin conexión con Casana. Revisa EXPO_PUBLIC_API_URL.'))
        .finally(() => setCargando(false));
    }, 350);
    return () => clearTimeout(t);
  }, [salario]);

  return (
    <ScrollView contentContainerStyle={s.pantalla}>
      <Header titulo="Cotizador" onAtras={onAtras} />
      <Text style={s.label}>¿Cuánto pagas por día?</Text>
      <View style={s.inputRow}>
        <Text style={s.inputPrefijo}>$</Text>
        <TextInput
          style={s.input}
          keyboardType="numeric"
          value={salario}
          onChangeText={setSalario}
          placeholder="400"
        />
        <Text style={s.inputSufijo}>MXN/día</Text>
      </View>

      {cargando && <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />}
      {error && <Text style={s.error}>{error}</Text>}

      {data && !cargando && (
        <LinearGradient colors={[C.houseTop, C.houseBottom]} style={s.resultado}>
          <Text style={s.resK}>TOTAL MENSUAL ESTIMADO</Text>
          <Text style={s.resV}>{pesos(data.cargo.totalACobrar)}</Text>
          <Fila k={`Salario (${data.dias} días)`} v={pesos(data.salarioPeriodoCentavos)} />
          <Fila k="Cuotas IMSS e INFONAVIT" v={pesos(data.obligacionesCentavos)} />
          <Fila k="Servicio Casana" v={pesos(data.cargo.comision.total)} />
        </LinearGradient>
      )}
    </ScrollView>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.fila}>
      <Text style={s.filaK}>{k}</Text>
      <Text style={s.filaV}>{v}</Text>
    </View>
  );
}

/* ---------------- Trabajadora: mis pagos ---------------- */
interface Linea {
  id: string;
  periodo: string | null;
  lineaCaptura: string | null;
  importeCentavos: number | null;
  vigencia: string | null;
  estado: string;
}

function TrabajadoraHome({ onAtras }: { onAtras: () => void }) {
  const [lineas, setLineas] = useState<Linea[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO auth: al existir sesión de trabajadora, filtrar por su relación.
    fetch(`${API}/v1/admin/lineas-captura`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: Linea[]) => setLineas(j))
      .catch(() => setError('Sin conexión con Casana.'));
  }, []);

  return (
    <View style={s.pantalla}>
      <Header titulo="Mi seguro IMSS" onAtras={onAtras} />
      <Text style={s.parrafo}>
        Aquí verás cada mes el pago de tus cuotas al IMSS: tu salud, incapacidades, guardería y
        ahorro para el retiro.
      </Text>
      {error && <Text style={s.error}>{error}</Text>}
      {!lineas && !error && <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} />}
      {lineas && (
        <FlatList
          data={lineas}
          keyExtractor={(l) => l.id}
          ListEmptyComponent={<Text style={s.parrafo}>Aún no hay pagos registrados.</Text>}
          renderItem={({ item }) => (
            <View style={s.pago}>
              <View style={{ flex: 1 }}>
                <Text style={s.pagoPeriodo}>Periodo {item.periodo ?? '—'}</Text>
                <Text style={s.pagoLinea}>{item.lineaCaptura ?? 'Sin línea'}</Text>
                <Text style={s.pagoVigencia}>Vence: {item.vigencia ?? '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.pagoImporte}>
                  {item.importeCentavos != null ? pesos(item.importeCentavos) : '—'}
                </Text>
                <Text style={[s.chip, item.estado === 'RECIBIDA' || item.estado === 'PAGADA' ? s.chipOk : s.chipWarn]}>
                  {item.estado.replaceAll('_', ' ')}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

/* ---------------- Estilos ---------------- */
const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.bg },
  inicio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26 },
  wordmark: { fontSize: 40, fontWeight: '800', color: C.dark, letterSpacing: -1, marginTop: 10 },
  lema: { color: C.soft, marginTop: 4, marginBottom: 36, fontSize: 15 },
  rolBtn: {
    width: '100%', backgroundColor: C.primary, borderRadius: 18, padding: 20, marginBottom: 14,
  },
  rolBtnAlt: { backgroundColor: C.dark },
  rolTitulo: { color: '#fff', fontWeight: '800', fontSize: 17 },
  rolSub: { color: 'rgba(255,255,255,0.85)', marginTop: 3, fontSize: 13 },

  pantalla: { flexGrow: 1, padding: 22, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  atras: { color: C.primary, fontWeight: '700', fontSize: 16, width: 52 },
  headerTitulo: { fontWeight: '800', fontSize: 18, color: C.dark },

  label: { fontWeight: '700', color: C.dark, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: C.line, borderRadius: 14, paddingHorizontal: 14,
  },
  inputPrefijo: { color: C.soft, fontWeight: '700', fontSize: 18 },
  input: { flex: 1, fontSize: 22, fontWeight: '700', color: C.dark, padding: 12 },
  inputSufijo: { color: C.soft, fontWeight: '600' },

  resultado: { borderRadius: 16, padding: 20, marginTop: 22 },
  resK: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  resV: { color: '#fff', fontWeight: '800', fontSize: 32, marginBottom: 10 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  filaK: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  filaV: { color: '#fff', fontWeight: '700', fontSize: 13 },

  parrafo: { color: C.soft, marginBottom: 16, lineHeight: 20 },
  pago: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.line, marginBottom: 12,
  },
  pagoPeriodo: { fontWeight: '800', color: C.dark },
  pagoLinea: { color: C.soft, fontSize: 12, marginTop: 2 },
  pagoVigencia: { color: C.soft, fontSize: 12, marginTop: 2 },
  pagoImporte: { fontWeight: '800', color: C.dark, fontSize: 16 },
  chip: { fontSize: 10, fontWeight: '800', marginTop: 6, overflow: 'hidden' },
  chipOk: { color: C.ok },
  chipWarn: { color: '#B8860B' },

  error: { color: C.primary, marginTop: 16 },
});
