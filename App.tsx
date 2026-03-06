import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";
import { 
  Search, 
  BookOpen, 
  Languages, 
  Loader2, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  Share2,
  ArrowLeft,
  Sprout
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LANGUAGES = [
  { code: 'English', label: 'English', native: 'English', loading: 'Loading...', wait: 'Please wait...' },
  { code: 'Hindi', label: 'हिन्दी', native: 'Hindi', loading: 'भाषा बदली जा रही है...', wait: 'कृपया कुछ क्षण प्रतीक्षा करें...' },
  { code: 'Marathi', label: 'मराठी', native: 'Marathi', loading: 'भाषा बदलली जात आहे...', wait: 'कृपया थोडा वेळ थांबा...' },
  { code: 'Kannada', label: 'ಕನ್ನಡ', native: 'Kannada', loading: 'ಭಾಷೆ ಬದಲಾಗುತ್ತಿದೆ...', wait: 'ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯ ಕಾಯಿರಿ...' },
  { code: 'Telugu', label: 'తెలుగు', native: 'Telugu', loading: 'భాష మారుతోంది...', wait: 'దయచేసి కొంచెం సేపు వేచి ఉండండి...' },
  { code: 'Tamil', label: 'தமிழ்', native: 'Tamil', loading: 'மொழி மாற்றப்படுகிறது...', wait: 'தயவுசெய்து சிறிது நேரம் காத்திருக்கவும்...' },
  { code: 'Bengali', label: 'বাংলা', native: 'Bengali', loading: 'ভাষা পরিবর্তন করা হচ্ছে...', wait: 'দয়া করে কিছুক্ষণ অপেক্ষা করুন...' },
  { code: 'Gujarati', label: 'ગુજરાતી', native: 'Gujarati', loading: 'ભાષા બદલાઈ રહી છે...', wait: 'કૃપા કરીને થોડીવાર રાહ જુઓ...' },
  { code: 'Punjabi', label: 'ਪੰਜਾਬੀ', native: 'Punjabi', loading: 'ਭਾਸ਼ਾ ਬਦਲੀ ਜਾ ਰਹੀ ਹੈ...', wait: 'ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਸਮਾਂ ਉਡੀਕ ਕਰੋ...' },
  { code: 'Malayalam', label: 'മലയാളം', native: 'Malayalam', loading: 'ഭാഷ മാറിക്കൊണ്ടിരിക്കുന്നു...', wait: 'ദയവായി കുറച്ചു സമയം കാത്തിരിക്കുക...' },
  { code: 'Odia', label: 'ଓଡ਼ିଆ', native: 'Odia', loading: 'ଭାଷା ପରିବର୍ତ୍ତନ ହେଉଛି...', wait: 'ଦୟାକରି କିଛି ସମୟ ଅପେକ୍ଷା କରନ୍ତୁ...' },
];

const POPULAR_SCHEMES = [
  "PM-Kisan Samman Nidhi",
  "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
  "Kisan Credit Card (KCC)",
  "Soil Health Card Scheme",
  "PM Krishi Sinchai Yojana",
  "Paramparagat Krishi Vikas Yojana (PKVY)",
  "National Agriculture Market (e-NAM)",
];

const UI_TRANSLATIONS: Record<string, any> = {
  English: {
    tagline: "Digital Companion",
    heroHeading: "Understand Government Schemes in Simple Language",
    heroSubheading: "Information on Government of India's agricultural schemes now in your own language. Simple, clear, and useful.",
    searchPlaceholder: "Enter scheme name (e.g., PM-Kisan)...",
    searchButton: "Get Info",
    popularSchemes: "Popular Schemes",
    backButton: "Go Back",
    cardLabel: "Scheme Information",
    listenButton: "Listen to Info",
    stopButton: "Stop Listening",
    footerText: "Kisan Sahayak - A digital initiative for rural India",
    searchAnother: "Search Another Scheme",
    disclaimer: "This information is for assistance only. Please verify on the official website or at the nearest CSC center.",
    loading: "Preparing information",
    wait: "Please wait a moment..."
  },
  Hindi: {
    tagline: "डिजिटल साथी",
    heroHeading: "सरकारी योजनाओं को आसान भाषा में समझें",
    heroSubheading: "भारत सरकार की कृषि योजनाओं की जानकारी अब आपकी अपनी भाषा में। सरल, स्पष्ट और उपयोगी।",
    searchPlaceholder: "योजना का नाम लिखें (जैसे: PM-Kisan)...",
    searchButton: "जानकारी लें",
    popularSchemes: "लोकप्रिय योजनाएं",
    backButton: "वापस जाएं",
    cardLabel: "योजना की जानकारी",
    listenButton: "जानकारी सुनें",
    stopButton: "सुनना बंद करें",
    footerText: "किसान सहायक - ग्रामीण भारत के लिए एक डिजिटल पहल",
    searchAnother: "दूसरी योजना खोजें",
    disclaimer: "यह जानकारी केवल सहायता के लिए है। कृपया आधिकारिक वेबसाइट या नजदीकी सीएससी (CSC) केंद्र पर पुष्टि करें।",
    loading: "जानकारी तैयार की जा रही है",
    wait: "कृपया कुछ क्षण प्रतीक्षा करें..."
  },
  Marathi: {
    tagline: "डिजिटल सोबती",
    heroHeading: "सरकारी योजना सोप्या भाषेत समजून घ्या",
    heroSubheading: "भारत सरकारच्या कृषी योजनांची माहिती आता तुमच्या स्वतःच्या भाषेत. सोपी, स्पष्ट आणि उपयुक्त.",
    searchPlaceholder: "योजनेचे नाव लिहा (उदा: PM-Kisan)...",
    searchButton: "माहिती मिळवा",
    popularSchemes: "लोकप्रिय योजना",
    backButton: "परत जा",
    cardLabel: "योजनेची माहिती",
    listenButton: "माहिती ऐका",
    stopButton: "ऐकणे थांबवा",
    footerText: "किसान सहायक - ग्रामीण भारतासाठी एक डिजिटल उपक्रम",
    searchAnother: "दुसरी योजना शोधा",
    disclaimer: "ही माहिती केवळ मदतीसाठी आहे. कृपया अधिकृत वेबसाइट किंवा जवळच्या सीएससी (CSC) केंद्रावर खात्री करा.",
    loading: "माहिती तयार केली जात आहे",
    wait: "कृपया थोडा वेळ थांबा..."
  },
  Kannada: {
    tagline: "ಡಿಜಿಟಲ್ ಸಂಗಾತಿ",
    heroHeading: "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ",
    heroSubheading: "ಭಾರತ ಸರ್ಕಾರದ ಕೃಷಿ ಯೋಜನೆಗಳ ಮಾಹಿತಿ ಈಗ ನಿಮ್ಮ ಸ್ವಂತ ಭಾಷೆಯಲ್ಲಿ. ಸರಳ, ಸ್ಪಷ್ಟ ಮತ್ತು ಉಪಯುಕ್ತ.",
    searchPlaceholder: "ಯೋಜನೆಯ ಹೆಸರನ್ನು ಬರೆಯಿರಿ (ಉದಾ: PM-Kisan)...",
    searchButton: "ಮಾಹಿತಿ ಪಡೆಯಿರಿ",
    popularSchemes: "ಜನಪ್ರಿಯ ಯೋಜನೆಗಳು",
    backButton: "ಹಿಂದಕ್ಕೆ ಹೋಗಿ",
    cardLabel: "ಯೋಜನೆಯ ಮಾಹಿತಿ",
    listenButton: "ಮಾಹಿತಿ ಕೇಳಿ",
    stopButton: "ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ",
    footerText: "ಕಿಸಾನ್ ಸಹಾಯಕ್ - ಗ್ರಾಮೀಣ ಭಾರತಕ್ಕಾಗಿ ಒಂದು ಡಿಜಿಟಲ್ ಉಪಕ್ರಮ",
    searchAnother: "ಮತ್ತೊಂದು ಯೋಜನೆಯನ್ನು ಹುಡುಕಿ",
    disclaimer: "ಈ ಮಾಹಿತಿಯು ಕೇವಲ ಸಹಾಯಕ್ಕಾಗಿ ಮಾತ್ರ. ದಯವಿಟ್ಟು ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಅಥವಾ ಹತ್ತಿರದ ಸಿಎಸ್‌ಸಿ (CSC) ಕೇಂದ್ರದಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
    loading: "ಮಾಹಿತಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ",
    wait: "ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯ ಕಾಯಿರಿ..."
  },
  Telugu: {
    tagline: "డిజిటల్ తోడు",
    heroHeading: "ప్రభుత్వ పథకాలను సరళమైన భాషలో అర్థం చేసుకోండి",
    heroSubheading: "భారత ప్రభుత్వ వ్యవసాయ పథకాల సమాచారం ఇప్పుడు మీ సొంత భాషలో. సరళంగా, స్పష్టంగా మరియు ఉపయోగకరంగా.",
    searchPlaceholder: "పథకం పేరు రాయండి (ఉదా: PM-Kisan)...",
    searchButton: "సమాచారం పొందండి",
    popularSchemes: "ప్రసిద్ధ పథకాలు",
    backButton: "వెనక్కి వెళ్ళండి",
    cardLabel: "పథకం సమాచారం",
    listenButton: "సమాచారం వినండి",
    stopButton: "వినడం ఆపండి",
    footerText: "కిసాన్ సహాయక్ - గ్రామీణ భారతం కోసం ఒక డిజిటల్ చొరవ",
    searchAnother: "మరో పథకాన్ని వెతకండి",
    disclaimer: "ఈ సమాచారం కేవలం సహాయం కోసం మాత్రమే. దయచేసి అధికారిక వెబ్‌సైట్ లేదా సమీపంలోని సిఎస్‌సి (CSC) కేంద్రంలో ధృవీకరించుకోండి.",
    loading: "సమాచారం సిద్ధం చేయబడుతోంది",
    wait: "దయచేసి కొంచెం సేపు వేచి ఉండండి..."
  },
  Tamil: {
    tagline: "டிஜிட்டல் துணை",
    heroHeading: "அரசு திட்டங்களை எளிய மொழியில் புரிந்து கொள்ளுங்கள்",
    heroSubheading: "இந்திய அரசின் விவசாயத் திட்டங்கள் பற்றிய தகவல்கள் இப்போது உங்கள் சொந்த மொழியில். எளிமையான, தெளிவான மற்றும் பயனுள்ள தகவல்கள்.",
    searchPlaceholder: "திட்டத்தின் பெயரை எழுதவும் (உதாரணம்: PM-Kisan)...",
    searchButton: "தகவல் பெறவும்",
    popularSchemes: "பிரபலமான திட்டங்கள்",
    backButton: "பின்னால் செல்லவும்",
    cardLabel: "திட்டத் தகவல்",
    listenButton: "தகவலைக் கேளுங்கள்",
    stopButton: "கேட்பதை நிறுத்தவும்",
    footerText: "கிசான் சகாயக் - கிராமப்புற இந்தியாவிற்கான ஒரு டிஜிட்டல் முயற்சி",
    searchAnother: "மற்றொரு திட்டத்தைத் தேடுங்கள்",
    disclaimer: "இந்தத் தகவல் உதவிக்காக மட்டுமே. அதிகாரப்பூர்வ இணையதளம் அல்லது அருகிலுள்ள சிஎஸ்சி (CSC) மையத்தில் உறுதிப்படுத்தவும்.",
    loading: "தகவல் தயார் செய்யப்படுகிறது",
    wait: "தயவுசெய்து சிறிது நேரம் காத்திருக்கவும்..."
  },
  Bengali: {
    tagline: "ডিজিটাল সাথী",
    heroHeading: "সরকারি প্রকল্পগুলি সহজ ভাষায় বুঝুন",
    heroSubheading: "ভারত সরকারের কৃষি প্রকল্পের তথ্য এখন আপনার নিজস্ব ভাষায়। সহজ, স্পষ্ট এবং দরকারী।",
    searchPlaceholder: "প্রকল্পের নাম লিখুন (যেমন: PM-Kisan)...",
    searchButton: "তথ্য নিন",
    popularSchemes: "জনপ্রিয় প্রকল্প",
    backButton: "ফিরে যান",
    cardLabel: "প্রকল্পের তথ্য",
    listenButton: "তথ্য শুনুন",
    stopButton: "শোনা বন্ধ করুন",
    footerText: "কিষাণ সহায়ক - গ্রামীণ ভারতের জন্য একটি ডিজিটাল উদ্যোগ",
    searchAnother: "অন্য প্রকল্প খুঁজুন",
    disclaimer: "এই তথ্য শুধুমাত্র সাহায্যের জন্য। অনুগ্রহ করে অফিসিয়াল ওয়েবসাইট বা নিকটস্থ সিএসসি (CSC) কেন্দ্রে নিশ্চিত করুন।",
    loading: "তথ্য প্রস্তুত করা হচ্ছে",
    wait: "দয়া করে কিছুক্ষণ অপেক্ষা করুন..."
  },
  Gujarati: {
    tagline: "ડિજિટલ સાથી",
    heroHeading: "સરકારી યોજનાઓને સરળ ભાષામાં સમજો",
    heroSubheading: "ભારત સરકારની કૃષિ યોજનાઓની માહિતી હવે તમારી પોતાની ભાષામાં. સરળ, સ્પષ્ટ અને ઉપયોગી.",
    searchPlaceholder: "યોજનાનું નામ લખો (જેમ કે: PM-Kisan)...",
    searchButton: "માહિતી મેળવો",
    popularSchemes: "લોકપ્રિય યોજનાઓ",
    backButton: "પાછા જાઓ",
    cardLabel: "યોજનાની માહિતી",
    listenButton: "માહિતી સાંભળો",
    stopButton: "સાંભળવાનું બંધ કરો",
    footerText: "કિસાન સહાયક - ગ્રામીણ ભારત માટે એક ડિજિટલ પહેલ",
    searchAnother: "બીજી યોજના શોધો",
    disclaimer: "આ માહિતી માત્ર સહાય માટે છે. કૃપા કરીને સત્તાવાર વેબસાઇટ અથવા નજીકના સીએસસી (CSC) કેન્દ્ર પર ખાતરી કરો.",
    loading: "માહિતી તૈયાર કરવામાં આવી રહી છે",
    wait: "કૃપા કરીને થોડીવાર રાહ જુઓ..."
  },
  Punjabi: {
    tagline: "ਡਿਜੀਟਲ ਸਾਥੀ",
    heroHeading: "ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਨੂੰ ਸਰਲ ਭਾਸ਼ਾ ਵਿੱਚ ਸਮਝੋ",
    heroSubheading: "ਭਾਰਤ ਸਰਕਾਰ ਦੀਆਂ ਖੇਤੀਬਾੜੀ ਯੋਜನಾਵਾਂ ਦੀ ਜਾਣਕਾਰੀ ਹੁਣ ਤੁਹਾਡੀ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ। ਸਰਲ, ਸਪੱਸ਼ਟ ਅਤੇ ਉਪਯੋਗੀ।",
    searchPlaceholder: "ਯੋਜਨਾ ਦਾ ਨਾਮ ਲਿਖੋ (ਜਿਵੇਂ: PM-Kisan)...",
    searchButton: "ਜਾਣਕਾਰੀ ਲਓ",
    popularSchemes: "ਪ੍ਰਸਿੱਧ ਯੋਜਨਾਵਾਂ",
    backButton: "ਵਾਪਸ ਜਾਓ",
    cardLabel: "ਯੋਜਨਾ ਦੀ ਜਾਣਕਾਰੀ",
    listenButton: "ਜਾਣਕਾਰੀ ਸੁਣੋ",
    stopButton: "ਸੁਣਨਾ ਬੰਦ ਕਰੋ",
    footerText: "ਕਿਸਾਨ ਸਹਾਇਕ - ਗ੍ਰਾਮੀਣ ਭਾਰਤ ਲਈ ਇੱਕ ਡਿਜੀਟਲ ਪਹਿਲ",
    searchAnother: "ਦੂਜੀ ਯੋਜನಾ ਲੱਭੋ",
    disclaimer: "ਇਹ ਜਾਣਕਾਰੀ ਸਿਰਫ ਸਹਾਇਤਾ ਲਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ ਜਾਂ ਨਜ਼ਦੀਕੀ ਸੀਐਸਸੀ (CSC) ਕੇਂਦਰ 'ਤੇ ਪੁਸ਼ਟੀ ਕਰੋ।",
    loading: "ਜਾਣਕਾਰੀ ਤਿਆਰ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ",
    wait: "ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਸਮਾਂ ਉਡੀਕ ਕਰੋ..."
  },
  Malayalam: {
    tagline: "ഡിജിറ്റൽ സഹായി",
    heroHeading: "സർക്കാർ പദ്ധതികൾ ലളിതമായ ഭാഷയിൽ മനസ്സിലാക്കുക",
    heroSubheading: "ഭാരത സർക്കാരിന്റെ കാർഷിക പദ്ധതികളെക്കുറിച്ചുള്ള വിവരങ്ങൾ ഇപ്പോൾ നിങ്ങളുടെ സ്വന്തം ഭാഷയിൽ. ലളിതവും വ്യക്തവും ഉപകാരപ്രദവും.",
    searchPlaceholder: "പദ്ധതിയുടെ പേര് എഴുതുക (ഉദാ: PM-Kisan)...",
    searchButton: "വിവരങ്ങൾ നേടുക",
    popularSchemes: "ജനപ്രിയ പദ്ധതികൾ",
    backButton: "തിരികെ പോകുക",
    cardLabel: "പദ്ധതി വിവരങ്ങൾ",
    listenButton: "വിവരങ്ങൾ കേൾക്കുക",
    stopButton: "കേൾക്കുന്നത് നിർത്തുക",
    footerText: "കിസാൻ സഹായക് - ഗ്രാമീണ ഭാരതത്തിന് വേണ്ടിയുള്ള ഒരു ഡിജിറ്റൽ സംരംഭം",
    searchAnother: "മറ്റൊരു പദ്ധതി തിരയുക",
    disclaimer: "ഈ വിവരങ്ങൾ സഹായത്തിന് മാത്രമുള്ളതാണ്. ദയവായി ഔദ്യോഗിക വെബ്സൈറ്റിലോ അടുത്തുള്ള സിഎസ്സി (CSC) കേന്ദ്രത്തിലോ സ്ഥിരീകരിക്കുക.",
    loading: "വിവരങ്ങൾ തയ്യാറാക്കുന്നു",
    wait: "ദയവായി കുറച്ചു സമയം കാത്തിരിക്കുക..."
  },
  Odia: {
    tagline: "ଡିଜିଟାଲ୍ ସାଥୀ",
    heroHeading: "ସରକାରୀ ଯୋଜନାଗୁଡ଼ିକୁ ସରଳ ଭାଷାରେ ବୁଝନ୍ତୁ",
    heroSubheading: "ଭାରତ ସରକାରଙ୍କ କୃଷି ଯୋଜନା ବିଷୟରେ ସୂଚନା ଏବେ ଆପଣଙ୍କ ନିଜ ଭାଷାରେ। ସରଳ, ସ୍ପଷ୍ଟ ଏବଂ ଉପଯୋଗୀ।",
    searchPlaceholder: "ଯୋଜନାର ନାମ ଲେଖନ୍ତୁ (ଯେପରିକି: PM-Kisan)...",
    searchButton: "ସୂଚନା ନିଅନ୍ତୁ",
    popularSchemes: "ଲୋକପ୍ରିୟ ଯୋଜନା",
    backButton: "ଫେରିଯାଆନ୍ତୁ",
    cardLabel: "ଯୋଜନା ସୂଚନା",
    listenButton: "ସୂଚନା ଶୁଣନ୍ତୁ",
    stopButton: "ଶୁଣିବା ବନ୍ଦ କରନ୍ତୁ",
    footerText: "କିଷାନ୍ ସହାୟକ - ଗ୍ରାମୀଣ ଭାରତ ପାଇଁ ଏକ ଡିଜିଟାଲ୍ ପଦକ୍ଷେପ",
    searchAnother: "ଅନ୍ୟ ଯୋଜନା ଖୋଜନ୍ତୁ",
    disclaimer: "ଏହି ସୂଚନା କେବଳ ସହାୟତା ପାଇଁ। ଦୟାକରି ଅଫିସିଆଲ୍ ୱେବସାଇଟ୍ କିମ୍ବା ନିକଟସ୍ଥ ସିଏସସି (CSC) କେନ୍ଦ୍ରରେ ନିଶ୍ಚಿತ କରନ୍ତୁ।",
    loading: "ସୂଚନା ପ୍ରସ୍ତୁତ କରାଯାଉଛି",
    wait: "ଦୟାକରି କିଛି ସମୟ ଅପେକ୍ଷା କରନ୍ତୁ..."
  }
};

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [query, setQuery] = useState('');
  const [activeScheme, setActiveScheme] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for storing previously fetched explanations to make switches instant
  const [cache, setCache] = useState<Record<string, string>>({});
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<number>(0);

  const generateExplanation = async (schemeName: string, lang: string) => {
    if (!schemeName) return;
    
    const cacheKey = `${schemeName}-${lang}`;
    if (cache[cacheKey]) {
      setExplanation(cache[cacheKey]);
      setActiveScheme(schemeName);
      setIsLoading(false);
      setIsSwitchingLanguage(false);
      return;
    }

    const requestId = ++abortControllerRef.current;
    const isInitialSearch = !activeScheme;
    const isLanguageSwitch = activeScheme === schemeName;
    
    if (isLanguageSwitch) {
      setIsSwitchingLanguage(true);
    } else {
      setIsLoading(true);
      if (isInitialSearch || activeScheme !== schemeName) {
        setExplanation("");
      }
    }
    
    setError(null);
    setActiveScheme(schemeName);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: `Scheme: ${schemeName}`,
        config: {
          systemInstruction: `You are an expert agricultural assistant. 
Explain the scheme in simple terms for rural farmers. 
Use short sentences and friendly tone.

Format:
1. What is it?
2. Who can apply?
3. Benefits
4. Documents needed
5. How to apply
6. Deadline

Language: ${lang}`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      let fullText = "";
      let firstChunkReceived = false;
      for await (const chunk of stream) {
        if (requestId !== abortControllerRef.current) break;
        
        if (!firstChunkReceived) {
          setIsLoading(false);
          setIsSwitchingLanguage(false);
          firstChunkReceived = true;
          setExplanation("");
        }
        
        fullText += chunk.text || "";
        setExplanation(fullText);
      }
      
      // Cache the result
      if (requestId === abortControllerRef.current) {
        setCache(prev => ({ ...prev, [cacheKey]: fullText }));
      }
    } catch (err) {
      if (requestId === abortControllerRef.current) {
        console.error(err);
        setError("Something went wrong. Please try again later.");
      }
    } finally {
      if (requestId === abortControllerRef.current) {
        setIsLoading(false);
        setIsSwitchingLanguage(false);
      }
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsSpeaking(false);
      }
      return;
    }

    if (!explanation) return;

    setIsSpeaking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this agricultural scheme information clearly in ${selectedLanguage}: ${explanation}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioSrc = `data:audio/mp3;base64,${base64Audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.play();
          audioRef.current.onended = () => setIsSpeaking(false);
        } else {
          const audio = new Audio(audioSrc);
          audioRef.current = audio;
          audio.play();
          audio.onended = () => setIsSpeaking(false);
        }
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (activeScheme) {
      generateExplanation(activeScheme, selectedLanguage);
    }
  }, [selectedLanguage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateExplanation(query, selectedLanguage);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Kisan Sahayak: ${activeScheme}`,
        text: explanation || '',
        url: window.location.href,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F3] text-[#2D3436] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => {
              setExplanation(null);
              setActiveScheme(null);
              setQuery('');
            }}
            className="flex items-center gap-3 group"
          >
            <div className="bg-[#5A5A40] p-2.5 rounded-2xl shadow-sm group-hover:scale-105 transition-transform">
              <Sprout className="text-white w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-bold text-[#1A1A1A] leading-none">
                  Kisan Sahayak
                </h1>
                <div className="flex items-center gap-1.5">
                  <div className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-[8px] font-bold text-stone-400 uppercase tracking-tighter">
                    AI
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[8px] font-bold text-emerald-600 uppercase tracking-tighter">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                    Live
                  </div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                {UI_TRANSLATIONS[selectedLanguage]?.tagline || "Digital Companion"}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full border border-stone-200">
              <Languages className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">
                {selectedLanguage === 'Hindi' ? 'भाषा' : 'Language'}
              </span>
            </div>
            <select 
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-white border border-stone-200 text-sm font-semibold rounded-full px-4 py-2 focus:ring-2 focus:ring-[#5A5A40] focus:outline-none cursor-pointer shadow-sm hover:border-[#5A5A40] transition-colors"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        {!explanation && !isLoading ? (
          <div className="animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="mb-16 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                Empowering Rural India
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-[#1A1A1A] leading-[1.1] tracking-tight">
                {UI_TRANSLATIONS[selectedLanguage]?.heroHeading}
              </h2>
              <p className="text-stone-500 text-lg max-w-xl mx-auto leading-relaxed">
                {UI_TRANSLATIONS[selectedLanguage]?.heroSubheading}
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="relative mb-20 max-w-2xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#5A5A40] transition-colors w-5 h-5" />
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={UI_TRANSLATIONS[selectedLanguage]?.searchPlaceholder}
                  className="w-full pl-14 pr-44 py-5 bg-white border border-stone-200 rounded-[2rem] shadow-xl shadow-stone-200/50 focus:border-[#5A5A40] focus:ring-4 focus:ring-[#5A5A40]/5 focus:outline-none transition-all text-lg placeholder:text-stone-300"
                />
                {query && (
                  <button 
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-36 top-1/2 -translate-y-1/2 p-2 text-stone-300 hover:text-stone-500 transition-colors"
                  >
                    ✕
                  </button>
                )}
                <button 
                  type="submit"
                  disabled={isLoading || !query}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#5A5A40] text-white px-8 py-3 rounded-full font-bold hover:bg-[#4A4A30] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#5A5A40]/20 active:scale-95 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {UI_TRANSLATIONS[selectedLanguage]?.searchButton}
                </button>
              </div>
            </form>

            {/* Popular Schemes Grid */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-stone-200"></div>
                <span className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">
                  {UI_TRANSLATIONS[selectedLanguage]?.popularSchemes}
                </span>
                <div className="h-px flex-1 bg-stone-200"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {POPULAR_SCHEMES.map((scheme) => (
                  <button
                    key={scheme}
                    onClick={() => {
                      setQuery(scheme);
                      generateExplanation(scheme, selectedLanguage);
                    }}
                    className="flex items-center justify-between p-6 bg-white border border-stone-100 rounded-3xl hover:border-[#5A5A40] hover:shadow-xl hover:shadow-stone-200/50 transition-all group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                        <Info className="w-5 h-5 text-stone-400 group-hover:text-emerald-600" />
                      </div>
                      <span className="font-bold text-[#1A1A1A]">{scheme}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-[#5A5A40] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Back Button */}
            <button 
              onClick={() => {
                setExplanation(null);
                setActiveScheme(null);
                setQuery('');
              }}
              className="flex items-center gap-2 text-stone-400 hover:text-[#5A5A40] font-bold text-xs uppercase tracking-widest mb-8 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {UI_TRANSLATIONS[selectedLanguage]?.backButton}
            </button>

            {/* Explanation Card */}
            <div className={cn(
              "bg-white border border-stone-200 rounded-[2.5rem] shadow-2xl shadow-stone-200/60 overflow-hidden relative",
              (isLoading || isSwitchingLanguage) && "opacity-90 pointer-events-none"
            )}>
              {(isLoading || isSwitchingLanguage) && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/20">
                  <div className="bg-white p-6 rounded-3xl shadow-2xl flex items-center gap-4 border border-stone-100 animate-in zoom-in duration-200">
                    <div className="w-6 h-6 border-2 border-stone-100 border-t-[#5A5A40] rounded-full animate-spin"></div>
                    <span className="font-bold text-sm text-[#1A1A1A]">
                      {UI_TRANSLATIONS[selectedLanguage]?.loading}...
                    </span>
                  </div>
                </div>
              )}

              {/* Card Header */}
              <div className="bg-[#5A5A40] p-8 md:p-12 text-white relative overflow-hidden">
                {/* Progress Bar for Loading */}
                {(isLoading || isSwitchingLanguage) && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 overflow-hidden">
                    <div className="h-full bg-emerald-400 animate-progress origin-left"></div>
                  </div>
                )}
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                  <Sprout className="w-48 h-48" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
                        {UI_TRANSLATIONS[selectedLanguage]?.cardLabel}
                      </span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-serif font-bold leading-tight">{activeScheme}</h3>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleSpeak}
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all active:scale-95",
                        isSpeaking 
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                      )}
                    >
                      {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      {isSpeaking ? UI_TRANSLATIONS[selectedLanguage]?.stopButton : UI_TRANSLATIONS[selectedLanguage]?.listenButton}
                    </button>
                    <button 
                      onClick={handleShare}
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-8 md:p-16 min-h-[400px]">
                {!explanation && (isLoading || isSwitchingLanguage) ? (
                  <div className="space-y-8 animate-pulse">
                    <div className="space-y-3">
                      <div className="h-4 bg-stone-100 rounded-full w-3/4"></div>
                      <div className="h-4 bg-stone-100 rounded-full w-1/2"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-stone-100 rounded-full w-full"></div>
                      <div className="h-4 bg-stone-100 rounded-full w-5/6"></div>
                      <div className="h-4 bg-stone-100 rounded-full w-2/3"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-stone-100 rounded-full w-4/5"></div>
                      <div className="h-4 bg-stone-100 rounded-full w-1/2"></div>
                    </div>
                  </div>
                ) : (
                  <div className="markdown-body prose prose-stone prose-lg max-w-none prose-headings:font-serif prose-headings:text-[#1A1A1A] prose-p:text-stone-600 prose-p:leading-relaxed prose-li:text-stone-600">
                    <Markdown>{explanation}</Markdown>
                  </div>
                )}
                
                <div className="mt-16 pt-10 border-t border-stone-100">
                  <div className="bg-stone-50 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-2 rounded-xl border border-stone-200">
                        <Info className="w-5 h-5 text-stone-400" />
                      </div>
                      <p className="text-stone-500 text-sm leading-relaxed max-w-md">
                        {UI_TRANSLATIONS[selectedLanguage]?.disclaimer}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setExplanation(null);
                        setActiveScheme(null);
                        setQuery('');
                      }}
                      className="px-8 py-3 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold transition-colors whitespace-nowrap"
                    >
                      {UI_TRANSLATIONS[selectedLanguage]?.searchAnother}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Loading Overlay (Only for very first search with no layout) */}
        {isLoading && !activeScheme && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#F9F8F3] animate-in fade-in duration-300">
            <div className="relative mb-8 scale-110">
              <div className="w-24 h-24 border-[10px] border-stone-100 border-t-[#5A5A40] rounded-full animate-spin"></div>
              <Sprout className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#5A5A40] w-8 h-8" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-serif font-bold text-[#1A1A1A]">
                {UI_TRANSLATIONS[selectedLanguage]?.loading}
              </h3>
              <p className="text-stone-400 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">
                {UI_TRANSLATIONS[selectedLanguage]?.wait}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6 animate-in slide-in-from-bottom-4">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl shadow-xl flex items-start gap-3">
              <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold">Error</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-stone-100 p-2 rounded-xl">
              <Sprout className="text-stone-400 w-5 h-5" />
            </div>
            <p className="text-stone-500 text-sm font-medium">
              {UI_TRANSLATIONS[selectedLanguage]?.footerText}
            </p>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              Rural Empowerment
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              Gemini AI Powered
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
