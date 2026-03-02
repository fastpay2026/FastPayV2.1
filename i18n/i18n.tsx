import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { Language, RTL_LANGUAGES, Translations, I18nContextType } from '../types/i18n';
import axios from 'axios';

const translationsData: Translations = {
  "welcome": {
    "en": "Welcome to FastPay Network",
    "ar": "أهلاً بك في شبكة FastPay",
    "fr": "Bienvenue sur FastPay Network",
    "tr": "FastPay Ağı'na Hoş Geldiniz",
    "zh": "欢迎来到 FastPay 网络",
    "ku": "بەخێربێیت بۆ تۆڕی FastPay",
    "ru": "Добро пожаловать в FastPay Network"
  },
  "login": {
    "en": "Login",
    "ar": "تسجيل الدخول",
    "fr": "Connexion",
    "tr": "Giriş Yap",
    "zh": "登录",
    "ku": "چوونەژوورەوە",
    "ru": "Вход"
  },
  "register": {
    "en": "Register",
    "ar": "إنشاء حساب",
    "fr": "S'inscrire",
    "tr": "Kayıt Ol",
    "zh": "注册",
    "ku": "تۆمارکردن",
    "ru": "Регистрация"
  },
  "asset_gold": { "en": "Gold", "ar": "الذهب", "fr": "Or", "tr": "Altın", "zh": "黄金", "ku": "ئاڵتوون", "ru": "Золото" },
  "asset_btc": { "en": "Bitcoin", "ar": "بيتكوين", "fr": "Bitcoin", "tr": "Bitcoin", "zh": "比特币", "ku": "بیتکۆین", "ru": "Биткойн" },
  "asset_brent": { "en": "Brent Oil", "ar": "نفط برنت", "fr": "Pétrole Brent", "tr": "Brent Petrol", "zh": "布伦特原油", "ku": "نەوتی برێنت", "ru": "Нефть Brent" },
  "asset_eth": { "en": "Ethereum", "ar": "إيثيريوم", "fr": "Ethereum", "tr": "Ethereum", "zh": "以太坊", "ku": "ئیسێريۆم", "ru": "Эфириум" },
  "asset_nasdaq": { "en": "NASDAQ 100", "ar": "ناسداك 100", "fr": "NASDAQ 100", "tr": "NASDAQ 100", "zh": "纳斯达克 100", "ku": "ناسداک ١٠٠", "ru": "NASDAQ 100" },
  "asset_apple": { "en": "Apple Inc", "ar": "شركة أبل", "fr": "Apple Inc", "tr": "Apple Inc", "zh": "苹果公司", "ku": "کۆمپانیای ئەپڵ", "ru": "Apple Inc" },
  "home": {
    "en": "Home",
    "ar": "الرئيسية",
    "fr": "Accueil",
    "tr": "Ana Sayfa",
    "zh": "首页",
    "ku": "ماڵەوە",
    "ru": "Главная"
  },
  "raffle": {
    "en": "Raffle",
    "ar": "القرعة",
    "fr": "Tombola",
    "tr": "Çekiliş",
    "zh": "抽奖",
    "ku": "تیروپشک",
    "ru": "Лотерея"
  },
  "swift": {
    "en": "Swift",
    "ar": "سويفت",
    "fr": "Swift",
    "tr": "Swift",
    "zh": "斯威夫特",
    "ku": "سوئیفت",
    "ru": "Свифт"
  },
  "payment_gateway": {
    "en": "Payment Gateway",
    "ar": "بوابة الدفع",
    "fr": "Passerelle de paiement",
    "tr": "Ödeme Ağ Geçidi",
    "zh": "支付网关",
    "ku": "دەروازەی پارەدان",
    "ru": "Платежный шлюз"
  },
  "funding": {
    "en": "Funding",
    "ar": "التمويل",
    "fr": "Financement",
    "tr": "Finansman",
    "zh": "资金",
    "ku": "پارەدان",
    "ru": "Финансирование"
  },
  "trading": {
    "en": "Trading",
    "ar": "التداول",
    "fr": "Négociation",
    "tr": "Ticaret",
    "zh": "交易",
    "ku": "بازرگانی",
    "ru": "Тورговля"
  },
  "hero_title": {
    "en": "Financial Sovereignty in the Age of Speed",
    "ar": "السيادة المالية في عصر السرعة",
    "fr": "Souveraineté financière à l'ère de la vitesse",
    "tr": "Hız Çağında Finansal Egemenlik",
    "zh": "速度时代的金融主权",
    "ku": "سەروەری دارایی لە سەردەمی خێراییدا",
    "ru": "Финансовый суверенитет в эпоху скорости"
  },
  "hero_subtitle": {
    "en": "FastPay Network's gateway for asset management, instant trading, and digital wealth protection with the highest global security standards.",
    "ar": "بوابة FastPay Network لإدارة الأصول والتداول الفوري وحماية الثروات الرقمية بأعلى معايير الأمان العالمية.",
    "fr": "La passerelle de FastPay Network pour la gestion d'actifs, le trading instantané et la protection du patrimoine numérique avec les normes de sécurité mondiales les plus élevées.",
    "tr": "FastPay Network'ün varlık yönetimi, anında ticaret ve dijital servet koruması için en yüksek küresel güvenlik standartlarına sahip geçidi.",
    "zh": "FastPay Network 的资产管理、即时交易和数字财富保护网关，符合全球最高安全标准。",
    "ku": "دەروازەی تۆڕی FastPay بۆ بەڕێوەبردنی سەرمایە، بازرگانی خێرا، و پاراستنی سامانی دیجیتاڵی بە بەرزترین ستانداردەکانی ئاسایشی جیهانی.",
    "ru": "Шлюз FastPay Network для управления активами, мгновенной торговли и защиты цифрового богатства с высочайшими мировыми стандартами безопасности."
  },
  "open_royal_account": {
    "en": "Open Your Royal Account",
    "ar": "افتح حسابك الملكي",
    "fr": "Ouvrez votre compte Royal",
    "tr": "Kraliyet Hesabınızı Açın",
    "zh": "开设您的皇家账户",
    "ku": "هەژماری شاهانەی خۆت بکەرەوە",
    "ru": "Откройте свой королевский счет"
  },
  "contact_management": {
    "en": "Contact Management",
    "ar": "تواصل مع الإدارة",
    "fr": "Contacter la direction",
    "tr": "Yönetimle İletişime Geçin",
    "zh": "联系管理层",
    "ku": "پەیوەندی بە بەڕێوەبەرایەتییەوە بکە",
    "ru": "Связаться с руководством"
  },
  "power_of_financial_engine": {
    "en": "The Power of the Financial Engine",
    "ar": "قوة المحرك المالي",
    "fr": "La puissance du moteur financier",
    "tr": "Finansal Motorun Gücü",
    "zh": "金融引擎的力量",
    "ku": "هێزی بزوێنەری دارایی",
    "ru": "Мощь финансового двигателя"
  },
  "cloud_infrastructure_guarantee": {
    "en": "We use a distributed cloud infrastructure that guarantees no downtime.",
    "ar": "نستخدم بنية تحتية سحابية موزعة تضمن عدم التوقف أبداً.",
    "fr": "Nous utilisons une infrastructure cloud distribuée qui garantit une disponibilité continue.",
    "tr": "Kesintisiz çalışma garantisi veren dağıtılmış bir bulut altyapısı kullanıyoruz.",
    "zh": "我们使用分布式云基础设施，确保永不宕机。",
    "ku": "ئێمە ژێرخانی هەوری دابەشکراو بەکاردێنین کە گەرەنتی نەوەستان دەدات.",
    "ru": "Мы используем распределенную облачную инфраструктуру, которая гарантирует бесперебойную работу."
  },
  "global_excellence": {
    "en": "Global Excellence",
    "ar": "التميز العالمي",
    "fr": "Excellence mondiale",
    "tr": "Küresel Mükemmellik",
    "zh": "全球卓越",
    "ku": "نایابی جیهانی",
    "ru": "Мировое превосходство"
  },
  "footer_about": {
    "en": "FastPay Network is the global standard for highly secure digital payments, combining advanced technology with outstanding financial services.",
    "ar": "FastPay Network هي المعيار العالمي للمدفوعات الرقمية عالية الأمان، نجمع بين التكنولوجيا المتطورة والخدمات المالية المتميزة.",
    "fr": "FastPay Network est la norme mondiale pour les paiements numériques hautement sécurisés, combinant une technologie de pointe avec des services financiers exceptionnels.",
    "tr": "FastPay Network, ileri teknolojiyi üstün finansal hizmetlerle birleştiren, yüksek güvenlikli dijital ödemeler için küresel bir standarttır.",
    "zh": "FastPay Network 是高度安全的数字支付全球标准，结合了先进技术和卓越的金融服务。",
    "ku": "تۆڕی FastPay ستانداردی جیهانییە بۆ پارەدانە دیجیتاڵییە زۆر پارێزراوەکان، تەکنەلۆژیای پێشکەوتوو لەگەڵ خزمەتگوزارییە داراییە نایابەکان کۆدەکاتەوە.",
    "ru": "FastPay Network - это мировой стандарт для высокозащищенных цифровых платежей, сочетающий передовые технологии с выдающимися финансовыми услугами."
  },
  "institution": {
    "en": "Institution",
    "ar": "المؤسسة",
    "fr": "Institution",
    "tr": "Kurum",
    "zh": "机构",
    "ku": "دامەزراوە",
    "ru": "Учреждение"
  },
  "about_network": {
    "en": "About Network",
    "ar": "عن الشبكة",
    "fr": "À propos du réseau",
    "tr": "Ağ Hakkında",
    "zh": "关于网络",
    "ku": "دەربارەی تۆڕەکە",
    "ru": "О сети"
  },
  "developer_portal": {
    "en": "Developer Portal",
    "ar": "بوابة المطورين",
    "fr": "Portail développeur",
    "tr": "Geliştirici Portalı",
    "zh": "开发者门户",
    "ku": "پۆرتاڵی گەشەپێدەران",
    "ru": "Портал разработчиков"
  },
  "security_policies": {
    "en": "Security Policies",
    "ar": "السياسات الأمنية",
    "fr": "Politiques de sécurité",
    "tr": "Güvenlik Politikaları",
    "zh": "安全政策",
    "ku": "سیاسەتەکانی ئاسایش",
    "ru": "Политика безопасности"
  },
  "technical_support": {
    "en": "Technical Support",
    "ar": "الدعم التقني",
    "fr": "Support technique",
    "tr": "Teknik Destek",
    "zh": "技术支持",
    "ku": "پشتگیری تەکنیکی",
    "ru": "Техническая поддержка"
  },
  "direct_contact": {
    "en": "Direct Contact",
    "ar": "تواصل مباشر",
    "fr": "Contact direct",
    "tr": "Doğrudan İletişim",
    "zh": "直接联系",
    "ku": "پەیوەندی ڕاستەوخۆ",
    "ru": "Прямой контакт"
  },
  "smart_salary_financing": {
    "en": "Smart Salary Financing",
    "ar": "تمويل الرواتب الذكي",
    "fr": "Financement intelligent des salaires",
    "tr": "Akıllı Maaş Finansmanı",
    "zh": "智能薪资融资",
    "ku": "پارەدانەوەی مووچەی زیرەک",
    "ru": "Умное финансирование зарплаты"
  },
  "salary_financing_desc": {
    "en": "The first platform that allows advance salary financing for employees with digital bank guarantees and fast deposits worldwide.",
    "ar": "أول منصة تتيح تمويل الرواتب المسبق للموظفين بضمانات بنكية رقمية وسرعة في الإيداع في كل انحاء العالم.",
    "fr": "La première plateforme qui permet le financement anticipé des salaires pour les employés avec des garanties bancaires numériques et des dépôts rapides dans le monde entier.",
    "tr": "Çalışanlar için dijital banka garantileri ve dünya genelinde hızlı para yatırma imkanı sunan ilk platform.",
    "zh": "首个允许员工通过数字银行担保和全球快速存款进行预支薪资融资的平台。",
    "ku": "یەکەم پلاتفۆرم کە ڕێگە بە پارەدانەوەی مووچەی پێشوەختە دەدات بۆ کارمەندان بە گەرەنتی بانکی دیجیتاڵی و خێرایی لە دانانی پارە لە هەموو جیهاندا.",
    "ru": "Первая платформа, позволяющая авансовое финансирование зарплаты для сотрудников с цифровыми банковскими гарантиями и быстрыми депозитами по всему миру."
  },
  "professional_trading_engine": {
    "en": "Professional Trading Engine",
    "ar": "محرك التداول الاحترافي",
    "fr": "Moteur de trading professionnel",
    "tr": "Profesyonel Ticaret Motoru",
    "zh": "专业交易引擎",
    "ku": "بزوێنەری بازرگانی پیشەیی",
    "ru": "Профессиональный торговый движок"
  },
  "trading_engine_desc": {
    "en": "Don't wait for the market, be the driver. Our platform provides you with direct access to global liquidity with smart analysis tools and instant charts.",
    "ar": "لا تنتظر السوق، بل كن أنت المحرك. منصتنا توفر لك وصولاً مباشراً للسيولة العالمية مع أدوات تحليل ذكية ومخططات بيانية فورية.",
    "fr": "N'attendez pas le marché, soyez le moteur. Notre plateforme vous offre un accès direct à la liquidité mondiale avec des outils d'analyse intelligents et des graphiques instantanés.",
    "tr": "Piyasayı beklemeyin, sürücü olun. Platformumuz akıllı analiz araçları ve anlık grafiklerle küresel likiditeye doğrudan erişim sağlar.",
    "zh": "不要等待市场，成为驱动者。我们的平台为您提供全球流动性的直接访问，以及智能分析工具和即时图表。",
    "ku": "چاوەڕێی بازاڕ مەکە، بەڵکو خۆت بزوێنەر بە. پلاتفۆرمەکەمان دەستڕاگەیشتنی ڕاستەوخۆت پێدەدات بە شلەیی جیهانی لەگەڵ ئامرازەکانی شیکردنەوەی زیرەک و نەخشەی خێرا.",
    "ru": "Не ждите рынок, будьте движущей силой. Наша платформа предоставляет вам прямой доступ к глобальной ликвидности с интеллектуальными инструментами анализа и мгновенными графиками."
  },
  "monthly_raffle": {
    "en": "Monthly Raffle: Dream of Luxury and Spirituality",
    "ar": "القرعة الشهرية: حلم الفخامة والروحانية",
    "fr": "Tombola mensuelle : Rêve de luxe et de spiritualité",
    "tr": "Aylık Çekiliş: Lüks ve Maneviyat Hayali",
    "zh": "每月抽奖：奢华与灵性的梦想",
    "ku": "تیروپشکی مانگانە: خەونی لوکس و ڕۆحانییەت",
    "ru": "Ежемесячная лотерея: Мечта о роскоши и духовности"
  },
  "raffle_desc": {
    "en": "Get ready for the biggest win of your journey! Participate now in the FastPay monthly draw to win a brand new supercar, or a VIP Umrah trip to the holiest places with full royal hospitality.",
    "ar": "استعد للربح الأكبر في مسيرتك! شارك الآن في سحب FastPay الشهري للفوز بسيارة رياضية خارقة أحدث طراز، أو رحلة عمرة VIP شاملة لأقدس البقاع بضيافة ملكية كاملة.",
    "fr": "Préparez-vous pour le plus grand gain de votre voyage ! Participez maintenant au tirage au sort mensuel FastPay pour gagner une toute nouvelle supercar, ou un voyage Omra VIP dans les lieux les plus saints avec une hospitalité royale complète.",
    "tr": "Yolculuğunuzun en büyük kazancına hazır olun! Şimdi FastPay aylık çekilişine katılarak yepyeni bir süper araba veya tam kraliyet misafirperverliği ile en kutsal yerlere VIP Umre gezisi kazanın.",
    "zh": "准备好迎接您旅程中最大的胜利！立即参加 FastPay 每月抽奖，赢取一辆全新的超级跑车，或一次包含皇家款待的圣地 VIP 副朝之旅。",
    "ku": "خۆت ئامادە بکە بۆ گەورەترین بردنەوەی گەشتەکەت! ئێستا بەشداری بکە لە تیروپشکی مانگانەی FastPay بۆ بردنەوەی ئۆتۆمبێلێکی وەرزشی نوێ، یان گەشتێکی عومرەی VIP بۆ پیرۆزترین شوێنەکان بە میوانداری شاهانەی تەواو.",
    "ru": "Приготовьтесь к самому большому выигрышу в вашем путешествии! Участвуйте сейчас в ежемесячном розыгрыше FastPay, чтобы выиграть совершенно новый суперкар или VIP-поездку в Умру в самые святые места с полным королевским гостеприимством."
  },
  "global_liquidity_bridge": {
    "en": "Global Liquidity Bridge: Swift and Borderless Instantaneity",
    "ar": "جسر السيولة العالمي: Swift وفورية بلا حدود",
    "fr": "Pont de liquidité mondial : Swift et instantanéité sans frontières",
    "tr": "Küresel Likidite Köprüsü: Swift ve Sınırsız Anındalık",
    "zh": "全球流动性桥梁：Swift 和无国界即时性",
    "ku": "پرۆژەی شلەیی جیهانی: سوئیفت و خێرایی بێ سنوور",
    "ru": "Глобальный мост ликвидности: Swift и безграничная мгновенность"
  },
  "transfer_desc": {
    "en": "Send and receive money instantly between FastPay Network users, or manage your international transfers via the global Swift system with extreme precision and security that exceeds traditional banking standards.",
    "ar": "أرسل واستقبل الأموال فورياً بين مستخدمي شبكة FastPay Network، أو قم بإدارة حوالاتك الدولية عبر نظام Swift العالمي بدقة متناهية وأمان يتجاوز المعايير البنكية التقليدية.",
    "fr": "Envoyez et recevez de l'argent instantanément entre les utilisateurs de FastPay Network, ou gérez vos virements internationaux via le système Swift mondial avec une précision extrême et une sécurité qui dépasse les normes bancaires traditionnelles.",
    "tr": "FastPay Network kullanıcıları arasında anında para gönderip alın veya uluslararası transferlerinizi küresel Swift sistemi aracılığıyla geleneksel bankacılık standartlarını aşan aşırı hassasiyet ve güvenlikle yönetin.",
    "zh": "在 FastPay Network 用户之间即时发送和接收资金，或通过全球 Swift 系统管理您的国际转账，其精确度和安全性超越传统银行标准。",
    "ku": "پارە خێرا بنێرە و وەربگرە لە نێوان بەکارهێنەرانی تۆڕی FastPay، یان گواستنەوە نێودەوڵەتییەکانت بەڕێوەبەرە لە ڕێگەی سیستەمی Swift ی جیهانییەوە بە وردبینییەکی زۆر و ئاسایشێک کە لە ستانداردە بانكيیە باوەکان تێدەپەڕێت.",
    "ru": "Мгновенно отправляйте и получайте деньги между пользователями FastPay Network или управляйте своими международными переводами через глобальную систему Swift с исключительной точностью и безопасностью, превосходящей традиционные банковские стандарты."
  },
  "your_future_starts_with_fastpay_checkout": {
    "en": "Your Future Starts with FastPay Checkout",
    "ar": "مستقبلك يبدأ بـ FastPay Checkout",
    "fr": "Votre avenir commence avec FastPay Checkout",
    "tr": "Geleceğiniz FastPay Checkout ile Başlar",
    "zh": "您的未来从 FastPay Checkout 开始",
    "ku": "داهاتووت بە FastPay Checkout دەست پێدەکات",
    "ru": "Ваше будущее начинается с FastPay Checkout"
  },
  "gateway_desc": {
    "en": "Transform your e-store into a leading global payment platform. Our gateway provides one-click programmatic integration, competitive commissions starting from 0.8%, instant profit settlement, and comprehensive cybersecurity protection to ensure the continuous growth of your business.",
    "ar": "حوّل متجرك الإلكتروني إلى منصة دفع عالمية رائدة. بوابتنا توفر لك دمجاً برمجياً بضغطة زر، عمولات تنافسية تبدأ من 0.8%، وتسوية فورية للأرباح مع حماية سيبرانية شاملة تضمن استمرارية نمو أعمالك.",
    "fr": "Transformez votre boutique en ligne en une plateforme de paiement mondiale de premier plan. Notre passerelle offre une intégration programmatique en un clic, des commissions compétitives à partir de 0,8 %, un règlement instantané des bénéfices et une protection complète contre la cybercriminalité pour assurer la croissance continue de votre entreprise.",
    "tr": "E-mağazanızı önde gelen bir küresel ödeme platformuna dönüştürün. Ağ geçidimiz tek tıklamayla programatik entegrasyon, %0,8'den başlayan rekabetçi komisyonlar, anında kar ödemesi ve işinizin sürekli büyümesini sağlamak için kapsamlı siber güvenlik koruması sunar.",
    "zh": "将您的电子商店转变为领先的全球支付平台。我们的网关提供一键式编程集成、0.8% 起的竞争性佣金、即时利润结算和全面的网络安全保护，以确保您的业务持续增长。",
    "ku": "دوکانە ئەلیکترۆنییەکەت بگۆڕە بۆ پلاتفۆرمێکی پێشەنگی پارەدانی جیهانی. دەروازەکەمان یەک کلیک یەکخستنی پڕۆگرامسازی، کۆمیسیۆنی کێبڕکێکار کە لە 0.8% دەست پێدەکات، چارەسەرکردنی قازانجی خێرا، و پاراستنی ئاسایشی سایبەری گشتگیر دابین دەکات بۆ دڵنیابوون لە گەشەی بەردەوامی کارەکەت.",
    "ru": "Превратите свой интернет-магазин в ведущую мировую платежную платформу. Наш шлюз обеспечивает программную интеграцию в один клик, конкурентоспособные комиссии от 0,8%, мгновенное урегулирование прибыли и комплексную кибербезопасность для обеспечения непрерывного роста вашего бизнеса."
  },
  "supabaseSyncError": {
    "en": "⚠️ Failed to save data to Supabase: {{message}}",
    "ar": "⚠️ فشل حفظ البيانات في Supabase: {{message}}",
    "fr": "⚠️ Échec de l'enregistrement des données dans Supabase : {{message}}",
    "tr": "⚠️ Supabase'e veri kaydedilemedi: {{message}}",
    "zh": "⚠️ 无法将数据保存到 Supabase：{{message}}",
    "ku": "⚠️ ناتوانرێت داتا لە Supabase پاشەکەوت بکرێت: {{message}}",
    "ru": "⚠️ Не удалось сохранить данные в Supabase: {{message}}"
  },
  "unknownError": {
    "en": "Unknown error",
    "ar": "خطأ غير معروف",
    "fr": "Erreur inconnue",
    "tr": "Bilinmeyen hata",
    "zh": "未知错误",
    "ku": "هەڵەیەکی نەزانراو",
    "ru": "Неизвестная ошибка"
  },
  "supabaseDisconnectedTitle": {
    "en": "⚠️ Alert: Database Disconnected",
    "ar": "⚠️ تنبيه: قاعدة البيانات غير متصلة",
    "fr": "⚠️ Alerte : Base de données déconnectée",
    "tr": "⚠️ Uyarı: Veritabanı Bağlantısı Kesildi",
    "zh": "⚠️ 警告：数据库已断开连接",
    "ku": "⚠️ ئاگاداری: بنکەدراوە پچڕاوە",
    "ru": "⚠️ Внимание: База данных отключена"
  },
  "supabaseDisconnectedMessage": {
    "en": "Supabase settings are not configured correctly. Data will only be saved in the browser (LocalStorage) and may be lost upon clearing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment settings.",
    "ar": "لم يتم ضبط إعدادات Supabase بشكل صحيح. سيتم حفظ البيانات في المتصفح فقط (LocalStorage) وقد تفقدها عند المسح. يرجى ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في إعدادات البيئة.",
    "fr": "Les paramètres Supabase ne sont pas configurés correctement. Les données ne seront enregistrées que dans le navigateur (LocalStorage) et pourraient être perdues lors de l'effacement. Veuillez définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans vos paramètres d'environnement.",
    "tr": "Supabase ayarları doğru yapılandırılmamış. Veriler yalnızca tarayıcıda (LocalStorage) kaydedilecek ve temizlendiğinde kaybolabilir. Lütfen ortam ayarlarınızda VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY'i ayarlayın.",
    "zh": "Supabase 设置不正确。数据将仅保存在浏览器（LocalStorage）中，清除时可能会丢失。请在您的环境变量设置中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。",
    "ku": "ڕێکخستنەکانی Supabase بە دروستی ڕێک نەخراون. داتا تەنها لە وێبگەڕدا (LocalStorage) پاشەکەوت دەکرێت و لەوانەیە لە کاتی سڕینەوەدا ون بێت. تکایە VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY لە ڕێکخستنەکانی ژینگەکەتدا دابنێ.",
    "ru": "Настройки Supabase настроены неверно. Данные будут сохраняться только в браузере (LocalStorage) и могут быть потеряны при очистке. Пожалуйста, установите VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в настройках вашей среды."
  },
  "closeButton": {
    "en": "✕",
    "ar": "✕",
    "fr": "✕",
    "tr": "✕",
    "zh": "✕",
    "ku": "✕",
    "ru": "✕"
  },
  "languageName_en": {
    "en": "English",
    "ar": "الإنجليزية",
    "fr": "Anglais",
    "tr": "İngilizce",
    "zh": "英语",
    "ku": "ئینگلیزی",
    "ru": "Английский"
  },
  "languageName_ar": {
    "en": "Arabic",
    "ar": "العربية",
    "fr": "Arabe",
    "tr": "Arapça",
    "zh": "阿拉伯语",
    "ku": "عەرەبی",
    "ru": "Арабский"
  },
  "languageName_fr": {
    "en": "French",
    "ar": "الفرنسية",
    "fr": "Français",
    "tr": "Fransızca",
    "zh": "法语",
    "ku": "فەرەنسی",
    "ru": "Французский"
  },
  "languageName_tr": {
    "en": "Turkish",
    "ar": "التركية",
    "fr": "Turc",
    "tr": "Türkçe",
    "zh": "土耳其语",
    "ku": "تورکی",
    "ru": "Турецкий"
  },
  "languageName_zh": {
    "en": "Chinese",
    "ar": "الصينية",
    "fr": "Chinois",
    "tr": "Çince",
    "zh": "中文",
    "ku": "چینی",
    "ru": "Киتابي"
  },
  "languageName_ku": {
    "en": "Kurdish",
    "ar": "الكردية",
    "fr": "Kurde",
    "tr": "Kürtçe",
    "zh": "库尔德语",
    "ku": "کوردی",
    "ru": "Курдский"
  },
  "languageName_ru": {
    "en": "Russian",
    "ar": "الروسية",
    "fr": "Russe",
    "tr": "Rusça",
    "zh": "俄语",
    "ku": "ڕووسی",
    "ru": "Русский"
  },
  "salary_ad_title": {
    "en": "Smart Salary Financing",
    "ar": "تمويل الرواتب الذكي",
    "fr": "Financement intelligent des salaires",
    "tr": "Akıllı Maaş Finansmanı",
    "zh": "智能薪资融资",
    "ku": "پارەدانەوەی مووچەی زیرەک",
    "ru": "Умное финансирование зарплаты"
  },
  "salary_ad_desc": {
    "en": "The first platform that allows advance salary financing for employees with digital bank guarantees and fast deposits worldwide.",
    "ar": "أول منصة تتيح تمويل الرواتب المسبق للموظفين بضمانات بنكية رقمية وسرعة في الإيداع في كل انحاء العالم.",
    "fr": "La première plateforme qui permet le financement anticipé des salaires pour les employés avec des garanties bancaires numériques et des dépôts rapides dans le monde entier.",
    "tr": "Çalışanlar için dijital banka garantileri ve dünya genelinde hızlı para yatırma imkanı sunan ilk platform.",
    "zh": "首个允许员工通过数字银行担保和全球快速存款进行预支薪资融资的平台。",
    "ku": "یەکەم پلاتفۆرم کە ڕێگە بە پارەدانەوەی مووچەی پێشوەختە دەدات بۆ کارمەندان بە گەرەنتی بانکی دیجیتاڵی و خێرایی لە دانانی پارە لە هەموو جیهاندا.",
    "ru": "Первая платформа, позволяющая авансовое финансирование зарплаты для сотрудников с цифровыми банковскими гарантиями и быстрыми депозитами по всему миру."
  },
  "trading_ad_title": {
    "en": "Professional Trading Engine",
    "ar": "محرك التداول الاحترافي",
    "fr": "Moteur de trading professionnel",
    "tr": "Profesyonel Ticaret Motoru",
    "zh": "专业交易引擎",
    "ku": "بزوێنەری بازرگانی پیشەیی",
    "ru": "Профессиональный торговый движок"
  },
  "trading_ad_desc": {
    "en": "Don't wait for the market, be the driver. Our platform provides you with direct access to global liquidity with smart analysis tools and instant charts.",
    "ar": "لا تنتظر السوق، بل كن أنت المحرك. منصتنا توفر لك وصولاً مباشراً للسيولة العالمية مع أدوات تحليل ذكية ومخططات بيانية فورية.",
    "fr": "N'attendez pas le marché, soyez le moteur. Notre plateforme vous offre un accès direct à la liquidité mondiale avec des outils d'analyse intelligents et des graphiques instantanés.",
    "tr": "Piyasayı beklemeyin, sürücü olun. Platformumuz akıllı analiz araçları ve anlık grafiklerle küresel likiditeye doğrudan erişim sağlar.",
    "zh": "不要等待市场，成为驱动者。我们的平台为您提供全球流动性的直接访问，以及智能分析工具和即时图表。",
    "ku": "چاوەڕێی بازاڕ مەکە، بەڵکو خۆت بزوێنەر بە. پلاتفۆرمەکەمان دەستڕاگەیشتنی ڕاستەوخۆت پێدەدات بە شلەیی جیهانی لەگەڵ ئامرازەکانی شیکردنەوەی زیرەک و نەخشەی خێرا.",
    "ru": "Не ждите рынок, будьте движущей силой. Наша платформа предоставляет вам прямой доступ к глобальной ликвидности с интеллектуальными инструментами анализа и мгновенными графиками."
  },
  "raffle_ad_title": {
    "en": "Monthly Raffle: Dream of Luxury",
    "ar": "القرعة الشهرية: حلم الفخامة",
    "fr": "Tombola mensuelle : Rêve de luxe",
    "tr": "Aylık Çekiliş: Lüks Hayali",
    "zh": "每月抽奖：奢华梦想",
    "ku": "تیروپشکی مانگانە: خەونی لوکس",
    "ru": "Ежемесячная лотерея: Мечта о роскоши"
  },
  "raffle_ad_desc": {
    "en": "Participate now in the FastPay monthly draw to win a brand new supercar, or a VIP Umrah trip.",
    "ar": "شارك الآن في سحب FastPay الشهري للفوز بسيارة رياضية خارقة أحدث طراز، أو رحلة عمرة VIP.",
    "fr": "Participez maintenant au tirage au sort mensuel FastPay pour gagner une toute nouvelle supercar ou un voyage Omra VIP.",
    "tr": "Şimdi FastPay aylık çekilişine katılarak yepyeni bir süper araba veya VIP Umre gezisi kazanın.",
    "zh": "立即参加 FastPay 每月抽奖，赢取一辆全新的超级跑车或一次 VIP 副朝之旅。",
    "ku": "ئێستا بەشداری بکە لە تیروپشکی مانگانەی FastPay بۆ بردنەوەی ئۆتۆمبێلێکی وەرزشی نوێ، یان گەشتێکی عومرەی VIP.",
    "ru": "Участвуйте сейчас в ежемесячном розыгрыше FastPay, чтобы выиграть совершенно новый суперкар или VIP-поездку в Умру."
  },
  "transfer_ad_title": {
    "en": "Global Liquidity Bridge",
    "ar": "جسر السيولة العالمي",
    "fr": "Pont de liquidité mondial",
    "tr": "Küresel Likidite Köprüsü",
    "zh": "全球流动性桥梁",
    "ku": "پرۆژەی شلەیی جیهانی",
    "ru": "Глобальный мост ликвидности"
  },
  "transfer_ad_desc": {
    "en": "Send and receive money instantly via the global Swift system with extreme precision.",
    "ar": "أرسل واستقبل الأموال فورياً عبر نظام Swift العالمي بدقة متناهية وأمان يتجاوز المعايير البنكية.",
    "fr": "Envoyez et recevez de l'argent instantanément via le système Swift mondial avec une précision extrême.",
    "tr": "Küresel Swift sistemi aracılığıyla aşırı hassasiyetle anında para gönderip alın.",
    "zh": "通过全球 Swift 系统以极高的精确度即时发送和接收资金。",
    "ku": "پارە خێرا بنێرە و وەربگرە لە ڕێگەی سیستەمی Swift ی جیهانییەوە بە وردبینییەکی زۆر.",
    "ru": "Мгновенно отправляйте и получайте деньги через глобальную систему Swift с исключительной точностью."
  },
  "gateway_ad_title": {
    "en": "FastPay Checkout Gateway",
    "ar": "بوابة دفع FastPay",
    "fr": "Passerelle FastPay Checkout",
    "tr": "FastPay Checkout Ağ Geçidi",
    "zh": "FastPay 结账网关",
    "ku": "دەروازەی پارەدانی FastPay",
    "ru": "Платежный шлюз FastPay Checkout"
  },
  "gateway_ad_desc": {
    "en": "Transform your e-store into a leading global payment platform with competitive commissions.",
    "ar": "حوّل متجرك الإلكتروني إلى منصة دفع عالمية رائدة بعمولات تنافسية تبدأ من 0.8%.",
    "fr": "Transformez votre boutique en ligne en une plateforme de paiement mondiale de premier plan avec des commissions compétitives.",
    "tr": "E-mağazanızı rekabetçi komisyonlarla önde gelen bir küresel ödeme platformuna dönüştürün.",
    "zh": "以具有竞争力的佣金将您的电子商店转变为领先的全球支付平台。",
    "ku": "دوکانە ئەلیکترۆنییەکەت بگۆڕە بۆ پلاتفۆرمێکی پێشەنگی پارەدانی جیهانی بە کۆمیسیۆنی کێبڕکێکار.",
    "ru": "Превратите свой интернет-магазин в ведущую мировую платежную платформу с конкурентоспособными комиссиями."
  },
  "nav_transfer": {
    "en": "Transfer",
    "ar": "التحويل",
    "fr": "Transfert",
    "tr": "Transfer",
    "zh": "转账",
    "ku": "گواستنەوە",
    "ru": "Перевод"
  },
  "nav_trading": {
    "en": "Trading",
    "ar": "التداول",
    "fr": "Trading",
    "tr": "Ticaret",
    "zh": "交易",
    "ku": "بازرگانی",
    "ru": "Торговля"
  },
  "system_premium": {
    "en": "System",
    "ar": "نظام",
    "fr": "Système",
    "tr": "Sistem",
    "zh": "系统",
    "ku": "سیستەم",
    "ru": "Система"
  },
  "global_liquidity_engine": {
    "en": "Global Liquidity Engine",
    "ar": "محرك السيولة العالمي",
    "fr": "Moteur de liquidité mondial",
    "tr": "Küresel Likidite Motoru",
    "zh": "全球流动性引擎",
    "ku": "بزوێنەری شلەی جیهانی",
    "ru": "Глобальный двигатель ликвидности"
  },
  "start_global_transfer": {
    "en": "Start Global Transfer 🌐",
    "ar": "ابدأ التحويل العالمي 🌐",
    "fr": "Démarrer le transfert mondial 🌐",
    "tr": "Küresel Transferi Başlat 🌐",
    "zh": "开始全球转账 🌐",
    "ku": "دەستپێکردنی گواستنەوەی جیهانی 🌐",
    "ru": "Начать глобальный перевод 🌐"
  },
  "professional_payment_gateway": {
    "en": "Professional Payment Gateway",
    "ar": "بوابة الدفع الاحترافية",
    "fr": "Passerelle de paiement professionnelle",
    "tr": "Profesyonel Ödeme Geçidi",
    "zh": "专业支付网关",
    "ku": "دەروازەی پارەدانی پیشەیی",
    "ru": "Профессиональный платежный шлюз"
  },
  "activate_gateway": {
    "en": "Activate Payment Gateway 🚀",
    "ar": "تفعيل بوابة الدفع 🚀",
    "fr": "Activer la passerelle de paiement 🚀",
    "tr": "Ödeme Geçidini Etkinleştir 🚀",
    "zh": "激活支付网关 🚀",
    "ku": "چالاککردنی دەروازەی پارەدان 🚀",
    "ru": "Активировать платежный шлюз 🚀"
  },
  "monthly_raffle_title": {
    "en": "FastPay Monthly Raffle",
    "ar": "سحب FastPay الشهري",
    "fr": "Tirage au sort mensuel FastPay",
    "tr": "FastPay Aylık Çekilişi",
    "zh": "FastPay 每月抽奖",
    "ku": "تیروپشکی مانگانەی FastPay",
    "ru": "Ежемесячный розыгрыش FastPay"
  },
  "raffle_countdown_text": {
    "en": "Time remaining for the big draw",
    "ar": "الوقت المتبقي للسحب الكبير",
    "fr": "Temps restant pour le grand tirage",
    "tr": "Büyük çekiliş için kalan süre",
    "zh": "大奖抽取剩余时间",
    "ku": "کاتی ماوە بۆ تیروپشکە گەورەکە",
    "ru": "Оставшееся время до большого розыгрыша"
  },
  "porsche_title": {
    "en": "Porsche 911 GT3",
    "ar": "سيارة Porsche 911 GT3",
    "fr": "Porsche 911 GT3",
    "tr": "Porsche 911 GT3",
    "zh": "保时捷 911 GT3",
    "ku": "ئۆتۆمبێلی Porsche 911 GT3",
    "ru": "Porsche 911 GT3"
  },
  "porsche_desc": {
    "en": "2024 Sport Edition - King of the Road",
    "ar": "اصدار 2024 الرياضي - ملك الطريق",
    "fr": "Édition Sport 2024 - Roi de la route",
    "tr": "2024 Spor Versiyonu - Yolun Kralı",
    "zh": "2024 运动版 - 公路之王",
    "ku": "وەشانی وەرزشی ٢٠٢٤ - پاشای ڕێگا",
    "ru": "Спортивная версия 2024 года - Король дорог"
  },
  "umrah_title": {
    "en": "Royal Umrah Trip (VIP)",
    "ar": "رحلة عمرة ملكية (VIP)",
    "fr": "Voyage Omra Royal (VIP)",
    "tr": "Kraliyet Umre Gezisi (VIP)",
    "zh": "皇家副朝之旅 (VIP)",
    "ku": "گەشتی عومرەی شاهانە (VIP)",
    "ru": "Королевская поездка в Умру (VIP)"
  },
  "umrah_desc": {
    "en": "Stay in a suite overlooking the Haram - Private flight",
    "ar": "اقامة في جناح مطل على الحرم - طيران خاص",
    "fr": "Séjour dans une suite surplombant le Haram - Vol privé",
    "tr": "Harem manzaralı süitte konaklama - Özel uçuş",
    "zh": "入住俯瞰禁寺的套房 - 私人飞行",
    "ku": "مانەوە لە سویتێکی ڕووەو حەرەم - گەشتی ئاسمانی تایبەت",
    "ru": "Проживание в люксе с видом на Харам - Частный перелет"
  },
  "book_ticket": {
    "en": "Book Your Ticket",
    "ar": "احجز تذكرتك",
    "fr": "Réservez votre billet",
    "tr": "Biletinizi Ayırtın",
    "zh": "预订您的门票",
    "ku": "تیکتەکەت بپشکنە",
    "ru": "Забронируйте свой билет"
  },
  "limited_seats": {
    "en": "Seats are very limited for this draw",
    "ar": "المقاعد محدودة جداً لهذا السحب",
    "fr": "Les places sont très limitées pour ce tirage",
    "tr": "Bu çekiliş için kontenjanlar çok sınırlıdır",
    "zh": "本次抽奖名额非常有限",
    "ku": "شوێنەکان زۆر سنووردارن بۆ ئەم تیروپشکە",
    "ru": "Количество мест на этот розыгрыش сильно ограничено"
  },
  "prize_value_exceeds": {
    "en": "Prize value exceeds",
    "ar": "قيمة الجائزة تتجاوز",
    "fr": "La valeur du prix dépasse",
    "tr": "Ödül değeri aşıyor",
    "zh": "奖品价值超过",
    "ku": "بەهای خەڵاتەکە زیاترە لە",
    "ru": "Стоимость приза превышает"
  },
  "global_campaigns": {
    "en": "Our Global Campaigns",
    "ar": "حملاتنا العالمية",
    "fr": "Nos campagnes mondiales",
    "tr": "Küresel Kampanyalarımız",
    "zh": "我们的全球活动",
    "ku": "کەمپەینە جیهانییەکانمان",
    "ru": "Наши глобальные кампании"
  },
  "discover_more": {
    "en": "Discover More",
    "ar": "اكتشف المزيد",
    "fr": "Découvrir plus",
    "tr": "Daha Fazlasını Keşfet",
    "zh": "探索更多",
    "ku": "زیاتر بدۆزەرەوە",
    "ru": "Узнать больше"
  },
  "exclusive_financial_innovation": {
    "en": "Exclusive Financial Innovation",
    "ar": "ابتكار مالي حصري",
    "fr": "Innovation financière exclusive",
    "tr": "Özel Finansal İnovasyon",
    "zh": "独家金融创新",
    "ku": "داهێنانی دارایی تایبەت",
    "ru": "Эксклюзивные финансовые инновации"
  },
  "request_pre_financing": {
    "en": "Request Pre-Financing",
    "ar": "اطلب التمويل المسبق",
    "fr": "Demander un préfinancement",
    "tr": "Ön Finansman Talep Et",
    "zh": "申请预融资",
    "ku": "داوای پێشوەختەی دارایی بکە",
    "ru": "Запросить предварительное финансирование"
  },
  "elite_level_trading": {
    "en": "Elite Level Trading",
    "ar": "تداول بمستوى النخبة",
    "fr": "Trading de niveau élite",
    "tr": "Seçkin Seviye Ticaret",
    "zh": "精英级交易",
    "ku": "بازرگانی لە ئاستی بژاردە",
    "ru": "Торговля элитного уровня"
  },
  "enter_pro_platform": {
    "en": "Enter Professional Platform",
    "ar": "دخول المنصة الاحترافية",
    "fr": "Entrer sur la plateforme professionnelle",
    "tr": "Profesyonel Platforma Gir",
    "zh": "进入专业平台",
    "ku": "چوونە ناو سەکۆی پیشەیی",
    "ru": "Войти на профессиональную платформу"
  },
  "content_not_available": {
    "en": "Content is currently unavailable",
    "ar": "المحتوى غير متوفر حالياً",
    "fr": "Le contenu est actuellement indisponible",
    "tr": "İçerik şu anda mevcut değil",
    "zh": "内容目前不可用",
    "ku": "ناوەرۆک لە ئێستادا بەردەست نییە",
    "ru": "Контент в данный момент недоступен"
  },
  "back_to_financial_center": {
    "en": "Back to Financial Center",
    "ar": "العودة للمركز المالي",
    "fr": "Retour au centre financier",
    "tr": "Finans Merkezine Dön",
    "zh": "返回金融中心",
    "ku": "گەڕانەوە بۆ ناوەندی دارایی",
    "ru": "Вернуться في финансовый центр"
  },
  "hero_cta_text": {
    "en": "Open Royal Account",
    "ar": "افتح حسابك الملكي",
    "fr": "Ouvrir un compte Royal",
    "tr": "Kraliyet Hesabı Aç",
    "zh": "开设皇家账户",
    "ku": "هەژماری شاهانە بکەرەوە",
    "ru": "Открыть королевский счет"
  },
  "sales_cta_text": {
    "en": "Contact Management",
    "ar": "تواصل مع الإدارة",
    "fr": "Contacter la direction",
    "tr": "Yönetimle İletişime Geç",
    "zh": "联系管理层",
    "ku": "پەیوەندی بە بەڕێوەبەرایەتییەوە بکە",
    "ru": "Связаться с руководством"
  },
  "nav_swift": {
    "en": "Swift",
    "ar": "سويفت",
    "fr": "Swift",
    "tr": "Swift",
    "zh": "斯威夫特",
    "ku": "سوئیفت",
    "ru": "Свифт"
  },
  "nav_gateway": {
    "en": "Gateway",
    "ar": "البوابة",
    "fr": "Passerelle",
    "tr": "Ağ Geçidi",
    "zh": "网关",
    "ku": "دەروازە",
    "ru": "Шлюз"
  },
  "nav_services": {
    "en": "Services",
    "ar": "الخدمات",
    "fr": "Services",
    "tr": "Hizmetler",
    "zh": "服务",
    "ku": "خزمەتگوزارییەکان",
    "ru": "Услуги"
  },
  "services_title": {
    "en": "Services",
    "ar": "الخدمات",
    "fr": "Services",
    "tr": "Hizmetler",
    "zh": "服务",
    "ku": "خزمەتگوزارییەکان",
    "ru": "Услуги"
  },
  "services_subtitle": {
    "en": "Integrated financial solutions designed for the elite, combining speed, security, and global innovation.",
    "ar": "حلول مالية متكاملة مصممة للنخبة، تجمع بين السرعة والأمان والابتكار العالمي.",
    "fr": "Solutions financières intégrées conçues pour l'élite, alliant vitesse, sécurité et innovation mondiale.",
    "tr": "Hız, güvenlik ve küresel inovasyonu birleştiren, seçkinler için tasarlanmış entegre finansal çözümler.",
    "zh": "为精英设计的综合金融解决方案，结合了速度、安全和全球创新。",
    "ku": "چارەسەری دارایی یەکخراو کە بۆ بژاردەکان داڕێژراوە، خێرایی و ئاسایش و داهێنانی جیهانی کۆدەکاتەوە.",
    "ru": "Интегрированные финансовые решения, разработанные для элиты, сочетающие в себе скорость, безопасность и глобальные инновации."
  },
  "gallery_title": {
    "en": "Global Financial Infrastructure",
    "ar": "البنية التحتية المالية العالمية",
    "fr": "Infrastructure financière mondiale",
    "tr": "Küresel Finansal Altyapı",
    "zh": "全球金融基础设施",
    "ku": "ژێرخانی دارایی جیهانی",
    "ru": "Глобальная финансовая инфраструктура"
  },
  "footer_links_title": {
    "en": "Quick Links",
    "ar": "روابط سريعة",
    "fr": "Liens rapides",
    "tr": "Hızlı Bağlantılar",
    "zh": "快速链接",
    "ku": "بەستەرە خێراکان",
    "ru": "Быстрые ссылки"
  },
  "contact_section_title": {
    "en": "Contact Us",
    "ar": "تواصل معنا",
    "fr": "Contactez-nous",
    "tr": "Bize Ulaşın",
    "zh": "联系我们",
    "ku": "پەیوەندیمان پێوە بکە",
    "ru": "Связаться с нами"
  },
  "contact_address": {
    "en": "Riyadh, Saudi Arabia",
    "ar": "الرياض، المملكة العربية السعودية",
    "fr": "Riyad, Arabie Saoudite",
    "tr": "Riyad, Suudi Arabistan",
    "zh": "沙特阿拉伯利雅得",
    "ku": "ڕیاز، عەرەبستانی سعوودی",
    "ru": "Эр-Рияд, Саудовская Аравия"
  },
  "asset_eur_usd": { "en": "EUR / USD", "ar": "اليورو / دولار", "fr": "EUR / USD", "tr": "EUR / USD", "zh": "欧元 / 美元", "ku": "یۆرۆ / دۆلار", "ru": "EUR / USD" },
  "asset_gbp_usd": { "en": "GBP / USD", "ar": "الجنيه / دولار", "fr": "GBP / USD", "tr": "GBP / USD", "zh": "英镑 / 美元", "ku": "پاوەند / دۆلار", "ru": "GBP / USD" },
  "asset_usd_jpy": { "en": "USD / JPY", "ar": "دولار / ين", "fr": "USD / JPY", "tr": "USD / JPY", "zh": "美元 / 日元", "ku": "دۆلار / یەن", "ru": "USD / JPY" },
  "footer_link_1": {
    "en": "Privacy Policy",
    "ar": "سياسة الخصوصية",
    "fr": "Politique de confidentialité",
    "tr": "Gizlilik Politikası",
    "zh": "隐私政策",
    "ku": "سیاسەتی تایبەتمەندی",
    "ru": "Политика конфиденциальности"
  },
  "footer_link_2": {
    "en": "Terms of Service",
    "ar": "شروط الخدمة",
    "fr": "Conditions d'utilisation",
    "tr": "Hizmet Şartları",
    "zh": "服务条款",
    "ku": "مەرجەکانی خزمەتگوزاری",
    "ru": "Условия обслуживания"
  },
  "footer_link_3": {
    "en": "Security Standards",
    "ar": "معايير الأمان",
    "fr": "Normes de sécurité",
    "tr": "Güvenlik Standartları",
    "zh": "安全标准",
    "ku": "ستانداردەکانی ئاسایش",
    "ru": "Стандарты безопасности"
  },
  "footer_link_4": {
    "en": "Global Licenses",
    "ar": "التراخيص العالمية",
    "fr": "Licences mondiales",
    "tr": "Küresel Lisanslar",
    "zh": "全球执照",
    "ku": "مۆڵەتە جیهانییەکان",
    "ru": "Глобальные лицензии"
  },
  "global_financial_infrastructure": {
    "en": "GLOBAL FINANCIAL INFRASTRUCTURE",
    "ar": "البنية التحتية المالية العالمية",
    "fr": "INFRASTRUCTURE FINANCIÈRE MONDIALE",
    "tr": "KÜRESEL FİNANSAL ALTYAPI",
    "zh": "全球金融基础设施",
    "ku": "ژێرخانی دارایی جیهانی",
    "ru": "ГЛОБАЛЬНАЯ ФИНАНСОВАЯ ИНФРАСТРУКТУРА"
  },
  "secure_access_portal": {
    "en": "Secure Access Portal",
    "ar": "بوابة الوصول الآمن",
    "fr": "Portail d'accès sécurisé",
    "tr": "Güvenli Erişim Portalı",
    "zh": "安全访问门户",
    "ku": "دەروازەی گەیشتنی پارێزراو",
    "ru": "Портал безопасного доступа"
  },
  "executive_management_panel": {
    "en": "Executive Management Panel",
    "ar": "لوحة الإدارة التنفيذية",
    "fr": "Panneau de direction exécutive",
    "tr": "Yönetim Kurulu Paneli",
    "zh": "执行管理面板",
    "ku": "تەختەی بەڕێوەبردنی جێبەجێکار",
    "ru": "Панель исполнительного руководства"
  },
  "distributor_platform": {
    "en": "Distributor Platform",
    "ar": "منصة الموزعين",
    "fr": "Plateforme distributeur",
    "tr": "Distribütör Platformu",
    "zh": "分销商平台",
    "ku": "پلاتفۆرمی دابەشکەران",
    "ru": "Платформа дистрибьютора"
  },
  "merchant_platform": {
    "en": "Merchant Platform",
    "ar": "منصة التاجر",
    "fr": "Plateforme marchand",
    "tr": "Tüccar Platformu",
    "zh": "商户平台",
    "ku": "پلاتفۆرمی بازرگانان",
    "ru": "Платформа мерчанта"
  },
  "digital_wallet": {
    "en": "Digital Wallet",
    "ar": "المحفظة الرقمية",
    "fr": "Portefeuille numérique",
    "tr": "Dijital Cüzdan",
    "zh": "数字钱包",
    "ku": "جزدانی دیجیتاڵی",
    "ru": "Цифровой кошелек"
  },
  "create_new_account": {
    "en": "Create New Account",
    "ar": "إنشاء حساب جديد",
    "fr": "Créer un nouveau compte",
    "tr": "Yeni Hesap Oluştur",
    "zh": "创建新账户",
    "ku": "دروستکردنی هەژماری نوێ",
    "ru": "Создать новый аккаунт"
  },
  "choose_account_type": {
    "en": "Choose your account type to continue",
    "ar": "اختر نوع حسابك للمتابعة",
    "fr": "Choisissez votre type de compte pour continuer",
    "tr": "Devam etmek için hesap türünüzü seçin",
    "zh": "选择您的账户类型以继续",
    "ku": "جۆری هەژمارەکەت هەڵبژێرە بۆ بەردەوامبوون",
    "ru": "Выберите тип аккаунта для продолжения"
  },
  "executive_management": {
    "en": "Executive Management",
    "ar": "الإدارة التنفيذية",
    "fr": "Direction exécutive",
    "tr": "Yönetim Kurulu",
    "zh": "执行管理",
    "ku": "بەڕێوەبردنی جێبەجێکار",
    "ru": "Исполнительное руководство"
  },
  "network_management_desc": {
    "en": "Network and financial liquidity management",
    "ar": "إدارة الشبكة والسيولة المالية",
    "fr": "Gestion du réseau et de la liquidité financière",
    "tr": "Ağ ve finansal likidite yönetimi",
    "zh": "网络和财务流动性管理",
    "ku": "بەڕێوەبردنی تۆڕ و نەختینەی دارایی",
    "ru": "Управление сетью и финансовой ликвидностью"
  },
  "distributor_ops_desc": {
    "en": "Linking operations and direct sales",
    "ar": "عمليات الربط والمبيعات المباشرة",
    "fr": "Opérations de liaison et ventes directes",
    "tr": "Bağlantı işlemleri ve doğrudan satışlar",
    "zh": "链接业务和直接销售",
    "ku": "ئۆپەراسیۆنەکانی بەستنەوە و فرۆشتنی ڕاستەوخۆ",
    "ru": "Связующие операции и прямые продажи"
  },
  "merchant_deals_desc": {
    "en": "Deals and documentary credits management",
    "ar": "إدارة الصفقات والاعتمادات المستندية",
    "fr": "Gestion des transactions et des crédits documentaires",
    "tr": "Anlaşmalar ve akreditif yönetimi",
    "zh": "交易和跟单信用证管理",
    "ku": "بەڕێوەبردنی گرێبەستەکان و ئیعتمادی بەڵگەنامەیی",
    "ru": "Управление сделками и документарными аккредитивами"
  },
  "personal_payments_desc": {
    "en": "Transfers and personal payments",
    "ar": "الحوالات والمدفوعات الشخصية",
    "fr": "Virements et paiements personnels",
    "tr": "Transferler ve kişisel ödemeler",
    "zh": "转账和个人支付",
    "ku": "گواستنەوە و پارەدانە کەسییەکان",
    "ru": "Переводы и личные платежи"
  },
  "no_account_yet": {
    "en": "Don't have an account in the network?",
    "ar": "لا تملك حساباً في الشبكة؟",
    "fr": "Vous n'avez pas de compte dans le réseau ?",
    "tr": "Ağda bir hesabınız yok mu?",
    "zh": "在网络中还没有账户？",
    "ku": "هەژمارت نییە لە تۆڕەکەدا؟",
    "ru": "Нет аккаунта в сети?"
  },
  "back": {
    "en": "Back",
    "ar": "رجوع",
    "fr": "Retour",
    "tr": "Geri",
    "zh": "返回",
    "ku": "گەڕانەوە",
    "ru": "Назад"
  },
  "auth_and_login": {
    "en": "Authenticate and Login",
    "ar": "المصادقة والدخول",
    "fr": "Authentifier et se connecter",
    "tr": "Kimlik Doğrula ve Giriş Yap",
    "zh": "身份验证并登录",
    "ku": "سەلماندن و چوونەژوورەوە",
    "ru": "Аутентификация и вход"
  },
  "username_label": {
    "en": "Username",
    "ar": "اسم المستخدم",
    "fr": "Nom d'utilisateur",
    "tr": "Kullanıcı Adı",
    "zh": "用户名",
    "ku": "ناوی بەکارهێنەر",
    "ru": "Имя пользователя"
  },
  "password_label": {
    "en": "Password",
    "ar": "كلمة المرور",
    "fr": "Mot de passe",
    "tr": "Şifre",
    "zh": "密码",
    "ku": "وشەی نهێنی",
    "ru": "Пароль"
  },
  "aes_encryption_active": {
    "en": "AES-256 encryption is automatically enabled for this session",
    "ar": "تشفير AES-256 مفعل تلقائياً لهذه الجلسة",
    "fr": "Le cryptage AES-256 est automatiquement activé pour cette session",
    "tr": "Bu oturum için AES-256 şifrelemesi otomatik olarak etkinleştirildi",
    "zh": "此会话已自动启用 AES-256 加密",
    "ku": "کۆدکردنی AES-256 بە شێوەیەکی خۆکار بۆ ئەم دانیشتنە چالاک کراوە",
    "ru": "Шифрование AES-256 автоматически включено для этой сессии"
  },
  "full_name": {
    "en": "Full Name",
    "ar": "الاسم الكامل",
    "fr": "Nom complet",
    "tr": "Ad Soyad",
    "zh": "全名",
    "ku": "ناوی تەواو",
    "ru": "Полное имя"
  },
  "phone_number": {
    "en": "Phone Number",
    "ar": "رقم الهاتف",
    "fr": "Numéro de téléphone",
    "tr": "Telefon Numarası",
    "zh": "电话号码",
    "ku": "ژمارەی تەلەفۆن",
    "ru": "Номер телефона"
  },
  "email_label": {
    "en": "Email Address",
    "ar": "البريد الإلكتروني",
    "fr": "Adresse e-mail",
    "tr": "E-posta Adresi",
    "zh": "电子邮件地址",
    "ku": "ناونیشانی ئیمەیڵ",
    "ru": "Адрес электронной почты"
  },
  "confirm_password": {
    "en": "Confirm Password",
    "ar": "تأكيد كلمة المرور",
    "fr": "Confirmer le mot de passe",
    "tr": "Şifreyi Onayla",
    "zh": "确认密码",
    "ku": "دوپاتکردنەوەی وشەی نهێنی",
    "ru": "Подтвердите пароль"
  },
  "join_financial_future": {
    "en": "Join the Financial Future",
    "ar": "انضم للمستقبل المالي",
    "fr": "Rejoignez l'avenir financier",
    "tr": "Finansal Geleceğe Katılın",
    "zh": "加入金融未来",
    "ku": "پەیوەندی بە دواڕۆژی داراییەوە بکە",
    "ru": "Присоединяйтесь к финансовому будущему"
  },
  "luxury_membership": {
    "en": "FastPay Network Luxury Digital Membership",
    "ar": "عضوية FastPay Network الرقمية الفاخرة",
    "fr": "Adhésion numérique de luxe FastPay Network",
    "tr": "FastPay Network Lüks Dijital Üyeliği",
    "zh": "FastPay Network 豪华数字会员",
    "ku": "ئەندامێتی دیجیتاڵی لوکسی تۆڕی FastPay",
    "ru": "Роскошное цифровое членство FastPay Network"
  },
  "establish_membership": {
    "en": "Establish Digital Membership",
    "ar": "تأسيس العضوية الرقمية",
    "fr": "Établir une adhésion numérique",
    "tr": "Dijital Üyelik Oluştur",
    "zh": "建立数字会员身份",
    "ku": "دامەزراندنی ئەندامێتی دیجیتاڵی",
    "ru": "Создать цифровое членство"
  },
  "already_have_account": {
    "en": "Already have an activated account?",
    "ar": "لديك حساب مفعل مسبقاً؟",
    "fr": "Vous avez déjà un compte activé ?",
    "tr": "Zaten etkinleştirilmiş bir hesabınız mı var?",
    "zh": "已经有激活的账户了？",
    "ku": "پێشتر هەژماری چالاککراوت هەیە؟",
    "ru": "Уже есть активированный аккаунт?"
  },
  "login_here": {
    "en": "Login from here",
    "ar": "سجل دخولك من هنا",
    "fr": "Connectez-vous d'ici",
    "tr": "Buradan giriş yapın",
    "zh": "从这里登录",
    "ku": "لێرەوە بچۆ ژوورەوە",
    "ru": "Войдите здесь"
  },
  "login_as": {
    "en": "Login as",
    "ar": "دخول",
    "fr": "Se connecter en tant que",
    "tr": "Olarak giriş yap",
    "zh": "登录身份",
    "ku": "چوونەژوورەوە وەک",
    "ru": "Войти как"
  },
  "executive": {
    "en": "Executive",
    "ar": "المطور",
    "fr": "Exécutif",
    "tr": "Yönetici",
    "zh": "主管",
    "ku": "جێبەجێکار",
    "ru": "Руководитель"
  },
  "distributor": {
    "en": "Distributor",
    "ar": "الموزع",
    "fr": "Distributeur",
    "tr": "Distribütör",
    "zh": "分销商",
    "ku": "دابەشکەر",
    "ru": "Дистрибьютор"
  },
  "merchant": {
    "en": "Merchant",
    "ar": "التاجر",
    "fr": "Marchand",
    "tr": "Tüccar",
    "zh": "商户",
    "ku": "بازرگان",
    "ru": "Мерчант"
  },
  "user": {
    "en": "User",
    "ar": "المستخدم",
    "fr": "Utilisateur",
    "tr": "Kullanıcı",
    "zh": "用户",
    "ku": "بەکارهێنەر",
    "ru": "Пользователь"
  },
  "authenticating": {
    "en": "Authenticating Security",
    "ar": "جاري المصادقة الأمنية",
    "fr": "Authentification de sécurité",
    "tr": "Güvenlik Doğrulanıyor",
    "zh": "正在进行安全身份验证",
    "ku": "سەلماندنی ئاسایش لە کاردایە",
    "ru": "Аутентификация безопасности"
  },
  "security_shield": {
    "en": "FastPay Network Security Shield",
    "ar": "درع الحماية لشبكة FastPay",
    "fr": "Bouclier de sécurité FastPay Network",
    "tr": "FastPay Network Güvenlik Kalkanı",
    "zh": "FastPay 网络安全盾",
    "ku": "قەڵغانی ئاسایشی تۆڕی FastPay",
    "ru": "Щит безопасности FastPay Network"
  },
  "auth_phrase_1": {
    "en": "Starting digital identity verification via FastPay-Secure protocol...",
    "ar": "بدء التحقق من الهوية الرقمية عبر بروتوكول FastPay-Secure...",
    "fr": "Démarrage de la vérification de l'identité numérique via le protocole FastPay-Secure...",
    "tr": "FastPay-Secure protokolü üzerinden dijital kimlik doğrulaması başlatılıyor...",
    "zh": "正在通过 FastPay-Secure 协议开始数字身份验证...",
    "ku": "دەستپێکردنی سەلماندنی ناسنامەی دیجیتاڵی لە ڕێگەی پرۆتۆکۆڵی FastPay-Secure...",
    "ru": "Запуск верификации цифровой личности через протокол FastPay-Secure..."
  },
  "auth_phrase_2": {
    "en": "Scanning digital fingerprint and matching with elite database...",
    "ar": "فحص البصمة الرقمية ومطابقتها مع قاعدة بيانات النخبة...",
    "fr": "Numérisation de l'empreinte digitale et comparaison avec la base de données d'élite...",
    "tr": "Dijital parmak izi taranıyor ve elit veri tabanıyla eşleştiriliyor...",
    "zh": "正在扫描数字指纹并与精英数据库匹配...",
    "ku": "پشکنینی پەنجەمۆری دیجیتاڵی و هاوتاکردنی لەگەڵ بنکەی زانیاری بژاردە...",
    "ru": "Сканирование цифрового отпечатка и сопоставление с элитной базой данных..."
  },
  "auth_phrase_3": {
    "en": "Encrypting connection session with global AES-256 GCM system...",
    "ar": "تشفير جلسة الاتصال بنظام AES-256 GCM العالمي...",
    "fr": "Cryptage de la session de connexion avec le système mondial AES-256 GCM...",
    "tr": "Bağlantı oturumu küresel AES-256 GCM sistemi ile şifreleniyor...",
    "zh": "正在使用全球 AES-256 GCM 系统加密连接会话...",
    "ku": "کۆدکردنی دانیشتنی پەیوەندی بە سیستەمی جیهانی AES-256 GCM...",
    "ru": "Шифрование сеанса соединения с помощью глобальной системы AES-256 GCM..."
  },
  "auth_phrase_4": {
    "en": "Verifying access permissions to central server (Riyadh-Node-01)...",
    "ar": "التحقق من صلاحيات الوصول إلى الخادم المركزي (Riyadh-Node-01)...",
    "fr": "Vérification des autorisations d'accès au serveur central (Riyadh-Node-01)...",
    "tr": "Merkezi sunucuya (Riyadh-Node-01) erişim izinleri doğrulanıyor...",
    "zh": "正在验证中央服务器 (Riyadh-Node-01) 的访问权限...",
    "ku": "سەلماندنی مۆڵەتەکانی گەیشتن بە سێرڤەری ناوەندی (Riyadh-Node-01)...",
    "ru": "Проверка прав доступа к центральному серверу (Riyadh-Node-01)..."
  },
  "auth_phrase_5": {
    "en": "Syncing digital wallet with global transaction ledger...",
    "ar": "مزامنة المحفظة الرقمية مع سجل المعاملات العالمي...",
    "fr": "Synchronisation du portefeuille numérique avec le registre des transactions mondiales...",
    "tr": "Dijital cüzdan küresel işlem defteriyle senkronize ediliyor...",
    "zh": "正在将数字钱包与全球交易账本同步...",
    "ku": "هاوکاتکردنی جزدانی دیجیتاڵی لەگەڵ تۆماری مامەڵە جیهانییەکان...",
    "ru": "Синхронизация цифрового кошелька с глобальным реестром транзакций..."
  },
  "auth_phrase_6": {
    "en": "Securing communication channel and preparing banking dashboard...",
    "ar": "تأمين قناة الاتصال وتجهيز لوحة القيادة البنكية...",
    "fr": "Sécurisation du canal de communication et préparation du tableau de bord bancaire...",
    "tr": "İletişim kanalı güvenli hale getiriliyor ve bankacılık paneli hazırlanıyor...",
    "zh": "正在保护通信渠道并准备银行仪表板...",
    "ku": "پاراستنی کەناڵی پەیوەندی و ئامادەکردنی تەختەی بانکی...",
    "ru": "Защита канала связи и подготовка банковской панели..."
  },
  "nav_home": {
    "en": "Home",
    "ar": "الرئيسية",
    "fr": "Accueil",
    "tr": "Ana Sayfa",
    "zh": "首页",
    "ku": "سەرەکی",
    "ru": "Главная"
  },
  "nav_overview": {
    "en": "Overview",
    "ar": "نظرة عامة",
    "fr": "Aperçu",
    "tr": "Genel Bakış",
    "zh": "概览",
    "ku": "تێڕوانینێکی گشتی",
    "ru": "Обзор"
  },
  "nav_users": {
    "en": "User Management",
    "ar": "إدارة الأعضاء",
    "fr": "Gestion des utilisateurs",
    "tr": "Kullanıcı Yönetimi",
    "zh": "用户管理",
    "ku": "بەڕێوەبردنی ئەندامان",
    "ru": "Управление пользователями"
  },
  "nav_trading_engine": {
    "en": "Trading Engine",
    "ar": "محرك الصفقات",
    "fr": "Moteur de trading",
    "tr": "Ticaret Motoru",
    "zh": "交易引擎",
    "ku": "بزوێنەری بازرگانی",
    "ru": "Торговый движок"
  },
  "nav_salary_funding": {
    "en": "Salary Funding",
    "ar": "تمويل الرواتب",
    "fr": "Financement des salaires",
    "tr": "Maaş Finansmanı",
    "zh": "工资资金",
    "ku": "پارەدارکردنی مووچە",
    "ru": "Финансирование зарплаты"
  },
  "nav_card_gen": {
    "en": "Card Generation",
    "ar": "توليد البطاقات",
    "fr": "Génération de cartes",
    "tr": "Kart Oluşturma",
    "zh": "卡片生成",
    "ku": "دروستکردنی کارت",
    "ru": "Генерация карт"
  },
  "nav_invest_plans": {
    "en": "Investment Plans",
    "ar": "خطط الاستثمار",
    "fr": "Plans d'investissement",
    "tr": "Yatırım Planları",
    "zh": "投资计划",
    "ku": "پلانەکانی وەبەرهێنان",
    "ru": "Инвестиционные планы"
  },
  "الخطة البلاتينية": {
    "en": "Platinum Plan",
    "ar": "الخطة البلاتينية",
    "fr": "Plan Platine",
    "tr": "Platin Plan",
    "zh": "铂金计划",
    "ku": "پلانی پلاتینی",
    "ru": "Платиновый план"
  },
  "صندوق النخبة الاحتياطي": {
    "en": "Elite Reserve Fund",
    "ar": "صندوق النخبة الاحتياطي",
    "fr": "Fonds de réserve d'élite",
    "tr": "Elit Rezerv Fonu",
    "zh": "精英储备基金",
    "ku": "سندوقی یەدەگی بژاردە",
    "ru": "Элитный резервный фонд"
  },
  "ايجار سهم في منصة الاستثمار": {
    "en": "Share Rental in Investment Platform",
    "ar": "ايجار سهم في منصة الاستثمار",
    "fr": "Location d'actions sur la plateforme d'investissement",
    "tr": "Yatırım Platformunda Hisse Kiralama",
    "zh": "投资平台股票租赁",
    "ku": "بەکرێگرتنی پشک لە پلاتفۆرمی وەبەرهێنان",
    "ru": "Аренда акций на инвестиционной платформе"
  },
  "الخطة الفضية": {
    "en": "Silver Plan",
    "ar": "الخطة الفضية",
    "fr": "Plan Argent",
    "tr": "Gümüş Plan",
    "zh": "白银计划",
    "ku": "پلانی زیو",
    "ru": "Серебряный план"
  },
  "الخطة الذهبية": {
    "en": "Gold Plan",
    "ar": "الخطة الذهبية",
    "fr": "Plan Or",
    "tr": "Altın Plan",
    "zh": "黄金计划",
    "ku": "پلانی ئاڵتوون",
    "ru": "Золотой план"
  },
  "صندوق النمو الفضي": {
    "en": "Silver Growth Fund",
    "ar": "صندوق النمو الفضي",
    "fr": "Fonds de croissance Silver",
    "tr": "Gümüş Büyüme Fonu",
    "zh": "白银增长基金",
    "ku": "سندوقی گەشەی زیو",
    "ru": "Серебряный фонд роста"
  },
  "صندوق الثروة الذهبي": {
    "en": "Gold Wealth Fund",
    "ar": "صندوق الثروة الذهبي",
    "fr": "Fonds de richesse Gold",
    "tr": "Altın Servet Fonu",
    "zh": "黄金财富基金",
    "ku": "سندوقی سامانی ئاڵتوون",
    "ru": "Золотой фонд благосостояния"
  },
  "الصندوق السيادي البلاتيني": {
    "en": "Platinum Sovereign Fund",
    "ar": "الصندوق السيادي البلاتيني",
    "fr": "Fonds souverain Platinum",
    "tr": "Platin Egemen Fonu",
    "zh": "铂金主权基金",
    "ku": "سندوقی سەروەری پلاتین",
    "ru": "Платиновый суверенный фонд"
  },
  "السيادة المالية في عصر السرعة": {
    "en": "Financial Sovereignty in the Age of Speed",
    "ar": "السيادة المالية في عصر السرعة",
    "fr": "Souveraineté financière à l'ère de la vitesse",
    "tr": "Hız Çağında Finansal Egemenlik",
    "zh": "速度时代的金融主权",
    "ku": "سەروەری دارایی لە سەردەمی خێراییدا",
    "ru": "Финансовый суверенитет в эпоху скорости"
  },
  "بوابة FastPay Network لإدارة الأصول والتداول الفوري وحماية الثروات الرقمية بأعلى معايير الأمان العالمية.": {
    "en": "FastPay Network's gateway for asset management, instant trading, and digital wealth protection with the highest global security standards.",
    "ar": "بوابة FastPay Network لإدارة الأصول والتداول الفوري وحماية الثروات الرقمية بأعلى معايير الأمان العالمية.",
    "fr": "La passerelle de FastPay Network pour la gestion d'actifs, le trading instantané et la protection du patrimoine numérique avec les normes de sécurité mondiales les plus élevées.",
    "tr": "FastPay Network'ün varlık yönetimi, anında ticaret ve dijital servet koruması için en yüksek küresel güvenlik standartlarına sahip geçidi.",
    "zh": "FastPay Network 的资产管理、即时交易和数字财富保护网关，符合全球最高安全标准。",
    "ku": "دەروازەی تۆڕی FastPay بۆ بەڕێوەبردنی سەرمایە، بازرگانی خێرا، و پاراستنی سامانی دیجیتاڵی بە بەرزترین ستانداردەکانی ئاسایشی جیهانی.",
    "ru": "Шлюз FastPay Network для управления активами, мгновенной торговли и защиты цифрового богатства с высочайшими мировыми стандартами безопасности."
  },
  "FastPay Network هي المعيار العالمي للمدفوعات الرقمية عالية الأمان، نجمع بين التكنولوجيا المتطورة والخدمات المالية المتميزة.": {
    "en": "FastPay Network is the global standard for highly secure digital payments, combining advanced technology with outstanding financial services.",
    "ar": "FastPay Network هي المعيار العالمي للمدفوعات الرقمية عالية الأمان، نجمع بين التكنولوجيا المتطورة والخدمات المالية المتميزة.",
    "fr": "FastPay Network est la norme mondiale pour les paiements numériques hautement sécurisés, combinant une technologie de pointe avec des services financiers exceptionnels.",
    "tr": "FastPay Network, ileri teknolojiyi üstün finansal hizmetlerle birleştiren, yüksek güvenlikli dijital ödemeler için küresel bir standarttır.",
    "zh": "FastPay Network 是高度安全的数字支付全球标准，结合了先进技术和卓越의 金融服务。",
    "ku": "تۆڕی FastPay ستانداردی جیهانییە بۆ پارەدانە دیجیتاڵییە زۆر پارێزراوەکان، تەکنەلۆژیای پێشکەوتوو لەگەڵ خزمەتگوزارییە داراییە نایابەکان کۆدەکاتەوە.",
    "ru": "FastPay Network - это мировой стандарт для высокозащищенных цифровых платежей, сочетающий передовые технологии с выдающимися финансовыми услугами."
  },
  "الرياض، المملكة العربية السعودية": {
    "en": "Riyadh, Saudi Arabia",
    "ar": "الرياض، المملكة العربية السعودية",
    "fr": "Riyad, Arabie Saoudite",
    "tr": "Riyad, Suudi Arabistan",
    "zh": "沙特阿拉伯利雅得",
    "ku": "ڕیاز، عەرەبستانی سعوودی",
    "ru": "Эр-Рияд, Саудовская Аравия"
  },
  "تمويل الرواتب الذكي": {
    "en": "Smart Salary Financing",
    "ar": "تمويل الرواتب الذكي",
    "fr": "Financement intelligent des salaires",
    "tr": "Akıllı Maaş Finansmanı",
    "zh": "智能薪资融资",
    "ku": "پارەدانەوەی مووچەی زیرەک",
    "ru": "Умное финансирование зарплаты"
  },
  "أول منصة تتيح تمويل الرواتب المسبق للموظفين بضمانات بنكية رقمية وسرعة في الإيداع في كل انحاء العالم.": {
    "en": "The first platform that allows advance salary financing for employees with digital bank guarantees and fast deposits worldwide.",
    "ar": "أول منصة تتيح تمويل الرواتب المسبق للموظفين بضمانات بنكية رقمية وسرعة في الإيداع في كل انحاء العالم.",
    "fr": "La première plateforme qui permet le financement anticipé des salaires pour les employés avec des garanties bancaires numériques et des dépôts rapides dans le monde entier.",
    "tr": "Çalışanlar için dijital banka garantileri ve dünya genelinde hızlı para yatırma imkanı sunan ilk platform.",
    "zh": "首个允许员工通过数字银行担保和全球快速存款进行预支薪资融资的平台。",
    "ku": "یەکەم پلاتفۆرم کە ڕێگە بە پارەدانەوەی مووچەی پێشوەختە دەدات بۆ کارمەندان بە گەرەنتی بانکی دیجیتاڵی و خێرایی لە دانانی پارە لە هەموو جیهاندا.",
    "ru": "Первая платформа, позволяющая авансовое финансирование зарплаты для сотрудников с цифровыми банковскими гарантиями и быстрыми депозитами по всему миру."
  },
  "محرك التداول الاحترافي": {
    "en": "Professional Trading Engine",
    "ar": "محرك التداول الاحترافي",
    "fr": "Moteur de trading professionnel",
    "tr": "Profesyonel Ticaret Motoru",
    "zh": "专业交易引擎",
    "ku": "بزوێنەری بازرگانی پیشەیی",
    "ru": "Профессиональный торговый движок"
  },
  "لا تنتظر السوق، بل كن أنت المحرك. منصتنا توفر لك وصولاً مباشراً للسيولة العالمية مع أدوات تحليل ذكية ومخططات بيانية فورية.": {
    "en": "Don't wait for the market, be the driver. Our platform provides you with direct access to global liquidity with smart analysis tools and instant charts.",
    "ar": "لا تنتظر السوق، بل كن أنت المحرك. منصتنا توفر لك وصولاً مباشراً للسيولة العالمية مع أدوات تحليل ذكية ومخططات بيانية فورية.",
    "fr": "N'attendez pas le marché, soyez le moteur. Notre plateforme vous offre un accès direct à la liquidité mondiale avec des outils d'analyse intelligents et des graphiques instantanés.",
    "tr": "Piyasayı beklemeyin, sürücü olun. Platformumuz akıllı analiz araçları ve anlık grafiklerle küresel likiditeye doğrudan erişim sağlar.",
    "zh": "不要等待市场，成为驱动者。我们的平台为您提供全球流动性的直接访问，以及智能分析工具和即时图表。",
    "ku": "چاوەڕێی بازاڕ مەکە، بەڵکو خۆت بزوێنەر بە. پلاتفۆرمەکەمان دەستڕاگەیشتنی ڕاستەوخۆت پێدەدات بە شلەیی جیهانی لەگەڵ ئامرازەکانی شیکردنەوەی زیرەک و نەخشەی خێرا.",
    "ru": "Не ждите рынка, будьте двигателем. Наша платформа предоставляет вам прямой доступ к глобальной ликвидности с интеллектуальными инструментами анализа и мгновенными графиками."
  },
  "القرعة الشهرية: حلم الفخامة": {
    "en": "Monthly Raffle: Dream of Luxury",
    "ar": "القرعة الشهرية: حلم الفخامة",
    "fr": "Tombola mensuelle : Rêve de luxe",
    "tr": "Aylık Çekiliş: Lüks Hayali",
    "zh": "每月抽奖：奢华梦想",
    "ku": "تیروپشکی مانگانە: خەونی لوکس",
    "ru": "Ежемесячная лотерея: Мечта о роскоши"
  },
  "شارك الآن في سحب FastPay الشهري للفوز بسيارة رياضية خارقة أحدث طراز، أو رحلة عمرة VIP.": {
    "en": "Participate now in the FastPay monthly draw to win a brand new supercar, or a VIP Umrah trip.",
    "ar": "شارك الآن في سحب FastPay الشهري للفوز بسيارة رياضية خارقة أحدث طراز، أو رحلة عمرة VIP.",
    "fr": "Participez maintenant au tirage au sort mensuel FastPay pour gagner une toute nouvelle supercar ou un voyage Omra VIP.",
    "tr": "Şimdi FastPay aylık çekilişine katılarak yepyeni bir süper araba veya VIP Umre gezisi kazanın.",
    "zh": "立即参加 FastPay 每月抽奖，赢取一辆全新的超级跑车或一次 VIP 副朝之旅。",
    "ku": "ئێستا بەشداری بکە لە تیروپشکی مانگانەی FastPay بۆ بردنەوەی ئۆتۆمبێلێکی وەرزشی نوێ، یان گەشتێکی عومرەی VIP.",
    "ru": "Участвуйте сейчас в ежемесячном розыгрыше FastPay, чтобы выиграть совершенно новый суперкар или VIP-поездку в Умру."
  },
  "جسر السيولة العالمي": {
    "en": "Global Liquidity Bridge",
    "ar": "جسر السيولة العالمي",
    "fr": "Pont de liquidité mondial",
    "tr": "Küresel Likidite Köprüsü",
    "zh": "全球流动性桥梁",
    "ku": "پرۆژەی شلەیی جیهانی",
    "ru": "Глобальный мост ликвидности"
  },
  "أرسل واستقبل الأموال فورياً عبر نظام Swift العالمي بدقة متناهية وأمان يتجاوز المعايير البنكية.": {
    "en": "Send and receive money instantly via the global Swift system with extreme precision.",
    "ar": "أرسل واستقبل الأموال فورياً عبر نظام Swift العالمي بدقة متناهية وأمان يتجاوز المعايير البنكية.",
    "fr": "Envoyez et recevez de l'argent instantanément via le système Swift mondial avec une précision extrême.",
    "tr": "Küresel Swift sistemi aracılığıyla aşırı hassasiyetle anında para gönderip alın.",
    "zh": "通过全球 Swift 系统以极高的精确度即时发送和接收资金。",
    "ku": "پارە خێرا بنێرە و وەربگرە لە ڕێگەی سیستەمی Swift ی جیهانییەوە بە وردبینییەکی زۆر.",
    "ru": "Мгновенно отправляйте и получайте деньги через глобальную систему Swift с исключительной точностью."
  },
  "بوابة دفع FastPay": {
    "en": "FastPay Checkout Gateway",
    "ar": "بوابة دفع FastPay",
    "fr": "Passerelle FastPay Checkout",
    "tr": "FastPay Checkout Ağ Geçidi",
    "zh": "FastPay 结账网关",
    "ku": "دەروازەی پارەدانی FastPay",
    "ru": "Платежный шлюз FastPay Checkout"
  },
  "حوّل متجرك الإلكتروني إلى منصة دفع عالمية رائدة بعمولات تنافسية تبدأ من 0.8%.": {
    "en": "Transform your e-store into a leading global payment platform with competitive commissions.",
    "ar": "حوّل متجرك الإلكتروني إلى منصة دفع عالمية رائدة بعمولات تنافسية تبدأ من 0.8%.",
    "fr": "Transformez votre boutique en ligne en une plateforme de paiement mondiale de premier plan avec des commissions compétitives.",
    "tr": "E-mağazanızı rekabetçi komisyonlarla lider bir küresel ödeme platformuna dönüştürün.",
    "zh": "以具有竞争力的佣金将您的电子商店转变为领先的全球支付平台。",
    "ku": "فرۆشگا ئەلیکترۆنییەکەت بگۆڕە بۆ پلاتفۆرمێکی پێشەنگی پارەدانی جیهانی بە کۆمیسیۆنی کێبڕکێکار.",
    "ru": "Превратите свой интернет-магазин в ведущую глобальную платежную платформу с конкурентоспособными комиссиями."
  },
  "الخدمات": {
    "en": "Services",
    "ar": "الخدمات",
    "fr": "Services",
    "tr": "Hizmetler",
    "zh": "服务",
    "ku": "خزمەتگوزارییەکان",
    "ru": "Услуги"
  },
  "حلول مالية متكاملة مصممة للنخبة، تجمع بين السرعة والأمان والابتكار العالمي.": {
    "en": "Integrated financial solutions designed for the elite, combining speed, security, and global innovation.",
    "ar": "حلول مالية متكاملة مصممة للنخبة، تجمع بين السرعة والأمان والابتكار العالمي.",
    "fr": "Solutions financières intégrées conçues pour l'élite, alliant vitesse, sécurité et innovation mondiale.",
    "tr": "Hız, güvenlik ve küresel inovasyonu birleştiren, elitler için tasarlanmış entegre finansal çözümler.",
    "zh": "为精英设计的综合金融解决方案，结合了速度、安全和全球创新。",
    "ku": "حلول مالية متكاملة مصممة للنخبة، تجمع بين السرعة والأمان والابتكار العالمي.",
    "ru": "Интегрированные финансовые решения, разработанные для элиты, сочетающие скорость, безопасность и мировые инновации."
  },
  "raffle_prize_type": {
    "en": "Grand Prize",
    "ar": "جائزة كبرى",
    "fr": "Grand Prix",
    "tr": "Büyük Ödül",
    "zh": "大奖",
    "ku": "خەڵاتی گەورە",
    "ru": "Главный приз"
  },
  "افتح حسابك الملكي": {
    "en": "Open Your Royal Account",
    "ar": "افتح حسابك الملكي",
    "fr": "Ouvrez votre compte Royal",
    "tr": "Kraliyet Hesabınızı Açın",
    "zh": "开设您的皇家账户",
    "ku": "هەژماری شاهانەی خۆت بکەرەوە",
    "ru": "Откройте свой королевский счет"
  },
  "تواصل مع الإدارة": {
    "en": "Contact Management",
    "ar": "تواصل مع الإدارة",
    "fr": "Contacter la direction",
    "tr": "Yönetimle İletيشيمه Geçin",
    "zh": "联系管理层",
    "ku": "پەیوەندی بە بەڕێوەبەرایەتییەوە بکە",
    "ru": "Связаться с руководством"
  },
  "روابط سريعة": {
    "en": "Quick Links",
    "ar": "روابط سريعة",
    "fr": "Liens rapides",
    "tr": "Hızlı Bağlantılar",
    "zh": "快速链接",
    "ku": "بەستەرە خێراکان",
    "ru": "Быстрые ссылки"
  },
  "تواصل معنا": {
    "en": "Contact Us",
    "ar": "تواصل معنا",
    "fr": "Contactez-nous",
    "tr": "Bize Ulaşın",
    "zh": "联系我们",
    "ku": "پەیوەندیمان پێوە بکە",
    "ru": "Связаться с нами"
  },
  "البنية التحتية المالية العالمية": {
    "en": "Global Financial Infrastructure",
    "ar": "البنية التحتية المالية العالمية",
    "fr": "Infrastructure financière mondiale",
    "tr": "Küresel Finansal Altyapı",
    "zh": "全球金融基础设施",
    "ku": "ژێرخانی دارایی جیهانی",
    "ru": "Глобальная финансовая инфраструктура"
  },
  "سياسة الخصوصية": {
    "en": "Privacy Policy",
    "ar": "سياسة الخصوصية",
    "fr": "Politique de confidentialité",
    "tr": "Gizlilik Politikası",
    "zh": "隐私政策",
    "ku": "سیاسەتی تایبەتمەندی",
    "ru": "Политика конфиденциальности"
  },
  "شروط الخدمة": {
    "en": "Terms of Service",
    "ar": "شروط الخدمة",
    "fr": "Conditions d'utilisation",
    "tr": "Hizmet Şartları",
    "zh": "服务条款",
    "ku": "مەرجەکانی خزمەتگوزاری",
    "ru": "Условия обслуживания"
  },
  "معايير الأمان": {
    "en": "Security Standards",
    "ar": "معايير الأمان",
    "fr": "Normes de sécurité",
    "tr": "Güvenlik Standartları",
    "zh": "安全标准",
    "ku": "ستانداردەکانی ئاسایش",
    "ru": "Стандарты безопасности"
  },
  "التراخيص العالمية": {
    "en": "Global Licenses",
    "ar": "التراخيص العالمية",
    "fr": "Licences mondiales",
    "tr": "Küresel Lisanslar",
    "zh": "全球执照",
    "ku": "مۆڵەتە جیهانییەکان",
    "ru": "Глобальные лицензии"
  },
  "deposit_plan1_name": {
    "en": "Silver Growth Fund",
    "ar": "صندوق النمو الفضي",
    "fr": "Fonds de croissance Silver",
    "tr": "Gümüş Büyüme Fonu",
    "zh": "白银增长基金",
    "ku": "سندوقی گەشەی زیو",
    "ru": "Серебряный фонд роста"
  },
  "deposit_plan2_name": {
    "en": "Gold Wealth Fund",
    "ar": "صندوق الثروة الذهبي",
    "fr": "Fonds de richesse Gold",
    "tr": "Altın Servet Fonu",
    "zh": "黄金财富基金",
    "ku": "سندوقی سامانی ئاڵتوون",
    "ru": "Золотой фонд благосостояния"
  },
  "deposit_plan3_name": {
    "en": "Platinum Sovereign Fund",
    "ar": "الصندوق السيادي البلاتيني",
    "fr": "Fonds souverain Platinum",
    "tr": "Platin Egemen Fonu",
    "zh": "铂金主权基金",
    "ku": "سندوقی سەروەری پلاتین",
    "ru": "Платиновый суверенный фонд"
  },
  "nav_merchant_escrow": {
    "en": "Merchant Escrow",
    "ar": "اعتمادات التاجر",
    "fr": "Escrow marchand",
    "tr": "Tüccar Emaneti",
    "zh": "商户托管",
    "ku": "ئیعتمادی بازرگان",
    "ru": "Эскроу мерчанта"
  },
  "nav_ad_exchange": {
    "en": "Ad Exchange",
    "ar": "بورصة الإعلانات",
    "fr": "Échange publicitaire",
    "tr": "Reklam Borsası",
    "zh": "广告交易",
    "ku": "بۆرسەی ڕیکلامەکان",
    "ru": "Рекламная биржа"
  },
  "nav_id_verification": {
    "en": "Identity Verification",
    "ar": "توثيق الهوية",
    "fr": "Vérification d'identité",
    "tr": "Kimlik Doğrulama",
    "zh": "身份验证",
    "ku": "سەلماندنی ناسنامە",
    "ru": "Верификация личности"
  },
  "nav_raffle_mgmt": {
    "en": "Raffle Management",
    "ar": "إدارة القرعة",
    "fr": "Gestion de la tombola",
    "tr": "Çekiliş Yönetimi",
    "zh": "抽奖管理",
    "ku": "بەڕێوەبردنی تیروپشک",
    "ru": "Управление лотереей"
  },
  "nav_site_identity": {
    "en": "Site Identity",
    "ar": "هوية الموقع",
    "fr": "Identité du site",
    "tr": "Site Kimliği",
    "zh": "网站标识",
    "ku": "ناسنامەی سایت",
    "ru": "Идентичность сайта"
  },
  "logout": {
    "en": "Logout",
    "ar": "خروج",
    "fr": "Déconnexion",
    "tr": "Çıkış Yap",
    "zh": "登出",
    "ku": "چوونە دەرەوە",
    "ru": "Выход"
  },
  "safe_logout": {
    "en": "Safe Logout",
    "ar": "خروج آمن",
    "fr": "Déconnexion sécurisée",
    "tr": "Güvenli Çıkış",
    "zh": "安全登出",
    "ku": "چوونە دەرەوەی پارێزراو",
    "ru": "Безопасный выход"
  },
  "executive_ops_mgmt": {
    "en": "Executive Operations Management v28.5 Elite",
    "ar": "إدارة العمليات السيادية v28.5 Elite",
    "fr": "Gestion des opérations exécutives v28.5 Elite",
    "tr": "Yönetici Operasyon Yönetimi v28.5 Elite",
    "zh": "执行运营管理 v28.5 精英版",
    "ku": "بەڕێوەبردنی ئۆپەراسیۆنە جێبەجێکارەکان v28.5 Elite",
    "ru": "Управление исполнительными операциями v28.5 Elite"
  },
  "nav_profile": {
    "en": "Profile",
    "ar": "الملف الشخصي",
    "fr": "Profil",
    "tr": "Profil",
    "zh": "个人资料",
    "ku": "پڕۆفایل",
    "ru": "Профиль"
  },
  "latest_transactions": {
    "en": "Latest Transactions",
    "ar": "أحدث العمليات",
    "fr": "Dernières transactions",
    "tr": "Son İşlemler",
    "zh": "最新交易",
    "ku": "دوایین مامەڵەکان",
    "ru": "Последние транзакции"
  },
  "no_transactions": {
    "en": "No transactions found",
    "ar": "لا توجد عمليات سابقة",
    "fr": "Aucune transaction trouvée",
    "tr": "İşlem bulunamadı",
    "zh": "未找到交易",
    "ku": "هیچ مامەڵەیەک نەدۆزرایەوە",
    "ru": "Транзакции не найдены"
  },
  "investment_activity": {
    "en": "Investment Activity",
    "ar": "نشاطي الاستثماري",
    "fr": "Activité d'investissement",
    "tr": "Yatırım Faaliyeti",
    "zh": "投资活动",
    "ku": "چالاکی وەبەرهێنان",
    "ru": "Инвестиционная деятельность"
  },
  "active": {
    "en": "Active",
    "ar": "نشط",
    "fr": "Actif",
    "tr": "Aktif",
    "zh": "活跃",
    "ku": "چالاک",
    "ru": "Активен"
  },
  "expected_profit": {
    "en": "Expected Profit",
    "ar": "الربح المتوقع",
    "fr": "Bénéfice attendu",
    "tr": "Beklenen Kar",
    "zh": "预期利润",
    "ku": "قازانجی چاوەڕوانکراو",
    "ru": "Ожидаемая прибыль"
  },
  "maturity_date": {
    "en": "Maturity Date",
    "ar": "تاريخ الاستحقاق",
    "fr": "Date d'échéance",
    "tr": "Vade Tarihi",
    "zh": "到期日",
    "ku": "ڕێکەوتی پێگەیشتن",
    "ru": "Дата погашения"
  },
  "no_investments": {
    "en": "No active investments",
    "ar": "لا توجد استثمارات قائمة",
    "fr": "Aucun investissement actif",
    "tr": "Aktif yatırım yok",
    "zh": "无活跃投资",
    "ku": "هیچ وەبەرهێنانێکی چالاک نییە",
    "ru": "Нет активных инвестиций"
  },
  "elite_investment_funds": {
    "en": "Elite Investment Funds",
    "ar": "صناديق استثمار النخبة",
    "fr": "Fonds d'investissement d'élite",
    "tr": "Seçkin Yatırım Fonları",
    "zh": "精英投资基金",
    "ku": "سندوقەکانی وەبەرهێنانی بژاردە",
    "ru": "Элитные инвестиционные фонды"
  },
  "invest_duration": {
    "en": "Investment Duration",
    "ar": "مدة الاستثمار",
    "fr": "Durée de l'investissement",
    "tr": "Yatırım Süresi",
    "zh": "投资期限",
    "ku": "ماوەی وەبەرهێنان",
    "ru": "Срок инвестирования"
  },
  "months": {
    "en": "Months",
    "ar": "أشهر",
    "fr": "Mois",
    "tr": "Ay",
    "zh": "月",
    "ku": "مانگ",
    "ru": "Месяцы"
  },
  "min_amount": {
    "en": "Minimum Amount",
    "ar": "الحد الأدنى",
    "fr": "Montant minimum",
    "tr": "Minimum Tutar",
    "zh": "最低金额",
    "ku": "کەمترین بڕی پارە",
    "ru": "Минимальная сумма"
  },
  "invest_now": {
    "en": "Invest Now",
    "ar": "استثمر الآن",
    "fr": "Investir maintenant",
    "tr": "Şimdi Yatırım Yap",
    "zh": "现在投资",
    "ku": "ئێستا وەبەرهێنان بکە",
    "ru": "Инвестировать сейчас"
  },
  "monthly_raffle_fastpay": {
    "en": "FastPay Monthly Raffle",
    "ar": "القرعة الشهرية FastPay",
    "fr": "Tombola mensuelle FastPay",
    "tr": "FastPay Aylık Çekilişi",
    "zh": "FastPay 每月抽奖",
    "ku": "تیروپشکی مانگانەی FastPay",
    "ru": "Ежемесячная лотерея FastPay"
  },
  "raffle_ticket_dream": {
    "en": "Your ticket to luxury. Participate in the biggest draw!",
    "ar": "تذكرتك نحو الرفاهية. شارك في السحب الأكبر!",
    "fr": "Votre billet pour le luxe. Participez au plus grand tirage !",
    "tr": "Lükse giden biletiniz. En büyük çekilişe katılın!",
    "zh": "您的豪华门票。参加最大的抽奖！",
    "ku": "تیکتەکەت بۆ لوکس. بەشداری بکە لە گەورەترین تیروپشکدا!",
    "ru": "Ваш билет в роскошь. Участвуйте в самом большом розыгрыше!"
  },
  "next_draw_date": {
    "en": "Next Draw Date",
    "ar": "موعد السحب القادم",
    "fr": "Prochaine date de tirage",
    "tr": "Sonraki Çekiliş Tarihi",
    "zh": "下一次抽奖日期",
    "ku": "ڕێکەوتی تیروپشکی داهاتوو",
    "ru": "Дата следующего розыгрыша"
  },
  "no_raffle_entries": {
    "en": "No raffle entries yet",
    "ar": "لم تشارك في أي سحب بعد",
    "fr": "Aucune participation à la tombola pour le moment",
    "tr": "Henüz çekiliş katılımı yok",
    "zh": "尚无抽奖条目",
    "ku": "هێشتا هیچ بەشدارییەکی تیروپشک نییە",
    "ru": "Пока нет заявок на участие в лотерее"
  },
  "waiting_for_next_draw": {
    "en": "Waiting for the next draw...",
    "ar": "بانتظار السحب القادم...",
    "fr": "En attente du prochain tirage...",
    "tr": "Sonراکی çekiliş bekleniyor...",
    "zh": "等待下一次抽奖...",
    "ku": "چاوەڕێی تیروپشکی داهاتوو...",
    "ru": "Ожидание следующего розыгрыша..."
  },
  "salary_pre_financing": {
    "en": "Salary Pre-Financing",
    "ar": "تمويل الرواتب المسبق",
    "fr": "Préfinancement des salaires",
    "tr": "Maaş Ön Finansmanı",
    "zh": "薪资预融资",
    "ku": "پێشوەختە دابینکردنی مووچە",
    "ru": "Предварительное финансирование зарплаты"
  },
  "salary_financing_subtitle": {
    "en": "Get instant cash liquidity guaranteed by your salary, with convenient repayment.",
    "ar": "احصل على سيولة نقدية فورية بضمان راتبك، مع تسديد مريح.",
    "fr": "Obtenez une liquidité immédiate garantie par votre salaire, avec un remboursement pratique.",
    "tr": "Maaşınızın garantisiyle, uygun geri ödeme koşullarıyla anında nakit likidite elde edin.",
    "zh": "获得由您的薪资担保的即时现金流动性，还款方便。",
    "ku": "بە گەرەنتی مووچەکەت شلەیی نەقدی خێرا بەدەست بهێنە، بە دانەوەی گونجاو.",
    "ru": "Получите мгновенную денежную ликвидность под залог вашей зарплаты с удобным погашением."
  },
  "apply_for_financing_now": {
    "en": "Apply for Financing Now",
    "ar": "اطلب التمويل الآن",
    "fr": "Demander un financement maintenant",
    "tr": "Şimdi Finansman Başvurusu Yap",
    "zh": "现在申请融资",
    "ku": "ئێستا داوای دارایی بکە",
    "ru": "Подать заявку на финансирование сейчас"
  },
  "current_requests": {
    "en": "Current Requests",
    "ar": "طلباتي الحالية",
    "fr": "Demandes actuelles",
    "tr": "Mevcut Talepler",
    "zh": "当前请求",
    "ku": "داواکارییەکانی ئێستا",
    "ru": "Текущие запросы"
  },
  "financing_value": {
    "en": "Financing Value",
    "ar": "تمويل بقيمة",
    "fr": "Valeur du financement",
    "tr": "Finansman Değeri",
    "zh": "融资价值",
    "ku": "بەهای دارایی",
    "ru": "Стоимость финансирования"
  },
  "monthly_deduction": {
    "en": "Monthly Deduction",
    "ar": "القسط الشهري",
    "fr": "Déduction mensuelle",
    "tr": "Aylık Kesinti",
    "zh": "每月扣除",
    "ku": "بڕینی مانگانە",
    "ru": "Ежемесячное удержание"
  },
  "for": {
    "en": "for",
    "ar": "لمدة",
    "fr": "pour",
    "tr": "için",
    "zh": "为期",
    "ku": "بۆ",
    "ru": "на"
  },
  "approved": {
    "en": "Approved",
    "ar": "معتمد",
    "fr": "Approuvé",
    "tr": "Onaylandı",
    "zh": "已批准",
    "ku": "پەسەندکرا",
    "ru": "Одобрено"
  },
  "pending_review": {
    "en": "Pending Review",
    "ar": "قيد المراجعة",
    "fr": "En attente de révision",
    "tr": "İnceleme Bekliyor",
    "zh": "待审查",
    "ku": "چاوەڕێی پێداچوونەوەیە",
    "ru": "Ожидает рассмотрения"
  },
  "cancelled": {
    "en": "Cancelled",
    "ar": "ملغي",
    "fr": "Annulé",
    "tr": "İptal Edildi",
    "zh": "已取消",
    "ku": "هەڵوەشایەوە",
    "ru": "Отменено"
  },
  "no_financing_requests": {
    "en": "No financing requests",
    "ar": "لا يوجد لديك طلبات تمويل",
    "fr": "Aucune demande de financement",
    "tr": "Finansman talebi yok",
    "zh": "无融资请求",
    "ku": "هیچ داواکارییەکی دارایی نییە",
    "ru": "Нет запросов на финансирование"
  },
  "profile_settings": {
    "en": "Profile Settings",
    "ar": "إعدادات الملف الشخصي",
    "fr": "Paramètres du profil",
    "tr": "Profil Ayarları",
    "zh": "个人资料设置",
    "ku": "ڕێکخستنەکانی پڕۆفایل",
    "ru": "Настройки профиля"
  },
  "account_data": {
    "en": "Account Data",
    "ar": "بيانات الحساب",
    "fr": "Données du compte",
    "tr": "Hesap Verileri",
    "zh": "账户数据",
    "ku": "داتاکانی هەژمار",
    "ru": "Данные аккаунта"
  },
  "linked_cards": {
    "en": "Linked Cards",
    "ar": "البطاقات المرتبطة",
    "fr": "Cartes liées",
    "tr": "Bağlı Kartlar",
    "zh": "关联卡",
    "ku": "کارتە بەستراوەکان",
    "ru": "Привязанные карты"
  },
  "add_new_card": {
    "en": "Add New Card",
    "ar": "ربط بطاقة جديدة",
    "fr": "Ajouter une nouvelle carte",
    "tr": "Yeni Kart Ekle",
    "zh": "添加新卡",
    "ku": "کارتێکی نوێ زیاد بکە",
    "ru": "Добавить новую карту"
  },
  "change_password": {
    "en": "Change Password",
    "ar": "تغيير كلمة المرور",
    "fr": "Changer le mot de passe",
    "tr": "Şifre Değiştir",
    "zh": "更改密码",
    "ku": "گۆڕینی وشەی نهێنی",
    "ru": "Сменить пароль"
  },
  "current_password": {
    "en": "Current Password",
    "ar": "كلمة المرور الحالية",
    "fr": "Mot de passe actuel",
    "tr": "Mevcut Şifre",
    "zh": "当前密码",
    "ku": "وشەی نهێنی ئێستا",
    "ru": "Текущий пароль"
  },
  "new_password": {
    "en": "New Password",
    "ar": "الجديدة",
    "fr": "Nouveau mot de passe",
    "tr": "Yeni Şifre",
    "zh": "新密码",
    "ku": "نوێ",
    "ru": "Новый пароль"
  },
  "confirm_new_password": {
    "en": "Confirm New Password",
    "ar": "تأكيد الجديدة",
    "fr": "Confirmer le nouveau mot de passe",
    "tr": "Yeni Şifreyi Onayla",
    "zh": "确认新密码",
    "ku": "دووپاتکردنەوەی نوێ",
    "ru": "Подтвердите новый пароль"
  },
  "password_updated_success": {
    "en": "Password updated successfully",
    "ar": "تم تحديث كلمة المرور بنجاح",
    "fr": "Mot de passe mis à jour avec succès",
    "tr": "Şifre başarıyla güncellendi",
    "zh": "密码更新成功",
    "ku": "وشەی نهێنی بە سەرکەوتوویی نوێکرایەوە",
    "ru": "Пароль успешно обновлен"
  },
  "update_security": {
    "en": "Update Security",
    "ar": "تحديث الأمان",
    "fr": "Mettre à jour la sécurité",
    "tr": "Güvenliği Güncelle",
    "zh": "更新安全设置",
    "ku": "نوێکردنەوەی ئاسایش",
    "ru": "Обновить безопасность"
  },
  "cannot_complete_operation": {
    "en": "Cannot complete operation",
    "ar": "لا يمكنك اتمام العملية",
    "fr": "Impossible de terminer l'opération",
    "tr": "İşlem tamamlanamıyor",
    "zh": "无法完成操作",
    "ku": "ناتوانیت کردارەکە تەواو بکەیت",
    "ru": "Не удается завершить операцию"
  },
  "add_card_first": {
    "en": "Please add your card first to be able to perform fast bank Swift withdrawals.",
    "ar": "قم بإضافة بطاقتك اولا لتتمكن من إجراء عمليات السحب البنكي السريع.",
    "fr": "Veuillez d'abord ajouter votre carte pour pouvoir effectuer des retraits Swift bancaires rapides.",
    "tr": "Hızlı banka Swift çekimleri yapabilmek için lütfen önce kartınızı ekleyin.",
    "zh": "请先添加您的卡，以便能够进行快速银行 Swift 提款。",
    "ku": "تکایە سەرەتا کارتەکەت زیاد بکە بۆ ئەوەی بتوانیت کشانەوەی خێرای بانکی Swift ئەنجام بدەیت.",
    "ru": "Пожалуйста, сначала добавьте свою карту, чтобы иметь возможность совершать быстрые банковские переводы Swift."
  },
  "cancel_operation": {
    "en": "Cancel Operation",
    "ar": "إلغاء العملية",
    "fr": "Annuler l'opération",
    "tr": "İşlemi İptal Et",
    "zh": "取消操作",
    "ku": "هەڵوەشاندنەوەی کردارەکە",
    "ru": "Отменить операцию"
  },
  "swift_withdrawal_request": {
    "en": "Swift Bank Withdrawal Request",
    "ar": "طلب سحب Swift بنكي",
    "fr": "Demande de retrait bancaire Swift",
    "tr": "Swift Banka Çekme Talebi",
    "zh": "Swift 银行提款请求",
    "ku": "داواکاری کشانەوەی بانکی Swift",
    "ru": "Запрос на банковский перевод Swift"
  },
  "bank_name": {
    "en": "Bank Name",
    "ar": "اسم البنك",
    "fr": "Nom de la banque",
    "tr": "Banka Adı",
    "zh": "银行名称",
    "ku": "ناوی بانک",
    "ru": "Название банка"
  },
  "iban": {
    "en": "IBAN",
    "ar": "رقم الآيبان",
    "fr": "IBAN",
    "tr": "IBAN",
    "zh": "IBAN",
    "ku": "ژمارەی ئایبان",
    "ru": "IBAN"
  },
  "swift_code": {
    "en": "SWIFT Code",
    "ar": "كود السويفت",
    "fr": "Code SWIFT",
    "tr": "SWIFT Kodu",
    "zh": "SWIFT 代码",
    "ku": "کۆدی سوێفت",
    "ru": "SWIFT-код"
  },
  "amount_usd": {
    "en": "Amount ($)",
    "ar": "المبلغ ($)",
    "fr": "Montant ($)",
    "tr": "Tutar ($)",
    "zh": "金额 ($)",
    "ku": "بڕی پارە ($)",
    "ru": "Сумма ($)"
  },
  "submit_withdrawal_request": {
    "en": "Submit Withdrawal Request",
    "ar": "تقديم طلب السحب",
    "fr": "Soumettre la demande de retrait",
    "tr": "Çekme Talebi Gönder",
    "zh": "提交提款请求",
    "ku": "ناردنی داواکاری کشانەوە",
    "ru": "Отправить запрос на вывод средств"
  },
  "cancel": {
    "en": "Cancel",
    "ar": "إلغاء",
    "fr": "Annuler",
    "tr": "İptal",
    "zh": "取消",
    "ku": "پاشگەزبوونەوە",
    "ru": "Отмена"
  },
  "salary_pre_financing_request": {
    "en": "Salary Pre-Financing Request",
    "ar": "طلب تمويل راتب مسبق",
    "fr": "Demande de préfinancement de salaire",
    "tr": "Maaş Ön Finansman Talebi",
    "zh": "薪资预融资请求",
    "ku": "داواکاری پێشوەختە دابینکردنی مووچە",
    "ru": "Запрос на предварительное финансирование зарплаты"
  },
  "requested_amount": {
    "en": "Requested Amount ($)",
    "ar": "المبلغ المطلوب ($)",
    "fr": "Montant demandé ($)",
    "tr": "Talep Edilen Tutar ($)",
    "zh": "请求金额 ($)",
    "ku": "بڕی داواکراو ($)",
    "ru": "Запрошенная сумма ($)"
  },
  "repayment_duration_months": {
    "en": "Repayment Duration (Months)",
    "ar": "مدة السداد (أشهر)",
    "fr": "Durée de remboursement (mois)",
    "tr": "Geri Ödeme Süresi (Ay)",
    "zh": "还款期限（月）",
    "ku": "ماوەی دانەوە (مانگ)",
    "ru": "Срок погашения (месяцы)"
  },
  "submit_request_for_review": {
    "en": "Submit Request for Review",
    "ar": "تقديم الطلب للمراجعة",
    "fr": "Soumettre la demande pour révision",
    "tr": "İnceleme İçin Talep Gönder",
    "zh": "提交审查请求",
    "ku": "ناردنی داواکاری بۆ پێداچوونەوە",
    "ru": "Отправить запрос на рассмотрение"
  },
  "amount_to_invest": {
    "en": "Amount to Invest ($)",
    "ar": "المبلغ المراد استثماره ($)",
    "fr": "Montant à investir ($)",
    "tr": "Yatırım Yapılacak Tutar ($)",
    "zh": "投资金额 ($)",
    "ku": "بڕی پارە بۆ وەبەرهێنان ($)",
    "ru": "Сумма для инвестирования ($)"
  },
  "expected_return_after": {
    "en": "Expected return after",
    "ar": "العائد المتوقع بعد",
    "fr": "Rendement attendu après",
    "tr": "Şu süreden sonra beklenen getiri:",
    "zh": "预期回报在",
    "ku": "قازانجی چاوەڕوانکراو دوای",
    "ru": "Ожидаемая доходность через"
  },
  "confirm_start_investment": {
    "en": "Confirm Start Investment",
    "ar": "تأكيد بدء الاستثمار",
    "fr": "Confirmer le début de l'investissement",
    "tr": "Yatırımı Başlatmayı Onayla",
    "zh": "确认开始投资",
    "ku": "دووپاتکردنەوەی دەستپێکردنی وەبەرهێنان",
    "ru": "Подтвердить начало инвестирования"
  },
  "recipient_username": {
    "en": "Recipient Username",
    "ar": "اسم المستخدم المستلم",
    "fr": "Nom d'utilisateur du destinataire",
    "tr": "Alıcı Kullanıcı Adı",
    "zh": "收款人用户名",
    "ku": "ناوی بەکارهێنەری وەرگر",
    "ru": "Имя пользователя получателя"
  },
  "amount_to_transfer": {
    "en": "Amount to Transfer ($)",
    "ar": "المبلغ المراد تحويله ($)",
    "fr": "Montant à transférer ($)",
    "tr": "Transfer Edilecek Tutar ($)",
    "zh": "转账金额 ($)",
    "ku": "بڕی پارە بۆ گواستنەوە ($)",
    "ru": "Сумма для перевода ($)"
  },
  "confirm_transfer": {
    "en": "Confirm and Proceed with Transfer",
    "ar": "تأكيد ومباشرة التحويل",
    "fr": "Confirmer et procéder au transfert",
    "tr": "Onayla ve Transferi Gerçekleştir",
    "zh": "确认并继续转账",
    "ku": "دووپاتکردنەوە و دەستپێکردنی گواستنەوە",
    "ru": "Подтвердить и продолжить перевод"
  },
  "transfer_successful": {
    "en": "Transfer Successful",
    "ar": "تم التحويل بنجاح",
    "fr": "Transfert réussi",
    "tr": "Transfer Başarılı",
    "zh": "转账成功",
    "ku": "گواستنەوە بە سەرکەوتوویی ئەنجامدرا",
    "ru": "Перевод выполнен успешно"
  },
  "redeem_coupon_balance": {
    "en": "Redeem Coupon Balance",
    "ar": "شحن رصيد الكوبون",
    "fr": "Utiliser le solde du coupon",
    "tr": "Kupon Bakiyesini Kullan",
    "zh": "兑换优惠券余额",
    "ku": "بەکارهێنانی باڵانسی کۆپۆن",
    "ru": "Погасить баланс купона"
  },
  "enter_12_digit_code": {
    "en": "Enter the 12-digit recharge code",
    "ar": "أدخل كود الشحن المكون من 12 رمزاً",
    "fr": "Entrez le code de recharge à 12 chiffres",
    "tr": "12 haneli yükleme kodunu girin",
    "zh": "输入 12 位充值码",
    "ku": "کۆدی بارگاویکردنەوەی ١٢ ژمارەیی داخڵ بکە",
    "ru": "Введите 12-значный код пополнения"
  },
  "activate_recharge_instantly": {
    "en": "Activate and Recharge Instantly",
    "ar": "تفعيل وشحن الرصيد فوراً",
    "fr": "Activer et recharger instantanément",
    "tr": "Anında Etkinleştir ve Yükle",
    "zh": "立即激活并充值",
    "ku": "چالاککردن و بارگاویکردنەوەی باڵانس دەستبەجێ",
    "ru": "Активировать и пополнить мгновенно"
  },
  "link_global_bank_card": {
    "en": "Link Global Bank Card",
    "ar": "ربط بطاقة بنكية عالمية",
    "fr": "Lier une carte bancaire mondiale",
    "tr": "Küresel Banka Kartını Bağلا",
    "zh": "关联全球银行卡",
    "ku": "بەستنەوەی کارتی بانکی جیهانی",
    "ru": "Привязать международную банковскую карту"
  },
  "card_holder_name": {
    "en": "Card Holder Name",
    "ar": "اسم حامل البطاقة",
    "fr": "Nom du titulaire de la carte",
    "tr": "Kart Sahibi Adı",
    "zh": "持卡人姓名",
    "ku": "ناوی خاوەنی کارت",
    "ru": "Имя владельца карты"
  },
  "card_number_16_digits": {
    "en": "Card Number (16 digits)",
    "ar": "رقم البطاقة (16 رقم)",
    "fr": "Numéro de carte (16 chiffres)",
    "tr": "Kart Numarası (16 hane)",
    "zh": "卡号（16 位数字）",
    "ku": "ژمارەی کارت (١٦ ژمارە)",
    "ru": "Номер карты (16 цифр)"
  },
  "confirm_encrypted_link": {
    "en": "Confirm Encrypted Link",
    "ar": "تأكيد الربط المشفر",
    "fr": "Confirmer le lien crypté",
    "tr": "Şifreli Bağlantıyı Onayla",
    "zh": "确认加密关联",
    "ku": "دووپاتکردنەوەی بەستنەوەی کۆدکراو",
    "ru": "Подтвердить зашиفрованное соединение"
  },
  "card_linked_successfully": {
    "en": "Card Linked Successfully",
    "ar": "تم ربط البطاقة",
    "fr": "Carte liée avec succès",
    "tr": "Kart Başarıyla Bağlandı",
    "zh": "卡关联成功",
    "ku": "کارتەکە بە سەرکەوتوویی بەستراوە",
    "ru": "Карта успешно привязана"
  },
  "swift_withdrawal_activated": {
    "en": "Swift withdrawal request activated successfully",
    "ar": "تم تفعيل طلب سحب Swift بنجاح",
    "fr": "Demande de retrait Swift activée avec succès",
    "tr": "Swift çekme talebi başarıyla etkinleştirildi",
    "zh": "Swift 提款请求已成功激活",
    "ku": "داواکاری کشانەوەی Swift بە سەرکەوتوویی چالاککرا",
    "ru": "Запрос на вывод Swift успешно активирован"
  },
  "available_sovereign_balance": {
    "en": "Available Sovereign Balance",
    "ar": "الرصيد السيادي المتوفر",
    "fr": "Solde souverain disponible",
    "tr": "Mevcut Egemen Bakiye",
    "zh": "可用主权余额",
    "ku": "باڵانسی سەروەری بەردەست",
    "ru": "Доступный суверенный баланс"
  },
  "instant_transfer": {
    "en": "Instant Transfer",
    "ar": "تحويل مالي فوري",
    "fr": "Transfert instantané",
    "tr": "Anında Transfer",
    "zh": "即时转账",
    "ku": "گواستنەوەی دەستبەجێ",
    "ru": "Мгновенный перевод"
  },
  "deposit_coupon": {
    "en": "Deposit via Coupon",
    "ar": "إيداع بكوبون شحن",
    "fr": "Dépôt par coupon",
    "tr": "Kuponla Para Yatır",
    "zh": "通过优惠券存款",
    "ku": "پارەدان بە کوپۆنی بارگاویکردنەوە",
    "ru": "Депозит через купон"
  },
  "executive_ops_center": {
    "en": "Executive Operations Center",
    "ar": "مركز العمليات التنفيذي",
    "fr": "Centre d'opérations exécutives",
    "tr": "Yönetici Operasyon Merkezi",
    "zh": "执行运营中心",
    "ku": "سەنتەری ئۆپەراسیۆنە جێبەجێکارەکان",
    "ru": "Центр исполнительных операций"
  },
  "syncing": {
    "en": "Syncing...",
    "ar": "جاري المزامنة...",
    "fr": "Synchronisation...",
    "tr": "Senkronize ediliyor...",
    "zh": "正在同步...",
    "ku": "هاوکاتکردن...",
    "ru": "Синхронизация..."
  },
  "manual_sync": {
    "en": "Manual Sync with Supabase 🔄",
    "ar": "مزامنة يدوية مع Supabase 🔄",
    "fr": "Synchronisation manuelle avec Supabase 🔄",
    "tr": "Supabase ile Manuel Senkronizasyon 🔄",
    "zh": "与 Supabase 手动同步 🔄",
    "ku": "هاوکاتکردنی دەستی لەگەڵ Supabase 🔄",
    "ru": "Ручная синхронизация с Supabase 🔄"
  },
  "total_members": {
    "en": "Total Members",
    "ar": "إجمالي الأعضاء",
    "fr": "Total des membres",
    "tr": "Toplam Üyeler",
    "zh": "会员总数",
    "ku": "کۆی ئەندامان",
    "ru": "Всего участников"
  },
  "pending_transfers": {
    "en": "Pending Transfers",
    "ar": "حوالات معلقة",
    "fr": "Transferts en attente",
    "tr": "Bekleyen Transferler",
    "zh": "待处理转账",
    "ku": "گواستنەوە هەڵپەسێردراوەکان",
    "ru": "Ожидающие переводы"
  },
  "open_deals": {
    "en": "Open Deals",
    "ar": "صفقات مفتوحة",
    "fr": "Offres ouvertes",
    "tr": "Açık Anlaşmalar",
    "zh": "未结交易",
    "ku": "گرێبەستە کراوەکان",
    "ru": "Открытые сделки"
  },
  "system_liquidity": {
    "en": "System Liquidity",
    "ar": "سيولة النظام",
    "fr": "Liquidité du système",
    "tr": "Sistem Likiditesi",
    "zh": "系统流动性",
    "ku": "نەختینەی سیستم",
    "ru": "Ликвидность системы"
  },
  "elite_accounts_mgmt": {
    "en": "Elite Accounts Management",
    "ar": "إدارة حسابات النخبة",
    "fr": "Gestion des comptes d'élite",
    "tr": "Seçkin Hesap Yönetimi",
    "zh": "精英账户管理",
    "ku": "بەڕێوەبردنی هەژمارە بژاردەکان",
    "ru": "Управление элитными аккаунтами"
  },
  "add_member": {
    "en": "Add Member",
    "ar": "إضافة عضو",
    "fr": "Ajouter un membre",
    "tr": "Üye Ekle",
    "zh": "添加会员",
    "ku": "زیادکردنی ئەندام",
    "ru": "Добавить участника"
  },
  "search_placeholder": {
    "en": "Search...",
    "ar": "بحث...",
    "fr": "Rechercher...",
    "tr": "Ara...",
    "zh": "搜索...",
    "ku": "گەڕان...",
    "ru": "Поиск..."
  },
  "member": {
    "en": "Member",
    "ar": "العضو",
    "fr": "Membre",
    "tr": "Üye",
    "zh": "会员",
    "ku": "ئەندام",
    "ru": "Участник"
  },
  "balance": {
    "en": "Balance",
    "ar": "الرصيد",
    "fr": "Solde",
    "tr": "Bakiye",
    "zh": "余额",
    "ku": "باڵانس",
    "ru": "Баланс"
  },
  "rank": {
    "en": "Rank",
    "ar": "الرتبة",
    "fr": "Rang",
    "tr": "Rütbe",
    "zh": "排名",
    "ku": "پلە",
    "ru": "Ранг"
  },
  "status": {
    "en": "Status",
    "ar": "الحالة",
    "fr": "Statut",
    "tr": "Durum",
    "zh": "状态",
    "ku": "بارودۆخ",
    "ru": "Статус"
  },
  "advanced_control": {
    "en": "Advanced Control",
    "ar": "التحكم المتقدم",
    "fr": "Contrôle avancé",
    "tr": "Gelişmiş Kontrol",
    "zh": "高级控制",
    "ku": "کۆنتڕۆڵی پێشکەوتوو",
    "ru": "Расширенное управление"
  },
  "verified": {
    "en": "Verified",
    "ar": "موثق",
    "fr": "Vérifié",
    "tr": "Doğrulandı",
    "zh": "已验证",
    "ku": "سەلمێنراو",
    "ru": "Верифицирован"
  },
  "suspended": {
    "en": "Suspended",
    "ar": "معلق",
    "fr": "Suspendu",
    "tr": "Askıya Alındı",
    "zh": "已暂停",
    "ku": "هەڵپەسێردراو",
    "ru": "Приостановлен"
  },
  "recharge": {
    "en": "Recharge",
    "ar": "شحن",
    "fr": "Recharger",
    "tr": "Yükleme",
    "zh": "充值",
    "ku": "بارگاویکردنەوە",
    "ru": "Пополнить"
  },
  "reset": {
    "en": "Reset",
    "ar": "تصفير",
    "fr": "Réinitialiser",
    "tr": "Sıfırla",
    "zh": "重置",
    "ku": "سفرکردنەوە",
    "ru": "Сбросить"
  },
  "suspend": {
    "en": "Suspend",
    "ar": "تعليق",
    "fr": "Suspendre",
    "tr": "Askıya Al",
    "zh": "暂停",
    "ku": "هەڵپەساردن",
    "ru": "Приостановить"
  },
  "activate": {
    "en": "Activate",
    "ar": "تفعيل",
    "fr": "Activer",
    "tr": "Etkinleştir",
    "zh": "激活",
    "ku": "چالاککردن",
    "ru": "Активировать"
  },
  "password": {
    "en": "Password",
    "ar": "كلمة المرور",
    "fr": "Mot de passe",
    "tr": "Şifre",
    "zh": "密码",
    "ku": "وشەی نهێنی",
    "ru": "Пароль"
  },
  "delete": {
    "en": "Delete",
    "ar": "حذف",
    "fr": "Supprimer",
    "tr": "Sil",
    "zh": "删除",
    "ku": "سڕینەوە",
    "ru": "Удалить"
  },
  "add_new_member_to_system": {
    "en": "Add New Member to System",
    "ar": "إضافة عضو جديد للنظام",
    "fr": "Ajouter un nouveau membre au système",
    "tr": "Sisteme Yeni Üye Ekle",
    "zh": "向系统添加新会员",
    "ku": "زیادکردنی ئەندامی نوێ بۆ سیستم",
    "ru": "Добавить нового участника в систему"
  },
  "temporary_password_optional": {
    "en": "Temporary Password (Optional)",
    "ar": "كلمة مرور مؤقتة (اختياري)",
    "fr": "Mot de passe temporaire (facultatif)",
    "tr": "Geçici Şifre (İsteğe Bağlı)",
    "zh": "临时密码（可选）",
    "ku": "وشەی نهێنی کاتی (ئارەزوومەندانە)",
    "ru": "Временный пароль (необязательно)"
  },
  "select_member_rank": {
    "en": "Select Member Rank",
    "ar": "تحديد رتبة العضو",
    "fr": "Sélectionner le rang du membre",
    "tr": "Üye Rütbesini Seç",
    "zh": "选择会员等级",
    "ku": "دیاریکردنی پلەی ئەندام",
    "ru": "Выберите ранг участника"
  },
  "opening_balance": {
    "en": "Opening Balance ($)",
    "ar": "الرصيد الافتتاحي ($)",
    "fr": "Solde d'ouverture ($)",
    "tr": "Açılış Bakiyesi ($)",
    "zh": "开户余额 ($)",
    "ku": "باڵانسی دەستپێک ($)",
    "ru": "Начальный баланс ($)"
  },
  "save_account": {
    "en": "Save Account",
    "ar": "حفظ الحساب",
    "fr": "Enregistrer le compte",
    "tr": "Hesabı Kaydet",
    "zh": "保存账户",
    "ku": "پاشەکەوتکردنی هەژمار",
    "ru": "Сохранить аккаунт"
  },
  "recharge_account_balance": {
    "en": "Recharge Account Balance",
    "ar": "شحن رصيد الحساب",
    "fr": "Recharger le solde du compte",
    "tr": "Hesap Bakiyesini Yükle",
    "zh": "充值账户余额",
    "ku": "بارگاویکردنەوەی باڵانسی هەژمار",
    "ru": "Пополнить баланс аккаунта"
  },
  "reset_account_balance": {
    "en": "Reset Account Balance",
    "ar": "تصفير رصيد الحساب",
    "fr": "Réinitialiser le solde du compte",
    "tr": "Hesap Bakiyesini Sıفırla",
    "zh": "重置账户余额",
    "ku": "سفرکردنەوەی باڵانسی هەژمار",
    "ru": "Сбросить баланс аккаунта"
  },
  "suspend_account": {
    "en": "Suspend Account",
    "ar": "تعليق الحساب",
    "fr": "Suspendre le compte",
    "tr": "Hesabı Askıya Al",
    "zh": "暂停账户",
    "ku": "هەڵپەساردنی هەژمار",
    "ru": "Приостановить аккаунт"
  },
  "activate_account": {
    "en": "Activate Account",
    "ar": "تفعيل الحساب",
    "fr": "Activer le compte",
    "tr": "Hesabı Etkinleştir",
    "zh": "激活账户",
    "ku": "چالاککردنی هەژمار",
    "ru": "Активировать аккаунт"
  },
  "delete_account_permanently": {
    "en": "Delete Account Permanently",
    "ar": "حذف الحساب نهائياً",
    "fr": "Supprimer le compte définitivement",
    "tr": "Hesabı Kalıcı Olarak Sil",
    "zh": "永久删除账户",
    "ku": "سڕینەوەی هەژمار بە هەمیشەیی",
    "ru": "Удалить аккаунт навсегда"
  },
  "for_member": {
    "en": "For Member:",
    "ar": "للعضو:",
    "fr": "Pour le membre :",
    "tr": "Üye İçin:",
    "zh": "会员：",
    "ku": "بۆ ئەندام:",
    "ru": "Для участника:"
  },
  "enter_amount_recharge": {
    "en": "Enter amount (positive to add, negative to deduct)",
    "ar": "أدخل المبلغ (موجب للإضافة، سالب للخصم)",
    "fr": "Entrez le montant (positif pour ajouter, négatif pour déduire)",
    "tr": "Tutarı girin (eklemek için pozitif, düşmek için negatif)",
    "zh": "输入金额（正数为添加，负数为扣除）",
    "ku": "بڕەکە بنووسە (پۆزەتیڤ بۆ زیادکردن، نێگەتیڤ بۆ کەمکردنەوە)",
    "ru": "Введите сумму (положительную для добавления, отрицательную для вычета)"
  },
  "are_you_sure_action": {
    "en": "Are you sure you want to perform this action?",
    "ar": "هل أنت متأكد من تنفيذ هذا الإجراء؟",
    "fr": "Êtes-vous sûr de vouloir effectuer cette action ?",
    "tr": "Bu işlemi gerçekleştirmek istediğinizden emin misiniz?",
    "zh": "您确定要执行此操作吗？",
    "ku": "ئایا دڵنیایت لە ئەنجامدانی ئەم کارە؟",
    "ru": "Вы уверены, что хотите выполнить это действие?"
  },
  "confirm": {
    "en": "Confirm",
    "ar": "تأكيد",
    "fr": "Confirmer",
    "tr": "Onayla",
    "zh": "确认",
    "ku": "تەئکیدکردنەوە",
    "ru": "Подтвердить"
  },
  "new_password_placeholder": {
    "en": "New Password",
    "ar": "كلمة المرور الجديدة",
    "fr": "Nouveau mot de passe",
    "tr": "Yeni Şifre",
    "zh": "新密码",
    "ku": "وشەی نهێنی نوێ",
    "ru": "Новый пароль"
  },
  "update": {
    "en": "Update",
    "ar": "تحديث",
    "fr": "Mettre à jour",
    "tr": "Güncelle",
    "zh": "更新",
    "ku": "نوێکردنەوە",
    "ru": "Обновить"
  },
  "swift_bank_transfers": {
    "en": "Swift Bank Transfers",
    "ar": "حوالات Swift البنكية",
    "fr": "Virements bancaires Swift",
    "tr": "Swift Banka Transferleri",
    "zh": "Swift 银行转账",
    "ku": "گواستنەوە بانکییەکانی Swift",
    "ru": "Банковские переводы Swift"
  },
  "beneficiary": {
    "en": "Beneficiary",
    "ar": "المستفيد",
    "fr": "Bénéficiaire",
    "tr": "Yararlanıcı",
    "zh": "受益人",
    "ku": "سوودمەند",
    "ru": "Бенефициар"
  },
  "amount": {
    "en": "Amount",
    "ar": "المبلغ",
    "fr": "Montant",
    "tr": "Tutar",
    "zh": "金额",
    "ku": "بڕ",
    "ru": "Сумма"
  },
  "details": {
    "en": "Details",
    "ar": "التفاصيل",
    "fr": "Détails",
    "tr": "Detaylar",
    "zh": "详情",
    "ku": "وردەکارییەکان",
    "ru": "Детали"
  },
  "approve": {
    "en": "Approve",
    "ar": "قبول",
    "fr": "Approuver",
    "tr": "Onayla",
    "zh": "批准",
    "ku": "پەسەندکردن",
    "ru": "Одобрить"
  },
  "reject": {
    "en": "Reject",
    "ar": "رفض",
    "fr": "Rejeter",
    "tr": "Reddet",
    "zh": "拒绝",
    "ku": "ڕەتکردنەوە",
    "ru": "Отклонить"
  },
  "swift_approved_success": {
    "en": "Swift transfer approved successfully ✅",
    "ar": "تم اعتماد الحوالة بنجاح ✅",
    "fr": "Virement Swift approuvé avec succès ✅",
    "tr": "Swift transferi başarıyla onaylandı ✅",
    "zh": "Swift 转账已成功批准 ✅",
    "ku": "گواستنەوەی Swift بە سەرکەوتوویی پەسەندکرا ✅",
    "ru": "Перевод Swift успешно одобрен ✅"
  },
  "swift_rejected_success": {
    "en": "Transfer rejected and balance returned ❌",
    "ar": "تم الرفض وإرجاع الرصيد ❌",
    "fr": "Virement rejeté et solde retourné ❌",
    "tr": "Transfer reddedildi ve bakiye iade edildi ❌",
    "zh": "转账已拒绝，余额已退回 ❌",
    "ku": "گواستنەوە ڕەتکرایەوە و باڵانس گەڕێنرایەوە ❌",
    "ru": "Перевод отклонен, баланс возвращен ❌"
  },
  "asset_price_control": {
    "en": "Asset Price and Deals Control",
    "ar": "التحكم في أسعار الأصول والصفقات",
    "fr": "Contrôle des prix des actifs et des transactions",
    "tr": "Varlık Fiyatı ve Anlaşma Kontrolü",
    "zh": "资产价格和交易控制",
    "ku": "کۆنتڕۆڵی نرخی داراییەکان و گرێبەستەکان",
    "ru": "Управление ценами на активы и сделками"
  },
  "asset": {
    "en": "Asset",
    "ar": "الأصل",
    "fr": "Actif",
    "tr": "Varlık",
    "zh": "资产",
    "ku": "دارایی",
    "ru": "Актив"
  },
  "real_price": {
    "en": "Real Price",
    "ar": "السعر الحقيقي",
    "fr": "Prix réel",
    "tr": "Gerçek Fiyat",
    "zh": "实际价格",
    "ku": "نرخی ڕاستەقینە",
    "ru": "Реальная цена"
  },
  "bias": {
    "en": "Bias",
    "ar": "الانحياز",
    "fr": "Biais",
    "tr": "Önyargı",
    "zh": "偏向",
    "ku": "لایەنگری",
    "ru": "Предвзятость"
  },
  "unfreeze": {
    "en": "Unfreeze",
    "ar": "فك التجميد",
    "fr": "Débloquer",
    "tr": "Dondurmayı Çöz",
    "zh": "解冻",
    "ku": "لابردنی بەستن",
    "ru": "Разморозить"
  },
  "freeze_price": {
    "en": "Freeze Price",
    "ar": "تجميد السعر",
    "fr": "Geler le prix",
    "tr": "Fiyatı Dondur",
    "zh": "冻结价格",
    "ku": "بەستنی نرخ",
    "ru": "Заморозить цену"
  },
  "open_deals_mgmt": {
    "en": "Open Deals Management",
    "ar": "إدارة الصفقات المفتوحة",
    "fr": "Gestion des transactions ouvertes",
    "tr": "Açık Anlaşma Yönetimi",
    "zh": "未结交易管理",
    "ku": "بەڕێوەبردنی گرێبەستە کراوەکان",
    "ru": "Управление открытыми сделками"
  },
  "trader": {
    "en": "Trader",
    "ar": "المتداول",
    "fr": "Trader",
    "tr": "Tüccar",
    "zh": "交易员",
    "ku": "بازرگان",
    "ru": "Трейдер"
  },
  "decision": {
    "en": "Decision",
    "ar": "القرار",
    "fr": "Décision",
    "tr": "Karar",
    "zh": "决定",
    "ku": "بڕیار",
    "ru": "Решение"
  },
  "close_profit": {
    "en": "Close with Profit ✅",
    "ar": "إغلاق بربح ✅",
    "fr": "Fermer avec profit ✅",
    "tr": "Kârla Kapat ✅",
    "zh": "盈利平仓 ✅",
    "ku": "داخستن بە قازانج ✅",
    "ru": "Закрыть с прибылью ✅"
  },
  "close_loss": {
    "en": "Close with Loss ❌",
    "ar": "بخسارة ❌",
    "fr": "Fermer avec perte ❌",
    "tr": "Zararla Kapat ❌",
    "zh": "亏损平仓 ❌",
    "ku": "بە زیان ❌",
    "ru": "Закрыть с убытком ❌"
  },
  "closed_profit_success": {
    "en": "Closed with profit ✅",
    "ar": "أغلقت بربح ✅",
    "fr": "Fermé avec profit ✅",
    "tr": "Kârla kapatıldı ✅",
    "zh": "已盈利平仓 ✅",
    "ku": "بە قازانج داخرا ✅",
    "ru": "Закрыто с прибылью ✅"
  },
  "closed_loss_success": {
    "en": "Closed with loss ❌",
    "ar": "أغلقت بخسارة ❌",
    "fr": "Fermé avec perte ❌",
    "tr": "Zararla kapatıldı ❌",
    "zh": "已亏损平仓 ❌",
    "ku": "بە زیان داخرا ✅",
    "ru": "Закрыто с убытком ❌"
  },
  "no_live_deals": {
    "en": "No live deals currently",
    "ar": "لا توجد صفقات حية حالياً",
    "fr": "Aucune transaction en direct actuellement",
    "tr": "Şu anda canlı anlaşma yok",
    "zh": "目前没有实时交易",
    "ku": "لە ئێستادا هیچ گرێبەستێکی زیندوو نییە",
    "ru": "В настоящее время нет активных сделок"
  },
  "salary_advance_funding": {
    "en": "Salary Advance Funding",
    "ar": "تمويل الرواتب المسبق",
    "fr": "Financement d'avance sur salaire",
    "tr": "Maaş Avans Finansmanı",
    "zh": "工资预支资金",
    "ku": "دابینکردنی مووچەی پێشوەختە",
    "ru": "Финансирование аванса по зарплате"
  },
  "direct_funding": {
    "en": "Direct Funding",
    "ar": "تمويل مباشر",
    "fr": "Financement direct",
    "tr": "Doğrudan Finansman",
    "zh": "直接融资",
    "ku": "دابینکردنی ڕاستەوخۆ",
    "ru": "Прямое финансирование"
  },
  "no_active_funding_requests": {
    "en": "No active funding requests",
    "ar": "لا توجد طلبات تمويل نشطة",
    "fr": "Aucune demande de financement active",
    "tr": "Aktif finansman talebi yok",
    "zh": "目前没有活跃的资金请求",
    "ku": "هیچ داواکارییەکی دابینکردنی چالاک نییە",
    "ru": "Нет активных запросов на финансирование"
  },
  "grant_instant_funding": {
    "en": "Grant Instant Funding",
    "ar": "منح تمويل فوري",
    "fr": "Accorder un financement instantané",
    "tr": "Anında Finansman Sağla",
    "zh": "授予即时资金",
    "ku": "بەخشینی دابینکردنی دەستبەجێ",
    "ru": "Предоставить мгновенное финансирование"
  },
  "beneficiary_name_placeholder": {
    "en": "Beneficiary Name",
    "ar": "اسم المستفيد",
    "fr": "Nom du bénéficiaire",
    "tr": "Yararlanıcı Adı",
    "zh": "受益人姓名",
    "ku": "ناوی سوودمەند",
    "ru": "Имя бенефициара"
  },
  "duration_months": {
    "en": "Duration (Months)",
    "ar": "المدة (أشهر)",
    "fr": "Durée (Mois)",
    "tr": "Süre (Ay)",
    "zh": "期限（月）",
    "ku": "ماوە (مانگ)",
    "ru": "Продолжительность (мес.)"
  },
  "confirm_funding": {
    "en": "Confirm Funding 🏦",
    "ar": "تأكيد التمويل 🏦",
    "fr": "Confirmer le financement 🏦",
    "tr": "Finansmanı Onayla 🏦",
    "zh": "确认资金 🏦",
    "ku": "تەئکیدکردنەوەی دابینکردن 🏦",
    "ru": "Подтвердить финансирование 🏦"
  },
  "funding_granted_success": {
    "en": "Funding granted successfully 🏦",
    "ar": "تم منح التمويل بنجاح 🏦",
    "fr": "Financement accordé avec succès 🏦",
    "tr": "Finansman başarıyla sağlandı 🏦",
    "zh": "资金已成功授予 🏦",
    "ku": "دابینکردن بە سەرکەوتوویی بەخشرا 🏦",
    "ru": "Финансирование успешно предоставлено 🏦"
  },
  "username_not_found": {
    "en": "Username not found",
    "ar": "اسم المستخدم غير موجود",
    "fr": "Nom d'utilisateur non trouvé",
    "tr": "Kullanıcı adı bulunamadı",
    "zh": "未找到用户名",
    "ku": "ناوی بەکارهێنەر نەدۆزرایەوە",
    "ru": "Имя пользователя не найдено"
  },
  "close": {
    "en": "Close",
    "ar": "إغلاق",
    "fr": "Fermer",
    "tr": "Kapat",
    "zh": "关闭",
    "ku": "داخستن",
    "ru": "Закрыть"
  },
  "sovereign_invest_plans": {
    "en": "Sovereign Investment Plans",
    "ar": "خطط الاستثمار السيادية",
    "fr": "Plans d'investissement souverains",
    "tr": "Egemen Yatırım Planları",
    "zh": "主权投资计划",
    "ku": "پلانەکانی وەبەرهێنانی سەروەری",
    "ru": "Суверенные инвестиционные планы"
  },
  "add_plan": {
    "en": "Add Plan",
    "ar": "إضافة خطة",
    "fr": "Ajouter un plan",
    "tr": "Plan Ekle",
    "zh": "添加计划",
    "ku": "زیادکردنی پلان",
    "ru": "Добавить план"
  },
  "delete_plan": {
    "en": "Delete Plan 🗑️",
    "ar": "حذف الخطة 🗑️",
    "fr": "Supprimer le plan 🗑️",
    "tr": "Planı Sil 🗑️",
    "zh": "删除计划 🗑️",
    "ku": "سڕینەوەی پلان 🗑️",
    "ru": "Удалить план 🗑️"
  },
  "add_new_invest_plan": {
    "en": "Add New Investment Plan",
    "ar": "إضافة خطة استثمار جديدة",
    "fr": "Ajouter un nouveau plan d'investissement",
    "tr": "Yeni Yatırım Planı Ekle",
    "zh": "添加新投资计划",
    "ku": "زیادکردنی پلانی وەبەرهێنانی نوێ",
    "ru": "Добавить новый инвестиционный план"
  },
  "plan_name_placeholder": {
    "en": "Plan Name",
    "ar": "اسم الخطة",
    "fr": "Nom du plan",
    "tr": "Plan Adı",
    "zh": "计划名称",
    "ku": "ناوی پلان",
    "ru": "Название плана"
  },
  "profit_rate": {
    "en": "Profit Rate (%)",
    "ar": "نسبة الربح (%)",
    "fr": "Taux de profit (%)",
    "tr": "Kâr Oranı (%)",
    "zh": "利润率 (%)",
    "ku": "ڕێژەی قازانج (%)",
    "ru": "Ставка прибыли (%)"
  },
  "save_plan": {
    "en": "Save Plan",
    "ar": "حفظ الخطة",
    "fr": "Enregistrer le plan",
    "tr": "Planı Kaydet",
    "zh": "保存计划",
    "ku": "پاشەکەوتکردنی پلان",
    "ru": "Сохранить план"
  },
  "generate_recharge_cards": {
    "en": "Generate Recharge Cards",
    "ar": "توليد بطاقات الشحن",
    "fr": "Générer des cartes de recharge",
    "tr": "Yükleme Kartları Oluştur",
    "zh": "生成充值卡",
    "ku": "دروستکردنی کارتی پڕکردنەوە",
    "ru": "Генерация карт пополнения"
  },
  "generate_new_cards": {
    "en": "Generate New Cards 🎫",
    "ar": "توليد بطاقات جديدة 🎫",
    "fr": "Générer de nouvelles cartes 🎫",
    "tr": "Yeni Kartlar Oluştur 🎫",
    "zh": "生成新卡 🎫",
    "ku": "دروستکردنی کارتی نوێ 🎫",
    "ru": "Генерация новых карт 🎫"
  },
  "unique_code": {
    "en": "Unique Code",
    "ar": "الكود الفريد",
    "fr": "Code unique",
    "tr": "Benzersiz Kod",
    "zh": "唯一代码",
    "ku": "کۆدی بێهاوتا",
    "ru": "Уникальный код"
  },
  "monetary_value": {
    "en": "Monetary Value",
    "ar": "القيمة المادية",
    "fr": "Valeur monétaire",
    "tr": "Parasal Değer",
    "zh": "货币价值",
    "ku": "بەهای دارایی",
    "ru": "Денежная стоимость"
  },
  "used": {
    "en": "Used",
    "ar": "مستخدمة",
    "fr": "Utilisée",
    "tr": "Kullanılmış",
    "zh": "已使用",
    "ku": "بەکارهێنراوە",
    "ru": "Использовано"
  },
  "no_cards_issued": {
    "en": "No cards issued currently",
    "ar": "لا توجد بطاقات مصدرة حالياً",
    "fr": "Aucune carte émise actuellement",
    "tr": "Şu anda düzenlenmiş kart yok",
    "zh": "目前没有发卡",
    "ku": "لە ئێستادا هیچ کارتێک دەرنەکراوە",
    "ru": "В настоящее время карты не выпущены"
  },
  "card_value": {
    "en": "Card Value ($)",
    "ar": "قيمة البطاقة ($)",
    "fr": "Valeur de la carte ($)",
    "tr": "Kart Değeri ($)",
    "zh": "卡值 ($)",
    "ku": "بەهای کارت ($)",
    "ru": "Номинал карты ($)"
  },
  "quantity": {
    "en": "Quantity",
    "ar": "الكمية",
    "fr": "Quantité",
    "tr": "Miktar",
    "zh": "数量",
    "ku": "بڕ",
    "ru": "Количество"
  },
  "start_generation": {
    "en": "Start Generation 🚀",
    "ar": "مباشرة التوليد 🚀",
    "fr": "Démarrer la génération 🚀",
    "tr": "Oluşturmayı Başlat 🚀",
    "zh": "开始生成 🚀",
    "ku": "دەستپێکردنی دروستکردن 🚀",
    "ru": "Начать генерацию 🚀"
  },
  "cards_generated_success": {
    "en": "Cards generated 🎫",
    "ar": "تم توليد البطاقات 🎫",
    "fr": "Cartes générées 🎫",
    "tr": "Kartlar oluşturuldu 🎫",
    "zh": "卡片已生成 🎫",
    "ku": "کارتەکان دروستکران 🎫",
    "ru": "Карты сгенерированы 🎫"
  },
  "monthly_raffle_mgmt": {
    "en": "Monthly Raffle Management",
    "ar": "إدارة القرعة الشهرية",
    "fr": "Gestion de la tombola mensuelle",
    "tr": "Aylık Çekiliş Yönetimi",
    "zh": "每月抽奖管理",
    "ku": "بەڕێوەبردنی تیروپشکی مانگانە",
    "ru": "Управление ежемесячным розыгрышем"
  },
  "draw_random_winner": {
    "en": "Draw Random Winner 🎰",
    "ar": "سحب فائز عشوائي 🎰",
    "fr": "Tirer un gagnant au sort 🎰",
    "tr": "Rastgele Kazanan Çek 🎰",
    "zh": "抽取随机获胜者 🎰",
    "ku": "ڕاکێشانی براوەیەکی هەڕەمەکی 🎰",
    "ru": "Разыграть случайного победителя 🎰"
  },
  "drawing_in_progress": {
    "en": "Drawing in progress...",
    "ar": "جاري إجراء السحب...",
    "fr": "Tirage en cours...",
    "tr": "Çekiliş yapılıyor...",
    "zh": "抽奖进行中...",
    "ku": "تیروپشکەکە لە کاردایە...",
    "ru": "Идет розыгрыш..."
  },
  "current_raffle_settings": {
    "en": "Current Raffle Settings",
    "ar": "إعدادات القرعة الحالية",
    "fr": "Paramètres de la tombola actuelle",
    "tr": "Mevcut Çekiliş Ayarları",
    "zh": "当前抽奖设置",
    "ku": "ڕێکخستنەکانی تیروپشکی ئێستا",
    "ru": "Текущие настройки розыгрыша"
  },
  "prize_type": {
    "en": "Prize Type",
    "ar": "نوع الجائزة",
    "fr": "Type de prix",
    "tr": "Ödül Türü",
    "zh": "奖品类型",
    "ku": "جۆری خەڵات",
    "ru": "Тип приза"
  },
  "ticket_price": {
    "en": "Ticket Price ($)",
    "ar": "سعر التذكرة ($)",
    "fr": "Prix du ticket ($)",
    "tr": "Bilet Fiyatı ($)",
    "zh": "门票价格 ($)",
    "ku": "نرخی تکت ($)",
    "ru": "Цена билета ($)"
  },
  "raffle_date": {
    "en": "Raffle Date",
    "ar": "موعد القرعة",
    "fr": "Date de la tombola",
    "tr": "Çekiliş Tarihi",
    "zh": "抽奖日期",
    "ku": "بەرواری تیروپشک",
    "ru": "Дата розыгрыша"
  },
  "show_countdown": {
    "en": "Show Countdown",
    "ar": "إظهار العداد",
    "fr": "Afficher le compte à rebours",
    "tr": "Geri Sayımı Göster",
    "zh": "显示倒计时",
    "ku": "پیشاندانی کاتژمێر",
    "ru": "Показать обратный отсчет"
  },
  "hide_countdown": {
    "en": "Hide Countdown",
    "ar": "إخفاء العداد",
    "fr": "Masquer le compte à rebours",
    "tr": "Geri Sayımı Gizle",
    "zh": "隐藏倒计时",
    "ku": "شاردنەوەی کاتژمێر",
    "ru": "Скрыть обратный отсчет"
  },
  "active_participants": {
    "en": "Active Participants",
    "ar": "المشاركون النشطون",
    "fr": "Participants actifs",
    "tr": "Aktif Katılımcılar",
    "zh": "活跃参与者",
    "ku": "بەشداربووە چالاکەکان",
    "ru": "Активные участники"
  },
  "royal_winners_log": {
    "en": "Royal Winners Log",
    "ar": "سجل الفائزين الملكي",
    "fr": "Journal des gagnants royaux",
    "tr": "Kraliyet Kazananlar Günlüğü",
    "zh": "皇家获胜者日志",
    "ku": "تۆماری براوە شاهانەکان",
    "ru": "Журнал королевских победителей"
  },
  "no_participants_yet": {
    "en": "No participants in current draw",
    "ar": "لا يوجد مشاركون في السحب الحالي",
    "fr": "Aucun participant au tirage actuel",
    "tr": "Mevcut çekilişte katılımcı yok",
    "zh": "当前抽奖没有参与者",
    "ku": "هیچ بەشداربوویەک لە تیروپشکی ئێستادا نییە",
    "ru": "В текущем розыгрыше нет участников"
  },
  "waiting_for_first_winner": {
    "en": "Waiting for the first winner of the month...",
    "ar": "بانتظار تتويج أول فائز لهذا الشهر...",
    "fr": "En attente du premier gagnant du mois...",
    "tr": "Ayın ilk kazananı bekleniyor...",
    "zh": "等待本月的第一个获胜者...",
    "ku": "چاوەڕێی یەکەم براوەی ئەم مانگەین...",
    "ru": "Ожидание первого победителя месяца..."
  },
  "no_participants_warning": {
    "en": "No participants in the raffle currently ⚠️",
    "ar": "لا يوجد مشاركون في القرعة حالياً ⚠️",
    "fr": "Aucun participant à la tombola actuellement ⚠️",
    "tr": "Şu anda çekilişte katılımcı yok ⚠️",
    "zh": "目前抽奖没有参与者 ⚠️",
    "ku": "لە ئێستادا هیچ بەشداربوویەک لە تیروپشکەکەدا نییە ⚠️",
    "ru": "В настоящее время в розыгрыше нет участников ⚠️"
  },
  "enter_prize_name": {
    "en": "Enter prize name (e.g., Porsche or Umrah trip):",
    "ar": "أدخل اسم الجائزة (مثلاً: سيارة بورش أو رحلة عمرة):",
    "fr": "Entrez le nom du prix (ex: Porsche ou voyage Umrah) :",
    "tr": "Ödül adını girin (örneğin: Porsche veya Umre gezisi):",
    "zh": "输入奖品名称（例如：保时捷或朝圣之旅）：",
    "ku": "ناوی خەڵاتەکە بنووسە (بۆ نموونە: ئۆتۆمبێلی پۆرشە یان گەشتی عومرە):",
    "ru": "Введите название приза (например, Porsche или поездка на Умру):"
  },
  "grand_prize": {
    "en": "Grand Prize",
    "ar": "جائزة كبرى",
    "fr": "Grand Prix",
    "tr": "Büyük Ödül",
    "zh": "大奖",
    "ku": "خەڵاتی گەورە",
    "ru": "Главный приз"
  },
  "winner_announcement": {
    "en": "Winner Announcement",
    "ar": "إعلان فائز",
    "fr": "Annonce du gagnant",
    "tr": "Kazanan Duyurusu",
    "zh": "获胜者公告",
    "ku": "ڕاگەیاندنی براوە",
    "ru": "Объявление победителя"
  },
  "winner_is": {
    "en": "The raffle winner is:",
    "ar": "الفائز بالقرعة هو:",
    "fr": "Le gagnant de la tombola est :",
    "tr": "Çekilişin kazananı:",
    "zh": "抽奖获胜者是：",
    "ku": "براوەی تیروپشکەکە بریتییە لە:",
    "ru": "Победитель розыгрыша:"
  },
  "prize": {
    "en": "Prize",
    "ar": "الجائزة",
    "fr": "Prix",
    "tr": "Ödül",
    "zh": "奖品",
    "ku": "خەڵات",
    "ru": "Приз"
  },
  "congratulations_winner": {
    "en": "🎉 Congratulations to the winner:",
    "ar": "🎉 ألف مبروك للفائز:",
    "fr": "🎉 Félicitations au gagnant :",
    "tr": "🎉 Kazananı tebrik ederiz:",
    "zh": "🎉 恭喜获胜者：",
    "ku": "🎉 پیرۆزە لە براوە:",
    "ru": "🎉 Поздравляем победителя:"
  },
  "customize_site_identity": {
    "en": "Customize System Identity",
    "ar": "تخصيص هوية النظام",
    "fr": "Personnaliser l'identité du système",
    "tr": "Sistem Kimliğini Özelleştir",
    "zh": "自定义系统标识",
    "ku": "تایبەتمەندکردنی ناسنامەی سیستم",
    "ru": "Настройка идентификации системы"
  },
  "branding": {
    "en": "Branding",
    "ar": "العلامة التجارية",
    "fr": "Image de marque",
    "tr": "Markalaşma",
    "zh": "品牌推广",
    "ku": "نیشانەی بازرگانی",
    "ru": "Брендинг"
  },
  "logo_url": {
    "en": "Logo URL",
    "ar": "رابط الشعار",
    "fr": "URL du logo",
    "tr": "Logo URL'si",
    "zh": "徽标 URL",
    "ku": "بەستەری لۆگۆ",
    "ru": "URL-адрес логотипа"
  },
  "network_name": {
    "en": "Network Name",
    "ar": "اسم الشبكة",
    "fr": "Nom du réseau",
    "tr": "Ağ Adı",
    "zh": "网络名称",
    "ku": "ناوی تۆڕ",
    "ru": "Название сети"
  },
  "interface_texts": {
    "en": "Interface Texts",
    "ar": "نصوص الواجهة",
    "fr": "Textes de l'interface",
    "tr": "Arayüz Metinleri",
    "zh": "界面文本",
    "ku": "دەقەکانی ڕووکار",
    "ru": "Тексты интерфейса"
  },
  "hero_description": {
    "en": "Hero Description",
    "ar": "وصف Hero",
    "fr": "Description Hero",
    "tr": "Hero Açıklaması",
    "zh": "英雄描述",
    "ku": "وەسفی هێرۆ",
    "ru": "Описание Hero"
  },
  "email": {
    "en": "Email",
    "ar": "البريد",
    "fr": "E-mail",
    "tr": "E-posta",
    "zh": "电子邮件",
    "ku": "ئیمەیڵ",
    "ru": "Электронная почта"
  },
  "phone": {
    "en": "Phone",
    "ar": "الهاتف",
    "fr": "Téléphone",
    "tr": "Telefon",
    "zh": "电话",
    "ku": "تەلەفۆن",
    "ru": "Телефон"
  },
  "address": {
    "en": "Address",
    "ar": "العنوان",
    "fr": "Adresse",
    "tr": "Adres",
    "zh": "地址",
    "ku": "ناونیشان",
    "ru": "Адрес"
  },
  "save_apply_identity": {
    "en": "Save and Apply Executive Identity 📡",
    "ar": "حفظ وتطبيق الهوية التنفيذية 📡",
    "fr": "Enregistrer et appliquer l'identité exécutive 📡",
    "tr": "Yönetici Kimliğini Kaydet ve Uygula 📡",
    "zh": "保存并应用执行标识 📡",
    "ku": "پاشەکەوتکردن و جێبەجێکردنی ناسنامەی جێبەجێکار 📡",
    "ru": "Сохранить и применить исполнительную идентификацию 📡"
  },
  "identity_updated_success": {
    "en": "System identity updated successfully 📡",
    "ar": "تم تحديث هوية النظام بنجاح 📡",
    "fr": "Identité du système mise à jour avec succès 📡",
    "tr": "Sistem kimliği başarıyla güncellendi 📡",
    "zh": "系统标识更新成功 📡",
    "ku": "ناسنامەی سیستم بە سەرکەوتوویی نوێکرایەوە 📡",
    "ru": "Идентификация системы успешно обновлена 📡"
  },
  "merchant_escrow_mgmt": {
    "en": "Merchant LC Escrow Management",
    "ar": "إدارة اعتمادات التاجر (LC Escrow)",
    "fr": "Gestion de l'entiercement LC marchand",
    "tr": "Tüccar LC Emanet Yönetimi",
    "zh": "商家信用证托管管理",
    "ku": "بەڕێوەبردنی سپاردەی بازرگان (LC Escrow)",
    "ru": "Управление эскроу-счетами LC продавца"
  },
  "financial_control_system": {
    "en": "Financial Control System 2026",
    "ar": "نظام الرقابة المالية 2026",
    "fr": "Système de contrôle financier 2026",
    "tr": "Mali Kontrol Sistemi 2026",
    "zh": "财务控制系统 2026",
    "ku": "سیستەمی کۆنتڕۆڵی دارایی ٢٠٢٦",
    "ru": "Система финансового контроля 2026"
  },
  "buyer": {
    "en": "Buyer",
    "ar": "المشتري",
    "fr": "Acheteur",
    "tr": "Alıcı",
    "zh": "买家",
    "ku": "کڕیار",
    "ru": "Покупатель"
  },
  "hash": {
    "en": "Hash",
    "ar": "الهاش (Hash)",
    "fr": "Hash",
    "tr": "Hash",
    "zh": "哈希",
    "ku": "هاش",
    "ru": "Хэш"
  },
  "approve_release": {
    "en": "Approve and Release ✅",
    "ar": "موافقة وتحرير ✅",
    "fr": "Approuver et libérer ✅",
    "tr": "Onayla ve Serbest Bırak ✅",
    "zh": "批准并发布 ✅",
    "ku": "پەسەندکردن و ئازادکردن ✅",
    "ru": "Одобрить и выпустить ✅"
  },
  "reject_cancel": {
    "en": "Reject and Cancel ❌",
    "ar": "رفض وإلغاء ❌",
    "fr": "Rejeter et annuler ❌",
    "tr": "Reddet ve İptal Et ❌",
    "zh": "拒绝并取消 ❌",
    "ku": "ڕەتکردنەوە و هەڵوەشاندنەوە ❌",
    "ru": "Отклонить и отменить ❌"
  },
  "no_escrow_requests": {
    "en": "No LC escrow requests currently",
    "ar": "لا توجد طلبات اعتماد مستندي حالياً",
    "fr": "Aucune demande d'entiercement LC actuellement",
    "tr": "Şu anda LC emanet talebi yok",
    "zh": "目前没有信用证托管请求",
    "ku": "لە ئێستادا هیچ داواکارییەکی سپاردەی متمانە نییە",
    "ru": "В настоящее время нет запросов на эскроу LC"
  },
  "lc_policy_guide": {
    "en": "LC Escrow Policy Guide",
    "ar": "دليل سياسة الاعتمادات (LC)",
    "fr": "Guide de politique d'entiercement LC",
    "tr": "LC Emanet Politikası Kılavuzu",
    "zh": "信用证托管政策指南",
    "ku": "ڕێبەری سیاسەتی سپاردەی متمانە (LC)",
    "ru": "Руководство по политике эскроу LC"
  },
  "lc_policy_description": {
    "en": "Funds are held in Escrow when a deal is created. Money is only released to the merchant after they upload shipping documents (Shipped status) and the manager reviews them. Approval here deposits the amount directly into the merchant's wallet.",
    "ar": "يتم حجز المبالغ في نظام Escrow عند إنشاء الصفقة. لا يتم تحرير المبلغ للتاجر إلا بعد قيامه برفع وثيقة الشحن (حالة Shipped) ومراجعة المدير للوثائق. الموافقة هنا تقوم بإيداع المبلغ مباشرة في محفظة التاجر.",
    "fr": "Les fonds sont conservés en entiercement lorsqu'une transaction est créée. L'argent n'est libéré au marchand qu'après qu'il a téléchargé les documents d'expédition (statut Expédié) et que le gestionnaire les a examinés. L'approbation ici dépose le montant directement dans le portefeuille du marchand.",
    "tr": "Bir anlaşma oluşturulduğunda fonlar Emanet'te tutulur. Para, ancak satıcı nakliye belgelerini (Gönderildi durumu) yükledikten ve yönetici bunları inceledikten sonra satıcıya serbest bırakılır. Buradaki onay, tutarı doğrudan satıcının cüzdanına yatırır.",
    "zh": "交易创建时，资金将存放在托管账户中。只有在商家上传运输单据（已发货状态）且经理审核后，资金才会发放给商家。此处的批准会将金额直接存入商家的钱包。",
    "ku": "پارەکان لە سپاردەی متمانەدا دەهێڵرێنەوە کاتێک گرێبەستێک دروست دەکرێت. پارەکە تەنها بۆ بازرگانەکە ئازاد دەکرێت دوای ئەوەی بەڵگەنامەکانی ناردنی بارەکە (باری نێردراو) باردەکات و بەڕێوەبەرەکە پێداچوونەوەیان بۆ دەکات. پەسەندکردن لێرەدا بڕی پارەکە ڕاستەوخۆ دەخاتە ناو جزدانی بازرگانەکەوە.",
    "ru": "Средства удерживаются на эскроу-счете при создании сделки. Деньги выплачиваются продавцу только после того, как он загрузит отгрузочные документы (статус «Отправлено»), а менеджер их проверит. Одобрение здесь переводит сумму непосредственно на кошелек продавца."
  },
  "escrow_approved_success": {
    "en": "Approved and funds released to merchant ✅",
    "ar": "تمت الموافقة وتحرير المبلغ للتاجر ✅",
    "fr": "Approuvé et fonds libérés au marchand ✅",
    "tr": "Onaylandı ve fonlar satıcıya serbest bırakıldı ✅",
    "zh": "已批准并向商家发放资金 ✅",
    "ku": "پەسەندکرا و پارەکە بۆ بازرگانەکە ئازادکرا ✅",
    "ru": "Одобрено, средства выплачены продавцу ✅"
  },
  "escrow_rejected_success": {
    "en": "Deal rejected ❌",
    "ar": "تم رفض الصفقة ❌",
    "fr": "Transaction rejetée ❌",
    "tr": "Anlaşma reddedildi ❌",
    "zh": "交易已拒绝 ❌",
    "ku": "گرێبەستەکە ڕەتکرایەوە ❌",
    "ru": "Сделка отклонена ❌"
  },
  "ad_exchange_fpn": {
    "en": "FPN Ad Exchange",
    "ar": "بورصة الإعلانات FPN",
    "fr": "Bourse aux annonces FPN",
    "tr": "FPN Reklam Borsası",
    "zh": "FPN 广告交易所",
    "ku": "بۆرسەی ڕیکلامی FPN",
    "ru": "Рекламная биржа FPN"
  },
  "ad_exchange_subtitle": {
    "en": "Integrated marketplace connecting merchants with customers with LC escrow guarantee.",
    "ar": "سوق متكامل يربط التجار بالعملاء بضمان الاعتماد المستندي.",
    "fr": "Marché intégré reliant les marchands aux clients avec garantie d'entiercement LC.",
    "tr": "Tüccarları müşterilerle LC emanet garantisiyle bağlayan entegre pazar yeri.",
    "zh": "连接商家与客户的综合市场，提供信用证托管保证。",
    "ku": "بازاڕێکی تەواو کە بازرگانەکان بە کڕیارەکانەوە دەبەستێتەوە بە گەرەنتی سپاردەی متمانە.",
    "ru": "Интегрированная торговая площадка, соединяющая продавцов с покупателями с гарантией эскроу LC."
  },
  "browse_market": {
    "en": "Browse Market",
    "ar": "تصفح السوق",
    "fr": "Parcourir le marché",
    "tr": "Pazara Göz At",
    "zh": "浏览市场",
    "ku": "گەڕان لە بازاڕ",
    "ru": "Просмотр рынка"
  },
  "my_ads": {
    "en": "My Ads",
    "ar": "إعلاناتي",
    "fr": "Mes annonces",
    "tr": "Reklamlarım",
    "zh": "我的广告",
    "ku": "ڕیکلامەکانم",
    "ru": "Мои объявления"
  },
  "post_new_ad": {
    "en": "Post New Ad ➕",
    "ar": "نشر إعلان جديد ➕",
    "fr": "Publier une nouvelle annonce ➕",
    "tr": "Yeni Reklam Yayınla ➕",
    "zh": "发布新广告 ➕",
    "ku": "بڵاوکردنەوەی ڕیکلامێکی نوێ ➕",
    "ru": "Разместить новое объявление ➕"
  },
  "review_ads": {
    "en": "Review Ads",
    "ar": "مراجعة الإعلانات",
    "fr": "Réviser les annonces",
    "tr": "Reklamları İncele",
    "zh": "审核广告",
    "ku": "پێداچوونەوەی ڕیکلامەکان",
    "ru": "Проверка объявлений"
  },
  "featured": {
    "en": "Featured ⭐",
    "ar": "مميز ⭐",
    "fr": "Mis en avant ⭐",
    "tr": "Öne Çıkan ⭐",
    "zh": "精选 ⭐",
    "ku": "تایبەت ⭐",
    "ru": "Рекомендуемое ⭐"
  },
  "views": {
    "en": "Views",
    "ar": "المشاهدات",
    "fr": "Vues",
    "tr": "Görüntülenme",
    "zh": "查看次数",
    "ku": "بینینەکان",
    "ru": "Просмотры"
  },
  "view_details": {
    "en": "View Details",
    "ar": "عرض التفاصيل",
    "fr": "Voir les détails",
    "tr": "Detayları Göster",
    "zh": "查看详情",
    "ku": "پیشاندانی وردەکارییەکان",
    "ru": "Посмотреть детали"
  },
  "received_offers": {
    "en": "Received Offers",
    "ar": "العروض السعرية الواردة",
    "fr": "Offres reçues",
    "tr": "Alınan Teklifler",
    "zh": "收到的报价",
    "ku": "پێشنیارە وەرگیراوەکان",
    "ru": "Полученные предложения"
  },
  "no_offers_yet": {
    "en": "No offers yet",
    "ar": "لا توجد عروض حالياً",
    "fr": "Aucune offre pour le moment",
    "tr": "Henüz teklif yok",
    "zh": "暂无报价",
    "ku": "تا ئێستا هیچ پێشنیارێک نییە",
    "ru": "Предложений пока нет"
  },
  "internal_promotion": {
    "en": "Internal Promotion",
    "ar": "ترويج داخلي",
    "fr": "Promotion interne",
    "tr": "Dahili Promosyon",
    "zh": "内部推广",
    "ku": "پەرەپێدانی ناوخۆیی",
    "ru": "Внутреннее продвижение"
  },
  "global_promotion": {
    "en": "Global Promotion",
    "ar": "ترويج شامل",
    "fr": "Promotion globale",
    "tr": "Küresel Promosyon",
    "zh": "全球推广",
    "ku": "پەرەپێدانی گشتگیر",
    "ru": "Глобальное продвижение"
  },
  "pay_promotion_fee": {
    "en": "Pay Promotion Fee",
    "ar": "دفع رسوم الترويج",
    "fr": "Payer les frais de promotion",
    "tr": "Promosyon Ücretini Öde",
    "zh": "支付推广费",
    "ku": "دانانی کرێی پەرەپێدان",
    "ru": "Оплатить сбор за продвижение"
  },
  "waiting_admin_pricing": {
    "en": "Waiting for admin pricing...",
    "ar": "بانتظار تسعير الإدارة...",
    "fr": "En attente de la tarification admin...",
    "tr": "Yönetici fiyatlandırması bekleniyor...",
    "zh": "等待管理员定价...",
    "ku": "چاوەڕێی نرخاندنی کارگێڕین...",
    "ru": "Ожидание оценки администратором..."
  },
  "pending_final_review": {
    "en": "Pending final review...",
    "ar": "قيد المراجعة النهائية...",
    "fr": "En attente de révision finale...",
    "tr": "Son inceleme bekleniyor...",
    "zh": "等待最终审核...",
    "ku": "لە پێداچوونەوەی کۆتاییدایە...",
    "ru": "Ожидание окончательной проверки..."
  },
  "ad_currently_promoted": {
    "en": "Ad currently promoted ✅",
    "ar": "الإعلان مروج حالياً ✅",
    "fr": "Annonce actuellement promue ✅",
    "tr": "Reklam şu anda tanıtılıyor ✅",
    "zh": "广告当前正在推广 ✅",
    "ku": "ڕیکلامەکە لە ئێستادا پەرەی پێدراوە ✅",
    "ru": "Объявление в настоящее время продвигается ✅"
  },
  "promotion_request_rejected": {
    "en": "Promotion request rejected",
    "ar": "تم رفض طلب الترويج",
    "fr": "Demande de promotion rejetée",
    "tr": "Promosyon talebi reddedildi",
    "zh": "推广请求已拒绝",
    "ku": "داواکاری پەرەپێدان ڕەتکرایەوە",
    "ru": "Запрос на продвижение отклонен"
  },
  "ad_posting_policy": {
    "en": "Please adhere to posting policies. Account will be automatically suspended if contact details are found.",
    "ar": "يرجى الالتزام بسياسات النشر. سيتم حظر الحساب تلقائياً في حال وجود بيانات اتصال.",
    "fr": "Veuillez respecter les politiques de publication. Le compte sera automatiquement suspendu si des coordonnées sont trouvées.",
    "tr": "Lütfen yayınlama politikalarına uyun. İletişim bilgileri bulunursa hesap otomatik olarak askıya alınacaktır.",
    "zh": "请遵守发布政策。如果发现联系方式，账户将被自动暂停。",
    "ku": "تکایە پابەندبن بە سیاسەتەکانی بڵاوکردنەوە. ئەگەر زانیاری پەیوەندیکردن بدۆزرێتەوە، هەژمارەکە بە شێوەیەکی ئۆتۆماتیکی ڕادەگیرێت.",
    "ru": "Пожалуйста, соблюдайте правила размещения. Аккаунт будет автоматически заблокирован при обнаружении контактных данных."
  },
  "ad_title": {
    "en": "Ad Title",
    "ar": "عنوان الإعلان",
    "fr": "Titre de l'annonce",
    "tr": "Reklam Başlığı",
    "zh": "广告标题",
    "ku": "ناونیشانی ڕیکلام",
    "ru": "Заголовок объявления"
  },
  "category": {
    "en": "Category",
    "ar": "الفئة",
    "fr": "Catégorie",
    "tr": "Kategori",
    "zh": "类别",
    "ku": "پۆلێن",
    "ru": "Категория"
  },
  "ad_description_placeholder": {
    "en": "Write a detailed description of the product or service...",
    "ar": "اكتب وصفاً تفصيلياً للمنتج أو الخدمة...",
    "fr": "Écrivez une description détaillée du produit ou du service...",
    "tr": "Ürün veya hizmetin ayrıntılı bir açıklamasını yazın...",
    "zh": "写下产品或服务的详细描述...",
    "ku": "وەسفێکی وردی بەرهەمەکە یان خزمەتگوزارییەکە بنووسە...",
    "ru": "Напишите подробное описание товара или услуги..."
  },
  "price_negotiable": {
    "en": "Price is negotiable",
    "ar": "السعر قابل للتفاوض",
    "fr": "Le prix est négociable",
    "tr": "Fiyat pazarlığa tabidir",
    "zh": "价格可议",
    "ku": "نرخەکە جێگەی وتووێژە",
    "ru": "Цена договорная"
  },
  "allow_offers_desc": {
    "en": "Allows buyers to submit price offers.",
    "ar": "يسمح للمشترين بتقديم عروض سعرية.",
    "fr": "Permet aux acheteurs de soumettre des offres de prix.",
    "tr": "Alıcıların fiyat teklifi sunmasına olanak tanır.",
    "zh": "允许买家提交报价。",
    "ku": "ڕێگە بە کڕیارەکان دەدات پێشنیاری نرخ بدەن.",
    "ru": "Позволяет покупателям делать ценовые предложения."
  },
  "geographic_targeting": {
    "en": "Geographic Targeting",
    "ar": "الاستهداف الجغرافي",
    "fr": "Ciblage géographique",
    "tr": "Coğrafi Hedefleme",
    "zh": "地理定位",
    "ku": "ئامانجی جوگرافی",
    "ru": "Географический таргетинг"
  },
  "state_province": {
    "en": "State / Province",
    "ar": "الولاية / المحافظة",
    "fr": "État / Province",
    "tr": "Eyalet / İl",
    "zh": "州 / 省",
    "ku": "ویلایەت / پارێزگا",
    "ru": "Штат / Провинция"
  },
  "city": {
    "en": "City",
    "ar": "المدينة",
    "fr": "Ville",
    "tr": "Şehir",
    "zh": "城市",
    "ku": "شار",
    "ru": "Город"
  },
  "israel_ban_note": {
    "en": "⚠️ Note: Targeting Israel is strictly prohibited by the system.",
    "ar": "⚠️ ملاحظة: استهداف إسرائيل محظور تماماً من النظام.",
    "fr": "⚠️ Note : Le ciblage d'Israël est strictement interdit par le système.",
    "tr": "⚠️ Not: İsrail'i hedeflemek sistem tarafından kesinlikle yasaktır.",
    "zh": "⚠️ 注意：系统严禁针对以色列。",
    "ku": "⚠️ تێبینی: بە ئامانجگرتنی ئیسرائیل بە تەواوی لە سیستەمەکەدا قەدەغەیە.",
    "ru": "⚠️ Примечание: Таргетинг на Израиль строго запрещен системой."
  },
  "ad_images_limit": {
    "en": "Ad Images (Max 3 images)",
    "ar": "صور الإعلان (3 صور كحد أقصى)",
    "fr": "Images de l'annonce (Max 3 images)",
    "tr": "Reklam Resimleri (Maksimum 3 resim)",
    "zh": "广告图片（最多 3 张图片）",
    "ku": "وێنەکانی ڕیکلام (زۆرترین ٣ وێنە)",
    "ru": "Изображения объявления (макс. 3 изображения)"
  },
  "confirm_post_ad": {
    "en": "Confirm and Post Ad 🚀",
    "ar": "تأكيد ونشر الإعلان 🚀",
    "fr": "Confirmer et publier l'annonce 🚀",
    "tr": "Onayla ve Reklamı Yayınla 🚀",
    "zh": "确认并发布广告 🚀",
    "ku": "پەسەندکردن و بڵاوکردنەوەی ڕیکلام 🚀",
    "ru": "Подтвердить и разместить объявление 🚀"
  },
  "by_merchant": {
    "en": "By:",
    "ar": "بواسطة:",
    "fr": "Par :",
    "tr": "Tarafından:",
    "zh": "发布者：",
    "ku": "لەلایەن:",
    "ru": "Автор:"
  },
  "product_description": {
    "en": "Product Description",
    "ar": "وصف المنتج",
    "fr": "Description du produit",
    "tr": "Ürün Açıklaması",
    "zh": "产品描述",
    "ku": "وەسفی بەرهەم",
    "ru": "Описание товара"
  },
  "final_price": {
    "en": "Final Price",
    "ar": "السعر النهائي",
    "fr": "Prix final",
    "tr": "Final Fiyatı",
    "zh": "最终价格",
    "ku": "نرخی کۆتایی",
    "ru": "Окончательная цена"
  },
  "price_negotiable_note": {
    "en": "This price is negotiable",
    "ar": "هذا السعر قابل للتفاوض",
    "fr": "Ce prix est négociable",
    "tr": "Bu fiyat pazarlığa tabidir",
    "zh": "此价格可议",
    "ku": "ئەم نرخە جێگەی وتووێژە",
    "ru": "Эта цена договорная"
  },
  "place_offer_here": {
    "en": "Place your offer here...",
    "ar": "ضع عرضك هنا...",
    "fr": "Placez votre offre ici...",
    "tr": "Teklifinizi buraya bırakın...",
    "zh": "在此处提交您的报价...",
    "ku": "پێشنیارەکەت لێرە دابنێ...",
    "ru": "Разместите ваше предложение здесь..."
  },
  "send_offer": {
    "en": "Send Offer",
    "ar": "إرسال عرض",
    "fr": "Envoyer l'offre",
    "tr": "Teklif Gönder",
    "zh": "发送报价",
    "ku": "ناردنی پێشنیار",
    "ru": "Отправить предложение"
  },
  "buy_now_fpn": {
    "en": "Buy Now (FPN LC)",
    "ar": "شراء الآن (FPN LC)",
    "fr": "Acheter maintenant (FPN LC)",
    "tr": "Şimdi Satın Al (FPN LC)",
    "zh": "立即购买 (FPN LC)",
    "ku": "ئێستا بکڕە (FPN LC)",
    "ru": "Купить сейчас (FPN LC)"
  },
  "securing_funds": {
    "en": "Securing funds...",
    "ar": "جاري تأمين المبلغ...",
    "fr": "Sécurisation des fonds...",
    "tr": "Fonlar güvence altına alınıyor...",
    "zh": "正在确保资金安全...",
    "ku": "پارەکە پارێزراو دەکرێت...",
    "ru": "Обеспечение безопасности средств..."
  },
  "own_ad_note": {
    "en": "Your own ad",
    "ar": "إعلانك الخاص",
    "fr": "Votre propre annonce",
    "tr": "Kendi reklamınız",
    "zh": "您自己的广告",
    "ku": "ڕیکلامی خۆت",
    "ru": "Ваше собственное объявление"
  },
  "lc_active_note": {
    "en": "FPN LC system is automatically active",
    "ar": "نظام الاعتماد المستندي FPN نشط تلقائياً",
    "fr": "Le système FPN LC est automatiquement actif",
    "tr": "FPN LC sistemi otomatik olarak etkindir",
    "zh": "FPN LC 系统已自动激活",
    "ku": "سیستەمی FPN LC بە شێوەیەکی ئۆتۆماتیکی چالاکە",
    "ru": "Система FPN LC активируется автоматически"
  },
  "merchant_info": {
    "en": "Merchant Information",
    "ar": "معلومات البائع",
    "fr": "Informations sur le marchand",
    "tr": "Satıcı Bilgileri",
    "zh": "商家信息",
    "ku": "زانیاری بازرگان",
    "ru": "Информация о продавце"
  },
  "verified_merchant": {
    "en": "Verified Merchant ☑️",
    "ar": "تاجر موثق ☑️",
    "fr": "Marchand vérifié ☑️",
    "tr": "Doğrulanmış Satıcı ☑️",
    "zh": "认证商家 ☑️",
    "ku": "بازرگانی باوەڕپێکراو ☑️",
    "ru": "Проверенный продавец ☑️"
  },
  "location": {
    "en": "Location",
    "ar": "الموقع",
    "fr": "Emplacement",
    "tr": "Konum",
    "zh": "位置",
    "ku": "شوێن",
    "ru": "Местоположение"
  },
  "post_date": {
    "en": "Post Date",
    "ar": "تاريخ النشر",
    "fr": "Date de publication",
    "tr": "Yayınlanma Tarihi",
    "zh": "发布日期",
    "ku": "بەرواری بڵاوکردنەوە",
    "ru": "Дата публикации"
  },
  "fpn_flow_active": {
    "en": "FPN Flow Protocol Active",
    "ar": "بروتوكول FPN Flow نشط",
    "fr": "Protocole FPN Flow actif",
    "tr": "FPN Flow Protokolü Etkin",
    "zh": "FPN Flow 协议已激活",
    "ku": "پڕۆتۆکۆڵی FPN Flow چالاکە",
    "ru": "Протокол FPN Flow активен"
  },
  "securing_funds_fpn": {
    "en": "Securing funds in FPN LC system...",
    "ar": "جاري تأمين المبلغ في نظام الاعتماد المستندي FPN...",
    "fr": "Sécurisation des fonds dans le système FPN LC...",
    "tr": "FPN LC sisteminde fonlar güvence altına alınıyor...",
    "zh": "正在 FPN LC 系统中确保资金安全...",
    "ku": "پارەکە لە سیستەمی FPN LC پارێزراو دەکرێت...",
    "ru": "Обеспечение безопасности средств в системе FPN LC..."
  },
  "fpn_flow_desc": {
    "en": "The amount is now being held from your wallet and the transaction is encrypted via Riyadh-Node-01 to guarantee your rights as a buyer.",
    "ar": "يتم الآن حجز المبلغ من محفظتك وتشفير العملية عبر Riyadh-Node-01 لضمان حقوقك كمشتري.",
    "fr": "Le montant est maintenant retenu sur votre portefeuille et la transaction est cryptée via Riyadh-Node-01 pour garantir vos droits en tant qu'acheteur.",
    "tr": "Tutar şu anda cüzdanınızdan çekiliyor ve alıcı olarak haklarınızı garanti altına almak için işlem Riyadh-Node-01 üzerinden şifreleniyor.",
    "zh": "金额正从您的钱包中扣除，交易通过 Riyadh-Node-01 加密，以保证您作为买家的权利。",
    "ku": "لە ئێستادا بڕی پارەکە لە جزدانەکەت دەگیرێت و پڕۆسەکە لە ڕێگەی Riyadh-Node-01 کۆد دەکرێت بۆ گەرەنتی کردنی مافەکانت وەک کڕیار.",
    "ru": "Сумма удерживается из вашего кошелька, а транзакция шифруется через Riyadh-Node-01 для гарантии ваших прав как покупателя."
  },
  "ad": {
    "en": "Ad",
    "ar": "الإعلان",
    "fr": "Annonce",
    "tr": "Reklam",
    "zh": "广告",
    "ku": "ڕیکلام",
    "ru": "Объявление"
  },
  "promotion_type": {
    "en": "Promotion Type",
    "ar": "نوع الترويج",
    "fr": "Type de promotion",
    "tr": "Promosyon Türü",
    "zh": "推广类型",
    "ku": "جۆری پەرەپێدان",
    "ru": "Тип продвижения"
  },
  "adjust": {
    "en": "Adjust",
    "ar": "تعديل",
    "fr": "Ajuster",
    "tr": "Ayarla",
    "zh": "调整",
    "ku": "ڕێکخستن",
    "ru": "Настроить"
  },
  "ban": {
    "en": "Ban",
    "ar": "حظر",
    "fr": "Bannir",
    "tr": "Yasakla",
    "zh": "封禁",
    "ku": "باندکردن",
    "ru": "Забанить"
  },
  "pricing": {
    "en": "Pricing",
    "ar": "تسعير",
    "fr": "Tarification",
    "tr": "Fiyatlandırma",
    "zh": "定价",
    "ku": "نرخاندن",
    "ru": "Оценка"
  },
  "no_pending_requests": {
    "en": "No pending requests currently",
    "ar": "لا توجد طلبات معلقة حالياً",
    "fr": "Aucune demande en attente pour le moment",
    "tr": "Şu anda bekleyen istek yok",
    "zh": "目前没有待处理的请求",
    "ku": "لە ئێستادا هیچ داواکارییەکی هەڵپەسێردراو نییە",
    "ru": "В настоящее время нет ожидающих запросов"
  },
  "leakage_detected": {
    "en": "Security Breach: Contact details detected in ad. Ad blocked and account automatically suspended.",
    "ar": "خرق أمني: تم اكتشاف بيانات اتصال في الإعلان. تم حظر الإعلان وتعليق حسابك تلقائياً.",
    "fr": "Violation de sécurité : Coordonnées détectées dans l'annonce. Annonce bloquée et compte automatiquement suspendu.",
    "tr": "Güvenlik İhlali: Reklamda iletişim bilgileri tespit edildi. Reklam engellendi ve hesap otomatik olarak askıya alındı.",
    "zh": "安全漏洞：广告中检测到联系方式。广告已屏蔽，账户已自动暂停。",
    "ku": "خرقێکی ئەمنی: زانیاری پەیوەندیکردن لە ڕیکلامەکەدا دۆزرایەوە. ڕیکلامەکە باندکرا و هەژمارەکەت بە شێوەیەکی ئۆتۆماتیکی ڕاگیرا.",
    "ru": "Нарушение безопасности: в объявлении обнаружены контактные данные. Объявление заблокировано, аккаунт автоматически приостановлен."
  },
  "ad_published_success": {
    "en": "Ad published successfully in FPN Exchange.",
    "ar": "تم نشر إعلانك بنجاح في بورصة FPN.",
    "fr": "Annonce publiée avec succès sur FPN Exchange.",
    "tr": "Reklam FPN Exchange'de başarıyla yayınlandı.",
    "zh": "广告已在 FPN 交易所成功发布。",
    "ku": "ڕیکلامەکەت بە سەرکەوتوویی لە بۆرسەی FPN بڵاوکرایەوە.",
    "ru": "Объявление успешно опубликовано на бирже FPN."
  },
  "promotion_request_sent": {
    "en": "Promotion request sent to admin for pricing.",
    "ar": "تم إرسال طلب الترويج للإدارة لتحديد السعر.",
    "fr": "Demande de promotion envoyée à l'administrateur pour tarification.",
    "tr": "Promosyon talebi fiyatlandırma için yöneticiye gönderildi.",
    "zh": "推广请求已发送给管理员进行定价。",
    "ku": "داواکاری پەرەپێدان بۆ کارگێڕی نێردرا بۆ دیاریکردنی نرخ.",
    "ru": "Запрос на продвижение отправлен администратору для оценки."
  },
  "promotion_paid_success": {
    "en": "Promotion fee paid. Ad is now under final review.",
    "ar": "تم دفع رسوم الترويج. الإعلان قيد المراجعة النهائية الآن.",
    "fr": "Frais de promotion payés. L'annonce est maintenant en révision finale.",
    "tr": "Promosyon ücreti ödendi. Reklam şu anda son inceleme aşamasında.",
    "zh": "推广费已支付。广告现正处于最终审核阶段。",
    "ku": "کرێی پەرەپێدان درا. ڕیکلامەکە ئێستا لە پێداچوونەوەی کۆتاییدایە.",
    "ru": "Сбор за продвижение оплачен. Объявление находится на окончательной проверке."
  },
  "promotion_activated_success": {
    "en": "Promotion activated successfully.",
    "ar": "تم تفعيل الترويج بنجاح.",
    "fr": "Promotion activée avec succès.",
    "tr": "Promosyon başarıyla etkinleştirildi.",
    "zh": "推广已成功激活。",
    "ku": "پەرەپێدان بە سەرکەوتوویی چالاککرا.",
    "ru": "Продвижение успешно активировано."
  },
  "negotiation_sent_success": {
    "en": "Your offer has been sent to the merchant.",
    "ar": "تم إرسال عرضك السعري للتاجر.",
    "fr": "Votre offre a été envoyée au marchand.",
    "tr": "Teklifiniz satıcıya gönderildi.",
    "zh": "您的报价已发送给商家。",
    "ku": "پێشنیاری نرخەکەت بۆ بازرگانەکە نێردرا.",
    "ru": "Ваше предложение отправлено продавцу."
  },
  "offer_accepted_success": {
    "en": "Offer accepted. Ad price updated.",
    "ar": "تم قبول العرض. تم تحديث سعر الإعلان.",
    "fr": "Offre acceptée. Prix de l'annonce mis à jour.",
    "tr": "Teklif kabul edildi. Reklam fiyatı güncellendi.",
    "zh": "报价已接受。广告价格已更新。",
    "ku": "پێشنیارەکە پەسەندکرا. نرخی ڕیکلامەکە نوێکرایەوە.",
    "ru": "Предложение принято. Цена объявления обновлена."
  },
  "cat_electronics": { "en": "Electronics", "ar": "إلكترونيات", "fr": "Électronique", "tr": "Elektronik", "zh": "电子产品", "ku": "ئەلکترۆنیات", "ru": "Электроника" },
  "cat_real_estate": { "en": "Real Estate", "ar": "عقارات", "fr": "Immobilier", "tr": "Emlak", "zh": "房地产", "ku": "خانووبەرە", "ru": "Недвижимость" },
  "cat_cars": { "en": "Cars", "ar": "سيارات", "fr": "Voitures", "tr": "Arabalar", "zh": "汽车", "ku": "ئۆتۆمبێل", "ru": "Автомобили" },
  "cat_services": { "en": "Services", "ar": "خدمات", "fr": "Services", "tr": "Hizmetler", "zh": "服务", "ku": "خزمەتگوزارییەکان", "ru": "Услуги" },
  "cat_fashion": { "en": "Fashion", "ar": "أزياء", "fr": "Mode", "tr": "Moda", "zh": "时尚", "ku": "فاشن", "ru": "Мода" },
  "country_saudi": { "en": "Saudi Arabia", "ar": "السعودية", "fr": "Arabie Saoudite", "tr": "Suudi Arabistan", "zh": "沙特阿拉伯", "ku": "عەرەبستانی سعوودی", "ru": "Саудовская Аравия" },
  "country_uae": { "en": "UAE", "ar": "الإمارات", "fr": "Émirats Arabes Unis", "tr": "BAE", "zh": "阿联酋", "ku": "ئیمارات", "ru": "ОАЭ" },
  "country_qatar": { "en": "Qatar", "ar": "قطر", "fr": "Qatar", "tr": "Katar", "zh": "卡塔尔", "ku": "قەتەر", "ru": "Катар" },
  "country_iraq": { "en": "Iraq", "ar": "العراق", "fr": "Irak", "tr": "Irak", "zh": "伊拉克", "ku": "عێراق", "ru": "Ирак" },
  "country_egypt": { "en": "Egypt", "ar": "مصر", "fr": "Égypte", "tr": "Mısır", "zh": "埃及", "ku": "میسر", "ru": "Египет" },
  "status_active": { "en": "Active", "ar": "نشط", "fr": "Actif", "tr": "Aktif", "zh": "活跃", "ku": "چالاک", "ru": "Активно" },
  "security_breach": { "en": "Security Breach", "ar": "خرق أمني", "fr": "Violation de sécurité", "tr": "Güvenlik İhlali", "zh": "安全漏洞", "ku": "خرقێکی ئەمنی", "ru": "Нарушение безопасности" },
  "published": { "en": "Published", "ar": "تم النشر", "fr": "Publié", "tr": "Yayınlandı", "zh": "已发布", "ku": "بڵاوکرایەوە", "ru": "Опубликовано" },
  "promotion_request": { "en": "Promotion Request", "ar": "طلب ترويج", "fr": "Demande de promotion", "tr": "Promosyon Talebi", "zh": "推广请求", "ku": "داواکاری پەرەپێدان", "ru": "Запрос на продвижение" },
  "paid": { "en": "Paid", "ar": "تم الدفع", "fr": "Payé", "tr": "Ödendi", "zh": "已支付", "ku": "درا", "ru": "Оплачено" },
  "refund": { "en": "Refund", "ar": "استرداد مبلغ", "fr": "Remboursement", "tr": "Geri Ödeme", "zh": "退款", "ku": "گەڕاندنەوەی پارە", "ru": "Возврат" },
  "success": { "en": "Success", "ar": "نجاح العملية", "fr": "Succès", "tr": "Başarılı", "zh": "成功", "ku": "سەرکەوتوو", "ru": "Успех" },
  "interest": { "en": "Interest in Ad", "ar": "اهتمام بالإعلان", "fr": "Intérêt pour l'annonce", "tr": "Reklama İlgi", "zh": "对广告感兴趣", "ku": "گرنگیپێدان بە ڕیکلام", "ru": "Интерес к объявлению" },
  "views_updated": { "en": "Views Updated", "ar": "تحديث المشاهدات", "fr": "Vues mises à jour", "tr": "Görüntülenmeler Güncellendi", "zh": "查看次数已更新", "ku": "بینینەکان نوێکرایەوە", "ru": "Просмотры обновлены" },
  "merchant_suspended_security": { "en": "Merchant suspended due to contact info leakage attempt.", "ar": "محاولة تسريب بيانات اتصال في الإعلانات", "fr": "Marchand suspendu pour tentative de fuite de coordonnées.", "tr": "İletişim bilgisi sızdırma girişimi nedeniyle satıcı askıya alındı.", "zh": "由于尝试泄露联系信息，商家已被暂停。", "ku": "هەژماری بازرگان ڕاگیرا بەهۆی هەوڵدان بۆ دزەپێکردنی زانیاری پەیوەندیکردن.", "ru": "Продавец заблокирован за попытку утечки контактных данных." },
  "admin_suspension": { "en": "Administrative suspension from Ad Exchange", "ar": "تعليق إداري من بورصة الإعلانات", "fr": "Suspension administrative de la bourse aux annonces", "tr": "Reklam Borsasından idari askıya alma", "zh": "广告交易所的行政暂停", "ku": "ڕاگرتنی کارگێڕی لە بۆرسەی ڕیکلام", "ru": "Административная блокировка на рекламной бирже" },
  "transfer_phrase_1": { "en": "Initializing encrypted connection with global payment gateway...", "ar": "جاري تهيئة الاتصال المشفر مع بوابة الدفع العالمية...", "fr": "Initialisation de la connexion cryptée avec la passerelle de paiement mondiale...", "tr": "Küresel ödeme ağ geçidi ile şifreli bağlantı başlatılıyor...", "zh": "正在初始化与全球支付网关的加密连接...", "ku": "دەستپێکردنی پەیوەندییەکی پارێزراو لەگەڵ دەروازەی پارەدانی جیهانی...", "ru": "Инициализация зашифрованного соединения с глобальным платежным шлюзом..." },
  "transfer_phrase_2": { "en": "Verifying recipient data in the unified banking registry...", "ar": "التحقق من صحة بيانات المستلم في السجل المصرفي الموحد...", "fr": "Vérification des données du destinataire dans le registre bancaire unifié...", "tr": "Birleşik bankacılık sicilinde alıcı verileri doğrulanıyor...", "zh": "正在统一银行注册中心验证收款人数据...", "ku": "پشکنینی زانیارییەکانی وەرگر لە تۆماری بانکی یەکگرتوو...", "ru": "Проверка данных получателя в едином банковском реестре..." },
  "transfer_phrase_3": { "en": "Starting digital clearing process via FastPay central system...", "ar": "بدء عملية المقاصة الرقمية عبر نظام FastPay المركزي...", "fr": "Démarrage du processus de compensation numérique via le système central FastPay...", "tr": "FastPay merkezi sistemi üzerinden dijital takas süreci başlatılıyor...", "zh": "正在通过 FastPay 中央系统启动数字清算流程...", "ku": "دەستپێکردنی پرۆسەی پاکتاوکردنی دیجیتاڵی لە ڕێگەی سیستەمی ناوەندی FastPay...", "ru": "Запуск процесса цифрового клиринга через центральную систему FastPay..." },
  "transfer_phrase_4": { "en": "Securing transaction with military-grade protection protocol...", "ar": "تأمين المعاملة ببروتوكول حماية من الدرجة العسكرية...", "fr": "Sécurisation de la transaction avec un protocole de protection de niveau militaire...", "tr": "İşlem askeri düzeyde koruma protokolü ile güvence altına alınıyor...", "zh": "使用军用级保护协议确保交易安全...", "ku": "پاراستنی مامەڵەکە بە پڕۆتۆکۆڵی پاراستنی ئاستی سەربازی...", "ru": "Обеспечение безопасности транзакции с помощью протокола защиты военного уровня..." },
  "transfer_phrase_5": { "en": "Checking compliance and anti-money laundering records...", "ar": "فحص سجلات الامتثال ومنع غسيل الأموال...", "fr": "Vérification de la conformité et des dossiers de lutte contre le blanchiment d'argent...", "tr": "Uyum ve kara para aklamayı önleme kayıtları kontrol ediliyor...", "zh": "正在检查合规性和反洗钱记录...", "ku": "پشکنینی تۆمارەکانی پابەندبوون و ڕێگری لە سپیکردنەوەی پارە...", "ru": "Проверка записей о соблюдении нормативных требований и борьбе с отмыванием денег..." },
  "transfer_phrase_6": { "en": "Completing transfer and updating balances instantly...", "ar": "إتمام عملية التحويل وتحديث الأرصدة فورياً...", "fr": "Finalisation du transfert et mise à jour instantanée des soldes...", "tr": "Transfer tamamlanıyor ve bakiyeler anında güncelleniyor...", "zh": "正在完成转账并立即更新余额...", "ku": "تەواوکردنی پرۆسەی گواستنەوە و نوێکردنەوەی باڵانسەکان بە شێوەیەکی دەستبەجێ...", "ru": "Завершение перевода и мгновенное обновление балансов..." },
  "card_link_phrase_1": { "en": "Creating encrypted communication channel with global verification servers...", "ar": "جاري إنشاء قناة اتصال مشفرة مع خوادم التحقق العالمية...", "fr": "Création d'un canal de communication crypté avec les serveurs de vérification mondiaux...", "tr": "Küresel doğrulama sunucuları ile şifreli iletişim kanalı oluşturuluyor...", "zh": "正在与全球验证服务器建立加密通信渠道...", "ku": "دروستکردنی کەناڵێکی پەیوەندی پارێزراو لەگەڵ سێرڤەرەکانی پشکنینی جیهانی...", "ru": "Создание зашифрованного канала связи с глобальными серверами верификации..." },
  "card_link_phrase_2": { "en": "Verifying card numbers via Luhn algorithm...", "ar": "التحقق من صحة أرقام البطاقة عبر خوارزمية Luhn...", "fr": "Vérification des numéros de carte via l'algorithme de Luhn...", "tr": "Luhn algoritması üzerinden kart numaraları doğrulanıyor...", "zh": "通过 Luhn 算法验证卡号...", "ku": "پشکنینی دروستی ژمارەکانی کارت لە ڕێگەی ئەلگۆریتمی Luhn...", "ru": "Проверка номеров карт с помощью алгоритма Луна..." },
  "card_link_phrase_3": { "en": "Checking international security standards PCI-DSS...", "ar": "فحص معايير الأمان الدولية PCI-DSS...", "fr": "Vérification des normes de sécurité internationales PCI-DSS...", "tr": "Uluslararası güvenlik standartları PCI-DSS kontrol ediliyor...", "zh": "正在检查国际安全标准 PCI-DSS...", "ku": "پشکنینی پێوەرە ئەمنییە نێودەوڵەتییەکانی PCI-DSS...", "ru": "Проверка международных стандартов безопасности PCI-DSS..." },
  "card_link_phrase_4": { "en": "Syncing data with global Visa/Mastercard network...", "ar": "مزامنة البيانات مع شبكة Visa/Mastercard العالمية...", "fr": "Synchronisation des données avec le réseau mondial Visa/Mastercard...", "tr": "Veriler küresel Visa/Mastercard ağı ile senkronize ediliyor...", "zh": "正在与全球 Visa/Mastercard 网络同步数据...", "ku": "هاوکاتکردنی زانیارییەکان لەگەڵ تۆڕی جیهانی Visa/Mastercard...", "ru": "Синхронизация данных с глобальной сетью Visa/Mastercard..." },
  "card_link_phrase_5": { "en": "Securing link via military encryption protocol AES-256...", "ar": "تأمين الربط عبر بروتوكول التشفير العسكري AES-256...", "fr": "Sécurisation de la liaison via le protocole de cryptage militaire AES-256...", "tr": "Bağlantı askeri şifreleme protokolü AES-256 ile güvence altına alınıyor...", "zh": "通过军事加密协议 AES-256 确保链接安全...", "ku": "پاراستنی بەستنەوەکە لە ڕێگەی پڕۆتۆکۆڵی شێفەرەکردنی سەربازی AES-256...", "ru": "Обеспечение безопасности связи с помощью военного протокола шифрования AES-256..." },
  "card_link_phrase_6": { "en": "Activating fast Swift bank withdrawal feature for this card...", "ar": "تفعيل ميزة السحب البنكي السريع Swift لهذه البطاقة...", "fr": "Activation de la fonction de retrait bancaire Swift rapide pour cette carte...", "tr": "Bu kart için hızlı Swift banka çekme özelliği etkinleştiriliyor...", "zh": "正在为此卡激活快速 Swift 银行提款功能...", "ku": "چالاککردنی تایبەتمەندی ڕاکێشانی بانکی خێرای Swift بۆ ئەم کارتە...", "ru": "Активация функции быстрого банковского вывода Swift для этой карты..." },
  "card_link_phrase_7": { "en": "Completing linking process and confirming digital identity...", "ar": "إتمام عملية الربط وتأكيد الهوية الرقمية...", "fr": "Finalisation du processus de liaison et confirmation de l'identité numérique...", "tr": "Bağlama süreci tamamlanıyor ve dijital kimlik onaylanıyor...", "zh": "正在完成链接过程并确认数字身份...", "ku": "تەواوکردنی پرۆسەی بەستنەوە و پشتڕاستکردنەوەی ناسنامەی دیجیتاڵی...", "ru": "Завершение процесса привязки и подтверждение цифровой личности..." },
  "recipient_not_found": { "en": "Recipient username not found", "ar": "اسم المستخدم المستلم غير موجود", "fr": "Nom d'utilisateur du destinataire non trouvé", "tr": "Alıcı kullanıcı adı bulunamadı", "zh": "找不到收款人用户名", "ku": "ناوی بەکارهێنەری وەرگر نەدۆزرایەوە", "ru": "Имя пользователя получателя не найдено" },
  "insufficient_balance": { "en": "Insufficient balance", "ar": "الرصيد غير كافٍ", "fr": "Solde insuffisant", "tr": "Yetersiz bakiye", "zh": "余额不足", "ku": "باڵانسەکەت بەش ناکات", "ru": "Недостаточно средств" },
  "transfer_to": { "en": "Transfer to", "ar": "تحويل إلى", "fr": "Transférer à", "tr": "Transfer et", "zh": "转账至", "ku": "گواستنەوە بۆ", "ru": "Перевод на" },
  "transfer_success_title": { "en": "Transfer Successful", "ar": "تحويل ناجح", "fr": "Transfert réussi", "tr": "Transfer Başarılı", "zh": "转账成功", "ku": "گواستنەوەکە سەرکەوتوو بوو", "ru": "Перевод успешен" },
  "transfer_success_msg": { "en": "Successfully transferred ${{amount}} to {{name}}.", "ar": "تم تحويل مبلغ ${{amount}} إلى {{name}} بنجاح.", "fr": "Transfert réussi de ${{amount}} à {{name}}.", "tr": "${{amount}} tutarı {{name}} kişisine başarıyla transfer edildi.", "zh": "成功向 {{name}} 转账 ${{amount}}。", "ku": "بڕی ${{amount}} بە سەرکەوتوویی گوازرایەوە بۆ {{name}}.", "ru": "Успешно переведено ${{amount}} пользователю {{name}}." },
  "card_expired": { "en": "Sorry, the card is expired or the expiry date is incorrect.", "ar": "عذراً، البطاقة منتهية الصلاحية أو تاريخ الانتهاء غير صحيح.", "fr": "Désolé, la carte est expirée ou la date d'expiration est incorrecte.", "tr": "Üzgünüz, kartın süresi dolmuş veya son kullanma tarihi yanlış.", "zh": "抱歉，卡已过期或过期日期不正确。", "ku": "ببوورە، کارتەکە بەسەرچووە یان بەرواری بەسەرچوونەکەی هەڵەیە.", "ru": "К сожалению, срок действия карты истек или дата истечения указана неверно." },
  "invalid_card_number": { "en": "Please enter a valid card number.", "ar": "يرجى إدخال رقم بطاقة صحيح.", "fr": "Veuillez saisir un numéro de carte valide.", "tr": "Lütfen geçerli bir kart numarası girin.", "zh": "请输入有效的卡号。", "ku": "تکایە ژمارەیەکی دروستی کارت بنووسە.", "ru": "Пожалуйста, введите правильный номер карты." },
  "card_link_success_title": { "en": "Card Linked", "ar": "ربط بطاقة", "fr": "Carte liée", "tr": "Kart Bağlandı", "zh": "卡已链接", "ku": "کارتەکە بەسترایەوە", "ru": "Карта привязана" },
  "card_link_success_msg": { "en": "Card linked successfully, Swift withdrawal request activated.", "ar": "تم ربط البطاقة بنجاح ، تم تفعيل طلب سحب Swift بنجاح", "fr": "Carte liée avec succès, demande de retrait Swift activée.", "tr": "Kart başarıyla bağlandı, Swift para çekme talebi etkinleştirildi.", "zh": "卡链接成功，Swift 提款请求已激活。", "ku": "کارتەکە بە سەرکەوتوویی بەسترایەوە، داواکاری ڕاکێشانی Swift چالاککرا.", "ru": "Карта успешно привязана, запрос на вывод Swift активирован." },
  "salary_apply_success_title": { "en": "Financing Request", "ar": "طلب تمويل", "fr": "Demande de financement", "tr": "Finansman Talebi", "zh": "融资请求", "ku": "داواکاری پارەدارکردن", "ru": "Запрос на финансирование" },
  "salary_apply_success_msg": { "en": "Financing request of ${{amount}} sent.", "ar": "تم إرسال طلب تمويل بقيمة ${{amount}}.", "fr": "Demande de financement de ${{amount}} envoyée.", "tr": "${{amount}} tutarında finansman talebi gönderildi.", "zh": "已发送 ${{amount}} 的融资请求。", "ku": "داواکاری پارەدارکردن بە بڕی ${{amount}} نێردرا.", "ru": "Запрос на финансирование в размере ${{amount}} отправлен." },
  "salary_apply_alert": { "en": "Financing request sent successfully for management review.", "ar": "تم إرسال طلب التمويل بنجاح لمراجعة الإدارة.", "fr": "Demande de financement envoyée avec succès pour examen par la direction.", "tr": "Finansman talebi yönetim incelemesi için başarıyla gönderildi.", "zh": "融资请求已成功发送供管理层审核。", "ku": "داواکاری پارەدارکردن بە سەرکەوتوویی نێردرا بۆ پێداچوونەوەی کارگێڕی.", "ru": "Запрос на финансирование успешно отправлен на рассмотрение руководству." },
  "swift_withdrawal_desc": { "en": "Swift Bank Withdrawal", "ar": "سحب Swift بنكي", "fr": "Retrait bancaire Swift", "tr": "Swift Banka Çekimi", "zh": "Swift 银行提款", "ku": "ڕاکێشانی بانکی Swift", "ru": "Банковский вывод Swift" },
  "withdraw_request_success_title": { "en": "Withdrawal Request", "ar": "طلب سحب", "fr": "Demande de retrait", "tr": "Para Çekme Talebi", "zh": "提款请求", "ku": "داواکاری ڕاکێشان", "ru": "Запрос на вывод" },
  "withdraw_request_success_msg": { "en": "Withdrawal request of ${{amount}} submitted successfully.", "ar": "تم طلب سحب مبلغ ${{amount}} بنجاح.", "fr": "Demande de retrait de ${{amount}} soumise avec succès.", "tr": "${{amount}} tutarında para çekme talebi başarıyla iletildi.", "zh": "已成功提交 ${{amount}} 的提款请求。", "ku": "داواکاری ڕاکێشان بە بڕی ${{amount}} بە سەرکەوتوویی پێشکەش کرا.", "ru": "Запрос на вывод средств в размере ${{amount}} успешно подан." },
  "withdraw_request_alert": { "en": "Withdrawal request submitted successfully.", "ar": "تم تقديم طلب السحب بنجاح.", "fr": "Demande de retrait soumise avec succès.", "tr": "Para çekme talebi başarıyla iletildi.", "zh": "提款请求已成功提交。", "ku": "داواکاری ڕاکێشان بە سەرکەوتوویی پێشکەش کرا.", "ru": "Запрос на вывод средств успешно подан." },
  "card_recharge_desc": { "en": "Card Recharge", "ar": "شحن بطاقة", "fr": "Recharge de carte", "tr": "Kart Yükleme", "zh": "卡充值", "ku": "بارگاویکردنەوەی کارت", "ru": "Пополнение карты" },
  "recharge_success_title": { "en": "Balance Recharge", "ar": "شحن رصيد", "fr": "Recharge de solde", "tr": "Bakiye Yükleme", "zh": "余额充值", "ku": "بارگاویکردنەوەی باڵانس", "ru": "Пополнение баланса" },
  "recharge_success_msg": { "en": "Successfully recharged ${{amount}}.", "ar": "تم شحن ${{amount}} بنجاح.", "fr": "Recharge de ${{amount}} réussie.", "tr": "${{amount}} başarıyla yüklendi.", "zh": "成功充值 ${{amount}}。", "ku": "بڕی ${{amount}} بە سەرکەوتوویی بارگاویکرایەوە.", "ru": "Успешно пополнено на ${{amount}}." },
  "invalid_coupon": { "en": "Invalid or already used code", "ar": "الكود غير صحيح أو مستخدم مسبقاً", "fr": "Code invalide ou déjà utilisé", "tr": "Geçersiz veya zaten kullanılmış kod", "zh": "代码无效或已使用", "ku": "کۆدەکە هەڵەیە یان پێشتر بەکارهاتووە", "ru": "Неверный или уже использованный код" },
  "min_invest_amount": { "en": "Minimum for this plan is ${{amount}}", "ar": "الحد الأدنى لهذه الخطة هو ${{amount}}", "fr": "Le minimum pour ce plan est de ${{amount}}", "tr": "Bu plan için minimum tutar ${{amount}}", "zh": "此计划的最低金额为 ${{amount}}", "ku": "کەمترین بڕ بۆ ئەم پلانە ${{amount}}", "ru": "Минимум для этого плана — ${{amount}}" },
  "invest_desc": { "en": "Investment", "ar": "استثمار", "fr": "Investissement", "tr": "Yatırım", "zh": "投资", "ku": "وەبەرهێنان", "ru": "Инвестиция" },
  "invest_start_title": { "en": "Investment Started", "ar": "بدء استثمار", "fr": "Investissement commencé", "tr": "Yatırım Başlatıldı", "zh": "投资已开始", "ku": "وەبەرهێنان دەستی پێکرد", "ru": "Инвестиция начата" },
  "invest_start_msg": { "en": "Investment plan of ${{amount}} started.", "ar": "تم بدء خطة استثمار بقيمة ${{amount}}.", "fr": "Plan d'investissement de ${{amount}} commencé.", "tr": "${{amount}} tutarında yatırım planı başlatıldı.", "zh": "已开始 ${{amount}} 的投资计划。", "ku": "پلانی وەبەرهێنان بە بڕی ${{amount}} دەستی پێکرد.", "ru": "Инвестиционный план на сумму ${{amount}} начат." },
  "invest_success_alert": { "en": "Investment started successfully!", "ar": "تم بدء الاستثمار بنجاح!", "fr": "Investissement commencé avec succès !", "tr": "Yatırım başarıyla başlatıldı!", "zh": "投资已成功开始！", "ku": "وەبەرهێنان بە سەرکەوتوویی دەستی پێکرد!", "ru": "Инвестиция успешно начата!" },
  "raffle_insufficient_balance": { "en": "Insufficient balance to join raffle", "ar": "رصيدك لا يكفي للمشاركة في القرعة", "fr": "Solde insuffisant pour participer à la tombola", "tr": "Çekilişe katılmak için yetersiz bakiye", "zh": "余额不足，无法参加抽奖", "ku": "باڵانسەکەت بەش ناکات بۆ بەشداریکردن لە تیروپشک", "ru": "Недостаточно средств для участия в лотерее" },
  "raffle_entry_desc": { "en": "Raffle Entry", "ar": "دخول سحب القرعة", "fr": "Entrée à la tombola", "tr": "Çekiliş Girişi", "zh": "抽奖报名", "ku": "بەشداریکردن لە تیروپشک", "ru": "Участие в лотерее" },
  "raffle_success_title": { "en": "Sovereign Raffle", "ar": "القرعة السيادية", "fr": "Tombola souveraine", "tr": "Egemen Çekiliş", "zh": "主权抽奖", "ku": "تیروپشکی سەروەری", "ru": "Суверенная лотерея" },
  "raffle_success_msg": { "en": "Ticket booked successfully for monthly draw.", "ar": "تم حجز تذكرتك في السحب الشهري بنجاح.", "fr": "Billet réservé avec succès pour le tirage mensuel.", "tr": "Aylık çekiliش için bilet başarıyla ayırtıldı.", "zh": "成功预订月度抽奖门票。", "ku": "تیکتەکەت بە سەرکەوتوویی بۆ تیروپشکی مانگانە بڕدرا.", "ru": "Билет на ежемесячный тираж успешно забронирован." },
  "raffle_success_alert": { "en": "Success! Your ticket number is: {{ticket}}", "ar": "تم الدخول بنجاح! رقم تذكرتك هو: {{ticket}}", "fr": "Succès ! Votre numéro de billet est : {{ticket}}", "tr": "Başarılı! Bilet numaranız: {{ticket}}", "zh": "成功！您的门票号码是：{{ticket}}", "ku": "سەرکەوتوو بوو! ژمارەی تیکتەکەت بریتییە لە: {{ticket}}", "ru": "Успех! Номер вашего билета: {{ticket}}" },
  "current_password_incorrect": { "en": "Current password is incorrect", "ar": "كلمة المرور الحالية غير صحيحة", "fr": "Le mot de passe actuel est incorrect", "tr": "Mevcut şifre yanlış", "zh": "当前密码不正确", "ku": "وشەی نهێنی ئێستا هەڵەیە", "ru": "Текущий пароль неверен" },
  "password_min_length": { "en": "New password must be at least 6 characters", "ar": "يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل", "fr": "Le nouveau mot de passe doit comporter au moins 6 caractères", "tr": "Yeni şifre en az 6 karakter olmalıdır", "zh": "新密码必须至少为 6 个字符", "ku": "وشەی نهێنی نوێ دەبێت لانی کەم ٦ پیت بێت", "ru": "Новый пароль должен содержать не менее 6 символов" },
  "passwords_dont_match": { "en": "Passwords do not match", "ar": "كلمتا المرور غير متطابقتين", "fr": "Les mots de passe ne correspondent pas", "tr": "Şifreler eşleşmiyor", "zh": "密码不匹配", "ku": "وشە نهێنییەکان وەک یەک نین", "ru": "Пароли не совпадают" },
  "password_update_success_title": { "en": "Account Security", "ar": "أمن الحساب", "fr": "Sécurité du compte", "tr": "Hesap Güvenliği", "zh": "账户安全", "ku": "ئاسایشی هەژمار", "ru": "Безопасность аккаунта" },
  "password_update_success_msg": { "en": "Password updated successfully.", "ar": "تم تحديث كلمة المرور بنجاح.", "fr": "Mot de passe mis à jour avec succès.", "tr": "Şifre başarıyla güncellendi.", "zh": "密码已成功更新。", "ku": "وشەی نهێنی بە سەرکەوتوویی نوێکرایەوە.", "ru": "Пароль успешно обновлен." },
  "verified_account_required_promo": { "en": "Sorry, your account must be verified with a blue badge to request promotion.", "ar": "عذراً، يجب أن يكون حسابك موثقاً بالشارة الزرقاء لطلب الترويج.", "fr": "Désolé, votre compte doit être vérifié avec un badge bleu pour demander une promotion.", "tr": "Üzgünüz, promosyon talep etmek için hesabınızın mavi rozetle doğrulanmış olması gerekir.", "zh": "抱歉，您的帐户必须经过蓝标验证才能请求推广。", "ku": "ببوورە، دەبێت هەژمارەکەت بە نیشانەی شین پشتڕاستکرابێتەوە بۆ داواکردنی پەرەپێدان.", "ru": "Извините, ваш аккаунт должен быть верифицирован синим значком для запроса продвижения." },
  "insufficient_balance_promo": { "en": "Insufficient balance to pay promotion fees.", "ar": "رصيدك غير كافٍ لدفع رسوم الترويج.", "fr": "Solde insuffisant pour payer les frais de promotion.", "tr": "Promosyon ücretlerini ödemek için yetersiz bakiye.", "zh": "余额不足，无法支付推广费用。", "ku": "باڵانسەکەت بەش ناکات بۆ پارەدانی تێچووی پەرەپێدان.", "ru": "Недостаточно средств для оплаты промо-сборов." },
  "insufficient_balance_generic": { "en": "Insufficient balance to complete this operation.", "ar": "رصيدك غير كافٍ لإتمام هذه العملية.", "fr": "Solde insuffisant pour terminer cette opération.", "tr": "Bu işlemi tamamlamak için yetersiz bakiye.", "zh": "余额不足，无法完成此操作。", "ku": "باڵانسەکەت بەش ناکات بۆ تەواوکردنی ئەم مامەڵەیە.", "ru": "Недостаточно средств для завершения этой операции." },
  "purchase_desc": { "en": "Purchase", "ar": "شراء", "fr": "Achat", "tr": "Satın Al", "zh": "购买", "ku": "کڕین", "ru": "Покупка" },
  "invalid_amount": { "en": "Please enter a valid amount", "ar": "يرجى إدخال مبلغ صحيح", "fr": "Veuillez saisir un montant valide", "tr": "Lütfen geçerli bir tutar girin", "zh": "请输入有效金额", "ku": "تکایە بڕێکی دروست بنووسە", "ru": "Пожалуйста, введите правильную сумму" },
  "general_location": { "en": "General", "ar": "عام", "fr": "Général", "tr": "Genel", "zh": "通用", "ku": "گشتی", "ru": "Общий" }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
}

const getBrowserLanguage = (): Language => {
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  switch (browserLang) {
    case 'ar': return Language.AR;
    case 'fr': return Language.FR;
    case 'tr': return Language.TR;
    case 'zh': return Language.ZH;
    case 'ru': return Language.RU;
    case 'ku': return Language.KU;
    default: return Language.EN;
  }
};

const getGeoLanguage = async (): Promise<Language | null> => {
  try {
    const response = await axios.get('https://ipapi.co/json/');
    const data = response.data;
    const countryCode = data.country_code;
    const city = data.city;

    if (countryCode === 'IQ' && (city === 'Erbil' || city === 'Sulaymaniyah' || city === 'Duhok')) {
      return Language.KU;
    } else if (countryCode === 'TR') {
      return Language.TR;
    } else if (['US', 'CA', 'GB', 'AU', 'NZ'].includes(countryCode)) {
      return Language.EN;
    } else if (countryCode === 'FR') {
      return Language.FR;
    } else if (countryCode === 'RU') {
      return Language.RU;
    } else if (countryCode === 'CN') {
      return Language.ZH;
    } else if (countryCode === 'SA' || countryCode === 'AE' || countryCode === 'EG') {
      return Language.AR;
    }
    return null;
  } catch (error) {
    console.error('Error fetching geo-location:', error);
    return null;
  }
};

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(Language.AR); // الافتراضي هو العربية دائماً
  const [translations, setTranslations] = useState<Translations>(translationsData);

  useEffect(() => {
    const storedLang = localStorage.getItem('user_language') as Language;
    if (storedLang && Object.values(Language).includes(storedLang)) {
      setLanguageState(storedLang);
      document.documentElement.dir = RTL_LANGUAGES.includes(storedLang) ? 'rtl' : 'ltr';
    } else {
      const detectAndSetLanguage = async () => {
        let detectedLang: Language | null = null;

        const geoLang = await getGeoLanguage();
        if (geoLang) {
          detectedLang = geoLang;
        } 
        
        // إذا لم يتم الكشف عن لغة جغرافية، نستخدم العربية مباشرة
        const finalLang = detectedLang || Language.AR;
        setLanguageState(finalLang);
        document.documentElement.dir = RTL_LANGUAGES.includes(finalLang) ? 'rtl' : 'ltr';
        localStorage.setItem('user_language', finalLang);
      };
      detectAndSetLanguage();
    }
  }, []);

  useEffect(() => {
    setTranslations(translationsData);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('user_language', lang);
    document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr';
  };

  const t = (key: string, replacements?: { [key: string]: string | number }): string => {
    if (!translations || !translations[key]) return key;
    
    let translatedText = translations[key][language] || translations[key]['ar'] || key;

    if (replacements) {
      for (const placeholder in replacements) {
        translatedText = translatedText.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
      }
    }

    return translatedText;
  };

  const isRtl = RTL_LANGUAGES.includes(language);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    isRtl,
  }), [language, setLanguage, t, isRtl]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

