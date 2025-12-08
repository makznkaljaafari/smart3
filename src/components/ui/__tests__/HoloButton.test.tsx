
/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HoloButton } from '../HoloButton';
import { Save } from 'lucide-react';

describe('HoloButton Component', () => {
  it('renders children correctly', () => {
    render(<HoloButton>Click Me</HoloButton>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders with an icon', () => {
    render(<HoloButton icon={Save}>Save</HoloButton>);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<HoloButton onClick={handleClick}>Clickable</HoloButton>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<HoloButton variant="primary">Primary</HoloButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-[var(--accent-500)]');
    
    rerender(<HoloButton variant="danger">Danger</HoloButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-500');
  });

  it('is disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<HoloButton onClick={handleClick} disabled>Disabled</HoloButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies additional className', () => {
    render(<HoloButton className="extra-class">Styled</HoloButton>);
    expect(screen.getByRole('button')).toHaveClass('extra-class');
  });
});
