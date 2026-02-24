/* Web Wallet SDK - messageBus.js
 * Replaces chrome.runtime.sendMessage / chrome.runtime.onMessage
 * with an in-app event bus for web context.
 */

class MessageBus {
    constructor() {
        this.listeners = [];
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    sendMessage(message, responseCallback) {
        const sendResponse = responseCallback || (() => {});
        this.listeners.forEach(listener => {
            try {
                listener(message, {}, sendResponse);
            } catch (e) {
                console.error("MessageBus listener error:", e);
            }
        });
    }

    removeAllListeners() {
        this.listeners = [];
    }
}

const messageBus = new MessageBus();

export default messageBus;