import ExplorerProjectsNamespaces from '@shell/components/ExplorerProjectsNamespaces.vue';

describe('explorerProjectsNamespaces', () => {
  describe('canCreateNamespaceInProject', () => {
    /**
     * Test the canCreateNamespaceInProject method logic directly
     * by calling the method with the necessary context
     */
    const testCanCreateNamespaceInProject = (
      group: { rows?: Array<{ project?: { canCreateNamespace?: boolean } | null }> },
      isNamespaceCreatable: boolean
    ): boolean => {
      const context = { isNamespaceCreatable };

      // Extract the method and bind it to our test context
      const method = (ExplorerProjectsNamespaces as any).methods.canCreateNamespaceInProject;

      return method.call(context, group);
    };

    it('should return true when project has canCreateNamespace permission', () => {
      const group = { rows: [{ project: { canCreateNamespace: true } }] };

      expect(testCanCreateNamespaceInProject(group, true)).toBe(true);
      // Should also work when global isNamespaceCreatable is false
      // because project-level permission takes precedence
      expect(testCanCreateNamespaceInProject(group, false)).toBe(true);
    });

    it('should return false when project does not have canCreateNamespace permission', () => {
      const group = { rows: [{ project: { canCreateNamespace: false } }] };

      // Even when global isNamespaceCreatable is true,
      // project-level permission should return false
      expect(testCanCreateNamespaceInProject(group, true)).toBe(false);
      expect(testCanCreateNamespaceInProject(group, false)).toBe(false);
    });

    it('should use global isNamespaceCreatable check when there is no project', () => {
      const group = { rows: [{ project: null }] };

      // When schema has POST method, isNamespaceCreatable is true
      expect(testCanCreateNamespaceInProject(group, true)).toBe(true);
      // When schema does not have POST method, isNamespaceCreatable is false
      expect(testCanCreateNamespaceInProject(group, false)).toBe(false);
    });

    it('should use global isNamespaceCreatable check when project is undefined', () => {
      const group = { rows: [{}] }; // no project property

      expect(testCanCreateNamespaceInProject(group, true)).toBe(true);
      expect(testCanCreateNamespaceInProject(group, false)).toBe(false);
    });

    it('should use global isNamespaceCreatable check when rows is empty', () => {
      const group = { rows: [] }; // empty rows array

      expect(testCanCreateNamespaceInProject(group, true)).toBe(true);
      expect(testCanCreateNamespaceInProject(group, false)).toBe(false);
    });

    it('should check per-project permission independently of global permission', () => {
      // Simulating the bug scenario from issue #10094:
      // User has "Project Member" on project B and "Read Only" on project A
      // Button should only show for project B, not project A

      // Project A - read only (canCreateNamespace: false)
      const projectAGroup = { rows: [{ project: { canCreateNamespace: false } }] };

      // Project B - project member (canCreateNamespace: true)
      const projectBGroup = { rows: [{ project: { canCreateNamespace: true } }] };

      // Even when global isNamespaceCreatable is true (because user can create in some project)
      // Project A should NOT show the button
      expect(testCanCreateNamespaceInProject(projectAGroup, true)).toBe(false);
      // Project B should show the button
      expect(testCanCreateNamespaceInProject(projectBGroup, true)).toBe(true);
    });
  });
});
