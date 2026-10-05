# Digital Cash Drawer Integration Guide
## Restaurant: The Royal Palette (Next.js & POS)

This guide documents how the digital cash drawer is integrated with **The Royal Palette** POS web system.

---

### 1. How Restaurant Cash Drawers Work
Most commercial point-of-sale cash drawers (Epson, Star, POS-X, APG, Xprinter) do not have a built-in computer USB chip. Instead, they use a **24V solenoid release latch** connected via an **RJ11/RJ12 6-pin modular cable** plugged into the **"DK" (Drawer Kick)** port of an ESC/POS thermal receipt printer.

```
+--------------------------+       USB / Network LAN       +-------------------------+       RJ11/RJ12 24V Cable      +-----------------------+
|  Next.js Web POS App     | ----------------------------> | Thermal Receipt Printer | -----------------------------> |  Digital Cash Drawer  |
|  (Chrome / Edge Browser) |     ESC/POS Kick Pulse        | (Epson / Xprinter 80mm) |     Solenoid Energized (50ms)  |  (Spring Pops Open)   |
+--------------------------+                               +-------------------------+                                +-----------------------+
```

---

### 2. Standard ESC/POS Drawer Kick Byte Sequences

| Port / Solenoid Pin | Hex Bytes | Decimal Sequence | Description |
|---|---|---|---|
| **Drawer Pin 2 (Standard)** | `1B 70 00 19 FA` | `27, 112, 0, 25, 250` | Sends a 50ms ON / 500ms OFF 24V pulse to Pin 2 |
| **Drawer Pin 5 (Secondary)** | `1B 70 01 19 FA` | `27, 112, 1, 25, 250` | Sends a 50ms ON / 500ms OFF 24V pulse to Pin 5 |

---

### 3. Implementation Methods in Next.js

#### Method A: Direct Web Serial API (Zero Drivers, Direct Browser Access)
Supported in Google Chrome, Microsoft Edge, and Opera without installing any background software.

```typescript
import { DEFAULT_DRAWER_KICK_BYTES } from '@/lib/hardware/cashDrawer';

export async function openDrawerViaSerial() {
  if (!('serial' in navigator)) {
    alert('Web Serial API is not supported in this browser.');
    return;
  }
  
  // Prompts cashier to select the USB thermal printer once
  const port = await (navigator as any).serial.requestPort();
  await port.open({ baudRate: 9600 });
  
  const writer = port.writable.getWriter();
  await writer.write(DEFAULT_DRAWER_KICK_BYTES);
  writer.releaseLock();
  await port.close();
}
```

#### Method B: WebUSB API (For Direct USB POS Printers)
```typescript
export async function openDrawerViaUSB() {
  const device = await navigator.usb.requestDevice({
    filters: [{ vendorId: 0x04b8 }] // e.g. Epson Vendor ID
  });
  await device.open();
  await device.selectConfiguration(1);
  await device.claimInterface(0);
  await device.transferOut(1, new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]));
  await device.close();
}
```

#### Method C: Local Print Daemon / WebSocket Relay (High-Volume Multi-Counter Setup)
For busy counters where silent, instant printing without print dialogs is required:
1. Run a lightweight local service (e.g. QZ Tray or Node daemon) on `ws://localhost:8182`.
2. The Next.js POS sends:
```json
{
  "action": "PRINT_AND_KICK",
  "printer": "EPSON_TM_T82",
  "rawEscPos": "1B700019FA..."
}
```

---

### 4. Built-in Features in The Royal Palette System

1. **Auto-Kick on Cash Settlements**: When cashier selects "Cash" in the POS Settle Modal, the system triggers the drawer kick command automatically.
2. **Audio & Visual Solenoid Feedback**: Synthesizes a mechanical latch and bell sound (`playCashDrawerChime()`) via Web Audio API.
3. **Audit Trail**: Every drawer opening (cash sale vs manual cashier key override) is recorded with timestamp and order reference in `/admin` under **Hardware & Settings**.
4. **Manual Staff Override**: Accessible via the top navbar key button (`Open Cash Drawer`) from any screen.
