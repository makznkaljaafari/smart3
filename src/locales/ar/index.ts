import { arCommon } from './common';
import { arDashboard } from './dashboard';
import { arFeatures } from './features';
import { arSettings } from './settings';
import { arTeam } from './team';

export const ar = {
  ...arCommon,
  ...arDashboard,
  ...arFeatures,
  ...arSettings,
  ...arTeam,
};