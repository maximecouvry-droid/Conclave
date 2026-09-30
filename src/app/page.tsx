import MainTabs from '@/components/MainTabs';
import ThemeToggle from '@/components/ThemeToggle';

export default function Accueil() {
  return (
    <>
      <header className="top">
        <div className="brand"><i></i>Marathon du Marathon</div>
        <div className="tools"><ThemeToggle /></div>
      </header>
      <MainTabs />
      <h1>Liste<br />marathon</h1>
    </>
  );
}
