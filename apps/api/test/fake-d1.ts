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
  licenses: Array<{
    id: string;
    order_id: string;
    plan: string;
    issued_at: string;
    license_code: string | null;
  }> = [];
  webhookEvents: Array<Record<string, unknown>> = [];
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
    if (sql.startsWith('select id, business_name, whatsapp from orders')) {
      const order = this.orders.find(
        (row) => row.id === values[0] && row.status === 'paid',
      );
      return order
        ? ({
            id: order.id,
            business_name: order.business_name,
            whatsapp: order.whatsapp,
          } as T)
        : null;
    }
    if (sql.startsWith('select count(*) as count from orders')) {
      return {
        count: this.orders.filter(
          (order) =>
            order.price_idr === values[0] &&
            ['paid', 'licensed', 'refunded'].includes(order.status),
        ).length,
      } as T;
    }
    if (sql.startsWith('select license_code from licenses')) {
      const license = this.licenses.find((row) => row.order_id === values[0]);
      return license ? ({ license_code: license.license_code } as T) : null;
    }
    if (sql.startsWith('select * from orders where mayar_invoice_id = ?')) {
      return (
        (this.orders.find((row) => row.mayar_invoice_id === values[0]) as T) ??
        null
      );
    }
    if (sql.startsWith('select * from orders where id = ?')) {
      const order = this.orders.find((row) => row.id === values[0]);
      if (!order) return null;
      if (
        sql.includes("status in ('checkout', 'paid')") &&
        !['checkout', 'paid'].includes(order.status)
      )
        return null;
      if (sql.includes("status = 'paid'") && order.status !== 'paid')
        return null;
      return order as T;
    }
    if (
      sql.startsWith(
        'select orders.business_name, orders.whatsapp, licenses.license_code',
      )
    ) {
      const order = this.orders.find(
        (row) => row.id === values[0] && row.status === 'licensed',
      );
      const license = this.licenses.find((row) => row.order_id === values[0]);
      return order && license
        ? ({
            business_name: order.business_name,
            whatsapp: order.whatsapp,
            license_code: license.license_code,
          } as T)
        : null;
    }
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
    if (sql.includes('lower(email) = lower(?)')) {
      const rows = this.orders.filter(
        (row) =>
          row.email?.toLowerCase() === String(values[0]).toLowerCase() &&
          ['checkout', 'paid'].includes(row.status) &&
          row.created_at >= String(values[1]),
      );
      return { results: rows.slice(0, 2) as T[] };
    }
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
    if (sql.startsWith('insert into licenses')) {
      if (sql.includes('not exists')) {
        const [
          licenseId,
          orderId,
          issuedAt,
          licenseCode,
          existsOrderId,
          amount,
        ] = values;
        const order = this.orders.find(
          (row) =>
            row.id === existsOrderId &&
            row.status === 'paid' &&
            row.price_idr === amount,
        );
        if (!order || this.licenses.some((row) => row.order_id === orderId))
          return { meta: { changes: 0 }, success: true };
        this.licenses.push({
          id: String(licenseId),
          order_id: String(orderId),
          plan: 'pro',
          issued_at: String(issuedAt),
          license_code: String(licenseCode),
        });
        return { meta: { changes: 1 }, success: true };
      }
      const [licenseId, orderId, issuedAt, licenseCode] = values;
      if (
        !this.orders.some((row) => row.id === orderId && row.status === 'paid')
      )
        return { meta: { changes: 0 }, success: true };
      this.licenses.push({
        id: String(licenseId),
        order_id: String(orderId),
        plan: 'pro',
        issued_at: String(issuedAt),
        license_code: typeof licenseCode === 'string' ? licenseCode : null,
      });
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith('insert or ignore into webhook_events')) {
      const [id, eventKey, invoiceId, payload, receivedAt] = values;
      if (this.webhookEvents.some((row) => row.event_key === eventKey))
        return { meta: { changes: 0 }, success: true };
      this.webhookEvents.push({
        id,
        event_key: eventKey,
        invoice_id: invoiceId,
        event_type: 'payment.received',
        payload_json: payload,
        received_at: receivedAt,
        result: null,
      });
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith('update webhook_events set result = null')) {
      const row = this.webhookEvents.find(
        (event) => event.event_key === values[0] && event.result === 'retry',
      );
      if (!row) return { meta: { changes: 0 }, success: true };
      row.result = null;
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith('update webhook_events set processed_at')) {
      const row = this.webhookEvents.find(
        (event) => event.event_key === values[1],
      );
      if (!row) return { meta: { changes: 0 }, success: true };
      row.processed_at = values[0];
      row.result = sql.includes("result = 'retry'") ? 'retry' : 'checked';
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith('update orders set mayar_invoice_id')) {
      const order = this.orders.find(
        (row) => row.id === values[1] && row.status === 'checkout',
      );
      if (!order) return { meta: { changes: 0 }, success: true };
      order.mayar_invoice_id = String(values[0]);
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith("update orders set status = 'cancelled'")) {
      const order = this.orders.find(
        (row) => row.id === values[1] && row.status === 'checkout',
      );
      if (!order) return { meta: { changes: 0 }, success: true };
      order.status = 'cancelled';
      order.terminal_at = String(values[0]);
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith('update orders set mayar_checked_at')) {
      const order = this.orders.find(
        (row) => row.id === values[1] && row.status === 'checkout',
      );
      if (
        !order ||
        (order.mayar_checked_at && order.mayar_checked_at > String(values[2]))
      )
        return { meta: { changes: 0 }, success: true };
      order.mayar_checked_at = String(values[0]);
      return { meta: { changes: 1 }, success: true };
    }
    if (
      sql.startsWith("update orders set status = 'paid', pay_method = 'mayar'")
    ) {
      const order = this.orders.find(
        (row) =>
          row.id === values[1] &&
          row.status === 'checkout' &&
          row.price_idr === values[2],
      );
      if (!order) return { meta: { changes: 0 }, success: true };
      order.status = 'paid';
      order.pay_method = 'mayar';
      order.paid_at = String(values[0]);
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith("update orders set status = 'licensed'")) {
      const order = this.orders.find(
        (row) =>
          row.id === values[2] &&
          row.status === 'paid' &&
          this.licenses.some((license) => license.order_id === row.id),
      );
      if (!order) return { meta: { changes: 0 }, success: true };
      order.status = 'licensed';
      order.licensed_at ??= String(values[0]);
      order.terminal_at ??= String(values[1]);
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith("update orders set status = 'refunded'")) {
      const order = this.orders.find(
        (row) =>
          row.id === values[1] && ['paid', 'licensed'].includes(row.status),
      );
      if (!order) return { meta: { changes: 0 }, success: true };
      order.status = 'refunded';
      order.terminal_at = String(values[0]);
      return { meta: { changes: 1 }, success: true };
    }
    if (sql.startsWith('insert into orders')) {
      if (sql.includes("'checkout'")) {
        const [
          id,
          businessName,
          customerName,
          email,
          whatsapp,
          price,
          tokenHash,
          consentAt,
          createdAt,
        ] = values;
        this.orders.push({
          id: String(id),
          business_name: String(businessName),
          customer_name: String(customerName),
          email: String(email),
          whatsapp: String(whatsapp),
          product_type: null,
          status: 'checkout',
          price_idr: Number(price),
          pay_method: 'mayar',
          mayar_invoice_id: null,
          claim_token_hash: String(tokenHash),
          mayar_checked_at: null,
          paid_at: null,
          licensed_at: null,
          terminal_at: null,
          source: null,
          consent_at: String(consentAt),
          created_at: String(createdAt),
        });
        return { meta: { changes: 1 }, success: true };
      }
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
        mayar_checked_at: null,
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
    if (sql.startsWith('delete from licenses where order_id')) {
      const before = this.licenses.length;
      this.licenses = this.licenses.filter(
        (license) => license.order_id !== values[0],
      );
      return {
        meta: { changes: before - this.licenses.length },
        success: true,
      };
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
