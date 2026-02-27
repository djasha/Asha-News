import React from 'react';
import AnalysisSection from '../Home/AnalysisSection';
import DailyBriefs from '../Home/DailyBriefs';
import GazaIsraelNews from '../Home/GazaIsraelNews';
import ImageBoard from '../Home/ImageBoard';
import LatestFromAsha from '../Home/LatestFromAsha';
import StoryClusters from '../Home/StoryClusters';
import TopicCarousel from '../Home/TopicCarousel';
import TrendingGrid from '../Home/TrendingGrid';
import NewsFeed from '../NewsFeed/NewsFeed';

// Simple wrapper with customizable alignment, sizing, and classes via settings
const Section = ({ title, children, sectionClassName = '', titleAlign = 'left', titleSize = '2xl', textClassName = '', titleColorClass = '' }) => {
  const alignClass = titleAlign === 'center' ? 'text-center' : titleAlign === 'right' ? 'text-right' : 'text-left';
  const sizeClass = titleSize === 'xl' ? 'text-xl' : titleSize === '3xl' ? 'text-3xl' : titleSize === '4xl' ? 'text-4xl' : 'text-2xl';
  return (
    <section className={`mb-8 ${sectionClassName}`}>
      {title ? (
        <h2 className={`${sizeClass} font-bold ${alignClass} ${titleColorClass || 'text-text-primary-light dark:text-text-primary-dark'} mb-4`}>
          {title}
        </h2>
      ) : null}
      <div className={textClassName}>{children}</div>
    </section>
  );
};

// Map CMS component_type -> React component renderer
const COMPONENT_MAP = {
  hero: ({ settings = {} }) => (
    // For now, reuse NewsFeed hero behavior by showing a larger first article implicitly
    <NewsFeed isHomePage={true} showFilters={false} showSidebar={false} maxArticles={settings.max_articles || 20} />
  ),
  // Support legacy/sample type name
  hero_cluster: ({ settings = {} }) => (
    <NewsFeed isHomePage={true} showFilters={false} showSidebar={false} maxArticles={settings.max_articles || 20} />
  ),
  story_clusters: ({ settings = {} }) => (
    <StoryClusters articles={[]} limit={settings.limit || 6} />
  ),
  news_feed: ({ settings = {} }) => (
    <NewsFeed
      layout={settings.layout || 'adaptive'}
      showBiasOverview={settings.show_bias_overview !== false}
      showFilters={settings.show_filters !== false}
      showSidebar={
        typeof settings.show_sidebar === 'boolean'
          ? settings.show_sidebar
          : (settings.layout !== 'sidebar' ? true : false)
      }
      isHomePage={false}
      maxArticles={settings.articles_per_page || settings.max_articles || null}
      className={settings.feed_classes || ''}
    />
  ),
  daily_briefs: ({ settings = {} }) => (
    <DailyBriefs carouselEnabled={settings.carousel_enabled !== false} autoPlay={settings.auto_play !== false} interval={settings.interval || 8000} />
  ),
  trending_grid: ({ settings = {} }) => (
    <TrendingGrid columns={settings.grid_columns || 3} showImages={settings.show_images !== false} limit={settings.limit || 6} />
  ),
  image_board: ({ settings = {} }) => (
    <ImageBoard masonry={settings.masonry_layout !== false} quality={settings.image_quality || 'high'} />
  ),
  analysis_section: ({ settings = {} }) => (
    <AnalysisSection showBiasCharts={settings.show_bias_charts !== false} showFactChecks={settings.show_fact_checks !== false} />
  ),
  topic_carousel: ({ settings = {} }) => (
    <TopicCarousel autoScroll={settings.auto_scroll !== false} showArticleCount={settings.show_article_count !== false} />
  ),
  gaza_israel_news: ({ settings = {} }) => (
    <GazaIsraelNews forensicFocus={settings.forensic_focus !== false} showInvestigations={settings.show_investigations !== false} />
  ),
  latest_from_asha: ({ settings = {} }) => (
    <LatestFromAsha limit={settings.limit || 5} showTimestamps={settings.show_timestamps !== false} />
  ),
  custom_html: ({ settings = {} }) => (
    <div className={settings.css_classes || ''} dangerouslySetInnerHTML={{ __html: settings.html_content || '' }} />
  ),
  embed: ({ settings = {} }) => {
    const { src, height = 500, allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture', referrerpolicy = 'no-referrer-when-downgrade', sandbox } = settings;
    if (!src) return <div className="text-text-secondary-light dark:text-text-secondary-dark">Embed component missing 'src' URL.</div>;
    return (
      <div className="w-full">
        <iframe
          src={src}
          style={{ width: '100%', height: `${height}px`, border: 0 }}
          allow={allow}
          referrerPolicy={referrerpolicy}
          sandbox={sandbox}
          loading="lazy"
          title={settings.title || 'Embedded content'}
        />
      </div>
    );
  }
};

export default function PageBuilderRenderer({ components = [], layoutSettings = {} }) {
  // Sort components by sort_order if present
  const blocks = Array.isArray(components)
    ? [...components].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : [];

  const containerClass = layoutSettings.container_width || 'max-w-7xl';
  const bg = layoutSettings.background_color || '';
  const padding = layoutSettings.padding || 'py-8 lg:py-12';

  return (
    <div className={`${containerClass} mx-auto ${padding} ${bg}`}>
      {blocks.map((block, idx) => {
        const { component_type, type, component_name, enabled = true, settings = {} } = block;
        const resolvedType = component_type || type;
        if (!enabled) return null;
        // Merge top-level UI fields into settings for backward/forward compatibility
        const mergedSettings = {
          ...settings,
          ...(block.title_align !== undefined ? { title_align: block.title_align } : {}),
          ...(block.title_size !== undefined ? { title_size: block.title_size } : {}),
          ...(block.section_classes !== undefined ? { section_classes: block.section_classes } : {}),
          ...(block.text_classes !== undefined ? { text_classes: block.text_classes } : {}),
          ...(block.show_sidebar !== undefined ? { show_sidebar: block.show_sidebar } : {}),
          ...(block.feed_classes !== undefined ? { feed_classes: block.feed_classes } : {}),
          ...(block.src !== undefined ? { src: block.src } : {}),
          ...(block.height !== undefined ? { height: block.height } : {}),
          ...(block.allow !== undefined ? { allow: block.allow } : {}),
          ...(block.sandbox !== undefined ? { sandbox: block.sandbox } : {}),
          ...(block.referrerpolicy !== undefined ? { referrerpolicy: block.referrerpolicy } : {}),
        };
        const Renderer = COMPONENT_MAP[resolvedType];
        const title = block.title || component_name || null;
        // Color presets mapping
        const preset = mergedSettings.color_preset;
        const presetClassesMap = {
          default: '',
          light: 'bg-white dark:bg-neutral-900',
          dark: 'bg-neutral-900 text-white',
          neutral: 'bg-gray-50 dark:bg-gray-900',
          accent: 'bg-indigo-50 dark:bg-indigo-900',
          brand: 'bg-blue-50 dark:bg-blue-900',
        };
        const presetClasses = preset && presetClassesMap[preset] ? presetClassesMap[preset] : '';
        const sectionClassName = `${mergedSettings.section_classes || ''} ${presetClasses} ${mergedSettings.bg_color || ''}`.trim();
        const titleAlign = mergedSettings.title_align || 'left';
        const titleSize = mergedSettings.title_size || '2xl';
        const textClassName = `${mergedSettings.text_classes || ''} ${mergedSettings.text_color || ''}`.trim();
        const titleColorClass = mergedSettings.title_color || '';

        return (
          <Section key={`${resolvedType || 'component'}-${idx}`} title={title} sectionClassName={sectionClassName} titleAlign={titleAlign} titleSize={titleSize} textClassName={textClassName} titleColorClass={titleColorClass}>
            {Renderer ? (
              <Renderer settings={mergedSettings} />
            ) : (
              <div className="text-text-secondary-light dark:text-text-secondary-dark">
                Component '{resolvedType}' is not implemented yet.
              </div>
            )}
          </Section>
        );
      })}
    </div>
  );
}
