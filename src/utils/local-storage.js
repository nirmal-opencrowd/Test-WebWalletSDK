/* global chrome */

export const _get = key => {
    return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get([key], result => {
                const err = checkForError();
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        } else if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const value = window.localStorage.getItem(key);
                resolve({ [key]: value ? JSON.parse(value) : undefined });
            } catch (e) {
                reject(e);
            }
        } else {
            reject(new Error('No storage available'));
        }
    });
};

export const _set = data => {
    return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set(data, () => {
                const err = checkForError();
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        } else if (typeof window !== 'undefined' && window.localStorage) {
            try {
                Object.keys(data).forEach(key => {
                    window.localStorage.setItem(key, JSON.stringify(data[key]));
                });
                resolve();
            } catch (e) {
                reject(e);
            }
        } else {
            reject(new Error('No storage available'));
        }
    });
};

export const _clear = () => {
    return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.clear(() => {
                const err = checkForError();
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        } else if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.clear();
                resolve();
            } catch (e) {
                reject(e);
            }
        } else {
            reject(new Error('No storage available'));
        }
    });
};

export const _remove = key => {
    return new Promise((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.remove([key], () => {
                const err = checkForError();
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        } else if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.removeItem(key);
                resolve();
            } catch (e) {
                reject(e);
            }
        } else {
            reject(new Error('No storage available'));
        }
    });
};

export const checkForError = () => {
    const lastError = chrome.runtime.lastError;
    if (!lastError) {
        return;
    }
    // if it quacks like an Error, its an Error
    if (lastError.stack && lastError.message) {
        return lastError;
    }
    // repair incomplete error object (eg chromium v77)
    return new Error(lastError.message);
};

class Favorites {
    getFavorites = async () => {
        return (await _get("_favorites"))._favorites || {};
    };
    setFavorites = async favorites => {
        return await _set({ _favorites: favorites });
    };
    upsertFavorite = async merchantData => {
        const favs = await this.getFavorites();
        favs[merchantData.organizationName] = merchantData;
        await this.setFavorites(favs);
        return merchantData;
    };
    removeFavorite = async organizationName => {
        const favs = await this.getFavorites();
        favs[organizationName] = undefined;
        delete favs[organizationName];
        return favs;
    };
    isFavorite = async organizationName => {
        return (await this.getFavorites())[organizationName] !== undefined;
    };
}
export const favorites = new Favorites();

class NewOffers {
    getNewOffers = async () => {
        return (await _get("_new_offers"))._new_offers || {};
    };
    setNewOffers = async newOffers => {
        const today = new Date();
        const tomorrow = new Date(today);
        return await _set({ _new_offers: {hasNewOffers: newOffers, expiry: tomorrow.setDate(tomorrow.getDate() + 1)}});
    };
}
export const newOffers = new NewOffers();
class Decrypted {
    get = async () => {
        const data =
            {
                ...(await _get("_decrypted"))._decrypted,
            } || {};
        return data;
    };
    set = async decrypted => {
        return await _set({ _decrypted: decrypted });
    };
    clear = async () => {
        return await _clear("_decrypted");
    };
    // contains = async (obj = {}) => {
    //     const self = await this.get();
    //     const search = val => {};
    // };
}

export const decrypted = new Decrypted();
class Dapps {
    getDapps = async () => {
        return (await _get("_dapps"))._dapps || {};
    };
    setDapps = async dapps => {
        return await _set({ _dapps: dapps });
    };
    clear = async () => {
        return await _set({ _dapps: {}});
    };
}
export const dapps = new Dapps();