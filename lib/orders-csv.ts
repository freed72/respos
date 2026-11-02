import { Order, OrderItem, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '@/types';

/**
 * Escapes a field for standard CSV RFC 4180 compliance.
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Exports orders to a clean, comprehensive CSV format.
 */
export function exportOrdersToCSV(orders: Order[]): string {
  const headers = [
    'Order Number',
    'Date & Time',
    'Dining Type',
    'Table',
    'Guest Name',
    'Guest Phone',
    'Cashier / Server',
    'Status',
    'Payment Status',
    'Payment Method',
    'Items Count',
    'Items Detail',
    'Subtotal (BDT)',
    'Discount (BDT)',
    'VAT (BDT)',
    'Service Charge (BDT)',
    'Tips (BDT)',
    'Total Amount (BDT)',
    'Points Earned',
    'Points Redeemed Value (BDT)',
    'Notes',
  ];

  const rows = orders.map((o) => {
    const itemsCount = (o.items || []).reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
    const itemsDetail = (o.items || [])
      .map((it) => {
        const mods = it.selectedModifiers && it.selectedModifiers.length > 0
          ? ` (+${it.selectedModifiers.map((m) => m.optionName).join(', ')})`
          : '';
        return `${it.productName}${mods} x${it.quantity} [৳${it.totalPrice}]`;
      })
      .join('; ');

    return [
      escapeCsvValue(o.orderNumber),
      escapeCsvValue(o.createdAt),
      escapeCsvValue(o.orderType),
      escapeCsvValue(o.tableNumber || ''),
      escapeCsvValue(o.customerName || ''),
      escapeCsvValue(o.customerPhone || ''),
      escapeCsvValue(o.serverName || ''),
      escapeCsvValue(o.status),
      escapeCsvValue(o.paymentStatus),
      escapeCsvValue(o.paymentMethod || 'CASH'),
      itemsCount,
      escapeCsvValue(itemsDetail),
      Number(o.subtotal) || 0,
      (Number(o.discountAmount) || 0) + (Number(o.pointsDiscountValue) || 0),
      Number(o.taxAmount) || 0,
      Number(o.serviceChargeAmount) || 0,
      Number(o.tipAmount) || 0,
      Number(o.totalAmount) || 0,
      Number(o.pointsEarned) || 0,
      Number(o.pointsDiscountValue) || 0,
      escapeCsvValue(o.notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers browser download of orders CSV.
 */
export function downloadOrdersCSV(orders: Order[], customFilename?: string): void {
  if (typeof window === 'undefined') return;

  const csv = exportOrdersToCSV(orders);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const filename = customFilename || `TRP_Sales_Records_${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Robust CSV Line Tokenizer that handles quotes, escaped quotes, commas, and newlines.
 */
function parseCsvGrid(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  let i = 0;

  const text = csvText.replace(/^\uFEFF/, ''); // Strip BOM

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentVal += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentVal.trim());
        currentVal = '';
        i++;
        continue;
      } else if (char === '\r' || char === '\n') {
        currentRow.push(currentVal.trim());
        currentVal = '';
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        if (char === '\r' && nextChar === '\n') {
          i += 2;
        } else {
          i++;
        }
        continue;
      } else {
        currentVal += char;
        i++;
        continue;
      }
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses numeric currency strings like "৳ 1,200.50", "$500", "1200" to clean number.
 */
function cleanNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

/**
 * Parses items detail column string like:
 * "Grand Shahi Mutton Kacchi x1 [৳1200]; Royal Firni x2 [৳500]"
 */
function parseItemsDetail(detailStr: string, orderTotal: number, subtotal: number): OrderItem[] {
  if (!detailStr || detailStr.trim() === '') {
    const total = subtotal || orderTotal || 0;
    return [
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: 'prod-general',
        productName: 'Food & Beverage Order',
        unitPrice: total,
        quantity: 1,
        totalPrice: total,
      },
    ];
  }

  const parts = detailStr.split(/;\s*/).filter(Boolean);
  const items: OrderItem[] = [];

  for (const part of parts) {
    // Regex matching: ProductName xQty [৳Price] or (৳Price)
    const match = part.match(/^(.*?)\s*x\s*(\d+)(?:\s*(?:\[|\()(?:৳|\$|BDT)?\s*([\d,.]+)(?:\]|\)))?$/i);
    if (match) {
      const productName = match[1].trim() || 'Menu Item';
      const quantity = parseInt(match[2], 10) || 1;
      const parsedTotal = cleanNumber(match[3], 0);
      const unitPrice = quantity > 0 && parsedTotal > 0 ? Math.round(parsedTotal / quantity) : parsedTotal;
      const totalPrice = parsedTotal > 0 ? parsedTotal : unitPrice * quantity;

      items.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: 'prod-general',
        productName,
        unitPrice,
        quantity,
        totalPrice,
      });
    } else {
      // Fallback: simple item name
      items.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productId: 'prod-general',
        productName: part.trim(),
        unitPrice: 0,
        quantity: 1,
        totalPrice: 0,
      });
    }
  }

  if (items.length === 0) {
    const total = subtotal || orderTotal || 0;
    items.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId: 'prod-general',
      productName: 'Food & Beverage Order',
      unitPrice: total,
      quantity: 1,
      totalPrice: total,
    });
  }

  return items;
}

/**
 * Parses uploaded CSV text and reconstructs valid Order objects.
 */
export function parseOrdersFromCSV(csvText: string): { orders: Order[]; error?: string } {
  try {
    const grid = parseCsvGrid(csvText);
    if (grid.length < 2) {
      return { orders: [], error: 'CSV file is empty or missing data rows.' };
    }

    const headerRow = grid[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Helper to find column index matching several name aliases
    const findCol = (...aliases: string[]): number => {
      for (const alias of aliases) {
        const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
        const idx = headerRow.findIndex((h) => h === cleanAlias || h.includes(cleanAlias));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const colOrderNumber = findCol('ordernumber', 'order_number', 'orderno', 'order', 'invoice');
    const colDate = findCol('datetime', 'date', 'createdat', 'created_at', 'timestamp');
    const colType = findCol('diningtype', 'ordertype', 'order_type', 'type');
    const colTable = findCol('table', 'tablenumber', 'table_number');
    const colGuestName = findCol('guestname', 'guest', 'customername', 'customer');
    const colGuestPhone = findCol('guestphone', 'phone', 'customerphone', 'mobile');
    const colServer = findCol('cashier', 'server', 'servername', 'staff');
    const colStatus = findCol('status', 'orderstatus', 'order_status');
    const colPaymentStatus = findCol('paymentstatus', 'payment_status');
    const colPaymentMethod = findCol('paymentmethod', 'payment_method', 'payment');
    const colItemsDetail = findCol('itemsdetail', 'items', 'dishes', 'detail');
    const colItemsCount = findCol('itemscount', 'count', 'quantity', 'qty');
    const colSubtotal = findCol('subtotalbdt', 'subtotal', 'sub_total');
    const colDiscount = findCol('discountbdt', 'discount', 'discountamount');
    const colVat = findCol('vatbdt', 'vat', 'tax', 'taxamount');
    const colServiceCharge = findCol('servicechargebdt', 'servicecharge', 'service_charge');
    const colTips = findCol('tipsbdt', 'tips', 'tipamount', 'gratuity');
    const colTotal = findCol('totalamountbdt', 'totalnetbdt', 'totalamount', 'totalnet', 'total', 'nettotal');
    const colPointsEarned = findCol('pointsearned', 'points_earned');
    const colPointsRedeemed = findCol('pointsredeemed', 'pointsredeemedvaluebdt');
    const colNotes = findCol('notes', 'note', 'specialinstructions');

    const orders: Order[] = [];

    for (let r = 1; r < grid.length; r++) {
      const row = grid[r];
      if (!row || row.length === 0 || row.every((c) => c === '')) continue;

      const getVal = (colIdx: number) => (colIdx >= 0 && colIdx < row.length ? row[colIdx] : '');

      let orderNumber = getVal(colOrderNumber);
      if (!orderNumber) {
        orderNumber = `TRP-RESTORE-${r + 1000}`;
      }
      // Strip outer '#' or quotes
      orderNumber = orderNumber.replace(/^#/, '').trim();

      const rawDate = getVal(colDate);
      let createdAt = new Date().toISOString();
      if (rawDate) {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          createdAt = parsedDate.toISOString();
        }
      }

      let orderType: OrderType = 'DINE_IN';
      const rawType = getVal(colType).toUpperCase().replace(/[\s-]/g, '_');
      if (rawType.includes('TAKE')) orderType = 'TAKEAWAY';
      else if (rawType.includes('DELIV')) orderType = 'DELIVERY';

      let status: OrderStatus = 'COMPLETED';
      const rawStatus = getVal(colStatus).toUpperCase();
      if (rawStatus.includes('PEND')) status = 'PENDING';
      else if (rawStatus.includes('PREP')) status = 'PREPARING';
      else if (rawStatus.includes('SERV')) status = 'SERVED';
      else if (rawStatus.includes('CANC')) status = 'CANCELLED';

      let paymentStatus: PaymentStatus = 'PAID';
      const rawPaymentStatus = getVal(colPaymentStatus).toUpperCase();
      if (rawPaymentStatus.includes('UNPAID') || rawPaymentStatus.includes('PEND')) {
        paymentStatus = 'UNPAID';
      }

      let paymentMethod: PaymentMethod = 'CASH';
      const rawPaymentMethod = getVal(colPaymentMethod).toUpperCase();
      if (rawPaymentMethod.includes('CARD') || rawPaymentMethod.includes('VISA') || rawPaymentMethod.includes('MASTER')) {
        paymentMethod = 'CARD';
      } else if (rawPaymentMethod.includes('BKASH')) {
        paymentMethod = 'BKASH';
      } else if (rawPaymentMethod.includes('NAGAD')) {
        paymentMethod = 'NAGAD';
      } else if (rawPaymentMethod.includes('SPLIT') || rawPaymentMethod.includes('MIXED')) {
        paymentMethod = 'SPLIT';
      }

      const subtotal = cleanNumber(getVal(colSubtotal), 0);
      const discount = cleanNumber(getVal(colDiscount), 0);
      const vat = cleanNumber(getVal(colVat), 0);
      const serviceCharge = cleanNumber(getVal(colServiceCharge), 0);
      const tips = cleanNumber(getVal(colTips), 0);
      let totalAmount = cleanNumber(getVal(colTotal), 0);

      if (totalAmount === 0 && subtotal > 0) {
        totalAmount = Math.max(0, subtotal - discount + vat + serviceCharge + tips);
      }

      const pointsEarned = cleanNumber(getVal(colPointsEarned), 0);
      const pointsDiscountValue = cleanNumber(getVal(colPointsRedeemed), 0);

      const itemsDetail = getVal(colItemsDetail);
      const itemsCount = parseInt(getVal(colItemsCount), 10) || 1;
      let items = parseItemsDetail(itemsDetail, totalAmount, subtotal);
      if (items.length === 1 && items[0].productName === 'Food & Beverage Order' && itemsCount > 1) {
        items[0].quantity = itemsCount;
      }

      const order: Order = {
        id: `ord-restored-${Date.now()}-${r}-${Math.random().toString(36).substring(2, 6)}`,
        orderNumber,
        orderType,
        tableNumber: getVal(colTable) || undefined,
        customerName: getVal(colGuestName) || undefined,
        customerPhone: getVal(colGuestPhone) || undefined,
        serverName: getVal(colServer) || 'Floor Staff',
        status,
        paymentStatus,
        paymentMethod,
        items,
        subtotal: subtotal || totalAmount,
        discountAmount: discount,
        taxAmount: vat,
        serviceChargeAmount: serviceCharge,
        tipAmount: tips,
        totalAmount: totalAmount || subtotal,
        pointsEarned,
        pointsRedeemed: Math.round(pointsDiscountValue) || 0,
        pointsDiscountValue,
        notes: getVal(colNotes) || undefined,
        createdAt,
        completedAt: status === 'COMPLETED' ? createdAt : undefined,
      };

      orders.push(order);
    }

    if (orders.length === 0) {
      return { orders: [], error: 'No valid order rows could be found in the CSV.' };
    }

    return { orders };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown CSV parse error';
    return { orders: [], error: `Failed to parse CSV: ${message}` };
  }
}
