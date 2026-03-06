
import { useState, useCallback } from 'react';

export const INDIAN_LANGUAGES = [
  { code: 'hi-t-i0-und', label: 'Hindi', active: true, font: 'Tiro Devanagari Hindi' },
  { code: 'bn-t-i0-und', label: 'Bengali', active: true, font: 'Tiro Bangla' },
  { code: 'gu-t-i0-und', label: 'Gujarati', active: true, font: 'Noto Sans Gujarati' },
  { code: 'kn-t-i0-und', label: 'Kannada', active: true, font: 'Tiro Kannada' },
  { code: 'ml-t-i0-und', label: 'Malayalam', active: true, font: 'Tiro Malayalam' },
  { code: 'mr-t-i0-und', label: 'Marathi', active: true, font: 'Tiro Devanagari Hindi' },
  { code: 'ne-t-i0-und', label: 'Nepali', active: true, font: 'Tiro Devanagari Hindi' },
  { code: 'pa-t-i0-und', label: 'Punjabi', active: true, font: 'Tiro Gurmukhi' },
  { code: 'sa-t-i0-und', label: 'Sanskrit', active: true, font: 'Tiro Devanagari Hindi' },
  { code: 'ta-t-i0-und', label: 'Tamil', active: true, font: 'Tiro Tamil' },
  { code: 'te-t-i0-und', label: 'Telugu', active: true, font: 'Tiro Telugu' },
  { code: 'ur-t-i0-und', label: 'Urdu', active: true, font: 'Noto Nastaliq Urdu' },
];

export const useTransliteration = (
  enabled: boolean,
  languageCode: string = 'hi-t-i0-und'
) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWord, setCurrentWord] = useState('');

  const fetchSuggestions = useCallback(async (word: string) => {
    if (!word || !enabled) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://inputtools.google.com/request?text=${encodeURIComponent(
          word
        )}&itc=${languageCode}&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`
      );
      const data = await response.json();
      
      if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
        setSuggestions(data[1][0][1]);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching transliteration:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, languageCode]);

  return {
    suggestions,
    loading,
    fetchSuggestions,
    setSuggestions,
    currentWord,
    setCurrentWord
  };
};

export const translateText = async (text: string, targetLanguageCode: string) => {
  if (!text.trim()) return text;
  
  // Extract standard ISO code from input tools code (e.g. 'hi-t-i0-und' -> 'hi')
  const shortCode = targetLanguageCode.split('-')[0];
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${shortCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data && data[0]) {
      return data[0].map((item: any) => item[0]).join('');
    }
    return text;
  } catch (err) {
    console.error("Translation error:", err);
    return text;
  }
};
