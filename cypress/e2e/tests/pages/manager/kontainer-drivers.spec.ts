import KontainerDriversPagePo from '@/cypress/e2e/po/pages/cluster-manager/kontainer-drivers.po';

/**
 * Tests for Kontainer Drivers (legacy kev1).
 *
 * Note: Tests for built-in hosted providers (AKS, EKS, GKE) visibility have been moved to
 * hosted-providers.spec.ts as they are now controlled by the kev2-operators setting.
 * See https://github.com/rancher/dashboard/issues/15391 for implementation details.
 *
 * This file retains tests for third-party kontainer drivers (e.g., Linode LKE).
 */
describe('Kontainer Drivers', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const driversPage = new KontainerDriversPagePo();
  const linodeDriver = 'Linode LKE';

  before(() => {
    cy.login();
  });

  it('should show the cluster drivers list page', () => {
    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.title().should('be.visible');
    driversPage.list().resourceTable().sortableTable().checkVisible();
    driversPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
  });

  // Skipping until issue resolved: https://github.com/rancher/dashboard/issues/15782
  // it('can refresh kubernetes metadata', () => {
  //   KontainerDriversPagePo.navTo();
  //   driversPage.waitForPage();
  //   cy.intercept('POST', '/v3/kontainerdrivers?action=refresh').as('refresh');
  //   driversPage.refreshKubMetadata().click({ force: true });
  //   cy.wait('@refresh', EXTRA_LONG_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
  // });

  it('will show error if could not activate driver', () => {
    cy.intercept('POST', '/v3/kontainerDrivers/linodekubernetesengine?action=activate', {
      statusCode: 500,
      body:       { message: `Could not activate driver` }
    }).as('activationError');

    KontainerDriversPagePo.navTo();
    driversPage.waitForPage();
    driversPage.list().details(linodeDriver, 1).should('contain', 'Inactive');

    driversPage.list().actionMenu(linodeDriver).getMenuItem('Activate').click();

    cy.wait('@activationError').then(() => {
      cy.get('.growl-text').contains('Could not activate driver').should('be.visible');
    });
  });
});
