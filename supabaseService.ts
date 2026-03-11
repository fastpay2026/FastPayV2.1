import { supabase } from './supabaseClient';
import { User, SiteConfig, Transaction, Notification, AdExchangeItem, AdNegotiation, RechargeCard, WithdrawalRequest, SalaryFinancing, FixedDeposit, VerificationRequest, RaffleEntry, RaffleWinner, TradeAsset, TradeOrder, LandingService, CustomPage, FXExchangeSettings, SecurityKey, FXGatewayQueue, FXDistributorStatus, SecurityConfig } from './types';

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
    try {
      // تنظيف البيانات لضمان عدم إرسال أي حقل غير موجود في SQL
      const userData = {
        id: user.id,
        username: user.username,
        full_name: String(user.fullName || ''),
        email: String(user.email || ''),
        phone_number: String(user.phoneNumber || ''),
        password: String(user.password || ''),
        role: String(user.role || 'USER'),
        balance: parseFloat(String(user.balance)) || 0,
        status: String(user.status || 'active'),
        status_reason: String(user.statusReason || ''),
        is_verified: Boolean(user.isVerified),
        verification_status: String(user.verificationStatus || 'none'),
        verification_reason: String(user.verificationReason || ''),
        linked_cards: Array.isArray(user.linkedCards) ? user.linkedCards : [],
        assets: Array.isArray(user.assets) ? user.assets : [],
        api_keys: Array.isArray(user.apiKeys) ? user.apiKeys : []
      };

      const { error } = await supabase.from('users').upsert(userData, { onConflict: 'username' });
      if (error) {
        console.error("Supabase Error Details:", error);
        throw new Error(error.message);
      }
      return true;
    } catch (err: any) {
      console.error("Critical Sync Error:", err);
      throw err;
    }
  },

  // Site Config
  async getSiteConfig(): Promise<SiteConfig | null> {
    try {
      const { data, error } = await supabase.from('site_config').select('config').eq('id', 1).maybeSingle();
      if (error) throw error;
      return data?.config || null;
    } catch (err) {
      console.error("Error fetching site config:", err);
      return null;
    }
  },

  async updateSiteConfig(config: SiteConfig) {
    try {
      // إرسال الإعدادات ككائن JSON نظيف
      const { error } = await supabase.from('site_config').upsert({ 
        id: 1, 
        config: JSON.parse(JSON.stringify(config)), // ضمان كونه JSON صالح
        updated_at: new Date().toISOString() 
      }, { onConflict: 'id' });
      
      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error("Config Sync Error:", err);
      throw err;
    }
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
    const { error } = await supabase.from('transactions').upsert({
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
    }, { onConflict: 'id' });
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
    const { error } = await supabase.from('notifications').upsert({
      id: n.id,
      user_id: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      timestamp: n.timestamp,
      is_read: n.isRead
    }, { onConflict: 'id' });
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
      imageUrl2: i.image_url_2,
      imageUrl3: i.image_url_3,
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
      image_url_2: item.imageUrl2,
      image_url_3: item.imageUrl3,
      views: item.views,
      status: item.status,
      location: item.location,
      promotion_status: item.promotionStatus,
      promotion_type: item.promotionType,
      promotion_price: item.promotionPrice,
      created_at: item.createdAt
    }, { onConflict: 'id' });
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
    }, { onConflict: 'id' });
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
    }, { onConflict: 'id' });
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
    }, { onConflict: 'id' });
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
    }, { onConflict: 'id' });
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
    }, { onConflict: 'id' });
    if (error) throw error;
  },

  // Recharge Cards
  async getRechargeCards(): Promise<RechargeCard[]> {
    const { data, error } = await supabase.from('recharge_cards').select('*');
    if (error) throw error;
    return (data || []).map(c => ({
      ...c,
      isUsed: c.is_used,
      generatedBy: c.generated_by,
      usedBy: c.used_by,
      createdAt: c.created_at,
      usedAt: c.used_at
    }));
  },

  async upsertRechargeCard(c: RechargeCard) {
    const { error } = await supabase.from('recharge_cards').upsert({
      code: c.code,
      amount: c.amount,
      is_used: c.isUsed,
      generated_by: c.generatedBy,
      used_by: c.usedBy,
      created_at: c.createdAt,
      used_at: c.usedAt
    }, { onConflict: 'code' });
    if (error) throw error;
  },

  // Raffle Entries
  async getRaffleEntries(): Promise<RaffleEntry[]> {
    const { data, error } = await supabase.from('raffle_entries').select('*');
    if (error) throw error;
    return (data || []).map(e => ({
      ...e,
      userId: e.user_id,
      fullName: e.full_name,
      ticketNumber: e.ticket_number,
      enteredAt: e.entered_at
    }));
  },

  async upsertRaffleEntry(e: RaffleEntry) {
    const { error } = await supabase.from('raffle_entries').upsert({
      id: e.id,
      user_id: e.userId,
      username: e.username,
      full_name: e.fullName,
      ticket_number: e.ticketNumber,
      entered_at: e.enteredAt
    }, { onConflict: 'id' });
    if (error) throw error;
  },

  // Raffle Winners
  async getRaffleWinners(): Promise<RaffleWinner[]> {
    const { data, error } = await supabase.from('raffle_winners').select('*');
    if (error) throw error;
    return (data || []).map(w => ({
      ...w,
      userId: w.user_id,
      fullName: w.full_name,
      prizeTitle: w.prize_title,
      wonAt: w.wonAt
    }));
  },

  async upsertRaffleWinner(w: RaffleWinner) {
    const { error } = await supabase.from('raffle_winners').upsert({
      id: w.id,
      user_id: w.userId,
      username: w.username,
      full_name: w.fullName,
      prize_title: w.prizeTitle,
      won_at: w.wonAt
    }, { onConflict: 'id' });
    if (error) throw error;
  },

  // Trade Assets
  async getTradeAssets(): Promise<TradeAsset[]> {
    const { data, error } = await supabase.from('trade_assets').select('*');
    if (error) throw error;
    return (data || []).map(a => ({
      ...a,
      change24h: a.change_24h,
      isFrozen: a.is_frozen,
      trendBias: a.trend_bias
    }));
  },

  async upsertTradeAsset(a: TradeAsset) {
    const { error } = await supabase.from('trade_assets').upsert({
      id: a.id,
      name: a.name,
      symbol: a.symbol,
      price: a.price,
      change_24h: a.change24h,
      type: a.type,
      icon: a.icon,
      is_frozen: a.isFrozen,
      trend_bias: a.trendBias
    }, { onConflict: 'id' });
    if (error) throw error;
  },

  // Trade Orders
  async getTradeOrders(): Promise<TradeOrder[]> {
    const { data, error } = await supabase.from('trade_orders').select('*');
    if (error) throw error;
    return (data || []).map(o => ({
      ...o,
      userId: o.user_id,
      assetSymbol: o.asset_symbol,
      entryPrice: o.entry_price
    }));
  },

  async upsertTradeOrder(o: TradeOrder) {
    const { error } = await supabase.from('trade_orders').upsert({
      id: o.id,
      user_id: o.userId,
      username: o.username,
      asset_symbol: o.assetSymbol,
      amount: o.amount,
      entry_price: o.entryPrice,
      type: o.type,
      status: o.status,
      timestamp: o.timestamp
    }, { onConflict: 'id' });
    if (error) throw error;
  },

  // Landing Services
  async getLandingServices(): Promise<LandingService[]> {
    const { data, error } = await supabase.from('landing_services').select('*');
    if (error) throw error;
    return data || [];
  },

  async upsertLandingService(s: LandingService) {
    const { error } = await supabase.from('landing_services').upsert({
      id: s.id,
      title: s.title,
      description: s.description,
      icon: s.icon
    }, { onConflict: 'id' });
    if (error) throw error;
  },

  // Custom Pages
  async getCustomPages(): Promise<CustomPage[]> {
    const { data, error } = await supabase.from('custom_pages').select('*');
    if (error) throw error;
    return (data || []).map(p => ({
      ...p,
      isActive: p.is_active,
      showInNavbar: p.show_in_navbar,
      showInFooter: p.show_in_footer
    }));
  },

  async upsertCustomPage(p: CustomPage) {
    const { error } = await supabase.from('custom_pages').upsert({
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content,
      is_active: p.isActive,
      show_in_navbar: p.showInNavbar,
      show_in_footer: p.showInFooter
    }, { onConflict: 'id' });
    if (error) throw error;
  },

  // Bulk Operations
  async bulkUpsertTransactions(items: Transaction[]) {
    const payload = items.map(t => ({
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
    }));
    const { error } = await supabase.from('transactions').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async bulkUpsertNotifications(items: Notification[]) {
    const payload = items.map(n => ({
      id: n.id,
      user_id: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      timestamp: n.timestamp,
      is_read: n.isRead
    }));
    const { error } = await supabase.from('notifications').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async bulkUpsertAdItems(items: AdExchangeItem[]) {
    const payload = items.map(item => ({
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
    }));
    const { error } = await supabase.from('ad_exchange_items').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async bulkUpsertRechargeCards(items: RechargeCard[]) {
    const payload = items.map(c => ({
      code: c.code,
      amount: c.amount,
      is_used: c.isUsed,
      generated_by: c.generatedBy,
      used_by: c.usedBy,
      created_at: c.createdAt,
      used_at: c.usedAt
    }));
    const { error } = await supabase.from('recharge_cards').upsert(payload, { onConflict: 'code' });
    if (error) throw error;
  },

  async bulkUpsertWithdrawals(items: WithdrawalRequest[]) {
    const payload = items.map(w => ({
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
    }));
    const { error } = await supabase.from('withdrawal_requests').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async bulkUpsertSalaryFinancing(items: SalaryFinancing[]) {
    const payload = items.map(s => ({
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
    }));
    const { error } = await supabase.from('salary_financing').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async bulkUpsertFixedDeposits(items: FixedDeposit[]) {
    const payload = items.map(d => ({
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
    }));
    const { error } = await supabase.from('fixed_deposits').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async bulkUpsertTradeOrders(items: TradeOrder[]) {
    const payload = items.map(o => ({
      id: o.id,
      user_id: o.userId,
      username: o.username,
      asset_symbol: o.assetSymbol,
      amount: o.amount,
      entry_price: o.entryPrice,
      type: o.type,
      status: o.status,
      timestamp: o.timestamp
    }));
    const { error } = await supabase.from('trade_orders').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async bulkUpsertRaffleEntries(items: RaffleEntry[]) {
    const payload = items.map(e => ({
      id: e.id,
      user_id: e.userId,
      username: e.username,
      full_name: e.fullName,
      ticket_number: e.ticketNumber,
      entered_at: e.enteredAt
    }));
    const { error } = await supabase.from('raffle_entries').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async bulkUpsertRaffleWinners(items: RaffleWinner[]) {
    const payload = items.map(w => ({
      id: w.id,
      user_id: w.userId,
      username: w.username,
      full_name: w.fullName,
      prize_title: w.prizeTitle,
      won_at: w.wonAt
    }));
    const { error } = await supabase.from('raffle_winners').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async bulkUpsertVerifications(items: VerificationRequest[]) {
    const payload = items.map(v => ({
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
    }));
    const { error } = await supabase.from('verification_requests').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  // FX Exchange Settings
  async getFXExchangeSettings(): Promise<FXExchangeSettings | null> {
    const { data, error } = await supabase.from('fx_exchange_settings').select('*').limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      usdtBuyRate: data.usdt_buy_rate,
      usdtSellRate: data.usdt_sell_rate,
      gatewayFeePercent: data.gateway_fee_percent,
      minTransferAmount: data.min_transfer_amount,
      isGatewayActive: data.is_gateway_active,
      updatedAt: data.updated_at
    };
  },

  async upsertFXExchangeSettings(s: FXExchangeSettings) {
    const { error } = await supabase.from('fx_exchange_settings').upsert({
      id: s.id,
      usdt_buy_rate: s.usdtBuyRate,
      usdt_sell_rate: s.usdtSellRate,
      gateway_fee_percent: s.gatewayFeePercent,
      min_transfer_amount: s.minTransferAmount,
      is_gateway_active: s.isGatewayActive,
      updated_at: s.updatedAt
    }, { onConflict: 'id' });
    if (error) throw error;
  },

  // Distributor Security Keys
  async getDistributorSecurityKeys(): Promise<SecurityKey[]> {
    const { data, error } = await supabase.from('distributor_security_keys').select('*');
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      distributorId: r.distributor_id,
      vendorId: r.vendor_id,
      productId: r.product_id,
      serialNumber: r.serial_number,
      lastUsed: r.last_used,
      createdAt: r.created_at
    }));
  },

  async upsertDistributorSecurityKey(r: SecurityKey) {
    console.log(`Attempting upsert for security key, distributor_id: ${r.distributorId}`);
    try {
      const { error } = await supabase.from('distributor_security_keys').upsert({
        id: r.id,
        distributor_id: r.distributorId,
        vendor_id: r.vendorId,
        product_id: r.productId,
        serial_number: r.serialNumber,
        status: r.status,
        last_used: r.lastUsed,
        created_at: r.createdAt
      }, { onConflict: 'id' });
      
      if (error) {
        if (error.code === '23503') {
          console.error(`Foreign Key Violation: The distributor_id ${r.distributorId} does not exist in the users table.`);
          throw new Error(`الموزع المحدد غير موجود في قاعدة البيانات (ID: ${r.distributorId})`);
        }
        console.error("Supabase Security Key Error:", error);
        throw error;
      }
    } catch (err: any) {
      console.error("Critical Security Key Error for ID:", r.distributorId, err);
      throw err;
    }
  },

  // Distributor Security Configs
  async getDistributorSecurityConfigs(): Promise<SecurityConfig[]> {
    const { data, error } = await supabase.from('distributor_security_configs').select('*');
    if (error) throw error;
    return (data || []).map(c => ({
      distributorId: c.distributor_id,
      securityPin: c.security_pin,
      updatedAt: c.updated_at
    }));
  },

  async upsertDistributorSecurityConfig(c: SecurityConfig) {
    console.log(`Attempting upsert for distributor_id: ${c.distributorId}`);
    try {
      const { error } = await supabase.from('distributor_security_configs').upsert({
        distributor_id: c.distributorId,
        security_pin: c.securityPin,
        updated_at: c.updatedAt
      }, { onConflict: 'distributor_id' });
      
      if (error) {
        if (error.code === '23503') {
          console.error(`Foreign Key Violation: The distributor_id ${c.distributorId} does not exist in the users table.`);
          throw new Error(`الموزع المحدد غير موجود في قاعدة البيانات (ID: ${c.distributorId})`);
        }
        console.error("Supabase Security Config Error:", error);
        throw error;
      }
    } catch (err: any) {
      console.error("Critical Security Config Error for ID:", c.distributorId, err);
      throw err;
    }
  },

  // FX Gateway Queue
  async getFXGatewayQueue(): Promise<FXGatewayQueue[]> {
    const { data, error } = await supabase.from('fx_gateway_queue').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(q => ({
      ...q,
      userId: q.user_id,
      distributorId: q.distributor_id,
      walletAddress: q.wallet_address,
      totalAmount: q.total_amount,
      receipt_image: q.receipt_image,
      tx_id: q.tx_id,
      createdAt: q.created_at,
      updatedAt: q.updated_at
    }));
  },

  async upsertFXGatewayQueue(q: FXGatewayQueue) {
    const { error } = await supabase.from('fx_gateway_queue').upsert({
      id: q.id,
      user_id: q.userId,
      distributor_id: q.distributorId,
      amount: q.amount,
      fee: q.fee,
      total_amount: q.totalAmount,
      wallet_address: q.walletAddress,
      status: q.status,
      receipt_image: q.receipt_image,
      tx_id: q.tx_id,
      created_at: q.createdAt,
      updated_at: q.updatedAt
    }, { onConflict: 'id' });
    if (error) throw error;
  },

  // FX Distributor Status
  async getFXDistributorStatuses(): Promise<FXDistributorStatus[]> {
    const { data, error } = await supabase.from('fx_distributor_status').select('*');
    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      distributorId: s.distributor_id,
      usdtCapacity: s.usdt_capacity,
      availabilityStatus: s.availability_status,
      delayInfo: s.delay_info,
      lastUpdated: s.last_updated
    }));
  },

  async upsertFXDistributorStatus(s: FXDistributorStatus) {
    const { error } = await supabase.from('fx_distributor_status').upsert({
      distributor_id: s.distributorId,
      usdt_capacity: s.usdtCapacity,
      availability_status: s.availabilityStatus,
      delay_info: s.delayInfo,
      last_updated: s.lastUpdated
    }, { onConflict: 'distributor_id' });
    if (error) throw error;
  }
};
