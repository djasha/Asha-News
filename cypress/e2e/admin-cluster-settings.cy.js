describe('Admin Cluster Settings E2E', () => {
  beforeEach(() => {
    // Mock admin settings endpoint
    cy.intercept('GET', '/api/admin-settings', {
      success: true,
      settings: {
        clusterSettings: {
          enabled: true,
          similarityThreshold: 0.75,
          maxClusterSize: 20,
          minArticlesToPublish: 2,
          saveToDirectus: true,
          keepIndividualArticles: true,
          showBiasCharts: true,
          showPerspectives: true,
          showQA: true,
          showKeyFacts: true,
          sourcesPerCluster: 6,
          summaryMaxChars: 500
        }
      }
    }).as('getSettings');

    // Mock cluster detail
    cy.intercept('GET', '/api/clusters/*', {
      success: true,
      data: {
        id: 'test-cluster',
        cluster_title: 'Test Cluster Title',
        cluster_summary: 'This is a test summary that is long enough to be clamped when the setting is low.',
        article_count: 5,
        topic_category: 'general',
        updated_at: new Date().toISOString(),
        bias_distribution: { left: 30, center: 40, right: 30 },
        key_facts: ['Fact 1', 'Fact 2'],
        suggested_questions: ['Question 1?'],
        suggested_answers: ['Answer 1'],
        articles: [
          { id: 'a1', title: 'Article 1', source_name: 'Source 1', political_bias: 'center', similarity_score: 0.9, published_at: new Date().toISOString() },
          { id: 'a2', title: 'Article 2', source_name: 'Source 2', political_bias: 'left', similarity_score: 0.8, published_at: new Date().toISOString() },
          { id: 'a3', title: 'Article 3', source_name: 'Source 3', political_bias: 'right', similarity_score: 0.7, published_at: new Date().toISOString() }
        ]
      }
    }).as('getCluster');
  });

  it('toggles bias chart, key facts, and Q&A sections based on admin settings', () => {
    // Visit story page with default settings (all enabled)
    cy.visit('/story/test-cluster');
    cy.wait('@getSettings');
    cy.wait('@getCluster');

    // Verify all sections are visible
    cy.contains('Source Perspectives').should('be.visible');
    cy.contains('Key Facts').should('be.visible');
    cy.contains('Questions & Answers').should('be.visible');

    // Update settings to hide sections
    cy.intercept('GET', '/api/admin-settings', {
      success: true,
      settings: {
        clusterSettings: {
          enabled: true,
          similarityThreshold: 0.75,
          maxClusterSize: 20,
          minArticlesToPublish: 2,
          saveToDirectus: true,
          keepIndividualArticles: true,
          showBiasCharts: false,
          showPerspectives: false,
          showQA: false,
          showKeyFacts: false,
          sourcesPerCluster: 2,
          summaryMaxChars: 30
        }
      }
    }).as('getSettingsUpdated');

    // Reload page with new settings
    cy.reload();
    cy.wait('@getSettingsUpdated');
    cy.wait('@getCluster');

    // Verify sections are hidden
    cy.contains('Source Perspectives').should('not.exist');
    cy.contains('Key Facts').should('not.exist');
    cy.contains('Questions & Answers').should('not.exist');

    // Verify summary is clamped (ends with ellipsis)
    cy.get('p').contains('This is a test summary').should('contain', '…');

    // Verify only 2 sources shown
    cy.contains('All Sources').parent().parent().within(() => {
      cy.contains('Article 1').should('be.visible');
      cy.contains('Article 2').should('be.visible');
      cy.contains('Article 3').should('not.exist');
    });
  });

  it('changes settings via admin UI and reflects on story pages', () => {
    // Visit admin settings page
    cy.visit('/admin/settings');
    cy.wait('@getSettings');

    // Navigate to Clustering & Stories tab
    cy.contains('Clustering & Stories').click();

    // Change settings
    cy.get('input[type="checkbox"]').contains('Show Bias Charts').parent().find('input').uncheck();
    cy.get('input[type="checkbox"]').contains('Show Key Facts').parent().find('input').uncheck();
    cy.get('input[type="number"]').filter('[value="6"]').clear().type('2');
    cy.get('input[type="number"]').filter('[value="500"]').clear().type('50');

    // Mock save endpoint
    cy.intercept('POST', '/api/admin-settings', {
      success: true,
      message: 'Settings saved successfully'
    }).as('saveSettings');

    // Save settings
    cy.contains('Save Settings').click();
    cy.wait('@saveSettings');

    // Verify success message
    cy.contains('Settings saved successfully').should('be.visible');

    // Navigate to a story page and verify changes
    cy.visit('/story/test-cluster');
    cy.wait('@getCluster');

    // Verify changes are reflected
    cy.contains('Source Perspectives').should('not.exist');
    cy.contains('Key Facts').should('not.exist');
  });
});
