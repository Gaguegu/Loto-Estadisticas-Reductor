export interface AppVersionConfig {
  version: string;
  buildTime: number;
  buildDate: string;
  appName: string;
  defaultGithubRepo: string;
}

export const CURRENT_APP_VERSION: AppVersionConfig = {
  version: '2.8.3',
  buildTime: Date.now(),
  buildDate: '17 de Septiembre de 2026',
  appName: 'LotoEstadísticas & Reductor',
  defaultGithubRepo: 'Loto-Estadisticas-Reductor',
};
