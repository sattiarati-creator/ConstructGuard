import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../components/Modal';

describe('Modal Component', () => {
  it('renders modal when isOpen is true', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Title">
        <p>Modal body content</p>
      </Modal>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('does not render modal when isOpen is false', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={false} onClose={handleClose} title="Test Title">
        <p>Modal body content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Title">
        <p>Content</p>
      </Modal>
    );

    const closeBtn = screen.getByLabelText('Close modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
