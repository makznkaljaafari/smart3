
/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SciFiCard } from '../SciFiCard';
import { Users } from 'lucide-react';

describe('SciFiCard Component', () => {
  const defaultProps = {
    title: 'Total Users',
    value: '1,234',
    icon: Users,
    theme: 'dark' as const,
  };

  it('renders title, value, and icon correctly', () => {
    const { container } = render(<SciFiCard {...defaultProps} />);
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows positive trend indicator', () => {
    render(<SciFiCard {...defaultProps} trend={5.2} />);
    expect(screen.getByText('5.2%')).toBeInTheDocument();
    expect(screen.getByLabelText('Increase of 5.2%')).toBeInTheDocument();
  });

  it('shows negative trend indicator', () => {
    render(<SciFiCard {...defaultProps} trend={-2.1} />);
    expect(screen.getByText('2.1%')).toBeInTheDocument();
    expect(screen.getByLabelText('Decrease of 2.1%')).toBeInTheDocument();
  });

  it('renders correctly for light theme', () => {
    render(<SciFiCard {...defaultProps} theme="light" />);
    // Check for a class specific to the light theme version
    expect(screen.getByText('Total Users').parentElement?.parentElement).toHaveClass('shadow-md');
  });

  it('renders customization controls when inCustomizeMode is true', () => {
    render(<SciFiCard {...defaultProps} inCustomizeMode={true} isVisible={true} />);
    expect(screen.getByRole('button')).toBeInTheDocument(); // The eye icon button
  });
  
  it('calls onToggleVisibility when customization button is clicked', () => {
    const handleToggle = vi.fn();
    render(<SciFiCard {...defaultProps} inCustomizeMode={true} isVisible={true} onToggleVisibility={handleToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('does not show customization controls by default', () => {
    render(<SciFiCard {...defaultProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
