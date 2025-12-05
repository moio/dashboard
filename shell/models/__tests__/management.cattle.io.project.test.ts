import Project from '@shell/models/management.cattle.io.project';

describe('class Project', () => {
  describe('canCreateNamespace', () => {
    it('should return true when resourcePermissions.namespace.create exists', () => {
      const project = new Project({ resourcePermissions: { namespace: { create: '/api/v1/namespaces' } } });

      expect(project.canCreateNamespace).toBe(true);
    });

    it('should return false when resourcePermissions.namespace.create is missing', () => {
      const project = new Project({ resourcePermissions: { namespace: {} } });

      expect(project.canCreateNamespace).toBe(false);
    });

    it('should return false when resourcePermissions.namespace is missing', () => {
      const project = new Project({ resourcePermissions: {} });

      expect(project.canCreateNamespace).toBe(false);
    });

    it('should return false when resourcePermissions is missing', () => {
      const project = new Project({});

      expect(project.canCreateNamespace).toBe(false);
    });

    it('should return false when resourcePermissions is null', () => {
      const project = new Project({ resourcePermissions: null });

      expect(project.canCreateNamespace).toBe(false);
    });
  });
});
