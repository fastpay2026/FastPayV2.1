
export type Role = 'DEVELOPER' | 'ADMIN' | 'MERCHANT' | 'USER' | 'ACCOUNTANT' | 'DISTRIBUTOR' | 'GUEST';

export interface BankCard {
  id: string;
  number: string;
  type: 'visa' | 'mastercard' | 'unknown';
  expiry: string;
  cvc: string;
  holder: string;
}

export interface UserAsset {
  assetId: string;
  symbol: string;
  amount: number;
}

export interface APIKey {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  status: 'active' | 'revoked';
  requests: number;
  lastUsed?: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  role: Role;
  balance: number;
  status: 'active' | 'suspended' | 'disabled';
  statusReason?: string;
  isVerified?: boolean;
  verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  verificationReason?: string;
  createdAt: string;
  linkedCards?: BankCard[];
  assets?: UserAsset[];
  apiKeys?: APIKey[];
  isBot?: boolean;
}

export interface TradeAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  type: 'crypto' | 'commodity' | 'stock';
  icon: string;
  isFrozen?: boolean;
  trendBias?: 'up' | 'down' | 'neutral';
}

export interface TradeOrder {
  id: string;
  userId: string;
  username: string;
  assetSymbol: string;
  amount: number;
  entryPrice: number;
  type: 'buy' | 'sell';
  status: 'open' | 'closed_profit' | 'closed_loss' | 'cancelled';
  timestamp: string;
}

export interface DepositPlan {
  id: string;
  name: string;
  rate: number;
  durationMonths: number;
  minAmount: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  amount: number;
  bankName: string;
  iban: string;
  swiftCode: string;
  status: 'pending' | 'approved' | 'rejected' | 'auditing';
  requestedAt: string;
  processedAt?: string;
}

export interface SalaryFinancing {
  id: string;
  userId: string;
  username: string;
  beneficiaryName: string;
  amount: number;
  deduction: number; 
  duration: number; 
  startDate: string;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  requestedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'send' | 'receive' | 'redeem' | 'generate_card' | 'bank_transfer' | 'salary_financing' | 'fixed_deposit' | 'trade_buy' | 'trade_sell' | 'raffle_entry' | 'withdrawal';
  amount: number;
  relatedUser?: string; 
  relatedId?: string; 
  timestamp: string;
  status?: 'pending' | 'completed' | 'shipped' | 'escrow' | 'rejected';
  hash?: string;
  notes?: string;
}

export interface LandingService {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  showInNavbar: boolean;
  showInFooter: boolean;
}

export interface Advertisement {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'user' | 'money' | 'system' | 'security';
  timestamp: string;
  isRead: boolean;
}

export interface RechargeCard {
  code: string;
  amount: number;
  isUsed: boolean;
  generatedBy: string;
  usedBy?: string;
  createdAt: string;
  usedAt?: string;
}

export interface FixedDeposit {
  id: string;
  userId: string;
  username: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  startDate: string;
  endDate: string;
  expectedProfit: number;
  status: 'active' | 'matured' | 'cancelled';
}

export interface VerificationRequest {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  idFront: string; // base64
  idBack: string; // base64
  commercialRegister: string; // base64
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface RaffleEntry {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  ticketNumber: string;
  enteredAt: string;
}

export interface RaffleWinner {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  prizeTitle: string;
  wonAt: string;
}

export interface AdExchangeItem {
  id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  description: string;
  price: number;
  isNegotiable: boolean;
  category: string;
  imageUrl: string;
  imageUrl2?: string;
  imageUrl3?: string;
  views: number;
  status: 'active' | 'suspended' | 'sold';
  location: {
    country: string;
    state: string;
    city: string;
  };
  promotionStatus: 'none' | 'requested' | 'pending_review' | 'active' | 'rejected';
  promotionType?: 'network' | 'network_home';
  promotionPrice?: number;
  createdAt: string;
}

export interface AdNegotiation {
  id: string;
  adId: string;
  buyerId: string;
  buyerName: string;
  offerAmount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface NegotiationOffer {
  id: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface MarketplaceAd {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  isNegotiable: boolean;
  status: 'active' | 'sold' | 'completed' | 'blocked';
  createdAt: string;
  offers: NegotiationOffer[];
}

export interface SiteConfig {
  logoUrl: string;
  logoWidth: number;
  logoPosition: 'right' | 'center' | 'left';
  networkBalance: number;
  primaryColor: string;
  secondaryColor: string;
  siteName: string;
  template: string; 
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  salesCtaText: string;
  servicesTitle: string;
  servicesSubtitle: string;
  galleryTitle: string;
  footerAbout: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  footerLinksTitle: string;
  footerLink1Text: string;
  footerLink2Text: string;
  footerLink3Text: string;
  footerLink4Text: string;
  contactSectionTitle: string;
  galleryImages: string[];
  merchantFeeType: 'fixed' | 'percent';
  merchantFeeValue: number;
  userFeeType: 'fixed' | 'percent';
  userFeeValue: number;
  depositPlans: DepositPlan[];
  ads: Advertisement[];
  salaryAdTitle: string;
  salaryAdDesc: string;
  salaryAdImage: string;
  tradingAdTitle: string;
  tradingAdDesc: string;
  tradingAdImage: string;
  raffleAdTitle: string;
  raffleAdDesc: string;
  raffleAdImage: string;
  transferAdTitle: string;
  transferAdDesc: string;
  transferAdImage: string;
  gatewayAdTitle: string;
  gatewayAdDesc: string;
  gatewayAdImage: string;
  raffleEntryCost: number;
  rafflePrizeType: string;
  showRaffleCountdown: boolean;
  raffleEndDate: string;
  isTradingEnabled: boolean;
  disabledServices?: string[];
}

export interface FXExchangeSettings {
  id: string;
  usdt_buy_rate: number;
  usdt_sell_rate: number;
  gateway_fee_percent: number;
  min_transfer_amount: number;
  is_gateway_active: boolean;
  updated_at: string;
}

export interface SecurityKey {
  id: string;
  distributor_id: string;
  vendor_id: number;
  product_id: number;
  serial_number: string;
  status: 'active' | 'revoked';
  last_used?: string;
  created_at: string;
}

export interface SecurityConfig {
  distributor_id: string;
  security_pin: string;
  updated_at: string;
}

export interface FXGatewayQueue {
  id: string;
  user_id: string;
  distributor_id?: string;
  amount: number;
  fee: number;
  total_amount: number;
  status: 'pending' | 'pending_distributor' | 'handshake_complete' | 'proof_uploaded' | 'success_pending_review' | 'completed' | 'rejected';
  wallet_address: string;
  receipt_image?: string;
  tx_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FXDistributorStatus {
  distributor_id: string;
  usdt_capacity: number;
  availability_status: 'online' | 'offline' | 'delayed';
  delay_info?: string;
  updated_at: string;
}

declare global {
  interface Navigator {
    usb: {
      getDevices(): Promise<any[]>;
      requestDevice(options: { filters: any[] }): Promise<any>;
    };
  }
}
