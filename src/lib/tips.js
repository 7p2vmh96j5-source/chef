// Korta tips om hur örter och ingredienser funkar ihop - visas då och då i Guide
// när man går från en svårighetsnivå till nästa.
export const COOKING_TIPS = [
  "Basilika tillagas bäst i slutet - lägg i den sista minuten, annars försvinner smaken.",
  "Rosmarin och timjan tål lång tillagning och passar perfekt i grytor och ugnsrätter.",
  "Citron och fisk är en klassisk kombo - syran lyfter smaken och balanserar fetma.",
  "Vitlök blir söt och mild om den får steka långsamt, men bitter om den bränns.",
  "Koriander och lime är vanligt i mexikansk och asiatisk mat - friskt och syrligt tillsammans.",
  "Kanel och äpple är en klassisk parning i bakverk, men funkar även i grytor med lamm.",
  "Salt tidigt i tillagningen drar ut smak, salt i slutet ger en tydligare sälta.",
  "Syra som citron eller vinäger balanserar fett och gör tunga rätter lättare.",
  "Färska örter läggs i sist, torkade örter tidigt - de behöver tid för att släppa smak.",
  "Chili och honung är en bra kombo - sötman dämpar hettan utan att döda smaken.",
  "Parmesan och svartpeppar har en naturlig affinitet, klassiskt i cacio e pepe.",
  "Dill passar särskilt bra till fisk, potatis och gräddiga såser.",
  "Ingefära och vitlök fräses ofta tillsammans som bas i asiatisk matlagning.",
  "Smör som tillagas tills det blir gyllenbrunt får en nötig, djupare smak.",
  "Soja och smör ihop skapar snabbt en umamirik sås till nästan vad som helst.",
  "Mejram liknar timjan men är mildare, bra i korv- och charkuterirätter.",
  "Stjärnanis ger djup till buljonger men används sparsamt - smaken är stark.",
  "Fetaost och vattenmelon är en oväntad sommarkombo - salt möter sött.",
  "Muskotnöt funkar överraskande bra i både béchamelsås och spenatgrytor.",
  "Lagerblad ger djup smak i grytor men plockas alltid ur innan servering.",
  "Lite syra i slutet av en sky eller sås väcker hela rätten.",
  "Kardemumma och kaffe är en klassisk kombination i både bakverk och dryck.",
  "Persilja är mildare än många tror - grovhackad ger färskhet utan att ta över.",
  "Curry och kokosmjölk balanserar hetta med len sötma.",
  "Vitlök och olivolja som bas funkar i nästan alla medelhavsrätter.",
  "Söta kryddor som kanel och muskot funkar även i salta rätter, inte bara bakverk.",
  "Bränd citronskal ger en djupare arom än bara pressad citronsaft.",
  "Timjan tillsammans med citron är klassiskt till både kyckling och fisk.",
  "Vitpeppar är mildare och mer blommig än svartpeppar - bra i ljusa såser.",
  "Salvia och smör är en italiensk klassiker till pasta med pumpa eller ravioli.",
];

// Väljer samma tips konsekvent för en given kategori/nivå, istället för slumpat varje gång.
export function tipFor(category, tierIndex) {
  const key = category + tierIndex;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % COOKING_TIPS.length;
  return COOKING_TIPS[hash];
}
