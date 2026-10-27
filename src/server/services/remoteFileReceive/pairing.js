/*
 * Copyright (C) 2026 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

// Persistent trust between a pendant and the desktops allowed to push files to
// it. A desktop earns a long-lived key by "claiming" either:
//   - a QR nonce the pendant scanned off the desktop's screen (pending pair), or
//   - the pendant's on-screen 6-digit code (manual fallback).
// Only a sha256 of each key is stored, so a leaked config file can't be used
// to impersonate a paired desktop.
import crypto from "crypto";

export const PENDING_PAIR_TTL_MS = 2 * 60 * 1000;
const CLAIM_WINDOW_MS = 60 * 1000;
const CLAIM_MAX_ATTEMPTS = 10;

const hashKey = (key) => crypto.createHash("sha256").update(key).digest();

const safeEqual = (a, b) => {
	const bufA = Buffer.from(String(a));
	const bufB = Buffer.from(String(b));
	return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

export class PairingStore {
	pendingPair = null;

	claimAttempts = new Map();

	// `store` is anything with configstore's get(key, default)/set(key, value).
	constructor(store, configKey) {
		this.store = store;
		this.configKey = configKey;
	}

	getDeviceId() {
		const key = `${this.configKey}.deviceId`;
		let id = this.store.get(key, null);
		if (!id) {
			id = crypto.randomUUID();
			this.store.set(key, id);
		}
		return id;
	}

	getTrusted() {
		return this.store.get(`${this.configKey}.trustedDesktops`, {});
	}

	setPendingPair({ nonce, desktopId, desktopName }, now = Date.now()) {
		if (!nonce || !desktopId) {
			return false;
		}
		this.pendingPair = {
			nonce: String(nonce),
			desktopId: String(desktopId),
			desktopName: String(desktopName || "Desktop"),
			expiresAt: now + PENDING_PAIR_TTL_MS,
		};
		return true;
	}

	getPendingPair(now = Date.now()) {
		if (this.pendingPair && this.pendingPair.expiresAt <= now) {
			this.pendingPair = null;
		}
		return this.pendingPair;
	}

	// Returns false once `ip` has used up its attempts for the current window.
	recordClaimAttempt(ip, now = Date.now()) {
		const entry = this.claimAttempts.get(ip);
		if (!entry || now - entry.start >= CLAIM_WINDOW_MS) {
			this.claimAttempts.set(ip, { start: now, count: 1 });
			return true;
		}
		entry.count += 1;
		return entry.count <= CLAIM_MAX_ATTEMPTS;
	}

	// Exchanges a QR nonce or the current 6-digit code for a long-lived key.
	// Returns { key, desktopId, desktopName } on success, null otherwise.
	claim({ nonce, code, desktopId, desktopName }, currentCode, now = Date.now()) {
		if (!desktopId) {
			return null;
		}

		let name = desktopName;
		const pending = this.getPendingPair(now);
		if (nonce) {
			if (
				!pending ||
				!safeEqual(pending.nonce, nonce) ||
				pending.desktopId !== String(desktopId)
			) {
				return null;
			}
			name = pending.desktopName;
			this.pendingPair = null;
		} else if (code) {
			if (!currentCode || !safeEqual(currentCode, code)) {
				return null;
			}
		} else {
			return null;
		}

		const key = crypto.randomBytes(32).toString("base64url");
		const trusted = this.getTrusted();
		trusted[desktopId] = {
			name: String(name || "Desktop"),
			keyHash: hashKey(key).toString("hex"),
			pairedAt: now,
		};
		this.store.set(`${this.configKey}.trustedDesktops`, trusted);

		return {
			key,
			desktopId: String(desktopId),
			desktopName: trusted[desktopId].name,
		};
	}

	verify(desktopId, key) {
		if (!desktopId || !key) {
			return false;
		}
		const entry = this.getTrusted()[desktopId];
		if (!entry) {
			return false;
		}
		const expected = Buffer.from(entry.keyHash, "hex");
		const actual = hashKey(key);
		return (
			expected.length === actual.length &&
			crypto.timingSafeEqual(expected, actual)
		);
	}

	listTrusted() {
		return Object.entries(this.getTrusted()).map(([id, entry]) => ({
			id,
			name: entry.name,
			pairedAt: entry.pairedAt,
		}));
	}

	forget(desktopId) {
		const trusted = this.getTrusted();
		if (!trusted[desktopId]) {
			return false;
		}
		delete trusted[desktopId];
		this.store.set(`${this.configKey}.trustedDesktops`, trusted);
		return true;
	}
}
