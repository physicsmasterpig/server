/**
 * UI Service
 * Handles common UI operations and notifications
 */
class UiService {
  /**
   * Show a notification toast
   * @param {string} message - Notification message
   * @param {string} [type='info'] - Notification type: 'info', 'success', 'warning', 'error'
   * @param {number} [duration=3000] - Duration in milliseconds
   */
  showNotification(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
      
      // Add styles to container
      Object.assign(toastContainer.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      });
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add styles to toast
    Object.assign(toast.style, {
      backgroundColor: this._getColorForType(type),
      color: '#FFFFFF',
      padding: '12px 16px',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      minWidth: '200px',
      maxWidth: '400px'
    });
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Fade in
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toastContainer.removeChild(toast);
      }, 300);
    }, duration);
  }
  
  /**
   * Show a loading indicator
   * @param {string} [message='Loading...'] - Loading message
   * @returns {Object} - Loading indicator control object
   */
  showLoading(message = 'Loading...') {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    
    // Add styles to overlay
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '9999'
    });
    
    // Create loading content
    const content = document.createElement('div');
    content.className = 'loading-content';
    
    // Add styles to content
    Object.assign(content.style, {
      backgroundColor: '#13161B',
      border: '1px solid #22262F',
      borderRadius: '10px',
      padding: '20px 40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    });
    
    // Create spinner
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    // Add styles to spinner
    Object.assign(spinner.style, {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(127, 86, 217, 0.2)',
      borderLeftColor: '#7F56D9',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    });
    
    // Create message
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.color = '#FFFFFF';
    
    // Add keyframes for spinner
    if (!document.getElementById('loading-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'loading-spinner-style';
      style.innerHTML = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Assemble elements
    content.appendChild(spinner);
    content.appendChild(messageElement);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Return control object
    return {
      hide: () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(overlay);
        }, 300);
      },
      setMessage: (newMessage) => {
        messageElement.textContent = newMessage;
      }
    };
  }
  
  /**
   * Show a confirmation dialog
   * @param {string} message - Confirmation message
   * @param {Object} [options] - Dialog options
   * @param {string} [options.title='Confirm'] - Dialog title
   * @param {string} [options.confirmText='Yes'] - Confirm button text
   * @param {string} [options.cancelText='No'] - Cancel button text
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if canceled
   */
  showConfirmation(message, options = {}) {
    const title = options.title || 'Confirm';
    const confirmText = options.confirmText || 'Yes';
    const cancelText = options.cancelText || 'No';
    
    return new Promise((resolve) => {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';
      
      // Add styles to overlay
      Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '9999'
      });
      
      // Create dialog
      const dialog = document.createElement('div');
      dialog.className = 'dialog';
      
      // Add styles to dialog
      Object.assign(dialog.style, {
        backgroundColor: '#13161B',
        border: '1px solid #22262F',
        borderRadius: '10px',
        padding: '20px',
        width: '400px',
        maxWidth: '90%'
      });
      
      // Create dialog header
      const header = document.createElement('div');
      header.className = 'dialog-header';
      header.textContent = title;
      
      // Add styles to header
      Object.assign(header.style, {
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#FFFFFF'
      });
      
      // Create dialog content
      const content = document.createElement('div');
      content.className = 'dialog-content';
      content.textContent = message;
      
      // Add styles to content
      Object.assign(content.style, {
        marginBottom: '24px',
        color: '#FFFFFF'
      });
      
      // Create dialog actions
      const actions = document.createElement('div');
      actions.className = 'dialog-actions';
      
      // Add styles to actions
      Object.assign(actions.style, {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      });
      
      // Create cancel button
      const cancelButton = document.createElement('button');
      cancelButton.className = 'dialog-btn dialog-btn-cancel';
      cancelButton.textContent = cancelText;
      
      // Add styles to cancel button
      Object.assign(cancelButton.style, {
        backgroundColor: '#22262F',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        cursor: 'pointer'
      });
      
      // Create confirm button
      const confirmButton = document.createElement('button');
      confirmButton.className = 'dialog-btn dialog-btn-confirm';
      confirmButton.textContent = confirmText;
      
      // Add styles to confirm button
      Object.assign(confirmButton.style, {
        backgroundColor: '#7F56D9',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        padding: '10px 20px',
        cursor: 'pointer'
      });
      
      // Add event listeners
      cancelButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(false);
      });
      
      confirmButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(true);
      });
      
      // Assemble elements
      actions.appendChild(cancelButton);
      actions.appendChild(confirmButton);
      dialog.appendChild(header);
      dialog.appendChild(content);
      dialog.appendChild(actions);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      // Focus confirm button
      confirmButton.focus();
    });
  }
  
  /**
   * Format a date for display
   * @param {string|Date} date - Date to format
   * @param {Object} [options] - Format options
   * @param {boolean} [options.includeTime=false] - Whether to include time
   * @returns {string} - Formatted date string
   */
  formatDate(date, options = {}) {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const formatter = options.includeTime
      ? new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
    
    return formatter.format(dateObj);
  }
  
  /**
   * Get color for notification type
   * @param {string} type - Notification type
   * @returns {string} - CSS color
   * @private
   */
  _getColorForType(type) {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
      case 'info':
      default:
        return '#7F56D9';
    }
  }
}

// Export as a singleton
window.UiService = new UiService();
