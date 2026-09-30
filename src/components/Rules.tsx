/** Règles affichées tant que le Conclave n'est pas ouvert (texte de la V1). */
export default function Rules() {
  return (
    <ol className="rules">
      <li><b>Qualifs.</b> Chacun choisit 3 marathons en secret. Les 7 plus cités passent.</li>
      <li><b>Plaidoiries.</b> Une minute chacun pour défendre son favori.</li>
      <li><b>Éliminations.</b> Vote secret, le plus désigné sort, jusqu&apos;à 3 finalistes. Égalité : tous les ex-aequo sortent si c&apos;est possible, sinon personne.</li>
      <li><b>Carton rouge.</b> Une fois dans la partie, dans ton bulletin, tu peux dégainer ton carton : le marathon visé sort d&apos;office. Prix : 5 points au lieu de 10 en finale.</li>
      <li><b>Finale.</b> Chacun répartit ses points, 6 maximum sur un même marathon.</li>
    </ol>
  );
}
