import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface RAGMetadata {
  source: 'rag' | 'manual' | 'clipboard';
  generatedAt?: string;
  prompt?: string;
  model?: string;
  duration?: string;
  tone?: string;
}

interface ScriptContextType {
  // Script state
  script: string;
  
  // Script update methods
  setScript: (script: string) => void;
  setScriptFromRAG: (script: string, metadata?: Partial<RAGMetadata>) => void;
  
  // Storage methods
  loadScript: () => Promise<void>;
  saveScript: (scriptToSave?: string) => Promise<void>;
  clearScript: () => void;
  
  // RAG metadata
  isRAGGenerated: boolean;
  ragMetadata?: RAGMetadata;
  
  // Loading state
  isLoading: boolean;
}

const SCRIPT_STORAGE_KEY = 'teleprompter_script';
const RAG_METADATA_KEY = 'teleprompter_rag_metadata';

const ScriptContext = createContext<ScriptContextType | undefined>(undefined);

interface ScriptProviderProps {
  children: ReactNode;
}

export const ScriptProvider: React.FC<ScriptProviderProps> = ({ children }) => {
  const [script, setScriptState] = useState<string>('');
  const [isRAGGenerated, setIsRAGGenerated] = useState<boolean>(false);
  const [ragMetadata, setRagMetadata] = useState<RAGMetadata | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load script on mount
  useEffect(() => {
    loadScript();
  }, []);

  // Auto-save script whenever it changes (debounced)
  useEffect(() => {
    if (script && !isLoading) {
      const timeoutId = setTimeout(() => {
        saveScript(script);
      }, 500); // Debounce 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [script, isLoading]);

  const loadScript = async () => {
    try {
      setIsLoading(true);
      const savedScript = await AsyncStorage.getItem(SCRIPT_STORAGE_KEY);
      const savedMetadata = await AsyncStorage.getItem(RAG_METADATA_KEY);
      
      if (savedScript) {
        setScriptState(savedScript);
      }
      
      if (savedMetadata) {
        try {
          const metadata = JSON.parse(savedMetadata);
          setRagMetadata(metadata);
          setIsRAGGenerated(metadata.source === 'rag');
        } catch (parseError) {
          console.log('Error parsing RAG metadata:', parseError);
        }
      }
    } catch (error) {
      console.error('Error loading script from AsyncStorage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveScript = async (scriptToSave?: string) => {
    try {
      const textToSave = scriptToSave !== undefined ? scriptToSave : script;
      
      if (textToSave) {
        await AsyncStorage.setItem(SCRIPT_STORAGE_KEY, textToSave);
        console.log('Script saved to AsyncStorage');
      }
      
      if (ragMetadata) {
        await AsyncStorage.setItem(RAG_METADATA_KEY, JSON.stringify(ragMetadata));
        console.log('RAG metadata saved to AsyncStorage');
      }
    } catch (error) {
      console.error('Error saving script to AsyncStorage:', error);
    }
  };

  const setScript = (newScript: string) => {
    setScriptState(newScript);
    setIsRAGGenerated(false);
    setRagMetadata({
      source: 'manual',
    });
    console.log('Script updated manually');
  };

  const setScriptFromRAG = (newScript: string, metadata?: Partial<RAGMetadata>) => {
    setScriptState(newScript);
    setIsRAGGenerated(true);
    
    const fullMetadata: RAGMetadata = {
      source: 'rag',
      generatedAt: new Date().toISOString(),
      ...metadata,
    };
    
    setRagMetadata(fullMetadata);
    console.log('Script set from RAG:', fullMetadata);
  };

  const clearScript = () => {
    setScriptState('');
    setIsRAGGenerated(false);
    setRagMetadata(undefined);
    
    // Clear from AsyncStorage
    AsyncStorage.removeItem(SCRIPT_STORAGE_KEY).catch(console.error);
    AsyncStorage.removeItem(RAG_METADATA_KEY).catch(console.error);
    
    console.log('Script cleared');
  };

  const value: ScriptContextType = {
    script,
    setScript,
    setScriptFromRAG,
    loadScript,
    saveScript,
    clearScript,
    isRAGGenerated,
    ragMetadata,
    isLoading,
  };

  return (
    <ScriptContext.Provider value={value}>
      {children}
    </ScriptContext.Provider>
  );
};

export const useScript = (): ScriptContextType => {
  const context = useContext(ScriptContext);
  if (context === undefined) {
    throw new Error('useScript must be used within a ScriptProvider');
  }
  return context;
};

