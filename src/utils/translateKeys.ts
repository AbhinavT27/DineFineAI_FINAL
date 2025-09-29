import fs from 'fs';
import path from 'path';

const translations = {
  es: {
    // Dietary & Allergies
    "editTitle": "Editar Preferencias Dietéticas y Alergias",
    "preferences": "Preferencias Dietéticas",
    "preferencesDesc": "Selecciona tus preferencias dietéticas para ayudarnos a encontrar los mejores restaurantes para ti",
    "allergies": "Alergias",
    "allergiesDesc": "Selecciona cualquier alergia alimentaria para ayudarnos a encontrar restaurantes seguros para ti",
    "addCustomPreference": "Agregar una preferencia dietética personalizada",
    "addCustomAllergy": "Agregar una alergia personalizada",
    "vegetarian": "Vegetariano",
    "vegan": "Vegano",
    "glutenFree": "Sin Gluten",
    "halal": "Halal",
    "kosher": "Kosher",
    "dairyFree": "Sin Lácteos",
    "nutFree": "Sin Frutos Secos",
    "peanuts": "Cacahuetes",
    "treeNuts": "Frutos Secos",
    "milk": "Leche",
    "eggs": "Huevos",
    "fish": "Pescado",
    "shellfish": "Mariscos",
    "wheat": "Trigo",
    "soy": "Soja",

    // Saved Restaurants
    "title": "Mis Restaurantes Guardados",
    "emptyMessage": "Aún no has guardado ningún restaurante.",
    "exploreButton": "Explorar Restaurantes",
    "taggedTitle": "Restaurantes Etiquetados",
    "upgradeMessage": "Actualiza a Premium para desbloquear esta función",
    "upgradeButton": "Actualizar a Premium",
    "viewPlans": "Ver planes",

    // Feedback
    "sendFeedback": "Enviar Comentarios",
    "sendAppFeedback": "Enviar Comentarios de la Aplicación",
    "feedbackType": "Tipo de Comentario",
    "selectFeedbackType": "Seleccionar tipo de comentario...",
    "bugReport": "Reporte de Error",
    "featureRequest": "Solicitud de Función",
    "aiQuality": "Calidad de Recomendación de IA",
    "generalFeedback": "Comentarios Generales",
    "subject": "Asunto",
    "subjectPlaceholder": "Breve descripción de tus comentarios...",
    "message": "Mensaje",
    "messagePlaceholder": "Por favor proporciona comentarios detallados...",
    "overallRating": "Calificación General (Opcional)",
    "submitFeedback": "Enviar Comentarios",
    "submitting": "Enviando...",

    // Search & Language
    "searchPlaceholder": "¿Qué se te antoja hoy? (Puedes escribir en español)",
    "languageDetected": "Idioma detectado",
    "translating": "Traduciendo búsqueda...",
    "multilingualSearch": "Búsqueda multilingüe habilitada"
  },
  fr: {
    // Dietary & Allergies
    "editTitle": "Modifier les Préférences Alimentaires et les Allergies",
    "preferences": "Préférences Alimentaires",
    "preferencesDesc": "Sélectionnez vos préférences alimentaires pour nous aider à trouver les meilleurs restaurants pour vous",
    "allergies": "Allergies",
    "allergiesDesc": "Sélectionnez les allergies alimentaires pour nous aider à trouver des restaurants sûrs pour vous",
    "addCustomPreference": "Ajouter une préférence alimentaire personnalisée",
    "addCustomAllergy": "Ajouter une allergie personnalisée",
    "vegetarian": "Végétarien",
    "vegan": "Végétalien",
    "glutenFree": "Sans Gluten",
    "halal": "Halal",
    "kosher": "Casher",
    "dairyFree": "Sans Produits Laitiers",
    "nutFree": "Sans Noix",
    "peanuts": "Arachides",
    "treeNuts": "Noix",
    "milk": "Lait",
    "eggs": "Œufs",
    "fish": "Poisson",
    "shellfish": "Fruits de Mer",
    "wheat": "Blé",
    "soy": "Soja",

    // Saved Restaurants
    "title": "Mes Restaurants Sauvegardés",
    "emptyMessage": "Vous n'avez encore sauvegardé aucun restaurant.",
    "exploreButton": "Explorer les Restaurants",
    "taggedTitle": "Restaurants Étiquetés",
    "upgradeMessage": "Passez à Premium pour débloquer cette fonctionnalité",
    "upgradeButton": "Passer à Premium",
    "viewPlans": "Voir les plans",

    // Feedback
    "sendFeedback": "Envoyer des Commentaires",
    "sendAppFeedback": "Envoyer des Commentaires sur l'Application",
    "feedbackType": "Type de Commentaire",
    "selectFeedbackType": "Sélectionner le type de commentaire...",
    "bugReport": "Rapport de Bug",
    "featureRequest": "Demande de Fonctionnalité",
    "aiQuality": "Qualité des Recommandations IA",
    "generalFeedback": "Commentaires Généraux",
    "subject": "Sujet",
    "subjectPlaceholder": "Brève description de vos commentaires...",
    "message": "Message",
    "messagePlaceholder": "Veuillez fournir des commentaires détaillés...",
    "overallRating": "Note Globale (Optionnel)",
    "submitFeedback": "Envoyer les Commentaires",
    "submitting": "Envoi en cours...",

    // Search & Language
    "searchPlaceholder": "Que désirez-vous aujourd'hui ? (Vous pouvez écrire en français)",
    "languageDetected": "Langue détectée",
    "translating": "Traduction de la recherche...",
    "multilingualSearch": "Recherche multilingue activée"
  },
  de: {
    // Dietary & Allergies
    "editTitle": "Ernährungsvorlieben und Allergien bearbeiten",
    "preferences": "Ernährungsvorlieben",
    "preferencesDesc": "Wählen Sie Ihre Ernährungsvorlieben aus, um die besten Restaurants für Sie zu finden",
    "allergies": "Allergien",
    "allergiesDesc": "Wählen Sie Nahrungsmittelallergien aus, um sichere Restaurants für Sie zu finden",
    "addCustomPreference": "Eine individuelle Ernährungsvorliebe hinzufügen",
    "addCustomAllergy": "Eine individuelle Allergie hinzufügen",
    "vegetarian": "Vegetarisch",
    "vegan": "Vegan",
    "glutenFree": "Glutenfrei",
    "halal": "Halal",
    "kosher": "Koscher",
    "dairyFree": "Milchfrei",
    "nutFree": "Nussfrei",
    "peanuts": "Erdnüsse",
    "treeNuts": "Nüsse",
    "milk": "Milch",
    "eggs": "Eier",
    "fish": "Fisch",
    "shellfish": "Meeresfrüchte",
    "wheat": "Weizen",
    "soy": "Soja",

    // Search & Language
    "searchPlaceholder": "Worauf haben Sie heute Lust? (Sie können auf Deutsch schreiben)",
    "languageDetected": "Sprache erkannt",
    "translating": "Suche übersetzen...",
    "multilingualSearch": "Mehrsprachige Suche aktiviert"
  },
  it: {
    // Dietary & Allergies
    "editTitle": "Modifica Preferenze Alimentari e Allergie",
    "preferences": "Preferenze Alimentari",
    "preferencesDesc": "Seleziona le tue preferenze alimentari per aiutarci a trovare i migliori ristoranti per te",
    "allergies": "Allergie",
    "allergiesDesc": "Seleziona eventuali allergie alimentari per aiutarci a trovare ristoranti sicuri per te",
    "addCustomPreference": "Aggiungi una preferenza alimentare personalizzata",
    "addCustomAllergy": "Aggiungi un'allergia personalizzata",
    "vegetarian": "Vegetariano",
    "vegan": "Vegano",
    "glutenFree": "Senza Glutine",
    "halal": "Halal",
    "kosher": "Kosher",
    "dairyFree": "Senza Latticini",
    "nutFree": "Senza Noci",
    "peanuts": "Arachidi",
    "treeNuts": "Noci",
    "milk": "Latte",
    "eggs": "Uova",
    "fish": "Pesce",
    "shellfish": "Frutti di Mare",
    "wheat": "Grano",
    "soy": "Soia",

    // Search & Language
    "searchPlaceholder": "Cosa desideri oggi? (Puoi scrivere in italiano)",
    "languageDetected": "Lingua rilevata",
    "translating": "Traduzione ricerca...",
    "multilingualSearch": "Ricerca multilingue abilitata"
  },
  pt: {
    // Dietary & Allergies
    "editTitle": "Editar Preferências Alimentares e Alergias",
    "preferences": "Preferências Alimentares",
    "preferencesDesc": "Selecione suas preferências alimentares para nos ajudar a encontrar os melhores restaurantes para você",
    "allergies": "Alergias",
    "allergiesDesc": "Selecione qualquer alergia alimentar para nos ajudar a encontrar restaurantes seguros para você",
    "addCustomPreference": "Adicionar uma preferência alimentar personalizada",
    "addCustomAllergy": "Adicionar uma alergia personalizada",
    "vegetarian": "Vegetariano",
    "vegan": "Vegano",
    "glutenFree": "Sem Glúten",
    "halal": "Halal",
    "kosher": "Kosher",
    "dairyFree": "Sem Laticínios",
    "nutFree": "Sem Nozes",
    "peanuts": "Amendoins",
    "treeNuts": "Nozes",
    "milk": "Leite",
    "eggs": "Ovos",
    "fish": "Peixe",
    "shellfish": "Frutos do Mar",
    "wheat": "Trigo",
    "soy": "Soja",

    // Search & Language
    "searchPlaceholder": "O que você está desejando hoje? (Pode escrever em português)",
    "languageDetected": "Idioma detectado",
    "translating": "Traduzindo pesquisa...",
    "multilingualSearch": "Pesquisa multilíngue habilitada"
  },
  ja: {
    // Dietary & Allergies
    "editTitle": "食事の好みとアレルギーを編集",
    "preferences": "食事の好み",
    "preferencesDesc": "あなたの食事の好みを選択して、最適なレストランを見つけるお手伝いをします",
    "allergies": "アレルギー",
    "allergiesDesc": "食物アレルギーを選択して、安全なレストランを見つけるお手伝いをします",
    "addCustomPreference": "カスタム食事の好みを追加",
    "addCustomAllergy": "カスタムアレルギーを追加",
    "vegetarian": "ベジタリアン",
    "vegan": "ビーガン",
    "glutenFree": "グルテンフリー",
    "halal": "ハラル",
    "kosher": "コーシャ",
    "dairyFree": "乳製品フリー",
    "nutFree": "ナッツフリー",
    "peanuts": "ピーナッツ",
    "treeNuts": "木の実",
    "milk": "牛乳",
    "eggs": "卵",
    "fish": "魚",
    "shellfish": "甲殻類",
    "wheat": "小麦",
    "soy": "大豆",

    // Search & Language
    "searchPlaceholder": "今日は何が食べたいですか？（日本語で書けます）",
    "languageDetected": "検出された言語",
    "translating": "検索を翻訳中...",
    "multilingualSearch": "多言語検索が有効"
  },
  ko: {
    // Dietary & Allergies
    "editTitle": "식단 선호도 및 알레르기 편집",
    "preferences": "식단 선호도",
    "preferencesDesc": "최적의 레스토랑을 찾기 위해 식단 선호도를 선택하세요",
    "allergies": "알레르기",
    "allergiesDesc": "안전한 레스토랑을 찾기 위해 음식 알레르기를 선택하세요",
    "addCustomPreference": "맞춤 식단 선호도 추가",
    "addCustomAllergy": "맞춤 알레르기 추가",
    "vegetarian": "채식주의자",
    "vegan": "비건",
    "glutenFree": "글루텐 프리",
    "halal": "할랄",
    "kosher": "코셔",
    "dairyFree": "유제품 프리",
    "nutFree": "견과류 프리",
    "peanuts": "땅콩",
    "treeNuts": "견과류",
    "milk": "우유",
    "eggs": "계란",
    "fish": "생선",
    "shellfish": "조개류",
    "wheat": "밀",
    "soy": "콩",

    // Search & Language
    "searchPlaceholder": "오늘 무엇을 드시고 싶나요? (한국어로 쓸 수 있습니다)",
    "languageDetected": "감지된 언어",
    "translating": "검색 번역 중...",
    "multilingualSearch": "다국어 검색 활성화"
  },
  zh: {
    // Dietary & Allergies
    "editTitle": "编辑饮食偏好和过敏",
    "preferences": "饮食偏好",
    "preferencesDesc": "选择您的饮食偏好，帮助我们为您找到最佳餐厅",
    "allergies": "过敏",
    "allergiesDesc": "选择任何食物过敏，帮助我们为您找到安全的餐厅",
    "addCustomPreference": "添加自定义饮食偏好",
    "addCustomAllergy": "添加自定义过敏",
    "vegetarian": "素食主义者",
    "vegan": "纯素食主义者",
    "glutenFree": "无麸质",
    "halal": "清真",
    "kosher": "犹太洁食",
    "dairyFree": "无乳制品",
    "nutFree": "无坚果",
    "peanuts": "花生",
    "treeNuts": "坚果",
    "milk": "牛奶",
    "eggs": "鸡蛋",
    "fish": "鱼",
    "shellfish": "贝类",
    "wheat": "小麦",
    "soy": "大豆",

    // Search & Language
    "searchPlaceholder": "今天想吃什么？（可以用中文写）",
    "languageDetected": "检测到的语言",
    "translating": "翻译搜索中...",
    "multilingualSearch": "多语言搜索已启用"
  }
};

export const updateAllLanguageFiles = () => {
  const localesDir = path.join(process.cwd(), 'src/i18n/locales');
  
  Object.entries(translations).forEach(([langCode, langTranslations]) => {
    const filePath = path.join(localesDir, `${langCode}.json`);
    
    try {
      const existingContent = fs.readFileSync(filePath, 'utf8');
      const existingTranslations = JSON.parse(existingContent);
      
      // Update dietary section
      if (!existingTranslations.dietary) existingTranslations.dietary = {};
      Object.entries(langTranslations).forEach(([key, value]) => {
        if (['editTitle', 'preferences', 'preferencesDesc', 'allergies', 'allergiesDesc', 'addCustomPreference', 'addCustomAllergy', 'vegetarian', 'vegan', 'glutenFree', 'halal', 'kosher', 'dairyFree', 'nutFree', 'peanuts', 'treeNuts', 'milk', 'eggs', 'fish', 'shellfish', 'wheat', 'soy'].includes(key)) {
          existingTranslations.dietary[key] = value;
        }
      });
      
      // Update savedRestaurants section
      if (!existingTranslations.savedRestaurants) existingTranslations.savedRestaurants = {};
      Object.entries(langTranslations).forEach(([key, value]) => {
        if (['title', 'emptyMessage', 'exploreButton', 'taggedTitle', 'upgradeMessage', 'upgradeButton', 'viewPlans'].includes(key)) {
          existingTranslations.savedRestaurants[key] = value;
        }
      });
      
      // Update feedback section
      if (!existingTranslations.feedback) existingTranslations.feedback = {};
      Object.entries(langTranslations).forEach(([key, value]) => {
        if (['sendFeedback', 'sendAppFeedback', 'feedbackType', 'selectFeedbackType', 'bugReport', 'featureRequest', 'aiQuality', 'generalFeedback', 'subject', 'subjectPlaceholder', 'message', 'messagePlaceholder', 'overallRating', 'submitFeedback', 'submitting'].includes(key)) {
          existingTranslations.feedback[key] = value;
        }
      });

      // Update search section with multilingual support
      if (!existingTranslations.search) existingTranslations.search = {};
      Object.entries(langTranslations).forEach(([key, value]) => {
        if (['searchPlaceholder', 'languageDetected', 'translating', 'multilingualSearch'].includes(key)) {
          existingTranslations.search[key] = value;
        }
      });
      
      fs.writeFileSync(filePath, JSON.stringify(existingTranslations, null, 2));
      console.log(`Updated ${langCode}.json with new translations`);
      
    } catch (error) {
      console.error(`Error updating ${langCode}.json:`, error);
    }
  });
};