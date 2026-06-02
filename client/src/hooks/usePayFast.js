import { useState } from 'react';
import api from '../api/api';

/**
 * Hook for PayFast payment integration
 * Handles payment initiation, form submission, and error handling
 */
export default function usePayFast() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initiates PayFast payment
   * Sends request to backend which returns PayFast form data
   * Then creates and submits a hidden form to PayFast sandbox
   * 
   * @param {number} amount - Payment amount in cents
   * @param {string} itemName - Item/product name for payment description
   * @param {object} additionalData - Optional additional form fields
   * @returns {Promise<void>}
   */
  const initiatePayment = async (amount, itemName, additionalData = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Request payment data from backend
      const response = await api.post('/payfast/pay', {
        amount,
        item_name: itemName,
        ...additionalData,
      });

      const { url, data } = response.data;

      // Step 2: Create a hidden form with PayFast data
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;

      // Add all payment data as form fields
      Object.keys(data).forEach((key) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
      });

      // Step 3: Append to body and submit
      document.body.appendChild(form);
      form.submit();

      // The form will redirect to PayFast
      // After payment, PayFast redirects back to return_url or cancel_url
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Payment initiation failed';
      setError(errorMessage);
      console.error('Payment error:', err);
      throw new Error(errorMessage, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    loading,
    error,
    initiatePayment,
    clearError,
  };
}
