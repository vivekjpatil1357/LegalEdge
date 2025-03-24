'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface RegistrationContextProps {
  formData: any;
  setFormData: (data: any) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  errors: any; // Added to store errors
  setErrors: (errors: any) => void; // Added to set errors
}

const RegistrationContext = createContext<RegistrationContextProps | undefined>(
  undefined
);

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};

interface RegistrationProviderProps {
  children: ReactNode;
}

export const RegistrationProvider: React.FC<RegistrationProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({}); // Store errors for each step

  const goToNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const goToPreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const contextValue = {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    errors, // Make errors available
    setErrors, // Function to set errors
  };

  return (
    <RegistrationContext.Provider value={contextValue}>
      {children}
    </RegistrationContext.Provider>
  );
};