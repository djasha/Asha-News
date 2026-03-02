import React from 'react';

const DEFAULT_ISSUE_URL = '/contact';

const appendQuery = (base, params) => {
  const joiner = base.includes('?') ? '&' : '?';
  return `${base}${joiner}${params.toString()}`;
};

const ReportDocsIssueButton = ({
  context = 'documentation',
  className = '',
  label = 'Report Docs Issue',
}) => {
  const base = process.env.REACT_APP_DOCS_ISSUE_URL || DEFAULT_ISSUE_URL;

  const issueTitle = `[Docs] ${context}: `;
  const issueBody = [
    '## Documentation Issue',
    '',
    `- Context: ${context}`,
    '- Problem:',
    '- Expected behavior/content:',
    '- Suggested update:',
    '',
    '## Additional Notes',
    '',
  ].join('\n');

  const params = new URLSearchParams({
    labels: 'documentation',
    title: issueTitle,
    body: issueBody,
  });

  const href = appendQuery(base, params);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-md border border-border-light bg-surface-light px-3 py-2 text-sm font-medium text-text-primary-light hover:bg-background-light dark:border-border-dark dark:bg-surface-dark dark:text-text-primary-dark dark:hover:bg-background-dark ${className}`}
    >
      {label}
    </a>
  );
};

export default ReportDocsIssueButton;
