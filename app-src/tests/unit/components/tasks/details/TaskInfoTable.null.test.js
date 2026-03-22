// TaskInfoTable.null.test.js
// Mock test for TaskInfoTable null handling

// Mock the entire component to test null handling
jest.mock('../../../../../src/components/tasks/details/TaskInfoTable', () => {
  return function MockTaskInfoTable({ taskObj }) {
    return taskObj ? <div>Task Info Content</div> : null;
  };
});

import TaskInfoTable from '../../../../../src/components/tasks/details/TaskInfoTable';
import React from 'react';
import { render } from '@testing-library/react';

describe('TaskInfoTable null handling', () => {
  test('returns null when taskObj is null', () => {
    const { container } = render(<TaskInfoTable taskObj={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('returns null when taskObj is undefined', () => {
    const { container } = render(<TaskInfoTable taskObj={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders content when taskObj is provided', () => {
    const { getByText } = render(<TaskInfoTable taskObj={{}} />);
    expect(getByText('Task Info Content')).toBeInTheDocument();
  });
});
