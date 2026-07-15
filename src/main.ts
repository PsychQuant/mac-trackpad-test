import './styles.css';
import { initLocale, t } from './i18n';
import { detectCapabilities } from './support';
import { Session } from './core/session';
import { renderApp } from './app';

initLocale();
document.title = t('pageTitle');
renderApp(
  document.querySelector('#app') as HTMLElement,
  new Session(),
  detectCapabilities()
);
