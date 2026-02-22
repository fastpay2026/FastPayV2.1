import { supabase } from './supabaseClient';
import { User, SiteConfig, Transaction, Notification, AdExchangeItem, AdNegotiation, RechargeCard, WithdrawalRequest, SalaryFinancing, FixedDeposit, VerificationRequest, RaffleEntry, RaffleWinner, TradeAsset, TradeOrder, LandingService, CustomPage } from './types';

export const supabaseService = {
  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map(u => ({
      ...u,
      fullName: u.full_name,
      phoneNumber: u.phone_number,
      verificationStatus: u.verification_status,
      verificationReason: u.verification_reason,
      createdAt: u.created_at,
      linkedCards: u.linked_cards,
      assets: u.assets,
      apiKeys: u.api_keys
    }));
  },

  async updateUser(user: User) {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      username: user.username,
      full_name: user.fullName,
      email: user.email,
      phone_number: user.phoneNumber,
      password: user.password,
      role: user.role,
      balance: user.balance,
      status: user.status,
      status_reason: user.statusReason,
      is_verified: user.isVerified,
      verification_status: user.verificationStatus,
      verification_reason: user.verificationReason,
      linked_cards: user.linkedCards,
      assets: user.assets,
      api_keys: user.apiKeys
    });
    if (error) throw error;
  },

  // Site Config
  async getSiteConfig(): Promise<SiteConfig | null> {
    const { data, error } = await supabase.from('site_config').select('config').eq('id', 1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data?.config || null;
  },

  async updateSiteConfig(config: SiteConfig) {
    const { error } = await supabase.from('site_config').upsert({ id: 1, config, updated_at: new Date().toISOString() });
    if (error) throw error;
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(t => ({
      ...t,
      userId: t.user_id,
      relatedUser: t.related_user,
      relatedId: t.related_id
    }));
  },

  async addTransaction(t: Transaction) {
    const { error } = await supabase.from('transactions').insert({
      id: t.id,
      user_id: t.userId,
      type: t.type,
      amount: t.amount,
      related_user: t.relatedUser,
      related_id: t.relatedId,
      timestamp: t.timestamp,
      status: t.status,
      hash: t.hash,
      notes: t.notes
    });
    if (error) throw error;
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return (data || []).map(n => ({
      ...n,
      userId: n.user_id,
      isRead: n.is_read
    }));
  },

  async addNotification(n: Notification) {
    const { error } = await supabase.from('notifications').insert({
      id: n.id,
      user_id: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      timestamp: n.timestamp,
      is_read: n.isRead
    });
    if (error) throw error;
  },

  async markNotificationRead(id: string) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  // Ad Exchange
  async getAdItems(): Promise<AdExchangeItem[]> {
    const { data, error } = await supabase.from('ad_exchange_items').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(i => ({
      ...i,
      merchantId: i.merchant_id,
      merchantName: i.merchant_name,
      imageUrl: i.image_url,
      promotionStatus: i.promotion_status,
      promotionType: i.promotion_type,
      promotionPrice: i.promotion_price,
      createdAt: i.created_at
    }));
  },

  async upsertAdItem(item: AdExchangeItem) {
    const { error } = await supabase.from('ad_exchange_items').upsert({
      id: item.id,
      merchant_id: item.merchantId,
      merchant_name: item.merchantName,
      title: item.title,
      description: item.description,
      price: item.price,
      is_negotiable: item.isNegotiable,
      category: item.category,
      image_url: item.imageUrl,
      views: item.views,
      status: item.status,
      location: item.location,
      promotion_status: item.promotionStatus,
      promotion_type: item.promotionType,
      promotion_price: item.promotionPrice,
      created_at: item.createdAt
    });
    if (error) throw error;
  },

  // Ad Negotiations
  async getAdNegotiations(): Promise<AdNegotiation[]> {
    const { data, error } = await supabase.from('ad_negotiations').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(n => ({
      ...n,
      adId: n.ad_id,
      buyerId: n.buyer_id,
      buyerName: n.buyer_name,
      offerAmount: n.offer_amount,
      createdAt: n.created_at
    }));
  },

  async upsertAdNegotiation(n: AdNegotiation) {
    const { error } = await supabase.from('ad_negotiations').upsert({
      id: n.id,
      ad_id: n.adId,
      buyer_id: n.buyerId,
      buyer_name: n.buyerName,
      offer_amount: n.offerAmount,
      status: n.status,
      created_at: n.createdAt
    });
    if (error) throw error;
  },

  // Withdrawal Requests
  async getWithdrawals(): Promise<WithdrawalRequest[]> {
    const { data, error } = await supabase.from('withdrawal_requests').select('*').order('requested_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(w => ({
      ...w,
      userId: w.user_id,
      fullName: w.full_name,
      bankName: w.bank_name,
      swiftCode: w.swift_code,
      requestedAt: w.requested_at,
      processedAt: w.processed_at
    }));
  },

  async upsertWithdrawal(w: WithdrawalRequest) {
    const { error } = await supabase.from('withdrawal_requests').upsert({
      id: w.id,
      user_id: w.userId,
      username: w.username,
      full_name: w.fullName,
      amount: w.amount,
      bank_name: w.bankName,
      iban: w.iban,
      swift_code: w.swiftCode,
      status: w.status,
      requested_at: w.requestedAt,
      processed_at: w.processedAt
    });
    if (error) throw error;
  },

  // Salary Financing
  async getSalaryFinancing(): Promise<SalaryFinancing[]> {
    const { data, error } = await supabase.from('salary_financing').select('*').order('requested_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      userId: s.user_id,
      beneficiaryName: s.beneficiary_name,
      startDate: s.start_date,
      requestedAt: s.requested_at
    }));
  },

  async upsertSalaryFinancing(s: SalaryFinancing) {
    const { error } = await supabase.from('salary_financing').upsert({
      id: s.id,
      user_id: s.userId,
      username: s.username,
      beneficiary_name: s.beneficiaryName,
      amount: s.amount,
      deduction: s.deduction,
      duration: s.duration,
      start_date: s.startDate,
      status: s.status,
      requested_at: s.requestedAt
    });
    if (error) throw error;
  },

  // Fixed Deposits
  async getFixedDeposits(): Promise<FixedDeposit[]> {
    const { data, error } = await supabase.from('fixed_deposits').select('*').order('start_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      userId: d.user_id,
      interestRate: d.interest_rate,
      durationMonths: d.duration_months,
      startDate: d.start_date,
      endDate: d.end_date,
      expectedProfit: d.expected_profit
    }));
  },

  async upsertFixedDeposit(d: FixedDeposit) {
    const { error } = await supabase.from('fixed_deposits').upsert({
      id: d.id,
      user_id: d.userId,
      username: d.username,
      amount: d.amount,
      interest_rate: d.interestRate,
      duration_months: d.durationMonths,
      start_date: d.startDate,
      end_date: d.endDate,
      expected_profit: d.expectedProfit,
      status: d.status
    });
    if (error) throw error;
  },

  // Verification Requests
  async getVerifications(): Promise<VerificationRequest[]> {
    const { data, error } = await supabase.from('verification_requests').select('*').order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(v => ({
      ...v,
      userId: v.user_id,
      fullName: v.full_name,
      idFront: v.id_front,
      idBack: v.id_back,
      commercialRegister: v.commercial_register,
      submittedAt: v.submitted_at,
      rejectionReason: v.rejection_reason
    }));
  },

  async upsertVerification(v: VerificationRequest) {
    const { error } = await supabase.from('verification_requests').upsert({
      id: v.id,
      user_id: v.userId,
      username: v.username,
      full_name: v.fullName,
      id_front: v.idFront,
      id_back: v.idBack,
      commercial_register: v.commercialRegister,
      submitted_at: v.submittedAt,
      status: v.status,
      rejection_reason: v.rejectionReason
    });
    if (error) throw error;
  }
};
