import React from 'react';

/**
 * ArticleContent Component
 * Renders article content with proper formatting for paragraphs, headings, lists, etc.
 * Follows the Asha.News design system
 */
const ArticleContent = ({ content }) => {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Split content into paragraphs and process
  const processContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentParagraph = [];
    let key = 0;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ').trim();
        if (text) {
          elements.push(
            <p key={`p-${key++}`} className="mb-6">
              {text}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        flushParagraph();
        return;
      }

      // Heading level 1
      if (trimmed.startsWith('# ')) {
        flushParagraph();
        elements.push(
          <h1 key={`h1-${key++}`} className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mt-12 mb-6 first:mt-0">
            {trimmed.substring(2)}
          </h1>
        );
        return;
      }

      // Heading level 2
      if (trimmed.startsWith('## ')) {
        flushParagraph();
        elements.push(
          <h2 key={`h2-${key++}`} className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mt-10 mb-5">
            {trimmed.substring(3)}
          </h2>
        );
        return;
      }

      // Heading level 3
      if (trimmed.startsWith('### ')) {
        flushParagraph();
        elements.push(
          <h3 key={`h3-${key++}`} className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mt-8 mb-4">
            {trimmed.substring(4)}
          </h3>
        );
        return;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        flushParagraph();
        elements.push(
          <blockquote key={`quote-${key++}`} className="border-l-4 border-primary-600 dark:border-primary-400 pl-4 py-2 my-6 italic text-text-secondary-light dark:text-text-secondary-dark bg-surface-elevated-light dark:bg-surface-elevated-dark rounded-r">
            {trimmed.substring(2)}
          </blockquote>
        );
        return;
      }

      // Unordered list item
      if (trimmed.match(/^[-*•]\s/)) {
        flushParagraph();
        const text = trimmed.replace(/^[-*•]\s/, '');
        elements.push(
          <li key={`li-${key++}`} className="ml-6 mb-2 list-disc">
            {text}
          </li>
        );
        return;
      }

      // Ordered list item
      if (trimmed.match(/^\d+\.\s/)) {
        flushParagraph();
        const text = trimmed.replace(/^\d+\.\s/, '');
        elements.push(
          <li key={`li-${key++}`} className="ml-6 mb-2 list-decimal">
            {text}
          </li>
        );
        return;
      }

      // Horizontal rule
      if (trimmed.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        flushParagraph();
        elements.push(
          <hr key={`hr-${key++}`} className="my-8 border-t border-gray-200 dark:border-gray-700" />
        );
        return;
      }

      // Regular paragraph text
      currentParagraph.push(trimmed);
    });

    // Flush any remaining paragraph
    flushParagraph();

    return elements;
  };

  // Process inline markdown (bold, italic, links)
  const processInlineMarkdown = (text) => {
    if (typeof text !== 'string') return text;

    // Process links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">${linkText}</a>`;
    });

    // Process bold **text** or __text__
    text = text.replace(/(\*\*|__)([^*_]+)\1/g, '<strong class="font-bold">$2</strong>');

    // Process italic *text* or _text_
    text = text.replace(/(\*|_)([^*_]+)\1/g, '<em class="italic">$2</em>');

    // Process inline code `code`
    text = text.replace(/`([^`]+)`/g, '<code class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">$1</code>');

    return text;
  };

  const elements = processContent(content);

  // Post-process to add inline markdown
  const processedElements = elements.map((element, index) => {
    if (element.type === 'p' || element.type === 'li') {
      const textContent = element.props.children;
      if (typeof textContent === 'string') {
        const processed = processInlineMarkdown(textContent);
        // Remove children prop when using dangerouslySetInnerHTML
        const { children, ...restProps } = element.props;
        return React.createElement(element.type, {
          ...restProps,
          key: element.key,
          dangerouslySetInnerHTML: { __html: processed }
        });
      }
    }
    return element;
  });

  return (
    <div className="article-content space-y-4">
      {processedElements}
    </div>
  );
};

export default ArticleContent;
