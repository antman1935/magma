/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {ExpressRequest} from 'express';
import type {FeatureID} from '@fbcnms/types/features';

// A rule that gets evaluated when the featureflag is checked
// true means it passes the check
// false means it fails the check
// null means continue to the next check
type FeatureFlagRule = (req: ExpressRequest) => ?boolean;

const AlwaysEnabledInTestEnvRule: FeatureFlagRule = (req: ExpressRequest) => {
  const hostname = req.hostname || 'UNKNOWN_HOST';
  if (hostname.includes('-test.') || hostname.includes('localhost')) {
    return true;
  }

  return null;
};

export type FeatureConfig = {
  id: FeatureID,
  title: string,
  enabledByDefault: boolean,
  rules?: FeatureFlagRule[],
};

const {FeatureFlag} = require('@fbcnms/sequelize-models');

const arrayConfigs = [
  {
    id: 'sso_example_feature',
    title: 'SSO Example Feature',
    enabledByDefault: false,
  },
  {
    id: 'audit_log_example_feature',
    title: 'Audit Log Example Feature',
    enabledByDefault: true,
  },
  {
    id: 'audit_log_view',
    title: 'Audit Log View',
    enabledByDefault: false,
  },
  {
    id: 'third_party_devices',
    title: 'Third Party Devices',
    enabledByDefault: false,
  },
  {
    id: 'network_topology',
    title: 'Network Topology',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'upload_rural',
    title: 'Bulk Upload: Rural',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'upload_xwf',
    title: 'Bulk Upload: XWF',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'upload_ftth',
    title: 'Bulk Upload: FTTH',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'python_api',
    title: 'Download Puthon API',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'lte_network_metrics',
    title: 'LTE Network Metrics',
    enabledByDefault: true,
  },
  {
    id: 'site_survey',
    title: 'Site Survey',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'alerts',
    title: 'Alerts',
    enabledByDefault: true,
  },
  {
    id: 'logs',
    title: 'Logs',
    enabledByDefault: false,
  },
  {
    id: 'equipment_export',
    title: 'Equipment Export',
    enabledByDefault: true,
  },
  {
    id: 'magma_network_management',
    title: 'Magma Network Management',
    enabledByDefault: false,
  },
  {
    id: 'file_categories',
    title: 'File Categories (for IpT)',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'floor_plans',
    title: 'Floor Plans',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'import_exported_equipemnt',
    title: 'Imported Exported Equipment',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'work_order_map',
    title: 'Work order map',
    enabledByDefault: false,
  },
  {
    id: 'documents_site',
    title: 'Documents Site',
    enabledByDefault: true,
  },
  {
    id: 'services',
    title: 'Services',
    enabledByDefault: false,
  },
  {
    id: 'coverage_maps',
    title: 'Coverage Maps',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'planned_equipment',
    title: 'Planned Equipment',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
  {
    id: 'multi_subject_reports',
    title: 'Multi Subject Reports',
    enabledByDefault: false,
    rules: [AlwaysEnabledInTestEnvRule],
  },
];

const featureConfigs: {[FeatureID]: FeatureConfig} = {};
arrayConfigs.map(config => (featureConfigs[config.id] = config));

export async function isFeatureEnabled(
  req: ExpressRequest,
  featureId: FeatureID,
  organization: ?string,
) {
  const config = featureConfigs[featureId];

  if (config.rules) {
    for (const rule of config.rules) {
      const enabled = rule(req);
      if (enabled !== null) {
        return enabled;
      }
    }
  }

  if (organization) {
    const flag = await FeatureFlag.findOne({where: {organization, featureId}});
    if (flag) {
      return flag.enabled;
    }
  }

  return featureConfigs[featureId].enabledByDefault;
}

export async function getEnabledFeatures(
  req: ExpressRequest,
  organization: ?string,
): Promise<FeatureID[]> {
  const results = await Promise.all(
    arrayConfigs.map(async (config): Promise<?FeatureID> => {
      const enabled = await isFeatureEnabled(req, config.id, organization);
      return enabled ? config.id : null;
    }),
  );

  return results.filter(Boolean);
}

export default {...featureConfigs};
