const { createDirectus, createItem, readItems } = require('@directus/sdk');
const { addPalestineCategory } = require('./add-palestine-category');

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  throw new Error('DIRECTUS_URL and DIRECTUS_TOKEN must be set in the environment');
}

const client = createDirectus(DIRECTUS_URL).auth(DIRECTUS_TOKEN);

const palestineArticles = [
  {
    title: "Gaza Platform: Mass Displacement Documentation",
    slug: "gaza-platform-mass-displacement",
    summary: "Forensic Architecture documents the mass displacement of Palestinian civilians carried out by the Israeli military in the Gaza Strip since October 7, 2023, identifying three overlapping phases in its execution.",
    content: `
# Gaza Platform: Mass Displacement Documentation

Since 7 October 2023, Forensic Architecture has documented the mass displacement of Palestinian civilians being carried out by the Israeli military in the Gaza Strip, and identified three overlapping phases in its execution. 

## Key Findings

Across all three phases, the Israeli military has repeatedly abused the humanitarian measures of evacuation orders, 'safe routes', and 'safe zones', and failed to comply with the laws governing their application within a wartime context. 

These patterns of systematic violence and destruction have forced Palestinian civilians from one unsafe area to the next, confirming the conclusion echoed across civilian testimonies, media reports, and assessments by the UN and other humanitarian aid organisations, that **'there is no safe place in Gaza'**.

## Evidence Base

Our comprehensive evidence base includes:
- Satellite imagery analysis
- Witness testimonies
- Video documentation
- Geospatial mapping
- Legal framework analysis

[View Full Evidence Base](https://gaza.forensic-architecture.org/databaseA)
    `,
    topic: "Palestine",
    source_name: "Forensic Architecture",
    source_url: "https://gaza.forensic-architecture.org/databaseA",
    publication_date: new Date('2023-12-20'),
    image_url: "https://forensic-architecture.org/logos/FA%20Square%20logo.png",
    political_bias: "center-left",
    factual_quality: 0.95,
    confidence_score: 0.92,
    breaking_news: false,
    featured: true,
    article_type: "investigation"
  },
  {
    title: "Lethal Aid: Documentation of Military Support",
    slug: "lethal-aid-documentation",
    summary: "Investigation into lethal aid and military support systems affecting Palestinian territories.",
    content: `
# Lethal Aid: Documentation of Military Support

This investigation examines the flow of lethal aid and military support systems that have impacted Palestinian territories.

## Investigation Overview

Forensic Architecture's investigation into lethal aid focuses on:
- Military equipment transfers
- Support systems analysis
- Impact assessment on civilian populations
- Legal implications under international law

## Methodology

Our investigation employs:
- Open source intelligence gathering
- Geospatial analysis
- Legal framework examination
- Witness testimony collection

[Source: Forensic Architecture Gaza Platform](https://gaza.forensic-architecture.org/databaseA)
    `,
    topic: "Palestine",
    source_name: "Forensic Architecture",
    source_url: "https://gaza.forensic-architecture.org/databaseA",
    publication_date: new Date('2024-07-22'),
    political_bias: "center-left",
    factual_quality: 0.93,
    confidence_score: 0.90,
    breaking_news: false,
    featured: false,
    article_type: "investigation"
  },
  {
    title: "Humanitarian Violence: Abuse of Protection Measures",
    slug: "humanitarian-violence-protection-measures",
    summary: "Analysis of how humanitarian protection measures have been systematically abused, putting Palestinian civilians at risk.",
    content: `
# Humanitarian Violence: Abuse of Protection Measures

This investigation documents the systematic abuse of humanitarian protection measures in Palestinian territories.

## Key Findings

The investigation reveals patterns of:
- Misuse of evacuation orders
- Abuse of 'safe route' designations
- Violation of 'safe zone' protections
- Non-compliance with international humanitarian law

## Impact on Civilians

These violations have resulted in:
- Forced displacement of civilian populations
- Increased vulnerability of protected persons
- Erosion of humanitarian space
- Systematic targeting of civilian infrastructure

## Legal Framework

The investigation examines violations under:
- Geneva Conventions
- Additional Protocols
- Customary International Humanitarian Law
- Rome Statute provisions

[Source: Forensic Architecture Gaza Platform](https://gaza.forensic-architecture.org/databaseA)
    `,
    topic: "Palestine",
    source_name: "Forensic Architecture",
    source_url: "https://gaza.forensic-architecture.org/databaseA",
    publication_date: new Date('2024-03-14'),
    political_bias: "center-left",
    factual_quality: 0.94,
    confidence_score: 0.91,
    breaking_news: false,
    featured: true,
    article_type: "investigation"
  },
  {
    title: "Destruction of Medical Infrastructure",
    slug: "destruction-medical-infrastructure",
    summary: "Comprehensive documentation of attacks on medical facilities and healthcare infrastructure in Palestinian territories.",
    content: `
# Destruction of Medical Infrastructure

This investigation documents the systematic destruction of medical infrastructure in Palestinian territories.

## Scope of Destruction

The investigation covers:
- Hospital attacks and damage
- Clinic destruction
- Medical equipment targeting
- Healthcare worker casualties
- Ambulance attacks

## International Law Violations

Medical facilities are protected under:
- Geneva Convention IV
- Additional Protocol I
- Customary International Humanitarian Law
- WHO health facility protection guidelines

## Impact Assessment

The destruction has resulted in:
- Collapse of healthcare systems
- Increased civilian mortality
- Denial of medical care
- Targeting of protected medical personnel

## Evidence Collection

Our methodology includes:
- Satellite imagery analysis
- Medical facility mapping
- Witness testimony collection
- Legal framework analysis

[Source: Forensic Architecture Gaza Platform](https://gaza.forensic-architecture.org/databaseA)
    `,
    topic: "Palestine",
    source_name: "Forensic Architecture",
    source_url: "https://gaza.forensic-architecture.org/databaseA",
    publication_date: new Date('2023-12-20'),
    political_bias: "center-left",
    factual_quality: 0.96,
    confidence_score: 0.93,
    breaking_news: false,
    featured: true,
    article_type: "investigation"
  },
  {
    title: "Ecocide in Gaza: Environmental Destruction Investigation",
    slug: "ecocide-gaza-environmental-destruction",
    summary: "Investigation into environmental destruction and ecocide in Gaza, examining the systematic targeting of environmental infrastructure.",
    content: `
# Ecocide in Gaza: Environmental Destruction Investigation

This investigation examines the environmental destruction in Gaza and its classification as potential ecocide.

## Environmental Impact

The investigation documents:
- Destruction of agricultural land
- Water infrastructure targeting
- Soil contamination
- Air quality degradation
- Ecosystem collapse

## Legal Framework

Examination under:
- Rome Statute ecocide provisions
- Environmental protection laws
- International humanitarian law
- Environmental crime statutes

## Long-term Consequences

The environmental destruction has resulted in:
- Loss of agricultural productivity
- Water scarcity and contamination
- Public health impacts
- Ecosystem degradation
- Climate impact

## Evidence Base

Our investigation employs:
- Environmental monitoring data
- Satellite imagery analysis
- Soil and water testing
- Agricultural impact assessment

[Source: Forensic Architecture](https://forensic-architecture.org/investigation/ecocide-in-gaza)
    `,
    topic: "Palestine",
    source_name: "Forensic Architecture",
    source_url: "https://forensic-architecture.org/investigation/ecocide-in-gaza",
    publication_date: new Date('2024-01-15'),
    political_bias: "center-left",
    factual_quality: 0.95,
    confidence_score: 0.92,
    breaking_news: false,
    featured: true,
    article_type: "investigation"
  },
  {
    title: "Design by Destruction: Spatial Analysis",
    slug: "design-by-destruction-spatial-analysis",
    summary: "Spatial analysis of destruction patterns revealing systematic targeting of civilian infrastructure.",
    content: `
# Design by Destruction: Spatial Analysis

This investigation uses spatial analysis to reveal patterns of systematic destruction in Palestinian territories.

## Methodology

Our spatial analysis includes:
- Geographic Information Systems (GIS)
- Satellite imagery comparison
- Destruction pattern mapping
- Infrastructure targeting analysis

## Key Findings

The analysis reveals:
- Systematic targeting patterns
- Infrastructure destruction sequences
- Civilian area prioritization
- Strategic destruction planning

## Visual Evidence

The investigation includes:
- Before/after satellite imagery
- 3D reconstruction models
- Interactive mapping platforms
- Temporal analysis visualizations

## Legal Implications

The patterns suggest:
- Intentional targeting of civilian objects
- Violations of distinction principle
- Disproportionate attacks
- Collective punishment

[Source: Forensic Architecture Gaza Platform](https://gaza.forensic-architecture.org/databaseA)
    `,
    topic: "Palestine",
    source_name: "Forensic Architecture",
    source_url: "https://gaza.forensic-architecture.org/databaseA",
    publication_date: new Date('2023-12-20'),
    political_bias: "center-left",
    factual_quality: 0.94,
    confidence_score: 0.91,
    breaking_news: false,
    featured: false,
    article_type: "investigation"
  }
];

async function addPalestineArticles() {
  try {
    // First ensure Palestine category exists
    const category = await addPalestineCategory();
    console.log('Palestine category ready:', category.name);

    // Add each article
    for (const articleData of palestineArticles) {
      try {
        // Check if article already exists
        const existingArticles = await client.request(readItems('articles', {
          filter: {
            slug: {
              _eq: articleData.slug
            }
          }
        }));

        if (existingArticles.length > 0) {
          console.log(`Article "${articleData.title}" already exists, skipping...`);
          continue;
        }

        // Create the article
        const article = await client.request(createItem('articles', {
          ...articleData,
          status: 'published',
          date_created: new Date(),
          date_updated: new Date()
        }));

        console.log(`Created article: "${article.title}"`);
      } catch (error) {
        console.error(`Error creating article "${articleData.title}":`, error);
      }
    }

    console.log('Palestine articles added successfully');

  } catch (error) {
    console.error('Error adding Palestine articles:', error);
    throw error;
  }
}

module.exports = { addPalestineArticles };

// Run if called directly
if (require.main === module) {
  addPalestineArticles()
    .then(() => {
      console.log('Palestine articles setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to setup Palestine articles:', error);
      process.exit(1);
    });
}
