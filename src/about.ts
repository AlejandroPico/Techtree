import { t, num } from './i18n';
/** Identidad del producto, con el mismo formato que Historicmap y el resto de proyectos del autor. */
export function aboutContent(version: string, base: string, stats: { nodes: number; edges: number; domains: number }) {
  return `
  <header class="about-header">
    <div class="about-project-icon"><img src="${base}favicon.svg" width="64" height="64" alt=""></div>
    <div class="about-heading"><p>${t('aTag')}</p><h2>tech<span>tree</span></h2></div>
  </header>
  <div class="about-layout">
    <aside class="about-index"><h3>${t('aProject')}</h3><dl>
      <div><dt>${t('aVersion')}</dt><dd>${version}</dd></div>
      <div><dt>${t('aUpdated')}</dt><dd>${t('aUpdatedOn')}</dd></div>
      <div><dt>${t('aContent')}</dt><dd>${t('aContentValue', { n: num(stats.nodes), e: num(stats.edges), d: stats.domains })}</dd></div>
      <div><dt>${t('aSpan')}</dt><dd>${t('aSpanValue')}</dd></div>
    </dl></aside>
    <div class="about-copy"><p class="about-lead">${t('aLead')}</p><p>${t('aText')}</p>
      <div class="about-purpose"><h3>${t('aExplore')}</h3>
        <div><strong>${t('aMove')}</strong><span>${t('aMoveText')}</span></div>
        <div><strong>${t('aTime')}</strong><span>${t('aTimeText')} ${t('aTimeText2')}</span></div>
        <div><strong>${t('aCards')}</strong><span>${t('aCardsText')}</span></div></div>
      <div class="about-install"><button id="install-button" hidden><i data-lucide="download"></i>${t('aInstall')}</button><span id="install-hint">${t('aInstallHint')}</span></div>
      <details class="release-history"><summary>${t('aHistory')}</summary><ol><li><strong>0.2.0 · ${t('aUpdatedOn')}</strong><p>${t('aV020')}</p></li><li><strong>0.1.0 · ${t('aUpdatedOn')}</strong><p>${t('aV010')}</p></li></ol></details>
      <p class="about-note">${t('aNote')}</p>
    </div>
  </div>
  <nav class="about-links"><a href="https://alejandropico.github.io/Portfolio/" target="_blank" rel="noopener noreferrer"><span>${t('aAuthor')}</span><strong>Alejandro Pico · Portfolio</strong><b>↗</b></a><a href="https://github.com/AlejandroPico/Techtree" target="_blank" rel="noopener noreferrer"><span>${t('aRepo')}</span><strong>Techtree · GitHub</strong><b>↗</b></a></nav>
  <div class="about-spectrum" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>`;
}
