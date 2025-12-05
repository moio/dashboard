import HostedProvidersPagePo from '@/cypress/e2e/po/pages/cluster-manager/hosted-providers.po';
import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import ClusterManagerCreatePagePo from '@/cypress/e2e/po/edit/provisioning.cattle.io.cluster/create/cluster-create.po';

/**
 * Tests for the kev2-operators setting that controls which hosted providers are shown.
 * This replaces the old kontainer driver functionality for built-in hosted providers (AKS, EKS, GKE).
 * See https://github.com/rancher/dashboard/issues/15391 for the implementation details.
 */
describe('Hosted Providers (kev2 setting)', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const providersPage = new HostedProvidersPagePo();
  const clusterList = new ClusterManagerListPagePo();
  const aksProvider = 'Azure AKS';

  before(() => {
    cy.login();
  });

  it('should show the hosted providers list page', () => {
    HostedProvidersPagePo.navTo();
    providersPage.waitForPage();
    providersPage.list().resourceTable().sortableTable().checkVisible();
    providersPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
  });

  it('deactivating a hosted provider via kev2 setting should hide its card from the cluster creation page', () => {
    // Navigate to hosted providers page
    HostedProvidersPagePo.navTo();
    providersPage.waitForPage();

    // Setup intercept for the settings update
    cy.intercept('PUT', '/v1/management.cattle.io.settings/kev2-operators').as('updateSetting');

    // Verify AKS provider is in Active state initially (it should be active by default)
    providersPage.list().details(aksProvider, 1).should('contain', 'Active');

    // Deactivate the AKS provider using the action menu
    providersPage.list().actionMenu(aksProvider).getMenuItem('Deactivate').click();

    // Wait for the setting to be updated
    cy.wait('@updateSetting').its('response.statusCode').should('eq', 200);

    // Verify the provider is now inactive
    providersPage.list().details(aksProvider, 1).should('contain', 'Inactive');

    // Navigate to cluster creation page and verify AKS card is not shown
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    const clusterCreatePage = new ClusterManagerCreatePagePo();

    clusterCreatePage.gridElementExistanceByName(aksProvider, 'not.exist');

    // Re-enable the AKS provider
    HostedProvidersPagePo.navTo();
    providersPage.waitForPage();

    // Activate the provider
    providersPage.list().actionMenu(aksProvider).getMenuItem('Activate').click();

    // Wait for the setting to be updated
    cy.wait('@updateSetting').its('response.statusCode').should('eq', 200);

    // Verify the provider is now active again
    providersPage.list().details(aksProvider, 1).should('contain', 'Active');

    // Navigate to cluster creation page and verify AKS card is shown
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();
    clusterCreatePage.gridElementExistanceByName(aksProvider, 'exist');
  });

  it('kev2 setting should control visibility of hosted provider cards on cluster creation page', () => {
    // Mock the kev2-operators setting to have an empty provider list (all disabled)
    cy.intercept('GET', '/v1/management.cattle.io.settings/kev2-operators', {
      statusCode: 200,
      body:       {
        id:    'kev2-operators',
        value: JSON.stringify([
          { name: 'aks', active: false },
          { name: 'eks', active: false },
          { name: 'gke', active: false }
        ])
      }
    }).as('kev2Settings');

    // Navigate to cluster creation page
    clusterList.goTo();
    clusterList.checkIsCurrentPage();
    clusterList.createCluster();

    const clusterCreatePage = new ClusterManagerCreatePagePo();

    clusterCreatePage.waitForPage();

    // Wait for the intercepted setting to be requested
    cy.wait('@kev2Settings');

    // Verify no hosted provider cards are shown when all are disabled
    clusterCreatePage.gridElementExistanceByName(aksProvider, 'not.exist');
    clusterCreatePage.gridElementExistanceByName('Amazon EKS', 'not.exist');
    clusterCreatePage.gridElementExistanceByName('Google GKE', 'not.exist');
  });
});
