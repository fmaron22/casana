import { Logo } from '../components/Logo';
import { Wizard } from '../components/Wizard';

export default function Registro() {
  return (
    <main className="shell">
      <div className="brand">
        <Logo />
      </div>
      <Wizard />
    </main>
  );
}
