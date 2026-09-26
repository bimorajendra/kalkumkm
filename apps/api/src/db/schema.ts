export type OrderStatus =
  | 'waitlist'
  | 'preorder'
  | 'checkout'
  | 'paid'
  | 'licensed'
  | 'refunded'
  | 'cancelled';
export type PayMethod = 'transfer' | 'qris' | 'mayar';

export interface OrderRow {
  id: string;
  business_name: string;
  customer_name: string | null;
  email: string | null;
  whatsapp: string;
  product_type: string | null;
  status: OrderStatus;
  price_idr: number | null;
  pay_method: PayMethod | null;
  mayar_invoice_id: string | null;
  claim_token_hash: string | null;
  paid_at: string | null;
  licensed_at: string | null;
  terminal_at: string | null;
  source: string | null;
  consent_at: string;
  created_at: string;
}
