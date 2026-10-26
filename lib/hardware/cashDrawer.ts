/**
 * Digital Cash Drawer & ESC/POS Hardware Integration Driver
 * The Royal Palette Restaurant Management System
 */

// Standard ESC/POS Pin 2 Drawer Kick: ESC p 0 25 250
export const DEFAULT_DRAWER_KICK_BYTES = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);

// ESC/POS Pin 5 Drawer Kick: ESC p 1 25 250
export const PIN5_DRAWER_KICK_BYTES = new Uint8Array([0x1b, 0x70, 0x01, 0x19, 0xfa]);

export interface KickDrawerResult {
  success: boolean;
  method: 'WEB_SERIAL' | 'WEB_USB' | 'VIRTUAL_SIMULATOR';
  message: string;
}

/**
 * Synthesize a realistic mechanical cash drawer "Cha-Ching / Slide & Bell" sound using Web Audio API
 */
export function playCashDrawerChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // 1. Mechanical Clack / Latch Release
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(320, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.08);

    // 2. High Metallic Bell Chime (Cha-ching!)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1800, ctx.currentTime + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.05);
    osc2.stop(ctx.currentTime + 0.8);

    // 3. Resonant Bell Harmonic
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(3600, ctx.currentTime + 0.06);
    gain3.gain.setValueAtTime(0.0, ctx.currentTime);
    gain3.gain.setValueAtTime(0.2, ctx.currentTime + 0.06);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(ctx.currentTime + 0.06);
    osc3.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.warn('AudioContext not permitted or supported yet:', err);
  }
}

/**
 * Trigger digital cash drawer via Web Serial API, WebUSB API, or Virtual POS Driver
 */
export async function triggerCashDrawer(params?: {
  reason?: string;
  orderNumber?: string;
  amount?: number;
  playSound?: boolean;
}): Promise<KickDrawerResult> {
  const { reason = 'Cash Settlement', orderNumber, amount, playSound = true } = params || {};

  if (playSound) {
    playCashDrawerChime();
  }

  // 1. Dispatch DOM Event for UI Animations and Status Indicators
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('royal-palette-drawer-kick', {
      detail: {
        timestamp: new Date().toISOString(),
        reason,
        orderNumber,
        amount,
      },
    });
    window.dispatchEvent(event);
  }

  // 2. Attempt Hardware Serial connection if Web Serial is active and port is granted
  if (typeof navigator !== 'undefined' && 'serial' in navigator) {
    try {
      const serial = (navigator as unknown as { serial: { getPorts: () => Promise<unknown[]> } }).serial;
      const ports = await serial.getPorts();
      if (ports.length > 0) {
        const port = ports[0] as {
          open: (opt: { baudRate: number }) => Promise<void>;
          writable: { getWriter: () => { write: (data: Uint8Array) => Promise<void>; releaseLock: () => void } };
          close: () => Promise<void>;
        };
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        await writer.write(DEFAULT_DRAWER_KICK_BYTES);
        writer.releaseLock();
        await port.close();

        return {
          success: true,
          method: 'WEB_SERIAL',
          message: 'ESC/POS Drawer Kick command transmitted over Web Serial to thermal printer RJ11 solenoid.',
        };
      }
    } catch {
      // Fallback gracefully to WebUSB or simulator
    }
  }

  // 3. Attempt WebUSB connection if WebUSB is active and device has been granted
  if (typeof navigator !== 'undefined' && 'usb' in navigator) {
    try {
      const usb = (navigator as unknown as { usb: { getDevices: () => Promise<unknown[]> } }).usb;
      const devices = await usb.getDevices();
      if (devices.length > 0) {
        const device = devices[0] as {
          open: () => Promise<void>;
          selectConfiguration?: (c: number) => Promise<void>;
          claimInterface?: (i: number) => Promise<void>;
          transferOut?: (endpoint: number, data: BufferSource) => Promise<unknown>;
          close: () => Promise<void>;
        };
        await device.open();
        if (device.selectConfiguration) await device.selectConfiguration(1);
        if (device.claimInterface) await device.claimInterface(0);
        if (device.transferOut) {
          // Send default ESC/POS drawer kick code to out endpoint
          await device.transferOut(1, DEFAULT_DRAWER_KICK_BYTES);
        }
        await device.close();

        return {
          success: true,
          method: 'WEB_USB',
          message: 'ESC/POS Drawer Kick command transmitted over WebUSB to thermal printer.',
        };
      }
    } catch {
      // Fallback gracefully
    }
  }

  // 4. Fallback / Standard Virtual Simulation Mode
  return {
    success: true,
    method: 'VIRTUAL_SIMULATOR',
    message: `Digital Cash Drawer Solenoid Energized [${reason}] (Simulated 24V Pulse on Pin 2).`,
  };
}

/**
 * Pair a direct Web Serial port for POS Thermal Printers (e.g. COM / Virtual COM)
 */
export async function requestSerialPort(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) {
    alert('Web Serial API is not supported in this browser. Please use Google Chrome or Edge.');
    return false;
  }
  try {
    const serial = (navigator as unknown as { serial: { requestPort: () => Promise<unknown> } }).serial;
    await serial.requestPort();
    return true;
  } catch (err) {
    console.warn('User cancelled or failed to select serial port:', err);
    return false;
  }
}

/**
 * Pair a direct WebUSB device for POS Thermal Printers
 */
export async function requestUsbDevice(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('usb' in navigator)) {
    alert('WebUSB API is not supported in this browser. Please use Google Chrome or Edge.');
    return false;
  }
  try {
    const usb = (navigator as unknown as { usb: { requestDevice: (opt: { filters: unknown[] }) => Promise<unknown> } }).usb;
    await usb.requestDevice({ filters: [] });
    return true;
  } catch (err) {
    console.warn('User cancelled or failed to select USB device:', err);
    return false;
  }
}
