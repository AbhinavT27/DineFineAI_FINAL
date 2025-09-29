import { updateAllLanguageFiles } from './translateKeys';

export const runTranslationUpdate = async () => {
  try {
    updateAllLanguageFiles();
    console.log('All translation files updated successfully');
  } catch (error) {
    console.error('Error updating translations:', error);
  }
};