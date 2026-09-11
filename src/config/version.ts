export interface AppVersionConfig {
  version: string;
  buildTime: number;
  buildDate: string;
  appName: string;
  defaultGithubRepo: string;
}

export const CURRENT_APP_VERSION: AppVersionConfig = {
  version: '2.7.0',
  buildTime: 1773312000000,
  buildDate: '11 de Septiembre de 2026',
  appName: 'LotoEstadísticas & Reductor',
  defaultGithubRepo: 'Loto-Estadisticas-Reductor',
};
