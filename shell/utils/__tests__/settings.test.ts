import { isProviderEnabled } from '@shell/utils/settings';
import { SETTING } from '@shell/config/settings';
import { ClusterProvisionerContext } from '@shell/core/types';

describe('fx: isProviderEnabled', () => {
  // Helper to create a mock context
  const createMockContext = (kev2SettingValue: string | null): ClusterProvisionerContext => {
    return {
      getters: {
        'management/byId': (_type: string, _id: string) => {
          if (_id === SETTING.KEV2_OPERATORS) {
            return { value: kev2SettingValue };
          }

          return null;
        }
      }
    } as unknown as ClusterProvisionerContext;
  };

  describe('when kev2-operators setting is not defined', () => {
    it('should return true for any provider (enabled by default)', () => {
      const context = createMockContext(null);

      expect(isProviderEnabled(context, 'aks')).toBe(true);
      expect(isProviderEnabled(context, 'eks')).toBe(true);
      expect(isProviderEnabled(context, 'gke')).toBe(true);
      expect(isProviderEnabled(context, 'unknown-provider')).toBe(true);
    });
  });

  describe('when kev2-operators setting is an empty array', () => {
    it('should return true for any provider (enabled by default)', () => {
      const context = createMockContext('[]');

      expect(isProviderEnabled(context, 'aks')).toBe(true);
      expect(isProviderEnabled(context, 'eks')).toBe(true);
      expect(isProviderEnabled(context, 'gke')).toBe(true);
    });
  });

  describe('when kev2-operators setting contains provider configurations', () => {
    it('should return true when provider is explicitly active', () => {
      const settingValue = JSON.stringify([
        { name: 'aks', active: true },
        { name: 'eks', active: true },
        { name: 'gke', active: false }
      ]);
      const context = createMockContext(settingValue);

      expect(isProviderEnabled(context, 'aks')).toBe(true);
      expect(isProviderEnabled(context, 'eks')).toBe(true);
    });

    it('should return false when provider is explicitly inactive', () => {
      const settingValue = JSON.stringify([
        { name: 'aks', active: false },
        { name: 'eks', active: true },
        { name: 'gke', active: false }
      ]);
      const context = createMockContext(settingValue);

      expect(isProviderEnabled(context, 'aks')).toBe(false);
      expect(isProviderEnabled(context, 'gke')).toBe(false);
    });

    it('should return true for providers not in the setting (enabled by default)', () => {
      const settingValue = JSON.stringify([
        { name: 'aks', active: false }
      ]);
      const context = createMockContext(settingValue);

      expect(isProviderEnabled(context, 'eks')).toBe(true);
      expect(isProviderEnabled(context, 'gke')).toBe(true);
      expect(isProviderEnabled(context, 'unknown-provider')).toBe(true);
    });

    it('should handle mixed active states correctly', () => {
      const settingValue = JSON.stringify([
        { name: 'aks', active: true },
        { name: 'eks', active: false },
        { name: 'gke', active: true }
      ]);
      const context = createMockContext(settingValue);

      expect(isProviderEnabled(context, 'aks')).toBe(true);
      expect(isProviderEnabled(context, 'eks')).toBe(false);
      expect(isProviderEnabled(context, 'gke')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string provider name', () => {
      const settingValue = JSON.stringify([
        { name: 'aks', active: false }
      ]);
      const context = createMockContext(settingValue);

      expect(isProviderEnabled(context, '')).toBe(true);
    });

    it('should handle case-sensitive provider names', () => {
      const settingValue = JSON.stringify([
        { name: 'AKS', active: false }
      ]);
      const context = createMockContext(settingValue);

      // 'aks' should be enabled (not found, default true)
      expect(isProviderEnabled(context, 'aks')).toBe(true);
      // 'AKS' should be disabled (found, active: false)
      expect(isProviderEnabled(context, 'AKS')).toBe(false);
    });

    it('should handle when setting resource does not exist', () => {
      const context = { getters: { 'management/byId': () => null } } as unknown as ClusterProvisionerContext;

      expect(isProviderEnabled(context, 'aks')).toBe(true);
      expect(isProviderEnabled(context, 'eks')).toBe(true);
    });

    it('should handle when setting value is undefined', () => {
      const context = { getters: { 'management/byId': () => ({ value: undefined }) } } as unknown as ClusterProvisionerContext;

      expect(isProviderEnabled(context, 'aks')).toBe(true);
    });
  });
});
