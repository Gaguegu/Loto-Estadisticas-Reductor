export interface AppVersionConfig {
  version: string;
  buildTime: number;
  buildDate: string;
  appName: string;
  defaultGithubRepo: string;
}

export const CURRENT_APP_VERSION: AppVersionConfig = {
  version: '2.7.1',
  buildTime: Date.now(),
  buildDate: '12 de Septiembre de 2026',
  appName: 'LotoEstadísticas & Reductor',
  defaultGithubRepo: 'Loto-Estadisticas-Reductor',
};
