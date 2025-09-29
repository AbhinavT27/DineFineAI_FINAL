import fs from 'fs';
import path from 'path';

// Simple translation mappings for common terms
const translations: Record<string, Record<string, string>> = {
  es: {
    // Common
    "loading": "Cargando...",
    "cancel": "Cancelar",
    "save": "Guardar",
    "delete": "Eliminar",
    "edit": "Editar",
    "close": "Cerrar",
    "yes": "Sí",
    "no": "No",
    "ok": "OK",
    "error": "Error",
    "success": "Éxito",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "username": "Nombre de usuario",
    "language": "Idioma",

    // Dietary & Allergies
    "Edit Dietary Preferences and Allergies": "Editar Preferencias Dietéticas y Alergias",
    "Dietary Preferences": "Preferencias Dietéticas",
    "Select your dietary preferences to help us find the best restaurants for you": "Selecciona tus preferencias dietéticas para ayudarnos a encontrar los mejores restaurantes para ti",
    "Allergies": "Alergias",
    "Select any food allergies to help us find safe restaurants for you": "Selecciona cualquier alergia alimentaria para ayudarnos a encontrar restaurantes seguros para ti",
    "Add a custom dietary preference": "Agregar una preferencia dietética personalizada",
    "Add a custom allergy": "Agregar una alergia personalizada",
    "Add": "Agregar",

    // Saved Restaurants
    "My Saved Restaurants": "Mis Restaurantes Guardados",
    "You haven't saved any restaurants yet.": "Aún no has guardado ningún restaurante.",
    "Explore Restaurants": "Explorar Restaurantes",
    "Tagged Restaurants": "Restaurantes Etiquetados",
    "Upgrade to Premium to unlock this feature": "Actualiza a Premium para desbloquear esta función",
    "Upgrade to Premium": "Actualizar a Premium",
    "View plans": "Ver planes",

    // Feedback
    "Send App Feedback": "Enviar Comentarios de la Aplicación",
    "Send Feedback": "Enviar Comentarios",
    "Feedback Type": "Tipo de Comentario",
    "Select feedback type...": "Seleccionar tipo de comentario...",
    "Bug Report": "Reporte de Error",
    "Feature Request": "Solicitud de Función",
    "AI Recommendation Quality": "Calidad de Recomendación de IA",
    "General Feedback": "Comentarios Generales",
    "Subject": "Asunto",
    "Brief description of your feedback...": "Breve descripción de tus comentarios...",
    "Message": "Mensaje",
    "Please provide detailed feedback...": "Por favor proporciona comentarios detallados...",
    "Overall Rating (Optional)": "Calificación General (Opcional)",
    "Submit Feedback": "Enviar Comentarios",
    "Submitting...": "Enviando...",

    // Pricing
    "Choose Your Perfect Plan": "Elige Tu Plan Perfecto",
    "Start with our free plan or unlock premium features with Pro. No hidden fees, cancel anytime.": "Comienza con nuestro plan gratuito o desbloquea funciones premium con Pro. Sin tarifas ocultas, cancela en cualquier momento.",
    "Free": "Gratis",
    "forever": "para siempre",
    "Perfect for casual diners": "Perfecto para comensales ocasionales",
    "Pro": "Pro",
    "per month": "por mes",
    "For regular restaurant explorers": "Para exploradores regulares de restaurantes",
    "Premium": "Premium",
    "For food enthusiasts who want it all": "Para entusiastas de la comida que lo quieren todo",
    "WHAT'S INCLUDED": "QUÉ ESTÁ INCLUIDO",
    "NOT INCLUDED": "NO INCLUIDO",
    "Current Plan": "Plan Actual",
    "Manage Subscription": "Gestionar Suscripción",
    "Get Started": "Comenzar",
    "Most Popular": "Más Popular",
    "Start Pro Trial": "Iniciar Prueba Pro",
    "Change to Pro": "Cambiar a Pro",
    "Start Premium Trial": "Iniciar Prueba Premium",
    "Change to Premium": "Cambiar a Premium",

    // Features
    "Basic restaurant search": "Búsqueda básica de restaurantes",
    "Location-based results": "Resultados basados en ubicación",
    "Dietary filters": "Filtros dietéticos",
    "Basic allergen alerts": "Alertas básicas de alérgenos",
    "Customer reviews": "Reseñas de clientes",
    "Scrape up to 5 restaurants/day": "Extraer hasta 5 restaurantes/día",
    "5 saved restaurants total": "5 restaurantes guardados en total",
    "Restaurant comparison tool": "Herramienta de comparación de restaurantes",
    "Smart tagging system": "Sistema de etiquetado inteligente",
    "AI-powered pros & cons": "Pros y contras impulsados por IA",
    "Unlimited scraping": "Extracción ilimitada",
    "Everything in Free Plan": "Todo en Plan Gratuito",
    "Scrape up to 15 restaurants/day": "Extraer hasta 15 restaurantes/día",
    "20 saved restaurants total": "20 restaurantes guardados en total",
    "2-restaurant comparison tool": "Herramienta de comparación de 2 restaurantes",
    "Unlimited restaurant scrapes": "Extracciones de restaurantes ilimitadas",
    "Unlimited saved restaurants": "Restaurantes guardados ilimitados",
    "3-restaurant comparison tool": "Herramienta de comparación de 3 restaurantes",
    "AI-powered pros & cons review": "Reseña de pros y contras impulsada por IA",
    "Everything in Pro Plan": "Todo en Plan Pro"
  },
  fr: {
    // Common
    "loading": "Chargement...",
    "cancel": "Annuler",
    "save": "Enregistrer",
    "delete": "Supprimer",
    "edit": "Modifier",
    "close": "Fermer",
    "yes": "Oui",
    "no": "Non",
    "ok": "OK",
    "error": "Erreur",
    "success": "Succès",
    "email": "E-mail",
    "password": "Mot de passe",
    "username": "Nom d'utilisateur",
    "language": "Langue",

    // Dietary & Allergies
    "Edit Dietary Preferences and Allergies": "Modifier les Préférences Alimentaires et les Allergies",
    "Dietary Preferences": "Préférences Alimentaires",
    "Select your dietary preferences to help us find the best restaurants for you": "Sélectionnez vos préférences alimentaires pour nous aider à trouver les meilleurs restaurants pour vous",
    "Allergies": "Allergies",
    "Select any food allergies to help us find safe restaurants for you": "Sélectionnez les allergies alimentaires pour nous aider à trouver des restaurants sûrs pour vous",
    "Add a custom dietary preference": "Ajouter une préférence alimentaire personnalisée",
    "Add a custom allergy": "Ajouter une allergie personnalisée",
    "Add": "Ajouter",

    // Saved Restaurants
    "My Saved Restaurants": "Mes Restaurants Sauvegardés",
    "You haven't saved any restaurants yet.": "Vous n'avez encore sauvegardé aucun restaurant.",
    "Explore Restaurants": "Explorer les Restaurants",
    "Tagged Restaurants": "Restaurants Étiquetés",
    "Upgrade to Premium to unlock this feature": "Passez à Premium pour débloquer cette fonctionnalité",
    "Upgrade to Premium": "Passer à Premium",
    "View plans": "Voir les plans",

    // Feedback
    "Send App Feedback": "Envoyer des Commentaires sur l'Application",
    "Send Feedback": "Envoyer des Commentaires",
    "Feedback Type": "Type de Commentaire",
    "Select feedback type...": "Sélectionner le type de commentaire...",
    "Bug Report": "Rapport de Bug",
    "Feature Request": "Demande de Fonctionnalité",
    "AI Recommendation Quality": "Qualité des Recommandations IA",
    "General Feedback": "Commentaires Généraux",
    "Subject": "Sujet",
    "Brief description of your feedback...": "Brève description de vos commentaires...",
    "Message": "Message",
    "Please provide detailed feedback...": "Veuillez fournir des commentaires détaillés...",
    "Overall Rating (Optional)": "Note Globale (Optionnel)",
    "Submit Feedback": "Envoyer les Commentaires",
    "Submitting...": "Envoi en cours...",

    // Pricing
    "Choose Your Perfect Plan": "Choisissez Votre Plan Parfait",
    "Start with our free plan or unlock premium features with Pro. No hidden fees, cancel anytime.": "Commencez avec notre plan gratuit ou débloquez les fonctionnalités premium avec Pro. Pas de frais cachés, annulez à tout moment.",
    "Free": "Gratuit",
    "forever": "pour toujours",
    "Perfect for casual diners": "Parfait pour les dîneurs occasionnels",
    "Pro": "Pro",
    "per month": "par mois",
    "For regular restaurant explorers": "Pour les explorateurs réguliers de restaurants",
    "Premium": "Premium",
    "For food enthusiasts who want it all": "Pour les passionnés de cuisine qui veulent tout",
    "WHAT'S INCLUDED": "CE QUI EST INCLUS",
    "NOT INCLUDED": "NON INCLUS",
    "Current Plan": "Plan Actuel",
    "Manage Subscription": "Gérer l'Abonnement",
    "Get Started": "Commencer",
    "Most Popular": "Le Plus Populaire",
    "Start Pro Trial": "Commencer l'Essai Pro",
    "Change to Pro": "Changer pour Pro",
    "Start Premium Trial": "Commencer l'Essai Premium",
    "Change to Premium": "Changer pour Premium"
  },
  de: {
    // Common
    "loading": "Laden...",
    "cancel": "Abbrechen",
    "save": "Speichern",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "close": "Schließen",
    "yes": "Ja",
    "no": "Nein",
    "ok": "OK",
    "error": "Fehler",
    "success": "Erfolg",
    "email": "E-Mail",
    "password": "Passwort",
    "username": "Benutzername",
    "language": "Sprache",

    // Dietary & Allergies
    "Edit Dietary Preferences and Allergies": "Ernährungsvorlieben und Allergien bearbeiten",
    "Dietary Preferences": "Ernährungsvorlieben",
    "Select your dietary preferences to help us find the best restaurants for you": "Wählen Sie Ihre Ernährungsvorlieben aus, um uns zu helfen, die besten Restaurants für Sie zu finden",
    "Allergies": "Allergien",
    "Select any food allergies to help us find safe restaurants for you": "Wählen Sie Nahrungsmittelallergien aus, um uns zu helfen, sichere Restaurants für Sie zu finden",
    "Add a custom dietary preference": "Benutzerdefinierte Ernährungsvorliebe hinzufügen",
    "Add a custom allergy": "Benutzerdefinierte Allergie hinzufügen",
    "Add": "Hinzufügen",

    // Saved Restaurants
    "My Saved Restaurants": "Meine Gespeicherten Restaurants",
    "You haven't saved any restaurants yet.": "Sie haben noch keine Restaurants gespeichert.",
    "Explore Restaurants": "Restaurants Erkunden",
    "Tagged Restaurants": "Markierte Restaurants",
    "Upgrade to Premium to unlock this feature": "Auf Premium upgraden, um diese Funktion freizuschalten",
    "Upgrade to Premium": "Auf Premium upgraden",
    "View plans": "Pläne anzeigen",

    // Feedback
    "Send App Feedback": "App-Feedback Senden",
    "Send Feedback": "Feedback Senden",
    "Feedback Type": "Feedback-Typ",
    "Select feedback type...": "Feedback-Typ auswählen...",
    "Bug Report": "Fehlerbericht",
    "Feature Request": "Funktionsanfrage",
    "AI Recommendation Quality": "KI-Empfehlungsqualität",
    "General Feedback": "Allgemeines Feedback",
    "Subject": "Betreff",
    "Brief description of your feedback...": "Kurze Beschreibung Ihres Feedbacks...",
    "Message": "Nachricht",
    "Please provide detailed feedback...": "Bitte geben Sie detailliertes Feedback...",
    "Overall Rating (Optional)": "Gesamtbewertung (Optional)",
    "Submit Feedback": "Feedback Absenden",
    "Submitting...": "Wird gesendet...",

    // Pricing
    "Choose Your Perfect Plan": "Wählen Sie Ihren Perfekten Plan",
    "Start with our free plan or unlock premium features with Pro. No hidden fees, cancel anytime.": "Beginnen Sie mit unserem kostenlosen Plan oder schalten Sie Premium-Funktionen mit Pro frei. Keine versteckten Gebühren, jederzeit kündbar.",
    "Free": "Kostenlos",
    "forever": "für immer",
    "Perfect for casual diners": "Perfekt für gelegentliche Gäste",
    "Pro": "Pro",
    "per month": "pro Monat",
    "For regular restaurant explorers": "Für regelmäßige Restaurant-Entdecker",
    "Premium": "Premium",
    "For food enthusiasts who want it all": "Für Feinschmecker, die alles wollen",
    "WHAT'S INCLUDED": "WAS IST ENTHALTEN",
    "NOT INCLUDED": "NICHT ENTHALTEN",
    "Current Plan": "Aktueller Plan",
    "Manage Subscription": "Abonnement Verwalten",
    "Get Started": "Loslegen",
    "Most Popular": "Am Beliebtesten",
    "Start Pro Trial": "Pro-Test Starten",
    "Change to Pro": "Zu Pro Wechseln",
    "Start Premium Trial": "Premium-Test Starten",
    "Change to Premium": "Zu Premium Wechseln"
  }
};

// Add translations for other languages (it, pt, ja, ko, zh)
const addTranslationsForAllLanguages = () => {
  const enKeys = Object.keys(translations.es);
  
  // Italian
  translations.it = {};
  enKeys.forEach(key => {
    translations.it[key] = translations.es[key]; // Placeholder - would need actual Italian translations
  });
  
  // Portuguese  
  translations.pt = {};
  enKeys.forEach(key => {
    translations.pt[key] = translations.es[key]; // Placeholder - would need actual Portuguese translations
  });
  
  // Japanese
  translations.ja = {};
  enKeys.forEach(key => {
    translations.ja[key] = translations.es[key]; // Placeholder - would need actual Japanese translations
  });
  
  // Korean
  translations.ko = {};
  enKeys.forEach(key => {
    translations.ko[key] = translations.es[key]; // Placeholder - would need actual Korean translations
  });
  
  // Chinese
  translations.zh = {};
  enKeys.forEach(key => {
    translations.zh[key] = translations.es[key]; // Placeholder - would need actual Chinese translations
  });
};

const updateTranslationFiles = async () => {
  addTranslationsForAllLanguages();
  
  const localesDir = path.join(process.cwd(), 'src/i18n/locales');
  
  for (const [langCode, langTranslations] of Object.entries(translations)) {
    const filePath = path.join(localesDir, `${langCode}.json`);
    
    try {
      // Read existing file
      const existingContent = fs.readFileSync(filePath, 'utf8');
      const existingTranslations = JSON.parse(existingContent);
      
      // Add new keys to existing structure
      if (!existingTranslations.dietary) existingTranslations.dietary = {};
      if (!existingTranslations.savedRestaurants) existingTranslations.savedRestaurants = {};
      if (!existingTranslations.feedback) existingTranslations.feedback = {};
      if (!existingTranslations.pricing) existingTranslations.pricing = {};
      
      // Map translations to structured format
      for (const [key, value] of Object.entries(langTranslations)) {
        if (key.includes('Dietary') || key.includes('Allergies') || key.includes('preference') || key.includes('allergy')) {
          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          existingTranslations.dietary[cleanKey] = value;
        } else if (key.includes('Saved') || key.includes('Tagged') || key.includes('Explore')) {
          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          existingTranslations.savedRestaurants[cleanKey] = value;
        } else if (key.includes('Feedback') || key.includes('Bug') || key.includes('Feature') || key.includes('Rating')) {
          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          existingTranslations.feedback[cleanKey] = value;
        } else if (key.includes('Plan') || key.includes('Premium') || key.includes('Pro') || key.includes('Free') || key.includes('Subscription')) {
          const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          existingTranslations.pricing[cleanKey] = value;
        }
      }
      
      // Write updated file
      fs.writeFileSync(filePath, JSON.stringify(existingTranslations, null, 2));
      console.log(`Updated ${langCode}.json`);
      
    } catch (error) {
      console.error(`Error updating ${langCode}.json:`, error);
    }
  }
};

// Run the translation update
updateTranslationFiles().then(() => {
  console.log('Translation update complete');
}).catch(console.error);