'use client';

import { useState, useCallback, useEffect } from 'react';
import { Printer, Bluetooth, Loader2, CheckCircle2, XCircle, Wifi } from 'lucide-react';

// ─── ESC/POS Byte Helpers ─────────────────────────────────────────────────────
const ESC = 0x1b;
const GS  = 0x1d;

const CMD = {
  INIT:         [ESC, 0x40],
  ALIGN_LEFT:   [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT:  [ESC, 0x61, 0x02],
  BOLD_ON:      [ESC, 0x45, 0x01],
  BOLD_OFF:     [ESC, 0x45, 0x00],
  DOUBLE_ON:    [ESC, 0x21, 0x30],   // Double height + width
  DOUBLE_OFF:   [ESC, 0x21, 0x00],
  TALL_ON:      [ESC, 0x21, 0x10],   // Double height only
  TALL_OFF:     [ESC, 0x21, 0x00],
  FEED_3:       [ESC, 0x64, 0x03],
  FEED_2:       [ESC, 0x64, 0x02],
  CUT:          [GS,  0x56, 0x41, 0x10],
};

const COL = 48; // 80mm paper = 48 chars at normal size

function textToBytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}
function line(text: string): number[] {
  return [...textToBytes(text + '\n')];
}
function center(text: string, width = COL): number[] {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return line(' '.repeat(pad) + text);
}
function leftRight(left: string, right: string, width = COL): number[] {
  const gap = Math.max(1, width - left.length - right.length);
  return line(left + ' '.repeat(gap) + right);
}
function divider(char = '-', width = COL): number[] {
  return line(char.repeat(width));
}

// ─── Safe hotel name parser (handles JSON stored in DB name field) ────────────
function safeHotelName(raw: string | undefined): string {
  if (!raw) return 'Hotel';
  try {
    const parsed = JSON.parse(raw);
    return parsed?.name || raw;
  } catch {
    return raw;
  }
}

// ─── Receipt Builder ──────────────────────────────────────────────────────────
export interface ReceiptOrder {
  id: string;
  placed_at: string;
  status: string;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total: number;
  customer_note?: string | null;
  recipient_name?: string;
  phone?: string;
  address?: string;
  room?: string;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  hotel_name?: string;
}

function buildReceipt(order: ReceiptOrder): Uint8Array {
  const bytes: number[] = [];
  const push = (...args: number[][]) => args.forEach(a => bytes.push(...a));

  const hotelName = safeHotelName(order.hotel_name);
  const orderId = `#${order.id.split('-')[0].toUpperCase()}`;
  const dt = new Date(order.placed_at);

  push(CMD.INIT);

  // ── Header ──
  push(CMD.ALIGN_CENTER, CMD.DOUBLE_ON, CMD.BOLD_ON);
  push(line(hotelName));
  push(CMD.DOUBLE_OFF);
  push(line('RECEIPT / BILL'));
  push(CMD.BOLD_OFF);
  push(divider('='));

  // ── Order ID (big) ──
  push(CMD.ALIGN_CENTER, CMD.DOUBLE_ON, CMD.BOLD_ON);
  push(line(`ORDER ${orderId}`));
  push(CMD.DOUBLE_OFF, CMD.BOLD_OFF);
  push(CMD.ALIGN_LEFT);

  push(line(`Date  : ${dt.toLocaleDateString()}`));
  push(line(`Time  : ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`));
  push(divider());

  // ── Customer details (big/bold) ──
  if (order.recipient_name) {
    push(CMD.BOLD_ON);
    push(line(`Name  : ${order.recipient_name}`));
    push(CMD.BOLD_OFF);
  }
  if (order.phone) {
    push(CMD.BOLD_ON, CMD.TALL_ON);
    push(line(`Phone : ${order.phone}`));
    push(CMD.TALL_OFF, CMD.BOLD_OFF);
  }
  if (order.room) {
    push(CMD.BOLD_ON, CMD.TALL_ON);
    push(line(`Room  : ${order.room}`));
    push(CMD.TALL_OFF, CMD.BOLD_OFF);
  }
  if (order.address) {
    push(CMD.BOLD_ON, CMD.TALL_ON);
    push(line(`Addr  : ${order.address}`));
    push(CMD.TALL_OFF, CMD.BOLD_OFF);
  }

  push(divider('='));

  // ── Items ──
  push(CMD.BOLD_ON);
  push(leftRight('ITEM', 'AMOUNT'));
  push(CMD.BOLD_OFF);
  push(divider());

  for (const item of order.items) {
    const label    = `${item.quantity}x ${item.name}`;
    const priceStr = `LKR ${Number(item.total_price).toFixed(2)}`;

    if (label.length + priceStr.length + 2 > COL) {
      push(line(label));
      push(CMD.ALIGN_RIGHT);
      push(CMD.BOLD_ON);
      push(line(priceStr));
      push(CMD.BOLD_OFF);
      push(CMD.ALIGN_LEFT);
    } else {
      push(CMD.BOLD_ON);
      push(leftRight(label, priceStr));
      push(CMD.BOLD_OFF);
    }
    if (item.quantity > 1) {
      push(line(`    @ LKR ${Number(item.unit_price).toFixed(2)} each`));
    }
  }

  push(divider('='));

  // ── Totals ──
  if (Number(order.subtotal) !== Number(order.total)) {
    push(leftRight('Subtotal', `LKR ${Number(order.subtotal).toFixed(2)}`));
  }
  if (Number(order.tax) > 0) {
    push(leftRight('Tax', `LKR ${Number(order.tax).toFixed(2)}`));
  }
  if (Number(order.delivery_fee) > 0) {
    push(leftRight('Delivery Fee', `LKR ${Number(order.delivery_fee).toFixed(2)}`));
  }

  // TOTAL — double size bold
  push(CMD.DOUBLE_ON, CMD.BOLD_ON);
  push(leftRight('TOTAL', `LKR ${Number(order.total).toFixed(2)}`, 24));
  push(CMD.DOUBLE_OFF, CMD.BOLD_OFF);

  // ── Note ──
  if (order.customer_note) {
    push(divider());
    push(CMD.BOLD_ON);
    push(line('Customer Note:'));
    push(CMD.BOLD_OFF);
    push(line(order.customer_note));
  }

  push(divider('='));
  push(CMD.ALIGN_CENTER);
  push(CMD.BOLD_ON);
  push(line('Thank you for your order!'));
  push(CMD.BOLD_OFF);
  push(line('Please visit us again.'));
  push(CMD.FEED_3);
  push(CMD.CUT);

  return new Uint8Array(bytes);
}

// ─── Browser receipt HTML (80mm optimised) ───────────────────────────────────
function buildBrowserReceipt(order: ReceiptOrder, hotelNameRaw: string): string {
  const hotelName = safeHotelName(hotelNameRaw);
  const orderId   = order.id.split('-')[0].toUpperCase();
  const dt        = new Date(order.placed_at);

  const subtotalDiffers = Number(order.subtotal) !== Number(order.total);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Receipt ${orderId}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { margin:0; padding:0; box-sizing:border-box; }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #000;
      background: #fff;
      width: 72mm; /* ~80mm paper printable area */
      margin: 0 auto;
      padding: 10px 5px;
    }

    .center { text-align: center; }
    .bold { font-weight: bold; }
    .large { font-size: 18px; }
    .xlarge { font-size: 24px; }
    
    .divider {
      border: none;
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .divider-solid {
      border: none;
      border-top: 2px solid #000;
      margin: 8px 0;
    }

    /* ── Header ── */
    .hotel-name { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 4px; }
    .receipt-title { font-size: 14px; text-align: center; font-weight: bold; margin-bottom: 8px; }
    
    .order-id-box {
      background: #000;
      color: #fff;
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      padding: 6px 0;
      margin: 10px 0;
      letter-spacing: 1px;
    }

    /* ── Meta & Customer ── */
    .meta-row { display: flex; font-size: 13px; margin: 2px 0; }
    .meta-label { width: 50px; }
    
    .customer-box {
      border: 1px solid #000;
      padding: 6px;
      margin: 8px 0;
    }
    .cust-field { margin: 2px 0; display: flex; }
    .cust-label { width: 65px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .cust-value { flex: 1; font-weight: bold; font-size: 13px; }
    .cust-value.large { font-size: 15px; }

    /* ── Items ── */
    .items-header {
      display: flex; justify-content: space-between;
      font-size: 12px; font-weight: bold;
      margin-bottom: 4px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin: 6px 0;
    }
    .item-left { flex: 1; padding-right: 8px; }
    .item-qty { font-weight: bold; display: inline-block; width: 24px; }
    .item-name { font-weight: bold; }
    .item-unit { font-size: 11px; color: #333; margin-top: 2px; padding-left: 24px; }
    .item-price { font-weight: bold; font-size: 13px; }

    /* ── Totals ── */
    .totals-area { margin-top: 10px; }
    .total-line {
      display: flex; justify-content: space-between;
      font-size: 13px; margin: 4px 0;
    }
    .grand-total {
      display: flex; justify-content: space-between;
      align-items: center;
      background: #000;
      color: #fff;
      padding: 8px;
      margin-top: 8px;
    }
    .grand-label { font-size: 16px; font-weight: bold; }
    .grand-amount { font-size: 22px; font-weight: bold; }

    /* ── Footer ── */
    .note-box {
      margin-top: 10px;
      border: 1px dashed #000;
      padding: 6px;
      font-size: 12px;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      font-size: 13px;
      font-weight: bold;
    }

    @media print {
      html, body { width: 72mm; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <div class="hotel-name">${hotelName}</div>
  <div class="receipt-title">RECEIPT / BILL</div>
  
  <div class="divider-solid"></div>

  <div class="order-id-box">
    ORDER #${orderId}
  </div>

  <div class="meta-row"><div class="meta-label">Date:</div><div>${dt.toLocaleDateString()}</div></div>
  <div class="meta-row"><div class="meta-label">Time:</div><div>${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>

  ${(order.recipient_name || order.phone || order.room || order.address) ? `
  <div class="customer-box">
    ${order.recipient_name ? `
    <div class="cust-field">
      <div class="cust-label">NAME</div>
      <div class="cust-value">${order.recipient_name}</div>
    </div>` : ''}
    ${order.phone ? `
    <div class="cust-field">
      <div class="cust-label">PHONE</div>
      <div class="cust-value large">${order.phone}</div>
    </div>` : ''}
    ${order.room ? `
    <div class="cust-field">
      <div class="cust-label">ROOM</div>
      <div class="cust-value large">${order.room}</div>
    </div>` : ''}
    ${order.address ? `
    <div class="cust-field">
      <div class="cust-label">ADDRESS</div>
      <div class="cust-value large">${order.address}</div>
    </div>` : ''}
  </div>` : ''}

  <div class="divider"></div>

  <div class="items-header">
    <span>ITEM (QTY)</span>
    <span>AMOUNT</span>
  </div>
  
  <div class="divider"></div>

  ${order.items.map(item => `
  <div class="item-row">
    <div class="item-left">
      <span class="item-qty">${item.quantity}x</span>
      <span class="item-name">${item.name}</span>
      ${item.quantity > 1 ? `<div class="item-unit">@ LKR ${Number(item.unit_price).toFixed(2)}</div>` : ''}
    </div>
    <div class="item-price">LKR ${Number(item.total_price).toFixed(2)}</div>
  </div>`).join('')}

  <div class="divider-solid"></div>

  <div class="totals-area">
    ${subtotalDiffers ? `
    <div class="total-line">
      <span>Subtotal</span>
      <span>LKR ${Number(order.subtotal).toFixed(2)}</span>
    </div>` : ''}
    ${Number(order.tax) > 0 ? `
    <div class="total-line">
      <span>Tax</span>
      <span>LKR ${Number(order.tax).toFixed(2)}</span>
    </div>` : ''}
    ${Number(order.delivery_fee) > 0 ? `
    <div class="total-line">
      <span>Delivery Fee</span>
      <span>LKR ${Number(order.delivery_fee).toFixed(2)}</span>
    </div>` : ''}
    
    <div class="grand-total">
      <span class="grand-label">TOTAL</span>
      <span class="grand-amount">LKR ${Number(order.total).toFixed(2)}</span>
    </div>
  </div>

  ${order.customer_note ? `
  <div class="note-box">
    <strong>NOTE:</strong> ${order.customer_note}
  </div>` : ''}

  <div class="divider-solid"></div>
  
  <div class="footer">
    Thank you for your order!<br/>
    Please visit us again.
  </div>

</body>
</html>`;
}

// ─── Known BLE Printer Service UUIDs ─────────────────────────────────────────
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '00001101-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
];
const WRITE_CHARS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '000018f1-0000-1000-8000-00805f9b34fb',
  '00002a56-0000-1000-8000-00805f9b34fb',
];

// ─── Component ────────────────────────────────────────────────────────────────
interface PrintReceiptButtonProps {
  order: ReceiptOrder;
  hotelName?: string;
  variant?: 'icon' | 'full';
}
type PrintState = 'idle' | 'connecting' | 'printing' | 'done' | 'error';

export function PrintReceiptButton({ order, hotelName, variant = 'full' }: PrintReceiptButtonProps) {
  const [state, setState] = useState<PrintState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [method, setMethod] = useState<'bt' | 'browser' | null>(null);

  const resolvedHotel = hotelName || order.hotel_name || 'Hotel';

  // ── Bluetooth Print ──
  const printViaBluetooth = useCallback(async () => {
    setState('connecting');
    setErrorMsg('');

    const btOrder: ReceiptOrder = { ...order, hotel_name: resolvedHotel };
    const receipt = buildReceipt(btOrder);

    try {
      if (!('bluetooth' in navigator)) {
        throw new Error('Web Bluetooth not supported. Use Chrome or Edge browser.');
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      const server = await device.gatt.connect();
      let writeChar: any = null;

      for (const serviceUUID of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUUID);
          for (const charUUID of WRITE_CHARS) {
            try {
              const char = await service.getCharacteristic(charUUID);
              if (char.properties.write || char.properties.writeWithoutResponse) {
                writeChar = char;
                break;
              }
            } catch {}
          }
          if (!writeChar) {
            const chars = await service.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                writeChar = c;
                break;
              }
            }
          }
          if (writeChar) break;
        } catch {}
      }

      if (!writeChar) {
        throw new Error('No writable characteristic found. Try "Browser Print" instead.');
      }

      setState('printing');

      const CHUNK = 512;
      for (let i = 0; i < receipt.length; i += CHUNK) {
        const chunk = receipt.slice(i, i + CHUNK);
        if (writeChar.properties.writeWithoutResponse) {
          await writeChar.writeValueWithoutResponse(chunk);
        } else {
          await writeChar.writeValue(chunk);
        }
        await new Promise(r => setTimeout(r, 60));
      }

      await device.gatt.disconnect();
      setState('done');
      setMethod('bt');
      setTimeout(() => setState('idle'), 4000);
    } catch (err: any) {
      if (err?.name === 'NotFoundError') { setState('idle'); return; }
      setErrorMsg(err?.message || 'Bluetooth print failed');
      setState('error');
      setTimeout(() => setState('idle'), 6000);
    }
  }, [order, resolvedHotel]);

  // ── Browser Print ──
  const printViaBrowser = useCallback(() => {
    const html = buildBrowserReceipt({ ...order }, resolvedHotel);
    const win = window.open('', '_blank', 'width=380,height=700');
    if (!win) { alert('Please allow popups to print receipts.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
    setState('done');
    setMethod('browser');
    setTimeout(() => setState('idle'), 3000);
  }, [order, resolvedHotel]);

  const isBusy = state === 'connecting' || state === 'printing';
  const [btSupported, setBtSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'bluetooth' in navigator) {
      setBtSupported(true);
    }
  }, []);

  // ── Icon variant (desktop table) ──
  if (variant === 'icon') {
    return (
      <div className="flex gap-1 justify-end">
        <button
          onClick={printViaBluetooth}
          disabled={isBusy || !btSupported}
          title={btSupported ? 'Bluetooth Print' : 'Bluetooth not supported — use Browser Print'}
          className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all duration-200 flex items-center justify-center disabled:opacity-40"
        >
          {state === 'connecting' || state === 'printing'
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Bluetooth className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={printViaBrowser}
          disabled={isBusy}
          title="Browser / WiFi Print"
          className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:bg-slate-800 transition-all duration-200 flex items-center justify-center disabled:opacity-40"
        >
          {state === 'done' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Printer className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  // ── Full variant (mobile cards) ──
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={printViaBluetooth}
          disabled={isBusy || !btSupported}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state === 'connecting' ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
           : state === 'printing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Printing…</>
           : state === 'done' && method === 'bt' ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Printed!</>
           : <><Bluetooth className="w-4 h-4" /> Bluetooth Print</>}
        </button>

        <button
          onClick={printViaBrowser}
          disabled={isBusy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-slate-800/60 text-slate-300 border border-slate-700/60 hover:bg-slate-800 transition-all duration-200 disabled:opacity-40"
        >
          {state === 'done' && method === 'browser'
            ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sent!</>
            : <><Printer className="w-4 h-4" /> Browser Print</>}
        </button>
      </div>

      {state === 'error' && errorMsg && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-3 py-2 rounded-xl">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!btSupported && (
        <p className="text-[10px] text-slate-500 font-semibold">
          ⚠ Bluetooth Print needs Chrome or Edge. Use "Browser Print" for other browsers.
        </p>
      )}
    </div>
  );
}
