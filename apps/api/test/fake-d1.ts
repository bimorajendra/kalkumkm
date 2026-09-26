import type { OrderRow } from '../src/db/schema';

class FakeStatement {
  private values: unknown[] = [];
  constructor(
    private readonly db: FakeD1,
    private readonly sql: string,
  ) {}
  bind(...values: unknown[]): FakeStatement {
    this.values = values;
    return this;
  }
  async first<T>(): Promise<T | null> {
    return this.db.first<T>(this.sql, this.values);
  }
  async all<T>(): Promise<{ results: T[] }> {
    return this.db.all<T>(this.sql, this.values);
  }
  async run<T>(): Promise<{
    results?: T[];
    meta: { changes: number };
    success: true;
  }> {
    return this.db.run<T>(this.sql, this.values);
  }
}

export class FakeD1 {
  orders: OrderRow[] = [];
  rates = new Map<string, number>();
  rateKeys: string[] = [];
  rateLimitDeletes = 0;
  prepare(sql: string): FakeStatement {
    return new FakeStatement(
      this,
      sql.replace(/\s+/g, ' ').trim().toLowerCase(),
    );
  }
  async batch(statements: FakeStatement[]) {
    const results = [];
    for (const statement of statements) results.push(await statement.run());
    return results;
  }

  first<T>(sql: string, values: unknown[]): T | null {
    if (sql.includes('insert into rate_limits')) {
      const key = String(values[0]);
      const window = String(values[1]);
      const composite = `${key}:${window}`;
      const count = this.rates.get(composite) ?? 0;
      this.rateKeys.push(key);
      if (count >= 5) return null;
      this.rates.set(composite, count + 1);
      return { count: count + 1 } as T;
    }
    return null;
  }

  all<T>(sql: string, values: unknown[]): { results: T[] } {
    if (sql.includes('select * from orders')) {
      const rows = String(values[0] ?? '')
        ? this.orders.filter((order) => order.status === values[0])
        : this.orders;
      return { results: [...rows] as T[] };
    }
    return { results: [] };
  }

  run<T>(
    sql: string,
    values: unknown[],
  ): { results?: T[]; meta: { changes: number }; success: true } {
    if (sql.startsWith('insert into orders')) {
      const [
        id,
        businessName,
        whatsapp,
        productType,
        source,
        consentAt,
        createdAt,
      ] = values;
      this.orders.push({
        id: String(id),
        business_name: String(businessName),
        customer_name: null,
        email: null,
        whatsapp: String(whatsapp),
        product_type: String(productType),
        status: 'waitlist',
        price_idr: null,
        pay_method: null,
        mayar_invoice_id: null,
        claim_token_hash: null,
        paid_at: null,
        licensed_at: null,
        terminal_at: null,
        source: source ? String(source) : null,
        consent_at: String(consentAt),
        created_at: String(createdAt),
      });
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith('update orders')) {
      const [price, method, paidAt, id] = values;
      const order = this.orders.find(
        (candidate) =>
          candidate.id === id &&
          ['waitlist', 'preorder'].includes(candidate.status),
      );
      if (!order) return { meta: { changes: 0 }, success: true };
      order.status = 'paid';
      order.price_idr = Number(price);
      order.pay_method = method as OrderRow['pay_method'];
      order.paid_at = String(paidAt);
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith('delete from orders where id')) {
      const before = this.orders.length;
      this.orders = this.orders.filter((order) => order.id !== values[0]);
      return { meta: { changes: before - this.orders.length }, success: true };
    }
    if (sql.startsWith('delete from orders where status')) {
      const before = this.orders.length;
      this.orders = this.orders.filter(
        (order) =>
          !(
            order.status === 'waitlist' && order.created_at < String(values[0])
          ),
      );
      return { meta: { changes: before - this.orders.length }, success: true };
    }
    if (sql.startsWith('delete from rate_limits')) {
      this.rateLimitDeletes += 1;
      return { meta: { changes: 1 }, success: true };
    }
    return { meta: { changes: 0 }, success: true };
  }
}
