import { Suspense, lazy, startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import {
  Activity,
  Bell,
  BellOff,
  Bot,
  CalendarDays,
  Camera,
  ChartLine,
  Check,
  ChevronDown,
  Filter,
  Globe2,
  Grid2x2,
  Layers3,
  LocateFixed,
  MessageCircle,
  Newspaper,
  Pause,
  Plane,
  Play,
  RadioTower,
  Send,
  Search,
  Settings,
  SlidersHorizontal,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';

import {
  loadMissionControlBundle,
  loadMissionControlFeedItems,
  postAlertAction,
  updateAlertAudioPreferences,
  updateNotificationPreferences,
  updateWorkspacePreset,
} from './api';
import type {
  AlertActionsStateMC,
  AlertCardMC,
  AlertsInboxMC,
  ExplainerMC,
  FeedFilterCatalogMC,
  FeedHomeMC,
  FeedItemMC,
  FeedTabMC,
  HazardTypeMC,
  HomeSnapshotMC,
  LayerDescriptorMC,
  LeakItemMC,
  MainViewMode,
  MapLayerPackMC,
  MissionControlMode,
  MissionControlSettings,
  NotificationTelemetryMC,
  NotificationPreferenceMC,
  SafetyGuideItemMC,
  SeverityLevel,
  SourceSuggestionMC,
  TickerItemMC,
  TickerViewMode,
  WorkspacePresetMC,
} from './types';

const REFRESH_MS = 3 * 60 * 1000;
const MOBILE_BREAKPOINT = 1040;
const COMPACT_MOBILE_SHELL_ENABLED =
  String(import.meta.env.VITE_MC_COMPACT_MOBILE_SHELL_ENABLED ?? 'true').toLowerCase() !== 'false';
const TICKER_VIEWMODE_ENABLED =
  String(import.meta.env.VITE_MC_TICKER_VIEWMODE_ENABLED ?? 'true').toLowerCase() !== 'false';
const MOBILE_SURFACE_MUTEX_ENABLED =
  String(import.meta.env.VITE_MC_MOBILE_SURFACE_MUTEX_ENABLED ?? 'true').toLowerCase() !== 'false';
const DECK_RENDERER_ENABLED =
  String(import.meta.env.VITE_MC_DECK_RENDERER_ENABLED ?? 'false').toLowerCase() === 'true';

const CONFLICT_OPTIONS = ['all', 'gaza-israel', 'israel-us-iran'];
const DAY_OPTIONS = [1, 3, 7, 14, 30];
const MAIN_VIEWS: MainViewMode[] = ['Map', 'Chain', 'Brief', 'Suites'];
const NOTIFICATION_TABS = ['Critical', 'Assigned', 'Following', 'Resolved'] as const;
const MOBILE_SHEET_TABS = ['Critical', 'Ticker', 'Notifications', 'Leaks'] as const;
const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'ELEVATED', 'INFO'] as const;
const FEED_TABS: FeedTabMC[] = ['feed', 'whale', 'flights'];
const FEED_SOURCE_TOGGLE_ORDER = ['all', 'x', 'telegram', 'news', 'official', 'osint', 'wm-ai'] as const;
const TICKER_VIEW_MODES: TickerViewMode[] = ['all', 'verified', 'leak'];
const QUICK_ACTION_LABELS = ['Critical', 'Near Me', 'Verified', 'Leaks', 'Brief'];
const DEFAULT_AUDIO_PROFILES = {
  CRITICAL: 'alarm-critical',
  HIGH: 'tone-high',
  ELEVATED: 'tone-elevated',
  INFO: 'tone-info',
} as const;
const DEFCON_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#f59e0b',
  4: '#38bdf8',
  5: '#34d399',
};
const LEAK_VERIFICATION_TEXT_FALLBACK = 'Pending independent verification.';
const LAYER_SHORT_LABELS: Record<string, string> = {
  'verified-hotspots': 'Hotspots',
  'flight-radar': 'Flights',
  'maritime-risk': 'Maritime',
  'cyber-comms': 'Cyber',
  'critical-infrastructure': 'Infra',
  'weather-alerts': 'Weather',
  'strategic-waterways': 'Waterways',
  'economic-shocks': 'Econ',
  'conflict-zones': 'Conflict',
};

const UI_COPY = {
  en: {
    online: 'Online',
    weak: 'Weak',
    offline: 'Offline',
    health: 'System Health',
    sources: 'Sources',
    dispatch: 'Dispatch',
    ai: 'AI',
    freshness: 'Freshness',
    sourceSuggestions: 'Source Suggestions',
    sourceSuggestionsHint: 'Adjusted by language and location preference.',
    pizzaTitle: 'Pentagon Pizza Index',
    pizzaTensions: 'Geopolitical Tensions',
    pizzaSource: 'Source',
    pizzaUpdated: 'Updated',
    pizzaNoLocations: 'No location samples available.',
    pizzaUnavailable: 'Unavailable',
    pizzaStatusClosed: 'CLOSED',
    pizzaStatusSpike: 'SPIKE',
    pizzaStatusHigh: 'HIGH',
    pizzaStatusElevated: 'ELEVATED',
    pizzaStatusNominal: 'NOMINAL',
    pizzaStatusQuiet: 'QUIET',
    pizzaJustNow: 'just now',
    pizzaMinutesAgo: 'm ago',
    pizzaHoursAgo: 'h ago',
    learnStatusDetails: 'Learn status details',
    tickerAll: 'All',
    tickerVerified: 'Verified',
    tickerLeaks: 'Leaks',
    tickerEmpty: 'No ticker items for current filter.',
    tickerEmptyVerified: 'No verified ticker items right now.',
    feedTab: 'Feed',
    whaleTrackerTab: 'Whale Tracker',
    flightsTab: 'Flights',
    feedAll: 'All',
    feedCritical: 'Critical',
    feedHigh: 'High',
    feedLow: 'Low',
    feedSearchPlaceholder: 'Search feed...',
    feedFilterSearchPlaceholder: 'Search filters...',
    feedClear: 'Clear',
    feedTopic: '+ Topic',
    feedCategory: '+ Category',
    feedCountry: '+ Country',
    feedNoItems: 'No feed items for selected filters.',
    feedShowing: 'Showing',
    feedLoadMore: 'Load more',
    feedLoadingMore: 'Loading more...',
    noMatches: 'No matches',
    feedSettings: 'Feed settings',
    expandDetails: 'Expand details',
    collapseDetails: 'Collapse details',
    feedFilterPicker: 'Feed filter picker',
    feedFiltersTitle: 'Feed Filters',
    feedFilterTopics: 'Topics',
    feedFilterCategories: 'Categories',
    feedFilterCountries: 'Countries',
    focusOnMap: 'Focus on map',
    feedAllSources: 'All sources',
    feedTelegram: 'Telegram',
    feedX: 'X',
    feedNews: 'News',
    feedOfficial: 'Official',
    feedOsint: 'OSINT',
    feedAi: 'AI',
    showAllTicker: 'Show all',
    alerts: 'Alerts',
    settings: 'Settings',
    profile: 'Profile',
    settingsShort: 'Set',
    quickSearchLabel: 'Quick search',
    quickSearchPlaceholder: 'Quick search alerts',
    breaking: 'Breaking',
    breakingTicker: 'Breaking ticker',
    tickerViewMode: 'Ticker view mode',
    live: 'Live',
    visibleSignals: 'Visible signals',
    noMapSignals: 'No signals visible for current map filters.',
    resetMapFilters: 'Reset map filters',
    activeSignals: 'active signals',
    lastUpdateShort: 'Last update',
    tacticalMode: 'Tactical',
    globeHero: 'Globe Hero',
    tacticalMap: 'Tactical Map',
    updatedLabel: 'Updated',
    simpleMode: 'Simple mode',
    analystMode: 'Analyst mode',
    switchToAnalyst: 'Switch to Analyst',
    switchToSimple: 'Switch to Simple',
    mainModes: 'Main modes',
    reducedGlow: 'Reduced Glow',
    glowOn: 'Glow On',
    close: 'Close',
    location: 'Location',
    confidence: 'Confidence',
    sourcesLabel: 'Sources',
    sourcesWord: 'sources',
    updatedField: 'Updated',
    predictiveConfidenceModel: 'Predictive confidence model',
    safetyGuide: 'Safety Guide',
    noSafetyGuideCards: 'No safety guide cards available for this incident type yet.',
    learnMore: 'Learn more',
    layers: 'Layers',
    timeRange: 'Time Range',
    playback: 'Playback',
    stopPlayback: 'Stop Playback',
    severity: 'Severity',
    snapshotShare: 'Snapshot / Share',
    noCriticalCards: 'No critical cards for current filter.',
    noItemsInSection: 'No items in this section.',
    leaksTitle: 'Leaks / Unverified Intel',
    leaksPolicy: 'De-emphasized by policy. No auto-critical dispatch without verification.',
    riskWarning: 'Risk warning',
    noUnverifiedScope: 'No unverified items in current scope.',
    swipeUp: 'Swipe up',
    swipeDown: 'Swipe down',
    missionSettings: 'Mission Settings',
    scope: 'Scope',
    conflict: 'Conflict',
    viewMode: 'View Mode',
    verification: 'Verification',
    language: 'Language',
    countryHintIso: 'Country Hint (ISO)',
    auto: 'Auto',
    workspacePresets: 'Workspace Presets',
    resetSafeDefault: 'Reset to Safe Default',
    quickActions: 'Quick Actions',
    up: 'Up',
    down: 'Down',
    criticalNow: 'Critical Now',
    notificationCenter: 'Notification Center',
    topVerifiedOperational: 'Top verified operational alerts above fold.',
    notificationsLabel: 'Notifications',
    leaksLane: 'Leaks Lane',
    missionControlTitle: 'Mission Control',
    loadingTacticalRenderer: 'Loading tactical renderer...',
    loadingMapData: 'Loading map data...',
    leakLabel: 'LEAK',
    verifiedFirst: 'Verified First',
    allSources: 'All Sources',
    english: 'English',
    arabic: 'Arabic',
    spanish: 'Spanish',
    alarmCritical: 'Alarm Critical',
    toneHigh: 'Tone High',
    toneElevated: 'Tone Elevated',
    toneInfo: 'Tone Info',
    toneSoft: 'Tone Soft',
    brandSubtitle: 'Global map + critical rail + alert actions',
    unverifiedBadge: 'UNVERIFIED',
    mapMode: 'Map',
    chainMode: 'Chain',
    briefMode: 'Brief',
    suitesMode: 'Suites',
    tabCritical: 'Critical',
    tabAssigned: 'Assigned',
    tabFollowing: 'Following',
    tabResolved: 'Resolved',
    acknowledge: 'Acknowledge',
    muteSimilar: 'Mute Similar',
    followRegion: 'Follow Region',
    nearMe: 'Near Me',
    layerPacks: 'Layer Packs',
    openExternalFlightRadar: 'Open external flight radar feed',
    chainView: 'Chain View',
    operationalBrief: 'Operational Brief',
    briefLoading: 'Brief loading...',
    suites: 'Suites',
    alertsLabel: 'Alerts',
    signalsLabel: 'Signals',
    fusionScore: 'Fusion score',
    criticalUnread: 'Critical unread',
    unverifiedItems: 'Unverified items',
    freshnessStatus: 'Freshness status',
    notificationDispatch: 'Notification Dispatch',
    policy: 'Policy',
    currentSlo: 'Current SLO',
    qualificationToInbox: 'Qualification to inbox',
    qualificationToEmail: 'Qualification to email',
    dispatchSuccess: 'Dispatch success',
    actionPersistenceErrors: 'Action persistence errors',
    basicVsProSafetyPolicy: 'Basic vs Pro Safety Policy',
    criticalDelayAllowed: 'Critical delay allowed',
    yes: 'yes',
    no: 'no',
    pushNotifications: 'Push notifications',
    emailNotifications: 'Email notifications',
    verifiedCriticalLocked: 'Verified critical instant dispatch (locked for safety)',
    verifiedHighInstant: 'Verified high instant dispatch',
    alertAudioProfiles: 'Alert Audio Profiles',
    alertAudioProfilesDesc: 'Severity-based tones with silent and vibration-only options.',
    alertMode: 'Alert mode',
    tone: 'Tone',
    vibrationOnly: 'Vibration only',
    silent: 'Silent',
    vibrationEnabled: 'Vibration enabled',
    toneProfile: 'tone profile',
    saveAlertAudioPrefs: 'Save Alert Audio Preferences',
    saveNotificationPrefs: 'Save Notification Preferences',
    safetyGuideMvp: 'Safety Guide MVP',
    currentIncidentFocus: 'Current incident focus',
    offlineBundlesPlanned: 'Offline downloadable bundles are planned for the mobile phase.',
    noCuratedGuide: 'No curated guide for this incident type yet.',
    useGeneralChecklist: 'Use General Crisis Checklist.',
    explainersTitle: 'Explainers',
    noExplainerSelected: 'No explainer selected.',
    step: 'Step',
    skipTour: 'Skip Tour',
    finish: 'Finish',
    next: 'Next',
    refreshingMissionControl: 'Refreshing Mission Control…',
    leakSummaryFallback: 'Unverified report pending independent verification.',
    leakVerificationHint: 'Pending independent verification.',
    confidenceHigh: 'High confidence',
    confidenceModerate: 'Moderate confidence',
    confidenceLow: 'Low confidence',
    confidenceVeryLow: 'Very low confidence',
    openSourceFeed: 'Open source feed',
    layerManager: 'Manage layers',
    analystSignals: 'Signals',
    analystFlights: 'Flights',
    analystMaritime: 'Maritime',
    analystCyber: 'Cyber',
    layerPackMissionCore: 'Mission Core',
    layerPackFlights: 'Flights',
    layerPackMaritime: 'Maritime',
    layerPackCyberComms: 'Cyber/Comms',
    layerPackNaturalHazards: 'Natural Hazards',
    layerPackEconomicShock: 'Economic Shock',
    confidenceModelHelp: 'How confidence and predictive model scores are generated.',
    flightLayerHelp: 'Flight radar integration strategy and fallback.',
    maritimeLayerHelp: 'Maritime risk methodology and confidence.',
    dispatchPolicyHelp: 'Dispatch defaults and escalation policy.',
    failedLoadMissionControl: 'Failed to load Mission Control data.',
    feedRefreshFailed: 'Feed refresh failed.',
    analystModeEnabledStatus: 'Analyst mode: full layer pack enabled.',
    simpleModeEnabledStatus: 'Simple mode: essential layers enabled.',
    deckFallbackStatus: 'Advanced overlay rendering unavailable in this browser. Showing base map mode.',
    acknowledgedStatus: 'Acknowledged {title}',
    failedAcknowledge: 'Failed to acknowledge alert.',
    mutedStatus: 'Muted similar alerts for {location}',
    failedMuteSimilar: 'Failed to mute similar alerts.',
    followingStatus: 'Following {location}',
    failedFollowRegion: 'Failed to follow region.',
    layoutResetStatus: 'Layout reset to safe default.',
    notificationPrefsSaved: 'Notification preferences saved.',
    notificationPrefsSaveFailed: 'Failed to save notification preferences.',
    audioPrefsSaved: 'Alert audio preferences saved.',
    audioPrefsSaveFailed: 'Failed to save alert audio preferences.',
    snapshotCopied: 'Snapshot link copied.',
    shareUnavailable: 'Share unavailable in this browser context.',
    pizzaDefcon1: 'COCKED PISTOL - MAXIMUM READINESS',
    pizzaDefcon2: 'FAST PACE - ARMED FORCES READY',
    pizzaDefcon3: 'ROUND HOUSE - INCREASE FORCE READINESS',
    pizzaDefcon4: 'DOUBLE TAKE - INCREASED INTELLIGENCE WATCH',
    pizzaDefcon5: 'FADE OUT - LOWEST READINESS',
  },
  ar: {
    online: 'متصل',
    weak: 'ضعيف',
    offline: 'منقطع',
    health: 'صحة النظام',
    sources: 'المصادر',
    dispatch: 'الإرسال',
    ai: 'الذكاء الاصطناعي',
    freshness: 'الحداثة',
    sourceSuggestions: 'اقتراحات المصادر',
    sourceSuggestionsHint: 'تم التخصيص حسب اللغة والموقع.',
    pizzaTitle: 'مؤشر بيتزا البنتاغون',
    pizzaTensions: 'التوترات الجيوسياسية',
    pizzaSource: 'المصدر',
    pizzaUpdated: 'آخر تحديث',
    pizzaNoLocations: 'لا توجد عينات مواقع حالياً.',
    pizzaUnavailable: 'غير متاح',
    pizzaStatusClosed: 'مغلق',
    pizzaStatusSpike: 'ارتفاع حاد',
    pizzaStatusHigh: 'مرتفع',
    pizzaStatusElevated: 'متصاعد',
    pizzaStatusNominal: 'طبيعي',
    pizzaStatusQuiet: 'هادئ',
    pizzaJustNow: 'الآن',
    pizzaMinutesAgo: 'د مضت',
    pizzaHoursAgo: 'س مضت',
    learnStatusDetails: 'تعرف على تفاصيل الحالة',
    tickerAll: 'الكل',
    tickerVerified: 'موثق',
    tickerLeaks: 'تسريبات',
    tickerEmpty: 'لا توجد عناصر شريط حالياً لهذا الفلتر.',
    tickerEmptyVerified: 'لا توجد عناصر موثقة الآن.',
    feedTab: 'الخلاصة',
    whaleTrackerTab: 'متتبع الحيتان',
    flightsTab: 'الرحلات',
    feedAll: 'الكل',
    feedCritical: 'حرج',
    feedHigh: 'عال',
    feedLow: 'منخفض',
    feedSearchPlaceholder: 'ابحث في الخلاصة...',
    feedFilterSearchPlaceholder: 'ابحث في الفلاتر...',
    feedClear: 'مسح',
    feedTopic: '+ موضوع',
    feedCategory: '+ فئة',
    feedCountry: '+ دولة',
    feedNoItems: 'لا توجد عناصر لهذا الفلتر.',
    feedShowing: 'المعروض',
    feedLoadMore: 'تحميل المزيد',
    feedLoadingMore: 'جارٍ تحميل المزيد...',
    noMatches: 'لا توجد نتائج',
    feedSettings: 'إعدادات الخلاصة',
    expandDetails: 'توسيع التفاصيل',
    collapseDetails: 'طي التفاصيل',
    feedFilterPicker: 'منتقي فلاتر الخلاصة',
    feedFiltersTitle: 'فلاتر الخلاصة',
    feedFilterTopics: 'المواضيع',
    feedFilterCategories: 'الفئات',
    feedFilterCountries: 'الدول',
    focusOnMap: 'التركيز على الخريطة',
    feedAllSources: 'كل المصادر',
    feedTelegram: 'تيليجرام',
    feedX: 'X',
    feedNews: 'أخبار',
    feedOfficial: 'رسمي',
    feedOsint: 'OSINT',
    feedAi: 'ذكاء اصطناعي',
    showAllTicker: 'عرض الكل',
    alerts: 'تنبيهات',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    settingsShort: 'إعداد',
    quickSearchLabel: 'بحث سريع',
    quickSearchPlaceholder: 'ابحث سريعاً في التنبيهات',
    breaking: 'عاجل',
    breakingTicker: 'شريط العاجل',
    tickerViewMode: 'وضع عرض الشريط',
    live: 'مباشر',
    visibleSignals: 'الإشارات المرئية',
    noMapSignals: 'لا توجد إشارات مرئية ضمن فلاتر الخريطة الحالية.',
    resetMapFilters: 'إعادة تعيين فلاتر الخريطة',
    activeSignals: 'إشارات نشطة',
    lastUpdateShort: 'آخر تحديث',
    tacticalMode: 'تكتيكي',
    globeHero: 'وضع الكرة',
    tacticalMap: 'الخريطة التكتيكية',
    updatedLabel: 'آخر تحديث',
    simpleMode: 'وضع بسيط',
    analystMode: 'وضع المحلل',
    switchToAnalyst: 'الانتقال إلى وضع المحلل',
    switchToSimple: 'الانتقال إلى الوضع البسيط',
    mainModes: 'الأوضاع الرئيسية',
    reducedGlow: 'تقليل الوهج',
    glowOn: 'تشغيل الوهج',
    close: 'إغلاق',
    location: 'الموقع',
    confidence: 'الثقة',
    sourcesLabel: 'المصادر',
    sourcesWord: 'مصادر',
    updatedField: 'آخر تحديث',
    predictiveConfidenceModel: 'نموذج الثقة التنبئي',
    safetyGuide: 'دليل السلامة',
    noSafetyGuideCards: 'لا توجد بطاقات إرشاد سلامة لهذا النوع حالياً.',
    learnMore: 'اعرف المزيد',
    layers: 'الطبقات',
    timeRange: 'المدى الزمني',
    playback: 'تشغيل',
    stopPlayback: 'إيقاف التشغيل',
    severity: 'الخطورة',
    snapshotShare: 'لقطة / مشاركة',
    noCriticalCards: 'لا توجد بطاقات حرجة لهذا الفلتر.',
    noItemsInSection: 'لا توجد عناصر في هذا القسم.',
    leaksTitle: 'التسريبات / معلومات غير موثقة',
    leaksPolicy: 'مخففة حسب السياسة. لا إرسال حرج تلقائياً بدون تحقق.',
    riskWarning: 'تحذير المخاطر',
    noUnverifiedScope: 'لا توجد عناصر غير موثقة في النطاق الحالي.',
    swipeUp: 'اسحب للأعلى',
    swipeDown: 'اسحب للأسفل',
    missionSettings: 'إعدادات المهمة',
    scope: 'النطاق',
    conflict: 'النزاع',
    viewMode: 'وضع العرض',
    verification: 'التحقق',
    language: 'اللغة',
    countryHintIso: 'تلميح الدولة (ISO)',
    auto: 'تلقائي',
    workspacePresets: 'إعدادات مساحة العمل',
    resetSafeDefault: 'إعادة للوضع الآمن',
    quickActions: 'إجراءات سريعة',
    up: 'أعلى',
    down: 'أسفل',
    criticalNow: 'حرج الآن',
    notificationCenter: 'مركز الإشعارات',
    topVerifiedOperational: 'أهم التنبيهات التشغيلية الموثقة في الأعلى.',
    notificationsLabel: 'الإشعارات',
    leaksLane: 'مسار التسريبات',
    missionControlTitle: 'مركز المهمة',
    loadingTacticalRenderer: 'جارٍ تحميل محرك العرض التكتيكي...',
    loadingMapData: 'جارٍ تحميل بيانات الخريطة...',
    leakLabel: 'تسريب',
    verifiedFirst: 'الموثق أولاً',
    allSources: 'كل المصادر',
    english: 'الإنجليزية',
    arabic: 'العربية',
    spanish: 'الإسبانية',
    alarmCritical: 'إنذار حرج',
    toneHigh: 'نغمة مرتفعة',
    toneElevated: 'نغمة متوسطة',
    toneInfo: 'نغمة معلومات',
    toneSoft: 'نغمة هادئة',
    brandSubtitle: 'خريطة عالمية + شريط الحرج + إجراءات التنبيهات',
    unverifiedBadge: 'غير موثق',
    mapMode: 'الخريطة',
    chainMode: 'السلسلة',
    briefMode: 'الإحاطة',
    suitesMode: 'الحزم',
    tabCritical: 'حرج',
    tabAssigned: 'مُسند',
    tabFollowing: 'متابعة',
    tabResolved: 'محلول',
    acknowledge: 'إقرار',
    muteSimilar: 'كتم المشابه',
    followRegion: 'متابعة المنطقة',
    nearMe: 'بالقرب مني',
    layerPacks: 'حزم الطبقات',
    openExternalFlightRadar: 'فتح رادار الرحلات الخارجي',
    chainView: 'عرض السلسلة',
    operationalBrief: 'إحاطة تشغيلية',
    briefLoading: 'جارٍ تحميل الإحاطة...',
    suites: 'الحزم',
    alertsLabel: 'تنبيهات',
    signalsLabel: 'إشارات',
    fusionScore: 'درجة الدمج',
    criticalUnread: 'حرج غير مقروء',
    unverifiedItems: 'عناصر غير موثقة',
    freshnessStatus: 'حالة الحداثة',
    notificationDispatch: 'إرسال الإشعارات',
    policy: 'السياسة',
    currentSlo: 'SLO الحالي',
    qualificationToInbox: 'من التصنيف إلى الصندوق',
    qualificationToEmail: 'من التصنيف إلى البريد',
    dispatchSuccess: 'نجاح الإرسال',
    actionPersistenceErrors: 'أخطاء حفظ الإجراءات',
    basicVsProSafetyPolicy: 'سياسة الأمان Basic مقابل Pro',
    criticalDelayAllowed: 'تأخير الحرج مسموح',
    yes: 'نعم',
    no: 'لا',
    pushNotifications: 'إشعارات الدفع',
    emailNotifications: 'إشعارات البريد',
    verifiedCriticalLocked: 'إرسال حرج موثق فوري (مقفل للأمان)',
    verifiedHighInstant: 'إرسال فوري لمستوى HIGH الموثق',
    alertAudioProfiles: 'ملفات صوت التنبيه',
    alertAudioProfilesDesc: 'نغمات حسب الشدة مع وضع صامت أو اهتزاز فقط.',
    alertMode: 'وضع التنبيه',
    tone: 'نغمة',
    vibrationOnly: 'اهتزاز فقط',
    silent: 'صامت',
    vibrationEnabled: 'تفعيل الاهتزاز',
    toneProfile: 'ملف النغمة',
    saveAlertAudioPrefs: 'حفظ تفضيلات صوت التنبيه',
    saveNotificationPrefs: 'حفظ تفضيلات الإشعارات',
    safetyGuideMvp: 'دليل السلامة MVP',
    currentIncidentFocus: 'تركيز الحادث الحالي',
    offlineBundlesPlanned: 'حزم تنزيل دون اتصال مخطط لها لمرحلة الجوال.',
    noCuratedGuide: 'لا يوجد دليل منسق لهذا النوع حتى الآن.',
    useGeneralChecklist: 'استخدم قائمة الأزمة العامة.',
    explainersTitle: 'الشروحات',
    noExplainerSelected: 'لم يتم اختيار شرح.',
    step: 'الخطوة',
    skipTour: 'تخطي الجولة',
    finish: 'إنهاء',
    next: 'التالي',
    refreshingMissionControl: 'جارٍ تحديث مركز المهمة…',
    leakSummaryFallback: 'تقرير غير موثق بانتظار تحقق مستقل.',
    leakVerificationHint: 'بانتظار تحقق مستقل.',
    confidenceHigh: 'ثقة عالية',
    confidenceModerate: 'ثقة متوسطة',
    confidenceLow: 'ثقة منخفضة',
    confidenceVeryLow: 'ثقة منخفضة جداً',
    openSourceFeed: 'فتح مصدر الخلاصة',
    layerManager: 'إدارة الطبقات',
    analystSignals: 'الإشارات',
    analystFlights: 'الرحلات',
    analystMaritime: 'بحري',
    analystCyber: 'سيبراني',
    layerPackMissionCore: 'نواة المهمة',
    layerPackFlights: 'الرحلات',
    layerPackMaritime: 'بحري',
    layerPackCyberComms: 'سيبراني/اتصالات',
    layerPackNaturalHazards: 'المخاطر الطبيعية',
    layerPackEconomicShock: 'الصدمة الاقتصادية',
    confidenceModelHelp: 'كيف يتم توليد درجات الثقة والنموذج التنبؤي.',
    flightLayerHelp: 'استراتيجية تكامل رادار الرحلات وخطة النسخ الاحتياطي.',
    maritimeLayerHelp: 'منهجية مخاطر الملاحة وثقة المصادر.',
    dispatchPolicyHelp: 'الإعدادات الافتراضية للإرسال وسياسة التصعيد.',
    failedLoadMissionControl: 'فشل تحميل بيانات مركز المهمة.',
    feedRefreshFailed: 'فشل تحديث الخلاصة.',
    analystModeEnabledStatus: 'وضع المحلل مفعل: تم تفعيل جميع حزم الطبقات.',
    simpleModeEnabledStatus: 'الوضع البسيط مفعل: تم تفعيل الطبقات الأساسية.',
    deckFallbackStatus: 'العرض المتقدم غير متاح في هذا المتصفح. يتم عرض وضع الخريطة الأساسي.',
    acknowledgedStatus: 'تم الإقرار: {title}',
    failedAcknowledge: 'فشل الإقرار بالتنبيه.',
    mutedStatus: 'تم كتم التنبيهات المشابهة لـ {location}',
    failedMuteSimilar: 'فشل كتم التنبيهات المشابهة.',
    followingStatus: 'تتم متابعة {location}',
    failedFollowRegion: 'فشل متابعة المنطقة.',
    layoutResetStatus: 'تمت إعادة التخطيط للوضع الآمن الافتراضي.',
    notificationPrefsSaved: 'تم حفظ تفضيلات الإشعارات.',
    notificationPrefsSaveFailed: 'فشل حفظ تفضيلات الإشعارات.',
    audioPrefsSaved: 'تم حفظ تفضيلات صوت التنبيه.',
    audioPrefsSaveFailed: 'فشل حفظ تفضيلات صوت التنبيه.',
    snapshotCopied: 'تم نسخ رابط اللقطة.',
    shareUnavailable: 'المشاركة غير متاحة في هذا المتصفح.',
    pizzaDefcon1: 'مسدس مُعدّ - أقصى جاهزية',
    pizzaDefcon2: 'وتيرة سريعة - القوات المسلحة جاهزة',
    pizzaDefcon3: 'بيت دائري - زيادة جاهزية القوات',
    pizzaDefcon4: 'نظرة مزدوجة - تعزيز المراقبة الاستخباراتية',
    pizzaDefcon5: 'تلاشي - أدنى مستوى جاهزية',
  },
  es: {
    online: 'En línea',
    weak: 'Débil',
    offline: 'Sin conexión',
    health: 'Salud del sistema',
    sources: 'Fuentes',
    dispatch: 'Despacho',
    ai: 'IA',
    freshness: 'Actualización',
    sourceSuggestions: 'Sugerencias de fuentes',
    sourceSuggestionsHint: 'Ajustado por idioma y ubicación.',
    pizzaTitle: 'Índice de pizza del Pentágono',
    pizzaTensions: 'Tensiones geopolíticas',
    pizzaSource: 'Fuente',
    pizzaUpdated: 'Actualizado',
    pizzaNoLocations: 'No hay muestras de ubicación.',
    pizzaUnavailable: 'No disponible',
    pizzaStatusClosed: 'CERRADO',
    pizzaStatusSpike: 'PICO',
    pizzaStatusHigh: 'ALTO',
    pizzaStatusElevated: 'ELEVADO',
    pizzaStatusNominal: 'NOMINAL',
    pizzaStatusQuiet: 'TRANQUILO',
    pizzaJustNow: 'En este momento',
    pizzaMinutesAgo: 'm',
    pizzaHoursAgo: 'h',
    learnStatusDetails: 'Ver detalles del estado',
    tickerAll: 'Todo',
    tickerVerified: 'Verificado',
    tickerLeaks: 'Filtraciones',
    tickerEmpty: 'No hay elementos para este filtro.',
    tickerEmptyVerified: 'No hay elementos verificados ahora.',
    feedTab: 'Feed',
    whaleTrackerTab: 'Whale Tracker',
    flightsTab: 'Vuelos',
    feedAll: 'Todo',
    feedCritical: 'Crítico',
    feedHigh: 'Alto',
    feedLow: 'Bajo',
    feedSearchPlaceholder: 'Buscar en feed...',
    feedFilterSearchPlaceholder: 'Buscar filtros...',
    feedClear: 'Limpiar',
    feedTopic: '+ Tema',
    feedCategory: '+ Categoría',
    feedCountry: '+ País',
    feedNoItems: 'No hay elementos para estos filtros.',
    feedShowing: 'Mostrando',
    feedLoadMore: 'Cargar más',
    feedLoadingMore: 'Cargando más...',
    noMatches: 'Sin coincidencias',
    feedSettings: 'Ajustes de feed',
    expandDetails: 'Expandir detalles',
    collapseDetails: 'Ocultar detalles',
    feedFilterPicker: 'Selector de filtros del feed',
    feedFiltersTitle: 'Filtros del feed',
    feedFilterTopics: 'Temas',
    feedFilterCategories: 'Categorías',
    feedFilterCountries: 'Países',
    focusOnMap: 'Enfocar en mapa',
    feedAllSources: 'Todas las fuentes',
    feedTelegram: 'Telegram',
    feedX: 'X',
    feedNews: 'Noticias',
    feedOfficial: 'Oficial',
    feedOsint: 'OSINT',
    feedAi: 'IA',
    showAllTicker: 'Ver todo',
    alerts: 'Alertas',
    settings: 'Ajustes',
    profile: 'Perfil',
    settingsShort: 'Conf',
    quickSearchLabel: 'Búsqueda rápida',
    quickSearchPlaceholder: 'Buscar alertas',
    breaking: 'Última hora',
    breakingTicker: 'Ticker de última hora',
    tickerViewMode: 'Modo de vista del ticker',
    live: 'En vivo',
    visibleSignals: 'Señales visibles',
    noMapSignals: 'No hay señales visibles con los filtros actuales del mapa.',
    resetMapFilters: 'Restablecer filtros del mapa',
    activeSignals: 'señales activas',
    lastUpdateShort: 'Última actualización',
    tacticalMode: 'Táctico',
    globeHero: 'Globo',
    tacticalMap: 'Mapa táctico',
    updatedLabel: 'Actualizado',
    simpleMode: 'Modo simple',
    analystMode: 'Modo analista',
    switchToAnalyst: 'Cambiar a Analista',
    switchToSimple: 'Cambiar a Simple',
    mainModes: 'Modos principales',
    reducedGlow: 'Reducir brillo',
    glowOn: 'Brillo activado',
    close: 'Cerrar',
    location: 'Ubicación',
    confidence: 'Confianza',
    sourcesLabel: 'Fuentes',
    sourcesWord: 'fuentes',
    updatedField: 'Actualizado',
    predictiveConfidenceModel: 'Modelo predictivo de confianza',
    safetyGuide: 'Guía de seguridad',
    noSafetyGuideCards: 'Aún no hay guías para este tipo de incidente.',
    learnMore: 'Más información',
    layers: 'Capas',
    timeRange: 'Rango de tiempo',
    playback: 'Reproducción',
    stopPlayback: 'Detener reproducción',
    severity: 'Severidad',
    snapshotShare: 'Captura / Compartir',
    noCriticalCards: 'No hay alertas críticas para este filtro.',
    noItemsInSection: 'No hay elementos en esta sección.',
    leaksTitle: 'Filtraciones / Intel no verificada',
    leaksPolicy: 'Despriorizado por política. Sin despacho crítico automático sin verificación.',
    riskWarning: 'Riesgo',
    noUnverifiedScope: 'No hay elementos no verificados en este alcance.',
    swipeUp: 'Desliza hacia arriba',
    swipeDown: 'Desliza hacia abajo',
    missionSettings: 'Ajustes de misión',
    scope: 'Alcance',
    conflict: 'Conflicto',
    viewMode: 'Modo de vista',
    verification: 'Verificación',
    language: 'Idioma',
    countryHintIso: 'País sugerido (ISO)',
    auto: 'Auto',
    workspacePresets: 'Preajustes de espacio',
    resetSafeDefault: 'Restablecer seguro',
    quickActions: 'Acciones rápidas',
    up: 'Subir',
    down: 'Bajar',
    criticalNow: 'Crítico ahora',
    notificationCenter: 'Centro de notificaciones',
    topVerifiedOperational: 'Alertas operativas verificadas más importantes arriba.',
    notificationsLabel: 'Notificaciones',
    leaksLane: 'Carril de filtraciones',
    missionControlTitle: 'Mission Control',
    loadingTacticalRenderer: 'Cargando renderizador táctico...',
    loadingMapData: 'Cargando datos del mapa...',
    leakLabel: 'FILTRACIÓN',
    verifiedFirst: 'Verificado primero',
    allSources: 'Todas las fuentes',
    english: 'Inglés',
    arabic: 'Árabe',
    spanish: 'Español',
    alarmCritical: 'Alarma crítica',
    toneHigh: 'Tono alto',
    toneElevated: 'Tono elevado',
    toneInfo: 'Tono informativo',
    toneSoft: 'Tono suave',
    brandSubtitle: 'Mapa global + carril crítico + acciones de alertas',
    unverifiedBadge: 'NO VERIFICADO',
    mapMode: 'Mapa',
    chainMode: 'Cadena',
    briefMode: 'Resumen',
    suitesMode: 'Suites',
    tabCritical: 'Crítico',
    tabAssigned: 'Asignado',
    tabFollowing: 'Siguiendo',
    tabResolved: 'Resuelto',
    acknowledge: 'Reconocer',
    muteSimilar: 'Silenciar similares',
    followRegion: 'Seguir región',
    nearMe: 'Cerca de mí',
    layerPacks: 'Paquetes de capas',
    openExternalFlightRadar: 'Abrir radar de vuelos externo',
    chainView: 'Vista de cadena',
    operationalBrief: 'Informe operativo',
    briefLoading: 'Cargando informe...',
    suites: 'Suites',
    alertsLabel: 'Alertas',
    signalsLabel: 'Señales',
    fusionScore: 'Puntuación de fusión',
    criticalUnread: 'Crítico no leído',
    unverifiedItems: 'Elementos no verificados',
    freshnessStatus: 'Estado de actualización',
    notificationDispatch: 'Despacho de notificaciones',
    policy: 'Política',
    currentSlo: 'SLO actual',
    qualificationToInbox: 'Calificación a bandeja',
    qualificationToEmail: 'Calificación a correo',
    dispatchSuccess: 'Éxito de despacho',
    actionPersistenceErrors: 'Errores de persistencia de acciones',
    basicVsProSafetyPolicy: 'Política de seguridad Basic vs Pro',
    criticalDelayAllowed: 'Demora crítica permitida',
    yes: 'sí',
    no: 'no',
    pushNotifications: 'Notificaciones push',
    emailNotifications: 'Notificaciones por correo',
    verifiedCriticalLocked: 'Despacho crítico verificado instantáneo (bloqueado por seguridad)',
    verifiedHighInstant: 'Despacho instantáneo de HIGH verificado',
    alertAudioProfiles: 'Perfiles de audio de alerta',
    alertAudioProfilesDesc: 'Tonos por severidad con opciones silencioso y solo vibración.',
    alertMode: 'Modo de alerta',
    tone: 'Tono',
    vibrationOnly: 'Solo vibración',
    silent: 'Silencioso',
    vibrationEnabled: 'Vibración habilitada',
    toneProfile: 'perfil de tono',
    saveAlertAudioPrefs: 'Guardar preferencias de audio',
    saveNotificationPrefs: 'Guardar preferencias de notificación',
    safetyGuideMvp: 'Guía de seguridad MVP',
    currentIncidentFocus: 'Enfoque de incidente actual',
    offlineBundlesPlanned: 'Los paquetes descargables offline se planean para la fase móvil.',
    noCuratedGuide: 'Aún no hay guía curada para este tipo de incidente.',
    useGeneralChecklist: 'Use la lista general de crisis.',
    explainersTitle: 'Explicaciones',
    noExplainerSelected: 'Ninguna explicación seleccionada.',
    step: 'Paso',
    skipTour: 'Saltar tour',
    finish: 'Finalizar',
    next: 'Siguiente',
    refreshingMissionControl: 'Actualizando Mission Control…',
    leakSummaryFallback: 'Reporte no verificado pendiente de verificación independiente.',
    leakVerificationHint: 'Pendiente de verificación independiente.',
    confidenceHigh: 'Confianza alta',
    confidenceModerate: 'Confianza moderada',
    confidenceLow: 'Confianza baja',
    confidenceVeryLow: 'Confianza muy baja',
    openSourceFeed: 'Abrir fuente',
    layerManager: 'Gestionar capas',
    analystSignals: 'Señales',
    analystFlights: 'Vuelos',
    analystMaritime: 'Marítimo',
    analystCyber: 'Ciber',
    layerPackMissionCore: 'Núcleo de misión',
    layerPackFlights: 'Vuelos',
    layerPackMaritime: 'Marítimo',
    layerPackCyberComms: 'Ciber/Comms',
    layerPackNaturalHazards: 'Riesgos naturales',
    layerPackEconomicShock: 'Choque económico',
    confidenceModelHelp: 'Cómo se generan las puntuaciones de confianza y del modelo predictivo.',
    flightLayerHelp: 'Estrategia de integración de radar de vuelos y respaldo.',
    maritimeLayerHelp: 'Metodología de riesgo marítimo y confianza.',
    dispatchPolicyHelp: 'Valores por defecto de despacho y política de escalación.',
    failedLoadMissionControl: 'Error al cargar los datos de Mission Control.',
    feedRefreshFailed: 'Error al actualizar el feed.',
    analystModeEnabledStatus: 'Modo Analista activo: paquete completo de capas habilitado.',
    simpleModeEnabledStatus: 'Modo Simple activo: capas esenciales habilitadas.',
    deckFallbackStatus: 'Renderizado avanzado no disponible en este navegador. Mostrando mapa base.',
    acknowledgedStatus: 'Reconocido: {title}',
    failedAcknowledge: 'No se pudo reconocer la alerta.',
    mutedStatus: 'Alertas similares silenciadas para {location}',
    failedMuteSimilar: 'No se pudieron silenciar alertas similares.',
    followingStatus: 'Siguiendo {location}',
    failedFollowRegion: 'No se pudo seguir la región.',
    layoutResetStatus: 'Diseño restablecido al modo seguro predeterminado.',
    notificationPrefsSaved: 'Preferencias de notificación guardadas.',
    notificationPrefsSaveFailed: 'No se pudieron guardar las preferencias de notificación.',
    audioPrefsSaved: 'Preferencias de audio de alerta guardadas.',
    audioPrefsSaveFailed: 'No se pudieron guardar las preferencias de audio de alerta.',
    snapshotCopied: 'Enlace de instantánea copiado.',
    shareUnavailable: 'Compartir no disponible en este navegador.',
    pizzaDefcon1: 'PISTOLA ARMADA - MÁXIMA PREPARACIÓN',
    pizzaDefcon2: 'RITMO RÁPIDO - FUERZAS ARMADAS PREPARADAS',
    pizzaDefcon3: 'CASA REDONDA - AUMENTAR LA PREPARACIÓN DE LA FUERZA',
    pizzaDefcon4: 'DOBLE TOMA: VIGILANCIA DE INTELIGENCIA AUMENTADA',
    pizzaDefcon5: 'DESVANECIMIENTO - PREPARACIÓN MÍNIMA',
  },
} as const;

const TOUR_STORAGE_KEY = 'mc_onboarding_complete_v1';
const SETTINGS_STORAGE_KEY = 'mc_settings_v2';
const MapCanvas = lazy(() => import('./MapCanvas'));

const TOUR_STEPS = [
  {
    title: 'Mission Control Surface',
    body: 'This first page is map-first. Critical alerts, ticker context, and notification actions are always one move away.',
  },
  {
    title: 'What Am I Seeing?',
    body: 'You are looking at verified hotspots, conflict intensity, and operational overlays. Keep Simple mode enabled while learning.',
  },
  {
    title: 'Alerts First',
    body: 'Critical rail cards support acknowledge, mute similar, and follow region in two interactions.',
  },
  {
    title: 'Leaks Policy',
    body: 'Leaks and unverified intel live in a separate lane with warning style and no auto-critical dispatch.',
  },
  {
    title: 'Power Without Clutter',
    body: 'Switch to Analyst mode when ready. You can always reset to safe default layout in settings.',
  },
];

type NotificationTab = (typeof NOTIFICATION_TABS)[number];
type MobileSheetTab = (typeof MOBILE_SHEET_TABS)[number];
type FeedFilterPicker = 'topic' | 'category' | 'country';
type SeverityFilter = (typeof SEVERITY_FILTERS)[number];
type LocaleCopy = (typeof UI_COPY)[keyof typeof UI_COPY];
type MapVisualMode = 'tactical' | 'globe';

type ViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
};

type ExplainerAnchorMap = Record<string, ExplainerMC>;

const DEFAULT_SETTINGS: MissionControlSettings = {
  conflict: 'all',
  days: 14,
  mode: 'simple',
  verificationMode: 'verified-first',
  profile: 'default',
  language: 'auto',
  country: '',
};

const DEFAULT_VIEW_STATE: ViewState = {
  latitude: 31.5,
  longitude: 34.7,
  zoom: 4.5,
  pitch: 38,
  bearing: 0,
};

const DEFAULT_ALERT_ACTIONS: AlertActionsStateMC = {
  acknowledged_alert_ids: [],
  followed_regions: [],
  muted_signatures: [],
};

const SEVERITY_PRIORITY: Record<SeverityLevel, number> = {
  CRITICAL: 4,
  HIGH: 3,
  ELEVATED: 2,
  INFO: 1,
};

function resolveAudioContextCtor():
  | (new (contextOptions?: AudioContextOptions) => AudioContext)
  | null {
  if (typeof window === 'undefined') return null;
  const maybeWindow = window as Window & {
    webkitAudioContext?: new (contextOptions?: AudioContextOptions) => AudioContext;
  };
  return window.AudioContext || maybeWindow.webkitAudioContext || null;
}

function buildTonePattern(profile: string, severity: SeverityLevel): Array<{ hz: number; ms: number }> {
  const value = String(profile || '').toLowerCase();
  if (value === 'alarm-critical') {
    return [{ hz: 920, ms: 180 }, { hz: 1260, ms: 180 }, { hz: 920, ms: 220 }];
  }
  if (value === 'tone-high') {
    return [{ hz: 820, ms: 150 }, { hz: 920, ms: 170 }];
  }
  if (value === 'tone-elevated') {
    return [{ hz: 720, ms: 180 }];
  }
  if (value === 'tone-soft') {
    return [{ hz: 560, ms: 140 }];
  }
  if (value === 'tone-info') {
    return [{ hz: 640, ms: 120 }];
  }
  if (severity === 'CRITICAL') return [{ hz: 920, ms: 180 }, { hz: 1260, ms: 180 }, { hz: 920, ms: 220 }];
  if (severity === 'HIGH') return [{ hz: 820, ms: 150 }, { hz: 920, ms: 170 }];
  if (severity === 'ELEVATED') return [{ hz: 720, ms: 180 }];
  return [{ hz: 640, ms: 120 }];
}

async function playAlertTone(profile: string, severity: SeverityLevel): Promise<void> {
  const AudioContextCtor = resolveAudioContextCtor();
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  try {
    const pattern = buildTonePattern(profile, severity);
    let at = context.currentTime + 0.01;
    pattern.forEach((step) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = severity === 'CRITICAL' ? 'sawtooth' : 'sine';
      oscillator.frequency.value = step.hz;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.13, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + step.ms / 1000);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + step.ms / 1000);
      at += step.ms / 1000 + 0.07;
    });
    const closeDelayMs = Math.max(
      400,
      pattern.reduce((sum, step) => sum + step.ms, 0) + pattern.length * 80
    );
    window.setTimeout(() => {
      context.close().catch(() => {});
    }, closeDelayMs);
  } catch {
    await context.close().catch(() => {});
  }
}

function vibrationPatternForSeverity(severity: SeverityLevel): number | number[] {
  if (severity === 'CRITICAL') return [220, 90, 220, 90, 220];
  if (severity === 'HIGH') return [160, 70, 160];
  if (severity === 'ELEVATED') return [130, 60, 130];
  return 90;
}

function severityColor(severity: string): string {
  const value = String(severity || '').toUpperCase();
  if (value === 'CRITICAL') return '#ef4444';
  if (value === 'HIGH') return '#f59e0b';
  if (value === 'ELEVATED') return '#eab308';
  return '#94a3b8';
}

function confidenceLabel(copy: LocaleCopy, score: number): string {
  if (score >= 0.78) return copy.confidenceHigh;
  if (score >= 0.55) return copy.confidenceModerate;
  if (score >= 0.35) return copy.confidenceLow;
  return copy.confidenceVeryLow;
}

function severityFromMapPoint(point: {
  fatalities_total?: number;
  injured_total?: number;
  confidence?: number;
}): SeverityLevel {
  const fatalities = Number(point.fatalities_total || 0);
  const injured = Number(point.injured_total || 0);
  const confidence = Number(point.confidence || 0);
  if (fatalities >= 20 || confidence >= 0.86) return 'CRITICAL';
  if (fatalities >= 5 || injured >= 20 || confidence >= 0.7) return 'HIGH';
  if (confidence >= 0.42) return 'ELEVATED';
  return 'INFO';
}

function matchesSearch(text: string, query: string): boolean {
  const normalizedText = String(text || '').toLowerCase();
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return true;
  return normalizedText.includes(normalizedQuery);
}

function normalizeIncidentType(input: string): string {
  const value = String(input || '').trim().toLowerCase();
  return value || 'general';
}

function findExplainerByAnchor(explainers: ExplainerMC[], anchor: string): ExplainerMC | null {
  return explainers.find((item) => item.anchor === anchor) || null;
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error('Clipboard API not available'));
}

function mapNotificationTabToKey(tab: NotificationTab): keyof AlertsInboxMC {
  if (tab === 'Critical') return 'critical';
  if (tab === 'Assigned') return 'assigned';
  if (tab === 'Following') return 'following';
  return 'resolved';
}

function mapNotificationTabLabel(copy: LocaleCopy, tab: NotificationTab): string {
  if (tab === 'Critical') return copy.tabCritical;
  if (tab === 'Assigned') return copy.tabAssigned;
  if (tab === 'Following') return copy.tabFollowing;
  return copy.tabResolved;
}

function mapMainViewLabel(copy: LocaleCopy, mode: MainViewMode): string {
  if (mode === 'Map') return copy.mapMode;
  if (mode === 'Chain') return copy.chainMode;
  if (mode === 'Brief') return copy.briefMode;
  return copy.suitesMode;
}

function mapMobileSheetTabLabel(copy: LocaleCopy, tab: MobileSheetTab): string {
  if (tab === 'Critical') return copy.tabCritical;
  if (tab === 'Ticker') return copy.breaking;
  if (tab === 'Notifications') return copy.notificationsLabel;
  return copy.leaksLane;
}

function mapQuickActionLabel(copy: LocaleCopy, action: string): string {
  if (action === 'Critical') return copy.tabCritical;
  if (action === 'Near Me') return copy.nearMe;
  if (action === 'Verified') return copy.tickerVerified;
  if (action === 'Leaks') return copy.leaksLane;
  if (action === 'Brief') return copy.briefMode;
  return action;
}

function mapFeedTabLabel(copy: LocaleCopy, tab: FeedTabMC): string {
  if (tab === 'whale') return copy.whaleTrackerTab;
  if (tab === 'flights') return copy.flightsTab;
  return copy.feedTab;
}

function mapFeedFilterTabLabel(copy: LocaleCopy, tab: FeedFilterPicker): string {
  if (tab === 'topic') return copy.feedFilterTopics;
  if (tab === 'category') return copy.feedFilterCategories;
  return copy.feedFilterCountries;
}

function normalizeFeedSourceType(value: string): string {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'twitter') return 'x';
  if (normalized === 'wm_ai') return 'wm-ai';
  return normalized;
}

function toggleListValue(list: string[], value: string): string[] {
  const normalized = String(value || '').trim();
  if (!normalized) return list;
  const next = new Set(list);
  if (next.has(normalized)) {
    next.delete(normalized);
  } else {
    next.add(normalized);
  }
  return [...next];
}

function mapFeedSourceLabel(copy: LocaleCopy, sourceType: string): string {
  const normalized = normalizeFeedSourceType(sourceType);
  if (normalized === 'telegram') return copy.feedTelegram;
  if (normalized === 'x') return copy.feedX;
  if (normalized === 'official') return copy.feedOfficial;
  if (normalized === 'osint') return copy.feedOsint;
  if (normalized === 'wm-ai') return copy.feedAi;
  if (normalized === 'news') return copy.feedNews;
  return copy.feedNews;
}

function mapSuggestionToFeedSourceType(item: SourceSuggestionMC): string {
  const id = String(item.id || '').toLowerCase();
  const url = String(item.url || '').toLowerCase();
  if (id.includes('telegram') || url.includes('/telegram-feed')) return 'telegram';
  if (id.includes('news') || url.includes('/news/')) return 'news';
  if (id.includes('oref') || url.includes('/oref-alerts')) return 'official';
  if (id.includes('pizzint') || url.includes('/get-pizzint-status')) return 'wm-ai';
  return '';
}

function getDefaultLayerIdsByMode(layers: LayerDescriptorMC[], mode: MissionControlMode): string[] {
  if (mode === 'analyst') {
    return layers.map((item) => item.id);
  }
  return layers
    .filter((item) => item.default_enabled || item.category === 'core')
    .map((item) => item.id);
}

function getLayerChipLabel(layer: LayerDescriptorMC): string {
  return LAYER_SHORT_LABELS[layer.id] || layer.name;
}

function getLayerPackLabel(copy: LocaleCopy, pack: MapLayerPackMC): string {
  if (pack.id === 'mission-core') return copy.layerPackMissionCore;
  if (pack.id === 'flights') return copy.layerPackFlights;
  if (pack.id === 'maritime') return copy.layerPackMaritime;
  if (pack.id === 'cyber-comms') return copy.layerPackCyberComms;
  if (pack.id === 'natural-hazards') return copy.layerPackNaturalHazards;
  if (pack.id === 'economic-shock') return copy.layerPackEconomicShock;
  return pack.name;
}

function formatCopyTemplate(template: string, replacements: Record<string, string | number>): string {
  return Object.entries(replacements).reduce((acc, [key, value]) => {
    return acc.split(`{${key}}`).join(String(value));
  }, String(template || ''));
}

function compactFeedText(input: string | null | undefined): string {
  const raw = String(input || '').trim();
  if (!raw) return '';
  const compacted = raw
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return compacted || raw;
}

function shouldHideFeedSummary(title: string | null | undefined, summary: string | null | undefined): boolean {
  const normalize = (value: string | null | undefined) =>
    compactFeedText(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const normalizedTitle = normalize(title);
  const normalizedSummary = normalize(summary);
  if (!normalizedSummary) return true;
  if (!normalizedTitle) return false;
  if (normalizedSummary === normalizedTitle) return true;
  if (normalizedTitle.length >= 24 && normalizedSummary.startsWith(normalizedTitle)) return true;
  return false;
}

function deriveAdaptiveMapCenter(
  map: HomeSnapshotMC['map'] | undefined,
  fallback: { latitude: number; longitude: number; zoom: number }
): { latitude: number; longitude: number; zoom: number } {
  if (!map) return fallback;
  const points: Array<{ latitude: number; longitude: number }> = [];
  const addPoint = (latitude: unknown, longitude: unknown) => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    points.push({ latitude: lat, longitude: lon });
  };

  map.event_points.slice(0, 160).forEach((point) => addPoint(point.latitude, point.longitude));
  (map.optional_feeds.flight_radar || []).slice(0, 120).forEach((point) => addPoint(point.latitude, point.longitude));
  (map.optional_feeds.maritime_risk || []).slice(0, 60).forEach((point) => addPoint(point.latitude, point.longitude));
  (map.optional_feeds.cyber_comms || []).slice(0, 80).forEach((point) => addPoint(point.latitude, point.longitude));
  (map.optional_feeds.weather_alerts || []).slice(0, 60).forEach((point) => addPoint(point.latitude, point.longitude));

  if (points.length < 6) return fallback;

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latRange = Math.max(0.1, maxLat - minLat);
  const lonRange = Math.max(0.1, maxLon - minLon);
  const span = Math.max(latRange, lonRange);
  const zoom = span > 145 ? 1.8 : span > 95 ? 2.3 : span > 65 ? 2.8 : span > 42 ? 3.4 : span > 26 ? 4.1 : fallback.zoom;
  return {
    latitude: Number(((minLat + maxLat) / 2).toFixed(3)),
    longitude: Number(((minLon + maxLon) / 2).toFixed(3)),
    zoom,
  };
}

type HealthState = 'online' | 'weak' | 'offline';

function resolveLocaleKey(languageHint: string): keyof typeof UI_COPY {
  const value = String(languageHint || '').trim().toLowerCase();
  if (value.startsWith('ar')) return 'ar';
  if (value.startsWith('es')) return 'es';
  return 'en';
}

function healthWeight(state: HealthState): number {
  if (state === 'offline') return 3;
  if (state === 'weak') return 2;
  return 1;
}

function mostSevereHealth(states: HealthState[]): HealthState {
  return states.reduce<HealthState>((worst, current) => {
    return healthWeight(current) > healthWeight(worst) ? current : worst;
  }, 'online');
}

function getPizzintLocationStateClass(item: {
  is_closed_now?: boolean;
  is_spike?: boolean;
  current_popularity?: number;
}): 'closed' | 'spike' | 'high' | 'elevated' | 'nominal' | 'quiet' {
  if (item.is_closed_now) return 'closed';
  if (item.is_spike) return 'spike';
  const popularity = Number(item.current_popularity || 0);
  if (popularity >= 70) return 'high';
  if (popularity >= 40) return 'elevated';
  if (popularity >= 15) return 'nominal';
  return 'quiet';
}

function getPizzintLocationStatusLabel(
  copy: LocaleCopy,
  item: { is_closed_now?: boolean; is_spike?: boolean; current_popularity?: number }
): string {
  const popularity = Math.max(0, Math.round(Number(item.current_popularity || 0)));
  if (item.is_closed_now) return copy.pizzaStatusClosed;
  if (item.is_spike) return `${copy.pizzaStatusSpike} ${popularity}%`;
  if (popularity >= 70) return `${copy.pizzaStatusHigh} ${popularity}%`;
  if (popularity >= 40) return `${copy.pizzaStatusElevated} ${popularity}%`;
  if (popularity >= 15) return `${copy.pizzaStatusNominal} ${popularity}%`;
  return `${copy.pizzaStatusQuiet} ${popularity}%`;
}

function formatRelativeTimeLabel(input: string | null | undefined, copy: LocaleCopy): string {
  if (!input) return copy.pizzaUnavailable;
  const ms = new Date(input).getTime();
  if (!Number.isFinite(ms)) return copy.pizzaUnavailable;
  const diff = Date.now() - ms;
  if (diff < 60000) return copy.pizzaJustNow;
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}${copy.pizzaMinutesAgo}`;
  return `${Math.max(1, Math.floor(diff / 3600000))}${copy.pizzaHoursAgo}`;
}

function getPizzintDefconLabel(
  copy: LocaleCopy,
  level: number,
  fallbackLabel: string | null | undefined
): string {
  if (level === 1) return copy.pizzaDefcon1;
  if (level === 2) return copy.pizzaDefcon2;
  if (level === 3) return copy.pizzaDefcon3;
  if (level === 4) return copy.pizzaDefcon4;
  if (level === 5) return copy.pizzaDefcon5;
  return String(fallbackLabel || copy.pizzaUnavailable);
}

function stripLeakVerificationText(summary: string | null | undefined): string {
  const value = String(summary || '').trim();
  if (!value) return '';
  return value
    .replace(/early signal from telegram feed[^.]*independent verification\.?/gi, '')
    .replace(/unverified signal from telegram feed[^.]*corroboration\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function leakVerificationHint(item: LeakItemMC, fallback = LEAK_VERIFICATION_TEXT_FALLBACK): string {
  return String(item.unverified_reason || fallback || '').trim();
}

function sourceInitials(value: string): string {
  const words = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!words.length) return 'WM';
  return words.map((part) => part[0]?.toUpperCase() || '').join('');
}

function formatVerificationStatusLabel(value: string): string {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'source';
  if (normalized === 'derived-signal') return 'derived';
  return normalized.replace(/[_-]+/g, ' ');
}

function buildMixedTickerItems(items: TickerItemMC[], maxItems: number): TickerItemMC[] {
  const ranked = [...items].sort(
    (a, b) =>
      (SEVERITY_PRIORITY[b.severity] || 0) - (SEVERITY_PRIORITY[a.severity] || 0) ||
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  const verified = ranked.filter((item) => item.kind === 'verified');
  const leaks = ranked.filter((item) => item.kind === 'leak');

  if (!verified.length) {
    return leaks.slice(0, Math.min(maxItems, 8));
  }

  const leakCap = Math.max(2, Math.floor(maxItems * 0.35));
  const verifiedCap = Math.max(1, maxItems - leakCap);
  const mixed = [...verified.slice(0, verifiedCap), ...leaks.slice(0, leakCap)];

  if (mixed.length < maxItems) {
    const remainingVerified = verified.slice(verifiedCap, maxItems);
    mixed.push(...remainingVerified.slice(0, maxItems - mixed.length));
  }

  return mixed.slice(0, maxItems);
}

function toHealthLabel(copy: LocaleCopy, state: HealthState): string {
  if (state === 'offline') return copy.offline;
  if (state === 'weak') return copy.weak;
  return copy.online;
}

function detectWebGlSupport(): boolean {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return true;
    if (typeof navigator !== 'undefined') {
      const userAgent = String(navigator.userAgent || '');
      // Some automated/virtualized browser contexts report WebGL as available
      // but still crash DeckGL during context init.
      if (
        Boolean((navigator as Navigator & { webdriver?: boolean }).webdriver) ||
        /HeadlessChrome|Playwright|PhantomJS/i.test(userAgent)
      ) {
        return false;
      }
    }
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl || typeof (gl as WebGLRenderingContext).getParameter !== 'function') {
      return false;
    }
    const maxTexture = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_TEXTURE_SIZE);
    return Number.isFinite(Number(maxTexture)) && Number(maxTexture) > 0;
  } catch {
    return false;
  }
}

type HelpIconProps = {
  anchor: string;
  tooltip: string;
  onOpen: (anchor: string) => void;
};

function HelpIcon({ anchor, tooltip, onOpen }: HelpIconProps) {
  return (
    <button
      type="button"
      className="help-icon"
      title={tooltip}
      aria-label={`Explain ${anchor}`}
      onClick={() => onOpen(anchor)}
    >
      ?
    </button>
  );
}

type AlertCardProps = {
  card: AlertCardMC;
  copy: LocaleCopy;
  formatTime: (input: string | number | Date) => string;
  onFocus: (card: AlertCardMC) => void;
  onAcknowledge?: (card: AlertCardMC) => void;
  onMute?: (card: AlertCardMC) => void;
  onFollow?: (card: AlertCardMC) => void;
};

function AlertCard({ card, copy, formatTime, onFocus, onAcknowledge, onMute, onFollow }: AlertCardProps) {
  return (
    <article className="alert-card" style={{ borderColor: severityColor(card.severity) }}>
      <div className="alert-source-row">
        <span className="alert-source-avatar" aria-hidden="true">{sourceInitials(card.source_name)}</span>
        <div className="alert-source-meta">
          <strong>{card.source_name}</strong>
          <span>{formatTime(card.updated_at)}</span>
        </div>
        <span className={`severity-pill severity-${card.severity.toLowerCase()}`}>{card.severity}</span>
      </div>
      <button type="button" className="alert-header" onClick={() => onFocus(card)}>
        <span className="alert-title">{card.title}</span>
      </button>
      <div className="alert-meta">
        <span>{card.location}</span>
        <span>{formatVerificationStatusLabel(card.verification_status)}</span>
      </div>
      <div className="alert-data">
        <span>{confidenceLabel(copy, card.confidence_score)}</span>
        <span>{card.source_count} {copy.sourcesWord}</span>
        <span>{card.source_tier}</span>
      </div>
      <div className="evidence-pills">
        {card.evidence_pills.slice(0, 3).map((pill) => (
          <span key={`${card.id}-${pill}`}>{pill}</span>
        ))}
      </div>
      {(onAcknowledge || onMute || onFollow) && (
        <div className="alert-actions">
          {onAcknowledge && (
            <button type="button" title={copy.acknowledge} aria-label={copy.acknowledge} onClick={() => onAcknowledge(card)}>
              <Check size={14} aria-hidden="true" />
            </button>
          )}
          {onMute && (
            <button type="button" title={copy.muteSimilar} aria-label={copy.muteSimilar} onClick={() => onMute(card)}>
              <BellOff size={14} aria-hidden="true" />
            </button>
          )}
          {onFollow && (
            <button type="button" title={copy.followRegion} aria-label={copy.followRegion} onClick={() => onFollow(card)}>
              <LocateFixed size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </article>
  );
}

function App() {
  const [settings, setSettings] = useState<MissionControlSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw) as Partial<MissionControlSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        language: parsed.language || DEFAULT_SETTINGS.language,
        country: String(parsed.country || '').slice(0, 2).toUpperCase(),
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [mainView, setMainView] = useState<MainViewMode>('Map');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [debouncedFeedSearchQuery, setDebouncedFeedSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [tickerViewMode, setTickerViewMode] = useState<TickerViewMode>('all');
  const [selectedPresetId, setSelectedPresetId] = useState('ops-commander');

  const [home, setHome] = useState<HomeSnapshotMC | null>(null);
  const [ticker, setTicker] = useState<TickerItemMC[]>([]);
  const [alertsInbox, setAlertsInbox] = useState<AlertsInboxMC | null>(null);
  const [leaks, setLeaks] = useState<LeakItemMC[]>([]);
  const [layersCatalog, setLayersCatalog] = useState<LayerDescriptorMC[]>([]);
  const [mapLayerPacks, setMapLayerPacks] = useState<MapLayerPackMC[]>([]);
  const [hazardsCatalog, setHazardsCatalog] = useState<HazardTypeMC[]>([]);
  const [safetyGuides, setSafetyGuides] = useState<SafetyGuideItemMC[]>([]);
  const [explainers, setExplainers] = useState<ExplainerMC[]>([]);
  const [notificationPreference, setNotificationPreference] = useState<NotificationPreferenceMC | null>(null);
  const [notificationTelemetry, setNotificationTelemetry] = useState<NotificationTelemetryMC | null>(null);
  const [alertActions, setAlertActions] = useState<AlertActionsStateMC>(DEFAULT_ALERT_ACTIONS);
  const [feedHome, setFeedHome] = useState<FeedHomeMC | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItemMC[]>([]);
  const [feedFilterCatalog, setFeedFilterCatalog] = useState<FeedFilterCatalogMC | null>(null);
  const [feedSourceTypes, setFeedSourceTypes] = useState<string[]>([]);
  const [feedSeverityChip, setFeedSeverityChip] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'LOW'>('ALL');
  const [feedTopicFilter, setFeedTopicFilter] = useState<string[]>([]);
  const [feedCategoryFilter, setFeedCategoryFilter] = useState<string[]>([]);
  const [feedCountryFilter, setFeedCountryFilter] = useState<string[]>([]);
  const [feedFilterPicker, setFeedFilterPicker] = useState<FeedFilterPicker | null>(null);
  const [feedFilterSearch, setFeedFilterSearch] = useState('');
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedTotalFiltered, setFeedTotalFiltered] = useState(0);
  const [expandedFeedItemId, setExpandedFeedItemId] = useState('');

  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const [quickActions, setQuickActions] = useState<string[]>(QUICK_ACTION_LABELS);

  const [selectedAlert, setSelectedAlert] = useState<AlertCardMC | null>(null);
  const [selectedLeak, setSelectedLeak] = useState<LeakItemMC | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [healthPanelOpen, setHealthPanelOpen] = useState(false);
  const [pizzaPanelOpen, setPizzaPanelOpen] = useState(false);
  const [docsAnchor, setDocsAnchor] = useState('posture-chip');
  const [notificationTab, setNotificationTab] = useState<NotificationTab>('Critical');
  const [rightRailTab, setRightRailTab] = useState<FeedTabMC>('feed');
  const [mobileSheetTab, setMobileSheetTab] = useState<MobileSheetTab>('Critical');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const [playbackEnabled, setPlaybackEnabled] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [deckUnavailable, setDeckUnavailable] = useState<boolean>(
    () => !DECK_RENDERER_ENABLED || !detectWebGlSupport()
  );
  const [reducedGlow, setReducedGlow] = useState(false);
  const [tourStep, setTourStep] = useState<number>(() =>
    localStorage.getItem(TOUR_STORAGE_KEY) ? -1 : 0
  );

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= MOBILE_BREAKPOINT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW_STATE);
  const [mapVisualMode, setMapVisualMode] = useState<MapVisualMode>('tactical');

  const deferredGlobalSearchQuery = useDeferredValue(globalSearchQuery);
  const deferredFeedSearchQuery = useDeferredValue(feedSearchQuery);

  const touchStartYRef = useRef<number | null>(null);
  const didInitLayersRef = useRef(false);
  const didInitViewRef = useRef(false);
  const seenCriticalIdsRef = useRef<Set<string>>(new Set());
  const audioCooldownRef = useRef(0);
  const headerHealthRef = useRef<HTMLDivElement | null>(null);
  const headerPizzaRef = useRef<HTMLDivElement | null>(null);
  const previousModeRef = useRef<MissionControlMode>(settings.mode);
  const feedSourceTouchedRef = useRef(false);
  const feedSourceAutoScopeRef = useRef('');
  const feedCursorRef = useRef(0);

  const explainerMap = useMemo<ExplainerAnchorMap>(() => {
    return explainers.reduce<ExplainerAnchorMap>((acc, item) => {
      acc[item.anchor] = item;
      return acc;
    }, {});
  }, [explainers]);

  const effectiveCountry = useMemo(() => {
    const raw = String(settings.country || '').trim().toUpperCase();
    return /^[A-Z]{2}$/.test(raw) ? raw : '';
  }, [settings.country]);

  const querySettings = useMemo<MissionControlSettings>(() => ({
    conflict: settings.conflict,
    days: settings.days,
    mode: settings.mode,
    verificationMode: settings.verificationMode,
    profile: settings.profile,
    language: settings.language,
    country: effectiveCountry,
  }), [
    settings.conflict,
    settings.days,
    settings.mode,
    settings.verificationMode,
    settings.profile,
    settings.language,
    effectiveCountry,
  ]);

  const localeHint = useMemo(() => {
    if (settings.language && settings.language !== 'auto') {
      return settings.language;
    }
    return home?.source_suggestions?.language
      || (typeof navigator !== 'undefined' ? navigator.language : 'en');
  }, [home?.source_suggestions?.language, settings.language]);
  const localeKey = useMemo(() => resolveLocaleKey(localeHint), [localeHint]);
  const copy = UI_COPY[localeKey];
  const formatTime = useCallback((input: string | number | Date) => {
    const value = new Date(input);
    if (!Number.isFinite(value.getTime())) return '--';
    return value.toLocaleTimeString(localeHint);
  }, [localeHint]);
  const formatDateTime = useCallback((input: string | number | Date) => {
    const value = new Date(input);
    if (!Number.isFinite(value.getTime())) return '--';
    return value.toLocaleString(localeHint);
  }, [localeHint]);

  const loadBundle = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const bundle = await loadMissionControlBundle(querySettings);
      feedCursorRef.current = Number(bundle.feedItems?.page?.next_cursor || 0);
      startTransition(() => {
        setHome(bundle.home);
        setTicker(bundle.ticker);
        setAlertsInbox(bundle.alertsInbox);
        setLeaks(bundle.leaks);
        setLayersCatalog(bundle.layersCatalog);
        setMapLayerPacks(bundle.mapLayerPacks || []);
        setHazardsCatalog(bundle.hazardsCatalog);
        setSafetyGuides(bundle.safetyGuides);
        setExplainers(bundle.explainers);
        setNotificationPreference(bundle.notificationPreference);
        setAlertActions(bundle.alertActions || DEFAULT_ALERT_ACTIONS);
        setNotificationTelemetry(bundle.notificationTelemetry || null);
        setFeedHome(bundle.feedHome || null);
        setFeedItems(bundle.feedItems?.items || []);
        setFeedHasMore(Boolean(bundle.feedItems?.page?.has_more));
        setFeedTotalFiltered(Number(bundle.feedItems?.page?.total_filtered || (bundle.feedItems?.items || []).length));
        setFeedFilterCatalog(bundle.feedFiltersCatalog || null);
        setLastUpdated(new Date().toISOString());

        if (!didInitLayersRef.current) {
          const defaults = bundle.mapLayerDefaults?.length
            ? bundle.mapLayerDefaults
            : getDefaultLayerIdsByMode(bundle.layersCatalog, settings.mode);
          setActiveLayers(new Set(defaults));
          didInitLayersRef.current = true;
        }

        const center = bundle.mapSession?.default_center || bundle.home.map.default_center;
        if (center && mapVisualMode === 'tactical' && !didInitViewRef.current) {
          const resolved = deriveAdaptiveMapCenter(bundle.home.map, {
            latitude: Number(center.latitude),
            longitude: Number(center.longitude),
            zoom: Number(center.zoom),
          });
          setViewState((prev) => ({
            ...prev,
            latitude: resolved.latitude,
            longitude: resolved.longitude,
            zoom: resolved.zoom,
          }));
          didInitViewRef.current = true;
        }

        if (!isMobile && !selectedAlert && bundle.home.critical_now.length > 0) {
          setSelectedAlert(bundle.home.critical_now[0]);
        }
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.failedLoadMissionControl);
    } finally {
      setLoading(false);
    }
  }, [copy.failedLoadMissionControl, querySettings, selectedAlert, isMobile, settings.mode, mapVisualMode]);

  useEffect(() => {
    loadBundle();
  }, [loadBundle]);

  const loadFeedTab = useCallback(async (opts: { append?: boolean } = {}) => {
    const append = Boolean(opts.append);
    const cursorValue = append ? feedCursorRef.current : 0;
    try {
      if (append) {
        setFeedLoadingMore(true);
      } else {
        setFeedLoading(true);
      }
      const normalizedSeverity =
        feedSeverityChip === 'CRITICAL' || feedSeverityChip === 'HIGH' ? feedSeverityChip : 'ALL';
      const scopedSourceTypes =
        rightRailTab === 'feed' ? feedSourceTypes.map(normalizeFeedSourceType).filter(Boolean) : [];
      const scopedTopics = rightRailTab === 'feed' ? feedTopicFilter : [];
      const scopedCategories = rightRailTab === 'feed' ? feedCategoryFilter : [];
      const scopedCountries = rightRailTab === 'feed' ? feedCountryFilter : [];
      const payload = await loadMissionControlFeedItems({
        settings: querySettings,
        tab: rightRailTab,
        cursor: cursorValue,
        limit: settings.mode === 'simple' ? 36 : 64,
        severity: normalizedSeverity,
        sourceType: scopedSourceTypes,
        topic: scopedTopics,
        category: scopedCategories,
        countryFilter: scopedCountries,
        verificationStatus: 'all',
        timeRange: settings.mode === 'simple' ? '48h' : '7d',
        search: debouncedFeedSearchQuery,
      });
      const incoming = Array.isArray(payload.items) ? payload.items : [];
      const normalizedIncoming = incoming.map((item) => ({
        ...item,
        source_type: normalizeFeedSourceType(item.source_type),
      }));
      const severityFiltered = feedSeverityChip !== 'LOW'
        ? normalizedIncoming
        : normalizedIncoming.filter((item) => item.severity === 'ELEVATED' || item.severity === 'INFO');
      const nextCursor = Number(payload.page?.next_cursor || 0);
      feedCursorRef.current = nextCursor;
      startTransition(() => {
        setFeedItems((prev) => {
          if (!append) return severityFiltered;
          const seen = new Set(prev.map((item) => `${item.id}:${item.updated_at}`));
          const merged = [...prev];
          severityFiltered.forEach((item) => {
            const key = `${item.id}:${item.updated_at}`;
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(item);
            }
          });
          return merged;
        });
        setFeedHasMore(Boolean(payload.page?.has_more));
        setFeedTotalFiltered(Number(payload.page?.total_filtered || severityFiltered.length));
        if (payload.filters_catalog) {
          setFeedFilterCatalog(payload.filters_catalog);
        }
        if (!append) {
          setExpandedFeedItemId('');
        }
      });
    } catch (feedError) {
      setStatusMessage(feedError instanceof Error ? feedError.message : copy.feedRefreshFailed);
    } finally {
      if (append) {
        setFeedLoadingMore(false);
      } else {
        setFeedLoading(false);
      }
    }
  }, [
    querySettings,
    rightRailTab,
    settings.mode,
    feedSeverityChip,
    feedSourceTypes,
    feedTopicFilter,
    feedCategoryFilter,
    feedCountryFilter,
    debouncedFeedSearchQuery,
    copy.feedRefreshFailed,
  ]);

  useEffect(() => {
    loadFeedTab();
  }, [loadFeedTab]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedFeedSearchQuery(String(deferredFeedSearchQuery || '').trim());
    }, 220);
    return () => window.clearTimeout(timer);
  }, [deferredFeedSearchQuery]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(''), 4200);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadBundle();
      }
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadBundle]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!layersCatalog.length) return;
    if (previousModeRef.current === settings.mode) return;
    previousModeRef.current = settings.mode;
    const defaults = getDefaultLayerIdsByMode(layersCatalog, settings.mode);
    setActiveLayers(new Set(defaults));
    setViewState((prev) => ({
      ...prev,
      pitch: settings.mode === 'analyst' ? 36 : 24,
      bearing: settings.mode === 'analyst' ? -14 : -4,
      zoom: settings.mode === 'analyst' ? Math.max(prev.zoom, 5.4) : Math.min(prev.zoom, 5.2),
    }));
    if (settings.mode === 'simple') {
      setFeedFilterPicker(null);
      setFeedFilterSearch('');
      setFeedTopicFilter([]);
      setFeedCategoryFilter([]);
      setFeedCountryFilter([]);
      if (rightRailTab !== 'feed') {
        setRightRailTab('feed');
      }
    }
    setStatusMessage(
      settings.mode === 'analyst'
        ? copy.analystModeEnabledStatus
        : copy.simpleModeEnabledStatus
    );
  }, [copy.analystModeEnabledStatus, copy.simpleModeEnabledStatus, layersCatalog, rightRailTab, settings.mode]);

  useEffect(() => {
    const shouldFallbackFromError = (message: string) => {
      const text = String(message || '');
      return text.includes('maxTextureDimension2D') || text.includes('WebGLCanvasContext');
    };

    const onWindowError = (event: ErrorEvent) => {
      const message = event?.message || (event?.error instanceof Error ? event.error.message : '');
      if (!shouldFallbackFromError(message)) return;
      setDeckUnavailable(true);
      setStatusMessage(copy.deckFallbackStatus);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const message =
        reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : '';
      if (!shouldFallbackFromError(message)) return;
      setDeckUnavailable(true);
      setStatusMessage(copy.deckFallbackStatus);
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [copy.deckFallbackStatus]);

  useEffect(() => {
    if (!playbackEnabled || !home?.critical_now?.length) return undefined;
    const timer = setInterval(() => {
      setPlaybackIndex((prev) => (prev + 1) % home.critical_now.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [playbackEnabled, home?.critical_now?.length]);

  useEffect(() => {
    if (!playbackEnabled || !home?.critical_now?.length) return;
    const target = home.critical_now[playbackIndex];
    if (!target || target.latitude === null || target.longitude === null) return;
    setSelectedAlert(target);
    setViewState((prev) => ({
      ...prev,
      latitude: Number(target.latitude),
      longitude: Number(target.longitude),
      zoom: Math.max(prev.zoom, 6.2),
    }));
  }, [playbackEnabled, playbackIndex, home?.critical_now]);

  const acknowledgedAlertSet = useMemo(
    () => new Set((alertActions?.acknowledged_alert_ids || []).map((item) => String(item))),
    [alertActions?.acknowledged_alert_ids]
  );
  const mutedSignatureSet = useMemo(
    () => new Set((alertActions?.muted_signatures || []).map((item) => String(item))),
    [alertActions?.muted_signatures]
  );

  const filteredCriticalCards = useMemo(() => {
    const cards = home?.critical_now || [];
    return cards
      .filter((card) => (severityFilter === 'ALL' ? true : card.severity === severityFilter))
      .filter((card) => matchesSearch(`${card.title} ${card.location} ${card.summary}`, deferredGlobalSearchQuery))
      .filter((card) => !acknowledgedAlertSet.has(card.id))
      .filter((card) => !mutedSignatureSet.has(`${card.location}::${card.source_name}`))
      .sort(
        (a, b) =>
          (SEVERITY_PRIORITY[b.severity] || 0) - (SEVERITY_PRIORITY[a.severity] || 0) ||
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }, [home?.critical_now, severityFilter, deferredGlobalSearchQuery, acknowledgedAlertSet, mutedSignatureSet]);
  const fallbackSignalCards = useMemo<AlertCardMC[]>(() => {
    if (filteredCriticalCards.length) return [];
    const points = home?.map?.event_points || [];
    return points
      .slice(0, settings.mode === 'simple' ? 4 : 6)
      .map((point, idx) => {
        const sourceTier = String(point.source_tier || 'derived');
        const isFlight = sourceTier.includes('flight');
        const isMaritime = sourceTier.includes('maritime') || sourceTier.includes('sea');
        const isCyber = sourceTier.includes('cyber');
        const titlePrefix = isFlight ? 'Flight signal' : isMaritime ? 'Maritime signal' : isCyber ? 'Cyber signal' : 'Live signal';
        const evidencePills = isFlight
          ? ['Flight', 'Overlay', 'Live']
          : isMaritime
            ? ['Maritime', 'Overlay', 'Live']
            : isCyber
              ? ['Cyber', 'Overlay', 'Live']
              : ['Derived', 'Overlay', 'Live'];
        return {
          id: `derived-signal-${point.id || idx + 1}`,
          event_id: String(point.id || `signal-${idx + 1}`),
          title: `${titlePrefix} • ${String(point.location || 'Unknown')}`,
          location: String(point.location || 'Unknown location'),
          severity: severityFromMapPoint(point),
          confidence_score: Number(point.confidence || 0.42),
          source_count: 1,
          updated_at: String(point.event_date || new Date().toISOString()),
          verification_status: 'derived-signal',
          source_tier: sourceTier,
          summary: `${titlePrefix} derived from active World Monitor overlays.`,
          source_name: 'World Monitor derived signal',
          hazard_type: 'general',
          evidence_pills: evidencePills,
          latitude: Number(point.latitude),
          longitude: Number(point.longitude),
          actions: ['acknowledge', 'mute_similar', 'follow_region'],
        };
      });
  }, [filteredCriticalCards.length, home?.map?.event_points, settings.mode]);
  const visibleCriticalCards = filteredCriticalCards.length ? filteredCriticalCards : fallbackSignalCards;

  useEffect(() => {
    const currentIds = new Set(filteredCriticalCards.map((item) => item.id));
    if (!seenCriticalIdsRef.current.size) {
      seenCriticalIdsRef.current = currentIds;
      return;
    }
    const newCards = filteredCriticalCards.filter((item) => !seenCriticalIdsRef.current.has(item.id));
    seenCriticalIdsRef.current = currentIds;
    if (!newCards.length) return;

    const topIncoming = [...newCards].sort((a, b) => {
      const severityDelta = (SEVERITY_PRIORITY[b.severity] || 0) - (SEVERITY_PRIORITY[a.severity] || 0);
      if (severityDelta) return severityDelta;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })[0];
    if (!topIncoming) return;

    const audioPref = notificationPreference?.audio;
    if (!audioPref) return;

    if (audioPref.vibration && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(vibrationPatternForSeverity(topIncoming.severity));
    }
    if (audioPref.mode !== 'tone') return;

    const now = Date.now();
    if (now - audioCooldownRef.current < 1500) return;
    audioCooldownRef.current = now;

    const profile = audioPref.severity_profiles?.[topIncoming.severity] || DEFAULT_AUDIO_PROFILES[topIncoming.severity];
    playAlertTone(profile, topIncoming.severity).catch(() => {});
  }, [filteredCriticalCards, notificationPreference?.audio]);

  const filteredLeaks = useMemo(() => {
    return leaks
      .filter((item) => matchesSearch(`${item.title} ${item.location} ${item.summary}`, deferredGlobalSearchQuery))
      .sort(
        (a, b) =>
          (SEVERITY_PRIORITY[b.severity] || 0) - (SEVERITY_PRIORITY[a.severity] || 0) ||
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }, [leaks, deferredGlobalSearchQuery]);

  const filteredTicker = useMemo(() => {
    const maxItems = settings.mode === 'simple' ? 16 : 28;
    const base = ticker
      .filter((item) => (severityFilter === 'ALL' ? true : item.severity === severityFilter))
      .filter((item) => matchesSearch(`${item.headline} ${item.location}`, deferredGlobalSearchQuery));
    if (tickerViewMode === 'all') {
      return buildMixedTickerItems(base, maxItems);
    }
    return base
      .filter((item) => item.kind === tickerViewMode)
      .sort(
        (a, b) =>
          (SEVERITY_PRIORITY[b.severity] || 0) - (SEVERITY_PRIORITY[a.severity] || 0) ||
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, maxItems);
  }, [ticker, tickerViewMode, severityFilter, deferredGlobalSearchQuery, settings.mode]);
  const hasLeakTicker = useMemo(() => ticker.some((item) => item.kind === 'leak'), [ticker]);
  const liveStripHeadline = useMemo(() => {
    const top = filteredTicker[0];
    if (!top) return copy.tickerEmpty;
    return compactFeedText(top.headline).slice(0, 84) || top.headline;
  }, [copy.tickerEmpty, filteredTicker]);

  const pizzint = home?.pizzint || null;
  const pizzaDefconLevel = Number(pizzint?.defcon_level || 0);
  const pizzaDefconColor = DEFCON_COLORS[pizzaDefconLevel] || '#64748b';
  const pizzaDefconLabel = pizzaDefconLevel > 0 ? `DEFCON ${pizzaDefconLevel}` : '--';
  const pizzaActivityLabel = Number.isFinite(Number(pizzint?.aggregate_activity))
    ? `${Math.max(0, Math.round(Number(pizzint?.aggregate_activity || 0)))}%`
    : '--%';
  const pizzaUpdatedLabel = formatRelativeTimeLabel(pizzint?.updated_at, copy);
  const pizzaDefconStatusLabel = getPizzintDefconLabel(copy, pizzaDefconLevel, pizzint?.defcon_label);
  const pizzaLocations = (pizzint?.locations || []).slice(0, 8);
  const pizzaTensions = (pizzint?.tensions || []).slice(0, 4);
  const pizzaIndicatorState: HealthState = pizzaDefconLevel <= 2 ? 'offline' : pizzaDefconLevel <= 4 ? 'weak' : 'online';
  const profileBadge = (settings.profile || 'U').slice(0, 1).toUpperCase();

  const selectedIncidentType = useMemo(() => {
    if (selectedAlert?.hazard_type) return normalizeIncidentType(selectedAlert.hazard_type);
    if (selectedLeak?.hazard_type) return normalizeIncidentType(selectedLeak.hazard_type);
    if (filteredCriticalCards[0]?.hazard_type) return normalizeIncidentType(filteredCriticalCards[0].hazard_type);
    return 'general';
  }, [filteredCriticalCards, selectedAlert, selectedLeak]);

  const activeSafetyGuides = useMemo(() => {
    const incidentType = normalizeIncidentType(selectedIncidentType);
    const scoped = safetyGuides.filter((item) => {
      const guideType = normalizeIncidentType(item.incident_type);
      return guideType === incidentType || guideType === 'general';
    });
    const deduped = Array.from(new Map(scoped.map((item) => [item.id, item])).values());
    return deduped.slice(0, settings.mode === 'simple' ? 3 : 5);
  }, [safetyGuides, selectedIncidentType, settings.mode]);

  const activeHazardInfo = useMemo(() => {
    return hazardsCatalog.find((item) => normalizeIncidentType(item.id) === normalizeIncidentType(selectedIncidentType)) || null;
  }, [hazardsCatalog, selectedIncidentType]);
  const selectedLeakSummary = useMemo(
    () => stripLeakVerificationText(selectedLeak?.summary) || copy.leakSummaryFallback,
    [selectedLeak?.summary, copy.leakSummaryFallback]
  );
  const visibleLayerChips = useMemo(() => {
    const priorityOrder = [
      'verified-hotspots',
      'flight-radar',
      'maritime-risk',
      'cyber-comms',
      'critical-infrastructure',
      'weather-alerts',
      'strategic-waterways',
      'economic-shocks',
      'conflict-zones',
    ];
    const layerMap = new Map(layersCatalog.map((item) => [item.id, item]));
    const prioritized = priorityOrder
      .map((id) => layerMap.get(id))
      .filter(Boolean) as LayerDescriptorMC[];
    const remaining = layersCatalog.filter((item) => !priorityOrder.includes(item.id));
    const merged = [...prioritized, ...remaining];
    if (isMobile) {
      return merged.slice(0, settings.mode === 'simple' ? 3 : 4);
    }
    return settings.mode === 'simple' ? merged.slice(0, 4) : merged.slice(0, 7);
  }, [isMobile, layersCatalog, settings.mode]);
  const visibleMapPacks = useMemo(() => {
    const incoming = Array.isArray(mapLayerPacks) ? mapLayerPacks : [];
    if (isMobile) {
      return incoming.filter((pack) => ['mission-core', 'flights'].includes(pack.id)).slice(0, 2);
    }
    if (settings.mode === 'simple') {
      return incoming.filter((pack) => ['mission-core', 'flights', 'maritime'].includes(pack.id)).slice(0, 3);
    }
    return incoming.slice(0, 6);
  }, [isMobile, mapLayerPacks, settings.mode]);
  const analystSignals = useMemo(() => ({
    signals: home?.map.event_points?.length || 0,
    flights: home?.map.optional_feeds.flight_radar?.length || 0,
    maritime: home?.map.optional_feeds.maritime_risk?.length || 0,
    cyber: home?.map.optional_feeds.cyber_comms?.length || 0,
  }), [home]);

  const visibleMapSignals = useMemo(() => {
    if (!home) return 0;
    let total = 0;
    if (activeLayers.has('verified-hotspots')) {
      total += (home.map.event_points || []).filter((point) => {
        const pointSeverity = severityFromMapPoint(point);
        return severityFilter === 'ALL' ? true : pointSeverity === severityFilter;
      }).length;
    }
    if (activeLayers.has('conflict-zones')) total += home.map.location_intensity?.length || 0;
    if (activeLayers.has('flight-radar')) total += home.map.optional_feeds.flight_radar?.length || 0;
    if (activeLayers.has('maritime-risk')) total += home.map.optional_feeds.maritime_risk?.length || 0;
    if (activeLayers.has('cyber-comms')) total += home.map.optional_feeds.cyber_comms?.length || 0;
    if (activeLayers.has('weather-alerts')) total += home.map.optional_feeds.weather_alerts?.length || 0;
    if (activeLayers.has('economic-shocks')) total += home.map.optional_feeds.economic_shocks?.length || 0;
    return total;
  }, [activeLayers, home, severityFilter]);

  const notificationCounts = useMemo(() => {
    return {
      critical: alertsInbox?.critical?.length || 0,
      assigned: alertsInbox?.assigned?.length || 0,
      following: alertsInbox?.following?.length || 0,
      resolved: alertsInbox?.resolved?.length || 0,
      unread: alertsInbox?.unread_total || home?.notification_summary?.unread_total || 0,
    };
  }, [alertsInbox, home?.notification_summary]);

  const notificationTabCounts = useMemo(
    () => ({
      Critical: notificationCounts.critical,
      Assigned: notificationCounts.assigned,
      Following: notificationCounts.following,
      Resolved: notificationCounts.resolved,
    }),
    [notificationCounts]
  );

  const notificationCards = useMemo(() => {
    if (!alertsInbox) return [];
    const key = mapNotificationTabToKey(notificationTab);
    const cards = alertsInbox[key];
    return Array.isArray(cards) ? cards : [];
  }, [alertsInbox, notificationTab]);

  const feedTabCounts = useMemo(() => {
    const base = feedHome?.tab_counts || { feed: 0, whale: 0, flights: 0 };
    const currentCount = feedItems.length;
    if (rightRailTab === 'feed') {
      return { ...base, feed: Math.max(base.feed || 0, currentCount) };
    }
    if (rightRailTab === 'whale') {
      return { ...base, whale: Math.max(base.whale || 0, currentCount) };
    }
    return { ...base, flights: Math.max(base.flights || 0, currentCount) };
  }, [feedHome?.tab_counts, feedItems.length, rightRailTab]);

  const feedCatalogSourceTypes = useMemo(() => {
    const items = feedFilterCatalog?.source_types || [];
    const set = new Set(items.map((item) => normalizeFeedSourceType(item)).filter(Boolean));
    return FEED_SOURCE_TOGGLE_ORDER.filter((item) => item === 'all' || set.has(item));
  }, [feedFilterCatalog?.source_types]);

  const suggestedFeedSourceTypes = useMemo(() => {
    const suggestions = home?.source_suggestions?.items || [];
    const selected = suggestions
      .filter((item) => item.enabled_by_default !== false)
      .map((item) => mapSuggestionToFeedSourceType(item))
      .filter(Boolean);
    return [...new Set(selected)];
  }, [home?.source_suggestions?.items]);

  const visibleFeedSourceTypes = useMemo(() => {
    const seeded = new Set<string>(
      (feedCatalogSourceTypes.length ? feedCatalogSourceTypes : FEED_SOURCE_TOGGLE_ORDER).map((item) =>
        normalizeFeedSourceType(item)
      )
    );
    suggestedFeedSourceTypes.forEach((item) => seeded.add(item));
    if (!seeded.size) {
      FEED_SOURCE_TOGGLE_ORDER.forEach((item) => seeded.add(item));
    }
    const simplePriority = ['all', 'telegram', 'news', 'official', 'wm-ai'];
    return FEED_SOURCE_TOGGLE_ORDER.filter((item) => {
      if (item === 'all') return true;
      if (!seeded.has(item)) return false;
      if (settings.mode === 'simple') {
        return simplePriority.includes(item);
      }
      return true;
    });
  }, [feedCatalogSourceTypes, settings.mode, suggestedFeedSourceTypes]);

  useEffect(() => {
    if (!home?.source_suggestions?.items?.length) return;
    if (feedSourceTouchedRef.current || feedSourceTypes.length > 0) return;
    const scopeKey = `${home.source_suggestions.language || 'auto'}:${home.source_suggestions.country || 'global'}`;
    if (feedSourceAutoScopeRef.current === scopeKey) return;
    if (!suggestedFeedSourceTypes.length) return;
    setFeedSourceTypes(suggestedFeedSourceTypes);
    feedSourceAutoScopeRef.current = scopeKey;
  }, [feedSourceTypes.length, home?.source_suggestions, suggestedFeedSourceTypes]);

  useEffect(() => {
    if (settings.mode !== 'analyst' && feedFilterPicker) {
      setFeedFilterPicker(null);
      setFeedFilterSearch('');
    }
  }, [feedFilterPicker, settings.mode]);

  useEffect(() => {
    setFeedFilterPicker(null);
    setFeedFilterSearch('');
    setExpandedFeedItemId('');
  }, [rightRailTab]);

  useEffect(() => {
    if (settings.mode !== 'analyst' && expandedFeedItemId) {
      setExpandedFeedItemId('');
    }
  }, [expandedFeedItemId, settings.mode]);

  const effectiveFeedItems = useMemo(() => {
    return feedItems.map((item) => ({
      ...item,
      source_type: normalizeFeedSourceType(item.source_type),
    }));
  }, [feedItems]);

  const leaksById = useMemo(() => {
    const map = new Map<string, LeakItemMC>();
    leaks.forEach((item) => {
      map.set(String(item.id), item);
      map.set(String(item.title), item);
    });
    return map;
  }, [leaks]);

  const alertsById = useMemo(() => {
    const map = new Map<string, AlertCardMC>();
    [...(home?.critical_now || []), ...fallbackSignalCards].forEach((item) => {
      map.set(String(item.id), item);
      map.set(String(item.event_id), item);
      map.set(String(item.title), item);
    });
    return map;
  }, [fallbackSignalCards, home?.critical_now]);

  const toggleFeedSourceType = useCallback((sourceType: string) => {
    const normalized = normalizeFeedSourceType(sourceType);
    feedSourceTouchedRef.current = true;
    if (!normalized || normalized === 'all') {
      setFeedSourceTypes([]);
      return;
    }
    setFeedSourceTypes((prev) => {
      const next = new Set(prev.map((item) => normalizeFeedSourceType(item)));
      if (next.has(normalized)) {
        next.delete(normalized);
      } else {
        next.add(normalized);
      }
      return [...next.values()];
    });
  }, []);

  const clearFeedFilters = useCallback(() => {
    feedSourceTouchedRef.current = true;
    feedCursorRef.current = 0;
    setFeedSourceTypes([]);
    setFeedSeverityChip('ALL');
    setFeedTopicFilter([]);
    setFeedCategoryFilter([]);
    setFeedCountryFilter([]);
    setFeedHasMore(false);
    setFeedTotalFiltered(0);
    setFeedFilterPicker(null);
    setFeedFilterSearch('');
    setFeedSearchQuery('');
  }, []);

  const toggleFeedItemExpanded = useCallback((itemId: string) => {
    setExpandedFeedItemId((prev) => (prev === itemId ? '' : itemId));
  }, []);

  const filterPickerOptions = useMemo(() => {
    if (feedFilterPicker === 'topic') return feedFilterCatalog?.topics || [];
    if (feedFilterPicker === 'category') return feedFilterCatalog?.categories || [];
    if (feedFilterPicker === 'country') return feedFilterCatalog?.countries || [];
    return [];
  }, [feedFilterCatalog?.categories, feedFilterCatalog?.countries, feedFilterCatalog?.topics, feedFilterPicker]);

  const activePickerValue = useMemo(() => {
    if (feedFilterPicker === 'topic') return feedTopicFilter;
    if (feedFilterPicker === 'category') return feedCategoryFilter;
    if (feedFilterPicker === 'country') return feedCountryFilter;
    return [];
  }, [feedCategoryFilter, feedCountryFilter, feedFilterPicker, feedTopicFilter]);

  const visiblePickerOptions = useMemo(() => {
    const needle = String(feedFilterSearch || '').trim().toLowerCase();
    if (!needle) return filterPickerOptions.slice(0, 120);
    return filterPickerOptions
      .filter((item) => String(item || '').toLowerCase().includes(needle))
      .slice(0, 120);
  }, [feedFilterSearch, filterPickerOptions]);

  const applyPickerFilter = useCallback(
    (value: string) => {
      if (!feedFilterPicker) return;
      if (feedFilterPicker === 'topic') {
        setFeedTopicFilter((prev) => toggleListValue(prev, value));
      } else if (feedFilterPicker === 'category') {
        setFeedCategoryFilter((prev) => toggleListValue(prev, value));
      } else {
        setFeedCountryFilter((prev) => toggleListValue(prev, value));
      }
    },
    [feedFilterPicker]
  );

  const feedTopicChipLabel = useMemo(() => {
    if (!feedTopicFilter.length) return copy.feedTopic;
    return feedTopicFilter.length === 1
      ? `#${feedTopicFilter[0]}`
      : `#${feedTopicFilter[0]} +${feedTopicFilter.length - 1}`;
  }, [copy.feedTopic, feedTopicFilter]);

  const feedCategoryChipLabel = useMemo(() => {
    if (!feedCategoryFilter.length) return copy.feedCategory;
    return feedCategoryFilter.length === 1
      ? `#${feedCategoryFilter[0]}`
      : `#${feedCategoryFilter[0]} +${feedCategoryFilter.length - 1}`;
  }, [copy.feedCategory, feedCategoryFilter]);

  const feedCountryChipLabel = useMemo(() => {
    if (!feedCountryFilter.length) return copy.feedCountry;
    return feedCountryFilter.length === 1
      ? feedCountryFilter[0]
      : `${feedCountryFilter[0]} +${feedCountryFilter.length - 1}`;
  }, [copy.feedCountry, feedCountryFilter]);
  const feedFilterTabCounts = useMemo(
    () => ({
      topic: feedTopicFilter.length,
      category: feedCategoryFilter.length,
      country: feedCountryFilter.length,
    }),
    [feedCategoryFilter.length, feedCountryFilter.length, feedTopicFilter.length]
  );

  const handleDeckUnavailable = useCallback(() => {
    setDeckUnavailable(true);
    setStatusMessage(copy.deckFallbackStatus);
  }, [copy.deckFallbackStatus]);

  const openExplainer = useCallback(
    (anchor: string) => {
      const target = findExplainerByAnchor(explainers, anchor);
      if (target) {
        setDocsAnchor(target.anchor);
      } else {
        setDocsAnchor(anchor);
      }
      setDocsOpen(true);
    },
    [explainers]
  );

  const handleMapFocus = useCallback((card: AlertCardMC) => {
    setSelectedAlert(card);
    setSelectedLeak(null);
    if (isMobile && MOBILE_SURFACE_MUTEX_ENABLED) {
      setMobileSheetOpen(false);
    }
    if (card.latitude === null || card.longitude === null) return;
    setViewState((prev) => ({
      ...prev,
      latitude: Number(card.latitude),
      longitude: Number(card.longitude),
      zoom: Math.max(6.4, prev.zoom),
    }));
  }, [isMobile]);

  const handleLeakFocus = useCallback((item: LeakItemMC) => {
    setSelectedLeak(item);
    setSelectedAlert(null);
    if (isMobile && MOBILE_SURFACE_MUTEX_ENABLED) {
      setMobileSheetOpen(false);
    }
    if (item.latitude === null || item.longitude === null) return;
    setViewState((prev) => ({
      ...prev,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      zoom: Math.max(6.1, prev.zoom),
    }));
  }, [isMobile]);

  const handleTickerClick = useCallback(
    (item: TickerItemMC) => {
      setRightRailTab('feed');
      if (item.kind === 'leak') {
        setFeedSourceTypes((prev) => (prev.includes('telegram') ? prev : [...prev, 'telegram']));
      }
      if (item.kind === 'leak') {
        const leak = filteredLeaks.find((row) => row.id === item.alert_id || row.title === item.headline);
        if (leak) {
          handleLeakFocus(leak);
        }
        return;
      }

      const alert = filteredCriticalCards.find((row) => row.id === item.alert_id || row.title === item.headline);
      if (alert) {
        handleMapFocus(alert);
      }
    },
    [filteredCriticalCards, filteredLeaks, handleLeakFocus, handleMapFocus]
  );

  const handleFeedLoadMore = useCallback(() => {
    if (feedLoading || feedLoadingMore || !feedHasMore) return;
    loadFeedTab({ append: true });
  }, [feedHasMore, feedLoading, feedLoadingMore, loadFeedTab]);

  const acknowledgeCard = useCallback(async (card: AlertCardMC) => {
    try {
      const result = await postAlertAction('acknowledge', card.id, settings.profile, {
        location: card.location,
        source_name: card.source_name,
      });
      setAlertActions(result.state);
      setStatusMessage(formatCopyTemplate(copy.acknowledgedStatus, { title: card.title }));
      await loadBundle();
    } catch (error) {
      setError(error instanceof Error ? error.message : copy.failedAcknowledge);
    }
  }, [copy.acknowledgedStatus, copy.failedAcknowledge, loadBundle, settings.profile]);

  const muteSimilar = useCallback(async (card: AlertCardMC) => {
    try {
      const result = await postAlertAction('mute-similar', card.id, settings.profile, {
        location: card.location,
        source_name: card.source_name,
        signature: `${card.location}::${card.source_name}`,
      });
      setAlertActions(result.state);
      setStatusMessage(formatCopyTemplate(copy.mutedStatus, { location: card.location }));
      await loadBundle();
    } catch (error) {
      setError(error instanceof Error ? error.message : copy.failedMuteSimilar);
    }
  }, [copy.failedMuteSimilar, copy.mutedStatus, loadBundle, settings.profile]);

  const followRegion = useCallback(async (card: AlertCardMC) => {
    try {
      const result = await postAlertAction('follow-region', card.id, settings.profile, {
        region: card.location,
        location: card.location,
      });
      setAlertActions(result.state);
      setStatusMessage(formatCopyTemplate(copy.followingStatus, { location: card.location }));
      await loadBundle();
    } catch (error) {
      setError(error instanceof Error ? error.message : copy.failedFollowRegion);
    }
  }, [copy.failedFollowRegion, copy.followingStatus, loadBundle, settings.profile]);

  const handleFeedItemFocus = useCallback((item: FeedItemMC) => {
    if (item.kind === 'leak') {
      const leak = leaksById.get(String(item.alert_id)) || leaksById.get(String(item.id)) || leaksById.get(String(item.title));
      if (leak) {
        handleLeakFocus(leak);
        return;
      }
      handleLeakFocus({
        id: item.id,
        title: item.title,
        location: item.location,
        severity: item.severity,
        confidence_score: item.confidence_score,
        source_count: item.source_count,
        updated_at: item.updated_at,
        verification_status: item.verification_status,
        hazard_type: item.category,
        unverified_reason: String(item.metadata?.unverified_reason || copy.leakVerificationHint),
        risk_warning_level: String(item.metadata?.risk_warning_level || 'medium'),
        source_name: item.source_name,
        summary: item.summary,
        latitude: Number(item.metadata?.latitude || NaN) || null,
        longitude: Number(item.metadata?.longitude || NaN) || null,
      });
      return;
    }

    const alert = alertsById.get(String(item.alert_id)) || alertsById.get(String(item.id)) || alertsById.get(String(item.title));
    if (alert) {
      handleMapFocus(alert);
      return;
    }
    handleMapFocus({
      id: item.id,
      event_id: item.alert_id || item.id,
      title: item.title,
      location: item.location,
      severity: item.severity,
      confidence_score: item.confidence_score,
      source_count: item.source_count,
      updated_at: item.updated_at,
      verification_status: item.verification_status,
      source_tier: String(item.metadata?.source_tier || item.source_type || 'source'),
      summary: item.summary,
      source_name: item.source_name,
      hazard_type: item.category,
      evidence_pills: Array.isArray(item.metadata?.evidence_pills)
        ? (item.metadata?.evidence_pills as string[]).slice(0, 3)
        : [item.category, item.source_type].filter(Boolean),
      latitude: Number(item.metadata?.latitude || NaN) || null,
      longitude: Number(item.metadata?.longitude || NaN) || null,
      actions: ['focus'],
    });
  }, [alertsById, copy.leakVerificationHint, handleLeakFocus, handleMapFocus, leaksById]);

  const handleFeedItemAcknowledge = useCallback(
    (item: FeedItemMC) => {
      const alert = alertsById.get(String(item.alert_id)) || alertsById.get(String(item.id));
      if (!alert) return;
      acknowledgeCard(alert);
    },
    [acknowledgeCard, alertsById]
  );

  const handleFeedItemMute = useCallback(
    (item: FeedItemMC) => {
      const alert = alertsById.get(String(item.alert_id)) || alertsById.get(String(item.id));
      if (!alert) return;
      muteSimilar(alert);
    },
    [alertsById, muteSimilar]
  );

  const handleFeedItemFollow = useCallback(
    (item: FeedItemMC) => {
      const alert = alertsById.get(String(item.alert_id)) || alertsById.get(String(item.id));
      if (!alert) return;
      followRegion(alert);
    },
    [alertsById, followRegion]
  );

  const toggleLayer = useCallback((layerId: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  const applyLayerPack = useCallback((pack: MapLayerPackMC) => {
    const layerIds = Array.isArray(pack.layer_ids) ? pack.layer_ids : [];
    if (!layerIds.length) return;
    setActiveLayers(new Set(layerIds));
    setStatusMessage(`${copy.layerPacks}: ${getLayerPackLabel(copy, pack)}`);
  }, [copy]);

  const applyPreset = useCallback(
    async (preset: WorkspacePresetMC) => {
      setSelectedPresetId(preset.id);
      setSettings((prev) => ({
        ...prev,
        mode: preset.mode || prev.mode,
      }));
      if (Array.isArray(preset.layout?.quick_actions) && preset.layout.quick_actions.length > 0) {
        setQuickActions(
          QUICK_ACTION_LABELS.filter((item) => preset.layout.quick_actions?.includes(item))
        );
      }
      try {
        await updateWorkspacePreset(preset.id, preset);
      } catch {
        // Ignore save failure for now; local state remains source of truth in session.
      }
    },
    []
  );

  const resetMapFilters = useCallback(() => {
    setSeverityFilter('ALL');
    if (layersCatalog.length) {
      setActiveLayers(new Set(getDefaultLayerIdsByMode(layersCatalog, settings.mode)));
    }
    setStatusMessage(copy.resetMapFilters);
  }, [copy.resetMapFilters, layersCatalog, settings.mode]);

  const resetToDefaultLayout = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    setMainView('Map');
    didInitViewRef.current = false;
    setSeverityFilter('ALL');
    setTickerViewMode('verified');
    setQuickActions(QUICK_ACTION_LABELS);
    setGlobalSearchQuery('');
    setFeedSearchQuery('');
    setDebouncedFeedSearchQuery('');
    setRightRailTab('feed');
    setStatusMessage(copy.layoutResetStatus);
    try {
      await updateWorkspacePreset('ops-commander', {
        id: 'ops-commander',
        name: 'Ops Commander',
        mode: 'simple',
        description: 'Map-first command posture with persistent critical rail.',
        layout: {
          modules: ['map', 'critical-now', 'ticker', 'notifications'],
          quick_actions: QUICK_ACTION_LABELS,
          right_rail: true,
          leaks_lane_collapsed: true,
        },
      });
    } catch {
      // Non-blocking.
    }
  }, [copy.layoutResetStatus]);

  const saveNotificationDefaults = useCallback(async () => {
    if (!notificationPreference) return;
    try {
      const next = await updateNotificationPreferences(settings.profile, notificationPreference);
      setNotificationPreference(next);
      setStatusMessage(copy.notificationPrefsSaved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : copy.notificationPrefsSaveFailed);
    }
  }, [
    copy.notificationPrefsSaveFailed,
    copy.notificationPrefsSaved,
    notificationPreference,
    settings.profile,
  ]);

  const saveAlertAudioDefaults = useCallback(async () => {
    if (!notificationPreference) return;
    try {
      const next = await updateAlertAudioPreferences(settings.profile, {
        mode: notificationPreference.audio?.mode || 'tone',
        vibration: Boolean(notificationPreference.audio?.vibration),
        severity_profiles: notificationPreference.audio?.severity_profiles,
      });
      setNotificationPreference(next);
      setStatusMessage(copy.audioPrefsSaved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : copy.audioPrefsSaveFailed);
    }
  }, [copy.audioPrefsSaveFailed, copy.audioPrefsSaved, notificationPreference, settings.profile]);

  const toggleQuickAction = useCallback((label: string) => {
    setQuickActions((prev) => {
      if (prev.includes(label)) {
        return prev.filter((item) => item !== label);
      }
      return [...prev, label];
    });
  }, []);

  const moveQuickAction = useCallback((label: string, direction: 'up' | 'down') => {
    setQuickActions((prev) => {
      const idx = prev.indexOf(label);
      if (idx < 0) return prev;
      const next = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  }, []);

  const handleTourSkip = useCallback(() => {
    setTourStep(-1);
    localStorage.setItem(TOUR_STORAGE_KEY, '1');
  }, []);

  const handleTourNext = useCallback(() => {
    setTourStep((prev) => {
      const next = prev + 1;
      if (next >= TOUR_STEPS.length) {
        localStorage.setItem(TOUR_STORAGE_KEY, '1');
        return -1;
      }
      return next;
    });
  }, []);

  const handleShareSnapshot = useCallback(async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('conflict', settings.conflict);
    url.searchParams.set('days', String(settings.days));
    url.searchParams.set('mode', settings.mode);
    url.searchParams.set('verification', settings.verificationMode);
    url.searchParams.set('lat', viewState.latitude.toFixed(3));
    url.searchParams.set('lng', viewState.longitude.toFixed(3));
    url.searchParams.set('zoom', viewState.zoom.toFixed(2));
    try {
      await copyToClipboard(url.toString());
      setStatusMessage(copy.snapshotCopied);
    } catch {
      setStatusMessage(copy.shareUnavailable);
    }
  }, [copy.shareUnavailable, copy.snapshotCopied, settings, viewState.latitude, viewState.longitude, viewState.zoom]);

  const cycleSeverityFilter = useCallback(() => {
    setSeverityFilter((prev) => {
      const idx = SEVERITY_FILTERS.indexOf(prev);
      const nextIdx = idx < 0 ? 0 : (idx + 1) % SEVERITY_FILTERS.length;
      return SEVERITY_FILTERS[nextIdx];
    });
  }, []);
  const cycleDayRange = useCallback(() => {
    setSettings((prev) => {
      const idx = DAY_OPTIONS.indexOf(prev.days);
      const nextIdx = idx < 0 ? 0 : (idx + 1) % DAY_OPTIONS.length;
      return {
        ...prev,
        days: DAY_OPTIONS[nextIdx],
      };
    });
  }, []);
  const toggleMapVisualMode = useCallback(() => {
    const next = mapVisualMode === 'tactical' ? 'globe' : 'tactical';
    setMapVisualMode(next);
    if (next === 'globe') {
      setViewState((prev) => ({
        ...prev,
        latitude: 24,
        longitude: 18,
        zoom: 1.75,
        pitch: 46,
        bearing: -14,
      }));
      return;
    }
    const center = home?.map?.default_center || DEFAULT_VIEW_STATE;
    setViewState((prev) => ({
      ...prev,
      latitude: Number(center.latitude),
      longitude: Number(center.longitude),
      zoom: Math.max(3.8, Number(center.zoom || 4.9)),
      pitch: 38,
      bearing: 0,
    }));
  }, [mapVisualMode, home?.map?.default_center]);

  const setMobileSheetSurface = useCallback((nextOpen: boolean) => {
    setMobileSheetOpen(nextOpen);
    if (nextOpen && MOBILE_SURFACE_MUTEX_ENABLED) {
      setSelectedAlert(null);
      setSelectedLeak(null);
    }
  }, []);

  const onSheetTouchStart = useCallback((event: TouchEvent) => {
    touchStartYRef.current = event.touches[0]?.clientY || null;
  }, []);

  const onSheetTouchEnd = useCallback((event: TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const delta = touchStartYRef.current - (event.changedTouches[0]?.clientY || touchStartYRef.current);
    if (delta > 35) setMobileSheetSurface(true);
    if (delta < -35) setMobileSheetSurface(false);
    touchStartYRef.current = null;
  }, [setMobileSheetSurface]);

  useEffect(() => {
    if (!healthPanelOpen && !pizzaPanelOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (healthPanelOpen && headerHealthRef.current && !headerHealthRef.current.contains(target)) {
        setHealthPanelOpen(false);
      }
      if (pizzaPanelOpen && headerPizzaRef.current && !headerPizzaRef.current.contains(target)) {
        setPizzaPanelOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [healthPanelOpen, pizzaPanelOpen]);

  const selectedExplainer = explainerMap[docsAnchor] || explainers[0] || null;

  const degradedSourceCount = (home?.source_health || []).filter((item) => item.status !== 'ok').length;
  const dispatchSuccessRate = notificationTelemetry?.dispatch_success_rate?.rate;
  const inboxP95Ms = Number(notificationTelemetry?.qualification_to_inbox_ms?.p95_ms || 0);
  const dispatchStatusClass = !notificationTelemetry
    ? 'unknown'
    : Number(dispatchSuccessRate) >= 0.97 && inboxP95Ms > 0 && inboxP95Ms <= 3000
      ? 'ok'
      : Number(dispatchSuccessRate) >= 0.9
        ? 'warning'
        : 'degraded';
  const sourceHealthState: HealthState = degradedSourceCount === 0 ? 'online' : degradedSourceCount <= 2 ? 'weak' : 'offline';
  const dispatchHealthState: HealthState =
    dispatchStatusClass === 'ok'
      ? 'online'
      : dispatchStatusClass === 'warning' || dispatchStatusClass === 'unknown'
        ? 'weak'
        : 'offline';
  const aiHealthState: HealthState = home?.analyst?.digest?.digest_text ? 'online' : 'weak';
  const freshnessHealthState: HealthState = Number(home?.freshness?.score || 0) >= 0.7
    ? 'online'
    : Number(home?.freshness?.score || 0) >= 0.4
      ? 'weak'
      : 'offline';
  const overallHealthState = mostSevereHealth([
    sourceHealthState,
    dispatchHealthState,
    aiHealthState,
    freshnessHealthState,
  ]);
  const healthStateLabel = toHealthLabel(copy, overallHealthState);
  const utcClock = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC';

  return (
    <div className={`mc-shell ${reducedGlow ? 'reduced-glow' : ''}`} data-mode={settings.mode}>
      {(!isMobile || (isMobile && !COMPACT_MOBILE_SHELL_ENABLED)) && (
        <>
          <header className="mc-command-bar">
            <div className="mc-command-left">
              <div className="brand-lockup">
                <div className="brand-mark">MC</div>
                <div>
                  <h1>{copy.missionControlTitle}</h1>
                  <p>{copy.brandSubtitle}</p>
                </div>
              </div>
              <nav className="main-mode-switch" aria-label={copy.mainModes}>
                {MAIN_VIEWS.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={mainView === mode ? 'active' : ''}
                    onClick={() => setMainView(mode)}
                  >
                    {mapMainViewLabel(copy, mode)}
                  </button>
                ))}
              </nav>
              <div className="mc-live-strip" aria-label={copy.live}>
                <span className="live-pill">{copy.live}</span>
                <span className="live-strip-text">
                  {liveStripHeadline} · {visibleMapSignals} {copy.activeSignals}
                </span>
              </div>
            </div>

            <div className="mc-command-right">
              <div className="mc-health-indicator" ref={headerHealthRef}>
                <button
                  type="button"
                  className={`icon-button health-button state-${overallHealthState}`}
                  title={`${copy.health}: ${healthStateLabel}`}
                  aria-label={`${copy.health}: ${healthStateLabel}`}
                  onClick={() => {
                    setHealthPanelOpen((prev) => !prev);
                    setPizzaPanelOpen(false);
                  }}
                >
                  <span className={`health-dot state-${overallHealthState}`} aria-hidden="true" />
                </button>
                {healthPanelOpen && (
                  <div className="mc-health-panel">
                    <div className="health-row">
                      <span>{copy.sources}</span>
                      <strong className={`state-${sourceHealthState}`}>{toHealthLabel(copy, sourceHealthState)}</strong>
                    </div>
                    <div className="health-row">
                      <span>{copy.dispatch}</span>
                      <strong className={`state-${dispatchHealthState}`}>{toHealthLabel(copy, dispatchHealthState)}</strong>
                    </div>
                    <div className="health-row">
                      <span>{copy.ai}</span>
                      <strong className={`state-${aiHealthState}`}>{toHealthLabel(copy, aiHealthState)}</strong>
                    </div>
                    <div className="health-row">
                      <span>{copy.freshness}</span>
                      <strong className={`state-${freshnessHealthState}`}>{toHealthLabel(copy, freshnessHealthState)}</strong>
                    </div>
                    <button type="button" className="health-help-link" onClick={() => openExplainer('notification-slo')}>
                      {copy.learnStatusDetails}
                    </button>
                  </div>
                )}
              </div>

              <div className="pizzint-indicator" ref={headerPizzaRef}>
                <button
                  type="button"
                  className="pizzint-toggle compact"
                  title={`${copy.pizzaTitle}: ${pizzaDefconLabel} · ${pizzaActivityLabel}`}
                  aria-label={`${copy.pizzaTitle}: ${pizzaDefconLabel}`}
                  onClick={() => {
                    setPizzaPanelOpen((prev) => !prev);
                    setHealthPanelOpen(false);
                  }}
                >
                  <span className="pizzint-icon" aria-hidden="true">🍕</span>
                  <span
                    className={`pizzint-state state-${pizzaIndicatorState}`}
                    style={{ background: pizzaDefconColor }}
                    aria-hidden="true"
                  />
                </button>
                {pizzaPanelOpen && (
                  <div className="pizzint-panel">
                    <div className="pizzint-header">
                      <span className="pizzint-title">{copy.pizzaTitle}</span>
                      <button type="button" className="pizzint-close" onClick={() => setPizzaPanelOpen(false)}>
                        ×
                      </button>
                    </div>
                    <div className="pizzint-status-bar">
                      <div className="pizzint-defcon-label">{pizzaDefconStatusLabel}</div>
                    </div>
                    <div className="pizzint-locations">
                      {pizzaLocations.map((location) => {
                        const statusClass = getPizzintLocationStateClass(location);
                        return (
                          <div key={location.place_id || location.name} className="pizzint-location">
                            <span className="pizzint-location-name" title={location.address || location.name}>
                              {location.name}
                            </span>
                            <span className={`pizzint-location-status ${statusClass}`}>
                              {getPizzintLocationStatusLabel(copy, location)}
                            </span>
                          </div>
                        );
                      })}
                      {!pizzaLocations.length && <div className="pizzint-empty">{copy.pizzaNoLocations}</div>}
                    </div>
                    {!!pizzaTensions.length && (
                      <div className="pizzint-tensions">
                        <div className="pizzint-tensions-title">{copy.pizzaTensions}</div>
                        <div className="pizzint-tensions-list">
                          {pizzaTensions.map((pair) => (
                            <div key={pair.id} className="pizzint-tension-row">
                              <span className="pizzint-tension-label">{pair.label}</span>
                              <span className="pizzint-tension-score">
                                <span className="pizzint-tension-value">{Number(pair.score || 0).toFixed(1)}</span>
                                <span className={`pizzint-tension-trend ${pair.trend}`}>
                                  {pair.trend === 'rising' ? '↑' : pair.trend === 'falling' ? '↓' : '→'} {pair.change_percent}%
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pizzint-footer">
                      <span>
                        {copy.pizzaSource}{' '}
                        <a href="https://pizzint.watch" target="_blank" rel="noreferrer">PizzINT</a>
                      </span>
                      <span>{copy.pizzaUpdated} {pizzaUpdatedLabel}</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="icon-button bell icon-only"
                title={copy.alerts}
                aria-label={copy.alerts}
                onClick={() => setNotificationOpen(true)}
              >
                <Bell size={16} aria-hidden="true" />
                <span className="badge">{notificationCounts.unread}</span>
              </button>
              <label className="quick-search">
                <span className="sr-only">{copy.quickSearchLabel}</span>
                <Search size={14} className="quick-search-icon" aria-hidden="true" />
                <input
                  value={globalSearchQuery}
                  onChange={(event) => setGlobalSearchQuery(event.target.value)}
                  placeholder={copy.quickSearchPlaceholder}
                />
              </label>
              <button
                type="button"
                className="icon-button icon-only"
                title={copy.settings}
                aria-label={copy.settings}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-button profile"
                title={`${copy.profile} ${settings.profile}`}
                aria-label={`${copy.profile} ${settings.profile}`}
              >
                <UserRound size={16} aria-hidden="true" />
                <span className="profile-badge">{profileBadge}</span>
              </button>
            </div>
          </header>

          <section className="mc-tickbar" aria-label={copy.breakingTicker}>
            <div className="tickbar-label-wrap">
              <div className="tickbar-label">{copy.breaking}</div>
              {TICKER_VIEWMODE_ENABLED && (
                <div className="tickbar-mode-switch" role="group" aria-label={copy.tickerViewMode}>
                  {TICKER_VIEW_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={tickerViewMode === mode ? 'active' : ''}
                      onClick={() => setTickerViewMode(mode)}
                    >
                      {mode === 'all' ? copy.tickerAll : mode === 'verified' ? copy.tickerVerified : copy.tickerLeaks}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="tickbar-track">
              {filteredTicker.map((item) => {
                const cleanedHeadline = compactFeedText(item.headline) || item.headline;
                return (
                <button
                  key={item.id}
                  type="button"
                  className={`tick-item ${item.kind === 'leak' ? 'tick-leak' : 'tick-verified'}`}
                  onClick={() => handleTickerClick(item)}
                  title={`${cleanedHeadline} · ${item.location}`}
                >
                  <span className={`severity-pill severity-${item.severity.toLowerCase()}`}>{item.severity}</span>
                  <span className="tick-headline" title={cleanedHeadline}>{cleanedHeadline}</span>
                    <span className="tick-meta">
                      <span className="tick-location">{item.location}</span>
                      <span className="tick-time">{formatTime(item.updated_at)}</span>
                    </span>
                  {item.kind === 'leak' && <span className="tick-warning">{copy.unverifiedBadge}</span>}
                </button>
                );
              })}
              {!filteredTicker.length && (
                <div className="tick-empty">
                  {tickerViewMode === 'verified' && hasLeakTicker ? (
                    <>
                      <span>{copy.tickerEmptyVerified}</span>
                      <button type="button" className="tick-empty-action" onClick={() => setTickerViewMode('all')}>
                        {copy.showAllTicker}
                      </button>
                    </>
                  ) : (
                    copy.tickerEmpty
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {isMobile && COMPACT_MOBILE_SHELL_ENABLED && (
        <header className="mc-mobile-strip">
            <div className="mobile-strip-left">
              <div className="brand-mark small">MC</div>
              <div className="mobile-strip-meta">
                <strong>{copy.missionControlTitle}</strong>
                <span>
                  <span className={`mobile-health-dot state-${overallHealthState}`} aria-hidden="true" />
                  {toHealthLabel(copy, overallHealthState)} · {utcClock}
                </span>
              </div>
            </div>
          <div className="mobile-strip-right">
            <button
              type="button"
              className="icon-button bell compact"
              title={copy.alerts}
              aria-label={copy.alerts}
              onClick={() => setNotificationOpen(true)}
            >
              <Bell size={15} aria-hidden="true" />
              <span className="badge">{notificationCounts.unread}</span>
            </button>
            <button
              type="button"
              className="icon-button compact"
              onClick={() => setMainView(mainView === 'Map' ? 'Chain' : 'Map')}
            >
              {mainView === 'Map' ? copy.chainMode : copy.mapMode}
            </button>
            <button
              type="button"
              className="icon-button compact"
              title={copy.settings}
              aria-label={copy.settings}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={15} aria-hidden="true" />
            </button>
          </div>
        </header>
      )}

      {error && <div className="error-banner">{error}</div>}
      {statusMessage && <div className="status-banner">{statusMessage}</div>}

      <main className={`mc-workspace main-${mainView.toLowerCase()}`}>
        <section className="mc-map-stage">
          <div className="map-header-line">
            <div>
              <h2>{copy.tacticalMap}</h2>
              <p>
                {copy.updatedLabel} {lastUpdated ? formatTime(lastUpdated) : '—'}
                {!isMobile && ` · ${settings.mode === 'simple' ? copy.simpleMode : copy.analystMode}`}
              </p>
              <div className={`map-visibility-row ${visibleMapSignals === 0 ? 'is-empty' : ''}`}>
                <span>{copy.visibleSignals}: {visibleMapSignals}</span>
                {visibleMapSignals === 0 && (
                  <>
                    <span>{copy.noMapSignals}</span>
                    <button type="button" onClick={resetMapFilters}>
                      {copy.resetMapFilters}
                    </button>
                  </>
                )}
              </div>
              {settings.mode === 'analyst' && (
                <div className="analyst-strip">
                  <span title={copy.analystSignals}><Activity size={12} /> {analystSignals.signals}</span>
                  <span title={copy.analystFlights}>✈ {analystSignals.flights}</span>
                  <span title={copy.analystMaritime}>⚓ {analystSignals.maritime}</span>
                  <span title={copy.analystCyber}>⌁ {analystSignals.cyber}</span>
                </div>
              )}
            </div>
            {!isMobile && (
              <div className="map-header-controls">
                <button type="button" onClick={() => setSettings((prev) => ({ ...prev, mode: prev.mode === 'simple' ? 'analyst' : 'simple' }))}>
                  {settings.mode === 'simple' ? copy.switchToAnalyst : copy.switchToSimple}
                </button>
                {settings.mode === 'analyst' && (
                  <button
                    type="button"
                    onClick={toggleMapVisualMode}
                    title={mapVisualMode === 'globe' ? copy.tacticalMode : copy.globeHero}
                  >
                    <Globe2 size={14} aria-hidden="true" />
                    <span>{mapVisualMode === 'globe' ? copy.tacticalMode : copy.globeHero}</span>
                  </button>
                )}
                {settings.mode === 'analyst' && (
                  <button type="button" onClick={() => setReducedGlow((prev) => !prev)}>
                    {reducedGlow ? copy.glowOn : copy.reducedGlow}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className={`map-canvas-wrap ${mapVisualMode === 'globe' ? 'globe-hero' : ''}`}>
            <div className="map-layer-strip">
              {!!visibleMapPacks.length && (
                <div className="map-pack-strip" role="group" aria-label={copy.layerPacks}>
                  {visibleMapPacks.map((pack) => {
                    const layerIds = Array.isArray(pack.layer_ids) ? pack.layer_ids : [];
                    const active = layerIds.length > 0 && layerIds.every((id) => activeLayers.has(id));
                    const packLabel = getLayerPackLabel(copy, pack);
                    return (
                      <button
                        key={`pack-chip-${pack.id}`}
                        type="button"
                        className={active ? 'active' : ''}
                        title={packLabel}
                        onClick={() => applyLayerPack(pack)}
                      >
                        {packLabel}
                      </button>
                    );
                  })}
                </div>
              )}
              {settings.mode === 'analyst' ? (
                <div className="map-layer-chip-strip" role="group" aria-label={copy.layers}>
                  {visibleLayerChips.map((layer) => {
                    const active = activeLayers.has(layer.id);
                    return (
                      <button
                        key={`layer-chip-${layer.id}`}
                        type="button"
                        className={active ? 'active' : ''}
                        title={`${layer.name} · ${layer.description}`}
                        onClick={() => toggleLayer(layer.id)}
                      >
                        {getLayerChipLabel(layer)}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="manage"
                    title={copy.layerManager}
                    aria-label={copy.layerManager}
                    onClick={() => setLayersOpen((prev) => !prev)}
                  >
                    <Layers3 size={14} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="map-layer-chip-strip simple" role="group" aria-label={copy.layers}>
                  <button
                    type="button"
                    className="manage active"
                    title={copy.layerManager}
                    aria-label={copy.layerManager}
                    onClick={() => setLayersOpen((prev) => !prev)}
                  >
                    <Layers3 size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            {home ? (
              <Suspense fallback={<div className="map-loading">{copy.loadingTacticalRenderer}</div>}>
                <MapCanvas
                  home={home}
                  compact={settings.mode === 'simple'}
                  activeLayers={activeLayers}
                  severityFilter={severityFilter}
                  viewState={viewState}
                  deckUnavailable={deckUnavailable}
                  onDeckUnavailable={handleDeckUnavailable}
                  onViewStateChange={(next) => {
                    setViewState((prev) => ({
                      ...prev,
                      ...next,
                    }));
                  }}
                />
              </Suspense>
            ) : (
              <div className="map-loading">{copy.loadingMapData}</div>
            )}
            <div className="map-atmosphere" aria-hidden="true" />

            {!isMobile && (
              <div className="map-tools">
                {settings.mode === 'analyst' && (
                  <button
                    type="button"
                    title={`${copy.timeRange}: ${settings.days}d`}
                    aria-label={`${copy.timeRange}: ${settings.days}d`}
                    onClick={cycleDayRange}
                  >
                    <CalendarDays size={16} />
                  </button>
                )}
                {settings.mode === 'analyst' && (
                  <button
                    type="button"
                    title={`${copy.severity}: ${severityFilter}`}
                    aria-label={`${copy.severity}: ${severityFilter}`}
                    onClick={cycleSeverityFilter}
                  >
                    <SlidersHorizontal size={16} />
                  </button>
                )}
                {settings.mode === 'analyst' && (
                  <button type="button" title={playbackEnabled ? copy.stopPlayback : copy.playback} aria-label={playbackEnabled ? copy.stopPlayback : copy.playback} onClick={() => setPlaybackEnabled((prev) => !prev)}>
                    {playbackEnabled ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                )}
                <button type="button" title={copy.snapshotShare} aria-label={copy.snapshotShare} onClick={handleShareSnapshot}>
                  <Camera size={16} />
                </button>
              </div>
            )}

            {(selectedAlert || selectedLeak) && (
              <aside className="detail-drawer">
                {selectedAlert && (
                  <>
                    <div className="drawer-header">
                      <span className={`severity-pill severity-${selectedAlert.severity.toLowerCase()}`}>{selectedAlert.severity}</span>
                      <button type="button" onClick={() => setSelectedAlert(null)}>
                        {copy.close}
                      </button>
                    </div>
                    <h3>{selectedAlert.title}</h3>
                    <p>{selectedAlert.summary}</p>
                    <dl>
                      <div>
                        <dt>{copy.location}</dt>
                        <dd>{selectedAlert.location}</dd>
                      </div>
                      <div>
                        <dt>{copy.confidence}</dt>
                        <dd>{Math.round(selectedAlert.confidence_score * 100)}%</dd>
                      </div>
                      <div>
                        <dt>{copy.sourcesLabel}</dt>
                        <dd>{selectedAlert.source_count}</dd>
                      </div>
                      <div>
                        <dt>{copy.updatedField}</dt>
                        <dd>{formatDateTime(selectedAlert.updated_at)}</dd>
                      </div>
                    </dl>
                    <div className="drawer-actions">
                      <button type="button" onClick={() => acknowledgeCard(selectedAlert)}>
                        {copy.acknowledge}
                      </button>
                      <button type="button" onClick={() => muteSimilar(selectedAlert)}>
                        {copy.muteSimilar}
                      </button>
                      <button type="button" onClick={() => followRegion(selectedAlert)}>
                        {copy.followRegion}
                      </button>
                    </div>
                    <div className="drawer-help-line">
                      <span>{copy.predictiveConfidenceModel}</span>
                      <HelpIcon
                        anchor="confidence-model"
                        tooltip={copy.confidenceModelHelp}
                        onOpen={openExplainer}
                      />
                    </div>
                    <div className="drawer-guide-panel">
                      <div className="drawer-guide-head">
                        <strong>{copy.safetyGuide}</strong>
                        <span>{activeHazardInfo?.label || selectedIncidentType}</span>
                      </div>
                      <div className="drawer-guide-list">
                        {activeSafetyGuides.map((guide) => (
                          <article key={`drawer-guide-${guide.id}`} className="drawer-guide-card">
                            <h4>{guide.title}</h4>
                            <p>{guide.summary}</p>
                            <ul>
                              {guide.steps.slice(0, 2).map((step) => (
                                <li key={`${guide.id}-${step}`}>{step}</li>
                              ))}
                            </ul>
                            <small>{guide.provenance}</small>
                            <a href={guide.docs_url} target="_blank" rel="noreferrer">
                              {copy.learnMore}
                            </a>
                          </article>
                        ))}
                        {!activeSafetyGuides.length && (
                          <p className="empty">{copy.noSafetyGuideCards}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {selectedLeak && (
                  <>
                    <div className="drawer-header">
                      <span className="severity-pill severity-leak">{copy.leakLabel}</span>
                      <button type="button" onClick={() => setSelectedLeak(null)}>
                        {copy.close}
                      </button>
                    </div>
                    <h3>{selectedLeak.title}</h3>
                    <p>{selectedLeakSummary}</p>
                    <dl>
                      <div>
                        <dt>{copy.location}</dt>
                        <dd>{selectedLeak.location}</dd>
                      </div>
                      <div>
                        <dt>{copy.riskWarning}</dt>
                        <dd>{selectedLeak.risk_warning_level}</dd>
                      </div>
                      <div>
                        <dt>{copy.updatedField}</dt>
                        <dd>{formatDateTime(selectedLeak.updated_at)}</dd>
                      </div>
                    </dl>
                    <div className="drawer-guide-panel">
                      <div className="drawer-guide-head">
                        <strong>{copy.safetyGuide}</strong>
                        <span>{activeHazardInfo?.label || selectedIncidentType}</span>
                      </div>
                      <div className="drawer-guide-list">
                        {activeSafetyGuides.map((guide) => (
                          <article key={`drawer-leak-guide-${guide.id}`} className="drawer-guide-card">
                            <h4>{guide.title}</h4>
                            <p>{guide.summary}</p>
                            <ul>
                              {guide.steps.slice(0, 2).map((step) => (
                                <li key={`${guide.id}-${step}`}>{step}</li>
                              ))}
                            </ul>
                            <small>{guide.provenance}</small>
                            <a href={guide.docs_url} target="_blank" rel="noreferrer">
                              {copy.learnMore}
                            </a>
                          </article>
                        ))}
                        {!activeSafetyGuides.length && (
                          <p className="empty">{copy.noSafetyGuideCards}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </aside>
            )}
          </div>

          {layersOpen && (
            <div className="layers-panel">
              <div className="layers-header">
                  <h3>{copy.layerPacks}</h3>
                  <button type="button" onClick={() => setLayersOpen(false)}>
                    {copy.close}
                  </button>
                </div>
              {!!mapLayerPacks.length && (
                <div className="layer-pack-list">
                  {mapLayerPacks.map((pack) => {
                    const layerIds = Array.isArray(pack.layer_ids) ? pack.layer_ids : [];
                    const active = layerIds.length > 0 && layerIds.every((id) => activeLayers.has(id));
                    const packLabel = getLayerPackLabel(copy, pack);
                    return (
                      <button
                        key={`layers-panel-pack-${pack.id}`}
                        type="button"
                        className={active ? 'active' : ''}
                        title={packLabel}
                        onClick={() => applyLayerPack(pack)}
                      >
                        {packLabel}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="layers-list">
                {layersCatalog.map((layer) => (
                  <label key={layer.id}>
                    <input
                      type="checkbox"
                      checked={activeLayers.has(layer.id)}
                      onChange={() => toggleLayer(layer.id)}
                    />
                    <span className="layer-name">
                      {layer.name}
                      {layer.id === 'flight-radar' && (
                        <HelpIcon
                          anchor="flight-layer"
                          tooltip={copy.flightLayerHelp}
                          onOpen={openExplainer}
                        />
                      )}
                      {layer.id === 'maritime-risk' && (
                        <HelpIcon
                          anchor="maritime-layer"
                          tooltip={copy.maritimeLayerHelp}
                          onOpen={openExplainer}
                        />
                      )}
                    </span>
                    <small>{layer.description}</small>
                  </label>
                ))}
              </div>
              {activeLayers.has('flight-radar') && (
                <a
                  className="external-link"
                  href={home?.map.sources.flight_radar.external_url || 'https://www.flightradar24.com/'}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.openExternalFlightRadar}
                </a>
              )}
            </div>
          )}

          {mainView === 'Chain' && (
            <section className="mode-overlay chain-overlay">
              <h3>{copy.chainView}</h3>
              <ol>
                {filteredTicker.slice(0, 12).map((item) => (
                  <li key={`chain-${item.id}`}>
                    <span className={`severity-pill severity-${item.severity.toLowerCase()}`}>{item.severity}</span>
                    <span>{item.headline}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {mainView === 'Brief' && (
            <section className="mode-overlay brief-overlay">
              <h3>{copy.operationalBrief}</h3>
              <p>{home?.brief?.non_deterministic_label || copy.briefLoading}</p>
              <ul>
                {(home?.brief?.key_findings || []).slice(0, 5).map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </section>
          )}

          {mainView === 'Suites' && (
            <section className="mode-overlay suites-overlay">
              <h3>{copy.suites}</h3>
              <div className="suite-grid">
                <article>
                  <h4>{copy.alertsLabel}</h4>
                  <p>{copy.criticalUnread}: {notificationCounts.critical}</p>
                </article>
                <article>
                  <h4>{copy.signalsLabel}</h4>
                  <p>{copy.fusionScore}: {Math.round((home?.analyst?.fusion_score || 0) * 100)}%</p>
                </article>
                <article>
                  <h4>{copy.leaksLane}</h4>
                  <p>{copy.unverifiedItems}: {filteredLeaks.length}</p>
                </article>
                <article>
                  <h4>{copy.freshness}</h4>
                  <p>{copy.freshnessStatus}: {home?.freshness?.status || 'unknown'}</p>
                </article>
              </div>
            </section>
          )}
        </section>

        {!isMobile && (
          <aside className="mc-right-rail feed-v2-rail">
            <div className="rail-tabs feed-tabs">
              {FEED_TABS.map((tab) => (
                <button
                  key={`feed-tab-${tab}`}
                  type="button"
                  className={rightRailTab === tab ? 'active' : ''}
                  onClick={() => setRightRailTab(tab)}
                >
                  {tab === 'feed' && <Grid2x2 size={14} aria-hidden="true" />}
                  {tab === 'whale' && <ChartLine size={14} aria-hidden="true" />}
                  {tab === 'flights' && <Plane size={14} aria-hidden="true" />}
                  <span>{mapFeedTabLabel(copy, tab)}</span>
                  <em>{feedTabCounts[tab] || 0}</em>
                </button>
              ))}
            </div>

            <section className={`rail-panel feed-panel mode-${settings.mode}`}>
              <div className="feed-toolbar">
                <div className="feed-toolbar-top">
                  {rightRailTab === 'feed' ? (
                    <div className="feed-source-toggles" role="group" aria-label={copy.feedAllSources}>
                      {visibleFeedSourceTypes.map((sourceType) => {
                        const normalized = normalizeFeedSourceType(sourceType);
                        const active = normalized === 'all'
                          ? feedSourceTypes.length === 0
                          : feedSourceTypes.map((item) => normalizeFeedSourceType(item)).includes(normalized);
                        return (
                          <button
                            key={`feed-source-${normalized || sourceType}`}
                            type="button"
                            className={active ? 'active' : ''}
                            title={normalized === 'all' ? copy.feedAllSources : mapFeedSourceLabel(copy, normalized)}
                            aria-label={normalized === 'all' ? copy.feedAllSources : mapFeedSourceLabel(copy, normalized)}
                            onClick={() => toggleFeedSourceType(normalized)}
                          >
                            {normalized === 'all' && <Grid2x2 size={14} aria-hidden="true" />}
                            {normalized === 'x' && <X size={14} aria-hidden="true" />}
                            {normalized === 'telegram' && <Send size={14} aria-hidden="true" />}
                            {normalized === 'news' && <Newspaper size={14} aria-hidden="true" />}
                            {normalized === 'official' && <RadioTower size={14} aria-hidden="true" />}
                            {normalized === 'osint' && <MessageCircle size={14} aria-hidden="true" />}
                            {normalized === 'wm-ai' && <Bot size={14} aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="feed-tab-context">
                      {mapFeedTabLabel(copy, rightRailTab)}
                    </div>
                  )}

                  <label className="feed-search">
                    <Search size={14} aria-hidden="true" />
                    <input
                      value={feedSearchQuery}
                      onChange={(event) => setFeedSearchQuery(event.target.value)}
                      placeholder={copy.feedSearchPlaceholder}
                    />
                  </label>
                </div>

                <div className="feed-toolbar-bottom">
                  <div className="feed-chip-row">
                    {(['ALL', 'CRITICAL', 'HIGH', 'LOW'] as const).map((chip) => (
                      <button
                        key={`feed-sev-${chip}`}
                        type="button"
                        className={feedSeverityChip === chip ? 'active' : ''}
                        onClick={() => setFeedSeverityChip(chip)}
                      >
                        {chip === 'ALL'
                          ? copy.feedAll
                          : chip === 'CRITICAL'
                            ? copy.feedCritical
                            : chip === 'HIGH'
                              ? copy.feedHigh
                              : copy.feedLow}
                      </button>
                    ))}

                    {settings.mode === 'analyst' && (
                      <>
                        <button
                          type="button"
                          className={`ghost ${feedTopicFilter.length ? 'selected' : ''}`}
                          onClick={() => {
                            setFeedFilterPicker((prev) => (prev === 'topic' ? null : 'topic'));
                            setFeedFilterSearch('');
                          }}
                        >
                          {feedTopicChipLabel}
                        </button>
                        <button
                          type="button"
                          className={`ghost ${feedCategoryFilter.length ? 'selected' : ''}`}
                          onClick={() => {
                            setFeedFilterPicker((prev) => (prev === 'category' ? null : 'category'));
                            setFeedFilterSearch('');
                          }}
                        >
                          {feedCategoryChipLabel}
                        </button>
                        <button
                          type="button"
                          className={`ghost ${feedCountryFilter.length ? 'selected' : ''}`}
                          onClick={() => {
                            setFeedFilterPicker((prev) => (prev === 'country' ? null : 'country'));
                            setFeedFilterSearch('');
                          }}
                        >
                          {feedCountryChipLabel}
                        </button>
                      </>
                    )}

                    {settings.mode === 'analyst' && (
                      <button
                        type="button"
                        className="icon"
                        title={copy.feedSettings}
                        aria-label={copy.feedSettings}
                        onClick={() => setSettingsOpen(true)}
                      >
                        <Filter size={14} aria-hidden="true" />
                      </button>
                    )}
                    <button type="button" className="clear" onClick={clearFeedFilters}>
                      {copy.feedClear}
                    </button>
                  </div>
                </div>
              </div>

              <div className={`feed-card-list ${feedLoading ? 'is-loading' : ''}`}>
                {feedLoading && <p className="rail-note">{copy.refreshingMissionControl}</p>}
                {effectiveFeedItems.map((item) => {
                  const isLeak = item.kind === 'leak' || String(item.verification_status).toLowerCase() === 'unverified';
                  const sourceType = normalizeFeedSourceType(item.source_type);
                  const isExpanded = settings.mode === 'analyst' && expandedFeedItemId === item.id;
                  const leakRef = leaksById.get(String(item.alert_id)) || leaksById.get(String(item.id)) || null;
                  const leakHint = leakRef
                    ? leakVerificationHint(leakRef, copy.leakVerificationHint)
                    : copy.leakVerificationHint;
                  const titleText = compactFeedText(item.title);
                  const detailTags = [item.topic, item.category, item.country, ...(item.tags || [])]
                    .map((value) => String(value || '').trim())
                    .filter(Boolean)
                    .filter((value, index, arr) => arr.indexOf(value) === index)
                    .slice(0, isExpanded ? 6 : 3);
                  const description = isLeak
                    ? compactFeedText(stripLeakVerificationText(item.summary))
                    : compactFeedText(item.summary);
                  const showDescription = !shouldHideFeedSummary(titleText || item.title, description);
                  const canMutate = !isLeak && (alertsById.has(String(item.alert_id)) || alertsById.has(String(item.id)));
                  return (
                    <article
                      key={`feed-item-${rightRailTab}-${item.id}`}
                      className={`feed-card ${isLeak ? 'is-leak' : 'is-verified'} ${isExpanded ? 'is-open' : ''} source-${sourceType || 'news'}`}
                    >
                      <div className="feed-card-top">
                        <span className="alert-source-avatar" aria-hidden="true">
                          {String(item.avatar_glyph || sourceInitials(item.source_name)).slice(0, 2).toUpperCase()}
                        </span>
                        <div className="feed-card-source">
                          <strong>{item.source_name}</strong>
                          <span>{formatTime(item.updated_at)}</span>
                        </div>
                        {isLeak ? (
                          <span className="severity-pill severity-leak leak-pill" data-tip={leakHint} aria-label={leakHint}>
                            {copy.leakLabel}
                          </span>
                        ) : (
                          <span className={`severity-pill severity-${item.severity.toLowerCase()}`}>{item.severity}</span>
                        )}
                      </div>

                      <div className="feed-card-badges">
                        <span className={`feed-type-badge type-${sourceType || 'news'}`}>
                          {mapFeedSourceLabel(copy, sourceType).toUpperCase()}
                        </span>
                        {item.country && <span className="feed-meta-chip">{item.country}</span>}
                        {settings.mode === 'analyst' && (
                          <span className="feed-meta-chip">{Math.round(item.confidence_score * 100)}%</span>
                        )}
                      </div>

                      <div className="feed-card-headline-row">
                        <button
                          type="button"
                          className="feed-card-title"
                          title={item.title}
                          onClick={() => handleFeedItemFocus(item)}
                        >
                          {titleText || item.title}
                        </button>
                        {settings.mode === 'analyst' && (
                          <button
                            type="button"
                            className={`feed-card-expand ${isExpanded ? 'is-open' : ''}`}
                            title={isExpanded ? copy.collapseDetails : copy.expandDetails}
                            aria-label={isExpanded ? copy.collapseDetails : copy.expandDetails}
                            aria-pressed={isExpanded}
                            onClick={() => toggleFeedItemExpanded(item.id)}
                          >
                            <ChevronDown size={14} aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      {showDescription && !!description && (
                        <p className={`feed-card-summary ${isExpanded ? 'expanded' : ''}`}>
                          {settings.mode === 'simple'
                            ? description.slice(0, 140)
                            : description.slice(0, isExpanded ? 520 : 220)}
                        </p>
                      )}

                      <div className="feed-card-foot">
                        <span>{item.location}</span>
                        <span>{settings.mode === 'analyst' ? confidenceLabel(copy, item.confidence_score) : formatTime(item.updated_at)}</span>
                      </div>

                      {settings.mode === 'analyst' && (
                        <div className="feed-card-extra">
                          <span>{item.source_count} {copy.sourcesWord}</span>
                          <span>{formatVerificationStatusLabel(item.verification_status)}</span>
                          <span>{Math.max(0, Math.round(item.confidence_score * 100))}%</span>
                        </div>
                      )}

                      {settings.mode === 'analyst' && isExpanded && !!detailTags.length && (
                        <div className="feed-card-tags">
                          {detailTags.map((tag) => (
                            <span key={`${item.id}-${tag}`} className="feed-card-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="feed-card-actions">
                        <button type="button" title={copy.focusOnMap} aria-label={copy.focusOnMap} onClick={() => handleFeedItemFocus(item)}>
                          <LocateFixed size={14} aria-hidden="true" />
                        </button>
                        {canMutate && (
                          <>
                            <button
                              type="button"
                              title={copy.acknowledge}
                              aria-label={copy.acknowledge}
                              onClick={() => handleFeedItemAcknowledge(item)}
                            >
                              <Check size={14} aria-hidden="true" />
                            </button>
                            {settings.mode === 'analyst' && (
                              <>
                                <button
                                  type="button"
                                  title={copy.muteSimilar}
                                  aria-label={copy.muteSimilar}
                                  onClick={() => handleFeedItemMute(item)}
                                >
                                  <BellOff size={14} aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  title={copy.followRegion}
                                  aria-label={copy.followRegion}
                                  onClick={() => handleFeedItemFollow(item)}
                                >
                                  <TrendingUp size={14} aria-hidden="true" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
                {!effectiveFeedItems.length && !feedLoading && <p className="empty">{copy.feedNoItems}</p>}
                {!!effectiveFeedItems.length && (
                  <div className="feed-list-footer">
                    <span>
                      {copy.feedShowing} {effectiveFeedItems.length}{feedTotalFiltered ? ` / ${feedTotalFiltered}` : ''}
                    </span>
                    {feedHasMore && (
                      <button type="button" className="feed-load-more" onClick={handleFeedLoadMore} disabled={feedLoadingMore}>
                        {feedLoadingMore ? copy.feedLoadingMore : copy.feedLoadMore}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </aside>
        )}
      </main>

      {isMobile && (
        <section
          className={`mobile-sheet ${mobileSheetOpen ? 'open' : 'closed'}`}
          onTouchStart={onSheetTouchStart}
          onTouchEnd={onSheetTouchEnd}
        >
          <button
            type="button"
            className="sheet-handle"
            onClick={() => setMobileSheetSurface(!mobileSheetOpen)}
          >
            {mobileSheetOpen ? copy.swipeDown : copy.swipeUp}
          </button>
          <div className="sheet-tabs">
            {MOBILE_SHEET_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={mobileSheetTab === tab ? 'active' : ''}
                onClick={() => {
                  setMobileSheetTab(tab);
                  if (MOBILE_SURFACE_MUTEX_ENABLED) {
                    setSelectedAlert(null);
                    setSelectedLeak(null);
                  }
                }}
              >
                {mapMobileSheetTabLabel(copy, tab)}
              </button>
            ))}
            <button type="button" className="active-map-tab" onClick={() => setMainView(mainView === 'Map' ? 'Chain' : 'Map')}>
              {mainView === 'Map' ? copy.chainMode : copy.mapMode}
            </button>
          </div>

          <div className="sheet-content">
            {mobileSheetTab === 'Critical' && (
              <div className="card-stack">
                {visibleCriticalCards.slice(0, settings.mode === 'simple' ? 4 : 6).map((card) => (
                  <AlertCard
                    key={`mob-critical-${card.id}`}
                    card={card}
                    copy={copy}
                    formatTime={formatTime}
                    onFocus={handleMapFocus}
                    onAcknowledge={acknowledgeCard}
                    onMute={muteSimilar}
                    onFollow={followRegion}
                  />
                ))}
              </div>
            )}

            {mobileSheetTab === 'Ticker' && (
              <div className="mobile-ticker-list">
                {filteredTicker.slice(0, 12).map((item) => (
                  <button
                    key={`mob-tick-${item.id}`}
                    type="button"
                    onClick={() => handleTickerClick(item)}
                    title={compactFeedText(item.headline) || item.headline}
                    className={item.kind === 'leak' ? 'is-leak' : 'is-verified'}
                  >
                    <span className={`severity-pill severity-${item.severity.toLowerCase()}`}>{item.severity}</span>
                    <span className="mobile-ticker-headline">{compactFeedText(item.headline) || item.headline}</span>
                    {item.kind === 'leak' && <span className="tick-warning">{copy.unverifiedBadge}</span>}
                  </button>
                ))}
              </div>
            )}

            {mobileSheetTab === 'Notifications' && (
              <div className="card-stack">
                {notificationCards.slice(0, 8).map((card) => (
                  <AlertCard
                    key={`mob-notif-${card.id}`}
                    card={card}
                    copy={copy}
                    formatTime={formatTime}
                    onFocus={handleMapFocus}
                    onAcknowledge={acknowledgeCard}
                    onMute={muteSimilar}
                    onFollow={followRegion}
                  />
                ))}
              </div>
            )}

            {mobileSheetTab === 'Leaks' && (
              <div className="leak-stack">
                {filteredLeaks.slice(0, 8).map((item) => (
                  <article key={`mob-leak-${item.id}`} className="leak-card">
                    <button type="button" className="leak-title-row" onClick={() => handleLeakFocus(item)}>
                      <span
                        className="severity-pill severity-leak leak-pill"
                        data-tip={leakVerificationHint(item, copy.leakVerificationHint)}
                        aria-label={leakVerificationHint(item, copy.leakVerificationHint)}
                      >
                        {copy.leakLabel}
                      </span>
                      <span className="leak-title-text">{item.title}</span>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {settings.mode === 'analyst' && feedFilterPicker && (
        <div className="drawer-overlay" onClick={() => setFeedFilterPicker(null)}>
          <aside className="feed-filter-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-label={copy.feedFilterPicker}>
            <div className="drawer-top">
              <h2>{copy.feedFiltersTitle}</h2>
              <button
                type="button"
                onClick={() => {
                  setFeedFilterPicker(null);
                  setFeedFilterSearch('');
                }}
              >
                {copy.close}
              </button>
            </div>
            <div className="feed-filter-tab-row">
              {(['topic', 'category', 'country'] as FeedFilterPicker[]).map((tab) => (
                <button
                  key={`feed-filter-tab-${tab}`}
                  type="button"
                  className={feedFilterPicker === tab ? 'active' : ''}
                  onClick={() => {
                    setFeedFilterPicker(tab);
                    setFeedFilterSearch('');
                  }}
                >
                  <span>{mapFeedFilterTabLabel(copy, tab)}</span>
                  <em>{feedFilterTabCounts[tab] || 0}</em>
                </button>
              ))}
            </div>
            <label className="feed-filter-search">
              <Search size={13} aria-hidden="true" />
              <input
                value={feedFilterSearch}
                onChange={(event) => setFeedFilterSearch(event.target.value)}
                placeholder={copy.feedFilterSearchPlaceholder}
              />
            </label>
            <div className="feed-filter-options modal">
              {visiblePickerOptions.map((option) => {
                const selected = activePickerValue.includes(option);
                return (
                  <button
                    key={`picker-${feedFilterPicker}-${option}`}
                    type="button"
                    className={selected ? 'selected' : ''}
                    onClick={() => applyPickerFilter(option)}
                  >
                    <span>{option}</span>
                    {selected && <Check size={14} aria-hidden="true" />}
                  </button>
                );
              })}
              {!visiblePickerOptions.length && <p>{copy.noMatches}</p>}
            </div>
          </aside>
        </div>
      )}

      {notificationOpen && (
        <div className="drawer-overlay" onClick={() => setNotificationOpen(false)}>
          <aside className="notification-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-top">
              <h2>{copy.notificationCenter}</h2>
              <button type="button" onClick={() => setNotificationOpen(false)}>
                {copy.close}
              </button>
            </div>
            {notificationTelemetry && (
              <div className="notification-slo-strip">
                <span>{copy.qualificationToInbox} p95: {notificationTelemetry.qualification_to_inbox_ms.p95_ms || 0}ms</span>
                <span>{copy.qualificationToEmail} p95: {notificationTelemetry.qualification_to_email_ms.p95_ms || 0}ms</span>
                <span>{copy.dispatchSuccess}: {Math.round((notificationTelemetry.dispatch_success_rate.rate || 0) * 100)}%</span>
              </div>
            )}
            <div className="notif-tabs">
              {NOTIFICATION_TABS.map((tab) => (
                <button
                  key={`drawer-${tab}`}
                  type="button"
                  className={notificationTab === tab ? 'active' : ''}
                  onClick={() => setNotificationTab(tab)}
                >
                  {mapNotificationTabLabel(copy, tab)} ({notificationTabCounts[tab]})
                </button>
              ))}
            </div>
            <div className="card-stack">
              {notificationCards.map((card) => (
                <AlertCard
                  key={`drawer-card-${card.id}`}
                  card={card}
                  copy={copy}
                  formatTime={formatTime}
                  onFocus={handleMapFocus}
                  onAcknowledge={acknowledgeCard}
                  onMute={muteSimilar}
                  onFollow={followRegion}
                />
              ))}
            </div>
          </aside>
        </div>
      )}

      {settingsOpen && (
        <div className="drawer-overlay" onClick={() => setSettingsOpen(false)}>
          <aside className="settings-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-top">
              <h2>{copy.missionSettings}</h2>
              <button type="button" onClick={() => setSettingsOpen(false)}>
                {copy.close}
              </button>
            </div>

            <section>
              <h3>{copy.scope}</h3>
              <label>
                {copy.conflict}
                <select
                  value={settings.conflict}
                  onChange={(event) => setSettings((prev) => ({ ...prev, conflict: event.target.value }))}
                >
                  {CONFLICT_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {copy.viewMode}
                <select
                  value={settings.mode}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      mode: event.target.value as MissionControlMode,
                    }))
                  }
                >
                  <option value="simple">{copy.simpleMode}</option>
                  <option value="analyst">{copy.analystMode}</option>
                </select>
              </label>
              <label>
                {copy.verification}
                <select
                  value={settings.verificationMode}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      verificationMode: event.target.value === 'all-sources' ? 'all-sources' : 'verified-first',
                    }))
                  }
                >
                  <option value="verified-first">{copy.verifiedFirst}</option>
                  <option value="all-sources">{copy.allSources}</option>
                </select>
              </label>
              <label>
                {copy.language}
                <select
                  value={settings.language || 'auto'}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      language: event.target.value,
                    }))
                  }
                >
                  <option value="auto">{copy.auto}</option>
                  <option value="en">{copy.english}</option>
                  <option value="ar">{copy.arabic}</option>
                  <option value="es">{copy.spanish}</option>
                </select>
              </label>
              <label>
                {copy.countryHintIso}
                <input
                  value={settings.country || ''}
                  maxLength={2}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      country: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder={copy.auto}
                />
              </label>
            </section>

            {!!home?.source_suggestions?.items?.length && (
              <section>
                <h3>{copy.sourceSuggestions}</h3>
                <p className="settings-note">{copy.sourceSuggestionsHint}</p>
                <div className="source-suggestions-list">
                  {home.source_suggestions.items.map((item) => (
                    <article key={item.id} className="source-suggestion-item">
                      <div className="source-suggestion-head">
                        <strong>{item.local_name || item.name}</strong>
                        <span className={`priority-${item.priority}`}>{item.priority}</span>
                      </div>
                      <p>{item.reason}</p>
                      <a href={item.url} target="_blank" rel="noreferrer">{copy.openSourceFeed}</a>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3>{copy.workspacePresets}</h3>
              <div className="preset-list">
                {(home?.workspace_presets || []).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={selectedPresetId === preset.id ? 'active' : ''}
                    onClick={() => applyPreset(preset)}
                  >
                    <strong>{preset.name}</strong>
                    <span>{preset.description}</span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={resetToDefaultLayout}>
                {copy.resetSafeDefault}
              </button>
            </section>

            <section>
              <h3>{copy.quickActions}</h3>
              <div className="quick-actions-config">
                {QUICK_ACTION_LABELS.map((label) => {
                  const enabled = quickActions.includes(label);
                  return (
                    <div key={`qa-${label}`} className="quick-action-row">
                      <label>
                        <input type="checkbox" checked={enabled} onChange={() => toggleQuickAction(label)} />
                        {mapQuickActionLabel(copy, label)}
                      </label>
                      <div className="row-buttons">
                        <button type="button" onClick={() => moveQuickAction(label, 'up')}>
                          {copy.up}
                        </button>
                        <button type="button" onClick={() => moveQuickAction(label, 'down')}>
                          {copy.down}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h3>
                {copy.notificationDispatch}
                <HelpIcon
                  anchor="dispatch-policy"
                  tooltip={copy.dispatchPolicyHelp}
                  onOpen={openExplainer}
                />
              </h3>
              {notificationPreference && (
                <div className="notification-config">
                  {notificationPreference.dispatch_policy && (
                    <div className="dispatch-policy-summary">
                      <strong>{copy.policy}</strong>
                      <span>Verified CRITICAL: {notificationPreference.dispatch_policy.critical_verified}</span>
                      <span>Verified HIGH: {notificationPreference.dispatch_policy.high_verified}</span>
                      <span>ELEVATED: {notificationPreference.dispatch_policy.elevated}</span>
                      <span>INFO: {notificationPreference.dispatch_policy.info}</span>
                    </div>
                  )}
                  {notificationTelemetry && (
                    <div className="dispatch-policy-summary">
                      <strong>{copy.currentSlo} ({notificationTelemetry.window_hours}h)</strong>
                      <span>
                        {copy.qualificationToInbox}: avg {notificationTelemetry.qualification_to_inbox_ms.avg_ms}ms ·
                        p95 {notificationTelemetry.qualification_to_inbox_ms.p95_ms}ms
                      </span>
                      <span>
                        {copy.qualificationToEmail}: avg {notificationTelemetry.qualification_to_email_ms.avg_ms}ms ·
                        p95 {notificationTelemetry.qualification_to_email_ms.p95_ms}ms
                      </span>
                      <span>
                        {copy.dispatchSuccess}: {Math.round((notificationTelemetry.dispatch_success_rate.rate || 0) * 100)}%
                        {' '}({notificationTelemetry.dispatch_success_rate.sent} sent / {notificationTelemetry.dispatch_success_rate.failed} failed)
                      </span>
                      <span>{copy.actionPersistenceErrors}: {notificationTelemetry.action_persistence_errors}</span>
                    </div>
                  )}
                  {notificationPreference.alert_tier_policy && (
                    <div className="dispatch-policy-summary tier-policy-summary">
                      <strong>{copy.basicVsProSafetyPolicy}</strong>
                      <span>Basic: {notificationPreference.alert_tier_policy.basic}</span>
                      <span>Pro: {notificationPreference.alert_tier_policy.pro}</span>
                      <span>
                        {copy.criticalDelayAllowed}: {notificationPreference.alert_tier_policy.critical_delay_allowed ? copy.yes : copy.no}
                      </span>
                      <span>{notificationPreference.alert_tier_policy.rationale}</span>
                    </div>
                  )}
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationPreference.channels.push}
                      onChange={(event) =>
                        setNotificationPreference((prev) =>
                          prev
                            ? {
                                ...prev,
                                channels: {
                                  ...prev.channels,
                                  push: event.target.checked,
                                },
                              }
                            : prev
                        )
                      }
                    />
                    {copy.pushNotifications}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationPreference.channels.email}
                      onChange={(event) =>
                        setNotificationPreference((prev) =>
                          prev
                            ? {
                                ...prev,
                                channels: {
                                  ...prev.channels,
                                  email: event.target.checked,
                                },
                              }
                            : prev
                        )
                      }
                    />
                    {copy.emailNotifications}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked
                      disabled
                    />
                    {copy.verifiedCriticalLocked}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationPreference.dispatch.verified_high_instant}
                      onChange={(event) =>
                        setNotificationPreference((prev) =>
                          prev
                            ? {
                                ...prev,
                                dispatch: {
                                  ...prev.dispatch,
                                  verified_high_instant: event.target.checked,
                                },
                              }
                            : prev
                        )
                      }
                    />
                    {copy.verifiedHighInstant}
                  </label>
                  <div className="dispatch-policy-summary">
                    <strong>{copy.alertAudioProfiles}</strong>
                    <span>{copy.alertAudioProfilesDesc}</span>
                  </div>
                  <label>
                    {copy.alertMode}
                    <select
                      value={notificationPreference.audio?.mode || 'tone'}
                      onChange={(event) =>
                        setNotificationPreference((prev) =>
                          prev
                            ? {
                                ...prev,
                                audio: {
                                  ...prev.audio,
                                  mode: event.target.value as 'silent' | 'vibration-only' | 'tone',
                                },
                              }
                            : prev
                        )
                      }
                    >
                      <option value="tone">{copy.tone}</option>
                      <option value="vibration-only">{copy.vibrationOnly}</option>
                      <option value="silent">{copy.silent}</option>
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(notificationPreference.audio?.vibration)}
                      onChange={(event) =>
                        setNotificationPreference((prev) =>
                          prev
                            ? {
                                ...prev,
                                audio: {
                                  ...prev.audio,
                                  vibration: event.target.checked,
                                },
                              }
                            : prev
                        )
                      }
                    />
                    {copy.vibrationEnabled}
                  </label>
                  {(['CRITICAL', 'HIGH', 'ELEVATED', 'INFO'] as const).map((level) => (
                    <label key={`audio-${level}`}>
                      {level} {copy.toneProfile}
                      <select
                        value={notificationPreference.audio?.severity_profiles?.[level] || DEFAULT_AUDIO_PROFILES[level]}
                        onChange={(event) =>
                          setNotificationPreference((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  audio: {
                                    ...prev.audio,
                                    severity_profiles: {
                                      ...(prev.audio?.severity_profiles || DEFAULT_AUDIO_PROFILES),
                                      [level]: event.target.value,
                                    },
                                  },
                                }
                              : prev
                          )
                        }
                      >
                        <option value="alarm-critical">{copy.alarmCritical}</option>
                        <option value="tone-high">{copy.toneHigh}</option>
                        <option value="tone-elevated">{copy.toneElevated}</option>
                        <option value="tone-info">{copy.toneInfo}</option>
                        <option value="tone-soft">{copy.toneSoft}</option>
                      </select>
                    </label>
                  ))}
                  <button type="button" onClick={saveAlertAudioDefaults}>
                    {copy.saveAlertAudioPrefs}
                  </button>
                  <button type="button" onClick={saveNotificationDefaults}>
                    {copy.saveNotificationPrefs}
                  </button>
                </div>
              )}
            </section>

            <section>
              <h3>{copy.safetyGuideMvp}</h3>
              <div className="dispatch-policy-summary">
                <strong>{copy.currentIncidentFocus}</strong>
                <span>{activeHazardInfo?.label || selectedIncidentType}</span>
                {activeHazardInfo?.description && <span>{activeHazardInfo.description}</span>}
                <span>{copy.offlineBundlesPlanned}</span>
              </div>
              <div className="safety-guide-grid">
                {activeSafetyGuides.map((guide) => (
                  <article key={`settings-guide-${guide.id}`} className="safety-guide-card">
                    <h4>{guide.title}</h4>
                    <p>{guide.summary}</p>
                    <ul>
                      {guide.steps.slice(0, 3).map((step) => (
                        <li key={`${guide.id}-${step}`}>{step}</li>
                      ))}
                    </ul>
                    <small>{guide.provenance}</small>
                    <a href={guide.docs_url} target="_blank" rel="noreferrer">
                      {copy.learnMore}
                    </a>
                  </article>
                ))}
                {!activeSafetyGuides.length && (
                  <p className="empty">{copy.noCuratedGuide} {copy.useGeneralChecklist}</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}

      {docsOpen && (
        <div className="drawer-overlay" onClick={() => setDocsOpen(false)}>
          <aside className="docs-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-top">
              <h2>{copy.explainersTitle}</h2>
              <button type="button" onClick={() => setDocsOpen(false)}>
                {copy.close}
              </button>
            </div>
            <div className="docs-layout">
              <nav>
                {explainers.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={docsAnchor === item.anchor ? 'active' : ''}
                    onClick={() => setDocsAnchor(item.anchor)}
                  >
                    {item.title}
                  </button>
                ))}
              </nav>
              <article>
                {selectedExplainer ? (
                  <>
                    <h3 id={selectedExplainer.anchor}>{selectedExplainer.title}</h3>
                    <p>{selectedExplainer.one_line}</p>
                    <p className="methodology">{selectedExplainer.methodology}</p>
                    <a href={selectedExplainer.docs_url}>{copy.learnMore}</a>
                  </>
                ) : (
                  <p>{copy.noExplainerSelected}</p>
                )}
              </article>
            </div>
          </aside>
        </div>
      )}

      {tourStep >= 0 && (
        <div className="tour-overlay">
          <section className="tour-card">
            <span className="tour-step">
              {copy.step} {tourStep + 1} / {TOUR_STEPS.length}
            </span>
            <h2>{TOUR_STEPS[tourStep].title}</h2>
            <p>{TOUR_STEPS[tourStep].body}</p>
            <div className="tour-actions">
              <button type="button" onClick={handleTourSkip}>
                {copy.skipTour}
              </button>
              <button type="button" onClick={handleTourNext}>
                {tourStep === TOUR_STEPS.length - 1 ? copy.finish : copy.next}
              </button>
            </div>
          </section>
        </div>
      )}

      {loading && <div className="loading-strip">{copy.refreshingMissionControl}</div>}
    </div>
  );
}

export default App;
